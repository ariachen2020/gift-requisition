import Link from 'next/link'
import { MapPin, Users, Info, Gift, Calendar, Settings, Database } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8 sm:mb-12 px-4">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
          內部服務系統
        </h1>
        <p className="text-base sm:text-lg text-gray-600">
          請選擇您要使用的功能
        </p>
      </div>

      {/* 功能選單 */}
      <div className="mb-8 px-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
          <a
            href="#meeting-rooms"
            className="flex items-center gap-3 p-4 bg-white rounded-lg shadow hover:shadow-md transition border border-gray-200 hover:border-primary-300"
          >
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">會議室預約</h3>
              <p className="text-sm text-gray-500">預約會議室時段</p>
            </div>
          </a>
          <Link
            href="/inventory"
            className="flex items-center gap-3 p-4 bg-white rounded-lg shadow hover:shadow-md transition border border-gray-200 hover:border-primary-300"
          >
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Gift className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">禮品領取</h3>
              <p className="text-sm text-gray-500">瀏覽及領取禮品</p>
            </div>
          </Link>
          <Link
            href="/admin/inventory"
            className="flex items-center gap-3 p-4 bg-white rounded-lg shadow hover:shadow-md transition border border-gray-200 hover:border-primary-300"
          >
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <Settings className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">庫存管理</h3>
              <p className="text-sm text-gray-500">管理員後台</p>
            </div>
          </Link>
          <Link
            href="/admin/backups"
            className="flex items-center gap-3 p-4 bg-white rounded-lg shadow hover:shadow-md transition border border-gray-200 hover:border-primary-300"
          >
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Database className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">資料備份</h3>
              <p className="text-sm text-gray-500">管理員後台</p>
            </div>
          </Link>
        </div>
      </div>

      {/* 會議室區塊標題 */}
      <div id="meeting-rooms" className="text-center mb-6 px-4 scroll-mt-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">會議室預約</h2>
      </div>

      {/* 使用說明 */}
      <div className="mb-6 sm:mb-8 px-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-6">
          <div className="flex items-start space-x-3">
            <Info className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-base sm:text-lg font-semibold text-blue-900 mb-2 sm:mb-3">
                使用說明
              </h3>
              <ul className="space-y-2 text-sm sm:text-base text-blue-800">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span><strong>新增預約：</strong>選擇會議室後，點擊日期和時段，填寫分機號碼即可預約</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span><strong>時間重疊檢測：</strong>預約時若與現有預約時間重疊（包括部分重疊），系統會顯示衝突警示，列出重疊預約的分機和預約時間</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span><strong>允許重疊預約：</strong>衝突警示出現時，可選擇「仍要預約」以允許時段重疊，系統會自動分配預約順序</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span><strong>預約順序顯示：</strong>同時段的多個預約會顯示順序號（1、2、3...），以及各自的預約時間（精確到秒）</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span><strong>循環預約：</strong>勾選「循環預約」可建立重複預約（每日/每週/每月）</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span><strong>刪除預約：</strong>點擊預約右側的「刪除」按鈕，輸入分機號碼驗證身份</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span><strong>批次刪除：</strong>刪除循環預約時，可勾選「刪除所有循環預約」一次移除整組</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span><strong>注意事項：</strong>只能刪除當天或未來的預約，分機號碼需與預約時相同</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 md:gap-8 max-w-2xl mx-auto px-4">
        <Link
          href="/room/A"
          className="group block p-6 sm:p-8 bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-blue-300"
        >
          <div className="flex flex-col items-center text-center">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-blue-100 rounded-full flex items-center justify-center mb-3 sm:mb-4 group-hover:bg-blue-200 transition-colors">
              <MapPin className="w-7 h-7 sm:w-8 sm:h-8 text-blue-600" />
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">
              會議室 1
            </h2>
            <p className="text-sm sm:text-base text-gray-600">
              點擊查看預約狀況
            </p>
          </div>
        </Link>

        <Link
          href="/room/B"
          className="group block p-6 sm:p-8 bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-blue-300"
        >
          <div className="flex flex-col items-center text-center">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-blue-100 rounded-full flex items-center justify-center mb-3 sm:mb-4 group-hover:bg-blue-200 transition-colors">
              <Users className="w-7 h-7 sm:w-8 sm:h-8 text-blue-600" />
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">
              會議室 2
            </h2>
            <p className="text-sm sm:text-base text-gray-600">
              點擊查看預約狀況
            </p>
          </div>
        </Link>
      </div>
    </div>
  )
}