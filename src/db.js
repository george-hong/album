const API_BASE_URL = '';

export const initDatabase = async () => {
  console.log('Database is ready');
};

export const getCategories = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/categories`);
    if (!response.ok) {
      throw new Error('Failed to load categories');
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to load categories:', error);
    return [
      { id: '1', name: '全部' },
      { id: '2', name: '风景' },
      { id: '3', name: '人物' },
      { id: '4', name: '动物' },
      { id: '5', name: '建筑' }
    ];
  }
};

export const addCategory = async (category) => {
  const response = await fetch(`${API_BASE_URL}/api/categories`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(category)
  });
  if (!response.ok) {
    throw new Error('Failed to add category');
  }
  return await response.json();
};

export const deleteCategory = async (categoryId) => {
  const response = await fetch(`${API_BASE_URL}/api/categories/${categoryId}`, {
    method: 'DELETE'
  });
  if (!response.ok) {
    throw new Error('Failed to delete category');
  }
  return await response.json();
};

export const updateCategory = async (categoryId, categoryData) => {
  const response = await fetch(`${API_BASE_URL}/api/categories/${categoryId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(categoryData)
  });
  if (!response.ok) {
    throw new Error('Failed to update category');
  }
  return await response.json();
};

export const getPhotos = async (userId, options = {}) => {
  try {
    const params = new URLSearchParams();
    params.set('page', String(options.page || 1));
    params.set('limit', String(options.limit || 24));

    if (options.search) {
      params.set('search', options.search);
    }
    if (options.filterMode) {
      params.set('filterMode', options.filterMode);
    }
    if (options.categories?.length) {
      params.set('categories', options.categories.join(','));
    }

    const response = await fetch(`${API_BASE_URL}/api/photos/${userId}?${params.toString()}`);
    if (!response.ok) {
      throw new Error('Failed to load photos');
    }

    const data = await response.json();
    if (Array.isArray(data)) {
      return {
        items: data,
        page: 1,
        limit: data.length,
        total: data.length,
        hasMore: false
      };
    }
    return data;
  } catch (error) {
    console.error('Failed to load photos:', error);
    return {
      items: [],
      page: 1,
      limit: options.limit || 24,
      total: 0,
      hasMore: false
    };
  }
};

export const addPhoto = async (formData) => {
  const response = await fetch(`${API_BASE_URL}/api/photos`, {
    method: 'POST',
    body: formData
  });
  if (!response.ok) {
    throw new Error('Failed to add photo');
  }
  return await response.json();
};

export const deletePhoto = async (photoId) => {
  const response = await fetch(`${API_BASE_URL}/api/photos/${photoId}`, {
    method: 'DELETE'
  });
  if (!response.ok) {
    throw new Error('Failed to delete photo');
  }
  return await response.json();
};

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
    console.error('Failed to validate user:', error);
    return null;
  }
};

export const registerUser = async (userData) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(userData)
  });
  if (!response.ok) {
    throw new Error('Failed to register user');
  }
  return await response.json();
};

export const closeDatabase = async () => {
  console.log('Database connection closed');
};
