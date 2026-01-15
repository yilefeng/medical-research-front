<template>
  <div class="sys-user-container">
    <el-card>
      <!-- 查询表单 -->
      <div class="card-header">
        <el-input
            v-model="queryParams.username"
            placeholder="请输入用户名"
            style="width: 200px; margin-right: 10px;"
            clearable
        ></el-input>
        <el-input
            v-model="queryParams.realName"
            placeholder="请输入真实姓名"
            style="width: 200px; margin-right: 10px;"
            clearable
        ></el-input>
        <el-select
            v-model="queryParams.status"
            placeholder="请选择状态"
            style="width: 150px; margin-right: 10px;"
            clearable
        >
          <el-option label="启用" value="1"></el-option>
          <el-option label="禁用" value="0"></el-option>
        </el-select>
        <el-button type="primary" @click="getUserList()">查询</el-button>
        <el-button @click="resetQuery()">重置</el-button>
        <el-button type="success" @click="openAddDialog()" style="margin-left: 10px;">新增</el-button>
      </div>

      <!-- 表格 -->
      <el-table :data="tableData" border stripe style="width: 100%">
        <el-table-column prop="id" label="ID" width="80"></el-table-column>
        <el-table-column prop="username" label="用户名" width="120"></el-table-column>
        <el-table-column prop="realName" label="真实姓名" width="120"></el-table-column>
        <el-table-column prop="phone" label="手机号" width="150"></el-table-column>
        <el-table-column prop="email" label="邮箱" width="200"></el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === 1 ? 'success' : 'danger'">
              {{ scope.row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="lastLoginTime" label="最后登录时间" width="180"></el-table-column>
        <el-table-column label="操作" width="250">
          <template #default="scope">
            <el-button type="primary" size="small" @click="openEditDialog(scope.row)">编辑</el-button>
            <el-button type="warning" size="small" @click="resetPassword(scope.row.id)">重置密码</el-button>
            <el-button
                type="danger"
                size="small"
                @click="deleteUser(scope.row.id)"
                v-if="scope.row.id !== 1"
            >删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          :current-page="pageNum"
          :page-sizes="[10, 20, 50, 100]"
          :page-size="pageSize"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          style="margin-top: 20px; text-align: right;"
      ></el-pagination>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog
        v-model="dialogVisible"
        :title="dialogTitle"
        width="600px"
        @close="resetForm()"
    >
      <el-form :model="formData" :rules="formRules" ref="formRef" label-width="100px">
        <el-form-item label="用户名" prop="username" v-if="!isEdit">
          <el-input v-model="formData.username" placeholder="请输入用户名"></el-input>
        </el-form-item>
        <el-form-item label="真实姓名" prop="realName">
          <el-input v-model="formData.realName" placeholder="请输入真实姓名"></el-input>
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="formData.phone" placeholder="请输入手机号"></el-input>
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="formData.email" placeholder="请输入邮箱"></el-input>
        </el-form-item>
        <el-form-item label="角色" prop="roleId">
          <el-select v-model="formData.roleId" placeholder="请选择角色">
            <el-option label="管理员" :value="1"></el-option>
            <el-option label="科研人员" :value="2"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="formData.status" placeholder="请选择状态">
            <el-option label="启用" :value="1"></el-option>
            <el-option label="禁用" :value="0"></el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm()">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getUserPage, createUser, updateUser,
  deleteUser as deleteUserApi, resetPassword as resetPasswordApi, getUserById
} from '@/api/sysUser'

// 查询参数
const queryParams = ref({
  username: '',
  realName: '',
  status: ''
})

// 表格数据
const tableData = ref([])
const pageNum = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 对话框相关
const dialogVisible = ref(false)
const dialogTitle = ref('新增用户')
const isEdit = ref(false)
const formRef = ref(null)

// 表单数据
const formData = reactive({
  id: '',
  username: '',
  realName: '',
  phone: '',
  email: '',
  roleId: 1,
  status: 1
})

// 表单校验规则
const formRules = ref({
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 20, message: '用户名长度应在2-20个字符之间', trigger: 'blur' }
  ],
  realName: [
    { required: true, message: '请输入真实姓名', trigger: 'blur' },
    { min: 2, max: 10, message: '真实姓名长度应在2-20个字符之间', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号格式', trigger: 'blur' },
    { len: 11, message: '手机号长度应为11位', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' },
    { max: 50, message: '邮箱长度不能超过50个字符', trigger: 'blur' }
  ],
  roleId: [{ required: true, message: '请选择角色', trigger: 'change' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }]
})

// 页面加载时获取列表
onMounted(() => {
  getUserList()
})

// 获取用户列表
const getUserList = async () => {
  try {
    const res = await getUserPage({
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      ...queryParams.value
    })
    tableData.value = res.data.records
    total.value = res.data.total
  } catch (error) {
    console.error('获取列表失败:', error)
  }
}

// 重置查询条件
const resetQuery = () => {
  queryParams.value = {
    username: '',
    realName: '',
    status: ''
  }
  getUserList()
}

// 分页大小改变
const handleSizeChange = (val) => {
  pageSize.value = val
  getUserList()
}

// 当前页改变
const handleCurrentChange = (val) => {
  pageNum.value = val
  getUserList()
}

// 打开新增对话框
const openAddDialog = () => {
  dialogTitle.value = '新增用户'
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

// 打开编辑对话框
const openEditDialog = async (row) => {
  dialogTitle.value = '编辑用户'
  isEdit.value = true
  resetForm()

  // 获取详情
  const res = await getUserById(row.id)
  Object.assign(formData, res.data)
  dialogVisible.value = true
}

// 重置表单
const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields()
  }
  Object.assign(formData, {
    id: '',
    username: '',
    realName: '',
    phone: '',
    email: '',
    roleId: '',
    status: 1
  })
}

// 提交表单
const submitForm = async () => {
  try {
    await formRef.value.validate()
    let res
    if (isEdit.value) {
      res = await updateUser(formData.id, formData)
    } else {
      res = await createUser(formData)
    }
    ElMessage.success(res.msg)
    dialogVisible.value = false
    getUserList()
  } catch (error) {
    console.error('提交失败:', error)
  }
}

// 删除用户
const deleteUser = (id) => {
  if (id === 1) {
    ElMessage.warning('禁止删除管理员账户')
    return
  }

  ElMessageBox.confirm(
      '确定要删除该用户吗？',
      '提示',
      {
        type: 'warning'
      }
  ).then(async () => {
    const res = await deleteUser(id)
    ElMessage.success(res.msg)
    getUserList()
  }).catch(() => {
    ElMessage.info('已取消删除')
  })
}

// 重置密码
const resetPassword = (id) => {
  ElMessageBox.confirm(
      '确定要重置该用户的密码吗？重置后密码为123456',
      '提示',
      {
        type: 'warning'
      }
  ).then(async () => {
    const res = await resetPassword(id)
    ElMessage.success(res.msg)
  }).catch(() => {
    ElMessage.info('已取消重置')
  })
}
</script>

<style scoped>
.sys-user-container {
  padding: 10px;
}
</style>