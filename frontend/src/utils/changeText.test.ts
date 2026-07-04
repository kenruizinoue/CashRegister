import { parseChangeParts } from '@/utils/changeText'

test('parses a multi-denomination change line', () => {
  expect(parseChangeParts('3 quarters,1 dime,3 pennies')).toEqual([
    { count: 3, name: 'quarters' },
    { count: 1, name: 'dime' },
    { count: 3, name: 'pennies' },
  ])
})

test('parses multi-word denomination names', () => {
  expect(parseChangeParts('2 hundred dollar bills,1 five dollar bill')).toEqual([
    { count: 2, name: 'hundred dollar bills' },
    { count: 1, name: 'five dollar bill' },
  ])
})

test('no change yields no parts', () => {
  expect(parseChangeParts('no change')).toEqual([])
})

test('empty string yields no parts', () => {
  expect(parseChangeParts('')).toEqual([])
})
