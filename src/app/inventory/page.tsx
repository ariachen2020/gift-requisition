import { redirect } from 'next/navigation'

// 領用頁已搬到首頁，保留此網址自動轉回首頁，避免舊連結失效
export default function InventoryPage() {
  redirect('/')
}
