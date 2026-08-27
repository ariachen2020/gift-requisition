import { prisma } from './prisma'

export interface ItemLogInput {
  extension: string
  action: 'create' | 'update' | 'delete'
  itemId?: number | null
  itemName: string
  category?: string | null
  quantityFrom?: number | null
  quantityTo?: number | null
  note?: string
}

// 寫入商品異動紀錄；寫入失敗只記 log，不影響主要操作
export async function logItemAction(input: ItemLogInput) {
  try {
    await prisma.itemLog.create({
      data: {
        extension: input.extension,
        action: input.action,
        itemId: input.itemId ?? null,
        itemName: input.itemName,
        category: input.category ?? null,
        quantityFrom: input.quantityFrom ?? null,
        quantityTo: input.quantityTo ?? null,
        note: input.note || '',
      },
    })
  } catch (error) {
    console.error('Error writing item log:', error)
  }
}
