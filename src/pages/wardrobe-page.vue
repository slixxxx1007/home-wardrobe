<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Handbag, Menu, Plus, Search } from '@element-plus/icons-vue'
import ClothCard from '@/components/cloth-card.vue'
import ClothFormDialog from '@/components/cloth-form-dialog.vue'
import OptionChips from '@/components/option-chips.vue'
import {
  CLOTHING_STATUS,
  OWNERS,
  SEASONS
} from '@/constants/clothing'
import { storage } from '@/services/storage'
import { useCategoryStore } from '@/stores/category'
import { useWardrobeStore } from '@/stores/wardrobe'

const router = useRouter()
const wardrobeStore = useWardrobeStore()
const categoryStore = useCategoryStore()

const filters = wardrobeStore.filters

const formVisible = ref(false)
const editingCloth = ref(null)
const storageMode = ref('local')

const ownerCounts = computed(() => wardrobeStore.ownerCounts)
const filteredClothes = computed(() => wardrobeStore.filteredClothes)
const hasActiveFilters = computed(() => wardrobeStore.hasActiveFilters)
const isOwnerEmpty = computed(() => ownerCounts.value[filters.owner] === 0)

const categoryOptions = computed(() => [
  { value: '', label: '全部' },
  ...categoryStore.activePrimaryCategories.map((item) => ({ value: item.id, label: item.name }))
])

const subFilterOptions = computed(() => {
  if (!filters.categoryId) return []
  return [
    { value: '', label: '全部' },
    ...categoryStore.subsOf(filters.categoryId).map((item) => ({ value: item.id, label: item.name }))
  ]
})

const statusOptions = [
  { value: '', label: '全部' },
  ...CLOTHING_STATUS
]

const storageModeText = computed(() =>
  storageMode.value === 'cloud' ? '云端共享 · 自动同步 · 改完自动上线' : '本地模式 · 数据保存在这台手机上'
)

onMounted(async () => {
  await wardrobeStore.load()
  await categoryStore.load()
  storageMode.value = storage.mode
})

/**
 * 切换归属人
 * @param {'me'|'wife'} owner
 */
function switchOwner(owner) {
  wardrobeStore.setOwner(owner)
}

/**
 * 切换一级类别筛选
 * @param {string} categoryId
 */
function selectCategory(categoryId) {
  wardrobeStore.setCategory(categoryId)
}

/**
 * @param {string} subCategoryId
 */
function selectSubCategory(subCategoryId) {
  filters.subCategoryId = subCategoryId
}

/**
 * 取二级类别名称
 * @param {object} cloth
 * @returns {string}
 */
function subCategoryName(cloth) {
  return categoryStore.nameOf(cloth.subCategoryId, '未分类')
}

function openCreate() {
  editingCloth.value = null
  formVisible.value = true
}

/**
 * 打开发送详情
 * @param {object} cloth
 */
function openDetail(cloth) {
  router.push(`/cloth/${cloth.id}`)
}

/**
 * 新增成功后，保证刚录入的这件一定能在列表里看到
 * （否则当前类别/季节筛选可能把它藏起来，像保存失败）
 * @param {object} cloth
 */
function handleSaved(cloth) {
  if (cloth.owner !== filters.owner) wardrobeStore.setOwner(cloth.owner)
  wardrobeStore.clearFilters()
}
</script>

<template>
  <div class="page wardrobe-page">
    <header class="home-head">
      <div class="home-head__top">
        <div>
          <p class="eyebrow">OUR WARDROBE</p>
          <h1 class="display-title">衣橱</h1>
        </div>

        <button type="button" class="manage-entry" @click="router.push('/category')">
          <el-icon :size="14"><Menu /></el-icon>
          <span>分类</span>
        </button>
      </div>

      <div class="owner-switch" role="tablist" aria-label="归属人">
        <button
          v-for="owner in OWNERS"
          :key="owner.value"
          type="button"
          role="tab"
          :aria-selected="filters.owner === owner.value"
          :class="{ 'is-active': filters.owner === owner.value }"
          @click="switchOwner(owner.value)"
        >
          <span>{{ owner.label }}</span>
          <span class="owner-switch__count">{{ ownerCounts[owner.value] }}</span>
        </button>
      </div>

      <el-input
        v-model="filters.keyword"
        class="search"
        size="large"
        :prefix-icon="Search"
        placeholder="搜名称、品牌、颜色、位置"
        clearable
      />

      <div class="filter-panel">
        <div class="scroll-row">
          <option-chips
            :model-value="filters.categoryId"
            :options="categoryOptions"
            scroll
            @update:model-value="selectCategory"
          />
        </div>

        <div v-if="subFilterOptions.length" class="scroll-row scroll-row--sub">
          <option-chips
            :model-value="filters.subCategoryId"
            :options="subFilterOptions"
            size="sm"
            scroll
            @update:model-value="selectSubCategory"
          />
        </div>

        <div class="mini-filters">
          <div class="mini-filter">
            <span class="mini-filter__label">季节</span>
            <option-chips v-model="filters.seasons" :options="SEASONS" multiple size="sm" variant="outline" />
          </div>

          <div class="mini-filter">
            <span class="mini-filter__label">状态</span>
            <option-chips v-model="filters.status" :options="statusOptions" size="sm" variant="outline" />
          </div>
        </div>
      </div>
    </header>

    <div class="list-head">
      <span class="list-head__count">{{ filteredClothes.length }} 件</span>
      <button v-if="hasActiveFilters" type="button" class="list-head__clear" @click="wardrobeStore.clearFilters()">
        清除筛选
      </button>
    </div>

    <div v-if="filteredClothes.length" class="grid">
      <cloth-card
        v-for="cloth in filteredClothes"
        :key="cloth.id"
        :cloth="cloth"
        :sub-category-name="subCategoryName(cloth)"
        @click="openDetail(cloth)"
      />
    </div>

    <div v-else class="empty-state">
      <div class="empty-state__icon">
        <el-icon :size="26"><Handbag /></el-icon>
      </div>
      <template v-if="isOwnerEmpty">
        <p class="empty-state__title">这里还空着</p>
        <p class="empty-state__text">拍一张照片，把常穿的衣服先放进来。之后找衣服、搭配、断舍离都会轻松很多。</p>
        <el-button type="primary" round @click="openCreate">添加第一件</el-button>
      </template>
      <template v-else>
        <p class="empty-state__title">没有符合条件的衣物</p>
        <p class="empty-state__text">换个类别、季节或状态看看，也可以直接搜索名字。</p>
        <el-button round @click="wardrobeStore.clearFilters()">清除筛选</el-button>
      </template>
    </div>

    <p class="storage-note">
      <span class="storage-note__dot" :class="{ 'is-cloud': storageMode === 'cloud' }" />
      {{ storageModeText }}
    </p>

    <div class="fab-wrap">
      <button type="button" class="fab" aria-label="添加衣物" @click="openCreate">
        <el-icon :size="24"><Plus /></el-icon>
      </button>
    </div>

    <cloth-form-dialog
      v-model="formVisible"
      :cloth="editingCloth"
      :default-owner="filters.owner"
      @saved="handleSaved"
    />
  </div>
</template>

<style scoped>
.wardrobe-page {
  padding-top: calc(18px + var(--safe-top));
  padding-bottom: calc(96px + var(--safe-bottom));
}

.home-head__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.manage-entry {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 34px;
  margin-top: 4px;
  padding: 0 13px;
  border: none;
  border-radius: 999px;
  background: #fff;
  box-shadow: var(--shadow-soft);
  color: var(--text-2);
  font-size: 12px;
  font-weight: 500;
}

.owner-switch {
  display: flex;
  gap: 4px;
  margin-top: 18px;
  padding: 4px;
  border-radius: 999px;
  background: var(--bg-deep);
}

.owner-switch button {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 36px;
  border: none;
  border-radius: 999px;
  background: transparent;
  color: var(--text-2);
  font-size: 13.5px;
  transition: background 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
}

.owner-switch button.is-active {
  background: var(--surface);
  color: var(--text);
  font-weight: 600;
  box-shadow: var(--shadow-soft);
}

.owner-switch__count {
  min-width: 20px;
  padding: 0 6px;
  border-radius: 999px;
  background: rgba(43, 32, 33, 0.06);
  color: var(--text-3);
  font-size: 10.5px;
  font-weight: 600;
  line-height: 16px;
}

.owner-switch button.is-active .owner-switch__count {
  background: var(--accent);
  color: #fff;
}

.search {
  margin-top: 12px;
}

.search :deep(.el-input__wrapper) {
  height: 44px;
  border-radius: 999px;
  background: var(--surface);
  box-shadow: var(--shadow-soft);
  padding: 0 16px;
}

.filter-panel {
  margin-top: 16px;
}

.scroll-row {
  position: relative;
  margin: 0 -18px;
  padding: 2px 18px 4px;
  overflow: hidden;
}

/* 右侧渐隐，提示这一条还可以继续横向滑动 */
.scroll-row::after {
  content: "";
  position: absolute;
  top: 0;
  right: 0;
  bottom: 4px;
  width: 24px;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0), rgba(255, 255, 255, 0.92));
  pointer-events: none;
}

.scroll-row--sub {
  padding-top: 6px;
}

.mini-filters {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 10px;
}

.mini-filter {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mini-filter__label {
  flex: 0 0 auto;
  width: 26px;
  font-size: 11px;
  color: var(--text-3);
  letter-spacing: 0.06em;
}

.list-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 18px 2px 10px;
}

.list-head__count {
  font-size: 12px;
  color: var(--text-2);
  letter-spacing: 0.04em;
}

.list-head__clear {
  border: none;
  background: transparent;
  color: var(--accent);
  font-size: 12px;
  padding: 4px 0;
}

.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.storage-note {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 30px;
  font-size: 10.5px;
  color: var(--text-3);
  letter-spacing: 0.02em;
}

.storage-note__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--text-3);
}

.storage-note__dot.is-cloud {
  background: var(--accent);
}

.fab-wrap {
  position: fixed;
  left: 50%;
  bottom: calc(18px + var(--safe-bottom));
  z-index: 12;
  width: min(100%, 520px);
  transform: translateX(-50%);
  pointer-events: none;
}

.fab {
  position: absolute;
  right: 18px;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 58px;
  height: 58px;
  border: none;
  border-radius: 50%;
  background: linear-gradient(135deg, #ff4d67, var(--accent) 55%, var(--accent-deep));
  color: #fff;
  box-shadow: 0 14px 30px rgba(255, 36, 66, 0.34);
  pointer-events: auto;
  transition: transform 0.18s ease;
}

.fab:active {
  transform: scale(0.94);
}

@media (max-width: 360px) {
  .owner-switch button {
    font-size: 13px;
  }
}
</style>
