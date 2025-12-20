<template>
  <div class="experiment-plan-container">
    <el-card>
      <!-- 查询表单 -->
      <div class="card-header">
        <el-input
            v-model="queryParams.planName"
            placeholder="请输入实验方案名称"
            style="width: 200px; margin-right: 10px;"
            clearable
        ></el-input>
        <el-input
            v-model="queryParams.experimentNo"
            placeholder="请输入实验编号"
            style="width: 200px; margin-right: 10px;"
            clearable
        ></el-input>
        <el-select
            v-model="queryParams.status"
            placeholder="请选择状态"
            style="width: 150px; margin-right: 10px;"
            clearable
        >
          <el-option label="未开始" value="0"></el-option>
          <el-option label="进行中" value="1"></el-option>
          <el-option label="已完成" value="2"></el-option>
          <el-option label="已终止" value="3"></el-option>
        </el-select>
        <el-button type="primary" @click="getPlanList()">查询</el-button>
        <el-button @click="resetQuery()">重置</el-button>
        <el-button type="success" @click="openAddDialog()" style="margin-left: 10px;">新增</el-button>
      </div>

      <!-- 表格 -->
      <el-table :data="tableData" border stripe style="width: 100%">
        <el-table-column prop="id" label="ID" width="80"></el-table-column>
        <el-table-column prop="planName" label="实验方案名称" min-width="200"></el-table-column>
        <el-table-column prop="experimentNo" label="实验编号" width="150"></el-table-column>
        <el-table-column prop="principal" label="负责人" width="100"></el-table-column>
        <el-table-column prop="dept" label="所属科室" width="120"></el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusTagType(scope.row.status)">{{ getStatusText(scope.row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180"></el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="scope">
            <el-button type="primary" size="small" @click="openEditDialog(scope.row)">编辑</el-button>
            <el-button type="warning" size="small" @click="updateStatus(scope.row)">改状态</el-button>
            <el-button type="danger" size="small" @click="deletePlan(scope.row.id)">删除</el-button>
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
        <el-form-item label="实验方案名称" prop="planName">
          <el-input v-model="formData.planName" placeholder="请输入实验方案名称"></el-input>
        </el-form-item>
        <el-form-item label="实验编号" prop="experimentNo">
          <el-input v-model="formData.experimentNo" placeholder="请输入实验编号（如EXP2025001）"></el-input>
        </el-form-item>
        <el-form-item label="实验目的" prop="purpose">
          <el-input
              v-model="formData.purpose"
              type="textarea"
              :rows="3"
              placeholder="请输入实验目的"
          ></el-input>
        </el-form-item>
        <el-form-item label="负责人" prop="principal">
          <el-input v-model="formData.principal" placeholder="请输入实验负责人"></el-input>
        </el-form-item>
        <el-form-item label="所属科室" prop="dept">
          <el-input v-model="formData.dept" placeholder="请输入所属科室"></el-input>
        </el-form-item>
        <el-form-item label="开始时间" prop="startTime">
          <el-date-picker
              v-model="formData.startTime"
              type="datetime"
              placeholder="请选择开始时间"
              style="width: 100%;"
          ></el-date-picker>
        </el-form-item>
        <el-form-item label="结束时间" prop="endTime">
          <el-date-picker
              v-model="formData.endTime"
              type="datetime"
              placeholder="请选择结束时间"
              style="width: 100%;"
          ></el-date-picker>
        </el-form-item>
        <el-form-item label="状态" prop="status" v-if="isEdit">
          <el-select v-model="formData.status" placeholder="请选择状态">
            <el-option label="未开始" value="0"></el-option>
            <el-option label="进行中" value="1"></el-option>
            <el-option label="已完成" value="2"></el-option>
            <el-option label="已终止" value="3"></el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm()">确定</el-button>
      </template>
    </el-dialog>

    <!-- 状态修改对话框 -->
    <el-dialog v-model="statusDialogVisible" title="修改实验状态" width="400px">
      <el-form :model="statusForm" label-width="80px">
        <el-form-item label="当前状态">
          <el-tag :type="getStatusTagType(statusForm.oldStatus)">{{ getStatusText(statusForm.oldStatus) }}</el-tag>
        </el-form-item>
        <el-form-item label="目标状态" prop="newStatus">
          <el-select v-model="statusForm.newStatus" placeholder="请选择目标状态">
            <el-option label="未开始" value="0"></el-option>
            <el-option label="进行中" value="1"></el-option>
            <el-option label="已完成" value="2"></el-option>
            <el-option label="已终止" value="3"></el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="statusDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmUpdateStatus()">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getPlanPage, createPlan, updatePlan,
  deletePlan as deletePlanApi, updatePlanStatus, getPlanById
} from '@/api/experimentPlan'

// 查询参数
const queryParams = ref({
  planName: '',
  experimentNo: '',
  status: ''
})

// 表格数据
const tableData = ref([])
const pageNum = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 对话框相关
const dialogVisible = ref(false)
const statusDialogVisible = ref(false)
const dialogTitle = ref('新增实验方案')
const isEdit = ref(false)
const formRef = ref(null)

// 表单数据
const formData = reactive({
  id: '',
  planName: '',
  experimentNo: '',
  purpose: '',
  principal: '',
  dept: '',
  startTime: '',
  endTime: '',
  status: '0'
})

// 状态修改表单
const statusForm = reactive({
  id: '',
  oldStatus: '',
  newStatus: ''
})

// 表单校验规则
const formRules = ref({
  planName: [{ required: true, message: '请输入实验方案名称', trigger: 'blur' }],
  experimentNo: [{ required: true, message: '请输入实验编号', trigger: 'blur' }],
  purpose: [{ required: true, message: '请输入实验目的', trigger: 'blur' }],
  principal: [{ required: true, message: '请输入实验负责人', trigger: 'blur' }],
  dept: [{ required: true, message: '请输入所属科室', trigger: 'blur' }],
  startTime: [{ required: true, message: '请选择开始时间', trigger: 'change' }],
  endTime: [{ required: true, message: '请选择结束时间', trigger: 'change' }]
})

// 页面加载时获取列表
onMounted(() => {
  getPlanList()
})

// 获取实验方案列表
const getPlanList = async () => {
  try {
    const res = await getPlanPage({
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
    planName: '',
    experimentNo: '',
    status: ''
  }
  getPlanList()
}

// 分页大小改变
const handleSizeChange = (val) => {
  pageSize.value = val
  getPlanList()
}

// 当前页改变
const handleCurrentChange = (val) => {
  pageNum.value = val
  getPlanList()
}

// 打开新增对话框
const openAddDialog = () => {
  dialogTitle.value = '新增实验方案'
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

// 打开编辑对话框
const openEditDialog = async (row) => {
  dialogTitle.value = '编辑实验方案'
  isEdit.value = true
  resetForm()

  // 获取详情
  const res = await getPlanById(row.id)
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
    planName: '',
    experimentNo: '',
    purpose: '',
    principal: '',
    dept: '',
    startTime: '',
    endTime: '',
    status: '0'
  })
}

// 提交表单
const submitForm = async () => {
  try {
    await formRef.value.validate()
    let res
    if (isEdit.value) {
      res = await updatePlan(formData.id, formData)
    } else {
      res = await createPlan(formData)
    }
    ElMessage.success(res.msg)
    dialogVisible.value = false
    getPlanList()
  } catch (error) {
    console.error('提交失败:', error)
  }
}

// 删除实验方案
const deletePlan = (id) => {
  ElMessageBox.confirm(
      '确定要删除该实验方案吗？',
      '提示',
      {
        type: 'warning'
      }
  ).then(async () => {
    const res = await deletePlanApi(id)
    ElMessage.success(res.msg)
    getPlanList()
  }).catch(() => {
    ElMessage.info('已取消删除')
  })
}

// 打开状态修改对话框
const updateStatus = (row) => {
  statusForm.id = row.id
  statusForm.oldStatus = row.status
  statusForm.newStatus = ''
  statusDialogVisible.value = true
}

// 确认修改状态
const confirmUpdateStatus = async () => {
  if (!statusForm.newStatus) {
    ElMessage.warning('请选择目标状态')
    return
  }
  try {
    const res = await updatePlanStatus(statusForm.id, statusForm.newStatus)
    ElMessage.success(res.msg)
    statusDialogVisible.value = false
    getPlanList()
  } catch (error) {
    console.error('修改状态失败:', error)
  }
}

// 获取状态文本
const getStatusText = (status) => {
  const statusMap = {
    '0': '未开始',
    '1': '进行中',
    '2': '已完成',
    '3': '已终止'
  }
  return statusMap[status] || '未知'
}

// 获取状态标签类型
const getStatusTagType = (status) => {
  const typeMap = {
    '0': 'info',
    '1': 'primary',
    '2': 'success',
    '3': 'danger'
  }
  return typeMap[status] || 'default'
}
</script>

<style scoped>
.experiment-plan-container {
  padding: 10px;
}
</style>