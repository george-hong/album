<template>
  <el-image-viewer
    v-if="isOpen"
    :url-list="[imageUrl]"
    @close="handleClose"
  />
</template>

<script setup>
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
</script>