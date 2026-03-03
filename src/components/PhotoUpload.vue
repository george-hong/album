<template>
  <div v-if="isOpen" class="uploadModal">
    <div class="uploadModalContent">
      <div class="uploadModalHeader">
        <h2>上传图片</h2>
        <button class="closeButton" @click="close">&times;</button>
      </div>
      <form @submit.prevent="handleSubmit" class="uploadForm">
        <div class="formGroup">
          <label class="label">图片名称</label>
          <input
            type="text"
            v-model="photoName"
            class="input"
            placeholder="请输入图片名称"
          />
        </div>
        
        <div class="formGroup">
          <label class="label">选择分类</label>
          <div class="categoryCheckboxes">
            <label
              v-for="category in categories"
              :key="category.id"
              class="checkboxLabel"
            >
              <input
                type="checkbox"
                :value="category.id"
                v-model="selectedCategories"
              />
              {{ category.name }}
            </label>
          </div>
        </div>
        
        <div class="formGroup">
          <label class="label">上传图片</label>
          <div
            class="fileLabel"
            :class="{ dragging: isDragging }"
            @dragover.prevent="handleDragOver"
            @dragleave.prevent="handleDragLeave"
            @drop.prevent="handleDrop"
          >
            <input
              type="file"
              ref="fileInput"
              @change="handleFileChange"
              accept="image/*"
              multiple
              style="display: none"
            />
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
            <p>点击或拖拽图片到此处上传</p>
          </div>
        </div>
        
        <div v-if="previewImages.length > 0" class="previewList">
          <div
            v-for="(image, index) in previewImages"
            :key="index"
            class="previewItem"
          >
            <img :src="image.url" :alt="image.name" />
            <button
              type="button"
              class="removePreview"
              @click="removePreview(index)"
            >
              &times;
            </button>
          </div>
        </div>
        
        <div class="formActions">
          <button type="button" class="cancelButton" @click="close">
            取消
          </button>
          <button type="submit" class="submitButton" :disabled="selectedFiles.length === 0">
            上传
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { usePhotoStore } from '../stores/photo';
import { useCategoryStore } from '../stores/category';
import { useAuthStore } from '../stores/auth';

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
const selectedCategories = ref(['2']);
const selectedFiles = ref([]);
const previewImages = ref([]);
const isDragging = ref(false);
const fileInput = ref(null);

const categories = computed(() => categoryStore.categories);

const close = () => {
  emit('close');
  resetForm();
};

const resetForm = () => {
  photoName.value = '';
  selectedCategories.value = ['2'];
  selectedFiles.value = [];
  previewImages.value = [];
  isDragging.value = false;
};

const handleFileChange = (e) => {
  if (e.target.files && e.target.files.length > 0) {
    selectedFiles.value = Array.from(e.target.files);
    generatePreviews(selectedFiles.value);
  }
};

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

const removePreview = (index) => {
  previewImages.value.splice(index, 1);
  selectedFiles.value.splice(index, 1);
};

const handleSubmit = async () => {
  try {
    const formData = new FormData();
    formData.append('user_id', authStore.currentUser.id);
    formData.append('photo_name', photoName.value);
    selectedCategories.value.forEach(categoryId => {
      formData.append('categories', categoryId);
    });
    selectedFiles.value.forEach(file => {
      formData.append('file', file);
    });
    
    await photoStore.uploadPhoto(formData);
    emit('success');
    close();
  } catch (error) {
    console.error('上传失败:', error);
  }
};
</script>

<style scoped>
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
  max-height: 90vh;
  overflow-y: auto;
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
  margin: 0;
  color: #666;
  font-size: 1rem;
}

.previewList {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 1rem;
}

.previewItem {
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid #ddd;
}

.previewItem img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.removePreview {
  position: absolute;
  top: 5px;
  right: 5px;
  background-color: rgba(255, 0, 0, 0.8);
  color: white;
  border: none;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
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

.submitButton:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}
</style>