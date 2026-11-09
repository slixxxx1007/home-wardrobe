<script setup>
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import OptionChips from '@/components/option-chips.vue'
import PhotoPicker from '@/components/photo-picker.vue'
import {
  CLOTHING_STATUS,
  COLORS,
  LOCATION_OPTIONS,
  OCCASIONS,
  OWNERS,
  SEASONS,
  SIZE_OPTIONS,
  THICKNESS
} from '@/constants/clothing'
import { useCategoryStore } from '@/stores/category'
import { useWardrobeStore } from '@/stores/wardrobe'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  cloth: { type: Object, default: null },
  defaultOwner: { type: String, default: 'me' }
})

const emit = defineEmits(['update:modelValue', 'saved'])

const categoryStore = useCategoryStore()
const wardrobeStore = useWardrobeStore()

const formRef = ref(null)
const saving = ref(false)
const submitted = ref(false)
const isMobile = window.matchMedia('(max-width: 640px)').matches

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const dialogTitle = computed(() => (props.cloth ? '编辑衣物' : '添加衣物'))

const primaryOptions = computed(() =>
  categoryStore.activePrimaryCategories.map((item) => ({ value: item.id, label: item.name }))
)

const subOptions = computed(() =>
  categoryStore.subsOf(form.categoryId).map((item) => ({ value: item.id, label: item.name }))
)

/**
 * @returns {object} 空表单
 */
function emptyForm() {
  return {
    id: '',
    owner: props.defaultOwner,
    categoryId: '',
    subCategoryId: '',
    name: '',
    color: '',
    seasons: [],
    occasions: [],
    thickness: '',
    size: '',
    location: '',
    status: 'active',
    brand: '',
    price: null,
    purchaseDate: '',
    photo: ''
  }
}

const form = reactive(emptyForm())

const rules = {
  name: [
    { required: true, message: '给这件衣物起个名字', trigger: 'blur' },
    { max: 40, message: '名字最多 40 个字', trigger: 'blur' }
  ],
  categoryId: [{ required: true, message: '请选择一级类别', trigger: 'change' }],
  subCategoryId: [{ required: true, message: '请选择二级类别', trigger: 'change' }]
}

watch(
  () => props.modelValue,
  async (open) => {
    if (!open) return
    submitted.value = false
    saving.value = false

    const source = props.cloth
    Object.assign(form, emptyForm())
    if (source) {
      Object.assign(form, {
        id: source.id || '',
        owner: source.owner || props.defaultOwner,
        categoryId: source.categoryId || '',
        subCategoryId: source.subCategoryId || '',
        name: source.name || '',
        color: source.color || '',
        seasons: Array.isArray(source.seasons) ? source.seasons.slice() : [],
        occasions: Array.isArray(source.occasions) ? source.occasions.slice() : [],
        thickness: source.thickness || '',
        size: source.size || '',
        location: source.location || '',
        status: source.status || 'active',
        brand: source.brand || '',
        price: source.price ?? null,
        purchaseDate: source.purchaseDate || '',
        photo: source.photo || ''
      })
    }

    await nextTick()
    formRef.value?.clearValidate()
  }
)

/**
 * 切换一级类别时清空二级类别
 * @param {string} value
 */
function selectCategory(value) {
  form.categoryId = value
  form.subCategoryId = ''
  if (submitted.value) formRef.value?.validateField('categoryId')
}

/**
 * 提交表单
 * @returns {Promise<void>}
 */
async function submit() {
  if (!formRef.value) return
  submitted.value = true

  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  saving.value = true
  try {
    const saved = await wardrobeStore.saveCloth({
      id: form.id,
      owner: form.owner,
      categoryId: form.categoryId,
      subCategoryId: form.subCategoryId,
      name: form.name.trim(),
      color: form.color,
      seasons: form.seasons,
      occasions: form.occasions,
      thickness: form.thickness,
      size: form.size,
      location: form.location,
      status: form.status,
      brand: form.brand.trim(),
      price: Number.isFinite(form.price) ? form.price : null,
      purchaseDate: form.purchaseDate,
      photo: form.photo
    })

    ElMessage.success(props.cloth ? '已保存修改' : '已放进衣橱')
    emit('saved', saved)
    visible.value = false
  } catch (error) {
    console.error('[cloth-form] 保存失败', error)
    ElMessage.error('保存失败，请稍后重试')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <el-dialog
    v-model="visible"
    :title="dialogTitle"
    :fullscreen="isMobile"
    width="520px"
    top="5vh"
    class="cloth-dialog"
    :close-on-click-modal="false"
  >
    <div class="cloth-dialog__inner">
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        class="cloth-form"
        scroll-to-error
        @submit.prevent
      >
        <el-form-item label="归属" prop="owner">
          <option-chips v-model="form.owner" :options="OWNERS" />
        </el-form-item>

        <el-form-item label="照片">
          <photo-picker v-model="form.photo" />
        </el-form-item>

        <el-form-item label="一级类别" prop="categoryId">
          <option-chips
            :model-value="form.categoryId"
            :options="primaryOptions"
            @update:model-value="selectCategory"
          />
        </el-form-item>

        <el-form-item label="二级类别" prop="subCategoryId">
          <option-chips v-if="subOptions.length" v-model="form.subCategoryId" :options="subOptions" size="sm" />
          <p v-else-if="form.categoryId" class="form-tip">该类别下还没有二级类别，可到「分类管理」添加。</p>
          <p v-else class="form-tip">先选一级类别，再选二级类别。</p>
        </el-form-item>

        <el-form-item label="名称" prop="name">
          <el-input
            v-model="form.name"
            maxlength="40"
            placeholder="例如：米色羊绒大衣"
            clearable
          />
        </el-form-item>

        <el-form-item label="颜色">
          <option-chips v-model="form.color" :options="COLORS" size="sm" />
          <el-input
            v-model="form.color"
            class="form-subinput"
            size="small"
            placeholder="不在上面？直接输入颜色名称"
            clearable
          />
        </el-form-item>

        <el-form-item label="适合季节">
          <option-chips v-model="form.seasons" :options="SEASONS" multiple size="sm" />
        </el-form-item>

        <el-form-item label="适合场合">
          <option-chips v-model="form.occasions" :options="OCCASIONS" multiple size="sm" />
        </el-form-item>

        <el-form-item label="厚度">
          <option-chips v-model="form.thickness" :options="THICKNESS" size="sm" />
        </el-form-item>

        <div class="field-row">
          <el-form-item label="尺码">
            <el-select
              v-model="form.size"
              class="full-width"
              filterable
              allow-create
              default-first-option
              placeholder="选择或输入"
            >
              <el-option v-for="size in SIZE_OPTIONS" :key="size" :label="size" :value="size" />
            </el-select>
          </el-form-item>

          <el-form-item label="状态">
            <el-select v-model="form.status" class="full-width">
              <el-option
                v-for="status in CLOTHING_STATUS"
                :key="status.value"
                :label="status.label"
                :value="status.value"
              />
            </el-select>
          </el-form-item>
        </div>

        <el-form-item label="存放位置">
          <el-select
            v-model="form.location"
            class="full-width"
            filterable
            allow-create
            default-first-option
            placeholder="例如：衣柜中层、鞋柜"
          >
            <el-option v-for="location in LOCATION_OPTIONS" :key="location" :label="location" :value="location" />
          </el-select>
        </el-form-item>

        <el-form-item label="品牌（选填）">
          <el-input v-model="form.brand" maxlength="30" placeholder="例如：Uniqlo" clearable />
        </el-form-item>

        <div class="field-row">
          <el-form-item label="价格（选填）">
            <el-input-number
              v-model="form.price"
              class="full-width"
              :min="0"
              :precision="2"
              :controls="false"
              placeholder="¥"
            />
          </el-form-item>

          <el-form-item label="购买时间（选填）">
            <el-date-picker
              v-model="form.purchaseDate"
              class="full-width"
              type="date"
              value-format="YYYY-MM-DD"
              placeholder="选择日期"
            />
          </el-form-item>
        </div>
      </el-form>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button size="large" @click="visible = false">取消</el-button>
        <el-button size="large" type="primary" :loading="saving" @click="submit">保存</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped>
.cloth-dialog__inner {
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
}

.cloth-form :deep(.el-form-item__label) {
  font-size: 12px;
  font-weight: 400;
  color: var(--text-2);
  letter-spacing: 0.04em;
  line-height: 1.6;
  padding-bottom: 6px;
}

.form-tip {
  font-size: 12px;
  color: var(--text-3);
  line-height: 1.6;
}

.form-subinput {
  margin-top: 10px;
}

.field-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.full-width {
  width: 100%;
}

.dialog-footer {
  display: flex;
  gap: 10px;
}

.dialog-footer .el-button {
  flex: 1;
  margin: 0;
}
</style>

<style>
.cloth-dialog.is-fullscreen {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  overflow: hidden;
  padding-top: var(--safe-top);
}

.cloth-dialog.is-fullscreen .el-dialog__body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding-bottom: 24px;
}

.cloth-dialog.is-fullscreen .el-dialog__footer {
  flex: 0 0 auto;
  background: var(--bg);
  border-top: 1px solid var(--line);
}
</style>
