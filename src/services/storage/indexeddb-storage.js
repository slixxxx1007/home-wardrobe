import { openDB } from 'idb'
import { buildInitialCategories } from '@/data/initial-categories'

const DB_NAME = 'home-wardrobe'
const DB_VERSION = 1

/**
 * 打开 IndexedDB（首次创建 clothes / categories 两个表）
 * @returns {Promise<import('idb').IDBPDatabase>}
 */
function openDatabase() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('clothes')) {
        const store = db.createObjectStore('clothes', { keyPath: 'id' })
        store.createIndex('owner', 'owner')
      }
      if (!db.objectStoreNames.contains('categories')) {
        db.createObjectStore('categories', { keyPath: 'id' })
      }
    }
  })
}

/**
 * 本地 IndexedDB 存储实现（默认模式，无需任何账号配置）
 * @returns {object} 统一的存储接口
 */
export function createIndexedDbStorage() {
  let databasePromise = null

  function getDb() {
    if (!databasePromise) databasePromise = openDatabase()
    return databasePromise
  }

  return {
    mode: 'local',

    /**
     * 初始化：分类表为空时写入内置分类
     * @returns {Promise<void>}
     */
    async init() {
      const db = await getDb()
      const count = await db.count('categories')
      if (count > 0) return

      const transaction = db.transaction('categories', 'readwrite')
      await Promise.all(buildInitialCategories().map((category) => transaction.store.put(category)))
      await transaction.done
    },

    /**
     * 查询衣物列表
     * @param {{ owner?: string }} [options]
     * @returns {Promise<Array<object>>}
     */
    async listClothing({ owner } = {}) {
      const db = await getDb()
      let rows = await db.getAll('clothes')
      if (owner) rows = rows.filter((row) => row.owner === owner)
      return rows.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''))
    },

    /**
     * 按 id 查询单件衣物
     * @param {string} id
     * @returns {Promise<object|null>}
     */
    async getClothing(id) {
      const db = await getDb()
      return (await db.get('clothes', id)) || null
    },

    /**
     * 新增或更新一件衣物
     * @param {object} cloth
     * @returns {Promise<object>} 写入后的记录
     */
    async saveClothing(cloth) {
      const db = await getDb()
      const now = new Date().toISOString()
      const record = {
        ...cloth,
        createdAt: cloth.createdAt || now,
        updatedAt: now
      }
      await db.put('clothes', record)
      return record
    },

    /**
     * 本地模式不上传对象存储，照片直接以 dataURL 存在记录里
     * @returns {Promise<null>}
     */
    async uploadPhoto() {
      return null
    },

    /**
     * 本地模式没有独立的图片对象需要删除
     * @returns {Promise<void>}
     */
    async deletePhoto() {},

    /**
     * 删除衣物
     * @param {string} id
     * @returns {Promise<void>}
     */
    async deleteClothing(id) {
      const db = await getDb()
      await db.delete('clothes', id)
    },

    /**
     * 查询全部分类（包含停用）
     * @returns {Promise<Array<object>>}
     */
    async listCategories() {
      const db = await getDb()
      const rows = await db.getAll('categories')
      return rows.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
    },

    /**
     * 新增或更新分类
     * @param {object} category
     * @returns {Promise<object>}
     */
    async saveCategory(category) {
      const db = await getDb()
      const now = new Date().toISOString()
      const record = {
        ...category,
        createdAt: category.createdAt || now,
        updatedAt: now
      }
      await db.put('categories', record)
      return record
    }
  }
}
