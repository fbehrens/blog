/// <reference types="@cloudflare/vitest-pool-workers" />
import {
  env,
  createExecutionContext,
  waitOnExecutionContext,
  applyD1Migrations,
} from "cloudflare:test"
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from "vitest"
import worker from "./worker"

const MIGRATION = {
  name: "0001_subscribers",
  queries: [
    `CREATE TABLE IF NOT EXISTS subscribers (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      status TEXT NOT NULL,
      confirmation_token TEXT,
      unsubscribe_token TEXT,
      created_at TEXT NOT NULL
    )`,
  ],
}

beforeAll(async () => {
  await applyD1Migrations(env.DB, [MIGRATION])
})

beforeEach(async () => {
  await env.DB.prepare("DELETE FROM subscribers").run()
})

const TEST_SECRET = "test-secret"

function makeEnv(send = vi.fn().mockResolvedValue({ messageId: "msg-1" })) {
  return {
    DB: env.DB,
    ASSETS: null as unknown as Fetcher,
    EMAIL: { send },
    RESEND_API_KEY: "resend-key",
    NEWSLETTER_SECRET: TEST_SECRET,
  }
}

function post(body: unknown) {
  return new Request("https://www.aufb.de/api/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

describe("POST /api/subscribe", () => {
  it("returns 200 and creates a pending row for a valid email", async () => {
    const send = vi.fn().mockResolvedValue({ messageId: "msg-1" })
    const testEnv = makeEnv(send)
    const ctx = createExecutionContext()

    const res = await worker.fetch(post({ email: "test@example.com" }), testEnv, ctx)
    await waitOnExecutionContext(ctx)

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
    expect(send).toHaveBeenCalledOnce()

    const row = await env.DB.prepare(
      "SELECT status FROM subscribers WHERE email = ?"
    )
      .bind("test@example.com")
      .first<{ status: string }>()
    expect(row?.status).toBe("pending")
  })

  it("returns 422 for an invalid email", async () => {
    const testEnv = makeEnv()
    const ctx = createExecutionContext()

    const res = await worker.fetch(post({ email: "not-an-email" }), testEnv, ctx)
    await waitOnExecutionContext(ctx)

    expect(res.status).toBe(422)
    expect(testEnv.EMAIL.send).not.toHaveBeenCalled()
  })

  it("returns 422 for a missing email field", async () => {
    const testEnv = makeEnv()
    const ctx = createExecutionContext()

    const res = await worker.fetch(post({}), testEnv, ctx)
    await waitOnExecutionContext(ctx)

    expect(res.status).toBe(422)
  })

  it("re-sends confirmation and returns 200 for a duplicate pending email", async () => {
    const send = vi.fn().mockResolvedValue({ messageId: "msg-1" })
    const testEnv = makeEnv(send)
    const ctx1 = createExecutionContext()

    await worker.fetch(post({ email: "test@example.com" }), testEnv, ctx1)
    await waitOnExecutionContext(ctx1)

    expect(send).toHaveBeenCalledTimes(1)
    const firstArgs = send.mock.calls[0][0]
    const ctx2 = createExecutionContext()
    const res = await worker.fetch(post({ email: "test@example.com" }), testEnv, ctx2)
    await waitOnExecutionContext(ctx2)

    expect(res.status).toBe(200)
    expect(send).toHaveBeenCalledTimes(2)
    // same confirmation link re-sent
    const firstToken = firstArgs.text.match(/token=([a-f0-9-]+)/)?.[1]
    expect(send.mock.calls[1][0].text).toContain(`token=${firstToken}`)

    const count = await env.DB.prepare(
      "SELECT COUNT(*) as n FROM subscribers WHERE email = ?"
    )
      .bind("test@example.com")
      .first<{ n: number }>()
    expect(count?.n).toBe(1)
  })

  it("returns 200 without sending for an already confirmed email", async () => {
    const send = vi.fn().mockResolvedValue({ messageId: "msg-1" })
    const testEnv = makeEnv(send)

    await env.DB.prepare(
      "INSERT INTO subscribers (id, email, status, confirmation_token, unsubscribe_token, created_at) VALUES (?, ?, 'confirmed', NULL, ?, ?)"
    )
      .bind(crypto.randomUUID(), "confirmed@example.com", crypto.randomUUID(), new Date().toISOString())
      .run()

    const ctx = createExecutionContext()
    const res = await worker.fetch(post({ email: "confirmed@example.com" }), testEnv, ctx)
    await waitOnExecutionContext(ctx)

    expect(res.status).toBe(200)
    expect(send).not.toHaveBeenCalled()
  })
})

describe("GET /api/confirm", () => {
  it("returns 200 and sets status to confirmed for a valid token", async () => {
    const token = crypto.randomUUID()
    await env.DB.prepare(
      "INSERT INTO subscribers (id, email, status, confirmation_token, unsubscribe_token, created_at) VALUES (?, ?, 'pending', ?, ?, ?)"
    )
      .bind(crypto.randomUUID(), "user@example.com", token, crypto.randomUUID(), new Date().toISOString())
      .run()

    const testEnv = makeEnv()
    const ctx = createExecutionContext()
    const res = await worker.fetch(
      new Request(`https://www.aufb.de/api/confirm?token=${token}`),
      testEnv,
      ctx
    )
    await waitOnExecutionContext(ctx)

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })

    const row = await env.DB.prepare(
      "SELECT status, confirmation_token FROM subscribers WHERE email = ?"
    )
      .bind("user@example.com")
      .first<{ status: string; confirmation_token: string | null }>()
    expect(row?.status).toBe("confirmed")
    expect(row?.confirmation_token).toBeNull()
  })

  it("returns 404 for an unknown token", async () => {
    const testEnv = makeEnv()
    const ctx = createExecutionContext()
    const res = await worker.fetch(
      new Request(`https://www.aufb.de/api/confirm?token=${crypto.randomUUID()}`),
      testEnv,
      ctx
    )
    await waitOnExecutionContext(ctx)

    expect(res.status).toBe(404)
  })

  it("returns 404 when no token is provided", async () => {
    const testEnv = makeEnv()
    const ctx = createExecutionContext()
    const res = await worker.fetch(
      new Request("https://www.aufb.de/api/confirm"),
      testEnv,
      ctx
    )
    await waitOnExecutionContext(ctx)

    expect(res.status).toBe(404)
  })
})

describe("GET /api/unsubscribe", () => {
  it("returns 200 and sets status to unsubscribed for a valid token", async () => {
    const unsubToken = crypto.randomUUID()
    await env.DB.prepare(
      "INSERT INTO subscribers (id, email, status, confirmation_token, unsubscribe_token, created_at) VALUES (?, ?, 'confirmed', NULL, ?, ?)"
    )
      .bind(crypto.randomUUID(), "user@example.com", unsubToken, new Date().toISOString())
      .run()

    const testEnv = makeEnv()
    const ctx = createExecutionContext()
    const res = await worker.fetch(
      new Request(`https://www.aufb.de/api/unsubscribe?token=${unsubToken}`),
      testEnv,
      ctx
    )
    await waitOnExecutionContext(ctx)

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })

    const row = await env.DB.prepare(
      "SELECT status FROM subscribers WHERE unsubscribe_token = ?"
    )
      .bind(unsubToken)
      .first<{ status: string }>()
    expect(row?.status).toBe("unsubscribed")
  })

  it("returns 404 for an unknown token", async () => {
    const testEnv = makeEnv()
    const ctx = createExecutionContext()
    const res = await worker.fetch(
      new Request(`https://www.aufb.de/api/unsubscribe?token=${crypto.randomUUID()}`),
      testEnv,
      ctx
    )
    await waitOnExecutionContext(ctx)

    expect(res.status).toBe(404)
  })

  it("returns 200 for an already unsubscribed token (idempotent)", async () => {
    const unsubToken = crypto.randomUUID()
    await env.DB.prepare(
      "INSERT INTO subscribers (id, email, status, confirmation_token, unsubscribe_token, created_at) VALUES (?, ?, 'unsubscribed', NULL, ?, ?)"
    )
      .bind(crypto.randomUUID(), "gone@example.com", unsubToken, new Date().toISOString())
      .run()

    const testEnv = makeEnv()
    const ctx = createExecutionContext()
    const res = await worker.fetch(
      new Request(`https://www.aufb.de/api/unsubscribe?token=${unsubToken}`),
      testEnv,
      ctx
    )
    await waitOnExecutionContext(ctx)

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
  })
})

describe("GET /api/subscribers", () => {
  function subscribersReq(secret = TEST_SECRET) {
    return new Request("https://www.aufb.de/api/subscribers", {
      headers: { Authorization: `Bearer ${secret}` },
    })
  }

  it("returns 401 without the correct secret", async () => {
    const testEnv = makeEnv()
    const ctx = createExecutionContext()
    const res = await worker.fetch(subscribersReq("wrong"), testEnv, ctx)
    await waitOnExecutionContext(ctx)

    expect(res.status).toBe(401)
  })

  it("returns confirmed subscribers only", async () => {
    await env.DB.prepare(
      "INSERT INTO subscribers (id, email, status, confirmation_token, unsubscribe_token, created_at) VALUES (?, ?, 'confirmed', NULL, ?, ?), (?, ?, 'pending', ?, ?, ?), (?, ?, 'unsubscribed', NULL, ?, ?)"
    )
      .bind(
        crypto.randomUUID(), "confirmed@example.com", crypto.randomUUID(), "2024-01-01T00:00:00.000Z",
        crypto.randomUUID(), "pending@example.com", crypto.randomUUID(), crypto.randomUUID(), "2024-01-02T00:00:00.000Z",
        crypto.randomUUID(), "gone@example.com", crypto.randomUUID(), "2024-01-03T00:00:00.000Z",
      )
      .run()

    const testEnv = makeEnv()
    const ctx = createExecutionContext()
    const res = await worker.fetch(subscribersReq(), testEnv, ctx)
    await waitOnExecutionContext(ctx)

    expect(res.status).toBe(200)
    const body = await res.json() as { count: number; subscribers: { email: string; created_at: string }[] }
    expect(body.count).toBe(1)
    expect(body.subscribers).toHaveLength(1)
    expect(body.subscribers[0].email).toBe("confirmed@example.com")
  })
})

describe("POST /api/send-newsletter", () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ id: "email-id" }), { status: 200 })
    )
  })

  afterEach(() => {
    fetchSpy.mockRestore()
  })

  function newsletterReq(body: unknown, secret = TEST_SECRET) {
    return new Request("https://www.aufb.de/api/send-newsletter", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify(body),
    })
  }

  it("returns 401 without the correct secret", async () => {
    const testEnv = makeEnv()
    const ctx = createExecutionContext()
    const res = await worker.fetch(newsletterReq({ title: "T", excerpt: "E", url: "U" }, "wrong"), testEnv, ctx)
    await waitOnExecutionContext(ctx)

    expect(res.status).toBe(401)
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it("returns 200 with sent count and calls Resend for each confirmed subscriber", async () => {
    const unsub1 = crypto.randomUUID()
    const unsub2 = crypto.randomUUID()
    await env.DB.prepare(
      "INSERT INTO subscribers (id, email, status, confirmation_token, unsubscribe_token, created_at) VALUES (?, ?, 'confirmed', NULL, ?, ?), (?, ?, 'confirmed', NULL, ?, ?), (?, ?, 'pending', ?, ?, ?)"
    )
      .bind(
        crypto.randomUUID(), "a@example.com", unsub1, new Date().toISOString(),
        crypto.randomUUID(), "b@example.com", unsub2, new Date().toISOString(),
        crypto.randomUUID(), "c@example.com", crypto.randomUUID(), crypto.randomUUID(), new Date().toISOString(),
      )
      .run()

    const testEnv = makeEnv()
    const ctx = createExecutionContext()
    const res = await worker.fetch(
      newsletterReq({ title: "My Post", excerpt: "Summary", url: "https://www.aufb.de/posts/my-post" }),
      testEnv,
      ctx
    )
    await waitOnExecutionContext(ctx)

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ sent: 2 })
    expect(fetchSpy).toHaveBeenCalledTimes(2)

    const calls = fetchSpy.mock.calls
    const recipients = calls.map((c) => JSON.parse(c[1]!.body as string).to)
    expect(recipients).toContain("a@example.com")
    expect(recipients).toContain("b@example.com")

    const firstBody = JSON.parse(calls[0][1]!.body as string)
    expect(firstBody.subject).toBe("My Post")
    expect(firstBody.from).toBe("newsletter@aufb.de")
    expect(firstBody.html).toContain("My Post")
    expect(firstBody.html).toContain("Summary")
    expect(firstBody.html).toContain("https://www.aufb.de/posts/my-post")
    expect(firstBody.html).toContain("Unsubscribe")
  })
})
