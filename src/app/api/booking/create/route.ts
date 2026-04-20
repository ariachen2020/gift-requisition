import { NextRequest, NextResponse } from 'next/server'
import { createBooking, createRecurringBookings, getBookingsByRoomAndDate } from '@/lib/storage'
import { isValidTimeSlot, isValidExtension } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { roomId, date, timeSlot, extension, recurring, forceBook } = body

    // Validation
    if (!roomId || (roomId !== 'A' && roomId !== 'B')) {
      return NextResponse.json(
        { message: '無效的會議室ID' },
        { status: 400 }
      )
    }

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { message: '無效的日期格式' },
        { status: 400 }
      )
    }

    if (!isValidTimeSlot(timeSlot)) {
      return NextResponse.json(
        { message: '無效的時間段' },
        { status: 400 }
      )
    }

    if (!extension) {
      return NextResponse.json(
        { message: '請輸入分機號碼' },
        { status: 400 }
      )
    }

    if (!/^\d{3,5}$/.test(extension)) {
      return NextResponse.json(
        { message: '分機號碼格式錯誤（需為3-5位數字）' },
        { status: 400 }
      )
    }

    if (!isValidExtension(extension)) {
      return NextResponse.json(
        { message: '此分機號碼無權預約會議室' },
        { status: 403 }
      )
    }

    // Check for existing booking if not forcing
    if (!forceBook) {
      const existingBookings = await getBookingsByRoomAndDate(roomId, date)

      // Parse time slot to check for overlaps
      const [newStart, newEnd] = timeSlot.split('-')
      const conflicts = existingBookings.filter(b => {
        const [existingStart, existingEnd] = b.timeSlot.split('-')
        // Check if there's any time overlap
        return existingStart < newEnd && newStart < existingEnd
      })

      if (conflicts.length > 0) {
        return NextResponse.json({
          success: false,
          message: '該時段已有預約，是否仍要預約？',
          conflicts
        }, { status: 409 })
      }
    }

    const bookingData = {
      roomId,
      date,
      timeSlot,
      booker: extension.trim(),
      extension: extension.trim(),
      title: null,
      recurringGroupId: null
    }

    // Handle recurring bookings
    if (recurring?.enabled && recurring.endDate) {
      const maxEndDate = new Date(date)
      maxEndDate.setDate(maxEndDate.getDate() + 90)
      const requestedEnd = new Date(recurring.endDate)
      if (requestedEnd > maxEndDate) {
        return NextResponse.json(
          { message: '循環預約最多 90 天' },
          { status: 400 }
        )
      }

      const createdBookings = await createRecurringBookings(bookingData, {
        type: recurring.type,
        endDate: recurring.endDate
      })

      return NextResponse.json({
        success: true,
        message: `成功建立 ${createdBookings.length} 個循環預約`,
        bookings: createdBookings
      })
    } else {
      // Create single booking
      const booking = await createBooking(bookingData)

      return NextResponse.json({
        success: true,
        message: '預約成功',
        booking
      })
    }

  } catch (error) {
    console.error('POST /api/booking/create error:', error)
    return NextResponse.json(
      { message: '預約失敗，請稍後再試' },
      { status: 500 }
    )
  }
}