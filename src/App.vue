<template>
  <div class="container">
    <!-- 登录/注册弹窗 -->
    <AuthModal v-if="!isLoggedIn" @success="handleAuthSuccess" />

    <!-- 已登录状态 -->
    <template v-else>
      <!-- 导航栏 -->
      <AppHeader
        @upload="isUploadOpen = true"
        @manageCategories="isCategoryManageOpen = true"
        @logout="handleLogout"
      />

      <!-- 图片上传弹窗 -->
      <PhotoUpload
        :is-open="isUploadOpen"
        @close="isUploadOpen = false"
        @success="handleUploadSuccess"
      />

      <!-- 分类管理弹窗 -->
      <CategoryManage
        :is-open="isCategoryManageOpen"
        @close="isCategoryManageOpen = false"
      />

      <!-- 图片展示 -->
      <PhotoGallery />
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useAuthStore } from './stores/auth';
import { usePhotoStore } from './stores/photo';
import { useCategoryStore } from './stores/category';

// 组件导入
import AuthModal from './components/AuthModal.vue';
import AppHeader from './components/AppHeader.vue';
import PhotoGallery from './components/PhotoGallery.vue';
import PhotoUpload from './components/PhotoUpload.vue';
import CategoryManage from './components/CategoryManage.vue';

// 状态管理
const authStore = useAuthStore();
const photoStore = usePhotoStore();
const categoryStore = useCategoryStore();

// 响应式状态
const isUploadOpen = ref(false);
const isCategoryManageOpen = ref(false);

// 计算属性
const isLoggedIn = computed(() => authStore.isLoggedIn);

// 生命周期
onMounted(async () => {
  // 初始化认证状态
  authStore.initializeFromStorage();
  
  if (isLoggedIn.value) {
    // 加载分类和图片
    await Promise.all([
      categoryStore.loadCategories(),
      photoStore.loadPhotos(authStore.currentUser.id)
    ]);
  }
});

// 认证成功处理
const handleAuthSuccess = async () => {
  // 加载分类和图片
  await Promise.all([
    categoryStore.loadCategories(),
    photoStore.loadPhotos(authStore.currentUser.id)
  ]);
};

// 上传成功处理
const handleUploadSuccess = async () => {
  // 重新加载图片
  await photoStore.loadPhotos(authStore.currentUser.id);
};

// 退出登录处理
const handleLogout = () => {
  // 清空状态
  photoStore.photos.value = [];
};
</script>

<style scoped>
.container {
  min-height: 100vh;
  background-color: #f5f5f5;
}
</style>