<template>
  <div v-if="isOpen" class="categoryModal">
    <div class="categoryModalContent">
      <div class="categoryModalHeader">
        <h2>分类管理</h2>
        <button class="closeButton" @click="close">&times;</button>
      </div>
      
      <div class="categoryForm">
        <div class="formGroup">
          <label class="label">添加新分类</label>
          <div class="formRow">
            <input
              type="text"
              v-model="newCategory"
              class="input"
              placeholder="请输入分类名称"
            />
            <button 
              type="button" 
              class="addButton"
              @click="handleAddCategory"
              :disabled="!newCategory.trim()"
            >
              添加
            </button>
          </div>
        </div>
      </div>
      
      <div class="categoryList">
        <h3>分类列表</h3>
        <div class="categoryItems">
          <div
            v-for="category in categories"
            :key="category.id"
            class="categoryItem"
          >
            <span class="categoryName">{{ category.name }}</span>
            <button
              v-if="category.id !== '1'" 
              type="button"
              class="deleteButton"
              @click="handleDeleteCategory(category.id)"
            >
              删除
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useCategoryStore } from '../stores/category';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close']);

const categoryStore = useCategoryStore();
const newCategory = ref('');

const categories = computed(() => categoryStore.categories);

const close = () => {
  emit('close');
  newCategory.value = '';
};

const handleAddCategory = async () => {
  if (newCategory.value.trim()) {
    try {
      await categoryStore.addCategory({
        name: newCategory.value.trim()
      });
      newCategory.value = '';
    } catch (error) {
      console.error('添加分类失败:', error);
    }
  }
};

const handleDeleteCategory = async (categoryId) => {
  if (confirm('确定要删除这个分类吗？')) {
    try {
      await categoryStore.deleteCategory(categoryId);
    } catch (error) {
      console.error('删除分类失败:', error);
    }
  }
};
</script>

<style scoped>
.categoryModal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}

.categoryModalContent {
  background-color: white;
  border-radius: 8px;
  padding: 2rem;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  max-height: 90vh;
  overflow-y: auto;
}

.categoryModalHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.categoryModalHeader h2 {
  margin: 0;
  font-size: 1.25rem;
  color: #333;
}

.closeButton {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #999;
  transition: color 0.3s;
}

.closeButton:hover {
  color: #333;
}

.categoryForm {
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #eee;
}

.formGroup {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.label {
  font-size: 0.9rem;
  font-weight: 500;
  color: #333;
}

.formRow {
  display: flex;
  gap: 0.75rem;
}

.input {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.3s;
}

.input:focus {
  border-color: #0070f3;
}

.addButton {
  padding: 0.75rem 1.5rem;
  background-color: #0070f3;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s;
  white-space: nowrap;
}

.addButton:hover {
  background-color: #0050c3;
}

.addButton:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.categoryList {
  margin-top: 1rem;
}

.categoryList h3 {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  color: #333;
}

.categoryItems {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.categoryItem {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background-color: #f9f9f9;
  border-radius: 4px;
  border: 1px solid #eee;
}

.categoryName {
  font-size: 0.9rem;
  color: #333;
}

.deleteButton {
  padding: 0.5rem 1rem;
  background-color: #ff4757;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: background-color 0.3s;
}

.deleteButton:hover {
  background-color: #ff3742;
}
</style>