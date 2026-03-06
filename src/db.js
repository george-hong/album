// 使用API与后端通信
const API_BASE_URL = '';

// 初始化数据库
export const initDatabase = async () => {
  try {
    // 后端会自动初始化数据库
    console.log('数据库初始化成功');
  } catch (error) {
    console.error('数据库初始化失败:', error);
    throw error;
  }
};

// 获取分类失败
export const getCategories = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/categories`);
    if (!response.ok) {
      throw new Error('获取分类失败');
    }
    return await response.json();
  } catch (error) {
    console.error('获取分类失败:', error);
    // 返回默认分类数据
    return [
      { id: '1', name: '全部' },
      { id: '2', name: '风景' },
      { id: '3', name: '人物' },
      { id: '4', name: '动物' },
      { id: '5', name: '建筑' },
    ];
  }
};

// 添加分类
export const addCategory = async (category) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(category)
    });
    if (!response.ok) {
      throw new Error('添加分类失败');
    }
    return await response.json();
  } catch (error) {
    console.error('添加分类失败:', error);
    throw error;
  }
};

// 删除分类
export const deleteCategory = async (categoryId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/categories/${categoryId}`, {
      method: 'DELETE'
    });
    if (!response.ok) {
      throw new Error('删除分类失败');
    }
    return await response.json();
  } catch (error) {
    console.error('删除分类失败:', error);
    throw error;
  }
};

// 更新分类
export const updateCategory = async (categoryId, categoryData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/categories/${categoryId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(categoryData)
    });
    if (!response.ok) {
      throw new Error('更新分类失败');
    }
    return await response.json();
  } catch (error) {
    console.error('更新分类失败:', error);
    throw error;
  }
};

// 获取用户的图片
export const getPhotos = async (userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/photos/${userId}`);
    if (!response.ok) {
      throw new Error('获取图片失败');
    }
    return await response.json();
  } catch (error) {
    console.error('获取图片失败:', error);
    return [];
  }
};

// 添加图片
export const addPhoto = async (formData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/photos`, {
      method: 'POST',
      body: formData
    });
    if (!response.ok) {
      throw new Error('添加图片失败');
    }
    return await response.json();
  } catch (error) {
    console.error('添加图片失败:', error);
    throw error;
  }
};

// 删除图片
export const deletePhoto = async (photoId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/photos/${photoId}`, {
      method: 'DELETE'
    });
    if (!response.ok) {
      throw new Error('删除图片失败');
    }
    return await response.json();
  } catch (error) {
    console.error('删除图片失败:', error);
    throw error;
  }
};

// 验证用户
export const validateUser = async (username, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });
    if (!response.ok) {
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error('验证用户失败:', error);
    return null;
  }
};

// 注册用户
export const registerUser = async (userData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });
    if (!response.ok) {
      throw new Error('注册用户失败');
    }
    return await response.json();
  } catch (error) {
    console.error('注册用户失败:', error);
    throw error;
  }
};

// 关闭数据库连接
export const closeDatabase = async () => {
  // API不需要关闭连接
  console.log('数据库连接已关闭');
};