export interface Booking {
  id: number
  roomId: string
  date: string
  timeSlot: string
  booker: string
  extension: string
  title: string | null
  orderIndex: number
  recurringGroupId: string | null
  createdAt: Date
}

export interface TimeSlot {
  time: string
  booking?: Booking
  available: boolean
}

export interface CalendarDay {
  date: string
  bookings: Booking[]
  hasBookings: boolean
  timeSlots: string[]
}

export interface BookingForm {
  booker: string
  extension: string
  title?: string
  timeSlot: string
  startTime?: string
  endTime?: string
  recurring?: {
    enabled: boolean
    type: 'daily' | 'weekly' | 'monthly'
    endDate: string
  }
}

export interface DeleteBookingRequest {
  bookingId: number
  extension: string
  deleteAll?: boolean
}

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
  items: ItemRequestItem[]
  createdAt: Date
}

// 部門清單
export const DEPARTMENTS = ['BB', 'BC', 'BD', 'BF', 'BN', 'BI', 'BS'] as const
export type Department = typeof DEPARTMENTS[number]

export interface CartItem {
  itemId: number
  name: string
  quantity: number
  maxQuantity: number
}