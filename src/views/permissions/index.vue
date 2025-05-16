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
        <el-table-column label="角色">
          <template #default="scope">
            <el-tag :type="getRoleType(scope.row.role)">
              {{ getRoleText(scope.row.role) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态">
          <template #default="scope">
            <el-tag :type="scope.row.status === 'active' ? 'success' : 'danger'">
              {{ scope.row.status === 'active' ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="lastLoginTime" label="最后登录时间" />
        <el-table-column label="操作">
          <template #default="scope">
            <el-button link type="primary" @click="handleEditUser(scope.row)">
              编辑
            </el-button>
            <el-button 
              link 
              :type="scope.row.status === 'active' ? 'danger' : 'success'" 
              @click="handleToggleStatus(scope.row)"
            >
              {{ scope.row.status === 'active' ? '禁用' : '启用' }}
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
        <el-form-item label="角色" prop="role">
          <el-select v-model="userForm.role" placeholder="请选择角色">
            <el-option label="管理员" value="admin" />
            <el-option label="开发者" value="developer" />
            <el-option label="测试人员" value="tester" />
            <el-option label="产品经理" value="product_manager" />
            <el-option label="只读用户" value="reader" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="userForm.status">
            <el-radio label="active">启用</el-radio>
            <el-radio label="inactive">禁用</el-radio>
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
              <el-option label="管理" value="manage" />
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

// 用户列表（模拟数据）
const userList = ref([
  {
    id: '1',
    username: 'admin',
    name: '系统管理员',
    email: 'admin@example.com',
    department: '技术部',
    role: 'admin',
    status: 'active',
    lastLoginTime: '2024-01-20 10:30:45'
  },
  {
    id: '2',
    username: 'zhangsan',
    name: '张三',
    email: 'zhangsan@example.com',
    department: '开发部',
    role: 'developer',
    status: 'active',
    lastLoginTime: '2024-01-19 16:45:22'
  },
  {
    id: '3',
    username: 'lisi',
    name: '李四',
    email: 'lisi@example.com',
    department: '测试部',
    role: 'tester',
    status: 'active',
    lastLoginTime: '2024-01-18 09:15:30'
  },
  {
    id: '4',
    username: 'wangwu',
    name: '王五',
    email: 'wangwu@example.com',
    department: '产品部',
    role: 'product_manager',
    status: 'active',
    lastLoginTime: '2024-01-20 08:20:15'
  },
  {
    id: '5',
    username: 'zhaoliu',
    name: '赵六',
    email: 'zhaoliu@example.com',
    department: '市场部',
    role: 'reader',
    status: 'inactive',
    lastLoginTime: '2024-01-15 14:10:05'
  }
]);

// 产品列表（模拟数据）
const productList = ref([
  {
    id: 'PRD-001',
    name: '客户管理系统',
    code: 'CRM',
    permission: 'read'
  },
  {
    id: 'PRD-002',
    name: '企业财务管理平台',
    code: 'FIN',
    permission: 'none'
  },
  {
    id: 'PRD-003',
    name: '智能家居控制系统',
    code: 'SMART',
    permission: 'none'
  }
]);

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
  role: '',
  status: 'active',
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
  role: [
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

// 获取角色标签类型
const getRoleType = (role: string) => {
  const roleMap: Record<string, string> = {
    admin: 'danger',
    developer: 'primary',
    tester: 'warning',
    product_manager: 'success',
    reader: 'info'
  };
  return roleMap[role] || 'default';
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
const loadUserList = () => {
  loading.value = true;
  // 模拟API请求
  setTimeout(() => {
    // 实际项目中应该调用API获取数据
    // 这里使用模拟数据
    total.value = userList.value.length;
    loading.value = false;
  }, 500);
};

// 添加用户
const handleAddUser = () => {
  isEdit.value = false;
  userForm.id = '';
  userForm.username = '';
  userForm.name = '';
  userForm.email = '';
  userForm.department = '';
  userForm.role = '';
  userForm.status = 'active';
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
  userForm.role = row.role;
  userForm.status = row.status;
  userForm.password = '';
  userForm.confirmPassword = '';
  userDialogVisible.value = true;
};

// 提交用户表单
const submitUserForm = () => {
  userFormRef.value?.validate((valid: boolean) => {
    if (valid) {
      submitting.value = true;
      // 模拟API请求
      setTimeout(() => {
        if (isEdit.value) {
          // 更新用户
          const index = userList.value.findIndex(item => item.id === userForm.id);
          if (index !== -1) {
            userList.value[index] = {
              ...userList.value[index],
              name: userForm.name,
              email: userForm.email,
              department: userForm.department,
              role: userForm.role,
              status: userForm.status
            };
          }
          ElMessage.success('用户信息更新成功');
        } else {
          // 添加用户
          const newUser = {
            id: String(userList.value.length + 1),
            username: userForm.username,
            name: userForm.name,
            email: userForm.email,
            department: userForm.department,
            role: userForm.role,
            status: userForm.status,
            lastLoginTime: '-'
          };
          userList.value.push(newUser);
          ElMessage.success('用户添加成功');
        }
        submitting.value = false;
        userDialogVisible.value = false;
        loadUserList();
      }, 1000);
    }
  });
};

// 切换用户状态
const handleToggleStatus = (row: any) => {
  const action = row.status === 'active' ? '禁用' : '启用';
  ElMessageBox.confirm(
    `确定要${action}用户 ${row.name} (${row.username}) 吗？`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: row.status === 'active' ? 'warning' : 'info',
    }
  ).then(() => {
    // 模拟API请求
    row.status = row.status === 'active' ? 'inactive' : 'active';
    ElMessage.success(`${action}成功`);
  }).catch(() => {
    // 取消操作
  });
};

// 分配产品权限
const handleAssignProducts = (row: any) => {
  currentUser.value = row;
  // 重置产品权限
  productList.value.forEach(product => {
    product.permission = 'none';
  });
  // 模拟获取用户产品权限
  // 实际项目中应该调用API获取数据
  assignProductDialogVisible.value = true;
};

// 提交产品权限
const submitProductPermissions = () => {
  submitting.value = true;
  // 模拟API请求
  setTimeout(() => {
    // 实际项目中应该调用API保存数据
    ElMessage.success('产品权限分配成功');
    submitting.value = false;
    assignProductDialogVisible.value = false;
  }, 1000);
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
  resetPasswordFormRef.value?.validate((valid: boolean) => {
    if (valid) {
      submitting.value = true;
      // 模拟API请求
      setTimeout(() => {
        // 实际项目中应该调用API重置密码
        ElMessage.success('密码重置成功');
        submitting.value = false;
        resetPasswordDialogVisible.value = false;
      }, 1000);
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

onMounted(() => {
  loadUserList();
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