import { execSync } from 'child_process'
import { existsSync, mkdirSync, readdirSync, statSync, unlinkSync } from 'fs'
import path from 'path'

const DATA_DIR = process.env.STORAGE_ROOT || '/app/data'
const BACKUP_DIR = process.env.BACKUP_ROOT || '/app/backups'
const DB_FILENAME = 'booking.db'
const RETENTION_DAYS = parseInt(process.env.BACKUP_RETENTION_DAYS || '30', 10)
const BACKUP_INTERVAL_MS = 12 * 60 * 60 * 1000

function log(message: string) {
  console.log(`[Backup ${new Date().toISOString()}] ${message}`)
}

function ensureDir(dir: string) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
}

export function safeBackup(dbPath: string, backupPath: string): boolean {
  try {
    execSync(`sqlite3 "${dbPath}" ".backup '${backupPath}'"`, { timeout: 30000 })
    return true
  } catch {
    return false
  }
}

function createBackup() {
  const dbPath = path.join(DATA_DIR, DB_FILENAME)

  if (!existsSync(dbPath)) {
    log(`Database not found: ${dbPath}, skipping backup`)
    return
  }

  ensureDir(BACKUP_DIR)

  const now = new Date()
  const timestamp = now.toISOString().replace(/[:-]/g, '').replace('T', '_').slice(0, 15)
  const backupFilename = `booking_backup_${timestamp}.db`
  const backupPath = path.join(BACKUP_DIR, backupFilename)

  if (safeBackup(dbPath, backupPath)) {
    const size = statSync(backupPath).size
    log(`Backup created: ${backupFilename} (${(size / 1024).toFixed(1)} KB)`)
  } else {
    log('Backup failed: sqlite3 .backup command error')
    if (existsSync(backupPath)) unlinkSync(backupPath)
  }

  cleanOldBackups()
}

function cleanOldBackups() {
  try {
    const files = readdirSync(BACKUP_DIR).filter(f => f.startsWith('booking_backup_') && f.endsWith('.db'))
    const cutoff = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000
    let deleted = 0

    for (const file of files) {
      const filepath = path.join(BACKUP_DIR, file)
      const mtime = statSync(filepath).mtimeMs
      if (mtime < cutoff) {
        unlinkSync(filepath)
        deleted++
      }
    }

    if (deleted > 0) {
      log(`Cleaned up ${deleted} old backup(s)`)
    }

    const remaining = readdirSync(BACKUP_DIR).filter(f => f.startsWith('booking_backup_')).length
    log(`Total backups: ${remaining}`)
  } catch (err) {
    log(`Cleanup error: ${err}`)
  }
}

let started = false

export function startBackupSchedule() {
  if (started || process.env.NODE_ENV !== 'production') return
  started = true

  log('Backup schedule started (every 12 hours)')

  setTimeout(() => {
    createBackup()
  }, 60 * 1000)

  setInterval(() => {
    createBackup()
  }, BACKUP_INTERVAL_MS)
}
