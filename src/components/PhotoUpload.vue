<template>
  <teleport to="body">
    <div v-if="isOpen" class="uploadOverlay" @click.self="close">
      <section
        ref="dialogRef"
        class="uploadSheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="upload-title"
        tabindex="-1"
      >
        <header class="sheetHeader">
          <div>
            <p class="eyebrow">添加到相册</p>
            <h2 id="upload-title">上传照片</h2>
          </div>
          <el-button
            ref="closeButtonRef"
            :icon="Close"
            circle
            text
            title="关闭"
            aria-label="关闭上传窗口"
            @click="close"
          />
        </header>

        <form class="uploadForm" @submit.prevent="handleSubmit">
          <label class="fieldGroup">
            <span>{{ selectedFiles.length > 1 ? '批量名称' : '照片名称' }}</span>
            <el-input
              v-model="photoName"
              size="large"
              name="photo_name"
              autocomplete="off"
              :placeholder="selectedFiles.length > 1 ? '留空则保留各自文件名' : '留空则使用文件名'"
              clearable
            />
          </label>

          <div class="fieldGroup">
            <span>分类</span>
            <CategoryPicker
              v-model="selectedCategories"
              :categories="categories"
              placeholder="搜索分类"
            />
          </div>

          <div
            class="dropzone"
            :class="{ dragging: isDragging, hasFiles: selectedFiles.length > 0 }"
            role="button"
            tabindex="0"
            aria-controls="photo-files"
            @click="triggerFileInput"
            @keydown.enter.prevent="triggerFileInput"
            @keydown.space.prevent="triggerFileInput"
            @dragover.prevent="handleDragOver"
            @dragleave.prevent="handleDragLeave"
            @drop.prevent="handleDrop"
          >
            <input
              ref="fileInput"
              id="photo-files"
              name="photos"
              type="file"
              accept="image/*"
              multiple
              hidden
              @change="handleFileChange"
            />
            <el-icon><UploadFilled /></el-icon>
            <h3>{{ selectedFiles.length > 0 ? `已选择 ${selectedFiles.length} 张照片` : '拖拽照片到这里' }}</h3>
            <p>支持多选，也可以点击选择本地图片。</p>
          </div>

          <PhotoPreviewGrid
            v-if="previewImages.length > 0"
            :items="previewImages"
            variant="rail"
            removable
            show-names
            aria-label="照片预览"
            @remove="removePreview"
          />

          <footer class="sheetActions">
            <el-button size="large" @click="close">取消</el-button>
            <el-button
              type="primary"
              size="large"
              native-type="submit"
              :loading="isSubmitting"
              :disabled="selectedFiles.length === 0"
            >
              上传
            </el-button>
          </footer>
        </form>
      </section>
    </div>
  </teleport>
</template>

<script setup>
import { computed, ref, toRef } from 'vue';
import { Close, UploadFilled } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { usePhotoStore } from '../stores/photo';
import { useCategoryStore } from '../stores/category';
import { useAuthStore } from '../stores/auth';
import { useModalFocus } from '../composables/useModalFocus';
import CategoryPicker from './CategoryPicker.vue';
import PhotoPreviewGrid from './PhotoPreviewGrid.vue';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close', 'success']);

const photoStore = usePhotoStore();
const categoryStore = useCategoryStore();
const authStore = useAuthStore();

const photoName = ref('');
const selectedCategories = ref([]);
const selectedFiles = ref([]);
const previewImages = ref([]);
const isDragging = ref(false);
const isSubmitting = ref(false);
const fileInput = ref(null);
const dialogRef = ref(null);
const closeButtonRef = ref(null);

const categories = computed(() => categoryStore.categories);

const triggerFileInput = () => {
  fileInput.value?.click();
};

const close = () => {
  emit('close');
  resetForm();
};

useModalFocus({
  isOpen: toRef(props, 'isOpen'),
  panelRef: dialogRef,
  initialFocusRef: closeButtonRef,
  onClose: close
});

const resetForm = () => {
  photoName.value = '';
  selectedCategories.value = [];
  selectedFiles.value = [];
  previewImages.value = [];
  isDragging.value = false;
  isSubmitting.value = false;
};

const setFiles = (files) => {
  selectedFiles.value = Array.from(files).filter(file => file.type.startsWith('image/'));
  generatePreviews(selectedFiles.value);
};

const handleFileChange = (event) => {
  if (event.target.files?.length) {
    setFiles(event.target.files);
  }
};

const handleDragOver = () => {
  isDragging.value = true;
};

const handleDragLeave = () => {
  isDragging.value = false;
};

const handleDrop = (event) => {
  isDragging.value = false;
  if (event.dataTransfer.files?.length) {
    setFiles(event.dataTransfer.files);
  }
};

const generatePreviews = (files) => {
  previewImages.value = [];
  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = (event) => {
      previewImages.value.push({
        name: file.name,
        url: event.target.result
      });
    };
    reader.readAsDataURL(file);
  });
};

const removePreview = (index) => {
  previewImages.value.splice(index, 1);
  selectedFiles.value.splice(index, 1);
};

const handleSubmit = async () => {
  if (selectedFiles.value.length === 0) {
    ElMessage.warning('请选择要上传的照片');
    return;
  }

  isSubmitting.value = true;

  try {
    const formData = new FormData();
    formData.append('user_id', authStore.currentUser.id);
    formData.append('photo_name', photoName.value.trim());
    selectedCategories.value.forEach(categoryId => {
      formData.append('categories', categoryId);
    });
    selectedFiles.value.forEach(file => {
      formData.append('file', file);
    });

    await photoStore.uploadPhoto(formData);
    ElMessage.success('上传成功');
    emit('success');
    close();
  } catch (error) {
    ElMessage.error(error.message || '上传失败，请重试');
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<style scoped>
.uploadOverlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: grid;
  place-items: center;
  padding: 1rem;
  background: rgba(3, 8, 7, 0.72);
  backdrop-filter: blur(10px);
}

.uploadSheet {
  width: min(100%, 44rem);
  max-height: min(86vh, 46rem);
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--surface-panel);
  box-shadow: var(--shadow-lg);
}

.sheetHeader {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.25rem 1.25rem 0.75rem;
  border-bottom: 1px solid var(--line-soft);
}

.eyebrow {
  margin: 0 0 0.2rem;
  color: var(--accent);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.14em;
}

.sheetHeader h2 {
  margin: 0;
  font-size: 1.35rem;
  letter-spacing: 0;
}

.uploadForm {
  display: grid;
  gap: 1rem;
  max-height: calc(min(86vh, 46rem) - 5.2rem);
  overflow-y: auto;
  padding: 1.25rem;
}

.fieldGroup {
  display: grid;
  gap: 0.5rem;
}

.fieldGroup > span {
  color: var(--text);
  font-size: 0.9rem;
  font-weight: 700;
}

.categoryRail {
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  padding-bottom: 0.2rem;
}

.dropzone {
  display: grid;
  place-items: center;
  gap: 0.4rem;
  min-height: 13.5rem;
  padding: 1.5rem;
  border: 1px dashed rgba(100, 208, 173, 0.5);
  border-radius: 8px;
  color: var(--text-muted);
  text-align: center;
  background: linear-gradient(145deg, rgba(100, 208, 173, 0.1), rgba(237, 147, 99, 0.08));
  cursor: pointer;
  transition: border-color 0.18s ease, background 0.18s ease, transform 0.18s ease;
}

.dropzone:hover,
.dropzone.dragging {
  border-color: var(--accent);
  background: linear-gradient(145deg, rgba(100, 208, 173, 0.17), rgba(237, 147, 99, 0.12));
  transform: translateY(-1px);
}

.dropzone:focus-visible {
  outline: 3px solid var(--accent);
  outline-offset: 3px;
}

.dropzone .el-icon {
  color: var(--accent);
  font-size: 2.5rem;
}

.dropzone h3 {
  margin: 0;
  color: var(--text-strong);
  font-size: 1.05rem;
  letter-spacing: 0;
}

.dropzone p {
  margin: 0;
  font-size: 0.9rem;
}

.previewRail {
  display: grid;
  grid-auto-columns: 8.8rem;
  grid-auto-flow: column;
  gap: 0.75rem;
  overflow-x: auto;
  padding-bottom: 0.25rem;
}

.previewItem {
  position: relative;
  overflow: hidden;
  border: 1px solid var(--line-soft);
  border-radius: 8px;
  background: var(--surface-elevated);
}

.previewItem img {
  display: block;
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
}

.previewItem button {
  position: absolute;
  top: 0.4rem;
  right: 0.4rem;
  display: grid;
  width: 2.5rem;
  height: 2.5rem;
  place-items: center;
  border: 0;
  border-radius: 999px;
  color: var(--text-strong);
  background: rgba(9, 16, 14, 0.84);
  cursor: pointer;
  transition: background 0.16s ease, color 0.16s ease;
}

.previewItem button:hover {
  color: var(--accent-ink);
  background: var(--accent);
}

.previewItem span {
  display: block;
  padding: 0.45rem;
  overflow: hidden;
  color: var(--text-muted);
  font-size: 0.76rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sheetActions {
  position: sticky;
  bottom: -1.25rem;
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin: 0 -1.25rem -1.25rem;
  padding: 0.9rem 1.25rem;
  border-top: 1px solid var(--line-soft);
  background: rgba(26, 39, 35, 0.96);
  backdrop-filter: blur(12px);
}

@media (max-width: 620px) {
  .uploadOverlay {
    align-items: end;
    padding: 0;
  }

  .uploadSheet {
    width: 100%;
    max-height: 92vh;
    border-right: 0;
    border-bottom: 0;
    border-left: 0;
    border-radius: 8px 8px 0 0;
  }

  .uploadForm {
    max-height: calc(92vh - 5.2rem);
    padding: 1rem;
  }

  .dropzone {
    min-height: 10.5rem;
  }

  .sheetActions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    margin: 0 -1rem -1rem;
    padding: 0.8rem 1rem calc(0.8rem + env(safe-area-inset-bottom));
  }
}
</style>
