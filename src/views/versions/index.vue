<template>
  <div class="version-list">
    <!-- 面包屑导航 -->
    <div class="breadcrumb mb-4">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: '/products' }">产品列表</el-breadcrumb-item>
        <el-breadcrumb-item :to="{ path: `/products/${productId}` }">产品详情</el-breadcrumb-item>
        <el-breadcrumb-item>版本列表</el-breadcrumb-item>
      </el-breadcrumb>
    </div>

    <div class="mb-6 flex justify-between items-center">
      <h1 class="text-xl font-semibold">版本列表</h1>
      <el-button type="primary" @click="handleCreateVersion">
        <el-icon><Plus /></el-icon> 创建版本
      </el-button>
    </div>

    <!-- 搜索和筛选 -->
    <el-card class="mb-4">
      <div class="search-bar">
        <el-form :inline="true" :model="searchForm">
          <el-form-item label="版本号">
            <el-input v-model="searchForm.version" placeholder="请输入版本号" clearable />
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
              <el-option label="开发中" value="developing" />
              <el-option label="测试中" value="testing" />
              <el-option label="已发布" value="released" />
              <el-option label="已废弃" value="deprecated" />
            </el-select>
          </el-form-item>
          <el-form-item label="锁定状态">
            <el-select v-model="searchForm.locked" placeholder="请选择锁定状态" clearable>
              <el-option label="已锁定" :value="true" />
              <el-option label="未锁定" :value="false" />
            </el-select>
          </el-form-item>
          <el-form-item label="创建时间">
            <el-select v-model="searchForm.timeOrder" placeholder="请选择时间排序" clearable>
              <el-option label="最新创建" value="newest" />
              <el-option label="最早创建" value="oldest" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">
              <el-icon><Search /></el-icon> 搜索
            </el-button>
            <el-button @click="resetSearch">
              <el-icon><Refresh /></el-icon> 重置
            </el-button>
          </el-form-item>
        </el-form>
      </div>
    </el-card>

    <!-- 版本列表 -->
    <el-card>
      <el-table
        v-loading="loading"
        :data="versionList"
        style="width: 100%"
        border
      >
        <el-table-column prop="version" label="版本号" width="120">
          <template #default="scope">
            <el-link type="primary" @click="viewVersionDetail(scope.row.id)">
              {{ scope.row.version }}
            </el-link>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="版本名称" width="150" />
        <el-table-column prop="description" label="描述" show-overflow-tooltip />
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="锁定状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.locked ? 'danger' : 'success'" effect="plain">
              {{ scope.row.locked ? '已锁定' : '未锁定' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button link type="primary" @click="viewVersionDetail(scope.row.id)">
              详情
            </el-button>
            <el-button link type="primary" @click="handleEdit(scope.row)" :disabled="scope.row.locked">
              编辑
            </el-button>
            <el-button 
              link 
              :type="scope.row.locked ? 'success' : 'danger'" 
              @click="scope.row.locked ? handleUnlock(scope.row) : handleLock(scope.row)"
            >
              {{ scope.row.locked ? '解锁' : '锁定' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Search, Refresh } from '@element-plus/icons-vue';

const route = useRoute();
const router = useRouter();

// 产品ID（从路由参数获取）
const productId = route.params.productId as string || 'PRD-001';

// 搜索表单
const searchForm = reactive({
  version: '',
  status: '',
  locked: null as boolean | null,
  timeOrder: ''
});

// 分页相关
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);
const loading = ref(false);

// 版本列表（模拟数据）
const versionList = ref([
  {
    id: 'V001',
    productId: 'PRD-001',
    version: '1.0.0',
    name: '初始版本',
    description: '初始版本，包含基础功能模块',
    createTime: '2024-01-10 10:00:00',
    updateTime: '2024-01-10 10:00:00',
    status: 'released',
    locked: true,
    releaseDate: '2024-01-15',
    releaseType: 'feature',
    creator: '张三'
  },
  {
    id: 'V002',
    productId: 'PRD-001',
    version: '1.1.0',
    name: '功能更新版本',
    description: '新增数据导出功能，修复已知问题',
    createTime: '2024-01-15 14:30:00',
    updateTime: '2024-01-15 14:30:00',
    status: 'testing',
    locked: false,
    releaseDate: '2024-01-25',
    releaseType: 'feature',
    creator: '李四'
  },
  {
    id: 'V003',
    productId: 'PRD-001',
    version: '1.2.0-beta',
    name: '测试版本',
    description: '重构用户界面，优化性能',
    createTime: '2024-01-20 09:15:00',
    updateTime: '2024-01-20 09:15:00',
    status: 'developing',
    locked: false,
    releaseDate: '2024-02-10',
    releaseType: 'feature',
    creator: '王五'
  }
]);

// 获取状态标签类型
const getStatusType = (status: string) => {
  const statusMap: Record<string, string> = {
    developing: 'info',
    testing: 'warning',
    released: 'success',
    deprecated: 'danger'
  };
  return statusMap[status] || 'default';
};

// 获取状态文本
const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    developing: '开发中',
    testing: '测试中',
    released: '已发布',
    deprecated: '已废弃'
  };
  return statusMap[status] || '未知';
};

// 加载版本列表
const loadVersionList = () => {
  loading.value = true;
  // 模拟API请求
  setTimeout(() => {
    // 实际项目中应该调用API获取数据
    // 这里使用模拟数据
    total.value = versionList.value.length;
    loading.value = false;
  }, 500);
};

// 查看版本详情
const viewVersionDetail = (versionId: string) => {
  router.push(`/versions/${versionId}`);
};

// 创建版本
const handleCreateVersion = () => {
  router.push(`/versions/create?productId=${productId}`);
};

// 编辑版本
const handleEdit = (row: any) => {
  if (row.locked) {
    ElMessage.warning('版本已锁定，无法编辑');
    return;
  }
  // 实际项目中应该跳转到编辑页面
  ElMessage.info(`编辑版本：${row.version}`);
};

// 锁定版本
const handleLock = (row: any) => {
  ElMessageBox.confirm(
    `确定要锁定版本 ${row.version} 吗？锁定后将无法修改版本信息。`,
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    // 模拟锁定操作
    row.locked = true;
    ElMessage.success('锁定成功');
  }).catch(() => {
    // 取消锁定
  });
};

// 解锁版本
const handleUnlock = (row: any) => {
  ElMessageBox.confirm(
    `确定要解锁版本 ${row.version} 吗？`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info',
    }
  ).then(() => {
    // 模拟解锁操作
    row.locked = false;
    ElMessage.success('解锁成功');
  }).catch(() => {
    // 取消解锁
  });
};

// 搜索
const handleSearch = () => {
  currentPage.value = 1;
  loadVersionList();
};

// 重置搜索
const resetSearch = () => {
  searchForm.version = '';
  searchForm.status = '';
  searchForm.locked = null;
  searchForm.timeOrder = '';
  handleSearch();
};

// 分页大小变化
const handleSizeChange = (val: number) => {
  pageSize.value = val;
  loadVersionList();
};

// 当前页变化
const handleCurrentChange = (val: number) => {
  currentPage.value = val;
  loadVersionList();
};

onMounted(() => {
  loadVersionList();
});
</script>

<style scoped>
.version-list {
  width: 100%;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>