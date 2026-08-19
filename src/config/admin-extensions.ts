import { ALLOWED_EXTENSIONS } from './allowed-extensions'

// 管理員分機號碼清單
// 這些分機可以存取禮品庫存管理後台與備份管理
// 目前所有白名單分機都是管理員；若日後要區分，改成自己列清單即可
export const adminExtensions: string[] = [...ALLOWED_EXTENSIONS]

export function isAdmin(extension: string): boolean {
  return adminExtensions.includes(extension)
}
