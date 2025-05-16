<template>
  <div class="version-detail">
    <!-- 面包屑导航 -->
    <div class="breadcrumb mb-4">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: '/products' }">产品列表</el-breadcrumb-item>
        <el-breadcrumb-item :to="{ path: `/products/${productId}` }">产品详情</el-breadcrumb-item>
        <el-breadcrumb-item>版本详情</el-breadcrumb-item>
      </el-breadcrumb>
    </div>

    <!-- 版本信息卡片 -->
    <el-card class="mb-4">
      <template #header>
        <div class="card-header">
          <h3 class="text-lg font-bold">版本信息</h3>
          <div class="header-actions">
            <el-button type="primary" plain size="small" @click="handleEdit" v-if="!versionInfo.locked">
              <el-icon><Edit /></el-icon> 编辑
            </el-button>
            <el-button type="danger" plain size="small" @click="handleLockVersion" v-if="!versionInfo.locked">
              <el-icon><Lock /></el-icon> 锁定
            </el-button>
            <el-button type="success" plain size="small" @click="handleUnlockVersion" v-else>
              <el-icon><Unlock /></el-icon> 解锁
            </el-button>
          </div>
        </div>
      </template>
      <div class="version-info">
        <el-descriptions :column="3" border>
          <el-descriptions-item label="版本号">{{ versionInfo.version }}</el-descriptions-item>
          <el-descriptions-item label="版本名称">{{ versionInfo.name }}</el-descriptions-item>
          <el-descriptions-item label="创建人">{{ versionInfo.creator }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ versionInfo.createTime }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ versionInfo.updateTime }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusType(versionInfo.status)">
              {{ getStatusText(versionInfo.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="锁定状态">
            <el-tag :type="versionInfo.locked ? 'danger' : 'success'" effect="plain">
              {{ versionInfo.locked ? '已锁定' : '未锁定' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="计划发布日期">{{ versionInfo.releaseDate }}</el-descriptions-item>
          <el-descriptions-item label="发布类型">
            <el-tag>{{ getReleaseTypeText(versionInfo.releaseType) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="版本描述" :span="3">
            {{ versionInfo.description }}
          </el-descriptions-item>
          <el-descriptions-item label="发布说明" :span="3">
            {{ versionInfo.releaseNotes }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-card>

    <!-- 依赖信息卡片 -->
    <el-card class="mb-4">
      <template #header>
        <div class="card-header">
          <h3 class="text-lg font-bold">依赖信息</h3>
        </div>
      </template>
      <div v-if="versionInfo.dependencies && versionInfo.dependencies.length > 0">
        <el-table :data="versionInfo.dependencies" style="width: 100%">
          <el-table-column prop="productName" label="产品名称" width="200" />
          <el-table-column prop="version" label="版本号" width="120" />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="scope">
              <el-tag :type="getStatusType(scope.row.status)">
                {{ getStatusText(scope.row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120">
            <template #default="scope">
              <el-button link type="primary" @click="viewDependency(scope.row.productId, scope.row.versionId)">
                查看
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <el-empty v-else description="暂无依赖信息" />
    </el-card>

    <!-- 状态变更历史卡片 -->
    <el-card>
      <template #header>
        <div class="card-header">
          <h3 class="text-lg font-bold">状态变更历史</h3>
        </div>
      </template>
      <div v-if="statusHistory.length > 0">
        <el-timeline>
          <el-timeline-item
            v-for="(activity, index) in statusHistory"
            :key="index"
            :timestamp="activity.time"
            :type="getTimelineItemType(activity.action)"
          >
            <div class="timeline-content">
              <span class="font-bold">{{ activity.user }}</span>
              <span>{{ activity.action }}</span>
              <span v-if="activity.from && activity.to">
                状态从 <el-tag size="small">{{ getStatusText(activity.from) }}</el-tag>
                变更为 <el-tag size="small">{{ getStatusText(activity.to) }}</el-tag>
              </span>
              <div v-if="activity.comment" class="timeline-comment">
                备注: {{ activity.comment }}
              </div>
            </div>
          </el-timeline-item>
        </el-timeline>
      </div>
      <el-empty v-else description="暂无状态变更历史" />
    </el-card>

    <!-- 状态变更对话框 -->
    <el-dialog
      v-model="statusDialogVisible"
      title="变更版本状态"
      width="500px"
    >
      <el-form :model="statusForm" label-width="100px">
        <el-form-item label="当前状态">
          <el-tag :type="getStatusType(versionInfo.status)">
            {{ getStatusText(versionInfo.status) }}
          </el-tag>
        </el-form-item>
        <el-form-item label="目标状态">
          <el-select v-model="statusForm.targetStatus" placeholder="请选择目标状态">
            <el-option
              v-for="status in availableStatusOptions"
              :key="status.value"
              :label="status.label"
              :value="status.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="变更备注">
          <el-input
            v-model="statusForm.comment"
            type="textarea"
            :rows="3"
            placeholder="请输入状态变更的原因或备注信息"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="statusDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmStatusChange" :loading="statusChanging">
            确认变更
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Edit, Lock, Unlock } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';

const route = useRoute();
const router = useRouter();

// 版本ID
const versionId = route.params.id as string;
// 产品ID（假设从版本信息中获取）
const productId = ref('PRD-001');

// 状态变更对话框
const statusDialogVisible = ref(false);
const statusChanging = ref(false);
const statusForm = reactive({
  targetStatus: '',
  comment: ''
});

// 版本信息（模拟数据）
const versionInfo = reactive({
  id: versionId,
  productId: 'PRD-001',
  version: '1.0.0',
  name: '初始版本',
  creator: '张三',
  createTime: '2023-12-05 10:00:00',
  updateTime: '2023-12-10 14:30:00',
  status: 'released',
  locked: true,
  releaseDate: '2023-12-15',
  releaseType: 'feature',
  description: '这是智能家居控制系统的第一个正式版本，包含基础的设备控制功能。',
  releaseNotes: '1. 支持灯光、窗帘、空调等基础设备控制\n2. 提供移动端和Web端控制界面\n3. 支持设备定时任务设置',
  dependencies: [
    {
      productId: 'PRD-002',
      productName: '企业财务管理平台',
      versionId: 'V001',
      version: '1.0.0',
      status: 'released'
    }
  ]
});

// 状态变更历史（模拟数据）
const statusHistory = ref([
  {
    time: '2023-12-01 09:30:00',
    user: '张三',
    action: '创建版本',
    from: '',
    to: 'developing',
    comment: '初始创建'
  },
  {
    time: '2023-12-05 14:20:00',
    user: '李四',
    action: '状态变更',
    from: 'developing',
    to: 'testing',
    comment: '功能开发完成，进入测试阶段'
  },
  {
    time: '2023-12-10 11:15:00',
    user: '王五',
    action: '状态变更',
    from: 'testing',
    to: 'released',
    comment: '测试通过，正式发布'
  },
  {
    time: '2023-12-10 11:20:00',
    user: '王五',
    action: '锁定版本',
    comment: '版本发布后锁定，防止误修改'
  }
]);

// 可用的状态选项
const availableStatusOptions = computed(() => {
  // 根据当前状态返回可选的下一个状态
  const statusMap: Record<string, Array<{value: string, label: string}>> = {
    'developing': [
      { value: 'testing', label: '测试中' }
    ],
    'testing': [
      { value: 'developing', label: '开发中' },
      { value: 'released', label: '已发布' }
    ],
    'released': [
      { value: 'deprecated', label: '已废弃' }
    ],
    'deprecated': [
      { value: 'developing', label: '开发中' }
    ]
  };
  
  return statusMap[versionInfo.status] || [];
});

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

// 获取发布类型文本
const getReleaseTypeText = (type: string) => {
  const typeMap: Record<string, string> = {
    feature: '功能更新',
    bugfix: 'Bug修复',
    security: '安全更新',
    performance: '性能优化',
    other: '其他'
  };
  return typeMap[type] || '未知';
};

// 获取时间线项目类型
const getTimelineItemType = (action: string) => {
  const actionMap: Record<string, string> = {
    '创建版本': 'primary',
    '状态变更': 'success',
    '锁定版本': 'warning',
    '解锁版本': 'info'
  };
  return actionMap[action] || 'default';
};

// 加载版本信息
const loadVersionInfo = () => {
  // 模拟API请求获取版本信息
  // 实际项目中应该调用API获取数据
};

// 编辑版本
const handleEdit = () => {
  if (versionInfo.locked) {
    ElMessage.warning('版本已锁定，无法编辑');
    return;
  }
  ElMessage.info('编辑版本信息');
};

// 锁定版本
const handleLockVersion = () => {
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
    versionInfo.locked = true;
    statusHistory.value.unshift({
      time: new Date().toLocaleString(),
      user: '当前用户',
      action: '锁定版本',
      from: '',
      to: '',
      comment: '手动锁定版本'
    });
    ElMessage.success('锁定成功');
  }).catch(() => {
    // 取消锁定
  });
};

// 解锁版本
const handleUnlockVersion = () => {
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
    versionInfo.locked = false;
    statusHistory.value.unshift({
      time: new Date().toLocaleString(),
      user: '当前用户',
      action: '解锁版本',
      from: '',
      to: '',
      comment: '手动解锁版本'
    });
    ElMessage.success('解锁成功');
  }).catch(() => {
    // 取消解锁
  });
};

// 查看依赖
const viewDependency = (productId: string, versionId: string) => {
  router.push(`/versions/${versionId}`);
};

// 打开状态变更对话框
const openStatusChangeDialog = () => {
  statusForm.targetStatus = '';
  statusForm.comment = '';
  statusDialogVisible.value = true;
};

// 确认状态变更
const confirmStatusChange = () => {
  if (!statusForm.targetStatus) {
    ElMessage.warning('请选择目标状态');
    return;
  }
  
  statusChanging.value = true;
  
  // 模拟API请求
  setTimeout(() => {
    const oldStatus = versionInfo.status;
    versionInfo.status = statusForm.targetStatus;
    
    // 添加状态变更记录
    statusHistory.value.unshift({
      time: new Date().toLocaleString(),
      user: '当前用户',
      action: '状态变更',
      from: oldStatus,
      to: statusForm.targetStatus,
      comment: statusForm.comment
    });
    
    statusChanging.value = false;
    statusDialogVisible.value = false;
    ElMessage.success('状态变更成功');
  }, 1000);
};

onMounted(() => {
  loadVersionInfo();
});
</script>

<style scoped>
.version-detail {
  width: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.timeline-content {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.timeline-comment {
  width: 100%;
  margin-top: 4px;
  color: #666;
  font-size: 13px;
}
</style>