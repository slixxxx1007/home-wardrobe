import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { storage } from '@/services/storage'
import { createId } from '@/utils/id'

/**
 * 分类 store（一级 / 二级统一存放，parentId 为空即一级）
 */
export const useCategoryStore = defineStore('category', () => {
  /** @type {import('vue').Ref<Array<object>>} */
  const categories = ref([])
  const loading = ref(false)
  const loaded = ref(false)

  const primaryCategories = computed(() =>
    categories.value
      .filter((item) => !item.parentId)
      .slice()
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
  )

  const activePrimaryCategories = computed(() =>
    primaryCategories.value.filter((item) => item.active)
  )

  const subsByParent = computed(() => {
    /** @type {Record<string, Array<object>>} */
    const map = {}
    categories.value
      .filter((item) => item.parentId)
      .slice()
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
      .forEach((item) => {
        if (!map[item.parentId]) map[item.parentId] = []
        map[item.parentId].push(item)
      })
    return map
  })

  /**
   * 取某个一级类别下的二级类别
   * @param {string} parentId
   * @param {{ includeInactive?: boolean }} [options]
   * @returns {Array<object>}
   */
  function subsOf(parentId, { includeInactive = false } = {}) {
    const list = subsByParent.value[parentId] || []
    return includeInactive ? list : list.filter((item) => item.active)
  }

  /**
   * 按 id 查分类
   * @param {string} id
   * @returns {object|undefined}
   */
  function findById(id) {
    return categories.value.find((item) => item.id === id)
  }

  /**
   * 按 id 查分类名（包含已停用，用于详情展示）
   * @param {string} id
   * @param {string} [fallback]
   * @returns {string}
   */
  function nameOf(id, fallback = '未分类') {
    return findById(id)?.name || fallback
  }

  /**
   * 加载分类
   * @param {boolean} [force]
   * @returns {Promise<void>}
   */
  async function load(force = false) {
    if (loaded.value && !force) return
    loading.value = true
    try {
      categories.value = await storage.listCategories()
      loaded.value = true
    } finally {
      loading.value = false
    }
  }

  /**
   * 新增分类
   * @param {{ name: string, parentId?: string|null }} payload
   * @returns {Promise<object>}
   */
  async function createCategory({ name, parentId = null }) {
    const siblings = categories.value.filter((item) => item.parentId === parentId)
    const sortOrder = siblings.length
      ? Math.max(...siblings.map((item) => item.sortOrder || 0)) + 1
      : 0

    const record = {
      id: createId('cat-'),
      name: name.trim(),
      parentId,
      sortOrder,
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const saved = await storage.saveCategory(record)
    categories.value.push(saved)
    return saved
  }

  /**
   * 更新分类（改名 / 停用 / 启用）
   * @param {string} id
   * @param {{ name?: string, active?: boolean }} patch
   * @returns {Promise<object>}
   */
  async function updateCategory(id, patch) {
    const target = findById(id)
    if (!target) throw new Error('分类不存在')

    const saved = await storage.saveCategory({
      ...target,
      ...patch,
      name: patch.name !== undefined ? patch.name.trim() : target.name,
      updatedAt: new Date().toISOString()
    })

    const index = categories.value.findIndex((item) => item.id === id)
    if (index >= 0) categories.value.splice(index, 1, saved)
    return saved
  }

  return {
    categories,
    loading,
    loaded,
    primaryCategories,
    activePrimaryCategories,
    subsByParent,
    subsOf,
    findById,
    nameOf,
    load,
    createCategory,
    updateCategory
  }
})
