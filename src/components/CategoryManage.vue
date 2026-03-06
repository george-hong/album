<template>
  <div v-if="isOpen" class="categoryModal">
    <div class="categoryModalContent">
      <div class="categoryModalHeader">
        <h2>分类管理</h2>
        <button class="closeButton" @click="close">&times;</button>
      </div>
      
      <div class="categoryForm">
        <div class="formGroup">
          <label class="label">添加新分类</label>
          <div class="formRow">
            <el-input
              v-model="newCategory"
              placeholder="请输入分类名称"
              style="flex: 1; margin-right: 0.75rem;"
            />
            <el-select
              v-model="selectedParentId"
              placeholder="选择父分类"
              clearable
              style="width: 150px; margin-right: 0.75rem;"
            >
              <el-option label="一级分类" value="null" />
              <el-option
                v-for="category in selectableCategories"
                :key="category.id"
                :label="category.name"
                :value="category.id"
              />
            </el-select>
            <el-button 
              type="primary"
              @click="handleAddCategory"
              :disabled="!newCategory.trim()"
            >
              添加
            </el-button>
          </div>
        </div>
      </div>
      
      <div class="categoryList">
        <h3>分类列表</h3>
        <div class="categoryDragContainer">
          <p class="dragHint">💡 提示：拖拽二级分类标签到目标一级分类区域</p>
          
          <!-- 一级分类列表 -->
          <div 
            v-for="level1Cat in level1Categories" 
            :key="level1Cat.id"
            class="level1Category"
            :class="{ 'drag-over': dragOverCategory === level1Cat.id }"
            @dragover.prevent="handleDragOver(level1Cat.id)"
            @dragleave="handleDragLeave"
            @drop="handleDrop(level1Cat.id)"
          >
            <div class="level1CategoryHeader">
              <el-icon style="margin-right: 6px; font-size: 16px;"><FolderOpened /></el-icon>
              <span class="level1CategoryName">{{ level1Cat.name }}</span>
              <span class="level1CategoryCount">({{ getSubCategoryCount(level1Cat.id) }})</span>
            </div>
            
            <!-- 二级分类拖拽区域 -->
            <div class="subCategoryDropZone">
              <el-tag
                v-for="subCat in getSubCategories(level1Cat.id)"
                :key="subCat.id"
                draggable="true"
                @dragstart="handleDragStart($event, subCat)"
                class="draggableTag"
                closable
                @close="handleDeleteCategory(subCat.id)"
              >
                {{ subCat.name }}
              </el-tag>
              <div v-if="getSubCategories(level1Cat.id).length === 0" class="emptySubZone">
                拖拽分类到这里
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useCategoryStore } from '../stores/category';
import { Delete, Folder, FolderOpened } from '@element-plus/icons-vue';
import { ElIcon } from 'element-plus';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close']);

const categoryStore = useCategoryStore();
const newCategory = ref('');
const selectedParentId = ref('null');
const dragOverCategory = ref(null);
const draggedCategory = ref(null);

// 监听isOpen变化，当弹窗打开时加载分类数据
watch(() => props.isOpen, async (isOpen) => {
  if (isOpen) {
    await categoryStore.loadCategories();
  }
});

// 组件挂载时加载分类数据
onMounted(async () => {
  await categoryStore.loadCategories();
});

// 一级分类
const level1Categories = computed(() => {
  return categoryStore.categories.filter(category => category.parentId === null);
});

// 可选择的父分类（一级分类和二级分类，但不包括"全部"）
const selectableCategories = computed(() => {
  return categoryStore.categories.filter(category => 
    category.parentId === null && category.id !== '1'
  );
});

// 获取指定一级分类下的二级分类
const getSubCategories = (parentId) => {
  return categoryStore.categories.filter(cat => cat.parentId === parentId);
};

// 获取指定一级分类下的二级分类数量
const getSubCategoryCount = (parentId) => {
  return getSubCategories(parentId).length;
};

// 拖拽开始事件
const handleDragStart = (event, category) => {
  draggedCategory.value = category;
  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setData('text/plain', JSON.stringify(category));
};

// 拖拽经过事件
const handleDragOver = (categoryId) => {
  dragOverCategory.value = categoryId;
};

// 拖拽离开事件
const handleDragLeave = () => {
  dragOverCategory.value = null;
};

// 拖拽放置事件
const handleDrop = async (targetParentId) => {
  dragOverCategory.value = null;
  
  if (!draggedCategory.value) return;
  
  const category = draggedCategory.value;
  
  // 不能拖拽到自己
  if (category.id === targetParentId) return;
  
  // 如果父分类没有改变，不执行操作
  if (category.parentId === targetParentId) {
    draggedCategory.value = null;
    return;
  }
  
  try {
    // 使用 store 的 updateCategory 方法
    await categoryStore.updateCategory(category.id, {
      parentId: targetParentId
    });
    draggedCategory.value = null;
  } catch (error) {
    console.error('移动分类失败:', error);
  }
};

// 分类树数据
const categoryTreeData = computed(() => {
  const buildTree = (items, parentId = null) => {
    return items
      .filter(item => item.parentId === parentId)
      .map(item => ({
        ...item,
        label: item.name,
        children: buildTree(items, item.id)
      }));
  };
  return buildTree(categoryStore.categories);
});

// 树节点属性
const treeProps = {
  children: 'children',
  label: 'label'
};

const close = () => {
  emit('close');
  newCategory.value = '';
  selectedParentId.value = 'null';
};

const handleAddCategory = async () => {
  if (newCategory.value.trim()) {
    try {
      await categoryStore.addCategory({
        name: newCategory.value.trim(),
        parentId: selectedParentId.value === 'null' ? null : selectedParentId.value
      });
      newCategory.value = '';
      selectedParentId.value = 'null';
    } catch (error) {
      console.error('添加分类失败:', error);
    }
  }
};

const handleDeleteCategory = async (categoryId) => {
  if (confirm('确定要删除这个分类吗？')) {
    try {
      await categoryStore.deleteCategory(categoryId);
    } catch (error) {
      console.error('删除分类失败:', error);
    }
  }
};
</script>

<style scoped>
.categoryModal {
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

.categoryModalContent {
  background-color: white;
  border-radius: 8px;
  padding: 2rem;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  max-height: 90vh;
  overflow-y: auto;
}

.categoryModalHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.categoryModalHeader h2 {
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

.categoryForm {
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #eee;
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

.formRow {
  display: flex;
  gap: 0.75rem;
}

.input {
  flex: 1;
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

.addButton {
  padding: 0.75rem 1.5rem;
  background-color: #0070f3;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s;
  white-space: nowrap;
}

.addButton:hover {
  background-color: #0050c3;
}

.addButton:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.categoryList {
  margin-top: 1rem;
}

.categoryList h3 {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  color: #333;
}

.categoryItems {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.categoryItem {
  display: flex;
  flex-direction: column;
  padding: 1rem;
  background-color: #f9f9f9;
  border-radius: 4px;
  border: 1px solid #eee;
  margin-bottom: 1rem;
  transition: all 0.3s ease;
}

.categoryItemHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.subCategories {
  margin-left: 1rem;
  display: flex;
  flex-wrap: wrap;
}

.categoryName {
  font-size: 1rem;
  font-weight: 500;
  color: #333;
}

.deleteButton {
  padding: 0.5rem 1rem;
  background-color: #ff4757;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: background-color 0.3s;
}

.deleteButton:hover {
  background-color: #ff3742;
}

.drag-over {
  border: 2px dashed #0070f3;
  background-color: #f0f7ff;
  transition: all 0.3s ease;
}

/* 树节点样式 */
.categoryTree {
  margin-top: 1rem;
  max-height: 400px;
  overflow-y: auto;
}

/* 拖拽容器样式 */
.categoryDragContainer {
  margin-top: 1rem;
}

.dragHint {
  margin-bottom: 1rem;
  padding: 0.75rem;
  background-color: #f0f7ff;
  border-radius: 4px;
  color: #606266;
  font-size: 0.9rem;
}

.level1Category {
  margin-bottom: 1rem;
  border: 2px solid #e4e7ed;
  border-radius: 8px;
  padding: 1rem;
  background-color: #fafafa;
  transition: all 0.3s ease;
}

.level1Category.drag-over {
  border-color: #0070f3;
  background-color: #f0f7ff;
  transform: scale(1.02);
}

.level1CategoryHeader {
  display: flex;
  align-items: center;
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e4e7ed;
}

.level1CategoryName {
  font-size: 1rem;
  font-weight: 600;
  color: #303133;
}

.level1CategoryCount {
  margin-left: 0.5rem;
  font-size: 0.85rem;
  color: #909399;
}

.subCategoryDropZone {
  min-height: 60px;
  padding: 0.75rem;
  background-color: white;
  border-radius: 4px;
  border: 1px dashed #dcdfe6;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

.emptySubZone {
  width: 100%;
  text-align: center;
  color: #c0c4cc;
  font-size: 0.85rem;
  padding: 0.5rem;
}

.draggableTag {
  cursor: move;
  user-select: none;
  transition: all 0.2s;
}

.draggableTag:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.draggableTag:active {
  cursor: grabbing;
}
</style>