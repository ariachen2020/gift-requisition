import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdmin } from '@/config/admin-extensions'
import { isExtensionAllowed } from '@/config/allowed-extensions'
import { ItemRequestItem, DEPARTMENTS } from '@/types'

// GET: 取得領取紀錄（僅管理員，支援月份篩選）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const extension = searchParams.get('extension')
    const month = searchParams.get('month') // 格式: YYYY-MM

    // 驗證管理員身份
    if (!extension || !isAdmin(extension)) {
      return NextResponse.json(
        { error: '無權限執行此操作' },
        { status: 403 }
      )
    }

    let where = {}

    if (month) {
      const startDate = new Date(`${month}-01T00:00:00.000Z`)
      const endDate = new Date(startDate)
      endDate.setMonth(endDate.getMonth() + 1)

      where = {
        createdAt: {
          gte: startDate,
          lt: endDate,
        },
      }
    }

    const requests = await prisma.itemRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    // 解析 items JSON
    const parsedRequests = requests.map((req) => ({
      ...req,
      items: JSON.parse(req.items) as ItemRequestItem[],
    }))

    return NextResponse.json(parsedRequests)
  } catch (error) {
    console.error('Error fetching requests:', error)
    return NextResponse.json(
      { error: '取得領取紀錄失敗' },
      { status: 500 }
    )
  }
}

// POST: 新增領取申請（扣庫存）
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { extension, department, items, reason } = body as {
      extension: string
      department: string
      items: ItemRequestItem[]
      reason?: string
    }

    // 驗證必填欄位
    if (!extension || typeof extension !== 'string' || extension.trim() === '') {
      return NextResponse.json(
        { error: '分機號碼為必填' },
        { status: 400 }
      )
    }

    // 驗證分機號碼是否在允許清單中
    if (!isExtensionAllowed(extension.trim())) {
      return NextResponse.json(
        { error: '此分機號碼不在系統允許的清單中' },
        { status: 400 }
      )
    }

    if (!department || typeof department !== 'string' || department.trim() === '') {
      return NextResponse.json(
        { error: '部門為必填' },
        { status: 400 }
      )
    }

    // 驗證部門是否有效
    if (!DEPARTMENTS.includes(department as any)) {
      return NextResponse.json(
        { error: '無效的部門選項' },
        { status: 400 }
      )
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: '請至少選擇一項商品' },
        { status: 400 }
      )
    }

    // 驗證每個項目
    for (const item of items) {
      if (!item.itemId || !item.quantity || item.quantity < 1) {
        return NextResponse.json(
          { error: '商品資料格式錯誤' },
          { status: 400 }
        )
      }
    }

    // 使用交易確保原子性
    const result = await prisma.$transaction(async (tx) => {
      // 檢查庫存並準備更新
      const itemsToUpdate: { id: number; currentQuantity: number; requestedQuantity: number; name: string }[] = []

      for (const reqItem of items) {
        const dbItem = await tx.item.findUnique({
          where: { id: reqItem.itemId },
        })

        if (!dbItem) {
          throw new Error(`商品 ID ${reqItem.itemId} 不存在`)
        }

        if (dbItem.quantity < reqItem.quantity) {
          throw new Error(`「${dbItem.name}」庫存不足，目前剩餘 ${dbItem.quantity} 個`)
        }

        itemsToUpdate.push({
          id: dbItem.id,
          currentQuantity: dbItem.quantity,
          requestedQuantity: reqItem.quantity,
          name: dbItem.name,
        })
      }

      // 扣除庫存
      for (const item of itemsToUpdate) {
        await tx.item.update({
          where: { id: item.id },
          data: { quantity: item.currentQuantity - item.requestedQuantity },
        })
      }

      // 建立領取紀錄
      const itemsWithNames = items.map((item, index) => ({
        ...item,
        name: itemsToUpdate[index].name,
      }))

      const itemRequest = await tx.itemRequest.create({
        data: {
          extension: extension.trim(),
          department: department.trim(),
          reason: (reason || '').trim(),
          items: JSON.stringify(itemsWithNames),
        },
      })

      return {
        ...itemRequest,
        items: itemsWithNames,
      }
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Error creating request:', error)
    const message = error instanceof Error ? error.message : '領取申請失敗'
    return NextResponse.json(
      { error: message },
      { status: 400 }
    )
  }
}
