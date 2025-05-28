<template>
  <div class="page-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2 class="page-title">操作日志</h2>
    </div>

    <!-- 搜索和筛选区域 -->
    <div class="search-area">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="操作类型">
          <el-select v-model="searchForm.actionType" placeholder="请选择操作类型" clearable>
            <el-option label="创建" value="create" />
            <el-option label="更新" value="update" />
            <el-option label="删除" value="delete" />
            <el-option label="锁定" value="lock" />
            <el-option label="解锁" value="unlock" />
            <el-option label="状态变更" value="status_change" />
          </el-select>
        </el-form-item>
        <el-form-item label="对象类型">
          <el-select v-model="searchForm.objectType" placeholder="请选择对象类型" clearable>
            <el-option label="产品" value="product" />
            <el-option label="版本" value="version" />
            <el-option label="用户" value="user" />
            <el-option label="权限" value="permission" />
          </el-select>
        </el-form-item>
        <el-form-item label="操作人">
          <el-input v-model="searchForm.operator" placeholder="请输入操作人" clearable />
        </el-form-item>
        <el-form-item label="操作时间">
          <el-date-picker
            v-model="searchForm.timeRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
          />
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

    <!-- 日志列表 -->
    <div class="data-table">
      <el-table
        v-loading="loading"
        :data="logList"
        style="width: 100%"
        border
      >
        <el-table-column prop="time" label="操作时间" sortable />
        <el-table-column label="操作类型">
          <template #default="scope">
            <el-tag :type="getActionTypeTag(scope.row.actionType)">
              {{ getActionTypeText(scope.row.actionType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="对象类型">
          <template #default="scope">
            <el-tag effect="plain">
              {{ getObjectTypeText(scope.row.objectType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="objectName" label="对象名称" />
        <el-table-column prop="objectId" label="对象ID" />
        <el-table-column prop="operator" label="操作人" />
        <el-table-column prop="detail" label="操作详情" show-overflow-tooltip />
        <el-table-column label="操作">
          <template #default="scope">
            <el-button link type="primary" @click="viewLogDetail(scope.row)">
              详情
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
    </div>

    <!-- 日志详情对话框 -->
    <el-dialog
      v-model="logDetailDialogVisible"
      title="操作日志详情"
      width="700px"
    >
      <div v-if="currentLog">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="操作时间">{{ currentLog.time }}</el-descriptions-item>
          <el-descriptions-item label="操作人">{{ currentLog.operator }}</el-descriptions-item>
          <el-descriptions-item label="操作类型">
            <el-tag :type="getActionTypeTag(currentLog.actionType)">
              {{ getActionTypeText(currentLog.actionType) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="对象类型">
            <el-tag effect="plain">
              {{ getObjectTypeText(currentLog.objectType) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="对象名称">{{ currentLog.objectName }}</el-descriptions-item>
          <el-descriptions-item label="对象ID">{{ currentLog.objectId }}</el-descriptions-item>
          <el-descriptions-item label="IP地址">{{ currentLog.ip }}</el-descriptions-item>
          <el-descriptions-item label="操作结果">
            <el-tag :type="currentLog.result === 'success' ? 'success' : 'danger'">
              {{ currentLog.result === 'success' ? '成功' : '失败' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="操作详情" :span="2">
            {{ currentLog.detail }}
          </el-descriptions-item>
        </el-descriptions>

        <div v-if="currentLog.changes && currentLog.changes.length > 0" class="mt-4">
          <h4 class="mb-2 font-medium">变更详情：</h4>
          <el-table :data="currentLog.changes" border style="width: 100%">
            <el-table-column prop="field" label="字段" width="150" />
            <el-table-column prop="oldValue" label="旧值" />
            <el-table-column prop="newValue" label="新值" />
          </el-table>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { Search, Refresh } from '@element-plus/icons-vue';

// 搜索表单
const searchForm = reactive({
  actionType: '',
  objectType: '',
  operator: '',
  timeRange: [] as string[]
});

// 分页相关
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);
const loading = ref(false);

// 日志详情对话框
const logDetailDialogVisible = ref(false);
const currentLog = ref<any>(null);

// 日志列表（模拟数据）
const logList = ref([
  {
    id: '1',
    time: '2024-01-20 10:30:45',
    actionType: 'create',
    objectType: 'product',
    objectId: 'PRD-001',
    objectName: '客户管理系统',
    operator: '张三',
    detail: '创建了新产品：客户管理系统',
    ip: '192.168.1.100',
    result: 'success',
    changes: []
  },
  {
    id: '2',
    time: '2024-01-20 11:15:22',
    actionType: 'create',
    objectType: 'version',
    objectId: 'V001',
    objectName: '1.0.0',
    operator: '张三',
    detail: '创建了产品"客户管理系统"的新版本：1.0.0',
    ip: '192.168.1.100',
    result: 'success',
    changes: []
  },
  {
    id: '3',
    time: '2024-01-20 14:25:10',
    actionType: 'update',
    objectType: 'version',
    objectId: 'V001',
    objectName: '1.0.0',
    operator: '李四',
    detail: '更新了版本1.0.0的信息',
    ip: '192.168.1.101',
    result: 'success',
    changes: [
      { field: '描述', oldValue: '初始版本', newValue: '初始版本，包含基础功能模块' },
      { field: '发布日期', oldValue: '2024-01-25', newValue: '2024-01-15' }
    ]
  },
  {
    id: '4',
    time: '2024-01-20 16:40:30',
    actionType: 'status_change',
    objectType: 'version',
    objectId: 'V001',
    objectName: '1.0.0',
    operator: '王五',
    detail: '变更了版本1.0.0的状态',
    ip: '192.168.1.102',
    result: 'success',
    changes: [
      { field: '状态', oldValue: '开发中', newValue: '测试中' }
    ]
  },
  {
    id: '5',
    time: '2024-01-21 09:10:15',
    actionType: 'lock',
    objectType: 'version',
    objectId: 'V001',
    objectName: '1.0.0',
    operator: '王五',
    detail: '锁定了版本1.0.0',
    ip: '192.168.1.102',
    result: 'success',
    changes: []
  },
  {
    id: '6',
    time: '2024-01-21 10:30:00',
    actionType: 'create',
    objectType: 'user',
    objectId: '5',
    objectName: '赵六',
    operator: '张三',
    detail: '创建了新用户：赵六',
    ip: '192.168.1.100',
    result: 'success',
    changes: []
  },
  {
    id: '7',
    time: '2024-01-21 11:45:20',
    actionType: 'update',
    objectType: 'permission',
    objectId: 'PERM-001',
    objectName: '用户权限',
    operator: '张三',
    detail: '更新了用户"李四"的产品权限',
    ip: '192.168.1.100',
    result: 'success',
    changes: [
      { field: '客户管理系统权限', oldValue: '只读', newValue: '编辑' }
    ]
  },
  {
    id: '8',
    time: '2024-01-22 09:20:30',
    actionType: 'status_change',
    objectType: 'version',
    objectId: 'V001',
    objectName: '1.0.0',
    operator: '王五',
    detail: '变更了版本1.0.0的状态',
    ip: '192.168.1.102',
    result: 'success',
    changes: [
      { field: '状态', oldValue: '测试中', newValue: '已发布' }
    ]
  }
]);

// 获取操作类型标签
const getActionTypeTag = (type: string) => {
  const typeMap: Record<string, string> = {
    create: 'success',
    update: 'primary',
    delete: 'danger',
    lock: 'warning',
    unlock: 'info',
    status_change: 'primary'
  };
  return typeMap[type] || 'default';
};

// 获取操作类型文本
const getActionTypeText = (type: string) => {
  const typeMap: Record<string, string> = {
    create: '创建',
    update: '更新',
    delete: '删除',
    lock: '锁定',
    unlock: '解锁',
    status_change: '状态变更'
  };
  return typeMap[type] || '未知';
};

// 获取对象类型文本
const getObjectTypeText = (type: string) => {
  const typeMap: Record<string, string> = {
    product: '产品',
    version: '版本',
    user: '用户',
    permission: '权限'
  };
  return typeMap[type] || '未知';
};

// 加载日志列表
const loadLogList = () => {
  loading.value = true;
  // 模拟API请求
  setTimeout(() => {
    // 实际项目中应该调用API获取数据
    // 这里使用模拟数据
    total.value = logList.value.length;
    loading.value = false;
  }, 500);
};

// 查看日志详情
const viewLogDetail = (log: any) => {
  currentLog.value = log;
  logDetailDialogVisible.value = true;
};

// 搜索
const handleSearch = () => {
  currentPage.value = 1;
  loadLogList();
};

// 重置搜索
const resetSearch = () => {
  searchForm.actionType = '';
  searchForm.objectType = '';
  searchForm.operator = '';
  searchForm.timeRange = [];
  handleSearch();
};

// 分页大小变化
const handleSizeChange = (val: number) => {
  pageSize.value = val;
  loadLogList();
};

// 当前页变化
const handleCurrentChange = (val: number) => {
  currentPage.value = val;
  loadLogList();
};

onMounted(() => {
  loadLogList();
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

.dialog-footer {
  padding-top: 10px;
  text-align: right;
}

/* 适配表格宽度 */
.el-table {
  width: 100%;
}

/* 修复日期选择器在小屏幕上的显示 */
.el-date-editor.el-input {
  width: 220px;
}

.mt-4 {
  margin-top: 16px;
}

.mb-2 {
  margin-bottom: 8px;
}

.font-medium {
  font-weight: 500;
}
</style>