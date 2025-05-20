# API 服务层使用文档

本文档提供了版本管理系统前端 API 服务层的使用说明，帮助开发者理解如何在 Vue 组件中调用后端 API。

## 目录结构

```
src/api/
├── index.ts          # API 客户端配置和拦截器
├── user.ts           # 用户相关 API
├── product.ts        # 产品相关 API
├── version.ts        # 版本相关 API
├── file.ts           # 文件相关 API
└── services.ts       # API 服务统一导出
```

## 使用方法

### 1. 导入 API 服务

```typescript
// 方式一：导入特定模块 API
import { api } from '@/api/services';

// 方式二：导入全部 API
import api from '@/api/services';

// 方式三：直接导入特定服务
import userApi from '@/api/user';
```

### 2. 在组件中使用

#### 用户相关 API 示例

```typescript
// 获取所有用户
async function fetchAllUsers() {
  try {
    const users = await api.user.getAllUsers();
    console.log('用户列表:', users);
    return users;
  } catch (error) {
    console.error('获取用户列表失败:', error);
  }
}

// 创建新用户
async function createNewUser(userData) {
  try {
    const newUser = await api.user.createUser(userData);
    console.log('创建用户成功:', newUser);
    return newUser;
  } catch (error) {
    console.error('创建用户失败:', error);
  }
}
```

#### 产品相关 API 示例

```typescript
// 获取产品列表（带分页）
async function fetchProducts(page = 1, perPage = 10) {
  try {
    const products = await api.product.getProducts({
      page,
      per_page: perPage
    });
    console.log('产品列表:', products);
    return products;
  } catch (error) {
    console.error('获取产品列表失败:', error);
  }
}

// 获取产品详情
async function fetchProductDetail(productId) {
  try {
    const product = await api.product.getProduct(productId);
    console.log('产品详情:', product);
    return product;
  } catch (error) {
    console.error('获取产品详情失败:', error);
  }
}
```

#### 版本相关 API 示例

```typescript
// 获取产品的版本列表
async function fetchProductVersions(productId, page = 1, perPage = 10) {
  try {
    const versions = await api.version.getVersions({
      product_id: productId,
      page,
      per_page: perPage
    });
    console.log('版本列表:', versions);
    return versions;
  } catch (error) {
    console.error('获取版本列表失败:', error);
  }
}

// 创建新版本
async function createNewVersion(versionData) {
  try {
    const newVersion = await api.version.createVersion(versionData);
    console.log('创建版本成功:', newVersion);
    return newVersion;
  } catch (error) {
    console.error('创建版本失败:', error);
  }
}
```

#### 文件相关 API 示例

```typescript
// 上传文件
async function uploadVersionFile(file, versionId, uploaderId) {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('version_id', versionId);
    formData.append('uploader_id', uploaderId);
    
    const result = await api.file.uploadFile(formData);
    console.log('文件上传成功:', result);
    return result;
  } catch (error) {
    console.error('文件上传失败:', error);
  }
}

// 下载文件
async function downloadVersionFile(fileId, filename) {
  try {
    const response = await api.file.downloadFile(fileId);
    
    // 创建下载链接
    const url = window.URL.createObjectURL(new Blob([response]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log('文件下载成功');
  } catch (error) {
    console.error('文件下载失败:', error);
  }
}
```

## 错误处理

API 服务层已配置全局错误拦截器，会自动处理常见的 HTTP 错误状态码。在组件中使用时，建议使用 try/catch 进行更细粒度的错误处理。

## 认证

API 请求拦截器会自动从 localStorage 中获取 token 并添加到请求头中。确保在用户登录成功后，将 token 保存到 localStorage：

```typescript
// 登录成功后保存 token
localStorage.setItem('token', 'your-auth-token');
```

## 注意事项

1. 所有 API 调用都返回 Promise，建议使用 async/await 处理异步操作
2. 上传文件时需使用 FormData 格式
3. 下载文件时需处理二进制响应
4. 对于分页接口，注意传入正确的分页参数