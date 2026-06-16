<template>
  <div class="appShell">
    <AuthModal v-if="!isLoggedIn" @success="handleAuthSuccess" />
    <router-view v-else />
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useAuthStore } from './stores/auth';
import { usePhotoStore } from './stores/photo';
import { useCategoryStore } from './stores/category';
import AuthModal from './components/AuthModal.vue';

const authStore = useAuthStore();
const photoStore = usePhotoStore();
const categoryStore = useCategoryStore();

const isLoggedIn = computed(() => authStore.isLoggedIn);

const loadInitialData = async () => {
  await Promise.all([
    categoryStore.loadCategories(),
    photoStore.refreshPhotos(authStore.currentUser.id)
  ]);
};

onMounted(async () => {
  authStore.initializeFromStorage();

  if (isLoggedIn.value) {
    await loadInitialData();
  }
});

const handleAuthSuccess = async () => {
  await loadInitialData();
};
</script>

<style scoped>
.appShell {
  min-height: 100vh;
  background: transparent;
}
</style>
