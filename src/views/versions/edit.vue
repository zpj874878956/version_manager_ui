<template>
  <div class="page-container">
    <!-- 面包屑导航 -->
    <div class="breadcrumb mb-4">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: '/products' }">产品列表</el-breadcrumb-item>
        <el-breadcrumb-item :to="{ path: `/products/${productId}` }" v-if="productId">产品详情</el-breadcrumb-item>
        <el-breadcrumb-item :to="{ path: '/versions' }" v-else>版本列表</el-breadcrumb-item>
        <el-breadcrumb-item :to="{ path: `/versions/${versionId}` }" v-if="versionId">版本详情</el-breadcrumb-item>
        <el-breadcrumb-item>编辑版本</el-breadcrumb-item>
      </el-breadcrumb>
    </div>

    <!-- 页面标题 -->
    <div class="page-header">
      <h2 class="page-title">{{ versionId ? '编辑版本信息' : '创建新版本' }}</h2>
      <el-button size="small" type="info" @click="debugInfo.showDebug = !debugInfo.showDebug">
        {{ debugInfo.showDebug ? '隐藏调试信息' : '显示调试信息' }}
      </el-button>
    </div>

    <!-- 调试信息区域 -->
    <el-card class="debug-card" v-if="debugInfo.showDebug">
      <template #header>
        <div class="card-header">
          <h3>调试信息</h3>
        </div>
      </template>
      <div class="debug-content">
        <h4>API原始响应:</h4>
        <pre>{{ JSON.stringify(debugInfo.apiResponse, null, 2) }}</pre>
        <h4>处理后的数据:</h4>
        <pre>{{ JSON.stringify(debugInfo.processedData, null, 2) }}</pre>
        <h4>表单数据:</h4>
        <pre>{{ JSON.stringify(versionForm, null, 2) }}</pre>
      </div>
    </el-card>

    <!-- 编辑表单 -->
    <el-card class="form-card">
      <el-form
        v-loading="loading"
        :model="versionForm"
        :rules="rules"
        ref="versionFormRef"
        label-width="120px"
        label-position="right"
        status-icon
      >
        <el-form-item label="所属产品" prop="product_id" v-if="!productId">
          <el-select 
            v-model="versionForm.product_id" 
            placeholder="请选择所属产品"
            filterable
            :disabled="!!versionId"
          >
            <el-option 
              v-for="item in productOptions" 
              :key="item.id" 
              :label="item.name" 
              :value="item.id" 
            />
          </el-select>
          <div class="form-tip" v-if="versionId">版本创建后不可更改所属产品</div>
        </el-form-item>
        
        <el-form-item label="版本号" prop="version_number">
          <el-input 
            v-model="versionForm.version_number" 
            placeholder="请输入版本号，例如：1.0.0" 
            :disabled="!!versionId"
          />
          <div class="form-tip" v-if="versionId">版本号创建后不可修改</div>
        </el-form-item>
        
        <el-form-item label="版本名称" prop="name">
          <el-input v-model="versionForm.name" placeholder="请输入版本名称" />
        </el-form-item>
        
        <el-form-item label="版本描述" prop="description">
          <el-input
            v-model="versionForm.description"
            type="textarea"
            rows="3"
            placeholder="请输入版本描述"
          />
        </el-form-item>
        
        <el-form-item label="发布说明" prop="release_notes">
          <el-input
            v-model="versionForm.release_notes"
            type="textarea"
            rows="5"
            placeholder="请输入发布说明，支持Markdown格式"
          />
        </el-form-item>
        
        <el-form-item label="状态" prop="status">
          <el-select v-model="versionForm.status" placeholder="请选择状态">
            <el-option label="开发中" value="developing" />
            <el-option label="测试中" value="testing" />
            <el-option label="已发布" value="released" />
            <el-option label="已废弃" value="deprecated" />
          </el-select>
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="submitForm" :loading="submitting">保存</el-button>
          <el-button @click="goBack">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import type { FormInstance } from 'element-plus';
import versionApi from '@/api/version';
import productApi from '@/api/product';
import type { Version } from '@/api/version';
import type { Product } from '@/api/product';

const route = useRoute();
const router = useRouter();
const versionId = route.params.versionId as string || route.params.id as string;
const productId = route.params.productId as string;

// 表单引用
const versionFormRef = ref<FormInstance>();
const loading = ref(false);
const submitting = ref(false);

// 产品选项
const productOptions = ref<{ id: number; name: string }[]>([]);

// 版本表单数据
const versionForm = reactive({
  product_id: productId ? parseInt(productId, 10) : undefined,
  version_number: '',
  name: '',
  description: '',
  release_notes: '',
  status: 'developing',
  author_id: 1 // 默认作者ID，实际应用中应该从登录用户信息中获取
});

// 调试信息 - 显示原始API响应
const debugInfo = ref({
  showDebug: false,
  apiResponse: null as any,
  processedData: null as any
});

// 表单验证规则
const rules = {
  product_id: [
    { required: true, message: '请选择所属产品', trigger: 'change' }
  ],
  version_number: [
    { required: true, message: '请输入版本号', trigger: 'blur' },
    { pattern: /^\d+\.\d+\.\d+(\-[a-zA-Z0-9\.]+)?$/, message: '版本号格式不正确，应为x.y.z或x.y.z-suffix格式', trigger: 'blur' }
  ],
  name: [
    { required: true, message: '请输入版本名称', trigger: 'blur' }
  ],
  status: [
    { required: true, message: '请选择版本状态', trigger: 'change' }
  ]
};

// 加载产品列表
const loadProductOptions = async () => {
  try {
    const response = await productApi.getProducts();
    let products: Product[] = [];
    
    // 处理不同的响应格式
    if (Array.isArray(response)) {
      products = response;
    } else if (response && response.data && Array.isArray(response.data)) {
      products = response.data;
    } else if (response && typeof response === 'object') {
      const resp = response as any;
      if (resp.items) {
        products = resp.items;
      } else if (resp.list) {
        products = resp.list;
      } else if (resp.products) {
        products = resp.products;
      }
    }
    
    productOptions.value = products.map(p => ({
      id: p.id as number,
      name: p.name
    }));
  } catch (error) {
    console.error('获取产品列表失败:', error);
    ElMessage.error('获取产品列表失败');
  }
};

// 加载版本数据
const loadVersionData = async () => {
  if (!versionId) return;
  
  loading.value = true;
  try {
    console.log('正在加载版本数据，版本ID:', versionId);
    const response = await versionApi.getVersion(versionId);
    console.log('API返回的版本数据:', response);
    
    // 保存原始响应用于调试
    debugInfo.value.apiResponse = response;
    
    let versionData: any = {};
    
    // 处理不同的响应格式
    if (response && typeof response === 'object') {
      if (response.data && typeof response.data === 'object') {
        if (response.data.data && typeof response.data.data === 'object') {
          // 嵌套在data.data中的情况
          versionData = response.data.data;
        } else {
          // 嵌套在data中的情况
          versionData = response.data;
        }
      } else {
        // 直接在response中的情况
        versionData = response;
      }
    }
    
    // 保存处理后的数据用于调试
    debugInfo.value.processedData = versionData;
    console.log('处理后的版本数据:', versionData);
    
    // 从版本详情页面获取的数据结构中提取相关字段
    if (versionData) {
      // 版本号 - 可能有不同的字段名
      versionForm.version_number = versionData.version_number || versionData.version || '';
      
      // 版本名称 - 可能有不同的字段名
      versionForm.name = versionData.name || versionData.title || '';
      
      // 版本描述 - 可能有不同的字段名
      versionForm.description = versionData.description || versionData.desc || '';
      
      // 发布说明 - 可能有不同的字段名
      versionForm.release_notes = versionData.release_notes || versionData.releaseNotes || '';
      
      // 状态 - 可能有不同的字段名
      versionForm.status = versionData.status || 'developing';
      
      // 产品ID - 可能有不同的字段名
      const productIdValue = versionData.product_id || versionData.productId;
      if (productIdValue) {
        versionForm.product_id = Number(productIdValue);
        console.log('从API获取到产品ID:', versionForm.product_id);
      } else {
        console.log('API中没有产品ID，使用路由参数中的产品ID:', productId);
        versionForm.product_id = productId ? parseInt(productId, 10) : undefined;
      }
    }
    
    console.log('填充后的表单数据:', versionForm);
  } catch (error) {
    console.error('获取版本数据失败:', error);
    ElMessage.error('获取版本数据失败');
  } finally {
    loading.value = false;
  }
};

// 提交表单
const submitForm = async () => {
  if (!versionFormRef.value) return;
  
  await versionFormRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true;
      try {
        // 确保产品ID是数字类型
        if (versionForm.product_id && typeof versionForm.product_id === 'string') {
          versionForm.product_id = parseInt(versionForm.product_id, 10);
        }
        
        if (versionId) {
          // 更新现有版本
          const updateData = { ...versionForm };
          // 产品ID不可更改，但需要保存起来用于返回
          const savedProductId = updateData.product_id;
          delete updateData.product_id;
          
          await versionApi.updateVersion(versionId, updateData);
          ElMessage.success('更新版本成功');
          
          // 恢复产品ID，用于返回
          versionForm.product_id = savedProductId;
        } else {
          // 创建新版本
          await versionApi.createVersion(versionForm as unknown as Version);
          ElMessage.success('创建版本成功');
        }
        goBack();
      } catch (error) {
        console.error('保存版本失败:', error);
        ElMessage.error('保存版本失败');
      } finally {
        submitting.value = false;
      }
    }
  });
};

// 返回上一页
const goBack = () => {
  // 优先使用表单中的产品ID，因为它可能是从API加载的
  const actualProductId = versionForm.product_id;
  
  console.log('返回上一页，使用产品ID:', actualProductId, '版本ID:', versionId);
  
  if (versionId && actualProductId) {
    router.push(`/products/${actualProductId}/versions/${versionId}`);
  } else if (versionId) {
    router.push(`/versions/${versionId}`);
  } else if (actualProductId) {
    router.push(`/products/${actualProductId}`);
  } else {
    router.push('/versions');
  }
};

// 页面加载时获取数据
onMounted(() => {
  if (!productId) {
    loadProductOptions();
  }
  if (versionId) {
    loadVersionData();
  }
});
</script>

<style scoped>
.page-container {
  padding: 20px;
}

.page-header {
  margin-bottom: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.form-card {
  margin-top: 20px;
}

.debug-card {
  margin-bottom: 20px;
}

.debug-content {
  max-height: 400px;
  overflow-y: auto;
}

.debug-content pre {
  background-color: #f5f7fa;
  padding: 10px;
  border-radius: 4px;
  white-space: pre-wrap;
  word-break: break-all;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  line-height: 1.2;
  margin-top: 4px;
}
</style> 