import Anthropic from '@anthropic-ai/sdk'

// The live site's /api/chat, a Vercel Function: the twin of the dev server's endpoint in
// vite.config.ts, for the Duet chat (src/app/duet-claude.ts) and the mock desktop chat.
// The key is ANTHROPIC_API_KEY in the Vercel project's environment variables, never in the app.
// Without it this answers 503 and the chats fall back to canned replies.
// It's public, so it only answers pages on our own domains and caps what a request can ask for.
const MODELS = new Set(['claude-sonnet-5-5', 'claude-opus-5-5', 'claude-haiku-5-5'])
const ORIGIN = /^(https:\/\/(([a-z0-9-]+\.)?whyspace\.app|whyspace-wireframe[a-z0-9-]*\.vercel\.app)|http:\/\/localhost(:\d+)?)$/
const MAX_CHARS = 60_000
const MAX_MESSAGES = 40

// Forgives the usual paste slips in the Vercel settings: spaces, quotes, or the whole `NAME=value` line.
const cleanKey = (raw?: string) => raw?.trim().replace(/^ANTHROPIC_API_KEY\s*=\s*/, '').replace(/^["']|["']$/g, '').trim() || undefined
// What a bad key looks like, without showing it.
const shape = (key: string) => `starts with "${key.slice(0, 7)}", ${key.length} characters`

export async function POST(request: Request) {
  const apiKey = cleanKey(process.env.ANTHROPIC_API_KEY)
  if (!apiKey) return new Response('ANTHROPIC_API_KEY is not set', { status: 503 })
  if (!ORIGIN.test(request.headers.get('origin') ?? '')) return new Response('Forbidden', { status: 403 })

  let body: { system?: unknown; messages?: unknown; model?: unknown }
  try { body = await request.json() } catch { return new Response('Bad request', { status: 400 }) }
  const { system, messages, model } = body
  const ok = typeof system === 'string' && Array.isArray(messages) && messages.length > 0 && messages.length <= MAX_MESSAGES
    && system.length + JSON.stringify(messages).length <= MAX_CHARS
  if (!ok) return new Response('Bad request', { status: 400 })

  const stream = new Anthropic({ apiKey }).messages.stream({
    model: typeof model === 'string' && MODELS.has(model) ? model : 'claude-haiku-5-5',
    max_tokens: 1024,
    system,
    messages: messages as Anthropic.MessageParam[],
  })
  const encoder = new TextEncoder()
  return new Response(new ReadableStream({
    async start(controller) {
      stream.on('text', (t) => controller.enqueue(encoder.encode(t)))
      try { await stream.finalMessage() } catch (err) {
        console.error('[chat]', err instanceof Anthropic.AuthenticationError ? `Anthropic rejected the key (${shape(apiKey)})` : err)
      }
      controller.close()
    },
    cancel() { stream.abort() },
  }), { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' } })
}
