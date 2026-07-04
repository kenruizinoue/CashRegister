import { toLines } from '@/utils/lines'

test('splits input into trimmed non-blank lines', () => {
  expect(toLines(' 2.12,3.00 \n1.97,2.00\n3.33,5.00')).toEqual([
    '2.12,3.00',
    '1.97,2.00',
    '3.33,5.00',
  ])
})

test('drops blank and whitespace-only lines', () => {
  expect(toLines('\n2.12,3.00\n\n   \n\t\n1.97,2.00\n')).toEqual(['2.12,3.00', '1.97,2.00'])
})

test('whitespace-only input yields no lines', () => {
  expect(toLines('   \n \n\t')).toEqual([])
})

test('empty input yields no lines', () => {
  expect(toLines('')).toEqual([])
})

test('handles CRLF line endings', () => {
  expect(toLines('2.12,3.00\r\n1.97,2.00\r\n')).toEqual(['2.12,3.00', '1.97,2.00'])
})

test('preserves input order', () => {
  expect(toLines('b\na\nc')).toEqual(['b', 'a', 'c'])
})
