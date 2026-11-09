import { computed, reactive, ref } from 'vue'
import { defineStore } from 'pinia'
import { storage } from '@/services/storage'
import { createId } from '@/utils/id'

const OWNER_STORAGE_KEY = 'home-wardrobe:owner'

/**
 * 读取上次选择的归属人
 * @returns {'me'|'wife'}
 */
function readLastOwner() {
  const saved = localStorage.getItem(OWNER_STORAGE_KEY)
  return saved === 'wife' ? 'wife' : 'me'
}

/**
 * 衣柜数据 store
 */
export const useWardrobeStore = defineStore('wardrobe', () => {
  /** @type {import('vue').Ref<Array<object>>} */
  const clothes = ref([])
  const loading = ref(false)
  const loaded = ref(false)

  /** 列表筛选条件 */
  const filters = reactive({
    owner: readLastOwner(),
    keyword: '',
    categoryId: '',
    subCategoryId: '',
    seasons: /** @type {string[]} */ ([]),
    status: ''
  })

  const ownerCounts = computed(() => ({
    me: clothes.value.filter((item) => item.owner === 'me').length,
    wife: clothes.value.filter((item) => item.owner === 'wife').length
  }))

  const filteredClothes = computed(() => {
    const keyword = filters.keyword.trim().toLowerCase()

    return clothes.value.filter((item) => {
      if (item.owner !== filters.owner) return false
      if (filters.categoryId && item.categoryId !== filters.categoryId) return false
      if (filters.subCategoryId && item.subCategoryId !== filters.subCategoryId) return false
      if (filters.status && item.status !== filters.status) return false
      if (
        filters.seasons.length > 0 &&
        !filters.seasons.some((season) => (item.seasons || []).includes(season))
      ) {
        return false
      }
      if (keyword) {
        const haystack = [item.name, item.brand, item.color, item.location]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        if (!haystack.includes(keyword)) return false
      }
      return true
    })
  })

  const hasActiveFilters = computed(
    () =>
      Boolean(filters.categoryId) ||
      Boolean(filters.subCategoryId) ||
      Boolean(filters.status) ||
      filters.seasons.length > 0 ||
      Boolean(filters.keyword.trim())
  )

  /**
   * 加载全部衣物
   * @param {boolean} [force]
   * @returns {Promise<void>}
   */
  async function load(force = false) {
    if (loaded.value && !force) return
    loading.value = true
    try {
      clothes.value = await storage.listClothing()
      loaded.value = true
    } finally {
      loading.value = false
    }
  }

  /**
   * 切换归属人（记住选择）
   * @param {'me'|'wife'} owner
   */
  function setOwner(owner) {
    filters.owner = owner
    filters.categoryId = ''
    filters.subCategoryId = ''
    localStorage.setItem(OWNER_STORAGE_KEY, owner)
  }

  /**
   * 切换一级类别，同时清空二级类别
   * @param {string} categoryId
   */
  function setCategory(categoryId) {
    filters.categoryId = categoryId
    filters.subCategoryId = ''
  }

  /**
   * 清除筛选条件（保留归属人）
   */
  function clearFilters() {
    filters.keyword = ''
    filters.categoryId = ''
    filters.subCategoryId = ''
    filters.seasons = []
    filters.status = ''
  }

  /**
   * 查询单件衣物
   * @param {string} id
   * @returns {object|undefined}
   */
  function getCloth(id) {
    return clothes.value.find((item) => item.id === id)
  }

  /**
   * 新增或更新衣物
   * @param {object} payload
   * @returns {Promise<object>} 写入后的记录
   */
  async function saveCloth(payload) {
    const existing = payload.id ? getCloth(payload.id) : undefined
    const record = {
      owner: 'me',
      categoryId: '',
      subCategoryId: '',
      name: '',
      color: '',
      seasons: [],
      occasions: [],
      thickness: '',
      size: '',
      location: '',
      status: 'active',
      brand: '',
      price: null,
      purchaseDate: '',
      photo: '',
      photoThumb: '',
      ...payload,
      id: payload.id || createId('cloth-')
    }

    // 新选的照片还是 dataURL，先传到对象存储；数据库里只保留图片地址
    let photo = record.photo || ''
    let photoThumb = record.photoThumb || ''
    if (photo.startsWith('data:')) {
      try {
        const uploaded = await storage.uploadPhoto({ dataUrl: photo, key: record.id })
        if (uploaded) {
          photo = uploaded.photo
          photoThumb = uploaded.photoThumb
        }
      } catch (error) {
        console.error('[wardrobe] 照片上传失败', error)
        throw new Error('照片上传失败，请检查网络后重试')
      }
    } else if (photo && existing?.photo === photo) {
      photoThumb = existing.photoThumb || ''
    } else if (!photo) {
      photoThumb = ''
    }

    const saved = await storage.saveClothing(
      // 深拷贝一次，避免把 Vue 的响应式代理写进 IndexedDB（结构化克隆不支持 Proxy）
      JSON.parse(
        JSON.stringify({
          ...record,
          photo,
          photoThumb,
          createdAt: existing?.createdAt || new Date().toISOString()
        })
      )
    )

    // 换过照片就物理删掉旧图，不占存储空间
    if (existing?.photo && existing.photo !== saved.photo) {
      await storage.deletePhoto([existing.photo, existing.photoThumb])
    }

    const index = clothes.value.findIndex((item) => item.id === saved.id)
    if (index >= 0) {
      clothes.value.splice(index, 1, saved)
    } else {
      clothes.value.unshift(saved)
    }
    clothes.value.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''))
    return saved
  }

  /**
   * 删除衣物
   * @param {string} id
   * @returns {Promise<void>}
   */
  async function removeCloth(id) {
    await storage.deleteClothing(id)
    clothes.value = clothes.value.filter((item) => item.id !== id)
  }

  return {
    clothes,
    loading,
    loaded,
    filters,
    ownerCounts,
    filteredClothes,
    hasActiveFilters,
    load,
    setOwner,
    setCategory,
    clearFilters,
    getCloth,
    saveCloth,
    removeCloth
  }
})
