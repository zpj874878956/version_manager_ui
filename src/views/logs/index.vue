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
            <el-option label="创建" value="创建" />
            <el-option label="更新" value="更新" />
            <el-option label="删除" value="删除" />
            <el-option label="锁定" value="锁定" />
            <el-option label="解锁" value="解锁" />
            <el-option label="状态变更" value="状态变更" />
          </el-select>
        </el-form-item>
        <el-form-item label="对象类型">
          <el-select v-model="searchForm.objectType" placeholder="请选择对象类型" clearable>
            <el-option label="产品" value="产品" />
            <el-option label="版本" value="版本" />
            <el-option label="用户" value="用户" />
            <el-option label="权限" value="权限" />
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
import logsApi from '@/api/logs';

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

// 日志列表
const logList = ref<any[]>([]);

// 获取操作类型标签
const getActionTypeTag = (type: string) => {
  const typeMap: Record<string, string> = {
    '创建': 'success',
    '更新': 'primary',
    '删除': 'danger',
    '锁定': 'warning',
    '解锁': 'info',
    '状态变更': 'primary'
  };
  return typeMap[type] || 'default';
};

// 获取操作类型文本
const getActionTypeText = (type: string) => {
  return type || '未知';
};

// 获取对象类型文本
const getObjectTypeText = (type: string) => {
  return type || '未知';
};

// 加载日志列表
const loadLogList = async () => {
  loading.value = true;
  try {
    // 构建查询参数
    const params: any = {
      page: currentPage.value,
      page_size: pageSize.value
    };
    
    if (searchForm.actionType) {
      params.operation_type = searchForm.actionType;
    }
    
    if (searchForm.objectType) {
      params.object_type = searchForm.objectType;
    }
    
    if (searchForm.operator) {
      params.operator_name = searchForm.operator;
    }
    
    if (searchForm.timeRange && searchForm.timeRange.length === 2) {
      params.start_date = searchForm.timeRange[0];
      params.end_date = searchForm.timeRange[1];
    }
    
    // 调用API获取数据
    const response = await logsApi.getOperationLogs(params);
    
    if (response.success) {
      // 转换API返回的数据格式
      logList.value = response.data.logs.map((log: any) => {
        // 尝试解析details字段的JSON
        let changes: Array<{field: string, oldValue: any, newValue: any}> = [];
        let detailsObj: {
          changes?: Array<{field: string, oldValue: any, newValue: any}>,
          message?: string,
          ip?: string,
          result?: string
        } = {};
        
        try {
          detailsObj = JSON.parse(log.details);
          // 如果有变更信息，转换为changes数组
          if (detailsObj.changes) {
            changes = detailsObj.changes;
          }
        } catch (e) {
          console.error('解析日志详情失败', e);
        }
        
        return {
          id: log.id,
          time: log.operation_time,
          actionType: log.operation_type,
          objectType: log.object_type,
          objectId: log.object_id,
          objectName: log.object_name,
          operator: log.operator_name,
          detail: detailsObj.message || log.details,
          ip: detailsObj.ip || '',
          result: detailsObj.result || 'success',
          changes: changes
        };
      });
      
      total.value = response.data.total;
      currentPage.value = response.data.current_page;
    } else {
      ElMessage.error('获取日志列表失败');
    }
  } catch (error) {
    console.error('加载日志列表出错:', error);
    ElMessage.error('获取日志列表失败');
  } finally {
    loading.value = false;
  }
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