import { NextRequest, NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import { existsSync, mkdirSync } from 'fs'
import path from 'path'
import { isAdmin } from '@/config/admin-extensions'

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.env.STORAGE_ROOT || '/app/data', 'uploads')

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const extension = formData.get('extension') as string | null

    if (!extension || !isAdmin(extension)) {
      return NextResponse.json(
        { error: '無權限執行此操作' },
        { status: 403 }
      )
    }

    if (!file) {
      return NextResponse.json(
        { error: '請選擇檔案' },
        { status: 400 }
      )
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: '僅支援 JPG、PNG、WebP、HEIC 格式' },
        { status: 400 }
      )
    }

    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: '檔案大小不能超過 10MB' },
        { status: 400 }
      )
    }

    if (!existsSync(UPLOAD_DIR)) {
      mkdirSync(UPLOAD_DIR, { recursive: true })
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
    const filepath = path.join(UPLOAD_DIR, filename)

    const bytes = await file.arrayBuffer()
    await writeFile(filepath, Buffer.from(bytes))

    return NextResponse.json({
      url: `/api/uploads/${filename}`,
    })
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { error: '上傳失敗' },
      { status: 500 }
    )
  }
}
