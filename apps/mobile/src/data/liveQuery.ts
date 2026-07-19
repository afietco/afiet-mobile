export type LiveQueryOutcome<T> =
  | { ok: true; data: T }
  | { ok: false; error: Error }

/** Converts synchronous throws and rejected promises into a resolved query outcome. */
export async function executeLiveQuery<T>(query: () => Promise<T>): Promise<LiveQueryOutcome<T>> {
  try {
    return { ok: true, data: await query() }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error : new Error('Live query failed'),
    }
  }
}
