// 公務禮品庫存相關類型
export interface Item {
  id: number
  name: string
  category: string | null
  quantity: number
  imageUrl: string | null
  createdAt: Date
  updatedAt: Date
}

export interface ItemRequestItem {
  itemId: number
  name: string
  quantity: number
}

export interface ItemRequest {
  id: number
  extension: string
  department: string
  reason: string
  items: ItemRequestItem[]
  createdAt: Date
}

// 部門清單
export const DEPARTMENTS = ['BB', 'BC', 'BD', 'BF', 'BG', 'BN', 'BI', 'BS'] as const
export type Department = typeof DEPARTMENTS[number]

export interface CartItem {
  itemId: number
  name: string
  quantity: number
  maxQuantity: number
}