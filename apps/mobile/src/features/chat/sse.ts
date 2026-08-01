/**
 * Minimal incremental SSE parser for the backend chat stream. Frames arrive
 * as `event: name\ndata: json\n\n`, possibly split anywhere across network
 * chunks; comment lines (`: ping` heartbeats) are dropped.
 */
export interface SSEEvent {
  event: string
  data: string
}

export function createSSEParser() {
  let buffer = ''

  const parseFrame = (frame: string): SSEEvent | null => {
    let event = 'message'
    const data: string[] = []
    for (const line of frame.split('\n')) {
      if (line.startsWith(':')) continue
      if (line.startsWith('event:')) event = line.slice(6).trim()
      else if (line.startsWith('data:')) data.push(line.slice(5).trim())
    }
    if (data.length === 0) return null
    return { event, data: data.join('\n') }
  }

  return {
    feed(chunk: string): SSEEvent[] {
      buffer += chunk
      const events: SSEEvent[] = []
      for (;;) {
        const cut = buffer.indexOf('\n\n')
        if (cut === -1) break
        const frame = buffer.slice(0, cut)
        buffer = buffer.slice(cut + 2)
        const parsed = parseFrame(frame)
        if (parsed) events.push(parsed)
      }
      return events
    },
  }
}
