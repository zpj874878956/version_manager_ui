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
    <el-card class="mb-4" v-loading="loading">
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
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusType(productInfo.status || '')">
              {{ getStatusText(productInfo.status || '') }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ productInfo.createTime || '暂无' }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ productInfo.updateTime || '暂无' }}</el-descriptions-item>
          <el-descriptions-item label="负责人">{{ productInfo.owner || '暂无' }}</el-descriptions-item>
          <el-descriptions-item label="产品描述" :span="3">
            {{ productInfo.description || '暂无描述' }}
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
      <el-table :data="versionList" style="width: 100%" v-loading="versionsLoading">
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
import productApi from '@/api/product';
import type { Product } from '@/api/product';

// 扩展 Product 类型，添加前端需要的额外属性
interface ExtendedProduct extends Product {
  owner?: string;
  createTime?: string;
  updateTime?: string;
}

// 版本列表数据
interface VersionItem {
  id: string | number;
  version: string;
  createTime?: string;
  updateTime?: string;
  creator?: string;
  status?: string;
  locked?: boolean;
  
  // 后端可能返回的额外字段
  created_at?: string;
  updated_at?: string;
  create_time?: string;
  update_time?: string;
}

const route = useRoute();
const router = useRouter();
const loading = ref(false);
const versionsLoading = ref(false);
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);

// 产品ID
const productId = route.params.id as string;

// 产品信息
const productInfo = reactive<ExtendedProduct>({
  id: undefined,
  name: '',
  code: '',
  description: '',
  status: ''
});

// 搜索表单
const searchForm = reactive({
  version: '',
  status: ''
});

// 版本列表数据
const versionList = ref<VersionItem[]>([]);

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
const loadProductInfo = async () => {
  loading.value = true;
  try {
    const response = await productApi.getProduct(productId);
    console.log('产品详情原始响应:', response);
    
    // 根据实际 API 响应结构进行调整
    if (response && response.data) {
      // 处理字段映射
      const productData = {
        ...response.data,
        createTime: response.data.createTime || response.data.created_at || response.data.create_time,
        updateTime: response.data.updateTime || response.data.updated_at || response.data.update_time
      };
      Object.assign(productInfo, productData);
    } else if (response) {
      // 直接使用响应
      const productData = {
        ...response,
        createTime: response.createTime || response.created_at || response.create_time,
        updateTime: response.updateTime || response.updated_at || response.update_time
      };
      Object.assign(productInfo, productData);
    }
    
    console.log('处理后的产品信息:', productInfo);
  } catch (error) {
    console.error('获取产品详情失败', error);
    ElMessage.error('获取产品详情失败');
  } finally {
    loading.value = false;
  }
};

// 加载版本列表数据
const loadVersionList = async () => {
  versionsLoading.value = true;
  try {
    const params = {
      page: currentPage.value,
      per_page: pageSize.value,
      status: searchForm.status || undefined,
      version: searchForm.version || undefined
    };
    
    const response = await productApi.getProductVersions(productId, params);
    console.log('版本列表原始响应:', response);
    
    // 根据实际 API 响应结构进行调整
    if (response && Array.isArray(response)) {
      // 直接返回数组
      versionList.value = response;
      total.value = response.length;
    } else if (response && response.data && Array.isArray(response.data)) {
      // data字段是数组
      versionList.value = response.data;
      total.value = response.total || response.data.length;
    } else if (response && response.data && response.data.versions && Array.isArray(response.data.versions)) {
      // data.versions字段是数组
      versionList.value = response.data.versions;
      total.value = response.data.total || response.data.versions.length;
      
      // 如果有分页信息
      if (response.data.current_page) {
        currentPage.value = response.data.current_page;
      }
      if (response.data.pages) {
        total.value = (response.data.pages || 1) * versionList.value.length;
      }
    } else if (response && typeof response === 'object') {
      // 其他对象结构
      const resp = response as any;
      if (resp.versions) {
        versionList.value = resp.versions;
        total.value = resp.total || resp.versions.length;
      } else if (resp.items) {
        versionList.value = resp.items;
        total.value = resp.total || resp.items.length;
      } else if (resp.list) {
        versionList.value = resp.list;
        total.value = resp.total || resp.list.length;
      } else if (resp.data && resp.data.versions) {
        versionList.value = resp.data.versions;
        total.value = resp.data.total || resp.data.versions.length;
      } else {
        console.warn('未找到版本数据数组，响应结构:', resp);
        versionList.value = [];
        total.value = 0;
      }
    } else {
      console.warn('未识别的响应结构:', response);
      versionList.value = [];
      total.value = 0;
    }
    
    // 处理字段映射
    versionList.value = versionList.value.map(item => {
      return {
        ...item,
        createTime: item.createTime || item.created_at || item.create_time,
        updateTime: item.updateTime || item.updated_at || item.update_time
      };
    });
    
    console.log('处理后的版本列表:', versionList.value);
  } catch (error) {
    console.error('获取产品版本列表失败', error);
    ElMessage.error('获取产品版本列表失败');
    versionList.value = [];
    total.value = 0;
  } finally {
    versionsLoading.value = false;
  }
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
  router.push(`/products/${productId}/edit`);
};

// 创建版本
const handleCreateVersion = () => {
  router.push(`/products/${productId}/versions/create`);
};

// 查看版本详情
const handleViewVersion = (id: string | number) => {
  router.push(`/products/${productId}/versions/${id}`);
};

// 锁定版本
const handleLockVersion = async (id: string | number) => {
  try {
    await ElMessageBox.confirm(
      '确定要锁定该版本吗？锁定后将无法修改版本信息。',
      '警告',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    );
    
    // 这里应该调用锁定版本的API
    ElMessage.success('锁定成功');
    loadVersionList();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('锁定版本失败', error);
      ElMessage.error('锁定版本失败');
    }
  }
};

// 解锁版本
const handleUnlockVersion = async (id: string | number) => {
  try {
    await ElMessageBox.confirm(
      '确定要解锁该版本吗？',
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info',
      }
    );
    
    // 这里应该调用解锁版本的API
    ElMessage.success('解锁成功');
    loadVersionList();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('解锁版本失败', error);
      ElMessage.error('解锁版本失败');
    }
  }
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