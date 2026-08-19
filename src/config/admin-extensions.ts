// 管理員分機號碼清單
// 這些分機可以存取公務禮品庫存管理後台與備份管理
export const adminExtensions = [
  '8548',
]

export function isAdmin(extension: string): boolean {
  return adminExtensions.includes(extension)
}
