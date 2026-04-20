'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, Pencil, Trash2, Package, Search, FileText, Download } from 'lucide-react'
import { isAdmin } from '@/config/admin-extensions'
import { Item, ItemRequest, DEPARTMENTS } from '@/types'

type Tab = 'items' | 'reports'

interface ItemFormData {
  name: string
  category: string
  quantity: number
  imageUrl: string
}

export default function AdminInventoryPage() {
  const [isAuthed, setIsAuthed] = useState(false)
  const [extension, setExtension] = useState('')
  const [authError, setAuthError] = useState('')

  const [activeTab, setActiveTab] = useState<Tab>('items')
  const [items, setItems] = useState<Item[]>([])
  const [requests, setRequests] = useState<ItemRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // 商品篩選
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')

  // Modal 狀態
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState<Item | null>(null)
  const [formData, setFormData] = useState<ItemFormData>({
    name: '',
    category: '',
    quantity: 0,
    imageUrl: '',
  })

  // 報表篩選
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [selectedDepartment, setSelectedDepartment] = useState('')

  // 驗證管理員身份
  const handleAuth = () => {
    if (isAdmin(extension)) {
      setIsAuthed(true)
      setAuthError('')
    } else {
      setAuthError('此分機無管理權限')
    }
  }

  // 取得商品列表
  const fetchItems = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/items')
      if (!res.ok) throw new Error('取得商品失敗')
      const data = await res.json()
      setItems(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '發生錯誤')
    } finally {
      setLoading(false)
    }
  }

  // 取得領取紀錄
  const fetchRequests = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/requests?extension=${extension}&month=${selectedMonth}`)
      if (!res.ok) throw new Error('取得紀錄失敗')
      const data = await res.json()
      setRequests(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '發生錯誤')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthed) {
      if (activeTab === 'items') {
        fetchItems()
      } else {
        fetchRequests()
      }
    }
  }, [isAuthed, activeTab, selectedMonth])

  // 取得所有分類
  const categories = Array.from(new Set(items.map(item => item.category).filter(Boolean))) as string[]

  // 篩選商品
  const filteredItems = items.filter(item => {
    const matchSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchCategory = !selectedCategory || item.category === selectedCategory
    return matchSearch && matchCategory
  })

  // 篩選報表（按部門）
  const filteredRequests = requests.filter(req => {
    return !selectedDepartment || req.department === selectedDepartment
  })

  // 開啟新增/編輯 Modal
  const openModal = (item?: Item) => {
    if (item) {
      setEditingItem(item)
      setFormData({
        name: item.name,
        category: item.category || '',
        quantity: item.quantity,
        imageUrl: item.imageUrl || '',
      })
    } else {
      setEditingItem(null)
      setFormData({ name: '', category: '', quantity: 0, imageUrl: '' })
    }
    setShowModal(true)
  }

  // 儲存商品
  const handleSave = async () => {
    if (!formData.name.trim()) {
      setError('請輸入商品名稱')
      return
    }

    try {
      setLoading(true)
      setError('')

      const url = editingItem ? `/api/items/${editingItem.id}` : '/api/items'
      const method = editingItem ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, extension }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || '儲存失敗')
      }

      setShowModal(false)
      fetchItems()
    } catch (err) {
      setError(err instanceof Error ? err.message : '發生錯誤')
    } finally {
      setLoading(false)
    }
  }

  // 刪除商品
  const handleDelete = async (item: Item) => {
    if (!confirm(`確定要刪除「${item.name}」嗎？`)) return

    try {
      setLoading(true)
      const res = await fetch(`/api/items/${item.id}?extension=${extension}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || '刪除失敗')
      }

      fetchItems()
    } catch (err) {
      setError(err instanceof Error ? err.message : '發生錯誤')
    } finally {
      setLoading(false)
    }
  }

  // 快速調整庫存
  const handleAdjustQuantity = async (item: Item, delta: number) => {
    const newQuantity = item.quantity + delta
    if (newQuantity < 0) return

    try {
      const res = await fetch(`/api/items/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: newQuantity, extension }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || '更新失敗')
      }

      fetchItems()
    } catch (err) {
      setError(err instanceof Error ? err.message : '發生錯誤')
    }
  }

  // 計算統計
  const statistics = {
    totalRequests: filteredRequests.length,
    totalItems: filteredRequests.reduce((sum, req) =>
      sum + req.items.reduce((s, i) => s + i.quantity, 0), 0
    ),
    byItem: filteredRequests.reduce((acc, req) => {
      req.items.forEach(item => {
        if (!acc[item.name]) acc[item.name] = 0
        acc[item.name] += item.quantity
      })
      return acc
    }, {} as Record<string, number>),
    byDepartment: requests.reduce((acc, req) => {
      if (!acc[req.department]) acc[req.department] = { count: 0, items: 0 }
      acc[req.department].count += 1
      acc[req.department].items += req.items.reduce((s, i) => s + i.quantity, 0)
      return acc
    }, {} as Record<string, { count: number; items: number }>),
  }

  // 匯出報表
  const handleExportReport = () => {
    const monthDisplay = selectedMonth.replace('-', '年') + '月'
    const deptDisplay = selectedDepartment || '全部門'

    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const deptRows = Object.entries(statistics.byDepartment)
      .sort((a, b) => b[1].items - a[1].items)
      .map(([dept, data]) => `
        <tr>
          <td style="border: 1px solid #333; padding: 10px;">${dept}</td>
          <td style="border: 1px solid #333; padding: 10px; text-align: center;">${data.count}</td>
          <td style="border: 1px solid #333; padding: 10px; text-align: center;">${data.items}</td>
        </tr>
      `).join('')

    const itemRows = Object.entries(statistics.byItem)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => `
        <tr>
          <td style="border: 1px solid #333; padding: 10px;">${name}</td>
          <td style="border: 1px solid #333; padding: 10px; text-align: center;">${count}</td>
        </tr>
      `).join('')

    const detailRows = filteredRequests.map(req => `
      <tr>
        <td style="border: 1px solid #333; padding: 8px; font-size: 12px;">${new Date(req.createdAt).toLocaleString('zh-TW')}</td>
        <td style="border: 1px solid #333; padding: 8px;">${req.extension}</td>
        <td style="border: 1px solid #333; padding: 8px;">${req.department}</td>
        <td style="border: 1px solid #333; padding: 8px;">${req.items.map(i => `${i.name} x${i.quantity}`).join('、')}</td>
      </tr>
    `).join('')

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>禮品領用月報表 - ${monthDisplay}</title>
          <style>
            @page { size: A4; margin: 15mm; }
            body {
              font-family: "Microsoft JhengHei", sans-serif;
              padding: 0;
              margin: 0;
              color: #333;
              font-size: 14px;
            }
            h1 { text-align: center; margin-bottom: 20px; font-size: 24px; }
            h2 { font-size: 18px; margin-top: 30px; margin-bottom: 15px; border-bottom: 2px solid #333; padding-bottom: 5px; }
            .meta { text-align: center; color: #666; margin-bottom: 20px; }
            .summary { display: flex; gap: 20px; margin-bottom: 20px; }
            .summary-box {
              flex: 1;
              background: #f5f5f5;
              padding: 15px;
              border-radius: 8px;
              text-align: center;
            }
            .summary-value { font-size: 28px; font-weight: bold; color: #333; }
            .summary-label { font-size: 12px; color: #666; margin-top: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th {
              background-color: #4a5568;
              color: white;
              padding: 10px;
              text-align: left;
              border: 1px solid #333;
            }
            td { border: 1px solid #333; padding: 8px; }
            .footer { margin-top: 30px; text-align: center; font-size: 11px; color: #888; }
            @media print {
              body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <h1>禮品領用月報表</h1>
          <div class="meta">報表期間：${monthDisplay} ｜ 篩選部門：${deptDisplay} ｜ 列印時間：${new Date().toLocaleString('zh-TW')}</div>

          <div class="summary">
            <div class="summary-box">
              <div class="summary-value">${statistics.totalRequests}</div>
              <div class="summary-label">總申請數</div>
            </div>
            <div class="summary-box">
              <div class="summary-value">${statistics.totalItems}</div>
              <div class="summary-label">總領取數量</div>
            </div>
            <div class="summary-box">
              <div class="summary-value">${Object.keys(statistics.byItem).length}</div>
              <div class="summary-label">商品種類</div>
            </div>
          </div>

          <h2>各部門領取統計</h2>
          <table>
            <thead>
              <tr>
                <th>部門</th>
                <th style="width: 100px; text-align: center;">申請次數</th>
                <th style="width: 100px; text-align: center;">領取數量</th>
              </tr>
            </thead>
            <tbody>
              ${deptRows || '<tr><td colspan="3" style="text-align: center; padding: 20px;">無資料</td></tr>'}
            </tbody>
          </table>

          <h2>各商品領取統計</h2>
          <table>
            <thead>
              <tr>
                <th>品項名稱</th>
                <th style="width: 100px; text-align: center;">領取數量</th>
              </tr>
            </thead>
            <tbody>
              ${itemRows || '<tr><td colspan="2" style="text-align: center; padding: 20px;">無資料</td></tr>'}
            </tbody>
          </table>

          <h2>詳細領取紀錄</h2>
          <table>
            <thead>
              <tr>
                <th style="width: 150px;">日期時間</th>
                <th style="width: 80px;">分機</th>
                <th style="width: 60px;">部門</th>
                <th>領取品項</th>
              </tr>
            </thead>
            <tbody>
              ${detailRows || '<tr><td colspan="4" style="text-align: center; padding: 20px;">無資料</td></tr>'}
            </tbody>
          </table>

          <div class="footer">此報表由系統自動產生</div>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.onload = () => {
      printWindow.print()
    }
  }

  // 身份驗證頁面
  if (!isAuthed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow p-6 w-full max-w-md">
          <h1 className="text-xl font-bold text-center mb-6">禮品庫存管理</h1>
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
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-gray-600 hover:text-gray-900">
                <ArrowLeft className="w-6 h-6" />
              </Link>
              <h1 className="text-xl font-bold text-gray-900">禮品庫存管理</h1>
            </div>
            <span className="text-sm text-gray-500">管理員：{extension}</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('items')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
              activeTab === 'items'
                ? 'bg-primary-500 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Package className="w-5 h-5" />
            商品管理
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
              activeTab === 'reports'
                ? 'bg-primary-500 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            <FileText className="w-5 h-5" />
            領取報表
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
            {error}
            <button onClick={() => setError('')} className="ml-2 underline">關閉</button>
          </div>
        )}

        {/* 商品管理 Tab */}
        {activeTab === 'items' && (
          <div className="space-y-4">
            {/* 工具列 */}
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="搜尋商品..."
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">所有分類</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <button
                  onClick={() => openModal()}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
                >
                  <Plus className="w-5 h-5" />
                  新增商品
                </button>
              </div>
            </div>

            {/* 商品列表 */}
            {loading ? (
              <div className="text-center py-8 text-gray-500">載入中...</div>
            ) : (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">商品</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">分類</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">庫存</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredItems.map(item => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                className="w-10 h-10 object-cover rounded"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                                <Package className="w-5 h-5 text-gray-300" />
                              </div>
                            )}
                            <span className="font-medium">{item.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          {item.category || '-'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleAdjustQuantity(item, -1)}
                              disabled={item.quantity <= 0}
                              className="p-1 rounded hover:bg-gray-200 disabled:opacity-50"
                            >
                              -
                            </button>
                            <span className={`w-12 text-center font-medium ${
                              item.quantity === 0 ? 'text-red-500' : ''
                            }`}>
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => handleAdjustQuantity(item, 1)}
                              className="p-1 rounded hover:bg-gray-200"
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openModal(item)}
                              className="p-2 text-gray-500 hover:text-primary-500 hover:bg-gray-100 rounded"
                              title="編輯"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(item)}
                              className="p-2 text-gray-500 hover:text-red-500 hover:bg-gray-100 rounded"
                              title="刪除"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredItems.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    沒有商品資料
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 報表 Tab */}
        {activeTab === 'reports' && (
          <div className="space-y-4">
            {/* 篩選工具列 */}
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-600">月份：</label>
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-600">部門：</label>
                  <select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">全部門</option>
                    {DEPARTMENTS.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1" />
                <button
                  onClick={handleExportReport}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <Download className="w-5 h-5" />
                  匯出報表
                </button>
              </div>
            </div>

            {/* 統計摘要 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg shadow p-4">
                <div className="text-sm text-gray-500">總申請數</div>
                <div className="text-2xl font-bold text-gray-900">{statistics.totalRequests}</div>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="text-sm text-gray-500">總領取數量</div>
                <div className="text-2xl font-bold text-gray-900">{statistics.totalItems}</div>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="text-sm text-gray-500">商品種類</div>
                <div className="text-2xl font-bold text-gray-900">
                  {Object.keys(statistics.byItem).length}
                </div>
              </div>
            </div>

            {/* 部門統計 */}
            {Object.keys(statistics.byDepartment).length > 0 && (
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="font-medium mb-3">各部門領取統計</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">部門</th>
                        <th className="px-4 py-2 text-center text-sm font-medium text-gray-600">申請次數</th>
                        <th className="px-4 py-2 text-center text-sm font-medium text-gray-600">領取數量</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {Object.entries(statistics.byDepartment)
                        .sort((a, b) => b[1].items - a[1].items)
                        .map(([dept, data]) => (
                          <tr key={dept} className="hover:bg-gray-50">
                            <td className="px-4 py-2 font-medium">{dept}</td>
                            <td className="px-4 py-2 text-center">{data.count}</td>
                            <td className="px-4 py-2 text-center font-medium">{data.items}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 商品統計 */}
            {Object.keys(statistics.byItem).length > 0 && (
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="font-medium mb-3">各商品領取統計</h3>
                <div className="space-y-2">
                  {Object.entries(statistics.byItem)
                    .sort((a, b) => b[1] - a[1])
                    .map(([name, count]) => (
                      <div key={name} className="flex items-center justify-between py-2 border-b last:border-0">
                        <span>{name}</span>
                        <span className="font-medium">{count} 個</span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* 詳細紀錄 */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <h3 className="font-medium p-4 border-b">詳細領取紀錄</h3>
              {loading ? (
                <div className="text-center py-8 text-gray-500">載入中...</div>
              ) : filteredRequests.length > 0 ? (
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">日期</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">分機</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">部門</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">品項</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredRequests.map(req => (
                      <tr key={req.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">
                          {new Date(req.createdAt).toLocaleString('zh-TW')}
                        </td>
                        <td className="px-4 py-3">{req.extension}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                            {req.department}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {req.items.map(item => `${item.name} x${item.quantity}`).join('、')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  此月份沒有領取紀錄
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* 新增/編輯 Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold">
                {editingItem ? '編輯商品' : '新增商品'}
              </h2>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  商品名稱 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  分類
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="例如：禮券、日用品"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  數量
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  圖片網址
                </label>
                <input
                  type="text"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="p-4 border-t flex gap-3 justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:bg-gray-300"
              >
                {loading ? '儲存中...' : '儲存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
