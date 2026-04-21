'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Database, Download, Trash2, RefreshCw, HardDrive } from 'lucide-react'
import { isAdmin } from '@/config/admin-extensions'

interface BackupFile {
  filename: string
  size: string
  sizeBytes: number
  date: string
}

export default function AdminBackupsPage() {
  const [isAuthed, setIsAuthed] = useState(false)
  const [extension, setExtension] = useState('')
  const [authError, setAuthError] = useState('')

  const [backups, setBackups] = useState<BackupFile[]>([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleAuth = () => {
    if (isAdmin(extension)) {
      setIsAuthed(true)
      setAuthError('')
    } else {
      setAuthError('此分機無管理權限')
    }
  }

  const fetchBackups = async () => {
    try {
      setLoading(true)
      setError('')
      const res = await fetch(`/api/backups?extension=${extension}`)
      if (!res.ok) throw new Error('取得備份列表失敗')
      const data = await res.json()
      setBackups(data.backups || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : '發生錯誤')
    } finally {
      setLoading(false)
    }
  }

  const createBackup = async () => {
    try {
      setCreating(true)
      setError('')
      setSuccess('')
      const res = await fetch('/api/backups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ extension }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || '備份失敗')
      }
      const data = await res.json()
      setSuccess(`${data.message}：${data.filename} (${data.size})`)
      fetchBackups()
    } catch (err) {
      setError(err instanceof Error ? err.message : '備份失敗')
    } finally {
      setCreating(false)
    }
  }

  const downloadBackup = async (filename: string) => {
    try {
      setError('')
      const res = await fetch(`/api/backups/download?extension=${extension}&filename=${filename}`)
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || '下載失敗')
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : '下載失敗')
    }
  }

  const deleteBackup = async (filename: string) => {
    if (!confirm(`確定要刪除備份 ${filename}？`)) return

    try {
      setError('')
      const res = await fetch(`/api/backups?extension=${extension}&filename=${filename}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || '刪除失敗')
      }
      setSuccess('已刪除備份')
      fetchBackups()
    } catch (err) {
      setError(err instanceof Error ? err.message : '刪除失敗')
    }
  }

  useEffect(() => {
    if (isAuthed) fetchBackups()
  }, [isAuthed])

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const totalSize = backups.reduce((sum, b) => sum + b.sizeBytes, 0)

  if (!isAuthed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow p-6 w-full max-w-md">
          <h1 className="text-xl font-bold text-center mb-6">資料庫備份管理</h1>
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
          {authError && (
            <p className="mt-2 text-red-500 text-sm">{authError}</p>
          )}
          <button
            onClick={handleAuth}
            className="w-full mt-4 px-4 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
          >
            登入
          </button>
          <Link
            href="/"
            className="block text-center mt-4 text-gray-500 hover:text-gray-700"
          >
            返回首頁
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/" className="text-gray-500 hover:text-gray-700">
            <ArrowLeft size={20} />
          </Link>
          <Database size={24} className="text-primary-500" />
          <h1 className="text-xl font-bold">資料庫備份管理</h1>
        </div>

        {/* Stats & Actions */}
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <HardDrive size={16} />
                共 {backups.length} 個備份
              </span>
              <span>
                總大小：{(totalSize / 1024 / 1024).toFixed(1)} MB
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={fetchBackups}
                disabled={loading}
                className="flex items-center gap-1 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                重新整理
              </button>
              <button
                onClick={createBackup}
                disabled={creating}
                className="flex items-center gap-1 px-3 py-2 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50"
              >
                <Download size={14} className={creating ? 'animate-bounce' : ''} />
                {creating ? '備份中...' : '立即備份'}
              </button>
            </div>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
            {success}
          </div>
        )}

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg mb-4 text-sm">
          系統每 12 小時自動備份一次，備份保留 30 天。您也可以手動建立備份。
        </div>

        {/* Backup List */}
        <div className="bg-white rounded-lg shadow">
          {loading ? (
            <div className="p-8 text-center text-gray-500">載入中...</div>
          ) : backups.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              尚無備份檔案
            </div>
          ) : (
            <div className="divide-y">
              {backups.map((backup) => (
                <div
                  key={backup.filename}
                  className="flex items-center justify-between p-4 hover:bg-gray-50"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {backup.filename}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDate(backup.date)} · {backup.size}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 ml-3">
                    <button
                      onClick={() => downloadBackup(backup.filename)}
                      className="p-2 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                      title="下載備份"
                    >
                      <Download size={16} />
                    </button>
                    <button
                      onClick={() => deleteBackup(backup.filename)}
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                      title="刪除備份"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
