// 禮品庫存相關類型
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
  reason: string
  items: ItemRequestItem[]
  createdAt: Date
}

export interface CartItem {
  itemId: number
  name: string
  quantity: number
  maxQuantity: number
}