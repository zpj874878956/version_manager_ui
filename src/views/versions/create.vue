<template>
  <div class="version-create">
    <!-- 面包屑导航 -->
    <div class="breadcrumb mb-4">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: '/products' }">产品列表</el-breadcrumb-item>
        <el-breadcrumb-item :to="{ path: `/products/${productId}` }">产品详情</el-breadcrumb-item>
        <el-breadcrumb-item>创建版本</el-breadcrumb-item>
      </el-breadcrumb>
    </div>

    <!-- 创建版本表单卡片 -->
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
        <!-- 基本信息 -->
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

        <!-- 发布信息 -->
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

        <!-- 依赖信息 -->
        <h4 class="form-section-title mt-6">依赖信息</h4>
        <el-divider />

        <el-form-item label="依赖版本">
          <div v-for="(dependency, index) in versionForm.dependencies" :key="index" class="dependency-item">
            <el-select 
              v-model="dependency.productId" 
              placeholder="选择依赖产品" 
              class="dependency-product"
              @change="(val: number) => { 
                dependency.versionId = ''; 
                loadDependencyVersions(val);
              }"
            >
              <el-option 
                v-for="product in dependencyProducts" 
                :key="product.id" 
                :label="product.name" 
                :value="product.id" 
              />
            </el-select>
            <el-select 
              v-model="dependency.versionId" 
              placeholder="选择版本" 
              class="dependency-version"
              :disabled="!dependency.productId"
              @focus="loadDependencyVersions(dependency.productId)"
            >
              <el-option 
                v-for="version in dependencyVersionsMap[String(dependency.productId)] || []" 
                :key="version.id" 
                :label="version.version" 
                :value="version.id" 
              />
            </el-select>
            <el-button type="danger" circle @click="removeDependency(index)">
              <el-icon><Delete /></el-icon>
            </el-button>
          </div>
          <el-button type="primary" plain @click="addDependency">
            <el-icon><Plus /></el-icon> 添加依赖
          </el-button>
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
import { Plus, Delete } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import versionApi from '@/api/version';
import productApi from '@/api/product';

const route = useRoute();
const router = useRouter();
const versionFormRef = ref<FormInstance>();
const submitting = ref(false);

// 获取产品ID，如果没有则使用默认值
const productId = ref(route.query.productId as string || 'PRD-001');
const productName = ref('智能家居控制系统'); // 默认产品名称

// 版本表单数据
const versionForm = reactive({
  productId: productId.value,
  version: '',
  name: '',
  description: '',
  releaseDate: '',
  releaseType: 'feature',
  releaseNotes: '',
  dependencies: [] as Array<{ productId: number | string; versionId: number | string }>
});

// 表单验证规则
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

// 依赖产品列表
const dependencyProducts = ref<Array<{ id: number; name: string }>>([]);

// 获取依赖产品的版本列表
const dependencyVersionsMap = ref<Record<string, Array<{ id: number; version: string }>>>({});

// 加载依赖产品的版本列表
const loadDependencyVersions = async (productId: string | number) => {
  if (!productId) return;
  
  // 如果已经加载过该产品的版本列表，则直接返回
  if (dependencyVersionsMap.value[String(productId)]) {
    return;
  }
  
  try {
    // 调用API获取产品版本列表
    const response = await productApi.getProductVersions(productId);
    if (response.data && response.data.data) {
      // 处理返回的数据
      const versions = response.data.data.map((item: any) => ({
        id: item.id,
        version: item.version_number || item.version // 兼容不同的API返回格式
      }));
      
      // 缓存版本列表
      dependencyVersionsMap.value[String(productId)] = versions;
    }
  } catch (error) {
    console.error('获取依赖产品版本列表失败:', error);
    ElMessage.warning('获取依赖产品版本列表失败，请稍后重试');
  }
};

// 移除原来的getDependencyVersions函数，因为我们不再需要它
const addDependency = () => {
  versionForm.dependencies.push({ productId: '', versionId: '' });
};

// 移除依赖
const removeDependency = (index: number) => {
  versionForm.dependencies.splice(index, 1);
};

// 提交表单
const submitForm = async () => {
  if (!versionFormRef.value) return;
  
  // 检查依赖项是否完整填写
  const incompleteDependencies = versionForm.dependencies.filter(dep => !dep.productId || !dep.versionId);
  if (incompleteDependencies.length > 0) {
    ElMessage.warning('请完整填写所有依赖项信息或删除未完成的依赖项');
    return;
  }
  
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
          author_id: Number(localStorage.getItem('userId') || '1'),
          dependencies: versionForm.dependencies.map(dep => ({
            product_id: Number(dep.productId),
            version_id: Number(dep.versionId)
          }))
        };
        
        // 调用API创建版本
        await versionApi.createVersion(versionData);
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

// 取消创建
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

// 加载产品信息
const loadProductInfo = async () => {
  try {
    // 加载产品信息
    if (productId.value) {
      const productResponse = await productApi.getProduct(productId.value);
      if (productResponse.data) {
        productName.value = productResponse.data.name;
      }
    }
    
    // 加载依赖产品列表
    const productsResponse = await productApi.getProducts();
    if (productsResponse.data && productsResponse.data.data) {
      dependencyProducts.value = productsResponse.data.data
        .filter((product: any) => product.id.toString() !== productId.value) // 排除当前产品
        .map((product: any) => ({
          id: product.id,
          name: product.name
        }));
    }
  } catch (error) {
    console.error('加载产品信息失败:', error);
    ElMessage.error('加载产品信息失败，请稍后重试');
  }
};

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

.dependency-item {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  gap: 10px;
}

.dependency-product {
  width: 200px;
}

.dependency-version {
  width: 150px;
}

.form-buttons {
  margin-top: 30px;
}
</style>