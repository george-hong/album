<template>
  <el-dialog
    :visible="isOpen"
    @close="close"
    title="删除确认"
    width="400px"
  >
    <p>您确定要删除图片 <span style="color: #ff4757; font-weight: 500;">{{ photoName }}</span> 吗？</p>
    <p>此操作无法撤销。</p>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="close">取消</el-button>
        <el-button type="danger" @click="confirmDelete">删除</el-button>
      </span>
    </template>
  </el-dialog>
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

