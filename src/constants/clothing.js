/**
 * 衣物业务常量：归属人、季节、场合、厚度、状态、颜色、尺码、存放位置
 * 统一使用 value 存储、label 展示，方便之后做推荐算法时按值处理。
 */

/** 归属人 */
export const OWNERS = [
  { value: 'me', label: '孙理想' },
  { value: 'wife', label: '张雨' }
]

/** @type {Record<string, string>} */
export const OWNER_LABELS = {
  me: '孙理想',
  wife: '张雨'
}

/** 季节（可多选） */
export const SEASONS = [
  { value: 'spring', label: '春' },
  { value: 'summer', label: '夏' },
  { value: 'autumn', label: '秋' },
  { value: 'winter', label: '冬' }
]

/** 场合（可多选） */
export const OCCASIONS = [
  { value: 'commute', label: '通勤' },
  { value: 'casual', label: '休闲' },
  { value: 'sport', label: '运动' },
  { value: 'date', label: '约会' },
  { value: 'formal', label: '正式' }
]

/** 厚度 */
export const THICKNESS = [
  { value: 'thin', label: '薄' },
  { value: 'medium', label: '适中' },
  { value: 'thick', label: '厚' }
]

/** 使用状态 */
export const CLOTHING_STATUS = [
  { value: 'active', label: '在用' },
  { value: 'idle', label: '闲置' },
  { value: 'retire', label: '待淘汰' }
]

/** 颜色快选，value 直接作为展示文案存储 */
export const COLORS = [
  { value: '黑色', label: '黑色', hex: '#1f1f21' },
  { value: '白色', label: '白色', hex: '#f5f3ee' },
  { value: '奶白', label: '奶白', hex: '#f7f2e6' },
  { value: '米色', label: '米色', hex: '#e6ddc9' },
  { value: '杏色', label: '杏色', hex: '#f2e2cf' },
  { value: '灰色', label: '灰色', hex: '#9a9a98' },
  { value: '浅灰', label: '浅灰', hex: '#cbcbca' },
  { value: '深灰', label: '深灰', hex: '#54545a' },
  { value: '卡其', label: '卡其', hex: '#c2ab89' },
  { value: '棕色', label: '棕色', hex: '#83543a' },
  { value: '驼色', label: '驼色', hex: '#c19a70' },
  { value: '奶茶色', label: '奶茶色', hex: '#d9c3ab' },
  { value: '焦糖色', label: '焦糖色', hex: '#a86b3f' },
  { value: '酒红', label: '酒红', hex: '#77303c' },
  { value: '红色', label: '红色', hex: '#c1402f' },
  { value: '玫红', label: '玫红', hex: '#e3487a' },
  { value: '粉色', label: '粉色', hex: '#e4a4b4' },
  { value: '藕粉', label: '藕粉', hex: '#eec9d4' },
  { value: '豆沙色', label: '豆沙色', hex: '#b56a72' },
  { value: '橙色', label: '橙色', hex: '#d4823f' },
  { value: '黄色', label: '黄色', hex: '#ddb647' },
  { value: '绿色', label: '绿色', hex: '#5f7d58' },
  { value: '军绿', label: '军绿', hex: '#6b6d4e' },
  { value: '薄荷绿', label: '薄荷绿', hex: '#a8d8c0' },
  { value: '藏青', label: '藏青', hex: '#2b3a54' },
  { value: '蓝色', label: '蓝色', hex: '#4a79a2' },
  { value: '牛仔蓝', label: '牛仔蓝', hex: '#6f89a6' },
  { value: '紫色', label: '紫色', hex: '#77599c' },
  { value: '银色', label: '银色', hex: '#c6c9ce' },
  { value: '金色', label: '金色', hex: '#c3a35e' },
  { value: '花色', label: '花色', hex: 'linear-gradient(135deg,#d8b4a0,#8eaa93,#9aa7c4)' }
]

/** 颜色值 → 色块样式（用于卡片上的小圆点） */
export function colorSwatchStyle(color) {
  const matched = COLORS.find((item) => item.value === color)
  return matched ? { background: matched.hex } : { background: 'transparent' }
}

/** 尺码下拉的常见选项（允许自由输入） */
export const SIZE_OPTIONS = [
  'XXS',
  'XS',
  'S',
  'M',
  'L',
  'XL',
  'XXL',
  '3XL',
  '均码',
  '34',
  '35',
  '36',
  '37',
  '38',
  '39',
  '40',
  '41',
  '42',
  '43',
  '44',
  '45',
  '46',
  '90cm',
  '100cm',
  '110cm',
  '120cm',
  'S/M',
  'M/L'
]

/** 存放位置建议（允许自由输入） */
export const LOCATION_OPTIONS = [
  '衣柜上层',
  '衣柜中层',
  '衣柜下层',
  '挂衣区',
  '抽屉',
  '衣帽间',
  '玄关柜',
  '鞋柜',
  '床下收纳箱'
]

/**
 * 从选项中取展示文案
 * @param {Array<{ value: string, label: string }>} options
 * @param {string} value
 * @param {string} [fallback]
 * @returns {string}
 */
export function labelOf(options, value, fallback = '') {
  if (!value) return fallback
  return options.find((item) => item.value === value)?.label || fallback || value
}
