<template>
  <div class="page-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2 class="page-title">数据分析</h2>
    </div>

    <!-- 分析内容 -->
    <div class="data-card">
      <div class="empty-content">
        <el-empty description="数据分析功能正在开发中，敬请期待..."></el-empty>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

onMounted(() => {
  // 初始化数据或加载分析数据
  console.log('数据分析页面已加载');
});
</script>

<style scoped>
.page-container {
  width: 100%;
  background-color: var(--background-color-light);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--heading-color);
  margin: 0;
}

.data-card {
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  padding: 20px;
  width: 100%;
}

.empty-content {
  min-height: 400px;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>