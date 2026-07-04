import { GatewayError } from '@/domain/change'
import { createHttpChangeGateway } from '@/adapters/httpChangeGateway'

const okEnvelope = {
  results: [
    {
      line_number: 1,
      input: '2.12,3.00',
      status: 'ok',
      change: '3 quarters,1 dime,3 pennies',
      error: null,
    },
    {
      line_number: 2,
      input: 'bogus,x',
      status: 'error',
      change: null,
      error: "invalid amount: 'bogus'",
    },
  ],
}

function jsonResponse(data: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
  } as Response
}

afterEach(() => {
  vi.unstubAllGlobals()
})

test('happy path maps the envelope into domain results', async () => {
  const fetchMock = vi.fn().mockResolvedValue(jsonResponse(okEnvelope))
  vi.stubGlobal('fetch', fetchMock)

  const gateway = createHttpChangeGateway('')
  const results = await gateway.submitLines(['2.12,3.00', 'bogus,x'], { seed: 42 })

  expect(fetchMock).toHaveBeenCalledWith('/change', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lines: ['2.12,3.00', 'bogus,x'], seed: 42 }),
  })
  expect(results).toEqual([
    {
      lineNumber: 1,
      input: '2.12,3.00',
      status: 'ok',
      change: '3 quarters,1 dime,3 pennies',
      error: null,
    },
    {
      lineNumber: 2,
      input: 'bogus,x',
      status: 'error',
      change: null,
      error: "invalid amount: 'bogus'",
    },
  ])
})

test('omitted config sends only the lines', async () => {
  const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ results: [] }))
  vi.stubGlobal('fetch', fetchMock)

  await createHttpChangeGateway('').submitLines(['1,2'])

  expect(fetchMock.mock.calls[0][1].body).toBe(JSON.stringify({ lines: ['1,2'] }))
})

test('full config is forwarded and null seed omitted', async () => {
  const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ results: [] }))
  vi.stubGlobal('fetch', fetchMock)

  await createHttpChangeGateway('').submitLines(['1,2'], {
    currency: 'EUR',
    divisor: 5,
    seed: null,
  })

  expect(fetchMock.mock.calls[0][1].body).toBe(
    JSON.stringify({ lines: ['1,2'], currency: 'EUR', divisor: 5 }),
  )
})

test('base url prefixes the endpoint', async () => {
  const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ results: [] }))
  vi.stubGlobal('fetch', fetchMock)

  await createHttpChangeGateway('http://api.example').submitLines(['1,2'])

  expect(fetchMock.mock.calls[0][0]).toBe('http://api.example/change')
})

test('non-2xx response becomes a GatewayError with the status', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ detail: 'nope' }, 422)))

  await expect(createHttpChangeGateway('').submitLines(['bad'])).rejects.toThrow(
    new GatewayError('backend rejected the request (HTTP 422)'),
  )
})

test('malformed JSON becomes a GatewayError', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => {
        throw new SyntaxError('bad json')
      },
    } as unknown as Response),
  )

  await expect(createHttpChangeGateway('').submitLines(['1,2'])).rejects.toThrow(
    new GatewayError('malformed response from backend'),
  )
})

test('envelope without results becomes a GatewayError', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ unexpected: true })))

  await expect(createHttpChangeGateway('').submitLines(['1,2'])).rejects.toThrow(
    new GatewayError('malformed response from backend'),
  )
})

const validEntry = {
  line_number: 1,
  input: '1.97,2.00',
  status: 'ok',
  change: '3 pennies',
  error: null,
}

test.each([
  ['null entry', null],
  ['non-object entry', 'not an object'],
  ['unknown status', { ...validEntry, status: 'maybe' }],
  ['string line_number', { ...validEntry, line_number: '1' }],
  ['missing input', { ...validEntry, input: undefined }],
  ['numeric change', { ...validEntry, change: 5 }],
  ['object error field', { ...validEntry, error: {} }],
  ['missing status', { ...validEntry, status: undefined }],
])('invalid entry shape (%s) becomes a GatewayError', async (_name, entry) => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ results: [validEntry, entry] })))

  await expect(createHttpChangeGateway('').submitLines(['1,2'])).rejects.toThrow(
    new GatewayError('malformed response from backend'),
  )
})

test('network failure becomes a GatewayError', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))

  await expect(createHttpChangeGateway('').submitLines(['1,2'])).rejects.toThrow(
    new GatewayError('backend unreachable'),
  )
})
