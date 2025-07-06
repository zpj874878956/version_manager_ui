<template>
  <div class="version-list">
    <!-- 面包屑导航 - 显示当前页面在网站层级结构中的位置 -->
    <div class="breadcrumb mb-4">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: '/products' }">产品列表</el-breadcrumb-item>
        <el-breadcrumb-item :to="{ path: `/products/${productId}` }">产品详情</el-breadcrumb-item>
        <el-breadcrumb-item>版本列表</el-breadcrumb-item>
      </el-breadcrumb>
    </div>

    <!-- 页面标题和创建按钮 -->
    <div class="mb-6 flex justify-between items-center">
      <h1 class="text-xl font-semibold">版本列表</h1>
      <el-button type="primary" @click="handleCreateVersion">
        <el-icon><Plus /></el-icon> 创建版本
      </el-button>
    </div>

    <!-- 搜索和筛选区域 - 提供版本查询和过滤功能 -->
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

    <!-- 版本列表表格 - 展示所有版本及其基本信息 -->
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

      <!-- 分页控件 - 控制数据分页显示 -->
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
import versionApi from '@/api/version';

const route = useRoute();
const router = useRouter();

// 产品ID - 从路由参数获取，用于筛选特定产品的版本
const productId = route.params.productId as string || 'PRD-001';

// 搜索表单 - 存储搜索和筛选条件
const searchForm = reactive({
  version: '',
  status: '',
  locked: null as boolean | null,
  timeOrder: ''
});

// 分页相关变量
const currentPage = ref(1); // 当前页码
const pageSize = ref(10);   // 每页显示数量
const total = ref(0);       // 总记录数
const loading = ref(false); // 加载状态标记

// 版本列表数据 - 存储从API获取的版本列表
const versionList = ref([]);

/**
 * 获取状态标签类型 - 根据状态返回对应的标签类型
 * @param status 版本状态
 * @returns 标签类型
 */
const getStatusType = (status: string) => {
  const statusMap: Record<string, string> = {
    developing: 'info',
    testing: 'warning',
    released: 'success',
    deprecated: 'danger'
  };
  return statusMap[status] || 'default';
};

/**
 * 获取状态文本 - 将状态代码转换为显示文本
 * @param status 版本状态
 * @returns 状态显示文本
 */
const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    developing: '开发中',
    testing: '测试中',
    released: '已发布',
    deprecated: '已废弃'
  };
  return statusMap[status] || '未知';
};

/**
 * 加载版本列表 - 从API获取版本列表数据
 */
const loadVersionList = async () => {
  loading.value = true;
  try {
    // 调用API获取版本列表数据
    const params = {
      product_id: Number(productId),
      page: currentPage.value,
      per_page: pageSize.value,
      status: searchForm.status || undefined
    };
    
    const response = await versionApi.getVersions(params);
    if (response.data && response.data.data) {
      // 处理返回的数据
      versionList.value = response.data.data.map((item: any) => ({
        id: item.id,
        productId: item.product_id,
        version: item.version_number,
        name: item.name || item.version_number,
        description: item.description,
        createTime: item.created_at,
        updateTime: item.updated_at,
        status: item.status,
        locked: item.locked || false,
        releaseDate: item.release_date,
        releaseType: item.release_type,
        creator: item.author_name || '系统'
      }));
      total.value = response.data.total || versionList.value.length;
    }
  } catch (error) {
    console.error('获取版本列表失败:', error);
    ElMessage.error('获取版本列表失败，请稍后重试');
  } finally {
    loading.value = false;
  }
};

/**
 * 查看版本详情 - 跳转到版本详情页
 * @param versionId 版本ID
 */
const viewVersionDetail = (versionId: string) => {
  router.push(`/products/${productId}/versions/${versionId}`);
};

/**
 * 创建版本 - 跳转到版本创建页面
 */
const handleCreateVersion = () => {
  router.push(`/products/${productId}/versions/create`);
};

/**
 * 编辑版本 - 处理编辑按钮点击事件
 * @param row 当前行数据
 */
const handleEdit = (row: any) => {
  if (productId) {
    router.push(`/products/${productId}/versions/${row.id}/edit`);
  } else {
    router.push(`/versions/${row.id}/edit`);
  }
};

/**
 * 锁定版本 - 处理锁定按钮点击事件
 * @param row 当前行数据
 */
const handleLock = (row: any) => {
  ElMessageBox.confirm(
    `确定要锁定版本 ${row.version} 吗？锁定后将无法修改版本信息。`,
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(async () => {
    try {
      // 调用API锁定版本
      await versionApi.updateVersion(row.id, { status: 'locked' });
      row.locked = true;
      ElMessage.success('锁定成功');
    } catch (error) {
      console.error('锁定版本失败:', error);
      ElMessage.error('锁定版本失败，请稍后重试');
    }
  }).catch(() => {
    // 取消锁定
  });
};

/**
 * 解锁版本 - 处理解锁按钮点击事件
 * @param row 当前行数据
 */
const handleUnlock = (row: any) => {
  ElMessageBox.confirm(
    `确定要解锁版本 ${row.version} 吗？`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info',
    }
  ).then(async () => {
    try {
      // 调用API解锁版本
      await versionApi.updateVersion(row.id, { status: row.status });
      row.locked = false;
      ElMessage.success('解锁成功');
    } catch (error) {
      console.error('解锁版本失败:', error);
      ElMessage.error('解锁版本失败，请稍后重试');
    }
  }).catch(() => {
    // 取消解锁
  });
};

/**
 * 搜索 - 处理搜索按钮点击事件
 */
const handleSearch = () => {
  currentPage.value = 1;
  loadVersionList();
};

/**
 * 重置搜索 - 清空搜索条件并重新加载数据
 */
const resetSearch = () => {
  searchForm.version = '';
  searchForm.status = '';
  searchForm.locked = null;
  searchForm.timeOrder = '';
  handleSearch();
};

/**
 * 分页大小变化处理
 * @param val 新的页面大小
 */
const handleSizeChange = (val: number) => {
  pageSize.value = val;
  loadVersionList();
};

/**
 * 当前页变化处理
 * @param val 新的当前页
 */
const handleCurrentChange = (val: number) => {
  currentPage.value = val;
  loadVersionList();
};

// 组件挂载时加载版本列表
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