<template>
  <div class="sys-role-container">
    <el-card>
      <!-- 查询表单 -->
      <div class="card-header">
        <el-input
            v-model="queryParams.roleName"
            placeholder="请输入角色名称"
            style="width: 200px; margin-right: 10px;"
            clearable
        ></el-input>
        <el-input
            v-model="queryParams.roleCode"
            placeholder="请输入角色编码"
            style="width: 200px; margin-right: 10px;"
            clearable
        ></el-input>
        <el-button type="primary" @click="getRoleList()">查询</el-button>
        <el-button @click="resetQuery()">重置</el-button>
        <el-button type="success" @click="openAddDialog()" style="margin-left: 10px;">新增</el-button>
      </div>

      <!-- 表格 -->
      <el-table :data="tableData" border stripe style="width: 100%">
        <el-table-column prop="id" label="ID" width="80"></el-table-column>
        <el-table-column prop="roleName" label="角色名称" width="150"></el-table-column>
        <el-table-column prop="roleCode" label="角色编码" width="150"></el-table-column>
        <el-table-column prop="description" label="角色描述" min-width="200"></el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180"></el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="scope">
            <el-button
                type="primary"
                size="small"
                @click="openEditDialog(scope.row)"
                :disabled="scope.row.id === 1 || scope.row.id === 2"
            >编辑</el-button>
            <el-button
                type="danger"
                size="small"
                @click="deleteRole(scope.row.id)"
                :disabled="scope.row.id === 1 || scope.row.id === 2"
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
        width="500px"
        @close="resetForm()"
    >
      <el-form :model="formData" :rules="formRules" ref="formRef" label-width="100px">
        <el-form-item label="角色名称" prop="roleName">
          <el-input v-model="formData.roleName" placeholder="请输入角色名称"></el-input>
        </el-form-item>
        <el-form-item label="角色编码" prop="roleCode">
          <el-input
              v-model="formData.roleCode"
              placeholder="请输入角色编码（如admin）"
              :disabled="isEdit && (formData.id === 1 || formData.id === 2)"
          ></el-input>
        </el-form-item>
        <el-form-item label="角色描述" prop="description">
          <el-input
              v-model="formData.description"
              type="textarea"
              :rows="3"
              placeholder="请输入角色描述"
          ></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button
            type="primary"
            @click="submitForm()"
            :disabled="isEdit && (formData.id === 1 || formData.id === 2)"
        >确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getRolePage, createRole, updateRole,
  deleteRole as deleteRoleApi, getRoleById
} from '@/api/sysRole'

// 查询参数
const queryParams = ref({
  roleName: '',
  roleCode: ''
})

// 表格数据
const tableData = ref([])
const pageNum = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 对话框相关
const dialogVisible = ref(false)
const dialogTitle = ref('新增角色')
const isEdit = ref(false)
const formRef = ref(null)

// 表单数据
const formData = reactive({
  id: '',
  roleName: '',
  roleCode: '',
  description: ''
})

// 表单校验规则
const formRules = ref({
  roleName: [{ required: true, message: '请输入角色名称', trigger: 'blur' }],
  roleCode: [
    { required: true, message: '请输入角色编码', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_]+$/, message: '角色编码只能包含字母、数字和下划线', trigger: 'blur' }
  ],
  description: [{ required: true, message: '请输入角色描述', trigger: 'blur' }]
})

// 页面加载时获取列表
onMounted(() => {
  getRoleList()
})

// 获取角色列表
const getRoleList = async () => {
  try {
    const res = await getRolePage({
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
    roleName: '',
    roleCode: ''
  }
  getRoleList()
}

// 分页大小改变
const handleSizeChange = (val) => {
  pageSize.value = val
  getRoleList()
}

// 当前页改变
const handleCurrentChange = (val) => {
  pageNum.value = val
  getRoleList()
}

// 打开新增对话框
const openAddDialog = () => {
  dialogTitle.value = '新增角色'
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

// 打开编辑对话框
const openEditDialog = async (row) => {
  // 系统内置角色提示
  if (row.id === 1 || row.id === 2) {
    ElMessage.warning('系统内置角色仅可修改描述信息')
  }

  dialogTitle.value = '编辑角色'
  isEdit.value = true
  resetForm()

  // 获取详情
  const res = await getRoleById(row.id)
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
    roleName: '',
    roleCode: '',
    description: ''
  })
}

// 提交表单
const submitForm = async () => {
  try {
    await formRef.value.validate()
    let res
    if (isEdit.value) {
      // 系统内置角色只更新名称和描述
      if (formData.id === 1 || formData.id === 2) {
        const updateData = {
          roleName: formData.roleName,
          description: formData.description
        }
        res = await updateRole(formData.id, updateData)
      } else {
        res = await updateRole(formData.id, formData)
      }
    } else {
      res = await createRole(formData)
    }
    ElMessage.success(res.msg)
    dialogVisible.value = false
    getRoleList()
  } catch (error) {
    console.error('提交失败:', error)
  }
}

// 删除角色
const deleteRole = (id) => {
  // 系统内置角色禁止删除
  if (id === 1 || id === 2) {
    ElMessage.warning('禁止删除系统内置角色')
    return
  }

  ElMessageBox.confirm(
      '确定要删除该角色吗？删除前请确保该角色未分配给任何用户',
      '提示',
      {
        type: 'warning'
      }
  ).then(async () => {
    try {
      const res = await deleteRole(id)
      ElMessage.success(res.msg)
      getRoleList()
    } catch (error) {
      ElMessage.error(error.msg || '删除失败，该角色已分配给用户')
    }
  }).catch(() => {
    ElMessage.info('已取消删除')
  })
}
</script>

<style scoped>
.sys-role-container {
  padding: 10px;
}
</style>