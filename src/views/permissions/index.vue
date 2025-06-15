<template>
  <div class="page-container">
    <!-- 页面标题和操作按钮 -->
    <div class="page-header">
      <h2 class="page-title">权限管理</h2>
      <el-button type="primary" @click="handleAddUser">
        <el-icon><Plus /></el-icon> 添加用户
      </el-button>
    </div>

    <!-- 搜索和筛选区域 -->
    <div class="search-area">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="用户名">
          <el-input v-model="searchForm.username" placeholder="请输入用户名" clearable />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="searchForm.role" placeholder="请选择角色" clearable>
            <el-option label="管理员" value="admin" />
            <el-option label="开发者" value="developer" />
            <el-option label="测试人员" value="tester" />
            <el-option label="产品经理" value="product_manager" />
            <el-option label="只读用户" value="reader" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
            <el-option label="启用" value="active" />
            <el-option label="禁用" value="inactive" />
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

    <!-- 用户权限列表 -->
    <div class="data-table">
      <el-table
        v-loading="loading"
        :data="userList"
        style="width: 100%"
        border
      >
        <el-table-column prop="username" label="用户名" />
        <el-table-column prop="name" label="姓名" />
        <el-table-column prop="email" label="邮箱" />
        <el-table-column prop="department" label="部门" />
        <el-table-column prop="role_id" label="角色">
          <template #default="scope">
            <el-tag :type="getRoleType(getRoleNameById(scope.row.role_id))">
              {{ getRoleNameById(scope.row.role_id) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态">
          <template #default="scope">
            <el-tag :type="scope.row.status ? 'success' : 'danger'">
              {{ scope.row.status ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="last_login_at" label="最后登录时间">
          <template #default="scope">
            {{ scope.row.last_login_at ? scope.row.last_login_at.replace('T', ' ') : '--' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="320">
          <template #default="scope">
            <el-button link type="primary" @click="handleEditUser(scope.row)">
              编辑
            </el-button>
            <el-button link type="primary" @click="handleAssignProducts(scope.row)">
              分配产品
            </el-button>
            <el-button link type="danger" @click="handleResetPassword(scope.row)">
              重置密码
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

    <!-- 添加/编辑用户对话框 -->
    <el-dialog
      v-model="userDialogVisible"
      :title="isEdit ? '编辑用户' : '添加用户'"
      width="500px"
    >
      <el-form :model="userForm" label-width="100px" :rules="userRules" ref="userFormRef">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="userForm.username" placeholder="请输入用户名" :disabled="isEdit" />
        </el-form-item>
        <el-form-item label="姓名" prop="name">
          <el-input v-model="userForm.name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="userForm.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="部门" prop="department">
          <el-input v-model="userForm.department" placeholder="请输入部门" />
        </el-form-item>
        <el-form-item label="角色" prop="role_id">
          <el-select v-model="userForm.role_id" placeholder="请选择角色" @change="onRoleChange">
            <el-option v-for="role in rolesList" :key="role.id" :label="role.name" :value="role.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="userForm.status">
            <el-radio :label="true">启用</el-radio>
            <el-radio :label="false">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="密码" prop="password" v-if="!isEdit">
          <el-input v-model="userForm.password" type="password" placeholder="请输入密码" show-password />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword" v-if="!isEdit">
          <el-input v-model="userForm.confirmPassword" type="password" placeholder="请确认密码" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="userDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitUserForm" :loading="submitting">
            确认
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 分配产品对话框 -->
    <el-dialog
      v-model="assignProductDialogVisible"
      title="分配产品权限"
      width="600px"
    >
      <div v-if="currentUser" class="mb-4">
        <p class="mb-2">为用户 <strong>{{ currentUser.name }}</strong> ({{ currentUser.username }}) 分配产品权限：</p>
      </div>
      <el-table
        :data="productList"
        style="width: 100%"
        border
      >
        <el-table-column prop="name" label="产品名称" width="180" />
        <el-table-column prop="code" label="产品代码" width="120" />
        <el-table-column label="权限" width="180">
          <template #default="scope">
            <el-select v-model="scope.row.permission" placeholder="请选择权限">
              <el-option label="无权限" value="none" />
              <el-option label="只读" value="read" />
              <el-option label="编辑" value="edit" />
              <el-option label="管理" value="admin" />
            </el-select>
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="assignProductDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitProductPermissions" :loading="submitting">
            确认
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 重置密码对话框 -->
    <el-dialog
      v-model="resetPasswordDialogVisible"
      title="重置密码"
      width="400px"
    >
      <div v-if="currentUser" class="mb-4">
        <p class="mb-2">确定要为用户 <strong>{{ currentUser.name }}</strong> ({{ currentUser.username }}) 重置密码吗？</p>
      </div>
      <el-form :model="resetPasswordForm" label-width="100px" :rules="resetPasswordRules" ref="resetPasswordFormRef">
        <el-form-item label="新密码" prop="password">
          <el-input v-model="resetPasswordForm.password" type="password" placeholder="请输入新密码" show-password />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="resetPasswordForm.confirmPassword" type="password" placeholder="请确认新密码" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="resetPasswordDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitResetPassword" :loading="submitting">
            确认
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Search, Refresh } from '@element-plus/icons-vue';
import { api } from '@/api/services';

// 搜索表单
const searchForm = reactive({
  username: '',
  role: '',
  status: ''
});

// 分页相关
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);
const loading = ref(false);

// 用户列表（移除模拟数据，初始化为空数组）
const userList = ref<any[]>([]);

// 产品列表（接口获取）
const productList = ref<any[]>([]);

// 用户表单对话框
const userDialogVisible = ref(false);
const isEdit = ref(false);
const submitting = ref(false);
const userFormRef = ref();
const userForm = reactive({
  id: '',
  username: '',
  name: '',
  email: '',
  department: '',
  role_id: null,
  status: true,
  password: '',
  confirmPassword: ''
});

// 表单验证规则
const userRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  name: [
    { required: true, message: '请输入姓名', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  department: [
    { required: true, message: '请输入部门', trigger: 'blur' }
  ],
  role_id: [
    { required: true, message: '请选择角色', trigger: 'change' }
  ],
  status: [
    { required: true, message: '请选择状态', trigger: 'change' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能小于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    {
      validator: (rule: any, value: string, callback: any) => {
        if (value !== userForm.password) {
          callback(new Error('两次输入密码不一致'));
        } else {
          callback();
        }
      },
      trigger: 'blur'
    }
  ]
};

// 分配产品对话框
const assignProductDialogVisible = ref(false);
const currentUser = ref<any>(null);

// 重置密码对话框
const resetPasswordDialogVisible = ref(false);
const resetPasswordFormRef = ref();
const resetPasswordForm = reactive({
  userId: '',
  password: '',
  confirmPassword: ''
});

// 重置密码验证规则
const resetPasswordRules = {
  password: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能小于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (rule: any, value: string, callback: any) => {
        if (value !== resetPasswordForm.password) {
          callback(new Error('两次输入密码不一致'));
        } else {
          callback();
        }
      },
      trigger: 'blur'
    }
  ]
};

// 获取角色标签类型（支持中文role_name）
const getRoleType = (roleName: string) => {
  const roleTypeMap: Record<string, string> = {
    '管理员': 'danger',
    '开发者': 'primary',
    '测试人员': 'warning',
    '产品经理': 'success',
    '只读用户': 'info'
  };
  return roleTypeMap[roleName] || 'default';
};

// 获取角色文本
const getRoleText = (role: string) => {
  const roleMap: Record<string, string> = {
    admin: '管理员',
    developer: '开发者',
    tester: '测试人员',
    product_manager: '产品经理',
    reader: '只读用户'
  };
  return roleMap[role] || '未知';
};

// 加载用户列表
const loadUserList = async () => {
  loading.value = true;
  try {
    const res = await api.user.getAllUsers();
    // 直接用接口返回的数组
    const arr = Array.isArray(res) ? res : (res.data || res.users || []);
    userList.value = arr;
    total.value = userList.value.length;
  } catch (e) {
    ElMessage.error('获取用户列表失败');
  } finally {
    loading.value = false;
  }
};

// 加载产品列表
const loadProductList = async () => {
  try {
    const res = await api.product.getProducts();
    // 兼容后端返回格式 {data: {products: [...]}}
    let arr = [];
    if (Array.isArray(res)) {
      arr = res;
    } else if (res.data && Array.isArray(res.data.products)) {
      arr = res.data.products;
    } else if (Array.isArray(res.data)) {
      arr = res.data;
    } else if (Array.isArray(res.products)) {
      arr = res.products;
    }
    productList.value = arr.map((item: any) => ({
      id: item.id,
      name: item.name,
      code: item.code,
      permission: 'none', // 默认无权限
    }));
  } catch (e) {
    ElMessage.error('获取产品列表失败');
  }
};

// 加载角色列表
const rolesList = ref<any[]>([]);
const loadRolesList = async () => {
  try {
    const res = await api.roles.getRoles();
    // 直接用接口返回的数组
    rolesList.value = Array.isArray(res) ? res : (res.data || res.roles || []);
  } catch (e) {
    ElMessage.error('获取角色列表失败');
  }
};

// 添加用户
const handleAddUser = () => {
  isEdit.value = false;
  userForm.id = '';
  userForm.username = '';
  userForm.name = '';
  userForm.email = '';
  userForm.department = '';
  userForm.role_id = null;
  userForm.status = true;
  userForm.password = '';
  userForm.confirmPassword = '';
  userDialogVisible.value = true;
};

// 编辑用户
const handleEditUser = (row: any) => {
  isEdit.value = true;
  userForm.id = row.id;
  userForm.username = row.username;
  userForm.name = row.name;
  userForm.email = row.email;
  userForm.department = row.department;
  userForm.role_id = row.role_id;
  userForm.status = !!row.status;
  userForm.password = '';
  userForm.confirmPassword = '';
  userDialogVisible.value = true;
};

// 提交用户表单
const submitUserForm = () => {
  userFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      submitting.value = true;
      try {
        if (isEdit.value) {
          await api.user.updateUser(userForm.id, {
            username: userForm.username,
            email: userForm.email,
            role_id: userForm.role_id,
            name: userForm.name,
            department: userForm.department,
            status: !!userForm.status
          });
          ElMessage.success('用户信息更新成功');
        } else {
          await api.user.createUser({
            username: userForm.username,
            email: userForm.email,
            role_id: userForm.role_id,
            password: userForm.password,
            name: userForm.name,
            department: userForm.department,
            status: !!userForm.status
          });
          ElMessage.success('用户添加成功');
        }
        submitting.value = false;
        userDialogVisible.value = false;
        loadUserList();
      } catch (e) {
        ElMessage.error(isEdit.value ? '用户信息更新失败' : '用户添加失败');
        submitting.value = false;
      }
    }
  });
};

// 分配产品权限
const handleAssignProducts = async (row: any) => {
  currentUser.value = row;
  await loadProductList();
  // 获取并回显用户已有产品权限
  try {
    const res = await api.userProductPermissions.getUserProductPermissions(row.id);
    const arr = Array.isArray(res.data) ? res.data : (res.data?.permissions || []);
    // 回显权限
    productList.value.forEach(product => {
      const found = arr.find((p: any) => String(p.product_id) === String(product.id));
      product.permission = found ? found.permission_type : 'none';
    });
  } catch (e) {
    // 没有权限也不报错
    productList.value.forEach(product => { product.permission = 'none'; });
  }
  assignProductDialogVisible.value = true;
};

// 提交产品权限
const submitProductPermissions = async () => {
  submitting.value = true;
  try {
    const userId = currentUser.value.id;
    // 只提交非none的权限
    const promises = productList.value
      .filter(product => product.permission && product.permission !== 'none')
      .map(product => api.userProductPermissions.setUserProductPermission({
        user_id: userId,
        product_id: product.id,
        permission_type: product.permission
      }));
    await Promise.all(promises);
    ElMessage.success('产品权限分配成功');
    assignProductDialogVisible.value = false;
  } catch (e) {
    ElMessage.error('产品权限分配失败');
  } finally {
    submitting.value = false;
  }
};

// 重置密码
const handleResetPassword = (row: any) => {
  currentUser.value = row;
  resetPasswordForm.userId = row.id;
  resetPasswordForm.password = '';
  resetPasswordForm.confirmPassword = '';
  resetPasswordDialogVisible.value = true;
};

// 提交重置密码
const submitResetPassword = () => {
  resetPasswordFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      submitting.value = true;
      try {
        await api.user.updateUser(resetPasswordForm.userId, { password: resetPasswordForm.password });
        ElMessage.success('密码重置成功');
        submitting.value = false;
        resetPasswordDialogVisible.value = false;
      } catch (e) {
        ElMessage.error('密码重置失败');
        submitting.value = false;
      }
    }
  });
};

// 搜索
const handleSearch = () => {
  currentPage.value = 1;
  loadUserList();
};

// 重置搜索
const resetSearch = () => {
  searchForm.username = '';
  searchForm.role = '';
  searchForm.status = '';
  handleSearch();
};

// 分页大小变化
const handleSizeChange = (val: number) => {
  pageSize.value = val;
  loadUserList();
};

// 当前页变化
const handleCurrentChange = (val: number) => {
  currentPage.value = val;
  loadUserList();
};

// 角色联动，选中后自动带出其它字段，但可手动编辑
const onRoleChange = (roleId) => {
  const role = rolesList.value.find(r => Number(r.id) === Number(roleId));
  if (role) {
    userForm.name = role.name;
    userForm.department = role.description || '';
    userForm.status = !!role.status;
  }
};

// 表格展示角色时通过role_id映射name
const getRoleNameById = (roleId) => {
  const id = Number(roleId);
  const role = rolesList.value.find(r => Number(r.id) === id);
  return role ? role.name : '--';
};

onMounted(async () => {
  await loadRolesList();
  await loadUserList();
  loadProductList();
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

.el-table {
  --el-table-border-color: #ebeef5;
  --el-table-header-bg-color: #f5f7fa;
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

/* 修复表格在小屏幕上的显示 */
.el-table {
  width: 100%;
}

.el-table .el-table__body-wrapper {
  overflow-x: auto;
}

.mb-4 {
  margin-bottom: 16px;
}

.mb-2 {
  margin-bottom: 8px;
}
</style>