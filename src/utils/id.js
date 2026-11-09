/**
 * 生成本地唯一 id
 * @param {string} [prefix]
 * @returns {string}
 */
export function createId(prefix = '') {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}${crypto.randomUUID()}`
  }
  return `${prefix}${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}
