export interface SessionResetTask {
  name: string
  reset: () => void | Promise<void>
}

export interface SessionResetFailure {
  name: string
  reason: unknown
}

/** Runs every reset task even when another task fails. */
export async function runSessionResetTasks(
  tasks: SessionResetTask[],
): Promise<SessionResetFailure[]> {
  const results = await Promise.allSettled(
    tasks.map(({ reset }) => Promise.resolve().then(reset)),
  )

  return results.flatMap((result, index) =>
    result.status === 'rejected'
      ? [{ name: tasks[index].name, reason: result.reason }]
      : [],
  )
}
