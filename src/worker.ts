interface SendEmail {
  send(req: {
    to: string | string[]
    from: { email: string; name?: string }
    subject: string
    text?: string
    html?: string
    headers?: Record<string, string>
  }): Promise<{ messageId: string }>
}

interface Env {
  ASSETS: Fetcher
  DB: D1Database
  EMAIL: SendEmail
  RESEND_API_KEY: string
  NEWSLETTER_SECRET: string
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

async function handleSubscribe(request: Request, env: Env): Promise<Response> {
  let body: { email?: unknown }
  try {
    body = await request.json()
  } catch {
    return json({ error: "Invalid JSON" }, 422)
  }

  const email = typeof body?.email === "string" ? body.email.trim() : ""
  if (!isValidEmail(email)) {
    return json({ error: "Invalid email" }, 422)
  }

  const existing = await env.DB.prepare(
    "SELECT status, confirmation_token FROM subscribers WHERE email = ?"
  )
    .bind(email)
    .first<{ status: string; confirmation_token: string | null }>()

  if (existing?.status === "confirmed") {
    return json({ ok: true })
  }

  let token: string
  if (existing?.status === "pending") {
    token = existing.confirmation_token!
  } else {
    token = crypto.randomUUID()
    await env.DB.prepare(
      "INSERT INTO subscribers (id, email, status, confirmation_token, unsubscribe_token, created_at) VALUES (?, ?, 'pending', ?, ?, ?)"
    )
      .bind(
        crypto.randomUUID(),
        email,
        token,
        crypto.randomUUID(),
        new Date().toISOString()
      )
      .run()
  }

  const confirmUrl = `https://www.aufb.de/api/confirm?token=${token}`
  await env.EMAIL.send({
    to: email,
    from: { email: "newsletter@aufb.de", name: "aufb.de" },
    subject: "Confirm your subscription to aufb.de",
    text: `Hello,\n\nYou signed up to receive new posts from aufb.de. Click the link below to confirm:\n\n${confirmUrl}\n\nIf you didn't sign up, you can safely ignore this email.`,
    html: `<p>Hello,</p><p>You signed up to receive new posts from <a href="https://www.aufb.de">aufb.de</a>. Click the link below to confirm your subscription:</p><p><a href="${confirmUrl}">Confirm subscription</a></p><p>If you didn't sign up, you can safely ignore this email.</p>`,
    headers: {
      "List-Unsubscribe": `<${confirmUrl}>`,
    },
  })

  return json({ ok: true })
}

async function handleUnsubscribe(url: URL, env: Env): Promise<Response> {
  const token = url.searchParams.get("token")
  if (!token) {
    return json({ error: "Not Found" }, 404)
  }

  const row = await env.DB.prepare(
    "SELECT status FROM subscribers WHERE unsubscribe_token = ?"
  )
    .bind(token)
    .first<{ status: string }>()

  if (!row) {
    return json({ error: "Not Found" }, 404)
  }

  if (row.status !== "unsubscribed") {
    await env.DB.prepare(
      "UPDATE subscribers SET status = 'unsubscribed' WHERE unsubscribe_token = ?"
    )
      .bind(token)
      .run()
  }

  return json({ ok: true })
}

async function handleConfirm(url: URL, env: Env): Promise<Response> {
  const token = url.searchParams.get("token")
  if (!token) {
    return json({ error: "Not Found" }, 404)
  }

  const result = await env.DB.prepare(
    "UPDATE subscribers SET status = 'confirmed', confirmation_token = NULL WHERE confirmation_token = ? AND status = 'pending'"
  )
    .bind(token)
    .run()

  if (result.meta.changes === 0) {
    return json({ error: "Not Found" }, 404)
  }

  return json({ ok: true })
}

async function handleGetSubscribers(request: Request, env: Env): Promise<Response> {
  const auth = request.headers.get("Authorization") ?? ""
  if (auth !== `Bearer ${env.NEWSLETTER_SECRET}`) {
    return json({ error: "Unauthorized" }, 401)
  }

  const rows = await env.DB.prepare(
    "SELECT email, created_at FROM subscribers WHERE status = 'confirmed'"
  ).all<{ email: string; created_at: string }>()

  return json({ count: rows.results.length, subscribers: rows.results })
}

async function handleSendNewsletter(request: Request, env: Env): Promise<Response> {
  const auth = request.headers.get("Authorization") ?? ""
  if (auth !== `Bearer ${env.NEWSLETTER_SECRET}`) {
    return json({ error: "Unauthorized" }, 401)
  }

  let body: { title?: unknown; excerpt?: unknown; url?: unknown }
  try {
    body = await request.json()
  } catch {
    return json({ error: "Invalid JSON" }, 422)
  }

  const { title, excerpt, url } = body
  if (typeof title !== "string" || typeof excerpt !== "string" || typeof url !== "string") {
    return json({ error: "Missing fields" }, 422)
  }

  const rows = await env.DB.prepare(
    "SELECT email, unsubscribe_token FROM subscribers WHERE status = 'confirmed'"
  ).all<{ email: string; unsubscribe_token: string }>()

  let sent = 0
  for (const { email, unsubscribe_token } of rows.results) {
    const unsubUrl = `https://www.aufb.de/api/unsubscribe?token=${unsubscribe_token}`
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "newsletter@aufb.de",
        to: email,
        subject: title,
        html: `<h1>${title}</h1><p>${excerpt}</p><p><a href="${url}">Read on aufb.de →</a></p><hr><p style="font-size:12px"><a href="${unsubUrl}">Unsubscribe</a></p>`,
        text: `${title}\n\n${excerpt}\n\nRead on aufb.de → ${url}\n\nUnsubscribe: ${unsubUrl}`,
      }),
    })
    sent++
  }

  return json({ sent })
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    if (url.pathname === "/api/subscribe" && request.method === "POST") {
      return handleSubscribe(request, env)
    }

    if (url.pathname === "/api/confirm" && request.method === "GET") {
      return handleConfirm(url, env)
    }

    if (url.pathname === "/api/unsubscribe" && request.method === "GET") {
      return handleUnsubscribe(url, env)
    }

    if (url.pathname === "/api/subscribers" && request.method === "GET") {
      return handleGetSubscribers(request, env)
    }

    if (url.pathname === "/api/send-newsletter" && request.method === "POST") {
      return handleSendNewsletter(request, env)
    }

    if (url.pathname.startsWith("/api/")) {
      return json({ error: "Not Found" }, 404)
    }

    return env.ASSETS.fetch(request)
  },
} satisfies ExportedHandler<Env>
