<template>
  <div class="page-container">
    <!-- 页面标题和操作按钮 -->
    <div class="page-header">
      <h2 class="page-title">产品列表</h2>
      <el-button type="primary" @click="handleCreateProduct">
        <el-icon><Plus /></el-icon> 新建产品
      </el-button>
    </div>

    <!-- 搜索和筛选区域 -->
    <div class="search-area">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="产品名称">
          <el-input v-model="searchForm.name" placeholder="请输入产品名称" clearable />
        </el-form-item>
        <el-form-item label="产品代码">
          <el-input v-model="searchForm.code" placeholder="请输入产品代码" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
            <el-option label="开发中" value="developing" />
            <el-option label="已发布" value="published" />
            <el-option label="已归档" value="archived" />
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

    <!-- 产品列表表格 -->
    <div class="data-table">
      <div class="table-container">
        <el-table 
          :data="productList" 
          style="width: 100%" 
          v-loading="loading"
          border
        >
          <el-table-column prop="code" label="产品代码" width="120" />
          <el-table-column prop="name" label="产品名称" min-width="180" />
          <el-table-column prop="owner" label="负责人" width="120" />
          <el-table-column prop="createTime" label="创建时间" width="180" />
          <el-table-column prop="updateTime" label="更新时间" width="180" />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="scope">
              <el-tag :type="getStatusType(scope.row.status)">
                {{ getStatusText(scope.row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="scope">
              <el-button link type="primary" @click="handleViewDetail(scope.row.id)">
                查看
              </el-button>
              <el-button link type="primary" @click="handleEdit(scope.row.id)">
                编辑
              </el-button>
              <el-button link type="danger" @click="handleDelete(scope.row.id)">
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

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
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Plus, Search, Refresh } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';

const router = useRouter();
const loading = ref(false);
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);

// 搜索表单
const searchForm = reactive({
  name: '',
  code: '',
  status: ''
});

// 产品列表数据
const productList = ref([
  {
    id: 'PRD-001',
    code: 'PRD-001',
    name: '智能家居控制系统',
    owner: '张三',
    createTime: '2023-12-01 10:00:00',
    updateTime: '2024-01-15 14:30:00',
    status: 'developing'
  },
  {
    id: 'PRD-002',
    code: 'PRD-002',
    name: '企业财务管理平台',
    owner: '李四',
    createTime: '2023-11-15 09:30:00',
    updateTime: '2024-01-10 16:45:00',
    status: 'published'
  },
  {
    id: 'PRD-003',
    code: 'PRD-003',
    name: '在线教育课程系统',
    owner: '王五',
    createTime: '2023-10-20 14:20:00',
    updateTime: '2023-12-25 11:15:00',
    status: 'archived'
  }
]);

// 获取状态标签类型
const getStatusType = (status: string) => {
  const statusMap: Record<string, string> = {
    developing: 'warning',
    published: 'success',
    archived: 'info'
  };
  return statusMap[status] || 'default';
};

// 获取状态文本
const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    developing: '开发中',
    published: '已发布',
    archived: '已归档'
  };
  return statusMap[status] || '未知';
};

// 加载产品列表数据
const loadProductList = () => {
  loading.value = true;
  // 模拟API请求
  setTimeout(() => {
    total.value = productList.value.length;
    loading.value = false;
  }, 500);
};

// 搜索
const handleSearch = () => {
  currentPage.value = 1;
  loadProductList();
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
  loadProductList();
};

// 当前页变化
const handleCurrentChange = (val: number) => {
  currentPage.value = val;
  loadProductList();
};

// 查看详情
const handleViewDetail = (id: string) => {
  router.push(`/products/${id}`);
};

// 编辑产品
const handleEdit = (id: string) => {
  router.push(`/products/${id}?edit=true`);
};

// 删除产品
const handleDelete = (id: string) => {
  ElMessageBox.confirm(
    '确定要删除该产品吗？删除后不可恢复。',
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    // 模拟删除操作
    ElMessage.success('删除成功');
    loadProductList();
  }).catch(() => {
    // 取消删除
  });
};

// 创建新产品
const handleCreateProduct = () => {
  // 跳转到产品创建页面或打开创建对话框
  ElMessage.info('跳转到产品创建页面');
};

onMounted(() => {
  loadProductList();
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

.search-area {
  padding: 20px;
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  margin-bottom: 20px;
  overflow-x: auto;
}

.data-table {
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  padding: 0 0 16px;
  width: 100%;
}

.table-container {
  width: 100%;
  overflow-x: auto;
}

.pagination {
  padding: 16px;
  display: flex;
  justify-content: flex-end;
}

.el-form {
  display: flex;
  flex-wrap: wrap;
}

.el-form-item {
  margin-right: 10px;
  margin-bottom: 15px;
}
</style>