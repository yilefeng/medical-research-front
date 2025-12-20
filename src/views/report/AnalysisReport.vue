<template>
  <div class="analysis-report-container">
    <el-card>
      <!-- 查询表单 -->
      <div class="card-header">
        <el-input
            v-model="queryParams.reportName"
            placeholder="请输入报告名称"
            style="width: 200px; margin-right: 10px;"
            clearable
        ></el-input>
        <el-input
            v-model="queryParams.planId"
            placeholder="请输入实验方案ID"
            style="width: 150px; margin-right: 10px;"
            clearable
        ></el-input>
        <el-select
            v-model="queryParams.status"
            placeholder="请选择状态"
            style="width: 150px; margin-right: 10px;"
            clearable
        >
          <el-option label="已生成" value="1"></el-option>
          <el-option label="已导出" value="2"></el-option>
          <el-option label="已作废" value="3"></el-option>
        </el-select>
        <el-button type="primary" @click="getReportList()">查询</el-button>
        <el-button @click="resetQuery()">重置</el-button>
        <el-button type="success" @click="openAddDialog()" style="margin-left: 10px;">生成报告</el-button>
      </div>

      <!-- 表格 -->
      <el-table :data="tableData" border stripe style="width: 100%">
        <el-table-column prop="id" label="ID" width="80"></el-table-column>
        <el-table-column prop="reportName" label="报告名称" min-width="200"></el-table-column>
        <el-table-column prop="planId" label="实验方案ID" width="120"></el-table-column>
        <el-table-column prop="modelId" label="模型ID" width="100"></el-table-column>
        <el-table-column prop="version" label="版本" width="80"></el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusTagType(scope.row.status)">{{ getStatusText(scope.row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180"></el-table-column>
        <el-table-column label="操作" width="220">
          <template #default="scope">
            <el-button type="primary" size="small" @click="viewReport(scope.row)">查看</el-button>
            <el-button type="warning" size="small" @click="exportPdf(scope.row)" v-if="scope.row.status !== 3">导出PDF</el-button>
            <el-button type="danger" size="small" @click="invalidReport(scope.row.id)" v-if="scope.row.status !== 3">作废</el-button>
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

    <!-- 生成报告对话框 -->
    <el-dialog
        v-model="dialogVisible"
        title="生成分析报告"
        width="600px"
        @close="resetForm()"
    >
      <el-form :model="formData" :rules="formRules" ref="formRef" label-width="100px">
        <el-form-item label="报告名称" prop="reportName">
          <el-input v-model="formData.reportName" placeholder="请输入报告名称"></el-input>
        </el-form-item>
        <el-form-item label="实验方案ID" prop="planId">
          <el-input v-model="formData.planId" placeholder="请输入实验方案ID"></el-input>
        </el-form-item>
        <el-form-item label="统计模型" prop="modelId">
          <el-select v-model="formData.modelId" placeholder="请选择统计模型">
            <el-option label="t检验" value="1"></el-option>
            <el-option label="卡方检验" value="2"></el-option>
            <el-option label="线性回归" value="3"></el-option>
            <el-option label="方差分析" value="4"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="统计条件" prop="statConditions">
          <el-input
              v-model="formData.statConditions"
              type="textarea"
              :rows="3"
              placeholder="请输入JSON格式的统计条件"
          ></el-input>
        </el-form-item>
        <el-form-item label="报告版本" prop="version">
          <el-input v-model="formData.version" placeholder="默认1.0"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm()">生成</el-button>
      </template>
    </el-dialog>

    <!-- 查看报告对话框 -->
    <el-dialog v-model="viewDialogVisible" title="报告详情" width="800px">
      <div v-html="reportContent" style="max-height: 500px; overflow-y: auto;"></div>
      <template #footer>
        <el-button @click="viewDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getReportPage, createReport, getReportById,
  exportReportPdf, invalidReport as invalidReportApi
} from '@/api/analysisReport'

// 查询参数
const queryParams = ref({
  reportName: '',
  planId: '',
  status: ''
})

// 表格数据
const tableData = ref([])
const pageNum = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 对话框相关
const dialogVisible = ref(false)
const viewDialogVisible = ref(false)
const formRef = ref(null)

// 表单数据
const formData = reactive({
  reportName: '',
  planId: '',
  modelId: '',
  statConditions: '',
  version: '1.0'
})

// 报告内容
const reportContent = ref('')

// 表单校验规则
const formRules = ref({
  reportName: [{ required: true, message: '请输入报告名称', trigger: 'blur' }],
  planId: [{ required: true, message: '请输入实验方案ID', trigger: 'blur' }],
  modelId: [{ required: true, message: '请选择统计模型', trigger: 'change' }],
  statConditions: [{ required: true, message: '请输入统计条件', trigger: 'blur' }],
  version: [{ required: true, message: '请输入报告版本', trigger: 'blur' }]
})

// 页面加载时获取列表
onMounted(() => {
  getReportList()
})

// 获取分析报告列表
const getReportList = async () => {
  try {
    const res = await getReportPage({
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
    reportName: '',
    planId: '',
    status: ''
  }
  getReportList()
}

// 分页大小改变
const handleSizeChange = (val) => {
  pageSize.value = val
  getReportList()
}

// 当前页改变
const handleCurrentChange = (val) => {
  pageNum.value = val
  getReportList()
}

// 打开生成报告对话框
const openAddDialog = () => {
  resetForm()
  dialogVisible.value = true
}

// 重置表单
const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields()
  }
  Object.assign(formData, {
    reportName: '',
    planId: '',
    modelId: '',
    statConditions: '',
    version: '1.0'
  })
}

// 提交生成报告
const submitForm = async () => {
  try {
    await formRef.value.validate()
    const res = await createReport(formData)
    ElMessage.success(res.msg)
    dialogVisible.value = false
    getReportList()
  } catch (error) {
    console.error('生成报告失败:', error)
  }
}

// 查看报告详情
const viewReport = async (row) => {
  const res = await getReportById(row.id)
  reportContent.value = res.data.reportContent
  viewDialogVisible.value = true
}

// 导出PDF
const exportPdf = async (row) => {
  try {
    const res = await exportReportPdf(row.id)

    // 创建 Blob 对象
    const blob = new Blob([res], { type: 'application/pdf' })

    // 创建下载链接
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${row.reportName || '分析报告'}_${row.id}.pdf`
    link.click()

    // 清理 URL 对象
    window.URL.revokeObjectURL(url)

    ElMessage.success('PDF导出成功')
  } catch (error) {
    console.error('导出PDF失败:', error)
    ElMessage.error('导出PDF失败')
  }
}

// 作废报告
const invalidReport = (id) => {
  ElMessageBox.confirm(
      '确定要作废该分析报告吗？',
      '提示',
      {
        type: 'warning'
      }
  ).then(async () => {
    const res = await invalidReportApi(id)
    ElMessage.success(res.msg)
    getReportList()
  }).catch(() => {
    ElMessage.info('已取消作废')
  })
}

// 获取状态文本
const getStatusText = (status) => {
  const statusMap = {
    '1': '已生成',
    '2': '已导出',
    '3': '已作废'
  }
  return statusMap[status] || '未知'
}

// 获取状态标签类型
const getStatusTagType = (status) => {
  const typeMap = {
    '1': 'primary',
    '2': 'success',
    '3': 'danger'
  }
  return typeMap[status] || 'default'
}
</script>

<style scoped>
.analysis-report-container {
  padding: 10px;
}
</style>