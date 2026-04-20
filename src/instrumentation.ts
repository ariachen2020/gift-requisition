export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startBackupSchedule } = await import('./lib/backup')
    startBackupSchedule()
  }
}
