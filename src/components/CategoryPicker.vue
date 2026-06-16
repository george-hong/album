<template>
  <div class="categoryPicker" :class="{ 'categoryPicker--inline': inline }">
    <el-input
      v-if="searchable"
      v-model="searchTerm"
      class="categorySearch"
      :prefix-icon="Search"
      :placeholder="placeholder"
      clearable
      aria-label="筛选分类"
    />

    <div class="categoryRail">
      <button
        v-if="includeAll"
        type="button"
        class="choiceButton categoryTag"
        :class="{ active: modelValue.length === 0 }"
        :aria-pressed="modelValue.length === 0"
        @click="selectAll"
      >
        全部
      </button>
      <button
        v-for="category in filteredCategories"
        :key="category.id"
        type="button"
        class="choiceButton categoryTag"
        :class="{ active: modelValue.includes(category.id) }"
        :aria-pressed="modelValue.includes(category.id)"
        @click="toggleCategory(category.id)"
      >
        {{ category.name }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { Search } from '@element-plus/icons-vue';

const props = defineProps({
  categories: {
    type: Array,
    default: () => []
  },
  modelValue: {
    type: Array,
    default: () => []
  },
  includeAll: {
    type: Boolean,
    default: false
  },
  searchable: {
    type: Boolean,
    default: true
  },
  inline: {
    type: Boolean,
    default: false
  },
  placeholder: {
    type: String,
    default: '筛选分类'
  }
});

const emit = defineEmits(['update:modelValue', 'change']);

const searchTerm = ref('');

const selectableCategories = computed(() => (
  props.categories.filter(category => category.name !== '全部')
));

const filteredCategories = computed(() => {
  const keyword = searchTerm.value.trim().toLowerCase();
  if (!keyword) {
    return selectableCategories.value;
  }
  return selectableCategories.value.filter(category => (
    category.name.toLowerCase().includes(keyword)
  ));
});

const emitValue = (value) => {
  emit('update:modelValue', value);
  emit('change', value);
};

const selectAll = () => {
  emitValue([]);
};

const toggleCategory = (categoryId) => {
  if (props.modelValue.includes(categoryId)) {
    emitValue(props.modelValue.filter(id => id !== categoryId));
    return;
  }
  emitValue([...props.modelValue, categoryId]);
};
</script>

<style scoped>
.categoryPicker {
  display: grid;
  gap: 0.55rem;
  min-width: 0;
}

.categoryPicker--inline {
  grid-template-columns: minmax(11rem, 16rem) minmax(0, 1fr);
  align-items: center;
}

.categorySearch {
  width: 100%;
}

.categoryRail {
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  padding: 0.12rem 0 0.25rem;
  scrollbar-width: thin;
}

.categoryTag {
  max-width: 10rem;
}

@media (max-width: 720px) {
  .categoryPicker--inline {
    grid-template-columns: 1fr;
  }
}
</style>
