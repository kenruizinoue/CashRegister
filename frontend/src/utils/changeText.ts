// Parse a backend change line ("3 quarters,1 dime") into count/name parts.

export interface ChangePart {
  count: number
  name: string
}

export function parseChangeParts(change: string): ChangePart[] {
  if (!change || change === 'no change') {
    return []
  }
  return change.split(',').map((part) => {
    const trimmed = part.trim()
    const firstSpace = trimmed.indexOf(' ')
    return {
      count: Number(trimmed.slice(0, firstSpace)),
      name: trimmed.slice(firstSpace + 1),
    }
  })
}
