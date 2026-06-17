import { defineStore } from 'pinia';
import { ref } from 'vue';
import {
  getPhotos,
  addPhoto,
  deletePhoto as dbDeletePhoto,
  updatePhoto as dbUpdatePhoto,
  updatePhotos as dbUpdatePhotos,
  syncPhotoDimensions as dbSyncPhotoDimensions
} from '../db';

const PAGE_SIZE = 24;

export const usePhotoStore = defineStore('photo', () => {
  const photos = ref([]);
  const searchTerm = ref('');
  const selectedCategories = ref([]);
  const filterMode = ref('AND');
  const page = ref(1);
  const total = ref(0);
  const hasMore = ref(true);
  const isLoading = ref(false);
  const isRefreshing = ref(false);
  const loadError = ref('');

  async function loadPhotos(userId, options = {}) {
    if (!userId || isLoading.value) {
      return;
    }

    const shouldReset = options.reset ?? false;
    const nextPage = shouldReset ? 1 : page.value;

    isLoading.value = true;
    isRefreshing.value = shouldReset;
    loadError.value = '';

    try {
      const result = await getPhotos(userId, {
        page: nextPage,
        limit: PAGE_SIZE,
        search: searchTerm.value,
        categories: selectedCategories.value,
        filterMode: filterMode.value
      });

      photos.value = shouldReset ? result.items : [...photos.value, ...result.items];
      page.value = result.page + 1;
      total.value = result.total;
      hasMore.value = result.hasMore;
    } catch (error) {
      loadError.value = error.message || '照片加载失败，请稍后重试';
      if (!shouldReset) {
        hasMore.value = false;
      }
    } finally {
      isLoading.value = false;
      isRefreshing.value = false;
    }
  }

  async function refreshPhotos(userId) {
    hasMore.value = true;
    page.value = 1;
    await loadPhotos(userId, { reset: true });
  }

  async function loadMorePhotos(userId) {
    if (!hasMore.value || isLoading.value) {
      return;
    }
    await loadPhotos(userId);
  }

  async function uploadPhoto(formData) {
    await addPhoto(formData);
  }

  async function deletePhoto(photoId) {
    await dbDeletePhoto(photoId);
    photos.value = photos.value.filter(p => p.id !== photoId);
    total.value = Math.max(total.value - 1, 0);
  }

  async function updatePhoto(photoId, photoData) {
    const updatedPhoto = await dbUpdatePhoto(photoId, photoData);
    photos.value = photos.value.map(photo => (
      photo.id === updatedPhoto.id ? updatedPhoto : photo
    ));
    return updatedPhoto;
  }

  async function updatePhotos(photoIds, photoData) {
    const updatedPhotos = await dbUpdatePhotos(photoIds, photoData);
    const updatedById = new Map(updatedPhotos.map(photo => [photo.id, photo]));
    photos.value = photos.value.map(photo => updatedById.get(photo.id) || photo);
    return updatedPhotos;
  }

  async function syncPhotoDimensions(userId, options = {}) {
    return await dbSyncPhotoDimensions(userId, options);
  }

  function setSearchTerm(term) {
    searchTerm.value = term;
  }

  function setSelectedCategories(categories) {
    selectedCategories.value = [...categories];
  }

  function setFilterMode(mode) {
    filterMode.value = mode;
  }

  function toggleCategory(categoryId) {
    if (selectedCategories.value.includes(categoryId)) {
      selectedCategories.value = selectedCategories.value.filter(id => id !== categoryId);
    } else {
      selectedCategories.value = [...selectedCategories.value, categoryId];
    }
  }

  function clearFilters() {
    searchTerm.value = '';
    selectedCategories.value = [];
    filterMode.value = 'AND';
  }

  function resetPhotos() {
    photos.value = [];
    page.value = 1;
    total.value = 0;
    hasMore.value = true;
    isLoading.value = false;
    isRefreshing.value = false;
    loadError.value = '';
  }

  return {
    photos,
    searchTerm,
    selectedCategories,
    filterMode,
    page,
    total,
    hasMore,
    isLoading,
    isRefreshing,
    loadError,
    loadPhotos,
    refreshPhotos,
    loadMorePhotos,
    uploadPhoto,
    deletePhoto,
    updatePhoto,
    updatePhotos,
    syncPhotoDimensions,
    setSearchTerm,
    setSelectedCategories,
    setFilterMode,
    toggleCategory,
    clearFilters,
    resetPhotos
  };
});
