'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { ArrowLeft, ShoppingCart, Plus, Minus, X, Package, FileDown } from 'lucide-react'
import { Item, CartItem, ItemRequestItem, DEPARTMENTS } from '@/types'
import { isExtensionAllowed } from '@/config/allowed-extensions'

export default function InventoryPage() {
  const [step, setStep] = useState<'extension' | 'browse' | 'confirm' | 'receipt'>('extension')
  const [extension, setExtension] = useState('')
  const [extensionError, setExtensionError] = useState('')
  const [department, setDepartment] = useState('')
  const [items, setItems] = useState<Item[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [receiptData, setReceiptData] = useState<{
    id: number
    extension: string
    department: string
    items: ItemRequestItem[]
    createdAt: string
  } | null>(null)
  const receiptRef = useRef<HTMLDivElement>(null)

  // 驗證分機並進入下一步
  const handleExtensionSubmit = () => {
    const trimmed = extension.trim()
    if (!trimmed) {
      setExtensionError('請輸入分機號碼')
      return
    }
    if (!isExtensionAllowed(trimmed)) {
      setExtensionError('此分機號碼不在系統允許的清單中')
      return
    }
    setExtensionError('')
    setStep('browse')
  }

  // 取得商品列表
  useEffect(() => {
    if (step === 'browse') {
      fetchItems()
    }
  }, [step])

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

  // 取得所有分類
  const categories = Array.from(new Set(items.map(item => item.category).filter(Boolean))) as string[]

  // 篩選商品
  const filteredItems = items.filter(item => {
    const matchSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchCategory = !selectedCategory || item.category === selectedCategory
    return matchSearch && matchCategory
  })

  // 購物車操作
  const addToCart = (item: Item) => {
    const existing = cart.find(c => c.itemId === item.id)
    if (existing) {
      if (existing.quantity < item.quantity) {
        setCart(cart.map(c =>
          c.itemId === item.id ? { ...c, quantity: c.quantity + 1 } : c
        ))
      }
    } else {
      setCart([...cart, {
        itemId: item.id,
        name: item.name,
        quantity: 1,
        maxQuantity: item.quantity,
      }])
    }
  }

  const removeFromCart = (itemId: number) => {
    const existing = cart.find(c => c.itemId === itemId)
    if (existing && existing.quantity > 1) {
      setCart(cart.map(c =>
        c.itemId === itemId ? { ...c, quantity: c.quantity - 1 } : c
      ))
    } else {
      setCart(cart.filter(c => c.itemId !== itemId))
    }
  }

  const clearCart = () => {
    setCart([])
  }

  const getCartQuantity = (itemId: number) => {
    return cart.find(c => c.itemId === itemId)?.quantity || 0
  }

  const totalItems = cart.reduce((sum, c) => sum + c.quantity, 0)

  // 提交領取申請
  const handleSubmit = async () => {
    if (!department) {
      setError('請選擇部門')
      return
    }

    try {
      setLoading(true)
      setError('')

      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          extension,
          department,
          items: cart.map(c => ({
            itemId: c.itemId,
            name: c.name,
            quantity: c.quantity,
          })),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || '申請失敗')
      }

      setReceiptData({
        ...data,
        createdAt: new Date(data.createdAt).toLocaleString('zh-TW'),
      })
      setStep('receipt')
    } catch (err) {
      setError(err instanceof Error ? err.message : '發生錯誤')
    } finally {
      setLoading(false)
    }
  }

  // 產生 PDF
  const handleGeneratePDF = () => {
    if (!receiptData) return

    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const itemsRows = receiptData.items.map((item, index) => `
      <tr>
        <td style="border: 1px solid #333; padding: 10px; text-align: center;">${index + 1}</td>
        <td style="border: 1px solid #333; padding: 10px;">${item.name}</td>
        <td style="border: 1px solid #333; padding: 10px; text-align: center;">${item.quantity}</td>
      </tr>
    `).join('')

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>禮品領用單 - ${receiptData.id}</title>
          <style>
            @page {
              size: A4;
              margin: 20mm;
            }
            body {
              font-family: "Microsoft JhengHei", "微軟正黑體", sans-serif;
              padding: 0;
              margin: 0;
              color: #333;
            }
            .container {
              max-width: 700px;
              margin: 0 auto;
            }
            h1 {
              text-align: center;
              margin-bottom: 30px;
              font-size: 28px;
              border-bottom: 2px solid #333;
              padding-bottom: 15px;
            }
            .info-section {
              display: flex;
              flex-wrap: wrap;
              gap: 20px;
              margin-bottom: 25px;
            }
            .info-item {
              flex: 1;
              min-width: 200px;
            }
            .info-label {
              font-weight: bold;
              color: #555;
              font-size: 14px;
            }
            .info-value {
              font-size: 16px;
              margin-top: 5px;
              padding: 8px;
              background: #f5f5f5;
              border-radius: 4px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th {
              background-color: #4a5568;
              color: white;
              padding: 12px;
              text-align: left;
              border: 1px solid #333;
            }
            th:first-child { width: 60px; text-align: center; }
            th:last-child { width: 80px; text-align: center; }
            td {
              border: 1px solid #333;
              padding: 10px;
            }
            .signature-section {
              margin-top: 50px;
              display: flex;
              justify-content: space-between;
            }
            .signature-box {
              width: 200px;
              text-align: center;
            }
            .signature-line {
              border-bottom: 1px solid #333;
              height: 60px;
              margin-bottom: 10px;
            }
            .signature-label {
              font-size: 14px;
              color: #555;
            }
            .footer {
              margin-top: 40px;
              text-align: center;
              font-size: 12px;
              color: #888;
              border-top: 1px solid #ddd;
              padding-top: 15px;
            }
            .receipt-id {
              position: absolute;
              top: 20px;
              right: 20px;
              font-size: 12px;
              color: #888;
            }
            @media print {
              body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="receipt-id">單號：${String(receiptData.id).padStart(6, '0')}</div>
            <h1>禮品領用單</h1>

            <div class="info-section">
              <div class="info-item">
                <div class="info-label">領用日期</div>
                <div class="info-value">${receiptData.createdAt}</div>
              </div>
              <div class="info-item">
                <div class="info-label">領用分機</div>
                <div class="info-value">${receiptData.extension}</div>
              </div>
              <div class="info-item">
                <div class="info-label">所屬部門</div>
                <div class="info-value">${receiptData.department}</div>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>項次</th>
                  <th>品項名稱</th>
                  <th>數量</th>
                </tr>
              </thead>
              <tbody>
                ${itemsRows}
              </tbody>
            </table>

            <div class="signature-section">
              <div class="signature-box">
                <div class="signature-line"></div>
                <div class="signature-label">領用人簽章</div>
              </div>
              <div class="signature-box">
                <div class="signature-line"></div>
                <div class="signature-label">主管簽章</div>
              </div>
              <div class="signature-box">
                <div class="signature-line"></div>
                <div class="signature-label">管理員簽章</div>
              </div>
            </div>

            <div class="footer">
              此單據由系統自動產生，請妥善保管
            </div>
          </div>
        </body>
      </html>
    `)
    printWindow.document.close()

    // 等待內容載入後自動開啟列印
    printWindow.onload = () => {
      printWindow.print()
    }
  }

  // 重新開始
  const handleReset = () => {
    setStep('extension')
    setExtension('')
    setExtensionError('')
    setDepartment('')
    setCart([])
    setReceiptData(null)
    setSearchTerm('')
    setSelectedCategory('')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <h1 className="text-xl font-bold text-gray-900">禮品領取</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Step 1: 輸入分機 */}
        {step === 'extension' && (
          <div className="bg-white rounded-lg shadow p-6 max-w-md mx-auto">
            <h2 className="text-lg font-semibold mb-4">請輸入您的分機號碼</h2>
            <input
              type="text"
              value={extension}
              onChange={(e) => {
                setExtension(e.target.value)
                setExtensionError('')
              }}
              placeholder="例如：8501"
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                extensionError ? 'border-red-500' : ''
              }`}
              onKeyDown={(e) => e.key === 'Enter' && handleExtensionSubmit()}
              autoFocus
            />
            {extensionError && (
              <p className="mt-2 text-red-500 text-sm">{extensionError}</p>
            )}
            <button
              onClick={handleExtensionSubmit}
              disabled={!extension.trim()}
              className="w-full mt-4 px-4 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
            >
              開始選購
            </button>
          </div>
        )}

        {/* Step 2: 瀏覽商品 */}
        {step === 'browse' && (
          <div className="space-y-4">
            {/* 搜尋和篩選 */}
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="搜尋商品..."
                  className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
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
              </div>
            </div>

            {/* 商品列表 */}
            {loading ? (
              <div className="text-center py-8 text-gray-500">載入中...</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredItems.map(item => (
                  <div key={item.id} className="bg-white rounded-lg shadow overflow-hidden">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-40 object-cover"
                      />
                    ) : (
                      <div className="w-full h-40 bg-gray-100 flex items-center justify-center">
                        <Package className="w-12 h-12 text-gray-300" />
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="font-medium text-gray-900">{item.name}</h3>
                      {item.category && (
                        <span className="text-sm text-gray-500">{item.category}</span>
                      )}
                      <div className="mt-2 flex items-center justify-between">
                        <span className={`text-sm ${item.quantity > 0 ? 'text-green-600' : 'text-red-500'}`}>
                          {item.quantity > 0 ? `剩餘 ${item.quantity} 個` : '已無庫存'}
                        </span>
                        {item.quantity > 0 && (
                          <div className="flex items-center gap-2">
                            {getCartQuantity(item.id) > 0 ? (
                              <>
                                <button
                                  onClick={() => removeFromCart(item.id)}
                                  className="p-1 rounded-full bg-gray-200 hover:bg-gray-300"
                                >
                                  <Minus className="w-4 h-4" />
                                </button>
                                <span className="w-8 text-center font-medium">
                                  {getCartQuantity(item.id)}
                                </span>
                                <button
                                  onClick={() => addToCart(item)}
                                  disabled={getCartQuantity(item.id) >= item.quantity}
                                  className="p-1 rounded-full bg-primary-500 text-white hover:bg-primary-600 disabled:bg-gray-300"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => addToCart(item)}
                                className="px-3 py-1 bg-primary-500 text-white text-sm rounded-lg hover:bg-primary-600"
                              >
                                加入
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {filteredItems.length === 0 && !loading && (
              <div className="text-center py-8 text-gray-500">
                沒有找到符合條件的商品
              </div>
            )}

            {/* 購物車浮動按鈕 */}
            {totalItems > 0 && (
              <div className="fixed bottom-6 right-6 flex gap-3">
                <button
                  onClick={clearCart}
                  className="p-4 bg-gray-500 text-white rounded-full shadow-lg hover:bg-gray-600"
                  title="清空購物車"
                >
                  <X className="w-6 h-6" />
                </button>
                <button
                  onClick={() => setStep('confirm')}
                  className="flex items-center gap-2 px-6 py-4 bg-primary-500 text-white rounded-full shadow-lg hover:bg-primary-600"
                >
                  <ShoppingCart className="w-6 h-6" />
                  <span className="font-medium">確認領取 ({totalItems})</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 3: 確認領取 */}
        {step === 'confirm' && (
          <div className="bg-white rounded-lg shadow p-6 max-w-md mx-auto">
            <h2 className="text-lg font-semibold mb-4">確認領取清單</h2>

            <div className="space-y-3 mb-6">
              {cart.map(item => (
                <div key={item.itemId} className="flex items-center justify-between py-2 border-b">
                  <span className="text-gray-900">{item.name}</span>
                  <span className="font-medium">x {item.quantity}</span>
                </div>
              ))}
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  分機號碼
                </label>
                <input
                  type="text"
                  value={extension}
                  disabled
                  className="w-full px-4 py-2 bg-gray-100 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  所屬部門 <span className="text-red-500">*</span>
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">請選擇部門</option>
                  {DEPARTMENTS.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setStep('browse')
                  setError('')
                }}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                返回修改
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:bg-gray-300"
              >
                {loading ? '處理中...' : '確認送出'}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: 領取單 */}
        {step === 'receipt' && receiptData && (
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900">領取申請完成！</h2>
                <p className="text-gray-500 mt-1">單號：{String(receiptData.id).padStart(6, '0')}</p>
              </div>

              <div ref={receiptRef} className="space-y-3 mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between">
                  <span className="text-gray-500">領用日期</span>
                  <span className="font-medium">{receiptData.createdAt}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">領用分機</span>
                  <span className="font-medium">{receiptData.extension}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">所屬部門</span>
                  <span className="font-medium">{receiptData.department}</span>
                </div>
                <div className="border-t pt-3 mt-3">
                  <div className="text-gray-500 mb-2">領取品項</div>
                  {receiptData.items.map((item, index) => (
                    <div key={index} className="flex justify-between py-1">
                      <span>{item.name}</span>
                      <span>x {item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-sm text-gray-500 text-center mb-4">
                請下載 PDF 並列印，攜帶至指定地點簽核領取
              </p>
            </div>

            <div className="flex gap-3 mt-4">
              <button
                onClick={handleGeneratePDF}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
              >
                <FileDown className="w-5 h-5" />
                下載 PDF
              </button>
              <button
                onClick={handleReset}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                完成
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
