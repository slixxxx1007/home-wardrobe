<script setup>
import { ref } from 'vue'
import { Camera, Picture } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { compressImage } from '@/services/image'

const props = defineProps({
  modelValue: { type: String, default: '' }
})

const emit = defineEmits(['update:modelValue'])

const inputRef = ref(null)
const compressing = ref(false)

function pick() {
  inputRef.value?.click()
}

function clear() {
  emit('update:modelValue', '')
}

/**
 * 选中照片后先压缩再回传
 * @param {Event} event
 */
async function handleChange(event) {
  const input = /** @type {HTMLInputElement} */ (event.target)
  const file = input.files?.[0]
  input.value = ''
  if (!file) return

  compressing.value = true
  try {
    const result = await compressImage(file)
    emit('update:modelValue', result.dataUrl)
  } catch (error) {
    ElMessage.error(error.message || '照片处理失败，请换一张')
  } finally {
    compressing.value = false
  }
}
</script>

<template>
  <div class="photo-picker">
    <input ref="inputRef" class="photo-picker__input" type="file" accept="image/*" @change="handleChange" />

    <template v-if="props.modelValue">
      <img class="photo-picker__image" :src="props.modelValue" alt="衣物照片" />
      <div class="photo-picker__actions">
        <button type="button" class="photo-picker__action" @click="pick">更换</button>
        <button type="button" class="photo-picker__action photo-picker__action--muted" @click="clear">移除</button>
      </div>
    </template>

    <button v-else type="button" class="photo-picker__empty" @click="pick">
      <el-icon :size="24"><Camera /></el-icon>
      <span class="photo-picker__empty-title">拍照 / 从相册选择</span>
      <span class="photo-picker__empty-tip">
        <el-icon :size="12"><Picture /></el-icon>
        会自动压缩，节省空间
      </span>
    </button>

    <div v-if="compressing" class="photo-picker__loading">正在压缩照片…</div>
  </div>
</template>

<style scoped>
.photo-picker {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  max-height: 300px;
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--surface);
  border: 1px solid var(--line);
}

.photo-picker__input {
  display: none;
}

.photo-picker__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo-picker__actions {
  position: absolute;
  right: 10px;
  bottom: 10px;
  display: flex;
  gap: 6px;
}

.photo-picker__action {
  height: 30px;
  padding: 0 12px;
  border: none;
  border-radius: 999px;
  background: rgba(24, 24, 22, 0.62);
  color: #fff;
  font-size: 12px;
  backdrop-filter: blur(6px);
}

.photo-picker__action--muted {
  background: rgba(255, 253, 250, 0.86);
  color: var(--text-2);
}

.photo-picker__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  height: 100%;
  border: none;
  background: transparent;
  color: var(--text-2);
}

.photo-picker__empty-title {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--text);
}

.photo-picker__empty-tip {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #b3a7a6;
}

.photo-picker__loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 237, 240, 0.9);
  font-size: 12.5px;
  color: var(--accent-deep);
}
</style>
