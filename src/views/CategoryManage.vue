<template>
  <main class="categoryPage">
    <header class="pageTopbar">
      <button class="backButton" type="button" @click="router.push('/')">
        <el-icon><ArrowLeft /></el-icon>
        <span>返回相册</span>
      </button>

      <div class="topbarTitle">
        <p>LIBRARY SETTINGS</p>
        <h1>分类管理</h1>
      </div>

      <div class="countBadge">{{ categories.length }} 个分类</div>
    </header>

    <section class="categoryLayout">
      <aside class="createPanel">
        <div class="panelTitle">
          <el-icon><Plus /></el-icon>
          <div>
            <h2>新建分类</h2>
            <p>给照片建立更清晰的浏览入口。</p>
          </div>
        </div>

        <div class="createForm">
          <el-input
            v-model="newCategory"
            size="large"
            placeholder="输入分类名称"
            clearable
            @keyup.enter="handleAddCategory"
          />
          <el-button
            type="primary"
            size="large"
            :icon="Plus"
            :disabled="!newCategory.trim()"
            :loading="isSaving"
            @click="handleAddCategory"
          >
            添加
          </el-button>
        </div>
      </aside>

      <section class="listPanel">
        <div class="listHeader">
          <div>
            <h2>全部分类</h2>
            <p>删除分类会同步移除照片与该分类的关联。</p>
          </div>
        </div>

        <div v-if="categories.length > 0" class="categoryGrid">
          <article v-for="category in categories" :key="category.id" class="categoryItem">
            <div class="categoryIcon">
              <el-icon><Folder /></el-icon>
            </div>
            <div class="categoryInfo">
              <h3 :title="category.name">{{ category.name }}</h3>
              <p>ID {{ category.id }}</p>
            </div>
            <el-button
              :icon="Delete"
              circle
              text
              title="删除分类"
              class="deleteButton"
              :disabled="category.name === '全部'"
              @click="handleDeleteCategory(category)"
            />
          </article>
        </div>

        <div v-else class="emptyState">
          <el-icon><FolderOpened /></el-icon>
          <h2>暂无分类</h2>
          <p>添加第一个分类后，上传和筛选照片会更方便。</p>
        </div>
      </section>
    </section>
  </main>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { ArrowLeft, Delete, Folder, FolderOpened, Plus } from '@element-plus/icons-vue';
import { useCategoryStore } from '../stores/category';

const router = useRouter();
const categoryStore = useCategoryStore();
const newCategory = ref('');
const isSaving = ref(false);

const categories = computed(() => categoryStore.categories);

onMounted(async () => {
  await categoryStore.loadCategories();
});

const handleAddCategory = async () => {
  const name = newCategory.value.trim();
  if (!name) {
    ElMessage.warning('请输入分类名称');
    return;
  }

  isSaving.value = true;
  try {
    await categoryStore.addCategory({ name });
    newCategory.value = '';
    ElMessage.success('分类已添加');
  } catch (error) {
    ElMessage.error(error.message || '添加分类失败');
  } finally {
    isSaving.value = false;
  }
};

const handleDeleteCategory = async (category) => {
  if (category.name === '全部') {
    return;
  }

  try {
    await ElMessageBox.confirm(
      `确定删除「${category.name}」吗？照片不会被删除，但会移除这个分类关联。`,
      '删除分类',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );

    await categoryStore.deleteCategory(category.id);
    ElMessage.success('分类已删除');
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除分类失败');
    }
  }
};
</script>

<style scoped>
.categoryPage {
  min-height: 100vh;
  color: var(--text-strong);
  background:
    radial-gradient(circle at 12% 0%, rgba(214, 116, 68, 0.12), transparent 22rem),
    var(--surface-canvas);
}

.pageTopbar {
  position: sticky;
  top: 0;
  z-index: 20;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  gap: 1rem;
  align-items: center;
  padding: 1rem clamp(1rem, 3vw, 2.5rem);
  border-bottom: 1px solid var(--line-soft);
  background: rgba(255, 253, 248, 0.9);
  backdrop-filter: blur(18px);
}

.backButton {
  justify-self: start;
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  min-height: 2.35rem;
  padding: 0.45rem 0.75rem;
  border: 1px solid var(--line-soft);
  border-radius: 999px;
  color: var(--text);
  background: rgba(255, 255, 255, 0.7);
  cursor: pointer;
}

.topbarTitle {
  text-align: center;
}

.topbarTitle p {
  margin: 0;
  color: var(--accent);
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.14em;
}

.topbarTitle h1 {
  margin: 0.12rem 0 0;
  font-size: 1.25rem;
  letter-spacing: 0;
}

.countBadge {
  justify-self: end;
  padding: 0.45rem 0.7rem;
  border: 1px solid var(--line-soft);
  border-radius: 999px;
  color: var(--text-muted);
  background: rgba(255, 255, 255, 0.64);
}

.categoryLayout {
  display: grid;
  grid-template-columns: minmax(18rem, 24rem) minmax(0, 1fr);
  gap: 1rem;
  width: min(100%, 1280px);
  margin: 0 auto;
  padding: clamp(1rem, 3vw, 2rem);
}

.createPanel,
.listPanel {
  border: 1px solid var(--line-soft);
  border-radius: 8px;
  background: rgba(255, 253, 248, 0.82);
  box-shadow: var(--shadow-sm);
}

.createPanel {
  position: sticky;
  top: 5.25rem;
  align-self: start;
  padding: 1rem;
}

.panelTitle {
  display: flex;
  gap: 0.8rem;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.panelTitle > .el-icon {
  display: grid;
  width: 2.4rem;
  height: 2.4rem;
  place-items: center;
  border-radius: 8px;
  color: #fff;
  background: var(--accent);
}

.panelTitle h2,
.listHeader h2 {
  margin: 0;
  font-size: 1.1rem;
  letter-spacing: 0;
}

.panelTitle p,
.listHeader p {
  margin: 0.22rem 0 0;
  color: var(--text-muted);
  font-size: 0.88rem;
}

.createForm {
  display: grid;
  gap: 0.75rem;
}

.listPanel {
  min-width: 0;
  padding: 1rem;
}

.listHeader {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.categoryGrid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(13.5rem, 1fr));
  gap: 0.75rem;
}

.categoryItem {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 0.75rem;
  align-items: center;
  padding: 0.85rem;
  border: 1px solid var(--line-soft);
  border-radius: 8px;
  background: #fff;
  transition: border-color 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease;
}

.categoryItem:hover {
  border-color: rgba(34, 95, 84, 0.32);
  box-shadow: var(--shadow-sm);
  transform: translateY(-1px);
}

.categoryIcon {
  display: grid;
  width: 2.4rem;
  height: 2.4rem;
  place-items: center;
  border-radius: 8px;
  color: var(--accent);
  background: rgba(34, 95, 84, 0.08);
}

.categoryInfo {
  min-width: 0;
}

.categoryInfo h3 {
  margin: 0;
  overflow: hidden;
  font-size: 0.95rem;
  letter-spacing: 0;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.categoryInfo p {
  margin: 0.15rem 0 0;
  color: var(--text-muted);
  font-size: 0.78rem;
}

.deleteButton {
  color: var(--danger);
}

.emptyState {
  display: grid;
  min-height: 22rem;
  place-items: center;
  align-content: center;
  gap: 0.5rem;
  text-align: center;
  color: var(--text-muted);
}

.emptyState .el-icon {
  color: var(--accent);
  font-size: 2.8rem;
}

.emptyState h2 {
  margin: 0;
  color: var(--text-strong);
  font-size: 1.2rem;
  letter-spacing: 0;
}

.emptyState p {
  margin: 0;
}

@media (max-width: 820px) {
  .pageTopbar {
    grid-template-columns: 1fr auto;
  }

  .topbarTitle {
    order: -1;
    grid-column: 1 / -1;
    text-align: left;
  }

  .countBadge {
    justify-self: end;
  }

  .categoryLayout {
    grid-template-columns: 1fr;
  }

  .createPanel {
    position: static;
  }
}

@media (max-width: 520px) {
  .pageTopbar {
    padding: 0.8rem 1rem;
  }

  .categoryLayout {
    padding: 0.75rem;
  }

  .countBadge {
    display: none;
  }

  .categoryGrid {
    grid-template-columns: 1fr;
  }
}
</style>
