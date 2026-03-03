import { defineStore } from 'pinia';
import { ref } from 'vue';
import { getCategories, addCategory as dbAddCategory, deleteCategory as dbDeleteCategory } from '../db';

export const useCategoryStore = defineStore('category', () => {
  const categories = ref([
    { id: '1', name: '全部' },
    { id: '2', name: '风景' },
    { id: '3', name: '人物' },
    { id: '4', name: '动物' },
    { id: '5', name: '建筑' },
  ]);
  
  async function loadCategories() {
    const cats = await getCategories();
    if (cats.length > 0) {
      categories.value = cats;
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
  
  return {
    categories,
    loadCategories,
    addCategory,
    deleteCategory
  };
});