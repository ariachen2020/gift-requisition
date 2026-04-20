// 管理員分機號碼清單
// 這些分機可以存取禮品庫存管理後台
export const adminExtensions = [
  '8506',
  '8554',
]

export function isAdmin(extension: string): boolean {
  return adminExtensions.includes(extension)
}
