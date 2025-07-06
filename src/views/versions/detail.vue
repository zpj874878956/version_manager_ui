<template>
  <div class="version-detail">
    <!-- 面包屑导航 - 显示当前页面在网站层级结构中的位置 -->
    <div class="breadcrumb mb-4">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: '/products' }">产品列表</el-breadcrumb-item>
        <el-breadcrumb-item :to="{ path: `/products/${productId || versionInfo.productId}` }">产品详情</el-breadcrumb-item>
        <el-breadcrumb-item>版本详情</el-breadcrumb-item>
      </el-breadcrumb>
    </div>

    <!-- 版本信息卡片 - 展示版本的基本信息和状态 -->
    <el-card class="mb-4">
      <template #header>
        <div class="card-header">
          <h3 class="text-lg font-bold">版本信息</h3>
          <div class="header-actions">
            <el-button type="primary" size="small" @click="handleEdit" v-if="!versionInfo.locked">
              <el-icon><Edit /></el-icon> 编辑
            </el-button>
            <el-button type="danger" size="small" @click="handleLockVersion" v-if="!versionInfo.locked">
              <el-icon><Lock /></el-icon> 锁定
            </el-button>
            <el-button type="success" size="small" @click="handleUnlockVersion" v-else>
              <el-icon><Unlock /></el-icon> 解锁
            </el-button>
            <el-button type="info" size="small" @click="showDebug = !showDebug">
              调试
            </el-button>
          </div>
        </div>
      </template>
      <div class="version-info">
        <el-descriptions :column="3" border>
          <el-descriptions-item label="版本号">{{ versionInfo.version }}</el-descriptions-item>
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
          <el-descriptions-item label="版本描述" :span="3">
            {{ versionInfo.description }}
          </el-descriptions-item>
          <el-descriptions-item label="发布说明" :span="3">
            {{ versionInfo.releaseNotes }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
      
      <!-- 调试信息显示区域 -->
      <div v-if="showDebug" class="debug-info">
        <h3>调试信息</h3>
        <p>版本ID: {{ versionId }}</p>
        <p>产品ID (路由参数): {{ productId }}</p>
        <p>产品ID (版本信息): {{ versionInfo.productId }}</p>
        <pre>{{ JSON.stringify(versionInfo, null, 2) }}</pre>
      </div>
    </el-card>

    <!-- 依赖信息卡片 - 展示当前版本依赖的其他产品版本 -->
    <el-card class="mb-4">
      <template #header>
        <div class="card-header">
          <h3 class="text-lg font-bold">文件信息</h3>
          <div class="header-actions">
            <el-button type="primary" size="small" @click="handleUpload" v-if="!versionInfo.locked">
              <el-icon><Upload /></el-icon> 上传文件
            </el-button>
          </div>
        </div>
      </template>
      <div v-if="fileList.length > 0">
        <el-table :data="fileList" style="width: 100%">
          <el-table-column prop="filename" label="文件名称" />
          <el-table-column prop="file_size" label="文件大小" width="120">
            <template #default="scope">
              {{ formatFileSize(scope.row.file_size) }}
            </template>
          </el-table-column>
          <el-table-column prop="file_type" label="文件类型" width="120" />
          <el-table-column prop="upload_time" label="上传时间" width="180" />
          <el-table-column prop="uploader_name" label="上传人" width="120" />
          <el-table-column label="操作" width="180">
            <template #default="scope">
              <el-button link type="primary" @click="handleDownload(scope.row)">
                <el-icon><Download /></el-icon> 下载
              </el-button>
              <el-button link type="danger" @click="handleDeleteFile(scope.row)" v-if="!versionInfo.locked">
                <el-icon><Delete /></el-icon> 删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <el-empty v-else description="暂无文件信息" />
    </el-card>

    <!-- 状态变更历史卡片 - 展示版本状态的变更记录 -->
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

    <!-- 状态变更对话框 - 用于变更版本状态 -->
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

    <!-- 文件上传对话框 -->
    <el-dialog
      v-model="uploadDialogVisible"
      title="上传文件"
      width="500px"
    >
      <el-form label-width="80px">
        <el-form-item label="选择文件">
          <el-upload
            class="upload-demo"
            drag
            action="#"
            :auto-upload="false"
            :limit="1"
            :on-change="handleFileChange"
          >
            <el-icon class="el-icon--upload"><Upload /></el-icon>
            <div class="el-upload__text">
              拖拽文件到此处或 <em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                请选择要上传的文件
              </div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="uploadDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmUpload" :loading="uploadLoading">
            确认上传
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Edit, Lock, Unlock, Upload, Download, Delete } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import versionApi from '@/api/version';
import userApi from '@/api/user';
import fileApi from '@/api/file';

const route = useRoute();
const router = useRouter();

// 获取路由参数
// 版本ID - 优先使用路由参数中的versionId，其次使用id
const versionId = route.params.versionId as string || route.params.id as string;
// 产品ID - 从路由参数获取
const productId = ref(route.params.productId as string);

// 状态变更对话框相关变量
const statusDialogVisible = ref(false); // 对话框显示状态
const statusChanging = ref(false); // 状态变更中标记
const statusForm = reactive({
  targetStatus: '',
  comment: ''
});

// 版本信息（模拟数据）- 包含版本的所有详细信息
const versionInfo = reactive({
  id: '',
  productId: '',
  version: '',
  creator: '',
  createTime: '',
  updateTime: '',
  status: '',
  locked: false,
  releaseDate: '',
  description: '',
  releaseNotes: '',
  dependencies: []
});

// 调试开关
const showDebug = ref(false);

// 状态变更历史（模拟数据）- 记录版本状态的所有变更
const statusHistory = ref<any[]>([]);

// 文件上传对话框相关变量
const uploadDialogVisible = ref(false);
const uploadLoading = ref(false);
const uploadFile = ref<File | null>(null);
const fileList = ref<any[]>([]);

/**
 * 计算可用的状态选项 - 根据当前状态返回可选的下一个状态
 */
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
 * 获取时间线项目类型 - 根据操作类型返回对应的时间线项目类型
 * @param action 操作类型
 * @returns 时间线项目类型
 */
const getTimelineItemType = (action: string) => {
  const actionMap: Record<string, string> = {
    '创建版本': 'primary',
    '状态变更': 'success',
    '锁定版本': 'warning',
    '解锁版本': 'info'
  };
  return actionMap[action] || 'default';
};

/**
 * 加载版本信息 - 从API获取版本详情
 */
const loadVersionInfo = async () => {
  try {
    const res = await versionApi.getVersion(versionId);
    const data = res.data?.data || res.data;
    if (data) {
      versionInfo.id = data.id;
      versionInfo.productId = data.product_id;
      versionInfo.version = data.version_number;
      versionInfo.createTime = data.created_at;
      versionInfo.updateTime = data.updated_at;
      versionInfo.status = data.status;
      versionInfo.locked = data.lock_status;
      versionInfo.releaseDate = data.released_at;
      versionInfo.description = data.description;
      versionInfo.releaseNotes = data.release_notes;
      versionInfo.dependencies = data.dependencies || [];
      
      // 更新productId的值，确保使用API返回的产品ID
      if (data.product_id) {
        productId.value = String(data.product_id);
        console.log('从API获取到产品ID，更新productId:', productId.value);
      }
      
      // 获取创建人
      if (data.author_id) {
        const userRes = await userApi.getUser(data.author_id);
        versionInfo.creator = userRes.data?.name || userRes.data?.username || '未知';
      } else {
        versionInfo.creator = '未知';
      }
    }
  } catch (e) {
    versionInfo.creator = '未知';
  }
};

/**
 * 加载状态变更历史 - 从API获取状态变更历史
 */
const loadStatusHistory = async () => {
  try {
    const res = await versionApi.getVersionStatusHistory(versionId);
    const data = res.data?.data;
    
    if (data && data.history) {
      statusHistory.value = data.history.map((item: any) => {
        // 解析details字符串为对象
        let details: any = {};
        try {
          details = JSON.parse(item.details);
        } catch (e) {
          console.error('解析状态变更详情失败:', e);
        }
        
        // 根据操作类型构建状态变更记录
        const record: any = {
          time: item.operation_time,
          user: item.operator_name,
          action: item.operation_type,
          comment: ''
        };
        
        // 根据不同操作类型处理详情
        if (item.operation_type === '创建') {
          record.to = details.status || '';
          record.comment = details.description || '';
        } else if (item.operation_type === '状态变更' && details.changes?.status) {
          record.from = details.changes.status.old || '';
          record.to = details.changes.status.new || '';
        } else if (item.operation_type === '锁定版本' || item.operation_type === '解锁版本') {
          // 锁定/解锁操作不需要from和to
        }
        
        return record;
      });
    }
  } catch (error) {
    console.error('获取状态变更历史失败:', error);
    ElMessage.error('获取状态变更历史失败');
  }
};

/**
 * 编辑版本 - 处理编辑按钮点击事件
 */
const handleEdit = () => {
  if (versionInfo.locked) {
    ElMessage.warning('版本已锁定，无法编辑');
    return;
  }
  
  // 确保使用正确的产品ID
  const actualProductId = productId.value || versionInfo.productId;
  console.log('编辑版本，使用产品ID:', actualProductId);
  
  if (actualProductId) {
    router.push(`/products/${actualProductId}/versions/${versionInfo.id}/edit`);
  } else {
    router.push(`/versions/${versionInfo.id}/edit`);
  }
};

/**
 * 锁定版本 - 处理锁定按钮点击事件
 */
const handleLockVersion = async () => {
  ElMessageBox.confirm(
    '确定要锁定该版本吗？锁定后将无法修改版本信息。',
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(async () => {
    try {
      await versionApi.updateVersion(versionId, { lock_status: true });
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
      loadVersionInfo();
    } catch (error) {
      ElMessage.error('锁定失败');
    }
  }).catch(() => {
    // 取消锁定
  });
};

/**
 * 解锁版本 - 处理解锁按钮点击事件
 */
const handleUnlockVersion = async () => {
  ElMessageBox.confirm(
    '确定要解锁该版本吗？',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info',
    }
  ).then(async () => {
    try {
      await versionApi.updateVersion(versionId, { lock_status: false });
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
      loadVersionInfo();
    } catch (error) {
      ElMessage.error('解锁失败');
    }
  }).catch(() => {
    // 取消解锁
  });
};

/**
 * 格式化文件大小
 * @param size 文件大小（字节）
 * @returns 格式化后的文件大小
 */
const formatFileSize = (size: number) => {
  if (!size) return '0 KB';
  
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i++;
  }
  
  return `${size.toFixed(2)} ${units[i]}`;
};

/**
 * 加载文件列表 - 获取版本相关的所有文件
 */
const loadFileList = async () => {
  try {
    const res = await fileApi.getVersionFiles(versionId);
    const data = res.data?.data || res.data || [];
    
    // 处理文件列表数据
    fileList.value = await Promise.all(data.map(async (file: any) => {
      let uploaderName = '未知';
      
      // 获取上传者信息
      if (file.uploader_id) {
        try {
          const userRes = await userApi.getUser(file.uploader_id);
          uploaderName = userRes.data?.name || userRes.data?.username || '未知';
        } catch (e) {
          console.error('获取上传者信息失败:', e);
        }
      }
      
      // 优先用created_at作为上传时间
      return {
        ...file,
        uploader_name: uploaderName,
        upload_time: file.created_at || file.upload_time || ''
      };
    }));
  } catch (error) {
    console.error('获取文件列表失败:', error);
    ElMessage.error('获取文件列表失败');
  }
};

/**
 * 处理上传按钮点击事件
 */
const handleUpload = () => {
  uploadFile.value = null;
  uploadDialogVisible.value = true;
};

/**
 * 处理文件选择变化事件
 * @param file 选择的文件
 */
const handleFileChange = (uploadInfo: any) => {
  if (uploadInfo.raw) {
    uploadFile.value = uploadInfo.raw;
  }
};

/**
 * 确认上传文件
 */
const confirmUpload = async () => {
  if (!uploadFile.value) {
    ElMessage.warning('请选择要上传的文件');
    return;
  }
  
  uploadLoading.value = true;
  
  try {
    const formData = new FormData();
    // 保留原始文件名
    const file = uploadFile.value;
    formData.append('file', file);
    formData.append('version_id', versionId);
    formData.append('uploader_id', '1'); // 这里应该使用当前登录用户的ID
    // 添加原始文件名
    formData.append('filename', file.name);
    
    await fileApi.uploadFile(formData);
    
    ElMessage.success('文件上传成功');
    uploadDialogVisible.value = false;
    loadFileList(); // 重新加载文件列表
  } catch (error) {
    console.error('文件上传失败:', error);
    ElMessage.error('文件上传失败');
  } finally {
    uploadLoading.value = false;
  }
};

/**
 * 处理下载按钮点击事件
 * @param file 要下载的文件信息
 */
const handleDownload = async (file: any) => {
  try {
    const response = await fileApi.downloadFile(file.id);
    let filename = file.filename;
    // 尝试从响应头获取文件名
    const disposition = response.headers && response.headers['content-disposition'];
    if (disposition) {
      const match = disposition.match(/filename\*=UTF-8''([^;]+)/);
      if (match && match[1]) {
        filename = decodeURIComponent(match[1]);
      } else {
        const match2 = disposition.match(/filename="?([^";]+)"?/);
        if (match2 && match2[1]) filename = match2[1];
      }
    }
    // 创建下载链接
    const blob = response.data instanceof Blob ? response.data : new Blob([response.data]);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    ElMessage.success('文件下载成功');
  } catch (error) {
    console.error('文件下载失败:', error);
    ElMessage.error('文件下载失败');
  }
};

/**
 * 处理删除文件按钮点击事件
 * @param file 要删除的文件信息
 */
const handleDeleteFile = (file: any) => {
  ElMessageBox.confirm(
    `确定要删除文件 ${file.filename} 吗？`,
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(async () => {
    try {
      await fileApi.deleteFile(file.id);
      ElMessage.success('文件删除成功');
      loadFileList(); // 重新加载文件列表
    } catch (error) {
      console.error('文件删除失败:', error);
      ElMessage.error('文件删除失败');
    }
  }).catch(() => {
    // 取消删除
  });
};

/**
 * 确认状态变更 - 处理状态变更确认事件
 */
const confirmStatusChange = async () => {
  if (!statusForm.targetStatus) {
    ElMessage.warning('请选择目标状态');
    return;
  }
  
  statusChanging.value = true;
  
  try {
    // 调用API更新版本状态
    await versionApi.updateVersion(versionId, { 
      status: statusForm.targetStatus,
      release_notes: statusForm.comment // 使用release_notes字段存储状态变更备注
    });
    
    // 更新本地状态
    versionInfo.status = statusForm.targetStatus;
    
    // 重新加载状态变更历史
    await loadStatusHistory();
    
    statusChanging.value = false;
    statusDialogVisible.value = false;
    ElMessage.success('状态变更成功');
  } catch (error) {
    console.error('状态变更失败:', error);
    ElMessage.error('状态变更失败');
    statusChanging.value = false;
  }
};

// 组件挂载时加载版本信息
onMounted(() => {
  loadVersionInfo();
  loadFileList();
  loadStatusHistory();
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

.pagination {
  padding: 16px 0;
  display: flex;
  justify-content: flex-end;
}

.debug-info {
  margin-top: 20px;
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
  font-size: 12px;
}

.debug-info pre {
  white-space: pre-wrap;
  word-break: break-all;
  margin-top: 10px;
  background-color: #ebeef5;
  padding: 10px;
  border-radius: 4px;
}

.timeline-content {
  font-size: 13px;
}
</style>