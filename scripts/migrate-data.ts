import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'fs'

const prisma = new PrismaClient()

async function main() {
  const bookingsRaw = JSON.parse(readFileSync('/tmp/bookings.json', 'utf-8'))
  const itemsRaw = JSON.parse(readFileSync('/tmp/items.json', 'utf-8'))
  const requestsRaw = JSON.parse(readFileSync('/tmp/item_requests.json', 'utf-8'))

  console.log(`Data to import: ${bookingsRaw.length} bookings, ${itemsRaw.length} items, ${requestsRaw.length} requests`)

  console.log('Importing bookings...')
  for (const b of bookingsRaw) {
    await prisma.booking.create({
      data: {
        id: b.id,
        roomId: b.room_id,
        date: b.date,
        timeSlot: b.time_slot,
        title: b.title || null,
        booker: b.booker,
        extension: b.extension,
        orderIndex: b.order_index,
        recurringGroupId: b.recurring_group_id || null,
        createdAt: new Date(b.created_at),
      },
    })
  }
  console.log(`Imported ${bookingsRaw.length} bookings`)

  console.log('Importing items...')
  for (const item of itemsRaw) {
    await prisma.item.create({
      data: {
        id: item.id,
        name: item.name,
        category: item.category || null,
        quantity: item.quantity,
        imageUrl: item.image_url || null,
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at),
      },
    })
  }
  console.log(`Imported ${itemsRaw.length} items`)

  console.log('Importing item requests...')
  for (const req of requestsRaw) {
    await prisma.itemRequest.create({
      data: {
        id: req.id,
        extension: req.extension,
        department: req.department,
        items: req.items,
        reason: req.reason || '',
        createdAt: new Date(req.created_at),
      },
    })
  }
  console.log(`Imported ${requestsRaw.length} requests`)

  // Reset PostgreSQL sequences
  await prisma.$executeRawUnsafe(`SELECT setval('bookings_id_seq', (SELECT COALESCE(MAX(id), 0) FROM bookings))`)
  await prisma.$executeRawUnsafe(`SELECT setval('items_id_seq', (SELECT COALESCE(MAX(id), 0) FROM items))`)
  await prisma.$executeRawUnsafe(`SELECT setval('item_requests_id_seq', (SELECT COALESCE(MAX(id), 0) FROM item_requests))`)
  console.log('Sequences reset')

  // Verify
  const bc = await prisma.booking.count()
  const ic = await prisma.item.count()
  const rc = await prisma.itemRequest.count()
  console.log(`Verification: ${bc} bookings, ${ic} items, ${rc} requests`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
