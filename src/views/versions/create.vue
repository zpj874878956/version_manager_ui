<template>
  <div class="version-create">
    <!-- 面包屑导航 - 显示当前页面在网站层级结构中的位置 -->
    <div class="breadcrumb mb-4">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: '/products' }">产品列表</el-breadcrumb-item>
        <el-breadcrumb-item :to="{ path: `/products/${productId}` }">产品详情</el-breadcrumb-item>
        <el-breadcrumb-item>创建版本</el-breadcrumb-item>
      </el-breadcrumb>
    </div>

    <!-- 创建版本表单卡片 - 包含所有版本创建相关的表单字段 -->
    <el-card>
      <template #header>
        <div class="card-header">
          <h3 class="text-lg font-bold">创建新版本</h3>
        </div>
      </template>

      <el-form 
        ref="versionFormRef" 
        :model="versionForm" 
        :rules="versionRules" 
        label-width="120px" 
        class="version-form"
      >
        <!-- 基本信息部分 - 包含版本的基础属性 -->
        <h4 class="form-section-title">基本信息</h4>
        <el-divider />

        <el-form-item label="所属产品" prop="productId">
          <el-select v-model="versionForm.productId" placeholder="请选择产品" disabled>
            <el-option :label="productName" :value="productId" />
          </el-select>
        </el-form-item>

        <el-form-item label="版本号" prop="version">
          <el-input v-model="versionForm.version" placeholder="请输入版本号，例如：1.0.0" />
          <div class="form-item-tip">遵循语义化版本规范 (SemVer)，格式为：主版本号.次版本号.修订号</div>
        </el-form-item>

        <el-form-item label="版本名称" prop="name">
          <el-input v-model="versionForm.name" placeholder="请输入版本名称" />
        </el-form-item>

        <el-form-item label="版本描述" prop="description">
          <el-input 
            v-model="versionForm.description" 
            type="textarea" 
            :rows="4" 
            placeholder="请输入版本描述，包括主要功能、改进和修复的问题等"
          />
        </el-form-item>

        <!-- 发布信息部分 - 包含版本发布相关的属性 -->
        <h4 class="form-section-title mt-6">发布信息</h4>
        <el-divider />

        <el-form-item label="计划发布日期" prop="releaseDate">
          <el-date-picker 
            v-model="versionForm.releaseDate" 
            type="date" 
            placeholder="选择计划发布日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>

        <el-form-item label="发布类型" prop="releaseType">
          <el-select v-model="versionForm.releaseType" placeholder="请选择发布类型">
            <el-option label="功能更新" value="feature" />
            <el-option label="Bug修复" value="bugfix" />
            <el-option label="安全更新" value="security" />
            <el-option label="性能优化" value="performance" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>

        <el-form-item label="发布说明" prop="releaseNotes">
          <el-input 
            v-model="versionForm.releaseNotes" 
            type="textarea" 
            :rows="4" 
            placeholder="请输入发布说明，将展示给用户"
          />
        </el-form-item>

        <!-- 文件信息部分 - 上传与版本相关的文件 -->
        <h4 class="form-section-title mt-6">文件信息</h4>
        <el-divider />

        <el-form-item label="上传文件">
          <el-upload
            class="upload-demo"
            drag
            action="#"
            :auto-upload="false"
            :on-change="handleFileChange"
            :file-list="fileList"
            :on-remove="handleFileRemove"
            multiple
          >
            <el-icon class="el-icon--upload"><Upload /></el-icon>
            <div class="el-upload__text">
              拖拽文件到此处或 <em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                请选择与版本相关的文件，创建版本后将自动上传
              </div>
            </template>
          </el-upload>
        </el-form-item>

        <!-- 提交按钮 -->
        <el-form-item class="form-buttons">
          <el-button type="primary" @click="submitForm" :loading="submitting">创建版本</el-button>
          <el-button @click="cancelCreate">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Upload } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { FormInstance, FormRules, UploadFile, UploadUserFile } from 'element-plus';
import versionApi from '@/api/version';
import productApi from '@/api/product';
import fileApi from '@/api/file';

const route = useRoute();
const router = useRouter();
const versionFormRef = ref<FormInstance>(); // 表单引用，用于表单验证
const submitting = ref(false); // 提交状态标记

// 获取产品ID，优先从路由参数获取，其次从查询参数获取，如果都没有则使用默认值
const productId = ref(route.params.id as string || route.query.productId as string || 'PRD-001');
const productName = ref('智能家居控制系统'); // 默认产品名称

// 文件列表
const fileList = ref<UploadUserFile[]>([]);
const uploadFiles = ref<File[]>([]);

// 版本表单数据 - 包含创建版本所需的所有字段
const versionForm = reactive({
  productId: productId.value,
  version: '',
  name: '',
  description: '',
  releaseDate: '',
  releaseType: 'feature',
  releaseNotes: ''
});

// 表单验证规则 - 定义各字段的验证条件
const versionRules = reactive<FormRules>({
  version: [
    { required: true, message: '请输入版本号', trigger: 'blur' },
    { pattern: /^\d+\.\d+\.\d+$/, message: '版本号格式不正确，应为x.y.z格式', trigger: 'blur' }
  ],
  name: [
    { required: true, message: '请输入版本名称', trigger: 'blur' }
  ],
  description: [
    { required: true, message: '请输入版本描述', trigger: 'blur' }
  ],
  releaseDate: [
    { required: true, message: '请选择计划发布日期', trigger: 'change' }
  ],
  releaseType: [
    { required: true, message: '请选择发布类型', trigger: 'change' }
  ]
});

/**
 * 处理文件选择变化事件
 * @param file 选择的文件
 */
const handleFileChange = (uploadInfo: UploadFile) => {
  if (uploadInfo.raw) {
    uploadFiles.value.push(uploadInfo.raw);
  }
};

/**
 * 处理文件移除事件
 * @param file 移除的文件
 */
const handleFileRemove = (file: UploadFile) => {
  const index = uploadFiles.value.findIndex(item => item.name === file.name);
  if (index > -1) {
    uploadFiles.value.splice(index, 1);
  }
};

/**
 * 上传文件
 * @param versionId 版本ID
 */
const uploadVersionFiles = async (versionId: number) => {
  if (uploadFiles.value.length === 0) return;
  
  const uploadPromises = uploadFiles.value.map(file => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('version_id', String(versionId));
    formData.append('uploader_id', localStorage.getItem('userId') || '1');
    formData.append('filename', file.name);
    
    return fileApi.uploadFile(formData);
  });
  
  try {
    await Promise.all(uploadPromises);
    ElMessage.success('文件上传成功');
  } catch (error) {
    console.error('文件上传失败:', error);
    ElMessage.warning('部分文件上传失败，请在版本详情页重新上传');
  }
};

/**
 * 提交表单 - 创建新版本
 */
const submitForm = async () => {
  if (!versionFormRef.value) return;
  
  await versionFormRef.value.validate(async (valid, fields) => {
    if (valid) {
      submitting.value = true;
      
      try {
        // 准备版本数据
        const versionData = {
          product_id: Number(productId.value),
          version_number: versionForm.version,
          name: versionForm.name,
          description: versionForm.description,
          release_notes: versionForm.releaseNotes,
          release_date: versionForm.releaseDate,
          release_type: versionForm.releaseType,
          author_id: Number(localStorage.getItem('userId') || '1')
        };
        
        // 调用API创建版本
        const response = await versionApi.createVersion(versionData);
        const versionId = response.data?.id || response.data?.data?.id;
        
        // 上传文件
        if (versionId) {
          await uploadVersionFiles(versionId);
        }
        
        ElMessage.success('版本创建成功');
        router.push(`/products/${productId.value}`);
      } catch (error) {
        console.error('创建版本失败:', error);
        ElMessage.error('创建版本失败，请稍后重试');
      } finally {
        submitting.value = false;
      }
    } else {
      console.log('表单验证失败', fields);
    }
  });
};

/**
 * 取消创建 - 提示用户确认后返回产品详情页
 */
const cancelCreate = () => {
  ElMessageBox.confirm(
    '确定要取消创建吗？已填写的内容将不会保存。',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '继续编辑',
      type: 'warning',
    }
  ).then(() => {
    router.push(`/products/${productId.value}`);
  }).catch(() => {
    // 继续编辑
  });
};

/**
 * 加载产品信息 - 获取当前产品信息
 */
const loadProductInfo = async () => {
  try {
    // 加载产品信息
    if (productId.value) {
      const productResponse = await productApi.getProduct(productId.value);
      if (productResponse.data) {
        productName.value = productResponse.data.name;
      }
    }
  } catch (error) {
    console.error('加载产品信息失败:', error);
    ElMessage.error('加载产品信息失败，请稍后重试');
  }
};

// 组件挂载时加载产品信息
onMounted(() => {
  loadProductInfo();
});
</script>

<style scoped>
.version-create {
  width: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.version-form {
  max-width: 800px;
}

.form-section-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.form-item-tip {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.form-buttons {
  margin-top: 30px;
}
</style>