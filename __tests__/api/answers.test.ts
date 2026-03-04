import { vi, describe, it, expect, beforeEach } from 'vitest'

// Mocks must be declared before the module under test is imported.
// vi.mock calls are hoisted automatically by Vitest.

vi.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      body,
    }),
  },
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

import { POST } from '@/app/api/answers/route'
import { createClient } from '@/lib/supabase/server'

const mockedCreateClient = vi.mocked(createClient)

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns a fluent chain object where every chainable method returns itself,
 * and `.maybeSingle()` / `.single()` resolve to `{ data, error }`.
 * Covers all query patterns used in the answers route.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeChain(data: unknown, error: unknown = null): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chain: any = {}
  for (const m of ['select', 'eq', 'is', 'insert', 'update']) {
    chain[m] = () => chain
  }
  chain.maybeSingle = () => Promise.resolve({ data, error })
  chain.single = () => Promise.resolve({ data, error })
  return chain
}

interface TableResult {
  data: unknown
  error: unknown
}

interface MockSupabaseOptions {
  user?: unknown
  authError?: unknown
  profiles?: TableResult
  prompts?: TableResult
  sessions?: TableResult
  answers?: TableResult
}

function makeMockSupabase({
  user = { id: 'user-1' },
  authError = null,
  profiles = { data: { role: 'student' }, error: null },
  prompts = {
    data: { prompt_id: 1, session_id: 10, kind: 'mcq', is_open: true },
    error: null,
  },
  sessions = {
    data: { session_id: 10, status: 'live', current_prompt: 1 },
    error: null,
  },
  answers = { data: { answer_id: 100, created_at: '2024-01-01' }, error: null },
}: MockSupabaseOptions = {}) {
  return {
    auth: {
      getUser: async () => ({ data: { user }, error: authError }),
    },
    from: (table: string) => {
      switch (table) {
        case 'profiles':
          return makeChain(profiles.data, profiles.error)
        case 'prompts':
          return makeChain(prompts.data, prompts.error)
        case 'sessions':
          return makeChain(sessions.data, sessions.error)
        case 'answers':
          return makeChain(answers.data, answers.error)
        default:
          return makeChain(null)
      }
    },
  }
}

function makeRequest(body: unknown): Request {
  return { json: async () => body } as unknown as Request
}

function makeBadRequest(): Request {
  return {
    json: async () => {
      throw new SyntaxError('Unexpected token')
    },
  } as unknown as Request
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('POST /api/answers', () => {
  beforeEach(() => {
    // Default: authenticated student, valid prompt/session, mcq open
    mockedCreateClient.mockResolvedValue(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      makeMockSupabase() as any,
    )
  })

  it('1 — returns 400 for invalid JSON body', async () => {
    const res = await POST(makeBadRequest())
    expect(res.status).toBe(400)
    expect(res.body).toEqual({ error: 'Invalid request body.' })
  })

  it('2 — returns 400 when prompt_id is missing', async () => {
    const res = await POST(makeRequest({ text_answer: 'hello' }))
    expect(res.status).toBe(400)
    expect(res.body).toEqual({ error: 'prompt_id is required.' })
  })

  it('3 — returns 401 when unauthenticated', async () => {
    mockedCreateClient.mockResolvedValue(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      makeMockSupabase({ user: null }) as any,
    )
    const res = await POST(makeRequest({ prompt_id: 1 }))
    expect(res.status).toBe(401)
    expect(res.body).toEqual({ error: 'Unauthorized' })
  })

  it('4 — returns 500 when profile fetch fails', async () => {
    mockedCreateClient.mockResolvedValue(
      makeMockSupabase({
        profiles: { data: null, error: { message: 'db error' } },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }) as any,
    )
    const res = await POST(makeRequest({ prompt_id: 1 }))
    expect(res.status).toBe(500)
    expect(res.body).toEqual({ error: 'Unable to verify your profile right now.' })
  })

  it('5 — returns 403 when user is a teacher', async () => {
    mockedCreateClient.mockResolvedValue(
      makeMockSupabase({
        profiles: { data: { role: 'teacher' }, error: null },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }) as any,
    )
    const res = await POST(makeRequest({ prompt_id: 1 }))
    expect(res.status).toBe(403)
    expect(res.body).toEqual({ error: 'Only students can submit answers.' })
  })

  it('6 — returns 500 when prompt fetch fails', async () => {
    mockedCreateClient.mockResolvedValue(
      makeMockSupabase({
        prompts: { data: null, error: { message: 'db error' } },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }) as any,
    )
    const res = await POST(makeRequest({ prompt_id: 1 }))
    expect(res.status).toBe(500)
    expect(res.body).toEqual({ error: 'Unable to find that prompt.' })
  })

  it('7 — returns 404 when prompt is not found', async () => {
    mockedCreateClient.mockResolvedValue(
      makeMockSupabase({
        prompts: { data: null, error: null },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }) as any,
    )
    const res = await POST(makeRequest({ prompt_id: 1 }))
    expect(res.status).toBe(404)
    expect(res.body).toEqual({ error: 'That prompt was not found.' })
  })

  it('8 — returns 403 when session is not live', async () => {
    mockedCreateClient.mockResolvedValue(
      makeMockSupabase({
        sessions: {
          data: { session_id: 10, status: 'ended', current_prompt: 1 },
          error: null,
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }) as any,
    )
    const res = await POST(makeRequest({ prompt_id: 1 }))
    expect(res.status).toBe(403)
    expect(res.body).toEqual({ error: 'That session is not live.' })
  })

  it('9 — returns 403 when prompt is not currently active', async () => {
    mockedCreateClient.mockResolvedValue(
      makeMockSupabase({
        sessions: {
          data: { session_id: 10, status: 'live', current_prompt: 99 },
          error: null,
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }) as any,
    )
    const res = await POST(makeRequest({ prompt_id: 1 }))
    expect(res.status).toBe(403)
    expect(res.body).toEqual({ error: 'That prompt is not currently active.' })
  })

  it('10 — returns 403 when prompt is closed', async () => {
    mockedCreateClient.mockResolvedValue(
      makeMockSupabase({
        prompts: {
          data: { prompt_id: 1, session_id: 10, kind: 'mcq', is_open: false },
          error: null,
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }) as any,
    )
    const res = await POST(makeRequest({ prompt_id: 1 }))
    expect(res.status).toBe(403)
    expect(res.body).toEqual({ error: 'Responses are closed for this prompt.' })
  })

  it('11 — returns 400 for MCQ prompt without choice_index', async () => {
    // Default mock already has kind: 'mcq'; omit choice_index from body
    const res = await POST(makeRequest({ prompt_id: 1 }))
    expect(res.status).toBe(400)
    expect(res.body).toEqual({ error: 'Select an option before submitting.' })
  })

  it('12 — returns 400 for non-MCQ prompt without text_answer', async () => {
    mockedCreateClient.mockResolvedValue(
      makeMockSupabase({
        prompts: {
          data: { prompt_id: 1, session_id: 10, kind: 'frq', is_open: true },
          error: null,
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }) as any,
    )
    const res = await POST(makeRequest({ prompt_id: 1 }))
    expect(res.status).toBe(400)
    expect(res.body).toEqual({ error: 'Enter a response before submitting.' })
  })

  it('13 — returns 201 for a successful MCQ answer submission', async () => {
    const res = await POST(makeRequest({ prompt_id: 1, choice_index: 2 }))
    expect(res.status).toBe(201)
    expect(res.body).toEqual({ answer_id: 100, created_at: '2024-01-01' })
  })

  it('14 — returns 201 for a successful text answer submission', async () => {
    mockedCreateClient.mockResolvedValue(
      makeMockSupabase({
        prompts: {
          data: { prompt_id: 1, session_id: 10, kind: 'frq', is_open: true },
          error: null,
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }) as any,
    )
    const res = await POST(makeRequest({ prompt_id: 1, text_answer: 'My answer' }))
    expect(res.status).toBe(201)
    expect(res.body).toEqual({ answer_id: 100, created_at: '2024-01-01' })
  })
})
