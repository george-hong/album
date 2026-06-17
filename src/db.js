const API_BASE_URL = '';

const normalizeCategory = (category) => {
  if (!category || category.id == null || typeof category.name !== 'string') {
    return null;
  }

  return {
    id: String(category.id),
    name: category.name
  };
};

const normalizeDimension = (value) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : null;
};

const normalizePhoto = (photo) => ({
  ...photo,
  id: String(photo.id),
  width: normalizeDimension(photo.width),
  height: normalizeDimension(photo.height),
  categories: Array.isArray(photo.categories)
    ? photo.categories
      .map(category => {
        if (category && typeof category === 'object' && category.id != null) {
          return {
            id: String(category.id),
            name: typeof category.name === 'string' ? category.name : ''
          };
        }
        return category == null ? null : { id: String(category), name: '' };
      })
      .filter(Boolean)
    : []
});

export const initDatabase = async () => {
  console.log('Database is ready');
};

export const getCategories = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/categories`);
    if (!response.ok) {
      throw new Error('Failed to load categories');
    }
    const data = await response.json();
    const items = Array.isArray(data) ? data : data.items ?? data.data ?? [];
    return items.map(normalizeCategory).filter(Boolean);
  } catch (error) {
    console.error('Failed to load categories:', error);
    throw error;
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
    throw new Error('照片加载失败，请稍后重试');
  }

  const data = await response.json();
  if (Array.isArray(data)) {
    return {
      items: data.map(normalizePhoto),
      page: 1,
      limit: data.length,
      total: data.length,
      hasMore: false
    };
  }
  return {
    ...data,
    items: Array.isArray(data.items) ? data.items.map(normalizePhoto) : []
  };
};

export const addPhoto = async (formData) => {
  const response = await fetch(`${API_BASE_URL}/api/photos`, {
    method: 'POST',
    body: formData
  });
  if (!response.ok) {
    throw new Error('Failed to add photo');
  }
  const data = await response.json();
  return Array.isArray(data) ? data.map(normalizePhoto) : normalizePhoto(data);
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

export const updatePhoto = async (photoId, photoData) => {
  const response = await fetch(`${API_BASE_URL}/api/photos/${photoId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(photoData)
  });
  if (!response.ok) {
    throw new Error('Failed to update photo');
  }
  return normalizePhoto(await response.json());
};

export const updatePhotos = async (photoIds, photoData) => {
  const response = await fetch(`${API_BASE_URL}/api/photos/batch`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      photoIds,
      ...photoData
    })
  });
  if (!response.ok) {
    throw new Error('Failed to update photos');
  }
  const data = await response.json();
  const items = Array.isArray(data) ? data : data.items ?? [];
  return items.map(normalizePhoto);
};

export const syncPhotoDimensions = async (userId, options = {}) => {
  const response = await fetch(`${API_BASE_URL}/api/photos/dimensions/sync`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      user_id: userId,
      force: options.force === true
    })
  });
  if (!response.ok) {
    throw new Error('Failed to sync photo dimensions');
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
