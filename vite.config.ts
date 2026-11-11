import path from 'node:path'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import Anthropic from '@anthropic-ai/sdk'
import { defineConfig, loadEnv, type Plugin } from 'vite'

// Dev-only endpoint for the mock desktop's chat (src/screens/mock-desktop.tsx) and the Duet chat
// (src/app/duet-claude.ts). The key stays on the dev server: put ANTHROPIC_API_KEY in .env.local
// (gitignored). Without a key it answers 503 and the chats fall back to canned replies.
// The Duet asks for Sonnet; the mock desktop sends no model and gets Haiku.
const MODELS = new Set(['claude-sonnet-5-5', 'claude-opus-5-5', 'claude-haiku-5-5'])
function claudeChat(apiKey: string | undefined): Plugin {
  return {
    name: 'mock-desktop-claude-chat',
    configureServer(server) {
      server.middlewares.use('/api/chat', async (req, res) => {
        if (req.method !== 'POST') { res.statusCode = 405; res.end(); return }
        if (!apiKey) { res.statusCode = 503; res.end('ANTHROPIC_API_KEY is not set'); return }
        let raw = ''
        for await (const chunk of req) raw += chunk
        const { system, messages, model } = JSON.parse(raw) as { system: string; messages: Anthropic.MessageParam[]; model?: string }
        const client = new Anthropic({ apiKey })
        res.setHeader('Content-Type', 'text/plain; charset=utf-8')
        try {
          const stream = client.messages.stream({
            model: model && MODELS.has(model) ? model : 'claude-haiku-5-5',
            max_tokens: 1024,
            system,
            messages,
          })
          stream.on('text', (t) => res.write(t))
          await stream.finalMessage()
        } catch (err) {
          console.error('[mock chat]', err)
          if (!res.headersSent) res.statusCode = 502
        }
        res.end()
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [
      react(),
      babel({ presets: [reactCompilerPreset()] }),
      tailwindcss(),
      claudeChat(env.ANTHROPIC_API_KEY),
    ],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, './src'),
      },
    },
  }
})
