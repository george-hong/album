<template>
  <main class="authPage">
    <section class="authHero" aria-label="相册登录">
      <div class="heroMedia">
        <div class="heroPhoto heroPhotoLarge"></div>
        <div class="heroPhoto heroPhotoTall"></div>
        <div class="heroPhoto heroPhotoSmall"></div>
      </div>
      <div class="heroCopy">
        <p class="eyebrow">私人影像空间</p>
        <h1>把照片整理成一个顺手、好看的私人影像库</h1>
        <p>登录后可上传、分类、筛选和浏览照片，首页会以瀑布流渐进加载。</p>
      </div>
    </section>

    <section class="authPanel" aria-label="账户表单">
      <div class="panelHeader">
        <div class="brandMark">相</div>
        <div>
          <h2>{{ isRegistering ? '创建账户' : '欢迎回来' }}</h2>
          <p>{{ isRegistering ? '注册后即可管理你的照片。' : '登录继续整理你的照片。' }}</p>
        </div>
      </div>

      <el-form class="authForm" label-position="top" @submit.prevent="handleSubmit">
        <el-form-item label="用户名" required>
          <el-input
            v-model="formData.username"
            size="large"
            name="username"
            placeholder="请输入用户名"
            autocomplete="username"
          />
        </el-form-item>

        <el-form-item label="密码" required>
          <el-input
            v-model="formData.password"
            size="large"
            type="password"
            name="password"
            placeholder="请输入密码"
            :autocomplete="isRegistering ? 'new-password' : 'current-password'"
            show-password
          />
        </el-form-item>

        <el-alert
          v-if="errorMessage"
          :title="errorMessage"
          :type="messageType"
          show-icon
          :closable="false"
        />

        <el-button
          class="submitButton"
          type="primary"
          size="large"
          native-type="submit"
          :loading="isSubmitting"
        >
          {{ isRegistering ? '注册' : '登录' }}
        </el-button>
      </el-form>

      <div class="authSwitch">
        <span>{{ isRegistering ? '已有账号？' : '还没有账号？' }}</span>
        <el-button type="primary" link @click="toggleMode">
          {{ isRegistering ? '去登录' : '去注册' }}
        </el-button>
      </div>
    </section>
  </main>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useAuthStore } from '../stores/auth';

const emit = defineEmits(['success']);
const authStore = useAuthStore();

const isRegistering = ref(false);
const isSubmitting = ref(false);
const messageType = ref('error');
const formData = ref({
  username: '',
  password: ''
});
const errorMessage = ref('');

const toggleMode = () => {
  isRegistering.value = !isRegistering.value;
  messageType.value = 'error';
  errorMessage.value = '';
};

const canSubmit = computed(() => formData.value.username.trim() && formData.value.password.trim());

const handleSubmit = async () => {
  if (!canSubmit.value) {
    messageType.value = 'warning';
    errorMessage.value = '请填写用户名和密码';
    return;
  }

  isSubmitting.value = true;
  messageType.value = 'error';
  errorMessage.value = '';

  try {
    if (isRegistering.value) {
      await authStore.register(formData.value);
      isRegistering.value = false;
      formData.value.password = '';
      messageType.value = 'success';
      errorMessage.value = '注册成功，请登录';
    } else {
      await authStore.login(formData.value);
      emit('success');
    }
  } catch (error) {
    errorMessage.value = error.message || '操作失败，请重试';
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<style scoped>
.authPage {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(22rem, 28rem);
  gap: clamp(1.25rem, 4vw, 4rem);
  min-height: 100vh;
  padding: clamp(1rem, 3vw, 2.5rem);
  color: var(--text-strong);
  background:
    linear-gradient(135deg, rgba(237, 147, 99, 0.12), transparent 32%),
    linear-gradient(225deg, rgba(100, 208, 173, 0.12), transparent 36%),
    var(--surface-canvas);
}

.authHero {
  position: relative;
  display: grid;
  min-height: calc(100vh - clamp(2rem, 6vw, 5rem));
  align-content: end;
  overflow: hidden;
  border-radius: 8px;
  background: #221f1a;
  box-shadow: var(--shadow-lg);
}

.heroMedia {
  position: absolute;
  inset: 0;
}

.heroMedia::after {
  position: absolute;
  inset: 0;
  content: "";
  background: linear-gradient(180deg, rgba(18, 16, 14, 0.04), rgba(18, 16, 14, 0.76));
}

.heroPhoto {
  position: absolute;
  border-radius: 8px;
  background-size: cover;
  background-position: center;
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.28);
}

.heroPhotoLarge {
  inset: 5% 23% 15% 5%;
  background-image:
    linear-gradient(140deg, rgba(28, 84, 73, 0.18), rgba(0, 0, 0, 0.08)),
    url("https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=80");
}

.heroPhotoTall {
  top: 14%;
  right: 6%;
  width: 27%;
  height: 56%;
  background-image:
    linear-gradient(140deg, rgba(214, 116, 68, 0.18), rgba(0, 0, 0, 0.04)),
    url("https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=900&q=80");
}

.heroPhotoSmall {
  right: 14%;
  bottom: 8%;
  width: 32%;
  height: 25%;
  background-image:
    linear-gradient(140deg, rgba(250, 196, 115, 0.18), rgba(0, 0, 0, 0.04)),
    url("https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=900&q=80");
}

.heroCopy {
  position: relative;
  z-index: 1;
  max-width: 46rem;
  padding: clamp(1.25rem, 5vw, 3.5rem);
  color: #fffaf1;
}

.eyebrow {
  margin: 0 0 0.85rem;
  color: rgba(255, 250, 241, 0.72);
  font-size: 0.78rem;
  font-weight: 750;
  letter-spacing: 0.14em;
}

.heroCopy h1 {
  max-width: 15ch;
  margin: 0;
  font-size: clamp(2.4rem, 6vw, 5.8rem);
  line-height: 0.96;
  letter-spacing: 0;
}

.heroCopy p:last-child {
  max-width: 34rem;
  margin: 1.1rem 0 0;
  color: rgba(255, 250, 241, 0.78);
  font-size: 1rem;
}

.authPanel {
  align-self: center;
  padding: clamp(1.25rem, 3vw, 2rem);
  border: 1px solid var(--line);
  border-radius: 8px;
  background: rgba(26, 39, 35, 0.92);
  box-shadow: var(--shadow-md);
  backdrop-filter: blur(18px);
}

.panelHeader {
  display: flex;
  gap: 0.9rem;
  align-items: center;
  margin-bottom: 1.5rem;
}

.brandMark {
  display: grid;
  width: 2.75rem;
  height: 2.75rem;
  place-items: center;
  border-radius: 8px;
  color: var(--accent-ink);
  font-size: 1.15rem;
  font-weight: 850;
  background: var(--accent);
}

.panelHeader h2 {
  margin: 0;
  font-size: 1.45rem;
  letter-spacing: 0;
}

.panelHeader p {
  margin: 0.2rem 0 0;
  color: var(--text-muted);
}

.authForm {
  display: grid;
  gap: 0.2rem;
}

.submitButton {
  width: 100%;
  margin-top: 0.35rem;
}

.authSwitch {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.25rem;
  margin-top: 1rem;
  color: var(--text-muted);
  font-size: 0.92rem;
}

@media (max-width: 860px) {
  .authPage {
    grid-template-columns: 1fr;
  }

  .authHero {
    min-height: 42vh;
  }

  .authPanel {
    align-self: start;
  }
}

@media (max-width: 560px) {
  .authPage {
    padding: 0;
    background: var(--surface-canvas);
  }

  .authHero {
    min-height: 36vh;
    border-radius: 0;
  }

  .heroPhotoLarge {
    inset: 0;
  }

  .heroPhotoTall,
  .heroPhotoSmall {
    display: none;
  }

  .heroCopy {
    padding: 1.25rem;
  }

  .heroCopy h1 {
    max-width: 13ch;
    font-size: 2.35rem;
  }

  .authPanel {
    margin: -1rem 0.75rem 1rem;
  }
}
</style>
