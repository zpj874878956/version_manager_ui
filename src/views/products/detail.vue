<template>
  <div class="product-detail">
    <!-- 面包屑导航 -->
    <div class="breadcrumb mb-4">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: '/products' }">产品列表</el-breadcrumb-item>
        <el-breadcrumb-item>产品详情</el-breadcrumb-item>
      </el-breadcrumb>
    </div>

    <!-- 产品信息卡片 -->
    <el-card class="mb-4">
      <template #header>
        <div class="card-header">
          <h3 class="text-lg font-bold">产品信息</h3>
          <el-button type="primary" plain size="small" @click="handleEdit">
            <el-icon><Edit /></el-icon> 编辑
          </el-button>
        </div>
      </template>
      <div class="product-info">
        <el-descriptions :column="3" border>
          <el-descriptions-item label="产品名称">{{ productInfo.name }}</el-descriptions-item>
          <el-descriptions-item label="产品代码">{{ productInfo.code }}</el-descriptions-item>
          <el-descriptions-item label="负责人">{{ productInfo.owner }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ productInfo.createTime }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ productInfo.updateTime }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusType(productInfo.status)">
              {{ getStatusText(productInfo.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="产品描述" :span="3">
            {{ productInfo.description }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-card>

    <!-- 版本列表卡片 -->
    <el-card>
      <template #header>
        <div class="card-header">
          <h3 class="text-lg font-bold">版本列表</h3>
          <el-button type="primary" @click="handleCreateVersion">
            <el-icon><Plus /></el-icon> 创建版本
          </el-button>
        </div>
      </template>

      <!-- 版本搜索 -->
      <div class="search-bar mb-4">
        <el-form :inline="true" :model="searchForm">
          <el-form-item label="版本号">
            <el-input v-model="searchForm.version" placeholder="请输入版本号" clearable />
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
              <el-option label="开发中" value="developing" />
              <el-option label="测试中" value="testing" />
              <el-option label="已发布" value="released" />
              <el-option label="已锁定" value="locked" />
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

      <!-- 版本列表表格 -->
      <el-table :data="versionList" style="width: 100%" v-loading="loading">
        <el-table-column prop="version" label="版本号" width="120" />
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column prop="updateTime" label="更新时间" width="180" />
        <el-table-column prop="creator" label="创建人" width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getVersionStatusType(scope.row.status)">
              {{ getVersionStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="locked" label="锁定状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.locked ? 'danger' : 'success'" effect="plain">
              {{ scope.row.locked ? '已锁定' : '未锁定' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="200">
          <template #default="scope">
            <el-button link type="primary" @click="handleViewVersion(scope.row.id)">
              查看
            </el-button>
            <el-button link type="primary" @click="handleLockVersion(scope.row.id)" v-if="!scope.row.locked">
              锁定
            </el-button>
            <el-button link type="danger" @click="handleUnlockVersion(scope.row.id)" v-else>
              解锁
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination">
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
import { Edit, Plus, Search, Refresh } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';

const route = useRoute();
const router = useRouter();
const loading = ref(false);
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);

// 产品ID
const productId = route.params.id as string;

// 产品信息
const productInfo = reactive({
  id: productId,
  code: 'PRD-001',
  name: '智能家居控制系统',
  owner: '张三',
  createTime: '2023-12-01 10:00:00',
  updateTime: '2024-01-15 14:30:00',
  status: 'developing',
  description: '这是一个智能家居控制系统，可以远程控制家中的各种智能设备，包括灯光、窗帘、空调、安防等。'
});

// 搜索表单
const searchForm = reactive({
  version: '',
  status: ''
});

// 版本列表数据
const versionList = ref([
  {
    id: 'V001',
    version: '1.0.0',
    createTime: '2023-12-05 10:00:00',
    updateTime: '2023-12-10 14:30:00',
    creator: '张三',
    status: 'released',
    locked: true
  },
  {
    id: 'V002',
    version: '1.1.0',
    createTime: '2024-01-05 09:30:00',
    updateTime: '2024-01-15 16:45:00',
    creator: '李四',
    status: 'testing',
    locked: false
  },
  {
    id: 'V003',
    version: '1.2.0',
    createTime: '2024-02-01 14:20:00',
    updateTime: '2024-02-10 11:15:00',
    creator: '王五',
    status: 'developing',
    locked: false
  }
]);

// 获取产品状态标签类型
const getStatusType = (status: string) => {
  const statusMap: Record<string, string> = {
    developing: 'warning',
    published: 'success',
    archived: 'info'
  };
  return statusMap[status] || 'default';
};

// 获取产品状态文本
const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    developing: '开发中',
    published: '已发布',
    archived: '已归档'
  };
  return statusMap[status] || '未知';
};

// 获取版本状态标签类型
const getVersionStatusType = (status: string) => {
  const statusMap: Record<string, string> = {
    developing: 'info',
    testing: 'warning',
    released: 'success',
    deprecated: 'danger'
  };
  return statusMap[status] || 'default';
};

// 获取版本状态文本
const getVersionStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    developing: '开发中',
    testing: '测试中',
    released: '已发布',
    deprecated: '已废弃'
  };
  return statusMap[status] || '未知';
};

// 加载产品信息
const loadProductInfo = () => {
  // 模拟API请求获取产品信息
  // 实际项目中应该调用API获取数据
};

// 加载版本列表数据
const loadVersionList = () => {
  loading.value = true;
  // 模拟API请求
  setTimeout(() => {
    total.value = versionList.value.length;
    loading.value = false;
  }, 500);
};

// 搜索
const handleSearch = () => {
  currentPage.value = 1;
  loadVersionList();
};

// 重置搜索
const resetSearch = () => {
  Object.keys(searchForm).forEach(key => {
    searchForm[key as keyof typeof searchForm] = '';
  });
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

// 编辑产品
const handleEdit = () => {
  ElMessage.info('编辑产品信息');
};

// 创建版本
const handleCreateVersion = () => {
  router.push('/versions/create');
};

// 查看版本详情
const handleViewVersion = (id: string) => {
  router.push(`/versions/${id}`);
};

// 锁定版本
const handleLockVersion = (id: string) => {
  ElMessageBox.confirm(
    '确定要锁定该版本吗？锁定后将无法修改版本信息。',
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    // 模拟锁定操作
    ElMessage.success('锁定成功');
    loadVersionList();
  }).catch(() => {
    // 取消锁定
  });
};

// 解锁版本
const handleUnlockVersion = (id: string) => {
  ElMessageBox.confirm(
    '确定要解锁该版本吗？',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info',
    }
  ).then(() => {
    // 模拟解锁操作
    ElMessage.success('解锁成功');
    loadVersionList();
  }).catch(() => {
    // 取消解锁
  });
};

onMounted(() => {
  loadProductInfo();
  loadVersionList();
});
</script>

<style scoped>
.product-detail {
  width: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pagination {
  padding: 16px 0;
  display: flex;
  justify-content: flex-end;
}
</style>