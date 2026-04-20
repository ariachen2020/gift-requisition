import { NextRequest, NextResponse } from 'next/server'
import { existsSync, unlinkSync } from 'fs'
import path from 'path'
import { prisma } from '@/lib/prisma'
import { isAdmin } from '@/config/admin-extensions'

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.env.STORAGE_ROOT || '/app/data', 'uploads')

function deleteImageFile(imageUrl: string | null) {
  if (!imageUrl) return
  const match = imageUrl.match(/\/(?:api\/)?uploads\/([^/]+)$/)
  if (!match) return
  const filepath = path.join(UPLOAD_DIR, match[1])
  if (existsSync(filepath)) {
    try { unlinkSync(filepath) } catch { /* ignore */ }
  }
}

// GET: 取得單一商品
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const itemId = parseInt(id, 10)

    if (isNaN(itemId)) {
      return NextResponse.json(
        { error: '無效的商品 ID' },
        { status: 400 }
      )
    }

    const item = await prisma.item.findUnique({
      where: { id: itemId },
    })

    if (!item) {
      return NextResponse.json(
        { error: '商品不存在' },
        { status: 404 }
      )
    }

    return NextResponse.json(item)
  } catch (error) {
    console.error('Error fetching item:', error)
    return NextResponse.json(
      { error: '取得商品失敗' },
      { status: 500 }
    )
  }
}

// PUT: 更新商品（僅管理員）
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const itemId = parseInt(id, 10)
    const body = await request.json()
    const { name, category, quantity, imageUrl, extension } = body

    if (isNaN(itemId)) {
      return NextResponse.json(
        { error: '無效的商品 ID' },
        { status: 400 }
      )
    }

    // 驗證管理員身份
    if (!extension || !isAdmin(extension)) {
      return NextResponse.json(
        { error: '無權限執行此操作' },
        { status: 403 }
      )
    }

    // 檢查商品是否存在
    const existingItem = await prisma.item.findUnique({
      where: { id: itemId },
    })

    if (!existingItem) {
      return NextResponse.json(
        { error: '商品不存在' },
        { status: 404 }
      )
    }

    // 驗證欄位
    if (name !== undefined && (typeof name !== 'string' || name.trim() === '')) {
      return NextResponse.json(
        { error: '商品名稱不可為空' },
        { status: 400 }
      )
    }

    if (quantity !== undefined && (typeof quantity !== 'number' || quantity < 0)) {
      return NextResponse.json(
        { error: '數量必須為非負整數' },
        { status: 400 }
      )
    }

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name.trim()
    if (category !== undefined) updateData.category = category?.trim() || null
    if (quantity !== undefined) updateData.quantity = quantity
    if (imageUrl !== undefined) {
      if (existingItem.imageUrl && existingItem.imageUrl !== imageUrl) {
        deleteImageFile(existingItem.imageUrl)
      }
      updateData.imageUrl = imageUrl?.trim() || null
    }

    const item = await prisma.item.update({
      where: { id: itemId },
      data: updateData,
    })

    return NextResponse.json(item)
  } catch (error) {
    console.error('Error updating item:', error)
    return NextResponse.json(
      { error: '更新商品失敗' },
      { status: 500 }
    )
  }
}

// DELETE: 刪除商品（僅管理員）
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const itemId = parseInt(id, 10)
    const { searchParams } = new URL(request.url)
    const extension = searchParams.get('extension')

    if (isNaN(itemId)) {
      return NextResponse.json(
        { error: '無效的商品 ID' },
        { status: 400 }
      )
    }

    // 驗證管理員身份
    if (!extension || !isAdmin(extension)) {
      return NextResponse.json(
        { error: '無權限執行此操作' },
        { status: 403 }
      )
    }

    // 檢查商品是否存在
    const existingItem = await prisma.item.findUnique({
      where: { id: itemId },
    })

    if (!existingItem) {
      return NextResponse.json(
        { error: '商品不存在' },
        { status: 404 }
      )
    }

    deleteImageFile(existingItem.imageUrl)

    await prisma.item.delete({
      where: { id: itemId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting item:', error)
    return NextResponse.json(
      { error: '刪除商品失敗' },
      { status: 500 }
    )
  }
}
