export interface RequestTurn {
  id: number
  signal: AbortSignal
}

/** Owns one request at a time and rejects responses from closed or replaced sessions. */
export class RequestTurnGuard {
  private sequence = 0
  private sessionOpen = false
  private active: { id: number; controller: AbortController } | null = null

  openSession(): void {
    this.invalidateActiveTurn()
    this.sessionOpen = true
  }

  closeSession(): void {
    this.sessionOpen = false
    this.invalidateActiveTurn()
  }

  isSessionOpen(): boolean {
    return this.sessionOpen
  }

  start(): RequestTurn | null {
    if (!this.sessionOpen) return null

    this.invalidateActiveTurn()
    const controller = new AbortController()
    const id = ++this.sequence
    this.active = { id, controller }
    return { id, signal: controller.signal }
  }

  isCurrent(id: number): boolean {
    return (
      this.sessionOpen &&
      this.active?.id === id &&
      this.active.controller.signal.aborted === false
    )
  }

  finish(id: number): boolean {
    if (!this.isCurrent(id)) return false
    this.active = null
    return true
  }

  private invalidateActiveTurn(): void {
    this.sequence += 1
    this.active?.controller.abort()
    this.active = null
  }
}
