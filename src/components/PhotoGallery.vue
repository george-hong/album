<template>
  <div class="photoGallery">
    <!-- 分类选择 -->
    <div class="categoryFilters">
      <div
        v-for="category in categories"
        :key="category.id"
        class="categoryFilter"
        :class="{ active: selectedCategories.includes(category.id) }"
        @click="toggleCategory(category.id)"
      >
        {{ category.name }}
      </div>
    </div>

    <!-- 图片网格 -->
    <div v-if="filteredPhotos.length > 0" class="photoGrid">
      <div
        v-for="photo in filteredPhotos"
        :key="photo.id"
        class="photoCard"
      >
        <div class="photoImageContainer">
          <img
            :src="photo.path"
            :alt="photo.filename"
            class="photoImage"
            @click="openImageViewer(photo)"
          />
          <div class="photoActions">
            <button
              class="deletePhotoButton"
              @click="showDeleteConfirm(photo)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
            </button>
          </div>
        </div>
        <div class="photoInfo">
          <div class="photoFilename">{{ photo.filename }}</div>
          <div class="photoCategories">
            <span
              v-for="categoryId in photo.categories"
              :key="categoryId"
              class="photoCategory"
            >
              {{ getCategoryName(categoryId) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="emptyState">
      <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
      <p>暂无图片</p>
    </div>

    <!-- 图片查看器 -->
    <ImageViewer
      :is-open="isImageViewerOpen"
      :image-url="viewerImageUrl"
      @close="isImageViewerOpen = false"
    />

    <!-- 删除确认 -->
    <DeleteConfirm
      :is-open="isDeleteConfirmOpen"
      :photo-id="deletePhotoId"
      :photo-name="deletePhotoName"
      @close="isDeleteConfirmOpen = false"
      @confirm="handleDeleteConfirm"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { usePhotoStore } from '../stores/photo';
import { useCategoryStore } from '../stores/category';
import ImageViewer from './ImageViewer.vue';
import DeleteConfirm from './DeleteConfirm.vue';

const photoStore = usePhotoStore();
const categoryStore = useCategoryStore();

const isImageViewerOpen = ref(false);
const viewerImageUrl = ref('');
const isDeleteConfirmOpen = ref(false);
const deletePhotoId = ref('');
const deletePhotoName = ref('');

const categories = computed(() => categoryStore.categories);
const filteredPhotos = computed(() => photoStore.filteredPhotos);
const selectedCategories = computed({
  get: () => photoStore.selectedCategories,
  set: (value) => photoStore.setSelectedCategories(value)
});

const toggleCategory = (categoryId) => {
  const current = [...selectedCategories.value];
  const index = current.indexOf(categoryId);
  if (index > -1) {
    current.splice(index, 1);
  } else {
    current.push(categoryId);
  }
  selectedCategories.value = current;
};

const openImageViewer = (photo) => {
  viewerImageUrl.value = photo.path;
  isImageViewerOpen.value = true;
};

const showDeleteConfirm = (photo) => {
  deletePhotoId.value = photo.id;
  deletePhotoName.value = photo.filename;
  isDeleteConfirmOpen.value = true;
};

const handleDeleteConfirm = async (photoId) => {
  try {
    await photoStore.deletePhoto(photoId);
  } catch (error) {
    console.error('删除图片失败:', error);
  }
};

const getCategoryName = (categoryId) => {
  const category = categories.value.find(c => c.id === categoryId);
  return category ? category.name : '未知';
};
</script>

<style scoped>
.photoGallery {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.categoryFilters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 2rem;
}

.categoryFilter {
  padding: 0.5rem 1rem;
  background-color: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 16px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s;
}

.categoryFilter:hover {
  background-color: #e0e0e0;
}

.categoryFilter.active {
  background-color: #0070f3;
  color: white;
  border-color: #0070f3;
}

.photoGrid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
}

.photoCard {
  background-color: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s, box-shadow 0.3s;
}

.photoCard:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.photoImageContainer {
  position: relative;
  height: 200px;
  overflow: hidden;
}

.photoImage {
  width: 100%;
  height: 100%;
  object-fit: contain;
  cursor: pointer;
  transition: transform 0.3s;
  background-color: #f0f0f0;
}

.photoImage:hover {
  transform: scale(1.05);
}

.photoActions {
  position: absolute;
  top: 10px;
  right: 10px;
  opacity: 0;
  transition: opacity 0.3s;
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 4px;
  padding: 0.25rem;
}

.photoCard:hover .photoActions {
  opacity: 1;
}

.deletePhotoButton {
  background: none;
  border: none;
  cursor: pointer;
  color: #ff4757;
  padding: 0.5rem;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.deletePhotoButton:hover {
  background-color: rgba(255, 71, 87, 0.1);
}

.photoInfo {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: flex-start;
}

.photoFilename {
  font-size: 0.9rem;
  font-weight: 500;
  color: #333;
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.photoCategories {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  width: 100%;
}

.photoCategory {
  font-size: 0.8rem;
  color: #666;
  background-color: #f0f0f0;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
}

.emptyState {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  color: #999;
}

.emptyState svg {
  margin-bottom: 1rem;
  opacity: 0.5;
}

.emptyState p {
  margin: 0;
  font-size: 1.1rem;
}

@media (max-width: 768px) {
  .photoGallery {
    padding: 1rem;
  }
  
  .photoGrid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 1rem;
  }
  
  .photoImageContainer {
    height: 150px;
  }
}
</style>