<template>
  <div class="categoryManagePage">
    <div class="pageHeader">
      <h1>分类管理</h1>
      <el-button type="primary" @click="$router.push('/')">返回首页</el-button>
    </div>
    
    <div class="pageSpacer"></div>
    
    <div class="categoryContent">
      <!-- 添加新分类表单 - 固定在顶部 -->
      <div class="addCategoryForm">
        <div class="formTitle">
          <el-icon><Plus /></el-icon>
          <span>添加新分类</span>
        </div>
        <div class="formRow">
          <el-input
            v-model="newCategory"
            placeholder="请输入分类名称"
            clearable
            @keyup.enter="handleAddCategory"
          />
          <el-button 
            type="primary"
            @click="handleAddCategory"
            :disabled="!newCategory.trim()"
          >
            添加
          </el-button>
        </div>
      </div>
      
      <!-- 分类列表 - 4 列布局 -->
      <div class="categoryList">
        <div class="categoryHeader">
          <el-icon><FolderOpened /></el-icon>
          <span>分类列表</span>
          <span class="categoryCount">（共 {{ categories.length }} 个分类）</span>
        </div>
        
        <div class="categoryGrid">
          <div 
            v-for="category in categories" 
            :key="category.id"
            class="categoryItem"
          >
            <div class="categoryInfo">
              <el-icon><Folder /></el-icon>
              <span class="categoryName">{{ category.name }}</span>
            </div>
            <el-button
              type="danger"
              size="small"
              circle
              @click="handleDeleteCategory(category.id)"
            >
              <el-icon><Close /></el-icon>
            </el-button>
          </div>
        </div>
        
        <div v-if="categories.length === 0" class="emptyHint">
          暂无分类，请添加新分类
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useCategoryStore } from '../stores/category';
import { Close, Folder, FolderOpened, Plus } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

const categoryStore = useCategoryStore();
const newCategory = ref('');

// 组件挂载时加载分类数据
onMounted(async () => {
  await categoryStore.loadCategories();
});

// 所有分类
const categories = computed(() => {
  return categoryStore.categories;
});

// 添加分类
const handleAddCategory = async () => {
  if (!newCategory.value.trim()) {
    ElMessage.warning('请输入分类名称');
    return;
  }
  
  try {
    const response = await fetch('/api/categories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: newCategory.value.trim()
      })
    });
    
    if (!response.ok) {
      throw new Error('添加分类失败');
    }
    
    newCategory.value = '';
    await categoryStore.loadCategories();
    ElMessage.success('分类添加成功');
  } catch (error) {
    console.error('添加分类失败:', error);
    ElMessage.error('添加分类失败：' + error.message);
  }
};

// 删除分类
const handleDeleteCategory = async (categoryId) => {
  try {
    const response = await fetch('/api/categories/' + categoryId, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      throw new Error('删除分类失败');
    }
    
    await categoryStore.loadCategories();
    ElMessage.success('分类删除成功');
  } catch (error) {
    console.error('删除分类失败:', error);
    ElMessage.error('删除分类失败：' + error.message);
  }
};
</script>

<style scoped>
.categoryManagePage {
  min-height: 100vh;
  background-color: #f5f7fa;
}

.pageHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background-color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.pageSpacer {
  height: calc(1rem + 2rem + 4px);
}

.pageHeader h1 {
  margin: 0;
  font-size: 1.75rem;
  color: #303133;
  font-weight: 600;
}

.categoryContent {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.addCategoryForm {
  background-color: white;
  padding: 1.25rem 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 1.5rem;
  position: sticky;
  top: calc(3.5rem + 4px);
  z-index: 90;
}

.formTitle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  color: #303133;
  margin-bottom: 1rem;
}

.formTitle .el-icon {
  font-size: 1.2rem;
  color: #409EFF;
}

.formRow {
  display: flex;
  gap: 0.75rem;
}

.formRow .el-input {
  flex: 1;
}

.categoryList {
  background-color: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.categoryHeader {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.1rem;
  font-weight: 600;
  color: #303133;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid #e4e7ed;
}

.categoryHeader .el-icon {
  font-size: 1.3rem;
  color: #409EFF;
}

.categoryCount {
  font-size: 0.9rem;
  color: #909399;
  font-weight: normal;
}

.categoryGrid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
}

.categoryItem {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.875rem 1rem;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  transition: all 0.2s;
  background-color: #fafafa;
}

.categoryItem:hover {
  border-color: #409EFF;
  background-color: #f5f7fa;
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.15);
}

.categoryInfo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  min-width: 0;
}

.categoryInfo .el-icon {
  font-size: 1.1rem;
  color: #409EFF;
  flex-shrink: 0;
}

.categoryName {
  font-size: 0.95rem;
  color: #303133;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.emptyHint {
  text-align: center;
  padding: 3rem 1rem;
  color: #909399;
  font-size: 0.95rem;
}
</style>
