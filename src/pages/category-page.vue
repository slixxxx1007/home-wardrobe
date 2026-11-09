<script setup>
import { computed, onMounted, nextTick, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { EditPen, Plus } from '@element-plus/icons-vue'
import TopBar from '@/components/top-bar.vue'
import { useCategoryStore } from '@/stores/category'

const categoryStore = useCategoryStore()

const dialogVisible = ref(false)
const dialogMode = ref('add-primary')
const dialogForm = reactive({ name: '', active: true })
const dialogTarget = ref(null)
const dialogParent = ref(null)
const dialogFormRef = ref(null)
const submitting = ref(false)
const isMobile = window.matchMedia('(max-width: 640px)').matches

const primaryCategories = computed(() => categoryStore.primaryCategories)

const dialogTitle = computed(() => {
  if (dialogMode.value === 'add-primary') return '新增一级类别'
  if (dialogMode.value === 'add-sub') return `在「${dialogParent.value?.name}」下新增`
  return '编辑分类'
})

const dialogRules = {
  name: [
    { required: true, message: '请填写类别名称', trigger: 'blur' },
    { max: 20, message: '最多 20 个字', trigger: 'blur' }
  ]
}

/**
 * 取某个一级类别下的全部二级类别（含停用）
 * @param {string} parentId
 * @returns {Array<object>}
 */
function allSubs(parentId) {
  return categoryStore.subsOf(parentId, { includeInactive: true })
}

onMounted(() => {
  categoryStore.load()
})

/**
 * 打开新增一级类别
 */
function openAddPrimary() {
  dialogMode.value = 'add-primary'
  dialogTarget.value = null
  dialogParent.value = null
  dialogForm.name = ''
  dialogForm.active = true
  dialogVisible.value = true
  nextTick(() => dialogFormRef.value?.clearValidate())
}

/**
 * 打开新增二级类别
 * @param {object} primary
 */
function openAddSub(primary) {
  dialogMode.value = 'add-sub'
  dialogTarget.value = null
  dialogParent.value = primary
  dialogForm.name = ''
  dialogForm.active = true
  dialogVisible.value = true
  nextTick(() => dialogFormRef.value?.clearValidate())
}

/**
 * 打开编辑分类
 * @param {object} category
 */
function openEdit(category) {
  dialogMode.value = 'edit'
  dialogTarget.value = category
  dialogParent.value = category.parentId ? categoryStore.findById(category.parentId) : null
  dialogForm.name = category.name
  dialogForm.active = category.active
  dialogVisible.value = true
  nextTick(() => dialogFormRef.value?.clearValidate())
}

/**
 * 保存分类（新增 / 改名 / 停用）
 * @returns {Promise<void>}
 */
async function submitDialog() {
  if (!dialogFormRef.value) return

  const valid = await dialogFormRef.value.validate().catch(() => false)
  if (!valid) return

  const name = dialogForm.name.trim()

  const parentId =
    dialogMode.value === 'add-sub'
      ? dialogParent.value?.id || null
      : dialogMode.value === 'edit'
        ? dialogTarget.value?.parentId || null
        : null

  const siblings = categoryStore.categories.filter(
    (item) => item.parentId === parentId && item.id !== dialogTarget.value?.id
  )
  if (siblings.some((item) => item.name === name)) {
    ElMessage.warning('同一级下已经有同名类别了')
    return
  }

  submitting.value = true
  try {
    if (dialogMode.value === 'edit') {
      await categoryStore.updateCategory(dialogTarget.value.id, { name, active: dialogForm.active })
      ElMessage.success('已保存')
    } else {
      await categoryStore.createCategory({ name, parentId })
      ElMessage.success('已添加')
    }
    dialogVisible.value = false
  } catch (error) {
    console.error('[category] 保存失败', error)
    ElMessage.error('保存失败，请稍后重试')
  } finally {
    submitting.value = false
  }
}

/**
 * 停用 / 启用分类
 * @param {object} category
 * @returns {Promise<void>}
 */
async function toggleActive(category) {
  try {
    await categoryStore.updateCategory(category.id, { active: !category.active })
    ElMessage.success(category.active ? '已停用' : '已启用')
  } catch (error) {
    console.error('[category] 状态切换失败', error)
    ElMessage.error('操作失败，请稍后重试')
  }
}
</script>

<template>
  <div>
    <TopBar title="分类管理" />

    <div class="page category-page">
      <header class="cat-head">
        <p class="eyebrow">CATEGORIES</p>
        <h1 class="display-title">分类</h1>
        <p class="cat-tip">停用后的类别不再出现在筛选里，已经录入的衣物会保留原来的分类。</p>
      </header>

      <button type="button" class="add-primary" @click="openAddPrimary">
        <el-icon :size="14"><Plus /></el-icon>
        新增一级类别
      </button>

      <section
        v-for="primary in primaryCategories"
        :key="primary.id"
        class="cat-card"
        :class="{ 'is-off': !primary.active }"
      >
        <div class="cat-card__head">
          <div class="cat-card__title">
            <h2>{{ primary.name }}</h2>
            <span v-if="!primary.active" class="inactive-tag">已停用</span>
            <span class="cat-card__count">{{ allSubs(primary.id).length }} 个二级</span>
          </div>
          <div class="cat-card__actions">
            <button type="button" @click="openEdit(primary)">编辑</button>
            <button type="button" @click="toggleActive(primary)">
              {{ primary.active ? '停用' : '启用' }}
            </button>
          </div>
        </div>

        <div class="sub-list">
          <button
            v-for="sub in allSubs(primary.id)"
            :key="sub.id"
            type="button"
            class="sub-chip"
            :class="{ 'is-off': !sub.active }"
            @click="openEdit(sub)"
          >
            <span>{{ sub.name }}</span>
            <el-icon :size="10"><EditPen /></el-icon>
          </button>

          <button type="button" class="sub-chip sub-chip--add" @click="openAddSub(primary)">
            <el-icon :size="10"><Plus /></el-icon>
            新增
          </button>
        </div>
      </section>

      <p class="cat-foot">点击二级类别可以改名或停用</p>
    </div>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      :width="isMobile ? '88%' : '380px'"
      align-center
      :close-on-click-modal="false"
    >
      <el-form ref="dialogFormRef" :model="dialogForm" :rules="dialogRules" label-position="top">
        <el-form-item label="类别名称" prop="name">
          <el-input v-model="dialogForm.name" maxlength="20" placeholder="例如：上装 / T恤" clearable />
        </el-form-item>
        <el-form-item v-if="dialogMode === 'edit'" label="状态">
          <el-switch v-model="dialogForm.active" inline-prompt active-text="启用" inactive-text="停用" />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="submitting" @click="submitDialog">保存</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.category-page {
  padding-top: 4px;
}

.cat-head {
  margin-bottom: 18px;
}

.cat-tip {
  max-width: 320px;
  margin-top: 8px;
  font-size: 12px;
  line-height: 1.7;
  color: var(--text-3);
}

.add-primary {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  height: 44px;
  margin-bottom: 14px;
  border: 1px dashed rgba(61, 92, 76, 0.38);
  border-radius: var(--radius-md);
  background: rgba(229, 236, 227, 0.4);
  color: var(--accent-deep);
  font-size: 13px;
}

.cat-card {
  margin-bottom: 12px;
  padding: 14px;
  border-radius: var(--radius-md);
  background: var(--surface);
  box-shadow: var(--shadow-soft);
  transition: opacity 0.2s ease;
}

.cat-card.is-off {
  opacity: 0.66;
}

.cat-card__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.cat-card__title {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.cat-card__title h2 {
  font-size: 15px;
  font-weight: 600;
}

.cat-card__count {
  font-size: 10.5px;
  color: var(--text-3);
}

.inactive-tag {
  padding: 1px 7px;
  border-radius: 999px;
  background: var(--surface-2);
  color: var(--text-3);
  font-size: 10px;
}

.cat-card__actions {
  display: flex;
  flex: 0 0 auto;
  gap: 2px;
}

.cat-card__actions button {
  padding: 4px 6px;
  border: none;
  background: transparent;
  color: var(--accent);
  font-size: 11.5px;
}

.cat-card__actions button:last-child {
  color: var(--text-3);
}

.sub-list {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin-top: 12px;
}

.sub-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 29px;
  padding: 0 10px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: transparent;
  color: var(--text-2);
  font-size: 12px;
}

.sub-chip .el-icon {
  color: var(--text-3);
}

.sub-chip.is-off {
  border-style: dashed;
  color: var(--text-3);
  text-decoration: line-through;
}

.sub-chip--add {
  border-style: dashed;
  border-color: rgba(61, 92, 76, 0.35);
  color: var(--accent);
}

.cat-foot {
  margin-top: 20px;
  text-align: center;
  font-size: 10.5px;
  color: var(--text-3);
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.dialog-footer .el-button {
  margin: 0;
}
</style>
