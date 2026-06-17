<template>
  <el-image-viewer
    v-if="isOpen"
    :url-list="[imageUrl]"
    hide-on-click-modal
    @close="handleClose"
  />
</template>

<script setup>
import { nextTick, onUnmounted, watch } from 'vue';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  imageUrl: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['close']);

const handleClose = () => {
  emit('close');
};

const handleViewerClick = (event) => {
  const target = event.target;
  if (!(target instanceof Element)) {
    return;
  }

  const wrapper = target.closest('.el-image-viewer__wrapper');
  if (!wrapper) {
    return;
  }

  const isProtectedArea = target.closest([
    '.el-image-viewer__img',
    '.el-image-viewer__actions',
    '.el-image-viewer__prev',
    '.el-image-viewer__next',
    '.el-image-viewer__progress'
  ].join(','));

  if (!isProtectedArea) {
    handleClose();
  }
};

watch(
  () => props.isOpen,
  async (isOpen) => {
    document.removeEventListener('click', handleViewerClick);
    if (isOpen) {
      await nextTick();
      document.addEventListener('click', handleViewerClick);
    }
  },
  { immediate: true }
);

onUnmounted(() => {
  document.removeEventListener('click', handleViewerClick);
});
</script>

<style>
.el-image-viewer__close {
  display: none !important;
}

.el-image-viewer__mask {
  opacity: 0.72;
  background: #030807;
}

.el-image-viewer__actions {
  height: 3rem;
  padding: 0 1rem;
  border: 1px solid rgba(100, 208, 173, 0.36);
  border-radius: 8px;
  color: var(--accent-ink);
  background: var(--accent);
  box-shadow: 0 14px 42px rgba(0, 0, 0, 0.36);
  opacity: 0.96;
}

.el-image-viewer__actions__inner {
  gap: 1rem;
  color: var(--accent-ink);
  font-size: 1.35rem;
}

.el-image-viewer__actions__inner .el-icon {
  width: 2rem;
  height: 2rem;
  border-radius: 8px;
  color: var(--accent-ink);
  transition: background 0.16s ease, transform 0.16s ease;
}

.el-image-viewer__actions__inner .el-icon:hover {
  background: rgba(11, 18, 16, 0.14);
  transform: translateY(-1px);
}

.el-image-viewer__actions__divider {
  background-color: rgba(11, 18, 16, 0.24);
}

.el-image-viewer__prev,
.el-image-viewer__next {
  border: 1px solid rgba(100, 208, 173, 0.36);
  color: var(--accent-ink);
  background: var(--accent);
  box-shadow: 0 14px 42px rgba(0, 0, 0, 0.36);
  opacity: 0.96;
}

.el-image-viewer__prev:hover,
.el-image-viewer__next:hover {
  background: var(--accent-strong);
}
</style>
