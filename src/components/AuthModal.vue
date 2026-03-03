<template>
  <div class="authModal">
    <div class="authModalContent">
      <div class="authModalHeader">
        <h2>{{ isRegistering ? '注册' : '登录' }}</h2>
      </div>
      <form @submit.prevent="handleSubmit" class="authForm">
        <div class="formGroup">
          <label for="username" class="label">用户名</label>
          <input
            type="text"
            id="username"
            v-model="formData.username"
            class="input"
            placeholder="请输入用户名"
            required
          />
        </div>
        <div class="formGroup">
          <label for="password" class="label">密码</label>
          <input
            type="password"
            id="password"
            v-model="formData.password"
            class="input"
            placeholder="请输入密码"
            required
          />
        </div>
        <div class="formActions">
          <button type="submit" class="submitButton">
            {{ isRegistering ? '注册' : '登录' }}
          </button>
        </div>
        <div class="authSwitch">
          {{ isRegistering ? '已有账号？' : '没有账号？' }}
          <button type="button" class="switchButton" @click="toggleMode">
            {{ isRegistering ? '去登录' : '去注册' }}
          </button>
        </div>
        <div v-if="errorMessage" class="errorMessage">
          {{ errorMessage }}
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useAuthStore } from '../stores/auth';

const emit = defineEmits(['success']);
const authStore = useAuthStore();

const isRegistering = ref(false);
const formData = ref({
  username: '',
  password: ''
});
const errorMessage = ref('');

const toggleMode = () => {
  isRegistering.value = !isRegistering.value;
  errorMessage.value = '';
};

const handleSubmit = async () => {
  try {
    if (isRegistering.value) {
      await authStore.register(formData.value);
      isRegistering.value = false;
      errorMessage.value = '注册成功，请登录';
    } else {
      await authStore.login(formData.value);
      emit('success');
    }
  } catch (error) {
    errorMessage.value = error.message || '操作失败，请重试';
  }
};
</script>

<style scoped>
.authModal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 300;
}

.authModalContent {
  background-color: white;
  border-radius: 8px;
  padding: 2rem;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.authModalHeader {
  margin-bottom: 1.5rem;
  text-align: center;
}

.authModalHeader h2 {
  margin: 0;
  font-size: 1.25rem;
  color: #333;
}

.authForm {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
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

.input {
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

.formActions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1rem;
}

.submitButton {
  padding: 0.75rem 1.5rem;
  background-color: #0070f3;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s;
  flex: 1;
}

.submitButton:hover {
  background-color: #0050c3;
}

.authSwitch {
  text-align: center;
  margin-top: 1rem;
  font-size: 0.9rem;
  color: #666;
}

.switchButton {
  background: none;
  border: none;
  color: #0070f3;
  cursor: pointer;
  font-size: 0.9rem;
  padding: 0;
  margin-left: 0.5rem;
}

.switchButton:hover {
  text-decoration: underline;
}

.errorMessage {
  background-color: #ffebee;
  color: #c62828;
  padding: 0.75rem;
  border-radius: 4px;
  margin-top: 1rem;
  font-size: 0.9rem;
}
</style>