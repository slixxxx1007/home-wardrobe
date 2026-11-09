<script setup>
import { computed } from 'vue'
import { Handbag } from '@element-plus/icons-vue'
import { CLOTHING_STATUS, colorSwatchStyle, labelOf } from '@/constants/clothing'

const props = defineProps({
  cloth: { type: Object, required: true },
  subCategoryName: { type: String, default: '' }
})

const emit = defineEmits(['click'])

const statusLabel = computed(() => labelOf(CLOTHING_STATUS, props.cloth.status))
</script>

<template>
  <article class="cloth-card" @click="emit('click')">
    <div class="cloth-card__photo">
      <img
        v-if="cloth.photoThumb || cloth.photo"
        :src="cloth.photoThumb || cloth.photo"
        :alt="cloth.name"
        loading="lazy"
      />
      <div v-else class="cloth-card__placeholder">
        <el-icon :size="22"><Handbag /></el-icon>
      </div>
      <span v-if="cloth.status && cloth.status !== 'active'" class="cloth-card__badge">
        {{ statusLabel }}
      </span>
    </div>

    <div class="cloth-card__info">
      <h3 class="cloth-card__name">{{ cloth.name || subCategoryName || '未命名' }}</h3>
      <p class="cloth-card__meta">
        <span>{{ subCategoryName }}</span>
        <template v-if="cloth.color">
          <span class="cloth-card__dot" :style="colorSwatchStyle(cloth.color)" />
          <span>{{ cloth.color }}</span>
        </template>
      </p>
    </div>
  </article>
</template>

<style scoped>
.cloth-card {
  overflow: hidden;
  border-radius: 18px;
  background: var(--surface);
  box-shadow: var(--shadow-soft);
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.cloth-card:active {
  transform: scale(0.975);
  box-shadow: var(--shadow);
}

.cloth-card__photo {
  position: relative;
  aspect-ratio: 3 / 4;
  background: var(--surface-2);
}

.cloth-card__photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cloth-card__placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: #b9bcc4;
  background: linear-gradient(150deg, #f6f6f8, #ececef);
}

.cloth-card__badge {
  position: absolute;
  top: 8px;
  left: 8px;
  padding: 3px 9px;
  border-radius: 999px;
  background: rgba(255, 36, 66, 0.92);
  color: #fff;
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.04em;
  backdrop-filter: blur(4px);
}

.cloth-card__info {
  padding: 10px 12px 12px;
}

.cloth-card__name {
  font-size: 14px;
  font-weight: 700;
  line-height: 1.35;
  color: var(--text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cloth-card__meta {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 3px;
  font-size: 11.5px;
  color: var(--text-3);
  overflow: hidden;
  white-space: nowrap;
}

.cloth-card__dot {
  width: 7px;
  height: 7px;
  margin-left: 2px;
  border-radius: 50%;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.12) inset;
}
</style>
