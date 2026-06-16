import { defineStore } from 'pinia';
import { ref } from 'vue';
import {
  getCategories,
  addCategory as dbAddCategory,
  deleteCategory as dbDeleteCategory,
  updateCategory as dbUpdateCategory
} from '../db';

export const useCategoryStore = defineStore('category', () => {
  const categories = ref([]);
  const isLoading = ref(false);
  const loadError = ref('');

  async function loadCategories() {
    isLoading.value = true;
    loadError.value = '';
    try {
      categories.value = await getCategories();
    } catch (error) {
      loadError.value = error.message || '分类加载失败，请稍后重试';
      console.error('加载分类失败:', error);
    } finally {
      isLoading.value = false;
    }
  }

  async function addCategory(categoryData) {
    await dbAddCategory(categoryData);
    await loadCategories();
  }

  async function deleteCategory(categoryId) {
    await dbDeleteCategory(categoryId);
    await loadCategories();
  }

  async function updateCategory(categoryId, categoryData) {
    await dbUpdateCategory(categoryId, categoryData);
    await loadCategories();
  }

  return {
    categories,
    isLoading,
    loadError,
    loadCategories,
    addCategory,
    deleteCategory,
    updateCategory
  };
});
