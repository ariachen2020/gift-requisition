import { NextRequest, NextResponse } from 'next/server'
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import path from 'path'
import { isAdmin } from '@/config/admin-extensions'

const DATA_DIR = process.env.STORAGE_ROOT || '/app/data'
const DB_FILENAME = 'booking.db'

// GET: 下載資料庫檔案
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const extension = searchParams.get('extension')

  if (!extension || !isAdmin(extension)) {
    return NextResponse.json({ error: '無權限' }, { status: 403 })
  }

  const dbPath = path.join(DATA_DIR, DB_FILENAME)

  if (!existsSync(dbPath)) {
    return NextResponse.json({ error: '找不到資料庫檔案' }, { status: 404 })
  }

  const fileBuffer = readFileSync(dbPath)

  return new NextResponse(fileBuffer, {
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${DB_FILENAME}"`,
      'Content-Length': fileBuffer.length.toString(),
    },
  })
}

// POST: 上傳資料庫檔案覆蓋
export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const extension = formData.get('extension') as string
  const file = formData.get('file') as File

  if (!extension || !isAdmin(extension)) {
    return NextResponse.json({ error: '無權限' }, { status: 403 })
  }

  if (!file) {
    return NextResponse.json({ error: '請上傳檔案' }, { status: 400 })
  }

  if (!file.name.endsWith('.db')) {
    return NextResponse.json({ error: '只接受 .db 檔案' }, { status: 400 })
  }

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true })
  }

  const dbPath = path.join(DATA_DIR, DB_FILENAME)
  writeFileSync(dbPath, buffer)

  return NextResponse.json({
    message: '資料庫已上傳覆蓋成功',
    size: `${(buffer.length / 1024).toFixed(1)} KB`,
  })
}
