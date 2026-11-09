<script setup>
import { onMounted, ref } from 'vue'
import { storage } from '@/services/storage'
import { useWardrobeStore } from '@/stores/wardrobe'
import { useCategoryStore } from '@/stores/category'

const ready = ref(false)
const bootError = ref('')

const wardrobeStore = useWardrobeStore()
const categoryStore = useCategoryStore()

/**
 * 启动应用：初始化存储并加载数据
 * @returns {Promise<void>}
 */
async function bootstrap() {
  bootError.value = ''
  try {
    await storage.init()
    await Promise.all([wardrobeStore.load(true), categoryStore.load(true)])
    ready.value = true
  } catch (error) {
    console.error('[app] 初始化失败', error)
    bootError.value = '数据加载失败，请检查浏览器存储权限后重试'
  }
}

function retry() {
  window.location.reload()
}

onMounted(bootstrap)
</script>

<template>
  <div class="app-shell">
    <router-view v-if="ready" />

    <div v-else class="boot-screen">
      <div class="boot-mark">
        <span class="eyebrow">OUR WARDROBE</span>
        <h1 class="boot-title">衣橱</h1>
        <span class="boot-line" />
      </div>
      <p v-if="bootError" class="boot-error">{{ bootError }}</p>
      <p v-else class="boot-tip">正在打开我们的衣橱</p>
      <el-button v-if="bootError" size="small" class="boot-retry" @click="retry">重新加载</el-button>
    </div>
  </div>
</template>

<style scoped>
.boot-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100dvh;
  gap: 18px;
  padding: 40px;
}

.boot-mark {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.boot-title {
  font-family: var(--font-display);
  font-size: 52px;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: var(--accent-deep);
}

.boot-line {
  width: 40px;
  height: 1px;
  background: var(--text-3);
  animation: breathe 1.6s ease-in-out infinite;
}

.boot-tip {
  font-size: 12.5px;
  color: var(--text-3);
  letter-spacing: 0.04em;
}

.boot-error {
  max-width: 260px;
  text-align: center;
  font-size: 13px;
  color: var(--danger);
  line-height: 1.7;
}

.boot-retry {
  margin-top: 4px;
}

@keyframes breathe {
  0%,
  100% {
    opacity: 0.25;
    transform: scaleX(0.7);
  }
  50% {
    opacity: 0.9;
    transform: scaleX(1);
  }
}
</style>
