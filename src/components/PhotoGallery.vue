<template>
  <main class="photoGallery">
    <header class="topbar">
      <div class="brandBlock">
        <div class="brandMark">P</div>
        <div>
          <h1>相册</h1>
          <p>{{ total }} 张照片</p>
        </div>
      </div>

      <div class="topbarActions">
        <span class="userChip">{{ currentUser.username }}</span>
        <el-button :icon="Folder" @click="router.push('/categories')">分类</el-button>
        <el-button type="primary" :icon="Upload" @click="isUploadOpen = true">上传</el-button>
        <el-button :icon="SwitchButton" circle title="退出登录" @click="handleLogout" />
      </div>
    </header>

    <section class="galleryToolbar" aria-label="照片筛选">
      <el-input
        v-model="searchDraft"
        class="searchInput"
        :prefix-icon="Search"
        placeholder="搜索文件名"
        clearable
      />

      <div class="categoryScroller">
        <button
          type="button"
          class="categoryTag"
          :class="{ active: selectedCategories.length === 0 }"
          @click="clearCategoryFilter"
        >
          全部
        </button>
        <button
          v-for="category in visibleCategories"
          :key="category.id"
          type="button"
          class="categoryTag"
          :class="{ active: selectedCategories.includes(category.id) }"
          @click="toggleCategory(category.id)"
        >
          {{ category.name }}
        </button>
      </div>

      <el-segmented
        v-if="selectedCategories.length > 1"
        v-model="filterMode"
        class="modeSwitch"
        :options="filterModeOptions"
      />
    </section>

    <section class="gallerySurface" aria-live="polite">
      <div v-if="isRefreshing" class="masonryGrid skeletonGrid">
        <div v-for="index in 12" :key="index" class="photoSkeleton" />
      </div>

      <div v-else-if="photos.length > 0" class="masonryGrid">
        <article v-for="photo in photos" :key="photo.id" class="photoCard">
          <button class="imageButton" type="button" @click="openImageViewer(photo)">
            <img
              :src="imageSrc(photo.path)"
              :alt="photo.filename"
              class="photoImage"
              loading="lazy"
              decoding="async"
            />
          </button>
          <div class="photoMeta">
            <div class="photoName" :title="photo.filename">{{ photo.filename }}</div>
            <div class="photoFooter">
              <div class="photoCategories">
                <span v-for="categoryId in photo.categories" :key="categoryId">
                  {{ getCategoryName(categoryId) }}
                </span>
              </div>
              <el-button
                :icon="Delete"
                circle
                text
                class="deleteButton"
                title="删除"
                @click="showDeleteConfirm(photo)"
              />
            </div>
          </div>
        </article>
      </div>

      <div v-else class="emptyState">
        <el-icon><Picture /></el-icon>
        <h2>暂无照片</h2>
        <p>上传几张图片后，这里会以瀑布流展示。</p>
        <el-button type="primary" :icon="Upload" @click="isUploadOpen = true">上传照片</el-button>
      </div>

      <div ref="loadMoreTrigger" class="loadMoreTrigger">
        <el-button
          v-if="hasMore && !isRefreshing"
          :loading="isLoading"
          :icon="ArrowDown"
          @click="loadMore"
        >
          加载更多
        </el-button>
        <span v-else-if="photos.length > 0 && !isRefreshing">已显示全部</span>
      </div>
    </section>

    <ImageViewer
      :is-open="isImageViewerOpen"
      :image-url="viewerImageUrl"
      @close="isImageViewerOpen = false"
    />

    <DeleteConfirm
      :is-open="isDeleteConfirmOpen"
      :photo-id="deletePhotoId"
      :photo-name="deletePhotoName"
      @close="isDeleteConfirmOpen = false"
      @confirm="handleDeleteConfirm"
    />

    <PhotoUpload
      :is-open="isUploadOpen"
      @close="isUploadOpen = false"
      @success="handleUploadSuccess"
    />
  </main>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import {
  ArrowDown,
  Delete,
  Folder,
  Picture,
  Search,
  SwitchButton,
  Upload
} from '@element-plus/icons-vue';
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
const loadMoreTrigger = ref(null);
const searchDraft = ref(photoStore.searchTerm);
let observer;
let searchTimer;

const filterModeOptions = [
  { label: '交集', value: 'AND' },
  { label: '并集', value: 'OR' }
];

const currentUser = computed(() => authStore.currentUser);
const categories = computed(() => categoryStore.categories);
const visibleCategories = computed(() => categories.value.filter(category => category.name !== '全部'));
const photos = computed(() => photoStore.photos);
const total = computed(() => photoStore.total);
const hasMore = computed(() => photoStore.hasMore);
const isLoading = computed(() => photoStore.isLoading);
const isRefreshing = computed(() => photoStore.isRefreshing);
const selectedCategories = computed(() => photoStore.selectedCategories);
const filterMode = computed({
  get: () => photoStore.filterMode,
  set: (value) => {
    photoStore.setFilterMode(value);
  }
});

const refresh = async () => {
  await photoStore.refreshPhotos(authStore.currentUser.id);
};

const loadMore = async () => {
  await photoStore.loadMorePhotos(authStore.currentUser.id);
};

const imageSrc = (path) => {
  if (!path) {
    return '';
  }
  if (/^https?:\/\//.test(path) || path.startsWith('/')) {
    return path;
  }
  return `/${path}`;
};

const openImageViewer = (photo) => {
  viewerImageUrl.value = imageSrc(photo.path);
  isImageViewerOpen.value = true;
};

const showDeleteConfirm = (photo) => {
  deletePhotoId.value = photo.id;
  deletePhotoName.value = photo.filename;
  isDeleteConfirmOpen.value = true;
};

const handleDeleteConfirm = async (photoId) => {
  await photoStore.deletePhoto(photoId);
};

const getCategoryName = (categoryId) => {
  const category = categories.value.find(c => c.id === categoryId);
  return category ? category.name : '未分类';
};

const toggleCategory = async (categoryId) => {
  photoStore.toggleCategory(categoryId);
  await refresh();
};

const clearCategoryFilter = async () => {
  photoStore.setSelectedCategories([]);
  await refresh();
};

const handleUploadSuccess = async () => {
  await refresh();
};

const handleLogout = () => {
  authStore.logout();
  photoStore.resetPhotos();
  router.push('/');
};

watch(searchDraft, (value) => {
  window.clearTimeout(searchTimer);
  searchTimer = window.setTimeout(async () => {
    photoStore.setSearchTerm(value.trim());
    await refresh();
  }, 300);
});

watch(filterMode, async () => {
  await refresh();
});

onMounted(async () => {
  await nextTick();
  observer = new IntersectionObserver((entries) => {
    const [entry] = entries;
    if (entry.isIntersecting && hasMore.value && !isLoading.value && !isRefreshing.value) {
      loadMore();
    }
  }, {
    rootMargin: '640px 0px'
  });

  if (loadMoreTrigger.value) {
    observer.observe(loadMoreTrigger.value);
  }
});

onUnmounted(() => {
  window.clearTimeout(searchTimer);
  observer?.disconnect();
});
</script>

<style scoped>
.photoGallery {
  min-height: 100vh;
  color: #1c1a17;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.76), rgba(246, 243, 238, 0.96) 34rem),
    #f6f3ee;
}

.topbar {
  position: sticky;
  top: 0;
  z-index: 40;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem clamp(1rem, 3vw, 2.5rem);
  border-bottom: 1px solid rgba(48, 42, 34, 0.08);
  background: rgba(255, 253, 248, 0.9);
  backdrop-filter: blur(18px);
}

.brandBlock {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  min-width: 0;
}

.brandMark {
  display: grid;
  width: 2.5rem;
  height: 2.5rem;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 8px;
  color: #fff;
  font-weight: 800;
  background: #1f5f54;
}

.brandBlock h1 {
  margin: 0;
  font-size: 1.15rem;
  line-height: 1.15;
  letter-spacing: 0;
}

.brandBlock p {
  margin: 0.125rem 0 0;
  color: #776f64;
  font-size: 0.85rem;
}

.topbarActions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.625rem;
  min-width: 0;
}

.userChip {
  max-width: 10rem;
  padding: 0.425rem 0.7rem;
  overflow: hidden;
  border: 1px solid rgba(48, 42, 34, 0.1);
  border-radius: 999px;
  color: #504a42;
  font-size: 0.875rem;
  text-overflow: ellipsis;
  white-space: nowrap;
  background: rgba(255, 255, 255, 0.62);
}

.galleryToolbar {
  display: grid;
  grid-template-columns: minmax(14rem, 21rem) minmax(0, 1fr) auto;
  gap: 0.875rem;
  align-items: center;
  padding: 1.15rem clamp(1rem, 3vw, 2.5rem);
  border-bottom: 1px solid rgba(48, 42, 34, 0.08);
}

.searchInput {
  width: 100%;
}

.categoryScroller {
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  padding: 0.125rem 0 0.25rem;
  scrollbar-width: thin;
}

.categoryTag {
  flex: 0 0 auto;
  min-height: 2rem;
  padding: 0.35rem 0.75rem;
  border: 1px solid rgba(48, 42, 34, 0.12);
  border-radius: 999px;
  color: #514b43;
  font: inherit;
  font-size: 0.875rem;
  background: rgba(255, 255, 255, 0.72);
  cursor: pointer;
  transition: border-color 0.18s ease, background 0.18s ease, color 0.18s ease;
}

.categoryTag:hover {
  border-color: rgba(31, 95, 84, 0.45);
  color: #17483f;
}

.categoryTag.active {
  border-color: #1f5f54;
  color: #fff;
  background: #1f5f54;
}

.modeSwitch {
  justify-self: end;
}

.gallerySurface {
  width: min(100%, 1560px);
  margin: 0 auto;
  padding: clamp(1rem, 2.5vw, 2rem);
}

.masonryGrid {
  column-count: 5;
  column-gap: 1rem;
}

.photoCard {
  display: inline-block;
  width: 100%;
  margin: 0 0 1rem;
  overflow: hidden;
  border: 1px solid rgba(48, 42, 34, 0.1);
  border-radius: 8px;
  background: #fffdfa;
  box-shadow: 0 14px 34px rgba(40, 34, 26, 0.08);
  break-inside: avoid;
}

.imageButton {
  display: block;
  width: 100%;
  padding: 0;
  border: 0;
  background: #ebe6de;
  cursor: zoom-in;
}

.photoImage {
  display: block;
  width: 100%;
  height: auto;
  min-height: 8rem;
  object-fit: cover;
}

.photoMeta {
  display: grid;
  gap: 0.55rem;
  padding: 0.75rem;
}

.photoName {
  overflow: hidden;
  color: #25211d;
  font-size: 0.9rem;
  font-weight: 650;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.photoFooter {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 0.5rem;
}

.photoCategories {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  min-width: 0;
}

.photoCategories span {
  max-width: 7rem;
  padding: 0.16rem 0.45rem;
  overflow: hidden;
  border-radius: 999px;
  color: #5d554a;
  font-size: 0.75rem;
  text-overflow: ellipsis;
  white-space: nowrap;
  background: #eee7dc;
}

.deleteButton {
  flex: 0 0 auto;
  color: #a23b32;
  opacity: 0.68;
}

.deleteButton:hover {
  opacity: 1;
}

.emptyState {
  display: grid;
  min-height: 48vh;
  place-items: center;
  align-content: center;
  gap: 0.75rem;
  padding: 2rem;
  color: #625a50;
  text-align: center;
}

.emptyState .el-icon {
  color: #1f5f54;
  font-size: 3rem;
}

.emptyState h2 {
  margin: 0;
  color: #1f1b17;
  font-size: 1.35rem;
  letter-spacing: 0;
}

.emptyState p {
  margin: 0 0 0.5rem;
  color: #71695f;
}

.loadMoreTrigger {
  display: grid;
  min-height: 4.5rem;
  place-items: center;
  color: #7a7268;
  font-size: 0.9rem;
}

.photoSkeleton {
  display: inline-block;
  width: 100%;
  height: 16rem;
  margin: 0 0 1rem;
  border-radius: 8px;
  background: linear-gradient(90deg, #ebe5da 0%, #f8f4ed 50%, #ebe5da 100%);
  background-size: 220% 100%;
  break-inside: avoid;
  animation: shimmer 1.2s ease-in-out infinite;
}

.photoSkeleton:nth-child(3n + 1) {
  height: 20rem;
}

.photoSkeleton:nth-child(3n + 2) {
  height: 12rem;
}

@keyframes shimmer {
  to {
    background-position: -220% 0;
  }
}

@media (max-width: 1180px) {
  .masonryGrid {
    column-count: 4;
  }
}

@media (max-width: 920px) {
  .galleryToolbar {
    grid-template-columns: 1fr;
  }

  .modeSwitch {
    justify-self: start;
  }

  .masonryGrid {
    column-count: 3;
  }
}

@media (max-width: 680px) {
  .topbar {
    align-items: flex-start;
    flex-direction: column;
  }

  .topbarActions {
    width: 100%;
    justify-content: flex-start;
    overflow-x: auto;
    padding-bottom: 0.125rem;
  }

  .userChip {
    display: none;
  }

  .masonryGrid {
    column-count: 2;
    column-gap: 0.75rem;
  }

  .photoCard {
    margin-bottom: 0.75rem;
  }
}

@media (max-width: 420px) {
  .masonryGrid {
    column-count: 1;
  }
}
</style>
