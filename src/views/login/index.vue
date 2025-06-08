<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <h1 class="login-title">versionManager</h1>
        <p class="login-subtitle">专业版本管理系统</p>
      </div>
      
      <el-form ref="loginFormRef" :model="loginForm" :rules="loginRules" class="login-form">
        <el-form-item prop="username">
          <el-input 
            v-model="loginForm.username" 
            placeholder="请输入用户名"
            prefix-icon="User"
            size="large"
          />
        </el-form-item>
        
        <el-form-item prop="password">
          <el-input 
            v-model="loginForm.password" 
            type="password" 
            placeholder="请输入密码"
            prefix-icon="Lock"
            show-password
            size="large"
          />
        </el-form-item>
        
        <div class="login-options">
          <el-checkbox v-model="loginForm.remember">记住我</el-checkbox>
          <el-link type="primary" :underline="false">忘记密码?</el-link>
        </div>
        
        <el-button type="primary" class="login-button" @click="handleLogin" :loading="loading" size="large">
          登录
        </el-button>
      </el-form>
      
      <div class="login-help">
        <p>需要帮助? <el-link type="primary">联系管理员</el-link></p>
      </div>
    </div>
    
    <div class="login-footer">
      <p>&copy; 2024 versionManager. 所有权利保留。</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { User, Lock } from '@element-plus/icons-vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import type { FormInstance } from 'element-plus';
import authApi from '@/api/auth';

const router = useRouter();
const loading = ref(false);
const loginForm = reactive({
  username: '',
  password: '',
  remember: false
});
const loginFormRef = ref<FormInstance>();

const loginRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' }
  ]
};

const handleLogin = async () => {
  if (!loginFormRef.value) return;
  
  await loginFormRef.value.validate(async (valid) => {
    if (!valid) {
      return;
    }
    
    loading.value = true;
    
    try {
      const response = await authApi.login({
        username: loginForm.username,
        password: loginForm.password
      });
      
      // 保存token到本地存储
      const token = response.data.token;
      localStorage.setItem('token', token);
      
      // 如果勾选了"记住我"，可以设置token的过期时间更长
      if (loginForm.remember) {
        // 这里可以设置一些额外的本地存储项，如用户信息等
        localStorage.setItem('remember', 'true');
      }
      
      ElMessage.success('登录成功');
      router.push('/');
    } catch (error: any) {
      console.error('登录失败:', error);
      if (error.response && error.response.data && error.response.data.message) {
        ElMessage.error(error.response.data.message);
      } else {
        ElMessage.error('登录失败，请检查用户名和密码');
      }
    } finally {
      loading.value = false;
    }
  });
};
</script>

<style scoped>
.login-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #1890ff 0%, #36cfc9 100%);
  padding: 20px;
}

.login-card {
  background-color: white;
  padding: 40px;
  border-radius: 8px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 420px;
  transition: all 0.3s;
}

.login-header {
  margin-bottom: 30px;
  text-align: center;
}

.login-title {
  color: #1890ff;
  font-size: 28px;
  font-weight: 600;
  margin-bottom: 8px;
}

.login-subtitle {
  color: rgba(0, 0, 0, 0.45);
  font-size: 16px;
}

.login-form {
  margin-bottom: 24px;
}

.login-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.login-button {
  width: 100%;
  height: 40px;
  font-size: 16px;
}

.login-help {
  text-align: center;
  margin-top: 24px;
  color: rgba(0, 0, 0, 0.45);
  font-size: 14px;
}

.login-footer {
  margin-top: 48px;
  text-align: center;
  color: rgba(255, 255, 255, 0.8);
  font-size: 12px;
}

@media (min-width: 992px) {
  .login-card {
    padding: 50px;
    max-width: 450px;
  }
}

@media (max-width: 576px) {
  .login-card {
    padding: 30px;
  }
}
</style>