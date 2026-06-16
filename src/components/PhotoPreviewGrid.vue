<template>
  <div
    v-if="visibleItems.length > 0"
    class="previewGrid"
    :class="[`previewGrid--${variant}`, { 'previewGrid--compact': compact }]"
    :aria-label="ariaLabel"
  >
    <article v-for="(item, index) in visibleItems" :key="getItemKey(item, index)" class="previewItem">
      <button
        type="button"
        class="previewImageButton"
        :aria-label="`预览 ${item.name || '图片'}`"
        @click="openViewer(index)"
      >
        <img
          v-if="!imageErrors[getItemKey(item, index)]"
          :src="item.url"
          :alt="item.name || '图片预览'"
          :style="{ objectFit }"
          @error="markImageError(getItemKey(item, index))"
        />
        <div v-else class="previewFallback">
          <el-icon><Picture /></el-icon>
        </div>
      </button>

      <button
        v-if="removable"
        type="button"
        class="removeButton"
        title="移除"
        aria-label="移除图片"
        @click.stop="emit('remove', index)"
      >
        <el-icon><Close /></el-icon>
      </button>

      <span v-if="showNames" class="previewName" :title="item.name">{{ item.name }}</span>
    </article>

    <div v-if="hiddenCount > 0" class="previewMore">+{{ hiddenCount }}</div>
  </div>

  <ImageViewer
    :is-open="isViewerOpen"
    :image-url="viewerImageUrl"
    @close="isViewerOpen = false"
  />
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { Close, Picture } from '@element-plus/icons-vue';
import ImageViewer from './ImageViewer.vue';

const props = defineProps({
  items: {
    type: Array,
    default: () => []
  },
  variant: {
    type: String,
    default: 'grid'
  },
  limit: {
    type: Number,
    default: 0
  },
  removable: {
    type: Boolean,
    default: false
  },
  showNames: {
    type: Boolean,
    default: false
  },
  compact: {
    type: Boolean,
    default: false
  },
  objectFit: {
    type: String,
    default: 'cover'
  },
  ariaLabel: {
    type: String,
    default: '图片预览'
  }
});

const emit = defineEmits(['remove']);

const imageErrors = ref({});
const isViewerOpen = ref(false);
const viewerImageUrl = ref('');

const visibleItems = computed(() => (
  props.limit > 0 ? props.items.slice(0, props.limit) : props.items
));

const hiddenCount = computed(() => (
  props.limit > 0 ? Math.max(props.items.length - props.limit, 0) : 0
));

const getItemKey = (item, index) => String(item.id ?? item.url ?? index);

const markImageError = (key) => {
  imageErrors.value = {
    ...imageErrors.value,
    [key]: true
  };
};

const openViewer = (index) => {
  const item = visibleItems.value[index];
  if (!item?.url) {
    return;
  }
  viewerImageUrl.value = item.url;
  isViewerOpen.value = true;
};

watch(
  () => props.items.map((item, index) => getItemKey(item, index)).join('|'),
  () => {
    imageErrors.value = {};
  }
);
</script>

<style scoped>
.previewGrid {
  display: grid;
  gap: 0.75rem;
}

.previewGrid--rail {
  grid-auto-columns: 8.8rem;
  grid-auto-flow: column;
  overflow-x: auto;
  padding-bottom: 0.25rem;
}

.previewGrid--grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.previewGrid--single {
  grid-template-columns: 1fr;
}

.previewGrid--compact {
  gap: 0.5rem;
}

.previewItem,
.previewMore {
  position: relative;
  overflow: hidden;
  border: 1px solid var(--line-soft);
  border-radius: 8px;
  background: var(--surface-elevated);
}

.previewImageButton {
  display: block;
  width: 100%;
  aspect-ratio: 1 / 1;
  overflow: hidden;
  padding: 0;
  border: 0;
  background: var(--surface-muted);
  cursor: zoom-in;
}

.previewGrid--single .previewImageButton {
  aspect-ratio: 16 / 10;
}

.previewImageButton img {
  display: block;
  width: 100%;
  height: 100%;
}

.previewFallback,
.previewMore {
  display: grid;
  place-items: center;
  color: var(--text-muted);
}

.previewFallback {
  height: 100%;
}

.previewFallback .el-icon {
  font-size: 2rem;
}

.previewMore {
  aspect-ratio: 1 / 1;
  color: var(--text);
  font-weight: 800;
}

.removeButton {
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

.removeButton:hover {
  color: var(--accent-ink);
  background: var(--accent);
}

.previewName {
  display: block;
  padding: 0.45rem;
  overflow: hidden;
  color: var(--text-muted);
  font-size: 0.76rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 520px) {
  .previewGrid--grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
