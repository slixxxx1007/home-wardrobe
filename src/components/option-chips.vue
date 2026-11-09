<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: { type: [String, Array], default: '' },
  options: { type: Array, default: () => [] },
  multiple: { type: Boolean, default: false },
  size: { type: String, default: 'md' },
  variant: { type: String, default: 'solid' },
  scroll: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue'])

const isMultiple = computed(() => props.multiple)

/**
 * 判断某个选项是否选中
 * @param {string} value
 * @returns {boolean}
 */
function isActive(value) {
  return isMultiple.value
    ? Array.isArray(props.modelValue) && props.modelValue.includes(value)
    : props.modelValue === value
}

/**
 * 点击选项：多选切换、单选直接赋值
 * @param {string} value
 */
function toggle(value) {
  if (isMultiple.value) {
    const list = Array.isArray(props.modelValue) ? props.modelValue.slice() : []
    const index = list.indexOf(value)
    if (index >= 0) list.splice(index, 1)
    else list.push(value)
    emit('update:modelValue', list)
    return
  }
  emit('update:modelValue', value)
}
</script>

<template>
  <div class="chips" :class="{ 'chips--scroll': scroll }">
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      class="chip"
      :class="[
        size === 'sm' && 'chip--sm',
        variant === 'outline' && 'chip--outline',
        isActive(option.value) && 'is-active'
      ]"
      @click="toggle(option.value)"
    >
      <span v-if="option.hex" class="chip__dot" :style="{ background: option.hex }" />
      <span>{{ option.label }}</span>
    </button>
  </div>
</template>

<style scoped>
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chips--scroll {
  flex-wrap: nowrap;
  overflow-x: auto;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}

.chips--scroll::-webkit-scrollbar {
  display: none;
}

.chip__dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.14) inset;
  flex: 0 0 auto;
}
</style>
