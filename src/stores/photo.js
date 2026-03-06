import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { getPhotos, addPhoto, deletePhoto as dbDeletePhoto } from '../db';

export const usePhotoStore = defineStore('photo', () => {
  const photos = ref([]);
  const searchTerm = ref('');
  const selectedCategories = ref([]);
  const filterMode = ref('AND'); // 'AND' (交集) 或 'OR' (并集)
  
  const filteredPhotos = computed(() => {
    return photos.value.filter(photo => {
      if (selectedCategories.value.length === 0) {
        const matchesSearch = photo.filename.toLowerCase().includes(searchTerm.value.toLowerCase());
        return matchesSearch;
      }
      
      let matchesCategory;
      if (filterMode.value === 'AND') {
        // 交集：包含所有选中的分类
        matchesCategory = selectedCategories.value.every(categoryId => photo.categories.includes(categoryId));
      } else {
        // 并集：包含任一选中的分类
        matchesCategory = selectedCategories.value.some(categoryId => photo.categories.includes(categoryId));
      }
      
      const matchesSearch = photo.filename.toLowerCase().includes(searchTerm.value.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  });
  
  async function loadPhotos(userId) {
    photos.value = await getPhotos(userId);
  }
  
  async function uploadPhoto(formData) {
    await addPhoto(formData);
  }
  
  async function deletePhoto(photoId) {
    await dbDeletePhoto(photoId);
    photos.value = photos.value.filter(p => p.id !== photoId);
  }
  
  function setSearchTerm(term) {
    searchTerm.value = term;
  }
  
  function setSelectedCategories(categories) {
    selectedCategories.value = categories;
  }
  
  function setFilterMode(mode) {
    filterMode.value = mode;
  }
  
  function toggleFilterMode() {
    filterMode.value = filterMode.value === 'AND' ? 'OR' : 'AND';
  }
  
  return {
    photos,
    searchTerm,
    selectedCategories,
    filterMode,
    filteredPhotos,
    loadPhotos,
    uploadPhoto,
    deletePhoto,
    setSearchTerm,
    setSelectedCategories,
    setFilterMode,
    toggleFilterMode
  };
});