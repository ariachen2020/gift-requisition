'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Download, Upload } from 'lucide-react'
import { isAdmin } from '@/config/admin-extensions'

export default function DbTransferPage() {
  const [isAuthed, setIsAuthed] = useState(false)
  const [extension, setExtension] = useState('')
  const [authError, setAuthError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleAuth = () => {
    if (isAdmin(extension)) {
      setIsAuthed(true)
      setAuthError('')
    } else {
      setAuthError('此分機無管理權限')
    }
  }

  const handleDownload = async () => {
    try {
      setLoading(true)
      setMessage('')
      const res = await fetch(`/api/db-transfer?extension=${extension}`)
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || '下載失敗')
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'booking.db'
      a.click()
      URL.revokeObjectURL(url)
      setMessage('資料庫下載成功')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : '下載失敗')
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!confirm('確定要上傳並覆蓋現有資料庫嗎？此操作無法復原！')) {
      e.target.value = ''
      return
    }

    try {
      setLoading(true)
      setMessage('')
      const formData = new FormData()
      formData.append('file', file)
      formData.append('extension', extension)

      const res = await fetch('/api/db-transfer', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '上傳失敗')

      setMessage(`${data.message}（${data.size}）— 請重新啟動服務讓變更生效`)
    } catch (err) {
      setMessage(err instanceof Error ? err.message : '上傳失敗')
    } finally {
      setLoading(false)
      e.target.value = ''
    }
  }

  if (!isAuthed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow p-6 w-full max-w-md">
          <h1 className="text-xl font-bold text-center mb-6">資料庫搬遷工具</h1>
          <p className="text-gray-600 text-center mb-4">請輸入管理員分機號碼</p>
          <input
            type="text"
            value={extension}
            onChange={(e) => setExtension(e.target.value)}
            placeholder="分機號碼"
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
            autoFocus
          />
          {authError && <p className="mt-2 text-red-500 text-sm">{authError}</p>}
          <button
            onClick={handleAuth}
            className="w-full mt-4 px-4 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
          >
            登入
          </button>
          <Link href="/" className="block text-center mt-4 text-gray-500 hover:text-gray-700">
            返回首頁
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <h1 className="text-xl font-bold text-gray-900">資料庫搬遷工具</h1>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-8 space-y-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
          此工具僅供伺服器搬遷時使用，搬遷完成後請移除。
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="font-semibold mb-2">步驟 1：從舊站下載資料庫</h2>
          <p className="text-sm text-gray-500 mb-4">在舊伺服器上點擊下載，取得 booking.db 檔案</p>
          <button
            onClick={handleDownload}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300"
          >
            <Download className="w-5 h-5" />
            {loading ? '處理中...' : '下載資料庫'}
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="font-semibold mb-2">步驟 2：上傳到新站</h2>
          <p className="text-sm text-gray-500 mb-4">在新伺服器上選擇剛才下載的 booking.db 上傳</p>
          <label className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg cursor-pointer ${loading ? 'bg-gray-300' : 'bg-green-500 hover:bg-green-600 text-white'}`}>
            <Upload className="w-5 h-5" />
            {loading ? '處理中...' : '上傳資料庫'}
            <input
              type="file"
              accept=".db"
              onChange={handleUpload}
              disabled={loading}
              className="hidden"
            />
          </label>
        </div>

        {message && (
          <div className="p-4 bg-blue-50 text-blue-700 rounded-lg text-sm">
            {message}
          </div>
        )}
      </main>
    </div>
  )
}
