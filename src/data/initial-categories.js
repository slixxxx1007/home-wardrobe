/**
 * 内置分类初始数据。
 * 存储层初始化时，若分类表为空则写入这些数据；
 * 页面不直接写死分类，之后改名 / 停用都只影响存储。
 */
export const INITIAL_CATEGORY_TREE = [
  {
    id: 'top',
    name: '上装',
    subs: ['T恤', 'Polo衫', '衬衫', '针织衫', '毛衣', '卫衣', '背心', '吊带', '打底衫']
  },
  {
    id: 'bottom',
    name: '下装',
    subs: ['牛仔裤', '休闲裤', '西裤', '运动裤', '短裤', '打底裤', '半身裙']
  },
  {
    id: 'dress',
    name: '连衣裙/套装',
    subs: ['连衣裙', '吊带裙', '衬衫裙', '礼服裙', '套装']
  },
  {
    id: 'outer',
    name: '外套',
    subs: ['大衣', '风衣', '羽绒服', '棉服', '夹克', '西装外套', '皮衣', '马甲']
  },
  {
    id: 'inner',
    name: '内衣/家居',
    subs: ['文胸', '内裤', '袜子', '睡衣', '家居服', '保暖内衣', '泳衣']
  },
  {
    id: 'shoes',
    name: '鞋',
    subs: [
      '运动鞋',
      '板鞋',
      '帆布鞋',
      '皮鞋',
      '乐福鞋',
      '高跟鞋',
      '单鞋',
      '凉鞋',
      '拖鞋',
      '短靴',
      '长靴',
      '雪地靴'
    ]
  },
  {
    id: 'bags',
    name: '包',
    subs: ['双肩包', '单肩包', '斜挎包', '手提包', '托特包', '腰包', '行李箱']
  },
  {
    id: 'accessory',
    name: '配饰',
    subs: ['帽子', '围巾', '手套', '腰带', '墨镜', '首饰', '领带']
  },
  {
    id: 'other',
    name: '其他',
    subs: ['其他']
  }
]

/**
 * 展开成扁平分类记录
 * @returns {Array<{ id: string, name: string, parentId: string|null, sortOrder: number, active: boolean, createdAt: string, updatedAt: string }>}
 */
export function buildInitialCategories() {
  const now = new Date().toISOString()
  const records = []

  INITIAL_CATEGORY_TREE.forEach((primary, primaryIndex) => {
    records.push({
      id: `cat-${primary.id}`,
      name: primary.name,
      parentId: null,
      sortOrder: primaryIndex,
      active: true,
      createdAt: now,
      updatedAt: now
    })

    primary.subs.forEach((name, subIndex) => {
      records.push({
        id: `cat-${primary.id}-${subIndex + 1}`,
        name,
        parentId: `cat-${primary.id}`,
        sortOrder: subIndex,
        active: true,
        createdAt: now,
        updatedAt: now
      })
    })
  })

  return records
}
