<template>
  <main class="galleryPage">
    <header class="appTopbar">
      <div class="brandCluster">
        <div class="brandMark">相</div>
        <div>
          <strong>私人相册</strong>
          <span>{{ currentUser.username }}</span>
        </div>
      </div>

      <nav class="topbarActions" aria-label="相册操作">
        <el-button class="uploadButton" type="primary" :icon="Upload" @click="isUploadOpen = true">
          上传
        </el-button>
        <el-dropdown trigger="click" placement="bottom-end" @command="handleTopbarCommand">
          <el-button :icon="MoreFilled" circle title="更多操作" aria-label="更多操作" />
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item :icon="Folder" command="categories">分类管理</el-dropdown-item>
              <el-dropdown-item :icon="SwitchButton" command="logout" divided>退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </nav>
    </header>

    <section class="libraryHero">
      <div class="heroCopy">
        <p class="eyebrow">私人影像空间</p>
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
        aria-label="搜索照片文件名"
        placeholder="搜索文件名"
        clearable
      />

      <CategoryPicker
        :model-value="selectedCategories"
        :categories="categories"
        include-all
        inline
        placeholder="筛选分类"
        @update:model-value="setGalleryCategories"
      />

      <el-segmented
        v-if="selectedCategories.length > 1"
        v-model="filterMode"
        class="modeSwitch"
        :options="filterModeOptions"
      />
    </section>

    <p class="srOnly" aria-live="polite">{{ galleryStatus }}</p>
    <section class="gallerySurface">
      <div v-if="loadError && photos.length > 0" class="inlineError" role="alert">
        <span>{{ loadError }}</span>
        <el-button type="primary" link :icon="Refresh" @click="refresh">重新加载</el-button>
      </div>

      <div v-if="photos.length > 0" class="batchBar" :class="{ active: selectedPhotoIds.length > 0 }">
        <div class="batchSummary">
          <strong>{{ selectedPhotoIds.length > 0 ? `已选择 ${selectedPhotoIds.length} 张` : '批量编辑' }}</strong>
          <span>{{ selectedPhotoIds.length > 0 ? '可统一修改类别' : '勾选图片后可批量编辑信息' }}</span>
        </div>
        <div class="batchActions">
          <el-button
            :icon="Edit"
            :disabled="selectedPhotoIds.length === 0"
            @click="showBatchEditDialog"
          >
            批量编辑
          </el-button>
          <el-button
            :disabled="selectedPhotoIds.length === 0"
            @click="clearPhotoSelection"
          >
            清空选择
          </el-button>
        </div>
      </div>

      <div v-if="isRefreshing" class="masonryGrid skeletonGrid">
        <div v-for="index in 14" :key="index" class="photoSkeleton" />
      </div>

      <div v-else-if="photos.length > 0" class="masonryGrid">
        <article
          v-for="photo in photos"
          :key="photo.id"
          class="photoCard"
          :class="{ selected: isPhotoSelected(photo.id) }"
        >
          <button
            type="button"
            class="photoSelect"
            :aria-label="`选择 ${photo.filename}`"
            :aria-pressed="isPhotoSelected(photo.id)"
            @click.stop="togglePhotoSelection(photo.id)"
          >
            <span />
          </button>
          <button
            class="imageButton"
            type="button"
            :style="getImageFrameStyle(photo)"
            @click="openImageViewer(photo)"
          >
            <img
              v-if="!imageErrors[photo.id]"
              :src="imageSrc(photo.path)"
              :alt="photo.filename"
              class="photoImage"
              loading="lazy"
              decoding="async"
              @load="rememberImageRatio(photo.id, $event)"
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
                <span v-for="(category, index) in photo.categories" :key="getCategoryKey(category, index)">
                  {{ getCategoryName(category) }}
                </span>
              </div>
              <div class="photoActions">
                <el-button
                  :icon="Edit"
                  circle
                  text
                  class="editButton"
                  title="编辑"
                  aria-label="编辑照片"
                  @click="showEditDialog(photo)"
                />
                <el-button
                  :icon="Delete"
                  circle
                  text
                  class="deleteButton"
                  title="删除"
                  aria-label="删除照片"
                  @click="showDeleteConfirm(photo)"
                />
              </div>
            </div>
          </div>
        </article>
      </div>

      <div v-else-if="loadError" class="emptyState errorState">
        <el-icon><WarningFilled /></el-icon>
        <h2>照片加载失败</h2>
        <p>{{ loadError }}</p>
        <el-button type="primary" :icon="Refresh" @click="refresh">重新加载</el-button>
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

    <PhotoEditDialog
      :is-open="isEditDialogOpen"
      :photo="editingPhoto"
      :photos="batchEditingPhotos"
      :categories="categories"
      @close="isEditDialogOpen = false"
      @saved="handlePhotoSaved"
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
  Edit,
  Folder,
  MoreFilled,
  Picture,
  Search,
  SwitchButton,
  Upload,
  Refresh,
  WarningFilled
} from '@element-plus/icons-vue';
import { usePhotoStore } from '../stores/photo';
import { useCategoryStore } from '../stores/category';
import { useAuthStore } from '../stores/auth';
import ImageViewer from './ImageViewer.vue';
import DeleteConfirm from './DeleteConfirm.vue';
import PhotoEditDialog from './PhotoEditDialog.vue';
import PhotoUpload from './PhotoUpload.vue';
import CategoryPicker from './CategoryPicker.vue';

const router = useRouter();
const photoStore = usePhotoStore();
const categoryStore = useCategoryStore();
const authStore = useAuthStore();

const isImageViewerOpen = ref(false);
const viewerImageUrl = ref('');
const isDeleteConfirmOpen = ref(false);
const deletePhotoId = ref('');
const deletePhotoName = ref('');
const isEditDialogOpen = ref(false);
const editingPhoto = ref(null);
const batchEditingPhotos = ref([]);
const selectedPhotoIds = ref([]);
const isUploadOpen = ref(false);
const loadMoreTrigger = ref(null);
const searchDraft = ref(photoStore.searchTerm);
const imageErrors = ref({});
const imageRatios = ref({});
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
const selectedPhotos = computed(() => photos.value.filter(photo => selectedPhotoIds.value.includes(photo.id)));
const total = computed(() => photoStore.total);
const hasMore = computed(() => photoStore.hasMore);
const isLoading = computed(() => photoStore.isLoading);
const isRefreshing = computed(() => photoStore.isRefreshing);
const loadError = computed(() => photoStore.loadError);
const selectedCategories = computed(() => photoStore.selectedCategories);
const filterMode = computed({
  get: () => photoStore.filterMode,
  set: (value) => {
    photoStore.setFilterMode(value);
  }
});
const galleryStatus = computed(() => {
  if (isRefreshing.value) {
    return '正在加载照片';
  }
  if (loadError.value) {
    return '照片加载失败';
  }
  return `已显示 ${photos.value.length} 张照片，共 ${total.value} 张`;
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

const rememberImageRatio = (photoId, event) => {
  const { naturalWidth, naturalHeight } = event.target;
  if (!naturalWidth || !naturalHeight) {
    return;
  }
  imageRatios.value = {
    ...imageRatios.value,
    [photoId]: `${naturalWidth} / ${naturalHeight}`
  };
};

const getImageFrameStyle = (photo) => ({
  aspectRatio: imageRatios.value[photo.id] || '4 / 3'
});

const showDeleteConfirm = (photo) => {
  deletePhotoId.value = photo.id;
  deletePhotoName.value = photo.filename;
  isDeleteConfirmOpen.value = true;
};

const showEditDialog = (photo) => {
  editingPhoto.value = photo;
  batchEditingPhotos.value = [];
  isEditDialogOpen.value = true;
};

const showBatchEditDialog = () => {
  if (selectedPhotos.value.length === 0) {
    return;
  }
  editingPhoto.value = null;
  batchEditingPhotos.value = selectedPhotos.value;
  isEditDialogOpen.value = true;
};

const handlePhotoSaved = (photo) => {
  editingPhoto.value = Array.isArray(photo) ? null : photo;
  if (Array.isArray(photo)) {
    clearPhotoSelection();
  }
};

const handleDeleteConfirm = async (photoId) => {
  await photoStore.deletePhoto(photoId);
  selectedPhotoIds.value = selectedPhotoIds.value.filter(id => id !== photoId);
};

const isPhotoSelected = (photoId) => selectedPhotoIds.value.includes(photoId);

const togglePhotoSelection = (photoId) => {
  if (selectedPhotoIds.value.includes(photoId)) {
    selectedPhotoIds.value = selectedPhotoIds.value.filter(id => id !== photoId);
  } else {
    selectedPhotoIds.value = [...selectedPhotoIds.value, photoId];
  }
};

const clearPhotoSelection = () => {
  selectedPhotoIds.value = [];
};

const getCategoryKey = (category, index) => {
  if (category && typeof category === 'object') {
    return String(category.id ?? index);
  }
  return String(category ?? index);
};

const getCategoryName = (categoryValue) => {
  if (categoryValue && typeof categoryValue === 'object') {
    if (categoryValue.name) {
      return categoryValue.name;
    }
  }

  const categoryId = categoryValue && typeof categoryValue === 'object'
    ? categoryValue.id
    : categoryValue;

  const normalizedId = String(categoryId ?? '');
  const category = categories.value.find(item => String(item.id) === normalizedId);
  return category?.name || '未分类';
};

const toggleCategory = async (categoryId) => {
  photoStore.toggleCategory(categoryId);
  await refresh();
};

const clearCategoryFilter = async () => {
  photoStore.setSelectedCategories([]);
  await refresh();
};

const setGalleryCategories = async (categoryIds) => {
  photoStore.setSelectedCategories(categoryIds);
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

const handleTopbarCommand = (command) => {
  if (command === 'categories') {
    router.push('/categories');
    return;
  }

  if (command === 'logout') {
    handleLogout();
  }
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
    linear-gradient(135deg, rgba(237, 147, 99, 0.09), transparent 32%),
    linear-gradient(225deg, rgba(100, 208, 173, 0.1), transparent 35%),
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
  border-bottom: 1px solid var(--line);
  background: rgba(11, 18, 16, 0.88);
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
  color: var(--accent-ink);
  font-weight: 850;
  background: var(--accent);
  box-shadow: 0 0 0 1px rgba(139, 226, 197, 0.18), 0 8px 24px rgba(0, 0, 0, 0.24);
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
  padding: clamp(1rem, 2.5vw, 1.6rem);
  border-left: 3px solid var(--accent-warm);
  background: rgba(26, 39, 35, 0.46);
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
  font-size: clamp(2.15rem, 4vw, 4.25rem);
  line-height: 1;
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
  background: var(--surface-panel);
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
  box-shadow: inset 0 3px 0 var(--accent);
}

.heroStats article:nth-child(2) {
  box-shadow: inset 0 3px 0 var(--accent-warm);
}

.heroStats article:nth-child(3) {
  box-shadow: inset 0 3px 0 #b4a7ff;
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
  background: rgba(26, 39, 35, 0.92);
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

.modeSwitch {
  justify-self: end;
}

.gallerySurface {
  width: min(100%, 1560px);
  margin: 0 auto;
  padding: 1rem clamp(1rem, 3vw, 2.5rem) 5rem;
}

.inlineError {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.75rem;
  padding: 0.65rem 0.8rem;
  border: 1px solid rgba(240, 120, 104, 0.28);
  border-radius: 8px;
  color: var(--text);
  background: rgba(240, 120, 104, 0.08);
}

.batchBar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
  padding: 0.75rem;
  border: 1px solid var(--line-soft);
  border-radius: 8px;
  background: rgba(26, 39, 35, 0.72);
}

.batchBar.active {
  border-color: rgba(100, 208, 173, 0.38);
  background: rgba(34, 51, 45, 0.96);
}

.batchSummary {
  display: grid;
  gap: 0.12rem;
  min-width: 0;
}

.batchSummary strong {
  color: var(--text-strong);
  font-size: 0.95rem;
}

.batchSummary span {
  color: var(--text-muted);
  font-size: 0.82rem;
}

.batchActions {
  display: flex;
  flex: 0 0 auto;
  gap: 0.5rem;
}

.masonryGrid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 1rem;
  align-items: start;
}

.photoCard {
  position: relative;
  display: block;
  width: 100%;
  overflow: hidden;
  border: 1px solid var(--line-soft);
  border-radius: 8px;
  background: var(--surface-elevated);
  box-shadow: var(--shadow-sm);
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.photoCard.selected {
  border-color: rgba(100, 208, 173, 0.7);
  box-shadow: 0 0 0 2px rgba(100, 208, 173, 0.16), var(--shadow-sm);
}

.photoCard:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.photoSelect {
  position: absolute;
  top: 0.5rem;
  left: 0.5rem;
  z-index: 2;
  display: grid;
  width: 2rem;
  height: 2rem;
  place-items: center;
  border-radius: 8px;
  border: 0;
  padding: 0;
  background: rgba(11, 18, 16, 0.72);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.24);
  cursor: pointer;
}

.photoSelect span {
  display: grid;
  width: 1.1rem;
  height: 1.1rem;
  place-items: center;
  border: 2px solid rgba(245, 241, 232, 0.78);
  border-radius: 5px;
  background: rgba(16, 24, 22, 0.5);
}

.photoSelect span::after {
  width: 0.3rem;
  height: 0.56rem;
  border-right: 2px solid var(--accent-ink);
  border-bottom: 2px solid var(--accent-ink);
  content: "";
  opacity: 0;
  transform: rotate(45deg) translate(-1px, -1px);
}

.photoSelect[aria-pressed="true"] span {
  border-color: var(--accent);
  background: var(--accent);
}

.photoSelect[aria-pressed="true"] span::after {
  opacity: 1;
}

.imageButton {
  position: relative;
  display: block;
  width: 100%;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  padding: 0;
  border: 0;
  background: var(--surface-muted);
  cursor: zoom-in;
}

.imageButton:focus-visible {
  position: relative;
  z-index: 1;
}

.photoImage {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.imageFallback {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 0.45rem;
  padding: 1rem;
  color: var(--text-muted);
  background: linear-gradient(135deg, var(--surface-muted), #382b27);
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

.photoActions {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 0.15rem;
}

.editButton {
  color: var(--accent-strong);
  opacity: 0.72;
}

.editButton:hover {
  opacity: 1;
}

.deleteButton {
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

.photoSkeleton {
  display: block;
  width: 100%;
  aspect-ratio: 4 / 3;
  border-radius: 8px;
  background: linear-gradient(90deg, #22332d 0%, #31453e 50%, #22332d 100%);
  background-size: 220% 100%;
  animation: shimmer 1.2s ease-in-out infinite;
}

.photoSkeleton:nth-child(3n + 1) {
  aspect-ratio: 3 / 4;
}

.photoSkeleton:nth-child(3n + 2) {
  aspect-ratio: 1 / 1;
}

.errorState .el-icon {
  color: var(--danger);
}

@keyframes shimmer {
  to {
    background-position: -220% 0;
  }
}

@media (max-width: 1180px) {
  .masonryGrid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
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
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 680px) {
  .appTopbar {
    padding: 0.75rem 1rem;
  }

  .brandCluster span {
    max-width: 8rem;
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

  .batchBar {
    align-items: stretch;
    flex-direction: column;
  }

  .batchActions {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }

  .masonryGrid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.75rem;
  }

  .photoMeta {
    padding: 0.65rem;
  }

}

@media (max-width: 430px) {
  .uploadButton {
    min-width: 5.25rem;
  }

  .heroCopy h1 {
    font-size: 2.35rem;
  }

  .heroStats span {
    font-size: 1.25rem;
  }

  .masonryGrid {
    grid-template-columns: 1fr;
  }
}
</style>
