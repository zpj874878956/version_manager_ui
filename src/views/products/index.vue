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

    <!-- 调试信息区域 -->
    <div v-if="showDebug" class="debug-area">
      <h3>调试信息</h3>
      <pre>{{ JSON.stringify(productList, null, 2) }}</pre>
      <el-button @click="showDebug = false">隐藏调试信息</el-button>
    </div>
    <div v-else class="mb-2">
      <el-button size="small" @click="showDebug = true">显示调试信息</el-button>
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
          <el-table-column label="负责人" width="120">
            <template #default="scope">
              {{ scope.row.owner_name || '未指定' }}
            </template>
          </el-table-column>
          <el-table-column label="创建时间" width="180">
            <template #default="scope">
              {{ scope.row.createTime || scope.row.created_at || scope.row.create_time || '未知' }}
            </template>
          </el-table-column>
          <el-table-column label="更新时间" width="180">
            <template #default="scope">
              {{ scope.row.updateTime || scope.row.updated_at || scope.row.update_time || '未知' }}
            </template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template #default="scope">
              <el-tag :type="getStatusType(scope.row.status || '')">
                {{ getStatusText(scope.row.status || '') }}
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

    <!-- 创建产品对话框 -->
    <el-dialog
      v-model="createDialogVisible"
      title="创建新产品"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="createForm" label-width="100px" :rules="rules" ref="createFormRef">
        <el-form-item label="产品名称" prop="name">
          <el-input v-model="createForm.name" placeholder="请输入产品名称" />
        </el-form-item>
        <el-form-item label="产品代码" prop="code">
          <el-input v-model="createForm.code" placeholder="请输入产品代码" />
        </el-form-item>
        <el-form-item label="产品描述" prop="description">
          <el-input v-model="createForm.description" type="textarea" rows="3" placeholder="请输入产品描述" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="createForm.status" placeholder="请选择状态">
            <el-option label="开发中" value="developing" />
            <el-option label="已发布" value="published" />
            <el-option label="已归档" value="archived" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitCreateForm">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Plus, Search, Refresh } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { FormInstance } from 'element-plus';
import productApi from '@/api/product';
import type { Product } from '@/api/product';

const router = useRouter();
const loading = ref(false);
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);
const showDebug = ref(false);

// 搜索表单
const searchForm = reactive({
  name: '',
  code: '',
  status: ''
});

// 产品列表数据
const productList = ref<Product[]>([]);

// 创建产品相关
const createDialogVisible = ref(false);
const submitting = ref(false);
const createFormRef = ref<FormInstance>();

const createForm = reactive<Product>({
  name: '',
  code: '',
  description: '',
  status: 'developing'
});

const rules = {
  name: [{ required: true, message: '请输入产品名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入产品代码', trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }]
};

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
const loadProductList = async () => {
  loading.value = true;
  try {
    const params = {
      page: currentPage.value,
      per_page: pageSize.value,
      status: searchForm.status || undefined,
      name: searchForm.name || undefined,
      code: searchForm.code || undefined
    };
    
    console.log('请求参数:', params);
    const response = await productApi.getProducts(params);
    console.log('API响应:', response);
    
    // 根据实际 API 响应结构进行调整
    if (response && Array.isArray(response)) {
      // 直接返回数组的情况
      console.log('处理数组响应');
      productList.value = response as Product[];
      total.value = response.length;
    } else if (response && response.data && Array.isArray(response.data)) {
      // 嵌套在data字段的数组
      console.log('处理嵌套数据响应 - data数组');
      productList.value = response.data as Product[];
      total.value = (response as any).total || response.data.length;
    } else if (response && response.data && response.data.products && Array.isArray(response.data.products)) {
      // 嵌套在data.products字段的数组
      console.log('处理嵌套数据响应 - data.products数组');
      productList.value = response.data.products as Product[];
      total.value = response.data.total || response.data.products.length;
      
      // 如果有分页信息
      if (response.data.current_page) {
        currentPage.value = response.data.current_page;
      }
      if (response.data.pages) {
        total.value = (response.data.pages || 1) * productList.value.length;
      }
    } else if (response && typeof response === 'object') {
      // 其他对象结构，尝试提取数据
      console.log('尝试从对象中提取数据');
      const resp = response as any;
      if (resp.items) {
        productList.value = resp.items as Product[];
        total.value = resp.total || resp.items.length;
      } else if (resp.list) {
        productList.value = resp.list as Product[];
        total.value = resp.total || resp.list.length;
      } else if (resp.products) {
        productList.value = resp.products as Product[];
        total.value = resp.total || resp.products.length;
      } else if (resp.data && resp.data.products) {
        productList.value = resp.data.products as Product[];
        total.value = resp.data.total || resp.data.products.length;
      } else {
        console.warn('未找到数据数组，响应结构:', resp);
        productList.value = [];
        total.value = 0;
      }
    } else {
      console.warn('未识别的响应结构:', response);
      productList.value = [];
      total.value = 0;
    }
    
    // 处理字段映射
    productList.value = productList.value.map(item => {
      // 确保字段名称一致性
      return {
        ...item,
        createTime: item.createTime || item.created_at || item.create_time,
        updateTime: item.updateTime || item.updated_at || item.update_time,
        owner_name: item.owner_name || item.owner // 兼容owner_name
      };
    });
    
    console.log('处理后的产品列表:', productList.value);
  } catch (error) {
    console.error('获取产品列表失败', error);
    ElMessage.error('获取产品列表失败');
    productList.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
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
const handleViewDetail = (id: string | number) => {
  router.push(`/products/${id}`);
};

// 编辑产品
const handleEdit = (id: string | number) => {
  router.push(`/products/${id}?edit=true`);
};

// 删除产品
const handleDelete = async (id: string | number) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除该产品吗？删除后不可恢复。',
      '警告',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    );
    
    loading.value = true;
    await productApi.deleteProduct(id);
    ElMessage.success('删除成功');
    loadProductList();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除产品失败', error);
      ElMessage.error('删除产品失败');
    }
  } finally {
    loading.value = false;
  }
};

// 创建新产品
const handleCreateProduct = () => {
  createDialogVisible.value = true;
  // 重置表单
  Object.assign(createForm, {
    name: '',
    code: '',
    description: '',
    status: 'developing'
  });
};

// 提交创建表单
const submitCreateForm = async () => {
  if (!createFormRef.value) return;
  
  await createFormRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true;
      try {
        await productApi.createProduct(createForm);
        ElMessage.success('创建产品成功');
        createDialogVisible.value = false;
        loadProductList(); // 重新加载产品列表
      } catch (error) {
        console.error('创建产品失败:', error);
        ElMessage.error('创建产品失败');
      } finally {
        submitting.value = false;
      }
    }
  });
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

.debug-area {
  background-color: #f5f7fa;
  padding: 15px;
  margin-bottom: 20px;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
  overflow: auto;
}

.debug-area pre {
  white-space: pre-wrap;
  word-break: break-all;
  font-family: monospace;
}

.mb-2 {
  margin-bottom: 10px;
}
</style>