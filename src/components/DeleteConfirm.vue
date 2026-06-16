<template>
  <teleport to="body">
    <div v-if="isOpen" class="confirmOverlay" @click.self="close">
      <section
        ref="dialogRef"
        class="confirmPanel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-title"
        aria-describedby="delete-description"
        tabindex="-1"
      >
        <div class="dangerIcon">
          <el-icon><Delete /></el-icon>
        </div>
        <h2 id="delete-title">删除照片？</h2>
        <p id="delete-description">
          确定要删除
          <strong>{{ photoName }}</strong>
          吗？删除后该照片将不再显示在相册中。
        </p>

        <footer class="confirmActions">
          <el-button ref="cancelButtonRef" size="large" @click="close">取消</el-button>
          <el-button type="danger" size="large" @click="confirmDelete">删除</el-button>
        </footer>
      </section>
    </div>
  </teleport>
</template>

<script setup>
import { ref, toRef } from 'vue';
import { Delete } from '@element-plus/icons-vue';
import { useModalFocus } from '../composables/useModalFocus';

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
const dialogRef = ref(null);
const cancelButtonRef = ref(null);

const close = () => {
  emit('close');
};

const confirmDelete = () => {
  emit('confirm', props.photoId);
  close();
};

useModalFocus({
  isOpen: toRef(props, 'isOpen'),
  panelRef: dialogRef,
  initialFocusRef: cancelButtonRef,
  onClose: close
});
</script>

<style scoped>
.confirmOverlay {
  position: fixed;
  inset: 0;
  z-index: 2100;
  display: grid;
  place-items: center;
  padding: 1rem;
  background: rgba(3, 8, 7, 0.74);
  backdrop-filter: blur(10px);
}

.confirmPanel {
  width: min(100%, 25rem);
  padding: 1.35rem;
  border: 1px solid var(--line);
  border-radius: 8px;
  color: var(--text-strong);
  background: var(--surface-panel);
  box-shadow: var(--shadow-lg);
}

.dangerIcon {
  display: grid;
  width: 3rem;
  height: 3rem;
  place-items: center;
  margin-bottom: 1rem;
  border-radius: 8px;
  color: var(--danger);
  background: rgba(240, 120, 104, 0.12);
}

.dangerIcon .el-icon {
  font-size: 1.45rem;
}

.confirmPanel h2 {
  margin: 0;
  font-size: 1.28rem;
  letter-spacing: 0;
}

.confirmPanel p {
  margin: 0.65rem 0 1.2rem;
  color: var(--text-muted);
  line-height: 1.7;
}

.confirmPanel strong {
  color: var(--text-strong);
  word-break: break-all;
}

.confirmActions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

@media (max-width: 520px) {
  .confirmOverlay {
    align-items: end;
    padding: 0;
  }

  .confirmPanel {
    width: 100%;
    padding-bottom: calc(1.35rem + env(safe-area-inset-bottom));
    border-right: 0;
    border-bottom: 0;
    border-left: 0;
    border-radius: 8px 8px 0 0;
  }
}
</style>
