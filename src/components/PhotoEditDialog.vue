<template>
  <teleport to="body">
    <div v-if="isOpen && selectedPhotos.length > 0" class="editOverlay" @click.self="close">
      <section
        ref="dialogRef"
        class="editPanel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="photo-edit-title"
        tabindex="-1"
      >
        <header class="editHeader">
          <div>
            <p class="eyebrow">照片信息</p>
            <h2 id="photo-edit-title">{{ isBatchMode ? '批量编辑照片' : '编辑照片' }}</h2>
          </div>
          <el-button
            ref="closeButtonRef"
            :icon="Close"
            circle
            text
            title="关闭"
            aria-label="关闭编辑窗口"
            @click="close"
          />
        </header>

        <form class="editForm" @submit.prevent="handleSubmit">
          <PhotoPreviewGrid
            :items="previewItems"
            :variant="isBatchMode ? 'grid' : 'single'"
            :limit="isBatchMode ? 6 : 0"
            :object-fit="isBatchMode ? 'cover' : 'contain'"
            compact
            aria-label="照片预览"
          />

          <label v-if="!isBatchMode" class="fieldGroup">
            <span>文件名</span>
            <el-input
              ref="filenameInputRef"
              v-model="filename"
              size="large"
              name="filename"
              autocomplete="off"
              maxlength="255"
              show-word-limit
              clearable
            />
          </label>

          <div class="fieldGroup">
            <span>类别</span>
            <p v-if="isBatchMode" class="fieldHint">保存后会把已选 {{ selectedPhotos.length }} 张照片统一设置为这些类别。</p>
            <CategoryPicker
              v-model="selectedCategoryIds"
              :categories="categories"
              placeholder="搜索分类"
            />
          </div>

          <footer class="editActions">
            <el-button size="large" @click="close">取消</el-button>
            <el-button
              type="primary"
              size="large"
              native-type="submit"
              :loading="isSubmitting"
            >
              保存
            </el-button>
          </footer>
        </form>
      </section>
    </div>
  </teleport>
</template>

<script setup>
import { computed, ref, toRef, watch } from 'vue';
import { Close } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { usePhotoStore } from '../stores/photo';
import { useModalFocus } from '../composables/useModalFocus';
import CategoryPicker from './CategoryPicker.vue';
import PhotoPreviewGrid from './PhotoPreviewGrid.vue';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  photo: {
    type: Object,
    default: null
  },
  photos: {
    type: Array,
    default: () => []
  },
  categories: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['close', 'saved']);

const photoStore = usePhotoStore();
const filename = ref('');
const selectedCategoryIds = ref([]);
const isSubmitting = ref(false);
const dialogRef = ref(null);
const closeButtonRef = ref(null);
const filenameInputRef = ref(null);

const selectedPhotos = computed(() => {
  if (props.photos.length > 0) {
    return props.photos;
  }
  return props.photo ? [props.photo] : [];
});

const isBatchMode = computed(() => selectedPhotos.value.length > 1);

const getImageUrl = (photo) => {
  const path = photo?.path || '';
  if (!path) {
    return '';
  }
  if (/^https?:\/\//.test(path) || path.startsWith('/')) {
    return path;
  }
  return `/${path}`;
};

const previewItems = computed(() => (
  selectedPhotos.value.map(photo => ({
    id: photo.id,
    name: photo.filename,
    url: getImageUrl(photo)
  }))
));

const resetForm = () => {
  const firstPhoto = selectedPhotos.value[0];
  filename.value = firstPhoto?.filename || '';
  selectedCategoryIds.value = Array.isArray(firstPhoto?.categories)
    ? firstPhoto.categories.map(category => String(category.id ?? category)).filter(Boolean)
    : [];
  isSubmitting.value = false;
};

const close = () => {
  emit('close');
};

const handleSubmit = async () => {
  const nextFilename = filename.value.trim();
  if (!isBatchMode.value && !nextFilename) {
    ElMessage.warning('请输入文件名');
    return;
  }

  isSubmitting.value = true;

  try {
    const updatedPhotos = await Promise.all(
      selectedPhotos.value.map(photo => photoStore.updatePhoto(photo.id, {
        filename: isBatchMode.value ? photo.filename : nextFilename,
        categories: selectedCategoryIds.value
      }))
    );
    ElMessage.success(isBatchMode.value ? '批量照片信息已更新' : '照片信息已更新');
    emit('saved', isBatchMode.value ? updatedPhotos : updatedPhotos[0]);
    close();
  } catch (error) {
    ElMessage.error(error.message || '保存失败，请重试');
  } finally {
    isSubmitting.value = false;
  }
};

watch(
  () => [props.isOpen, props.photo?.id, props.photos.map(photo => photo.id).join(',')],
  ([open]) => {
    if (open) {
      resetForm();
    }
  },
  { immediate: true }
);

useModalFocus({
  isOpen: toRef(props, 'isOpen'),
  panelRef: dialogRef,
  initialFocusRef: filenameInputRef,
  onClose: close
});
</script>

<style scoped>
.editOverlay {
  position: fixed;
  inset: 0;
  z-index: 2100;
  display: grid;
  place-items: center;
  padding: 1rem;
  background: rgba(3, 8, 7, 0.74);
  backdrop-filter: blur(10px);
}

.editPanel {
  width: min(100%, 34rem);
  max-height: min(96vh, 52rem);
  overflow: auto;
  padding: 1.2rem;
  border: 1px solid var(--line);
  border-radius: 8px;
  color: var(--text-strong);
  background: var(--surface-panel);
  box-shadow: var(--shadow-lg);
}

.editHeader {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.editHeader h2,
.editHeader p {
  margin: 0;
}

.editHeader h2 {
  font-size: 1.35rem;
  letter-spacing: 0;
}

.editForm {
  display: grid;
  gap: 1rem;
}

.editPreview {
  position: relative;
  aspect-ratio: 16 / 10;
  overflow: hidden;
  border: 1px solid var(--line-soft);
  border-radius: 8px;
  background: var(--surface-muted);
}

.batchPreview {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.5rem;
}

.batchPreviewItem,
.batchPreviewMore {
  aspect-ratio: 1 / 1;
  overflow: hidden;
  border: 1px solid var(--line-soft);
  border-radius: 8px;
  background: var(--surface-muted);
}

.batchPreviewItem img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.batchPreviewMore {
  display: grid;
  place-items: center;
  color: var(--text);
  font-weight: 800;
}

.editPreview img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.previewFallback {
  display: grid;
  height: 100%;
  place-items: center;
  color: var(--text-muted);
}

.previewFallback .el-icon {
  font-size: 2rem;
}

.fieldGroup {
  display: grid;
  gap: 0.5rem;
}

.fieldGroup > span {
  color: var(--text);
  font-size: 0.9rem;
  font-weight: 750;
}

.fieldHint {
  margin: -0.15rem 0 0;
  color: var(--text-muted);
  font-size: 0.82rem;
}

.categoryRail {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  min-height: 2.5rem;
}

.categoryTag {
  max-width: 100%;
}

.editActions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  margin-top: 0.25rem;
}

@media (max-width: 520px) {
  .editOverlay {
    align-items: end;
    padding: 0;
  }

  .editPanel {
    width: 100%;
    max-height: 96vh;
    padding-bottom: calc(1.2rem + env(safe-area-inset-bottom));
    border-right: 0;
    border-bottom: 0;
    border-left: 0;
    border-radius: 8px 8px 0 0;
  }

  .batchPreview {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
