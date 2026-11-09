/**
 * 选图后在前端压缩，避免把存储空间撑爆。
 * 长边默认压到 1200px、JPEG 质量 0.75；列表额外用 400px 缩略图。
 */

/**
 * 把图片按长边限制画到 canvas 并导出 JPEG
 * @param {HTMLImageElement} image
 * @param {number} maxSize
 * @param {number} quality
 * @returns {{ dataUrl: string, width: number, height: number }}
 */
function drawToDataUrl(image, maxSize, quality) {
  const scale = Math.min(1, maxSize / Math.max(image.width, image.height))
  const width = Math.max(1, Math.round(image.width * scale))
  const height = Math.max(1, Math.round(image.height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d')
  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, width, height)
  context.drawImage(image, 0, 0, width, height)

  return { dataUrl: canvas.toDataURL('image/jpeg', quality), width, height }
}

/**
 * @param {string} src
 * @returns {Promise<HTMLImageElement>}
 */
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onerror = () => reject(new Error('无法解析这张照片，请换一张'))
    image.onload = () => resolve(image)
    image.src = src
  })
}

/**
 * 压缩图片文件
 * @param {File} file
 * @param {{ maxSize?: number, quality?: number }} [options]
 * @returns {Promise<{ dataUrl: string, width: number, height: number }>}
 */
export function compressImage(file, { maxSize = 1200, quality = 0.75 } = {}) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onerror = () => reject(new Error('照片读取失败，请重试'))
    reader.onload = async () => {
      try {
        const image = await loadImage(/** @type {string} */ (reader.result))
        resolve(drawToDataUrl(image, maxSize, quality))
      } catch (error) {
        reject(error)
      }
    }

    reader.readAsDataURL(file)
  })
}

/**
 * 由压缩后的原图再生成一张小缩略图（列表用）
 * @param {string} dataUrl
 * @param {{ maxSize?: number, quality?: number }} [options]
 * @returns {Promise<string>}
 */
export async function createThumbnail(dataUrl, { maxSize = 400, quality = 0.7 } = {}) {
  const image = await loadImage(dataUrl)
  return drawToDataUrl(image, maxSize, quality).dataUrl
}

/**
 * dataURL 转 Blob（上传到对象存储用，避免 base64 膨胀）
 * @param {string} dataUrl
 * @returns {Blob}
 */
export function dataUrlToBlob(dataUrl) {
  const [meta, base64] = dataUrl.split(',')
  const mime = /data:([^;]+)/.exec(meta)?.[1] || 'image/jpeg'
  const binary = atob(base64 || '')
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes], { type: mime })
}
