import { NextRequest, NextResponse } from 'next/server'
import { existsSync, readFileSync } from 'fs'
import path from 'path'
import { isAdmin } from '@/config/admin-extensions'

const BACKUP_DIR = process.env.BACKUP_ROOT || '/app/backups'
const VALID_BACKUP_FILENAME = /^booking_backup_\d{8}_\d{6}\.sql$/

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const extension = searchParams.get('extension')
  const filename = searchParams.get('filename')

  if (!extension || !isAdmin(extension)) {
    return NextResponse.json({ error: '無權限' }, { status: 403 })
  }

  if (!filename || !VALID_BACKUP_FILENAME.test(filename)) {
    return NextResponse.json({ error: '無效的檔案名稱' }, { status: 400 })
  }

  const filepath = path.join(BACKUP_DIR, filename)

  if (!existsSync(filepath)) {
    return NextResponse.json({ error: '檔案不存在' }, { status: 404 })
  }

  const fileBuffer = readFileSync(filepath)

  return new NextResponse(fileBuffer, {
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': fileBuffer.length.toString(),
    },
  })
}
