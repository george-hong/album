import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { validateUser, registerUser } from '../db';

export const useAuthStore = defineStore('auth', () => {
  const isLoggedIn = ref(false);
  const currentUser = ref({ id: '', username: '' });
  
  const isAuthenticated = computed(() => isLoggedIn.value && currentUser.value.id);
  
  async function login(credentials) {
    const user = await validateUser(credentials.username, credentials.password);
    if (user) {
      isLoggedIn.value = true;
      currentUser.value = user;
      localStorage.setItem('currentUser', JSON.stringify(user));
    } else {
      throw new Error('用户名或密码错误');
    }
  }
  
  async function register(userData) {
    // 确保传递的数据格式正确，避免 undefined 值
    const { username, password } = userData;
    await registerUser({ username: username || '', password: password || '' });
  }
  
  function logout() {
    isLoggedIn.value = false;
    currentUser.value = { id: '', username: '' };
    localStorage.removeItem('currentUser');
  }
  
  function initializeFromStorage() {
    const stored = localStorage.getItem('currentUser');
    if (stored) {
      try {
        currentUser.value = JSON.parse(stored);
        isLoggedIn.value = true;
      } catch (e) {
        localStorage.removeItem('currentUser');
      }
    }
  }
  
  return {
    isLoggedIn,
    currentUser,
    isAuthenticated,
    login,
    register,
    logout,
    initializeFromStorage
  };
});