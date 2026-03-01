<template>
  <div class="container">
    <!-- 登录/注册弹窗 -->
    <div v-if="!isLoggedIn" class="authModal">
      <div class="authModalContent">
        <div class="authModalHeader">
          <h2>{{ isRegistering ? '注册' : '登录' }}</h2>
        </div>
        <form @submit.prevent="handleAuth" class="authForm">
          <div class="formGroup">
            <label for="username" class="label">用户名</label>
            <input
              type="text"
              id="username"
              v-model="username"
              class="input"
              placeholder="请输入用户名"
              required
            />
          </div>
          <div class="formGroup">
            <label for="password" class="label">密码</label>
            <input
              type="password"
              id="password"
              v-model="password"
              class="input"
              placeholder="请输入密码"
              required
            />
          </div>
          <div class="formActions">
            <button type="submit" class="submitButton">
              {{ isRegistering ? '注册' : '登录' }}
            </button>
          </div>
          <div class="authSwitch">
            {{ isRegistering ? '已有账号？' : '没有账号？' }}
            <button type="button" class="switchButton" @click="isRegistering = !isRegistering">
              {{ isRegistering ? '去登录' : '去注册' }}
            </button>
          </div>
          <div v-if="errorMessage" class="errorMessage">
            {{ errorMessage }}
          </div>
        </form>
      </div>
    </div>

    <!-- 导航栏 -->
    <header v-if="isLoggedIn" class="header">
      <div class="logo">相册网站</div>
      
      <!-- 桌面端搜索 -->
      <div class="searchContainer">
        <svg class="searchIcon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        <input
          type="text"
          placeholder="搜索图片..."
          v-model="searchTerm"
          class="searchInput"
        />
      </div>

      <!-- 桌面端按钮 -->
      <div class="headerButtons">
        <span class="userInfo">{{ currentUser.username }}</span>
        <button
          class="uploadButton"
          @click="isUploadOpen = true"
        >
          <svg class="buttonIcon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
          上传图片
        </button>
        <button
          class="categoryButton"
          @click="isCategoryManageOpen = true"
        >
          <svg class="buttonIcon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h16z"></path></svg>
          分类管理
        </button>
        <button
          class="logoutButton"
          @click="logout"
        >
          退出
        </button>
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
    <div v-if="isLoggedIn && isMobileMenuOpen" class="mobileMenu">
      <div class="mobileSearchContainer">
        <svg class="searchIcon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        <input
          type="text"
          placeholder="搜索图片..."
          v-model="searchTerm"
          class="searchInput"
        />
      </div>
      <div class="mobileUserInfo">{{ currentUser.username }}</div>
      <button
        class="mobileUploadButton"
        @click="isUploadOpen = true; isMobileMenuOpen = false"
      >
        <svg class="buttonIcon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
        上传图片
      </button>
      <button
        class="mobileCategoryButton"
        @click="isCategoryManageOpen = true; isMobileMenuOpen = false"
      >
        <svg class="buttonIcon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h16z"></path></svg>
        分类管理
      </button>
      <button
        class="mobileLogoutButton"
        @click="logout"
      >
        退出
      </button>
    </div>

    <!-- 分类栏 -->
    <div v-if="isLoggedIn" class="categoryContainer">
      <div class="categoryList">
        <button
          v-for="category in categories"
          :key="category.id"
          :class="['categoryButton', { activeCategory: selectedCategories.includes(category.id) }]"
          @click="toggleCategory(category.id)"
        >
          <svg class="categoryIcon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h16z"></path></svg>
          {{ category.name }}
        </button>
        <div class="addCategory">
          <input
            type="text"
            placeholder="新建分类"
            v-model="newCategory"
            class="categoryInput"
            @keyup.enter="addCategory"
          />
          <button class="addCategoryButton" @click="addCategory">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          </button>
        </div>
      </div>
    </div>

    <!-- 图片网格 -->
    <div v-if="isLoggedIn" class="photoGrid">
      <div v-for="photo in filteredPhotos" :key="photo.id" class="photoCard">
        <div class="photoCardHeader">
          <button
            class="deletePhotoButton"
            @click.stop="showDeleteConfirm(photo.id, photo.filename)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
          </button>
        </div>
        <img
          :src="photo.path"
          :alt="photo.filename"
          class="photoImage"
          @click="openImageViewer(photo)"
        />
        <div class="photoInfo" @click="openImageViewer(photo)">
          <span class="photoFilename">{{ photo.filename }}</span>
          <div class="photoCategories">
            <span v-for="categoryId in photo.categories" :key="categoryId" class="photoCategory">
              {{ categories.find(c => c.id === categoryId)?.name }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 上传弹窗 -->
    <div v-if="isLoggedIn && isUploadOpen" class="uploadModal">
      <div class="uploadModalContent">
        <div class="uploadModalHeader">
          <h2>上传图片</h2>
          <button
            class="closeButton"
            @click="isUploadOpen = false"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        <form @submit.prevent="handleUpload" class="uploadForm">
          <div class="formGroup">
            <label for="file" :class="['fileLabel', { dragging: isDragging }]" 
                  @dragover.prevent="handleDragOver"
                  @dragleave.prevent="handleDragLeave"
                  @drop.prevent="handleDrop">
              <div v-if="selectedFiles.length === 0">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                <p>拖拽文件到此处或点击选择文件</p>
                <p class="fileHint">支持批量上传，一次可选择多个图片</p>
              </div>
              <div v-else class="selectedFiles">
                <p>已选择 {{ selectedFiles.length }} 个文件</p>
                <ul class="fileList">
                  <li v-for="(file, index) in selectedFiles" :key="index">{{ file.name }}</li>
                </ul>
              </div>
              <input
                type="file"
                id="file"
                accept="image/*"
                multiple
                @change="handleFileChange"
                class="fileInput"
              />
            </label>
          </div>
          <div class="formGroup">
            <label class="label" for="photoName">图片名称 (可选)</label>
            <input
              type="text"
              id="photoName"
              v-model="photoName"
              class="input"
              placeholder="输入图片名称，不填写则使用原文件名"
            />
          </div>
          
          <!-- 图片预览 -->
          <div v-if="previewImages.length > 0" class="previewContainer">
            <h3 class="previewTitle">图片预览</h3>
            <div class="previewGrid">
              <div v-for="(preview, index) in previewImages" :key="index" class="previewItem">
                <img :src="preview.url" :alt="preview.name" class="previewImage" />
                <span class="previewName">{{ preview.name }}</span>
              </div>
            </div>
          </div>
          <div class="formGroup">
            <label class="label">分类 (可多选)</label>
            <div class="categoryCheckboxes">
              <label v-for="category in categories.filter(c => c.id !== '1')" :key="category.id" class="checkboxLabel">
                <input
                  type="checkbox"
                  :value="category.id"
                  v-model="uploadSelectedCategories"
                />
                {{ category.name }}
              </label>
            </div>
          </div>
          <div class="formActions">
            <button
              type="button"
              class="cancelButton"
              @click="isUploadOpen = false"
            >
              取消
            </button>
            <button type="submit" class="submitButton">
              上传
            </button>
          </div>
        </form>
      </div>
    </div>
    
    <!-- 分类管理弹窗 -->
    <div v-if="isLoggedIn && isCategoryManageOpen" class="categoryModal">
      <div class="categoryModalContent">
        <div class="categoryModalHeader">
          <h2>分类管理</h2>
          <button
            class="closeButton"
            @click="isCategoryManageOpen = false"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        <div class="categoryManageContent">
          <div class="categoryListContainer">
            <h3>现有分类</h3>
            <ul class="categoryManageList">
              <li v-for="category in categories.filter(c => c.id !== '1')" :key="category.id" class="categoryManageItem">
                <span class="categoryName">{{ category.name }}</span>
                <button
                  class="deleteCategoryButton"
                  @click="deleteCategory(category.id)"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                </button>
              </li>
            </ul>
          </div>
          <div class="addCategoryForm">
            <h3>添加分类</h3>
            <div class="formGroup">
              <input
                type="text"
                placeholder="输入分类名称"
                v-model="newCategory"
                class="categoryInput"
                @keyup.enter="addCategory"
              />
              <button class="addCategoryButton" @click="addCategory">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 删除确认弹窗 -->
    <div v-if="isLoggedIn && isDeleteConfirmOpen" class="deleteModal">
      <div class="deleteModalContent">
        <div class="deleteModalHeader">
          <h2>删除确认</h2>
          <button
            class="closeButton"
            @click="isDeleteConfirmOpen = false"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        <div class="deleteModalContent">
          <p>确定要删除图片 "{{ deletePhotoName }}" 吗？</p>
          <p class="deleteWarning">此操作不可撤销</p>
        </div>
        <div class="formActions">
          <button
            type="button"
            class="cancelButton"
            @click="isDeleteConfirmOpen = false"
          >
            取消
          </button>
          <button
            type="button"
            class="deleteButton"
            @click="deletePhoto"
          >
            删除
          </button>
        </div>
      </div>
    </div>
    
    <!-- Element Plus 图片预览 -->
    <el-image-viewer
      v-if="isImageViewerOpen"
      :url-list="previewUrlList"
      @close="closeImageViewer"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { initDatabase, getPhotos, addPhoto, deletePhoto as dbDeletePhoto, getCategories, addCategory as dbAddCategory, deleteCategory as dbDeleteCategory, validateUser, registerUser } from './db';

// 响应式数据
const photos = ref([]);
const categories = ref([
  { id: '1', name: '全部' },
  { id: '2', name: '风景' },
  { id: '3', name: '人物' },
  { id: '4', name: '动物' },
  { id: '5', name: '建筑' },
]);
const selectedCategories = ref([]);
const searchTerm = ref('');
const isUploadOpen = ref(false);
const isCategoryManageOpen = ref(false);
const isMobileMenuOpen = ref(false);
const selectedFiles = ref([]);
const previewImages = ref([]);
const isDragging = ref(false);
const newCategory = ref('');
const uploadSelectedCategories = ref(['2']);
const photoName = ref('');
const isDeleteConfirmOpen = ref(false);
const deletePhotoId = ref('');
const deletePhotoName = ref('');
const isImageViewerOpen = ref(false);
const previewUrlList = ref([]);

// 登录相关状态
const isLoggedIn = ref(false);
const isRegistering = ref(false);
const username = ref('');
const password = ref('');
const errorMessage = ref('');
const currentUser = ref({ id: '', username: '' });

// 计算属性：过滤后的图片
const filteredPhotos = computed(() => {
  return photos.value.filter(photo => {
    const matchesCategory = selectedCategories.value.length === 0 || selectedCategories.value.every(categoryId => photo.categories.includes(categoryId));
    const matchesSearch = photo.filename.toLowerCase().includes(searchTerm.value.toLowerCase());
    return matchesCategory && matchesSearch;
  });
});

// 处理文件选择
const handleFileChange = (e) => {
  if (e.target.files && e.target.files.length > 0) {
    selectedFiles.value = Array.from(e.target.files);
    generatePreviews(selectedFiles.value);
  }
};

// 处理拖拽
const handleDragOver = () => {
  isDragging.value = true;
};

const handleDragLeave = () => {
  isDragging.value = false;
};

const handleDrop = (e) => {
  isDragging.value = false;
  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
    selectedFiles.value = Array.from(e.dataTransfer.files);
    generatePreviews(selectedFiles.value);
  }
};

// 生成图片预览
const generatePreviews = (files) => {
  previewImages.value = [];
  files.forEach(file => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        previewImages.value.push({
          name: file.name,
          url: e.target.result
        });
      };
      reader.readAsDataURL(file);
    }
  });
};

// 切换分类选择
const toggleCategory = (categoryId) => {
  const index = selectedCategories.value.indexOf(categoryId);
  if (index > -1) {
    selectedCategories.value.splice(index, 1);
  } else {
    selectedCategories.value.push(categoryId);
  }
};

// 处理上传
const handleUpload = async () => {
  if (selectedFiles.value.length === 0) return;

  try {
    // 创建FormData
    const formData = new FormData();
    
    // 添加用户ID和分类
    formData.append('user_id', currentUser.value.id);
    formData.append('photo_name', photoName.value);
    uploadSelectedCategories.value.forEach(categoryId => {
      formData.append('categories', categoryId);
    });
    
    // 添加文件
    selectedFiles.value.forEach(file => {
      formData.append('file', file);
    });

    // 上传文件
    await addPhoto(formData);
    await loadPhotos(currentUser.value.id);
    
    // 重置状态
    isUploadOpen.value = false;
    selectedFiles.value = [];
    previewImages.value = [];
    uploadSelectedCategories.value = ['2'];
    photoName.value = '';
  } catch (error) {
    console.error('上传失败:', error);
  }
};

// 添加分类
const addCategory = async () => {
  if (newCategory.value.trim()) {
    const category = {
      name: newCategory.value.trim(),
    };
    
    await dbAddCategory(category);
    await loadCategories();
    newCategory.value = '';
  }
};

// 删除分类
const deleteCategory = async (categoryId) => {
  try {
    await dbDeleteCategory(categoryId);
    await loadCategories();
  } catch (error) {
    console.error('删除分类失败:', error);
  }
};

// 加载图片
const loadPhotos = async (userId) => {
  photos.value = await getPhotos(userId);
};

// 加载分类
const loadCategories = async () => {
  const cats = await getCategories();
  if (cats.length > 0) {
    categories.value = cats;
  }
};

// 显示删除确认弹窗
const showDeleteConfirm = (photoId, photoName) => {
  deletePhotoId.value = photoId;
  deletePhotoName.value = photoName;
  isDeleteConfirmOpen.value = true;
};

// 删除图片
const deletePhoto = async () => {
  try {
    await dbDeletePhoto(deletePhotoId.value);
    await loadPhotos(currentUser.value.id);
    isDeleteConfirmOpen.value = false;
  } catch (error) {
    console.error('删除图片失败:', error);
  }
};

// 打开图片查看器
const openImageViewer = (photo) => {
  // 设置预览图片列表
  previewUrlList.value = [photo.path];
  isImageViewerOpen.value = true;
};

// 关闭图片查看器
const closeImageViewer = () => {
  isImageViewerOpen.value = false;
};

// 处理登录/注册
const handleAuth = async () => {
  errorMessage.value = '';
  try {
    let user;
    if (isRegistering.value) {
      user = await registerUser(username.value, password.value);
    } else {
      user = await validateUser(username.value, password.value);
    }
    
    if (user) {
      currentUser.value = user;
      isLoggedIn.value = true;
      // 保存登录状态到localStorage
      localStorage.setItem('currentUser', JSON.stringify(user));
      // 登录成功后加载数据
      await loadCategories();
      await loadPhotos(user.id);
    } else {
      errorMessage.value = '用户名或密码错误';
    }
  } catch (error) {
    errorMessage.value = '操作失败，请重试';
    console.error('认证失败:', error);
  }
};

// 退出登录
const logout = () => {
  isLoggedIn.value = false;
  currentUser.value = { id: '', username: '' };
  photos.value = [];
  // 清除localStorage中的登录状态
  localStorage.removeItem('currentUser');
};

// 初始化
onMounted(async () => {
  await initDatabase();
  
  // 从localStorage读取登录状态
  const savedUser = localStorage.getItem('currentUser');
  if (savedUser) {
    try {
      const user = JSON.parse(savedUser);
      currentUser.value = user;
      isLoggedIn.value = true;
      // 加载用户数据
      await loadCategories();
      await loadPhotos(user.id);
    } catch (error) {
      console.error('读取登录状态失败:', error);
      localStorage.removeItem('currentUser');
    }
  }
});
</script>

<style scoped>
.container {
  min-height: 100vh;
  background-color: #f5f5f5;
}

/* 登录/注册弹窗 */
.authModal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 300;
}

.authModalContent {
  background-color: white;
  border-radius: 8px;
  padding: 2rem;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.authModalHeader {
  margin-bottom: 1.5rem;
  text-align: center;
}

.authModalHeader h2 {
  margin: 0;
  font-size: 1.25rem;
  color: #333;
}

.authForm {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.input {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.3s;
}

.input:focus {
  border-color: #0070f3;
}

.authSwitch {
  text-align: center;
  margin-top: 1rem;
  font-size: 0.9rem;
  color: #666;
}

.switchButton {
  background: none;
  border: none;
  color: #0070f3;
  cursor: pointer;
  font-size: 0.9rem;
  padding: 0;
  margin-left: 0.5rem;
}

.switchButton:hover {
  text-decoration: underline;
}

.errorMessage {
  background-color: #ffebee;
  color: #c62828;
  padding: 0.75rem;
  border-radius: 4px;
  margin-top: 1rem;
  font-size: 0.9rem;
}

/* 用户信息和退出按钮 */
.userInfo {
  margin-right: 1rem;
  font-size: 0.9rem;
  color: #333;
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

.mobileUserInfo {
  padding: 0.75rem;
  font-size: 0.9rem;
  color: #333;
  border-bottom: 1px solid #eee;
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

.buttonIcon {
  width: 18px;
  height: 18px;
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

.categoryContainer {
  background-color: white;
  padding: 1rem 2rem;
  border-bottom: 1px solid #eee;
  overflow-x: auto;
}

.categoryList {
  display: flex;
  gap: 1rem;
  align-items: center;
  min-width: max-content;
}

.categoryButton {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 20px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s;
  white-space: nowrap;
}

.categoryButton:hover {
  background-color: #e0e0e0;
}

.activeCategory {
  background-color: #0070f3;
  color: white;
  border-color: #0070f3;
}

.categoryIcon {
  width: 16px;
  height: 16px;
}

.addCategory {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.categoryInput {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
  width: 120px;
}

.addCategoryButton {
  padding: 0.5rem;
  background-color: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.addCategoryButton:hover {
  background-color: #e0e0e0;
}

.photoGrid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.photoCard {
  background-color: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s, box-shadow 0.3s;
  position: relative;
}

.photoCard:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.photoCardHeader {
  position: absolute;
  top: 0;
  right: 0;
  padding: 8px;
  z-index: 10;
}

.deletePhotoButton {
  background: rgba(255, 255, 255, 0.8);
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #ff4757;
  transition: all 0.3s;
  opacity: 0;
  visibility: hidden;
}

.photoCard:hover .deletePhotoButton {
  opacity: 1;
  visibility: visible;
}

.deletePhotoButton:hover {
  background: rgba(255, 255, 255, 1);
  transform: scale(1.1);
}

.photoImage {
  width: 100%;
  height: 200px;
  object-fit: cover;
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

.uploadModal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}

.uploadModalContent {
  background-color: white;
  border-radius: 8px;
  padding: 2rem;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.uploadModalHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.uploadModalHeader h2 {
  margin: 0;
  font-size: 1.25rem;
  color: #333;
}

.closeButton {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #999;
  transition: color 0.3s;
}

.closeButton:hover {
  color: #333;
}

.uploadForm {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.formGroup {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.label {
  font-size: 0.9rem;
  font-weight: 500;
  color: #333;
}

.categoryCheckboxes {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 0.5rem;
}

.checkboxLabel {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  cursor: pointer;
}

.fileLabel {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  border: 2px dashed #ddd;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
  text-align: center;
  min-height: 200px;
}

.fileLabel:hover {
  border-color: #0070f3;
  background-color: #f8f9ff;
}

.fileLabel.dragging {
  border-color: #0070f3;
  background-color: #e6f0ff;
}

.fileLabel svg {
  margin-bottom: 1rem;
  color: #999;
}

.fileLabel p {
  margin: 0.5rem 0;
  color: #666;
}

.fileHint {
  font-size: 0.8rem;
  color: #999;
}

.selectedFiles {
  width: 100%;
  text-align: left;
}

.fileList {
  margin: 1rem 0 0 0;
  padding-left: 1.5rem;
  max-height: 150px;
  overflow-y: auto;
}

.fileList li {
  margin: 0.25rem 0;
  font-size: 0.9rem;
  color: #666;
}

.fileInput {
  display: none;
}

.previewContainer {
  margin-top: 1.5rem;
  border-top: 1px solid #eee;
  padding-top: 1.5rem;
}

.previewTitle {
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
  font-weight: 500;
  color: #333;
}

.previewGrid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 1rem;
  max-height: 200px;
  overflow-y: auto;
}

.previewItem {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.previewImage {
  width: 100%;
  height: 100px;
  object-fit: cover;
  border-radius: 4px;
  border: 1px solid #eee;
}

.previewName {
  font-size: 0.8rem;
  color: #666;
  text-align: center;
  word-break: break-all;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

/* 分类管理弹窗 */
.categoryModal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}

.categoryModalContent {
  background-color: white;
  border-radius: 8px;
  padding: 2rem;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.categoryModalHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.categoryModalHeader h2 {
  margin: 0;
  font-size: 1.25rem;
  color: #333;
}

.categoryManageContent {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.categoryListContainer h3,
.addCategoryForm h3 {
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
  font-weight: 500;
  color: #333;
}

.categoryManageList {
  margin: 0;
  padding: 0;
  list-style: none;
  max-height: 200px;
  overflow-y: auto;
}

.categoryManageItem {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  border-bottom: 1px solid #eee;
}

.categoryManageItem:last-child {
  border-bottom: none;
}

.categoryName {
  font-size: 0.9rem;
  color: #333;
}

.deleteCategoryButton {
  background: none;
  border: none;
  color: #ff4757;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.deleteCategoryButton:hover {
  background-color: #ffebee;
}

.addCategoryForm .formGroup {
  display: flex;
  gap: 0.5rem;
}

.addCategoryForm .categoryInput {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.3s;
}

.addCategoryForm .categoryInput:focus {
  border-color: #0070f3;
}

.addCategoryForm .addCategoryButton {
  padding: 0.75rem;
  background-color: #0070f3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.addCategoryForm .addCategoryButton:hover {
  background-color: #0050c3;
}

/* 导航栏分类管理按钮 */
.headerButtons .categoryButton {
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

.headerButtons .categoryButton:hover {
  background-color: #e0e0e0;
}

/* 移动端分类管理按钮 */
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

/* 删除确认弹窗 */
.deleteModal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 300;
}

.deleteModalContent {
  background-color: white;
  border-radius: 8px;
  padding: 2rem;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.deleteModalHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.deleteModalHeader h2 {
  margin: 0;
  font-size: 1.25rem;
  color: #333;
}

.deleteModalContent p {
  margin: 0 0 1rem 0;
  color: #333;
}

.deleteWarning {
  color: #ff4757 !important;
  font-weight: 500;
}

.deleteButton {
  padding: 0.75rem 1.5rem;
  background-color: #ff4757;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s;
}

.deleteButton:hover {
  background-color: #ff3742;
}

.select {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.3s;
}

.select:focus {
  border-color: #0070f3;
}

.formActions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1rem;
}

.cancelButton {
  padding: 0.75rem 1.5rem;
  background-color: #f0f0f0;
  color: #333;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s;
}

.cancelButton:hover {
  background-color: #e0e0e0;
}

.submitButton {
  padding: 0.75rem 1.5rem;
  background-color: #0070f3;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s;
}

.submitButton:hover {
  background-color: #0050c3;
}

/* 图片卡片点击效果 */
.photoCard {
  cursor: pointer;
  transition: all 0.3s;
}

.photoCard:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* 防止删除按钮点击事件冒泡 */
.deletePhotoButton {
  z-index: 10;
}

@media (max-width: 768px) {
  .header {
    padding: 1rem;
  }

  .searchContainer {
    display: none;
  }

  .headerButtons {
    display: none;
  }

  .mobileMenuButton {
    display: block;
  }

  .categoryContainer {
    padding: 1rem;
  }

  .photoGrid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 1rem;
    padding: 1rem;
  }

  .photoImage {
    height: 150px;
  }

  .uploadModalContent {
    padding: 1.5rem;
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .photoGrid {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  }

  .searchContainer {
    width: 250px;
    margin: 0 1rem;
  }
}
</style>