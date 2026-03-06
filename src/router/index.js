import { createRouter, createWebHistory } from 'vue-router';
import PhotoGallery from '../components/PhotoGallery.vue';
import CategoryManage from '../views/CategoryManage.vue';

const routes = [
  {
    path: '/',
    name: 'Gallery',
    component: PhotoGallery
  },
  {
    path: '/categories',
    name: 'CategoryManage',
    component: CategoryManage
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
