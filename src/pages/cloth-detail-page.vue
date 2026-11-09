<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete, EditPen, Handbag } from '@element-plus/icons-vue'
import TopBar from '@/components/top-bar.vue'
import ClothFormDialog from '@/components/cloth-form-dialog.vue'
import {
  CLOTHING_STATUS,
  OWNER_LABELS,
  OCCASIONS,
  SEASONS,
  THICKNESS,
  labelOf
} from '@/constants/clothing'
import { formatDate, formatPrice, joinLabels } from '@/utils/format'
import { useCategoryStore } from '@/stores/category'
import { useWardrobeStore } from '@/stores/wardrobe'

const route = useRoute()
const router = useRouter()
const wardrobeStore = useWardrobeStore()
const categoryStore = useCategoryStore()

const formVisible = ref(false)

const cloth = computed(() => wardrobeStore.getCloth(String(route.params.id)))

const specRows = computed(() => {
  const item = cloth.value
  if (!item) return []

  return [
    { label: '一级类别', value: categoryStore.nameOf(item.categoryId, '未分类') },
    { label: '二级类别', value: categoryStore.nameOf(item.subCategoryId, '未分类') },
    { label: '颜色', value: item.color },
    { label: '适合季节', value: joinLabels(item.seasons, SEASONS) },
    { label: '适合场合', value: joinLabels(item.occasions, OCCASIONS) },
    { label: '厚度', value: labelOf(THICKNESS, item.thickness) },
    { label: '尺码', value: item.size },
    { label: '存放位置', value: item.location },
    { label: '状态', value: labelOf(CLOTHING_STATUS, item.status) },
    { label: '品牌', value: item.brand },
    { label: '价格', value: formatPrice(item.price) },
    { label: '购买时间', value: item.purchaseDate },
    { label: '添加时间', value: formatDate(item.createdAt) }
  ]
})

const statusLabel = computed(() => labelOf(CLOTHING_STATUS, cloth.value?.status))

onMounted(async () => {
  await wardrobeStore.load()
  await categoryStore.load()
})

/**
 * 删除当前衣物（二次确认）
 * @returns {Promise<void>}
 */
async function handleDelete() {
  if (!cloth.value) return

  try {
    await ElMessageBox.confirm('删除后无法恢复，确定要删掉这件衣物吗？', '删除衣物', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
      confirmButtonClass: 'el-button--danger'
    })
  } catch {
    return
  }

  try {
    await wardrobeStore.removeCloth(cloth.value.id)
    ElMessage.success('已删除')
    router.replace('/')
  } catch (error) {
    console.error('[detail] 删除失败', error)
    ElMessage.error('删除失败，请稍后重试')
  }
}
</script>

<template>
  <div>
    <TopBar title="衣物详情" />

    <div v-if="cloth" class="page page--with-bar detail-page">
      <div class="detail-photo" :class="{ 'is-empty': !cloth.photo }">
        <img v-if="cloth.photo" :src="cloth.photo" :alt="cloth.name" />
        <div v-else class="detail-photo__empty">
          <el-icon :size="34"><Handbag /></el-icon>
          <span>还没有照片</span>
        </div>
      </div>

      <div class="detail-head">
        <h1 class="detail-name">{{ cloth.name || '未命名衣物' }}</h1>
        <div class="detail-tags">
          <span class="tag tag--strong">{{ OWNER_LABELS[cloth.owner] }}</span>
          <span v-if="statusLabel" class="tag">{{ statusLabel }}</span>
          <span class="tag">{{ categoryStore.nameOf(cloth.subCategoryId, '未分类') }}</span>
        </div>
      </div>

      <div v-if="cloth.seasons?.length || cloth.occasions?.length" class="aspect-tags">
        <span v-for="season in cloth.seasons" :key="season" class="tag tag--soft">
          {{ labelOf(SEASONS, season) }}
        </span>
        <span v-for="occasion in cloth.occasions" :key="occasion" class="tag tag--soft">
          {{ labelOf(OCCASIONS, occasion) }}
        </span>
      </div>

      <section class="spec-card">
        <div v-for="row in specRows" :key="row.label" class="spec-row">
          <span class="spec-row__label">{{ row.label }}</span>
          <span class="spec-row__value" :class="{ 'is-empty': !row.value }">{{ row.value || '未填写' }}</span>
        </div>
      </section>

      <p class="detail-note">最后更新于 {{ formatDate(cloth.updatedAt) || '—' }}</p>
    </div>

    <div v-else class="page detail-missing">
      <div class="empty-state">
        <div class="empty-state__icon">
          <el-icon :size="26"><Handbag /></el-icon>
        </div>
        <p class="empty-state__title">没有找到这件衣物</p>
        <p class="empty-state__text">它可能已经被删除，或者链接不完整。</p>
        <el-button type="primary" round @click="router.replace('/')">回到衣橱</el-button>
      </div>
    </div>

    <div v-if="cloth" class="bottom-bar">
      <div class="detail-actions">
        <el-button class="detail-delete" :icon="Delete" @click="handleDelete">删除</el-button>
        <el-button type="primary" size="large" :icon="EditPen" @click="formVisible = true">编辑</el-button>
      </div>
    </div>

    <cloth-form-dialog
      v-if="cloth"
      v-model="formVisible"
      :cloth="cloth"
      :default-owner="cloth.owner"
    />
  </div>
</template>

<style scoped>
.detail-page {
  padding-top: 6px;
}

.detail-photo {
  overflow: hidden;
  width: 100%;
  aspect-ratio: 3 / 4;
  max-height: 58vh;
  border-radius: 24px;
  background: var(--surface-2);
  box-shadow: var(--shadow);
}

.detail-photo.is-empty {
  aspect-ratio: 2 / 1;
}

.detail-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.detail-photo__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 100%;
  color: #b9bcc4;
  font-size: 12px;
  background: linear-gradient(150deg, #f6f6f8, #ececef);
}

.detail-head {
  margin-top: 18px;
}

.detail-name {
  font-family: var(--font-display);
  font-size: 27px;
  font-weight: 800;
  line-height: 1.3;
  letter-spacing: 0;
}

.detail-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
}

.tag {
  display: inline-flex;
  align-items: center;
  height: 24px;
  padding: 0 10px;
  border-radius: 999px;
  background: var(--surface-2);
  color: var(--text-2);
  font-size: 11.5px;
  font-weight: 500;
}

.tag--strong {
  background: var(--accent-soft);
  color: var(--accent-deep);
  font-weight: 700;
}

.aspect-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 12px;
}

.tag--soft {
  background: transparent;
  border: 1px solid var(--line);
  color: var(--text-2);
}

.spec-card {
  margin-top: 20px;
  padding: 4px 16px;
  border-radius: var(--radius-md);
  background: var(--surface);
  box-shadow: var(--shadow-soft);
}

.spec-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 0;
  border-bottom: 1px solid var(--line);
  font-size: 13px;
}

.spec-row:last-child {
  border-bottom: none;
}

.spec-row__label {
  flex: 0 0 auto;
  color: var(--text-3);
  font-size: 12px;
  letter-spacing: 0.04em;
}

.spec-row__value {
  color: var(--text);
  text-align: right;
  word-break: break-all;
}

.spec-row__value.is-empty {
  color: var(--text-3);
}

.detail-note {
  margin-top: 16px;
  text-align: center;
  font-size: 10.5px;
  color: var(--text-3);
}

.detail-missing {
  padding-top: 40px;
}

.detail-actions {
  display: flex;
  gap: 10px;
}

.detail-actions .el-button {
  height: 48px;
  margin: 0;
}

.detail-delete {
  flex: 0 0 96px;
  border-radius: 999px;
  color: var(--text-2);
  background: #fff;
}

.detail-actions .el-button--primary {
  flex: 1;
  border-radius: 999px;
  font-size: 15px;
}
</style>
