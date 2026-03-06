<template>
  <header class="header">
    <div class="logo">相册网站</div>
    
    <!-- 桌面端搜索 -->
    <div class="searchContainer">
      <el-input
        v-model="searchTerm"
        placeholder="搜索图片..."
        prefix-icon="Search"
        style="width: 300px;"
      />
    </div>

    <!-- 桌面端按钮 -->
    <div class="headerButtons">
      <span class="userInfo">{{ currentUser.username }}</span>
      <el-button type="primary" @click="$emit('upload')">
        <template #icon>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
        </template>
        上传图片
      </el-button>
      <el-button @click="$emit('manageCategories')">
        <template #icon>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h16z"></path></svg>
        </template>
        分类管理
      </el-button>
      <el-button @click="handleLogout">
        退出
      </el-button>
    </div>

    <!-- 移动端菜单按钮 -->
    <button
      class="mobileMenuButton"
      @click="isMobileMenuOpen = !isMobileMenuOpen"
    >
      <svg v-if="!isMobileMenuOpen" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
      <svg v-else xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
    </button>
  </header>
  
  <!-- 移动端菜单 -->
  <div v-if="isMobileMenuOpen" class="mobileMenu">
    <div class="mobileSearchContainer">
      <el-input
        v-model="searchTerm"
        placeholder="搜索图片..."
        prefix-icon="Search"
        style="width: 100%;"
      />
    </div>
    <div class="mobileUserInfo">{{ currentUser.username }}</div>
    <el-button type="primary" @click="$emit('upload')" style="width: 100%; margin-bottom: 0.75rem;">
      <template #icon>
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
        上传图片
      </template>
    </el-button>
    <el-button @click="$emit('manageCategories')" style="width: 100%; margin-bottom: 0.75rem;">
      <template #icon>
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h16z"></path></svg>
        分类管理
      </template>
    </el-button>
    <el-button @click="handleLogout" style="width: 100%;">
      退出
    </el-button>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useAuthStore } from '../stores/auth';
import { usePhotoStore } from '../stores/photo';

const emit = defineEmits(['upload', 'manageCategories', 'logout']);

const authStore = useAuthStore();
const photoStore = usePhotoStore();

const isMobileMenuOpen = ref(false);

const currentUser = computed(() => authStore.currentUser);

const searchTerm = computed({
  get: () => photoStore.searchTerm,
  set: (value) => photoStore.setSearchTerm(value)
});

const handleLogout = () => {
  authStore.logout();
  emit('logout');
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

.searchContainer {
  position: relative;
  width: 300px;
  margin: 0 2rem;
}

.searchIcon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
}

.searchInput {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.3s;
}

.searchInput:focus {
  border-color: #0070f3;
}

.headerButtons {
  display: flex;
  gap: 1rem;
}

.uploadButton {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background-color: #0070f3;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s;
}

.uploadButton:hover {
  background-color: #0050c3;
}

.categoryButton {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background-color: #f0f0f0;
  color: #333;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s;
}

.categoryButton:hover {
  background-color: #e0e0e0;
}

.logoutButton {
  padding: 0.75rem 1.5rem;
  background-color: #f0f0f0;
  color: #333;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s;
}

.logoutButton:hover {
  background-color: #e0e0e0;
}

.buttonIcon {
  width: 18px;
  height: 18px;
}

.userInfo {
  margin-right: 1rem;
  font-size: 0.9rem;
  color: #333;
}

.mobileMenuButton {
  display: none;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
}

.mobileMenu {
  background-color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.mobileSearchContainer {
  position: relative;
  margin-bottom: 1rem;
}

.mobileUserInfo {
  padding: 0.75rem;
  font-size: 0.9rem;
  color: #333;
  border-bottom: 1px solid #eee;
}

.mobileUploadButton {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background-color: #0070f3;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s;
}

.mobileUploadButton:hover {
  background-color: #0050c3;
}

.mobileCategoryButton {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background-color: #f0f0f0;
  color: #333;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s;
}

.mobileCategoryButton:hover {
  background-color: #e0e0e0;
}

.mobileLogoutButton {
  padding: 0.75rem;
  background-color: #f0f0f0;
  color: #333;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s;
}

.mobileLogoutButton:hover {
  background-color: #e0e0e0;
}

@media (max-width: 768px) {
  .searchContainer {
    display: none;
  }
  
  .headerButtons {
    display: none;
  }
  
  .mobileMenuButton {
    display: block;
  }
}
</style>