import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdmin } from '@/config/admin-extensions'

// GET: 取得所有商品列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const search = searchParams.get('search')

    const where: Record<string, unknown> = {}

    if (category) {
      where.category = category
    }

    if (search) {
      where.name = {
        contains: search,
      }
    }

    const items = await prisma.item.findMany({
      where,
      orderBy: [
        { category: 'asc' },
        { name: 'asc' },
      ],
    })

    return NextResponse.json(items)
  } catch (error) {
    console.error('Error fetching items:', error)
    return NextResponse.json(
      { error: '取得商品列表失敗' },
      { status: 500 }
    )
  }
}

// POST: 新增商品（僅管理員）
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, category, quantity, imageUrl, extension } = body

    // 驗證管理員身份
    if (!extension || !isAdmin(extension)) {
      return NextResponse.json(
        { error: '無權限執行此操作' },
        { status: 403 }
      )
    }

    // 驗證必填欄位
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { error: '商品名稱為必填' },
        { status: 400 }
      )
    }

    if (quantity !== undefined && (typeof quantity !== 'number' || quantity < 0)) {
      return NextResponse.json(
        { error: '數量必須為非負整數' },
        { status: 400 }
      )
    }

    const item = await prisma.item.create({
      data: {
        name: name.trim(),
        category: category?.trim() || null,
        quantity: quantity ?? 0,
        imageUrl: imageUrl?.trim() || null,
      },
    })

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    console.error('Error creating item:', error)
    return NextResponse.json(
      { error: '新增商品失敗' },
      { status: 500 }
    )
  }
}
