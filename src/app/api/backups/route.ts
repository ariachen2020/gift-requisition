import { NextRequest, NextResponse } from 'next/server'
import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync, unlinkSync } from 'fs'
import path from 'path'
import { isAdmin } from '@/config/admin-extensions'

const DATA_DIR = process.env.STORAGE_ROOT || '/app/data'
const BACKUP_DIR = process.env.BACKUP_ROOT || '/app/backups'
const DB_FILENAME = 'dev.db'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const extension = searchParams.get('extension')

  if (!extension || !isAdmin(extension)) {
    return NextResponse.json({ error: '無權限' }, { status: 403 })
  }

  if (!existsSync(BACKUP_DIR)) {
    return NextResponse.json({ backups: [], message: '備份目錄不存在' })
  }

  const files = readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith('booking_backup_') && f.endsWith('.db'))
    .map(f => {
      const filepath = path.join(BACKUP_DIR, f)
      const stat = statSync(filepath)
      return {
        filename: f,
        size: `${(stat.size / 1024).toFixed(1)} KB`,
        sizeBytes: stat.size,
        date: stat.mtime.toISOString(),
      }
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return NextResponse.json({
    backups: files,
    total: files.length,
    backupDir: BACKUP_DIR,
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { extension } = body

  if (!extension || !isAdmin(extension)) {
    return NextResponse.json({ error: '無權限' }, { status: 403 })
  }

  const dbPath = path.join(DATA_DIR, DB_FILENAME)

  if (!existsSync(dbPath)) {
    return NextResponse.json({ error: '找不到資料庫檔案' }, { status: 404 })
  }

  if (!existsSync(BACKUP_DIR)) {
    mkdirSync(BACKUP_DIR, { recursive: true })
  }

  const now = new Date()
  const timestamp = now.toISOString().replace(/[:-]/g, '').replace('T', '_').slice(0, 15)
  const backupFilename = `booking_backup_${timestamp}.db`
  const backupPath = path.join(BACKUP_DIR, backupFilename)

  try {
    copyFileSync(dbPath, backupPath)
    const size = statSync(backupPath).size
    return NextResponse.json({
      message: '備份成功',
      filename: backupFilename,
      size: `${(size / 1024).toFixed(1)} KB`,
    })
  } catch (err) {
    return NextResponse.json({ error: `備份失敗: ${err}` }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const extension = searchParams.get('extension')
  const filename = searchParams.get('filename')

  if (!extension || !isAdmin(extension)) {
    return NextResponse.json({ error: '無權限' }, { status: 403 })
  }

  if (!filename || !filename.startsWith('booking_backup_') || !filename.endsWith('.db')) {
    return NextResponse.json({ error: '無效的檔案名稱' }, { status: 400 })
  }

  const filepath = path.join(BACKUP_DIR, filename)

  if (!existsSync(filepath)) {
    return NextResponse.json({ error: '檔案不存在' }, { status: 404 })
  }

  try {
    unlinkSync(filepath)
    return NextResponse.json({ message: '已刪除備份' })
  } catch (err) {
    return NextResponse.json({ error: `刪除失敗: ${err}` }, { status: 500 })
  }
}
