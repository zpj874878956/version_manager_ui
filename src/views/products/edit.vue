<template>
  <div class="page-container">
    <!-- 面包屑导航 -->
    <div class="breadcrumb mb-4">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: '/products' }">产品列表</el-breadcrumb-item>
        <el-breadcrumb-item :to="{ path: `/products/${productId}` }">产品详情</el-breadcrumb-item>
        <el-breadcrumb-item>编辑产品</el-breadcrumb-item>
      </el-breadcrumb>
    </div>

    <!-- 页面标题 -->
    <div class="page-header">
      <h2 class="page-title">编辑产品信息</h2>
    </div>

    <!-- 编辑表单 -->
    <el-card class="form-card">
      <el-form
        v-loading="loading"
        :model="productForm"
        :rules="rules"
        ref="productFormRef"
        label-width="120px"
        label-position="right"
        status-icon
      >
        <el-form-item label="产品名称" prop="name">
          <el-input v-model="productForm.name" placeholder="请输入产品名称" />
        </el-form-item>
        
        <el-form-item label="产品代码" prop="code">
          <el-input v-model="productForm.code" placeholder="请输入产品代码" :disabled="!!productId" />
          <div class="form-tip" v-if="productId">产品代码创建后不可修改</div>
        </el-form-item>
        
        <el-form-item label="产品描述" prop="description">
          <el-input
            v-model="productForm.description"
            type="textarea"
            rows="4"
            placeholder="请输入产品描述"
          />
        </el-form-item>
        
        <el-form-item label="状态" prop="status">
          <el-select v-model="productForm.status" placeholder="请选择状态">
            <el-option label="开发中" value="developing" />
            <el-option label="已发布" value="published" />
            <el-option label="已归档" value="archived" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="负责人" prop="owner">
          <el-input v-model="productForm.owner" placeholder="请输入负责人姓名" />
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
import { ElMessage, ElMessageBox } from 'element-plus';
import type { FormInstance } from 'element-plus';
import productApi from '@/api/product';
import type { Product } from '@/api/product';

const route = useRoute();
const router = useRouter();
const productId = route.params.id as string;

// 表单引用
const productFormRef = ref<FormInstance>();
const loading = ref(false);
const submitting = ref(false);

// 产品表单数据
const productForm = reactive<Product>({
  name: '',
  code: '',
  description: '',
  status: 'developing',
  owner: ''
});

// 表单验证规则
const rules = {
  name: [
    { required: true, message: '请输入产品名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入产品代码', trigger: 'blur' },
    { pattern: /^[A-Z0-9\-_]+$/, message: '只能包含大写字母、数字、下划线和连字符', trigger: 'blur' }
  ],
  status: [
    { required: true, message: '请选择产品状态', trigger: 'change' }
  ]
};

// 加载产品数据
const loadProductData = async () => {
  if (!productId) return;
  
  loading.value = true;
  try {
    const response = await productApi.getProduct(productId);
    let productData: Partial<Product> = {};
    
    // 处理不同的响应格式
    if (response && typeof response === 'object') {
      if (response.data && typeof response.data === 'object') {
        productData = response.data as Partial<Product>;
      } else {
        productData = response as Partial<Product>;
      }
    }
    
    // 填充表单数据
    Object.keys(productForm).forEach(key => {
      const typedKey = key as keyof Product;
      if (productData[typedKey] !== undefined) {
        productForm[typedKey] = productData[typedKey] as any;
      }
    });
    
    // 处理owner字段的兼容性
    if (productData.owner_name && !productForm.owner) {
      productForm.owner = productData.owner_name;
    }
  } catch (error) {
    console.error('获取产品数据失败:', error);
    ElMessage.error('获取产品数据失败');
  } finally {
    loading.value = false;
  }
};

// 提交表单
const submitForm = async () => {
  if (!productFormRef.value) return;
  
  await productFormRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true;
      try {
        if (productId) {
          // 更新现有产品
          await productApi.updateProduct(productId, productForm);
          ElMessage.success('更新产品成功');
        } else {
          // 创建新产品
          await productApi.createProduct(productForm);
          ElMessage.success('创建产品成功');
        }
        goBack();
      } catch (error) {
        console.error('保存产品失败:', error);
        ElMessage.error('保存产品失败');
      } finally {
        submitting.value = false;
      }
    }
  });
};

// 返回上一页
const goBack = () => {
  if (productId) {
    router.push(`/products/${productId}`);
  } else {
    router.push('/products');
  }
};

// 页面加载时获取产品数据
onMounted(() => {
  if (productId) {
    loadProductData();
  }
});
</script>

<style scoped>
.page-container {
  padding: 20px;
}

.page-header {
  margin-bottom: 24px;
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

.form-tip {
  font-size: 12px;
  color: #909399;
  line-height: 1.2;
  margin-top: 4px;
}
</style> 