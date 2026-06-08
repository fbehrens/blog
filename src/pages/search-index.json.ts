import { getCollection } from 'astro:content';

export async function GET() {
  const posts = await getCollection('posts', ({ data }) => !data.draft);
  const data = posts.map(post => ({
    slug: post.id,
    body: (post.body ?? '').replace(/[#*`\[\]()_~>!]/g, ' ').replace(/\s+/g, ' ').trim(),
  }));
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
  });
}
