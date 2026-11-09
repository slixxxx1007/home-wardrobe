<script setup>
import { ArrowLeft } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'

defineProps({
  title: { type: String, default: '' },
  back: { type: Boolean, default: true }
})

const router = useRouter()

function handleBack() {
  // 直接打开链接（如从主屏图标进详情）时没有上一页，回首页而不是退出应用
  if (window.history.state?.back) router.back()
  else router.replace('/')
}
</script>

<template>
  <header class="top-bar">
    <button v-if="back" class="top-bar__back" type="button" aria-label="返回" @click="handleBack">
      <el-icon :size="18"><ArrowLeft /></el-icon>
    </button>
    <span v-else class="top-bar__spacer" />

    <h2 class="top-bar__title">{{ title }}</h2>

    <div class="top-bar__right">
      <slot name="right" />
    </div>
  </header>
</template>

<style scoped>
.top-bar {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: calc(10px + var(--safe-top)) 14px 10px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.top-bar__back,
.top-bar__spacer {
  flex: 0 0 36px;
  width: 36px;
  height: 36px;
}

.top-bar__back {
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 50%;
  background: #fff;
  box-shadow: var(--shadow-soft);
  color: var(--text);
}

.top-bar__back:active {
  transform: scale(0.94);
}

.top-bar__title {
  flex: 1;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.02em;
  text-align: center;
}

.top-bar__right {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  min-width: 36px;
  min-height: 36px;
}
</style>
