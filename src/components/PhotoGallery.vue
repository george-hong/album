<template>
  <div class="photoGallery">
    <!-- 导航栏 -->
    <header class="header">
      <div class="logo">相册网站</div>
      
      <div class="headerButtons">
        <span class="userInfo">{{ currentUser.username }}</span>
        <el-button type="primary" @click="isUploadOpen = true">
          <template #icon>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
          </template>
          上传图片
        </el-button>
        <el-button @click="$router.push('/categories')">
          <template #icon>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h16z"></path></svg>
          </template>
          分类管理
        </el-button>
        <el-button @click="handleLogout">
          退出
        </el-button>
      </div>
    </header>
    
    <div class="galleryContent">
    <!-- 分类选择 - 小标签形式 -->
    <div class="categoryFilter">
      <div class="categoryFilterHeader">
        <div class="categoryFilterTitle">
          <el-icon><Folder /></el-icon>
          <span>分类筛选</span>
        </div>
        <div class="filterModeToggle" v-if="selectedCategories.length > 0">
          <span class="filterModeLabel">筛选模式：</span>
          <el-button
            size="small"
            :type="filterMode === 'AND' ? 'primary' : ''"
            @click="setFilterMode('AND')"
          >
            交集
          </el-button>
          <el-button
            size="small"
            :type="filterMode === 'OR' ? 'primary' : ''"
            @click="setFilterMode('OR')"
          >
            并集
          </el-button>
        </div>
      </div>
      <div class="categoryTags">
        <div
          v-for="category in categories"
          :key="category.id"
          class="categoryTag"
          :class="{ 'active': selectedCategories.includes(category.id) }"
          @click="toggleCategory(category.id)"
        >
          {{ category.name }}
        </div>
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
          <!-- 模糊背景图片 -->
          <div 
            class="photoImageBg"
            :style="{ backgroundImage: `url(${photo.path})` }"
          ></div>
          <!-- 主图片 -->
          <img
            :src="photo.path"
            :alt="photo.filename"
            class="photoImage"
            @click="openImageViewer(photo)"
          />
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
            <button
              class="deletePhotoButton"
              @click="showDeleteConfirm(photo)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
            </button>
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
    
    <!-- 图片上传弹窗 -->
    <PhotoUpload
      :is-open="isUploadOpen"
      @close="isUploadOpen = false"
      @success="handleUploadSuccess"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { Folder } from '@element-plus/icons-vue';
import { usePhotoStore } from '../stores/photo';
import { useCategoryStore } from '../stores/category';
import { useAuthStore } from '../stores/auth';
import ImageViewer from './ImageViewer.vue';
import DeleteConfirm from './DeleteConfirm.vue';
import PhotoUpload from './PhotoUpload.vue';

const router = useRouter();
const photoStore = usePhotoStore();
const categoryStore = useCategoryStore();
const authStore = useAuthStore();

const isImageViewerOpen = ref(false);
const viewerImageUrl = ref('');
const isDeleteConfirmOpen = ref(false);
const deletePhotoId = ref('');
const deletePhotoName = ref('');
const isUploadOpen = ref(false);

const currentUser = computed(() => authStore.currentUser);

const categories = computed(() => categoryStore.categories);

const filteredPhotos = computed(() => photoStore.filteredPhotos);
const filterMode = computed({
  get: () => photoStore.filterMode,
  set: (value) => photoStore.setFilterMode(value)
});
const selectedCategories = computed({
  get: () => photoStore.selectedCategories,
  set: (value) => photoStore.setSelectedCategories(value)
});

const setFilterMode = (mode) => {
  photoStore.setFilterMode(mode);
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

const toggleCategory = (categoryId) => {
  const index = selectedCategories.value.indexOf(categoryId);
  if (index > -1) {
    selectedCategories.value.splice(index, 1);
  } else {
    selectedCategories.value.push(categoryId);
  }
};

const handleUploadSuccess = async () => {
  await photoStore.loadPhotos(authStore.currentUser.id);
};

const handleLogout = () => {
  authStore.logout();
  photoStore.photos.value = [];
  router.push('/');
};
</script>

<style scoped>
.header {
  background-color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 1rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 100;
}

.logo {
  font-size: 1.5rem;
  font-weight: bold;
  color: #333;
}

.headerButtons {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.userInfo {
  font-size: 0.9rem;
  color: #666;
  margin-right: 0.5rem;
}

.photoGallery {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.galleryContent {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.categoryFilter {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background-color: white;
  border-radius: 8px;
  border: 1px solid #eee;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.categoryFilterHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.categoryFilterTitle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.1rem;
  font-weight: 600;
  color: #303133;
}

.categoryFilterTitle .el-icon {
  font-size: 1.3rem;
  color: #409EFF;
}

.filterModeToggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.filterModeLabel {
  font-size: 0.9rem;
  color: #606266;
}

.categoryTags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.categoryTag {
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 1rem;
  background-color: #f5f7fa;
  border: 1px solid #e4e7ed;
  border-radius: 16px;
  font-size: 0.9rem;
  color: #606266;
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;
}

.categoryTag:hover {
  background-color: #ecf5ff;
  border-color: #409EFF;
  color: #409EFF;
}

.categoryTag.active {
  background-color: #409EFF;
  border-color: #409EFF;
  color: white;
  font-weight: 500;
}

.categoryTag.active:hover {
  background-color: #66b1ff;
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
  background-color: #f0f0f0;
}

.photoImageBg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  filter: blur(10px);
  z-index: 1;
  opacity: 0.7;
}

.photoImage {
  width: 100%;
  height: 100%;
  object-fit: contain;
  cursor: pointer;
  position: relative;
  z-index: 2;
}

.photoCategories {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  width: 100%;
  align-items: center;
}

.deletePhotoButton {
  background: none;
  border: none;
  cursor: pointer;
  color: #ff4757;
  padding: 0.25rem;
  border-radius: 4px;
  transition: background-color 0.3s, opacity 0.3s;
  opacity: 0;
  margin-left: auto;
}

.photoCard:hover .deletePhotoButton {
  opacity: 1;
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