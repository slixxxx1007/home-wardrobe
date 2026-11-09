import { buildInitialCategories } from '@/data/initial-categories'
import { createThumbnail, dataUrlToBlob } from '@/services/image'

/**
 * Supabase 云端存储实现（两人共享同一份数据）。
 * 只有配置了 VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY 时才会被启用，
 * 建表 SQL 见 supabase/schema.sql，图片桶与策略见 supabase/storage.sql。
 *
 * 图片不存数据库，只存对象存储的公开地址：
 * - photo：原图（长边 1200px）
 * - photo_thumb：列表用缩略图（长边 400px）
 */

const PHOTO_BUCKET = 'clothes'
const PUBLIC_PREFIX = `/storage/v1/object/public/${PHOTO_BUCKET}/`

/**
 * @param {object} row
 * @returns {object}
 */
function mapClothingRow(row) {
  return {
    id: row.id,
    owner: row.owner,
    categoryId: row.category_id || '',
    subCategoryId: row.sub_category_id || '',
    name: row.name || '',
    color: row.color || '',
    seasons: Array.isArray(row.seasons) ? row.seasons : [],
    occasions: Array.isArray(row.occasions) ? row.occasions : [],
    thickness: row.thickness || '',
    size: row.size || '',
    location: row.location || '',
    status: row.status || '',
    brand: row.brand || '',
    price: row.price === null || row.price === undefined ? null : Number(row.price),
    purchaseDate: row.purchase_date || '',
    photo: row.photo || '',
    photoThumb: row.photo_thumb || '',
    createdAt: row.created_at || '',
    updatedAt: row.updated_at || ''
  }
}

/**
 * @param {object} cloth
 * @returns {object}
 */
function mapClothingToRow(cloth) {
  return {
    id: cloth.id,
    owner: cloth.owner,
    category_id: cloth.categoryId || null,
    sub_category_id: cloth.subCategoryId || null,
    name: cloth.name || '',
    color: cloth.color || '',
    seasons: cloth.seasons || [],
    occasions: cloth.occasions || [],
    thickness: cloth.thickness || '',
    size: cloth.size || '',
    location: cloth.location || '',
    status: cloth.status || '',
    brand: cloth.brand || '',
    price: cloth.price === '' || cloth.price === undefined ? null : cloth.price,
    purchase_date: cloth.purchaseDate || null,
    photo: cloth.photo || '',
    photo_thumb: cloth.photoThumb || '',
    created_at: cloth.createdAt || new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
}

/**
 * 从公开 URL 反推出对象存储里的路径
 * @param {string} url
 * @returns {string}
 */
function storagePathOf(url) {
  if (!url) return ''
  const index = url.indexOf(PUBLIC_PREFIX)
  if (index < 0) return ''
  return decodeURIComponent(url.slice(index + PUBLIC_PREFIX.length).split('?')[0])
}

/**
 * @param {object} row
 * @returns {object}
 */
function mapCategoryRow(row) {
  return {
    id: row.id,
    name: row.name || '',
    parentId: row.parent_id || null,
    sortOrder: row.sort_order || 0,
    active: row.active !== false,
    createdAt: row.created_at || '',
    updatedAt: row.updated_at || ''
  }
}

/**
 * @param {object} category
 * @returns {object}
 */
function mapCategoryToRow(category) {
  return {
    id: category.id,
    name: category.name,
    parent_id: category.parentId || null,
    sort_order: category.sortOrder || 0,
    active: category.active !== false,
    created_at: category.createdAt || new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
}

/**
 * 创建 Supabase 存储实例
 * @param {{ url: string, anonKey: string }} config
 * @returns {Promise<object>} 统一的存储接口
 */
export async function createSupabaseStorage({ url, anonKey }) {
  const { createClient } = await import('@supabase/supabase-js')
  const client = createClient(url, anonKey)

  /**
   * 物理删除对象存储里的图片（数据库里的 dataURL / 外链会被忽略）
   * @param {Array<string>} urls
   * @returns {Promise<void>}
   */
  async function removePhotos(urls) {
    const paths = (urls || []).map(storagePathOf).filter(Boolean)
    if (paths.length === 0) return
    const { error } = await client.storage.from(PHOTO_BUCKET).remove(paths)
    if (error) console.warn('[storage] 图片删除失败，可稍后手动清理。', error)
  }

  return {
    mode: 'cloud',

    /**
     * 初始化：验证连接是否可用，分类表为空时写入内置分类。
     * 失败时抛出错误，由上层安静地回退到本地模式。
     * @returns {Promise<void>}
     */
    async init() {
      const { data, error } = await client.from('categories').select('id').limit(1)
      if (error) throw error

      if (data && data.length > 0) return

      const { error: seedError } = await client
        .from('categories')
        .upsert(buildInitialCategories().map(mapCategoryToRow))
      if (seedError) throw seedError
    },

    /**
     * @param {{ owner?: string }} [options]
     * @returns {Promise<Array<object>>}
     */
    async listClothing({ owner } = {}) {
      let query = client.from('clothes').select('*').order('updated_at', { ascending: false })
      if (owner) query = query.eq('owner', owner)
      const { data, error } = await query
      if (error) throw error
      return (data || []).map(mapClothingRow)
    },

    /**
     * @param {string} id
     * @returns {Promise<object|null>}
     */
    async getClothing(id) {
      const { data, error } = await client.from('clothes').select('*').eq('id', id).maybeSingle()
      if (error) throw error
      return data ? mapClothingRow(data) : null
    },

    /**
     * 上传压缩后的照片与缩略图，返回可存的公开地址
     * @param {{ dataUrl: string, key: string }} options
     * @returns {Promise<{ photo: string, photoThumb: string }>}
     */
    async uploadPhoto({ dataUrl, key }) {
      const stamp = Date.now()
      const photoPath = `${key}/${stamp}.jpg`
      const thumbPath = `${key}/${stamp}-thumb.jpg`
      const uploadOptions = { contentType: 'image/jpeg', cacheControl: '31536000', upsert: true }

      const { error: photoError } = await client
        .storage.from(PHOTO_BUCKET)
        .upload(photoPath, dataUrlToBlob(dataUrl), uploadOptions)
      if (photoError) throw photoError

      let photoThumb = ''
      try {
        const thumbDataUrl = await createThumbnail(dataUrl)
        const { error: thumbError } = await client
          .storage.from(PHOTO_BUCKET)
          .upload(thumbPath, dataUrlToBlob(thumbDataUrl), uploadOptions)
        if (thumbError) throw thumbError
        photoThumb = client.storage.from(PHOTO_BUCKET).getPublicUrl(thumbPath).data.publicUrl
      } catch (error) {
        // 缩略图失败不影响保存，列表会自动回退用原图
        console.warn('[storage] 缩略图上传失败，已回退使用原图。', error)
      }

      return {
        photo: client.storage.from(PHOTO_BUCKET).getPublicUrl(photoPath).data.publicUrl,
        photoThumb
      }
    },

    /**
     * 物理删除图片对象
     * @param {Array<string>} urls
     * @returns {Promise<void>}
     */
    async deletePhoto(urls) {
      await removePhotos(urls)
    },

    /**
     * @param {object} cloth
     * @returns {Promise<object>}
     */
    async saveClothing(cloth) {
      const row = mapClothingToRow(cloth)
      const { error } = await client.from('clothes').upsert(row)
      if (error) throw error
      return mapClothingRow(row)
    },

    /**
     * 删除衣物：先删图片对象，再删数据行（物理删除，节省空间）
     * @param {string} id
     * @returns {Promise<void>}
     */
    async deleteClothing(id) {
      const { data, error } = await client
        .from('clothes')
        .select('photo, photo_thumb')
        .eq('id', id)
        .maybeSingle()
      if (error) throw error

      if (data) await removePhotos([data.photo, data.photo_thumb])

      const { error: deleteError } = await client.from('clothes').delete().eq('id', id)
      if (deleteError) throw deleteError
    },

    /**
     * @returns {Promise<Array<object>>}
     */
    async listCategories() {
      const { data, error } = await client.from('categories').select('*').order('sort_order', { ascending: true })
      if (error) throw error
      return (data || []).map(mapCategoryRow)
    },

    /**
     * @param {object} category
     * @returns {Promise<object>}
     */
    async saveCategory(category) {
      const row = mapCategoryToRow(category)
      const { error } = await client.from('categories').upsert(row)
      if (error) throw error
      return mapCategoryRow(row)
    }
  }
}
