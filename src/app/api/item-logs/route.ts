import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdmin } from '@/config/admin-extensions'

// GET: 取得商品異動紀錄（僅管理員，支援月份篩選）
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

    const logs = await prisma.itemLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 500,
    })

    return NextResponse.json(logs)
  } catch (error) {
    console.error('Error fetching item logs:', error)
    return NextResponse.json(
      { error: '取得異動紀錄失敗' },
      { status: 500 }
    )
  }
}
