/** Coordinates session generations and token writes across async auth operations. */
export class SessionEpoch {
  private value = 0
  private readonly pendingWrites = new Set<Promise<void>>()

  capture(): number {
    return this.value
  }

  beginSession(): number {
    this.value += 1
    return this.value
  }

  invalidate(): void {
    this.value += 1
  }

  isCurrent(epoch: number): boolean {
    return this.value === epoch
  }

  async persistIfCurrent(epoch: number, write: () => Promise<void>): Promise<boolean> {
    if (!this.isCurrent(epoch)) return false

    const pending = write()
    this.pendingWrites.add(pending)
    try {
      await pending
    } finally {
      this.pendingWrites.delete(pending)
    }
    return this.isCurrent(epoch)
  }

  async waitForPendingWrites(): Promise<void> {
    while (this.pendingWrites.size > 0) {
      await Promise.allSettled([...this.pendingWrites])
    }
  }
}
