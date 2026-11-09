import { createIndexedDbStorage } from './indexeddb-storage'
import { createSupabaseStorage } from './supabase-storage'

/**
 * 存储层统一入口。
 * - 未配置 VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY → 使用 IndexedDB 本地模式
 * - 配置齐全且连接可用 → 自动切换 Supabase 云端共享模式
 * - 配置了但连接失败 → 控制台警告并安静回退本地模式，不阻塞启动
 */

let adapter = null
let initPromise = null

/**
 * 是否配置了 Supabase 环境变量
 * @returns {boolean}
 */
export function isSupabaseConfigured() {
  return Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY)
}

async function bootstrap() {
  if (isSupabaseConfigured()) {
    try {
      const cloud = await createSupabaseStorage({
        url: import.meta.env.VITE_SUPABASE_URL,
        anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY
      })
      await cloud.init()
      adapter = cloud
      return
    } catch (error) {
      console.warn('[storage] Supabase 连接不可用，已回退到本地模式。', error)
    }
  }

  const local = createIndexedDbStorage()
  await local.init()
  adapter = local
}

/**
 * 确保存储已初始化（幂等）
 * @returns {Promise<void>}
 */
function ensureInit() {
  if (!initPromise) initPromise = bootstrap()
  return initPromise
}

export const storage = {
  init: ensureInit,

  /** @returns {'local'|'cloud'} */
  get mode() {
    return adapter?.mode || 'local'
  },

  /**
   * @param {{ owner?: string }} [options]
   * @returns {Promise<Array<object>>}
   */
  async listClothing(options) {
    await ensureInit()
    return adapter.listClothing(options)
  },

  /**
   * 上传照片（本地模式直接返回 null，表示沿用 dataURL）
   * @param {{ dataUrl: string, key: string }} options
   * @returns {Promise<{ photo: string, photoThumb: string }|null>}
   */
  async uploadPhoto(options) {
    await ensureInit()
    return adapter.uploadPhoto(options)
  },

  /**
   * 物理删除云端图片
   * @param {Array<string>} urls
   * @returns {Promise<void>}
   */
  async deletePhoto(urls) {
    await ensureInit()
    return adapter.deletePhoto(urls)
  },

  /**
   * @param {string} id
   * @returns {Promise<object|null>}
   */
  async getClothing(id) {
    await ensureInit()
    return adapter.getClothing(id)
  },

  /**
   * @param {object} cloth
   * @returns {Promise<object>}
   */
  async saveClothing(cloth) {
    await ensureInit()
    return adapter.saveClothing(cloth)
  },

  /**
   * @param {string} id
   * @returns {Promise<void>}
   */
  async deleteClothing(id) {
    await ensureInit()
    return adapter.deleteClothing(id)
  },

  /**
   * @returns {Promise<Array<object>>}
   */
  async listCategories() {
    await ensureInit()
    return adapter.listCategories()
  },

  /**
   * @param {object} category
   * @returns {Promise<object>}
   */
  async saveCategory(category) {
    await ensureInit()
    return adapter.saveCategory(category)
  }
}
