/**
 * 允許使用禮品領用系統的分機號碼清單
 * 只有此清單中的分機號碼可以進入系統填寫領用單
 */
export const ALLOWED_EXTENSIONS = [
  '8541',
  '8542',
  '8543',
  '8545',
  '8546',
  '8547',
  '8548',
] as const

/**
 * 檢查分機號碼是否在允許清單中
 */
export function isExtensionAllowed(extension: string): boolean {
  return ALLOWED_EXTENSIONS.includes(extension as any)
}
