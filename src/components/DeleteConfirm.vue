<template>
  <div v-if="isOpen" class="deleteModal">
    <div class="deleteModalContent">
      <div class="deleteModalHeader">
        <h2>删除确认</h2>
        <button class="closeButton" @click="close">&times;</button>
      </div>
      <p>您确定要删除图片 <span class="deleteWarning">{{ photoName }}</span> 吗？</p>
      <p>此操作无法撤销。</p>
      <div class="formActions">
        <button type="button" class="cancelButton" @click="close">
          取消
        </button>
        <button type="button" class="deleteButton" @click="confirmDelete">
          删除
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  photoId: {
    type: String,
    default: ''
  },
  photoName: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['close', 'confirm']);

const close = () => {
  emit('close');
};

const confirmDelete = () => {
  emit('confirm', props.photoId);
  close();
};
</script>

<style scoped>
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

.deleteModalContent p {
  margin: 0 0 1rem 0;
  color: #333;
}

.deleteWarning {
  color: #ff4757 !important;
  font-weight: 500;
}

.formActions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
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
</style>