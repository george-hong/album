<template>
  <div class="container">
    <!-- 登录/注册弹窗 -->
    <AuthModal v-if="!isLoggedIn" @success="handleAuthSuccess" />

    <!-- 已登录状态 -->
    <template v-else>
      <!-- 路由视图 -->
      <router-view />
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useAuthStore } from './stores/auth';
import { usePhotoStore } from './stores/photo';
import { useCategoryStore } from './stores/category';
import router from './router';

// 组件导入
import AuthModal from './components/AuthModal.vue';

// 状态管理
const authStore = useAuthStore();
const photoStore = usePhotoStore();
const categoryStore = useCategoryStore();

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
</script>

<style scoped>
.container {
  min-height: 100vh;
  background-color: #f5f5f5;
}
</style>