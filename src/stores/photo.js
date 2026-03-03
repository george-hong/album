import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { getPhotos, addPhoto, deletePhoto as dbDeletePhoto } from '../db';

export const usePhotoStore = defineStore('photo', () => {
  const photos = ref([]);
  const searchTerm = ref('');
  const selectedCategories = ref([]);
  
  const filteredPhotos = computed(() => {
    return photos.value.filter(photo => {
      const matchesCategory = selectedCategories.value.length === 0 || 
        selectedCategories.value.every(categoryId => photo.categories.includes(categoryId));
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
  
  return {
    photos,
    searchTerm,
    selectedCategories,
    filteredPhotos,
    loadPhotos,
    uploadPhoto,
    deletePhoto,
    setSearchTerm,
    setSelectedCategories
  };
});