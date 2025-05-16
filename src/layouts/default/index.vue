<template>
  <div class="app-container">
    <!-- 侧边栏 -->
    <div class="sidebar">
      <div class="sidebar-logo">
        <h1 class="logo-text">versionManager</h1>
      </div>
      <div class="sidebar-menu">
        <router-link to="/products" class="sidebar-item" active-class="active">
          <el-icon><Document /></el-icon>
          <span>产品列表</span>
        </router-link>
        <router-link to="/permissions" class="sidebar-item" active-class="active">
          <el-icon><Lock /></el-icon>
          <span>权限管理</span>
        </router-link>
        <router-link to="/logs" class="sidebar-item" active-class="active">
          <el-icon><List /></el-icon>
          <span>操作日志</span>
        </router-link>
        <router-link to="/analysis" class="sidebar-item" active-class="active">
          <el-icon><DataAnalysis /></el-icon>
          <span>数据分析</span>
        </router-link>
      </div>
    </div>

    <!-- 主内容区 -->
    <div class="main-content">
      <!-- 顶部导航栏 -->
      <div class="header">
        <div class="breadcrumb">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item v-if="$route.meta.title">{{ $route.meta.title }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="user-info">
          <el-dropdown>
            <span class="user-dropdown-link">
              管理员 <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item>个人信息</el-dropdown-item>
                <el-dropdown-item>修改密码</el-dropdown-item>
                <el-dropdown-item divided @click="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>

      <!-- 页面内容 -->
      <div class="content">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Document, Lock, List, DataAnalysis, ArrowDown } from '@element-plus/icons-vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const logout = () => {
  localStorage.removeItem('token');
  router.push('/login');
};
</script>

<style scoped>
.app-container {
  display: flex;
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

.sidebar {
  background-color: var(--sidebar-bg);
  color: rgba(255, 255, 255, 0.65);
  width: var(--sidebar-width);
  height: 100%;
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  z-index: 1000;
  transition: all 0.3s;
  box-shadow: 2px 0 8px 0 rgba(29, 35, 41, 0.05);
}

.sidebar-logo {
  height: 64px;
  padding: 0 24px;
  display: flex;
  align-items: center;
  background-color: var(--sidebar-logo-bg);
}

.logo-text {
  color: white;
  font-size: 18px;
  font-weight: 600;
  white-space: nowrap;
  margin: 0;
}

.sidebar-menu {
  padding: 16px 0;
}

.sidebar-item {
  padding: 0 24px;
  height: 40px;
  display: flex;
  align-items: center;
  transition: all 0.3s;
  color: rgba(255, 255, 255, 0.65);
  text-decoration: none;
  font-size: 14px;
  margin-bottom: 4px;
}

.sidebar-item:hover, .sidebar-item.active {
  background-color: var(--primary-color);
  color: white;
}

.sidebar-item .el-icon {
  margin-right: 10px;
  font-size: 16px;
}

.main-content {
  margin-left: var(--sidebar-width);
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-x: auto;
  height: 100vh;
  width: calc(100% - var(--sidebar-width));
}

.header {
  background-color: white;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  position: sticky;
  top: 0;
  z-index: 99;
  width: 100%;
}

.content {
  padding: 20px;
  background-color: var(--background-color-light);
  flex: 1;
  overflow: auto;
  min-height: calc(100vh - 64px);
  width: 100%;
}

.user-dropdown-link {
  display: flex;
  align-items: center;
  cursor: pointer;
  color: rgba(0, 0, 0, 0.65);
  transition: color 0.3s;
  padding: 8px;
}

.user-dropdown-link:hover {
  color: var(--primary-color);
}

.user-dropdown-link .el-icon {
  margin-left: 8px;
}

@media (max-width: 768px) {
  .sidebar {
    width: 80px;
  }
  
  .sidebar-item span {
    display: none;
  }
  
  .sidebar-logo h1 {
    display: none;
  }
  
  .main-content {
    margin-left: 80px;
    width: calc(100% - 80px);
  }
  
  :root {
    --sidebar-width: 80px;
  }
}
</style>