<template>
  <main class="galleryPage">
    <header class="appTopbar">
      <div class="brandCluster">
        <div class="brandMark">P</div>
        <div>
          <strong>Photo Studio</strong>
          <span>{{ currentUser.username }}</span>
        </div>
      </div>

      <nav class="topbarActions" aria-label="相册操作">
        <el-button :icon="Folder" @click="router.push('/categories')">分类</el-button>
        <el-button type="primary" :icon="Upload" @click="isUploadOpen = true">上传</el-button>
        <el-button :icon="SwitchButton" circle title="退出登录" @click="handleLogout" />
      </nav>
    </header>

    <section class="libraryHero">
      <div class="heroCopy">
        <p class="eyebrow">PRIVATE LIBRARY</p>
        <h1>你的私人影像库</h1>
        <p>按分类浏览照片，瀑布流会随着滚动逐步加载，适合大量图片的首页体验。</p>
      </div>

      <div class="heroStats" aria-label="相册统计">
        <article>
          <span>{{ total }}</span>
          <strong>照片</strong>
        </article>
        <article>
          <span>{{ categories.length }}</span>
          <strong>分类</strong>
        </article>
        <article>
          <span>{{ selectedCategories.length || '全部' }}</span>
          <strong>筛选</strong>
        </article>
      </div>
    </section>

    <section class="controlDock" aria-label="照片筛选">
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
          class="filterChip"
          :class="{ active: selectedCategories.length === 0 }"
          @click="clearCategoryFilter"
        >
          全部
        </button>
        <button
          v-for="category in visibleCategories"
          :key="category.id"
          type="button"
          class="filterChip"
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
        <div v-for="index in 14" :key="index" class="photoSkeleton" />
      </div>

      <div v-else-if="photos.length > 0" class="masonryGrid">
        <article v-for="photo in photos" :key="photo.id" class="photoCard">
          <button class="imageButton" type="button" @click="openImageViewer(photo)">
            <img
              v-if="!imageErrors[photo.id]"
              :src="imageSrc(photo.path)"
              :alt="photo.filename"
              class="photoImage"
              loading="lazy"
              decoding="async"
              @error="markImageError(photo.id)"
            />
            <div v-else class="imageFallback">
              <el-icon><Picture /></el-icon>
              <span>图片暂时无法显示</span>
            </div>
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
        <p>上传第一组图片后，这里会自动生成瀑布流。</p>
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
        <span v-else-if="photos.length > 0 && !isRefreshing">已显示全部照片</span>
      </div>
    </section>

    <button class="mobileFab" type="button" title="上传照片" @click="isUploadOpen = true">
      <el-icon><Upload /></el-icon>
    </button>

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
const imageErrors = ref({});
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
  if (imageErrors.value[photo.id]) {
    return;
  }
  viewerImageUrl.value = imageSrc(photo.path);
  isImageViewerOpen.value = true;
};

const markImageError = (photoId) => {
  imageErrors.value = {
    ...imageErrors.value,
    [photoId]: true
  };
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
.galleryPage {
  min-height: 100vh;
  color: var(--text-strong);
  background:
    radial-gradient(circle at 14% 2%, rgba(214, 116, 68, 0.12), transparent 22rem),
    radial-gradient(circle at 86% 10%, rgba(34, 95, 84, 0.16), transparent 24rem),
    var(--surface-canvas);
}

.appTopbar {
  position: sticky;
  top: 0;
  z-index: 40;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.85rem clamp(1rem, 3vw, 2.5rem);
  border-bottom: 1px solid var(--line-soft);
  background: rgba(255, 253, 248, 0.86);
  backdrop-filter: blur(18px);
}

.brandCluster {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
}

.brandMark {
  display: grid;
  width: 2.45rem;
  height: 2.45rem;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 8px;
  color: #fff;
  font-weight: 850;
  background: var(--accent);
}

.brandCluster strong,
.brandCluster span {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.brandCluster strong {
  line-height: 1.1;
}

.brandCluster span {
  margin-top: 0.1rem;
  color: var(--text-muted);
  font-size: 0.82rem;
}

.topbarActions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.55rem;
}

.libraryHero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(18rem, 30rem);
  gap: 1rem;
  align-items: end;
  width: min(100%, 1560px);
  margin: 0 auto;
  padding: clamp(1.2rem, 3vw, 2.4rem) clamp(1rem, 3vw, 2.5rem) 1rem;
}

.heroCopy {
  min-width: 0;
}

.eyebrow {
  margin: 0 0 0.4rem;
  color: var(--accent);
  font-size: 0.72rem;
  font-weight: 850;
  letter-spacing: 0.14em;
}

.heroCopy h1 {
  margin: 0;
  font-size: clamp(2.3rem, 6vw, 5.6rem);
  line-height: 0.96;
  letter-spacing: 0;
}

.heroCopy p:last-child {
  max-width: 38rem;
  margin: 0.9rem 0 0;
  color: var(--text-muted);
}

.heroStats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  overflow: hidden;
  border: 1px solid var(--line-soft);
  border-radius: 8px;
  background: rgba(255, 253, 248, 0.82);
  box-shadow: var(--shadow-sm);
}

.heroStats article {
  display: grid;
  gap: 0.2rem;
  padding: 1rem;
  border-left: 1px solid var(--line-soft);
}

.heroStats article:first-child {
  border-left: 0;
}

.heroStats span {
  overflow: hidden;
  font-size: clamp(1.35rem, 3vw, 2rem);
  font-weight: 850;
  line-height: 1;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.heroStats strong {
  color: var(--text-muted);
  font-size: 0.78rem;
  font-weight: 700;
}

.controlDock {
  position: sticky;
  top: 4.2rem;
  z-index: 35;
  display: grid;
  grid-template-columns: minmax(14rem, 22rem) minmax(0, 1fr) auto;
  gap: 0.75rem;
  align-items: center;
  width: min(calc(100% - 2rem), 1510px);
  margin: 0 auto;
  padding: 0.75rem;
  border: 1px solid var(--line-soft);
  border-radius: 8px;
  background: rgba(255, 253, 248, 0.88);
  box-shadow: var(--shadow-sm);
  backdrop-filter: blur(18px);
}

.searchInput {
  width: 100%;
}

.categoryScroller {
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  padding: 0.12rem 0 0.25rem;
  scrollbar-width: thin;
}

.filterChip {
  flex: 0 0 auto;
  min-height: 2.25rem;
  padding: 0.42rem 0.78rem;
  border: 1px solid var(--line);
  border-radius: 999px;
  color: var(--text);
  font: inherit;
  font-size: 0.88rem;
  background: rgba(255, 255, 255, 0.72);
  cursor: pointer;
  transition: border-color 0.18s ease, background 0.18s ease, color 0.18s ease;
}

.filterChip:hover {
  border-color: rgba(34, 95, 84, 0.4);
  color: var(--accent);
}

.filterChip.active {
  border-color: var(--accent);
  color: #fff;
  background: var(--accent);
}

.modeSwitch {
  justify-self: end;
}

.gallerySurface {
  width: min(100%, 1560px);
  margin: 0 auto;
  padding: 1rem clamp(1rem, 3vw, 2.5rem) 5rem;
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
  border: 1px solid var(--line-soft);
  border-radius: 8px;
  background: var(--surface-panel);
  box-shadow: var(--shadow-sm);
  break-inside: avoid;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.photoCard:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.imageButton {
  display: block;
  width: 100%;
  padding: 0;
  border: 0;
  background: var(--surface-muted);
  cursor: zoom-in;
}

.photoImage {
  display: block;
  width: 100%;
  height: auto;
  min-height: 8rem;
  object-fit: cover;
}

.imageFallback {
  display: grid;
  min-height: 12rem;
  place-items: center;
  align-content: center;
  gap: 0.45rem;
  padding: 1rem;
  color: var(--text-muted);
  background:
    linear-gradient(135deg, rgba(34, 95, 84, 0.08), rgba(214, 116, 68, 0.08)),
    var(--surface-muted);
}

.imageFallback .el-icon {
  color: var(--accent);
  font-size: 1.7rem;
}

.imageFallback span {
  font-size: 0.82rem;
}

.photoMeta {
  display: grid;
  gap: 0.55rem;
  padding: 0.75rem;
}

.photoName {
  overflow: hidden;
  color: var(--text-strong);
  font-size: 0.92rem;
  font-weight: 700;
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
  color: var(--text-muted);
  font-size: 0.75rem;
  text-overflow: ellipsis;
  white-space: nowrap;
  background: rgba(34, 95, 84, 0.08);
}

.deleteButton {
  flex: 0 0 auto;
  color: var(--danger);
  opacity: 0.68;
}

.deleteButton:hover {
  opacity: 1;
}

.emptyState {
  display: grid;
  min-height: 45vh;
  place-items: center;
  align-content: center;
  gap: 0.75rem;
  padding: 2rem;
  color: var(--text-muted);
  text-align: center;
}

.emptyState .el-icon {
  color: var(--accent);
  font-size: 3rem;
}

.emptyState h2 {
  margin: 0;
  color: var(--text-strong);
  font-size: 1.35rem;
  letter-spacing: 0;
}

.emptyState p {
  margin: 0 0 0.5rem;
}

.loadMoreTrigger {
  display: grid;
  min-height: 4.5rem;
  place-items: center;
  color: var(--text-muted);
  font-size: 0.9rem;
}

.mobileFab {
  position: fixed;
  right: 1rem;
  bottom: calc(1rem + env(safe-area-inset-bottom));
  z-index: 50;
  display: none;
  width: 3.35rem;
  height: 3.35rem;
  place-items: center;
  border: 0;
  border-radius: 999px;
  color: #fff;
  background: var(--accent);
  box-shadow: var(--shadow-md);
}

.mobileFab .el-icon {
  font-size: 1.35rem;
}

.photoSkeleton {
  display: inline-block;
  width: 100%;
  height: 16rem;
  margin: 0 0 1rem;
  border-radius: 8px;
  background: linear-gradient(90deg, #e9e2d8 0%, #f8f4ed 50%, #e9e2d8 100%);
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

@media (max-width: 960px) {
  .libraryHero {
    grid-template-columns: 1fr;
  }

  .controlDock {
    grid-template-columns: 1fr;
    top: 4rem;
  }

  .modeSwitch {
    justify-self: start;
  }

  .masonryGrid {
    column-count: 3;
  }
}

@media (max-width: 680px) {
  .appTopbar {
    padding: 0.75rem 1rem;
  }

  .brandCluster span {
    max-width: 8rem;
  }

  .topbarActions .el-button--primary {
    display: none;
  }

  .libraryHero {
    padding: 1.2rem 1rem 0.75rem;
  }

  .heroCopy h1 {
    font-size: 2.75rem;
  }

  .heroStats {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .heroStats article {
    padding: 0.8rem;
  }

  .controlDock {
    top: 3.95rem;
    width: calc(100% - 1rem);
    padding: 0.6rem;
  }

  .gallerySurface {
    padding: 0.75rem 0.75rem 5rem;
  }

  .masonryGrid {
    column-count: 2;
    column-gap: 0.75rem;
  }

  .photoCard {
    margin-bottom: 0.75rem;
  }

  .photoMeta {
    padding: 0.65rem;
  }

  .mobileFab {
    display: grid;
  }
}

@media (max-width: 430px) {
  .topbarActions .el-button:first-child {
    display: none;
  }

  .heroCopy h1 {
    font-size: 2.35rem;
  }

  .heroStats span {
    font-size: 1.25rem;
  }

  .masonryGrid {
    column-count: 1;
  }
}
</style>
