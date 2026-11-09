/**
 * 展示格式化工具
 */

/**
 * 格式化价格
 * @param {number|null|string} price
 * @returns {string} 例如 "¥ 299"
 */
export function formatPrice(price) {
  if (price === null || price === undefined || price === '') return ''
  const value = Number(price)
  if (Number.isNaN(value)) return ''
  return `¥${value % 1 === 0 ? value : value.toFixed(2)}`
}

/**
 * 格式化时间（ISO 字符串）
 * @param {string} iso
 * @returns {string} 例如 "2026.11.09"
 */
export function formatDate(iso) {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${date.getFullYear()}.${month}.${day}`
}

/**
 * 把季节数组转成展示文案
 * @param {string[]} seasons
 * @param {Array<{ value: string, label: string }>} options
 * @returns {string}
 */
export function joinLabels(values, options, separator = ' · ') {
  if (!Array.isArray(values) || values.length === 0) return ''
  return values
    .map((value) => options.find((item) => item.value === value)?.label || '')
    .filter(Boolean)
    .join(separator)
}
