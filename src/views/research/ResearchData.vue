<template>
  <div class="research-data-container">
    <el-card>
      <!-- 查询表单 -->
      <div class="card-header">
        <el-input
            v-model="queryParams.experimentNo"
            placeholder="请输入实验编号"
            style="width: 200px; margin-right: 10px;"
            clearable
        ></el-input>
        <el-input
            v-model="queryParams.modelName"
            placeholder="请输入模型名称"
            style="width: 200px; margin-right: 10px;"
            clearable
        ></el-input>
        <el-input
            v-model="queryParams.dataset"
            placeholder="请输入数据集名称"
            style="width: 200px; margin-right: 10px;"
            clearable
        ></el-input>
        <el-button type="primary" @click="getDataList()">查询</el-button>
        <el-button @click="resetQuery()">重置</el-button>
        <el-button type="success" @click="openAddDialog()" style="margin-left: 10px;">新增</el-button>
        <el-upload
            class="upload-demo"
            :action="importUrl"
            :headers="uploadHeaders"
            :on-success="handleImportSuccess"
            :before-upload="beforeUpload"
            style="display: inline-block; margin-left: 10px;"
        >
          <el-button type="warning">Excel导入</el-button>
        </el-upload>
        <el-button type="info" @click="handleExport()" style="margin-left: 10px;">Excel导出</el-button>
      </div>

      <!-- 表格 -->
      <el-table :data="tableData" border stripe style="width: 100%">
        <el-table-column prop="id" label="ID" width="80"></el-table-column>
        <el-table-column prop="experimentNo" label="实验编号" width="150"></el-table-column>
        <el-table-column prop="modelName" label="模型名称" width="120"></el-table-column>
        <el-table-column prop="dataset" label="数据集" width="150"></el-table-column>
        <el-table-column prop="accuracy" label="准确率" width="100">
          <template #default="scope">
            {{ scope.row.accuracy ? scope.row.accuracy.toFixed(4) : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="precision" label="精确率" width="100">
          <template #default="scope">
            {{ scope.row.precision ? scope.row.precision.toFixed(4) : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="recall" label="召回率" width="100">
          <template #default="scope">
            {{ scope.row.recall ? scope.row.recall.toFixed(4) : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="f1Score" label="F1分数" width="100">
          <template #default="scope">
            {{ scope.row.f1Score ? scope.row.f1Score.toFixed(4) : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180"></el-table-column>
        <el-table-column label="操作" width="180">
          <template #default="scope">
            <el-button type="primary" size="small" @click="openEditDialog(scope.row)">编辑</el-button>
            <el-button type="danger" size="small" @click="deleteData(scope.row.id)">删除</el-button>
            <el-button type="info" size="small" @click="viewChart(scope.row)">可视化</el-button>
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
        <el-form-item label="实验编号" prop="experimentNo">
          <el-input v-model="formData.experimentNo" placeholder="请输入实验编号"></el-input>
        </el-form-item>
        <el-form-item label="模型名称" prop="modelName">
          <el-input v-model="formData.modelName" placeholder="请输入模型名称"></el-input>
        </el-form-item>
        <el-form-item label="数据集" prop="dataset">
          <el-input v-model="formData.dataset" placeholder="请输入数据集名称"></el-input>
        </el-form-item>
        <el-form-item label="准确率" prop="accuracy">
          <el-input
              v-model="formData.accuracy"
              type="number"
              step="0.0001"
              min="0"
              max="1"
              placeholder="请输入准确率（0-1）"
          ></el-input>
        </el-form-item>
        <el-form-item label="精确率" prop="precision">
          <el-input
              v-model="formData.precision"
              type="number"
              step="0.0001"
              min="0"
              max="1"
              placeholder="请输入精确率（0-1）"
          ></el-input>
        </el-form-item>
        <el-form-item label="召回率" prop="recall">
          <el-input
              v-model="formData.recall"
              type="number"
              step="0.0001"
              min="0"
              max="1"
              placeholder="请输入召回率（0-1）"
          ></el-input>
        </el-form-item>
        <el-form-item label="F1分数" prop="f1Score">
          <el-input
              v-model="formData.f1Score"
              type="number"
              step="0.0001"
              min="0"
              max="1"
              placeholder="请输入F1分数（0-1）"
          ></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm()">确定</el-button>
      </template>
    </el-dialog>

    <!-- 可视化图表对话框 -->
    <el-dialog v-model="chartDialogVisible" title="模型性能可视化" width="800px" height="600px">
      <div ref="chartRef" class="chart-container"></div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted,nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as echarts from 'echarts'
import { getToken } from '@/utils/auth'
import {
  getDataPage, createData, updateData, deleteData as deleteDataApi,
  getDataById, importResearchData, exportResearchData,
  getVisualData
} from '@/api/researchData'

// 查询参数
const queryParams = ref({
  experimentNo: '',
  modelName: '',
  dataset: ''
})

// 表格数据
const tableData = ref([])
const pageNum = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 对话框相关
const dialogVisible = ref(false)
const chartDialogVisible = ref(false)
const dialogTitle = ref('新增科研数据')
const isEdit = ref(false)
const formRef = ref(null)

// 表单数据
const formData = reactive({
  id: '',
  experimentNo: '',
  modelName: '',
  dataset: '',
  accuracy: '',
  precision: '',
  recall: '',
  f1Score: ''
})

// 上传相关
const importUrl = ref('/api/research/data/import')
const uploadHeaders = ref({
  token: getToken()
})

// 图表相关
const chartRef = ref(null)
let chartInstance = null

// 表单校验规则
const formRules = ref({
  experimentNo: [{ required: true, message: '请输入实验编号', trigger: 'blur' }],
  modelName: [{ required: true, message: '请输入模型名称', trigger: 'blur' }],
  dataset: [{ required: true, message: '请输入数据集名称', trigger: 'blur' }],
  accuracy: [
    { required: true, message: '请输入准确率', trigger: 'blur' },
    { type: 'number', min: 0, max: 1, message: '准确率必须在0-1之间', trigger: 'blur', transform: value => parseFloat(value) }
  ],
  precision: [
    { required: true, message: '请输入精确率', trigger: 'blur' },
    { type: 'number', min: 0, max: 1, message: '精确率必须在0-1之间', trigger: 'blur', transform: value => parseFloat(value) }
  ],
  recall: [
    { required: true, message: '请输入召回率', trigger: 'blur' },
    { type: 'number', min: 0, max: 1, message: '召回率必须在0-1之间', trigger: 'blur', transform: value => parseFloat(value)}
  ],
  f1Score: [
    { required: true, message: '请输入F1分数', trigger: 'blur' },
    { type: 'number', min: 0, max: 1, message: 'F1分数必须在0-1之间', trigger: 'blur', transform: value => parseFloat(value) }
  ]
})

// 页面加载时获取列表
onMounted(() => {
  getDataList()
})

// 销毁图表实例
onUnmounted(() => {
  if (chartInstance) {
    chartInstance.dispose()
  }
})

// 获取科研数据列表
const getDataList = async () => {
  try {
    const res = await getDataPage({
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
    experimentNo: '',
    modelName: '',
    dataset: ''
  }
  getDataList()
}

// 分页大小改变
const handleSizeChange = (val) => {
  pageSize.value = val
  getDataList()
}

// 当前页改变
const handleCurrentChange = (val) => {
  pageNum.value = val
  getDataList()
}

// 打开新增对话框
const openAddDialog = () => {
  dialogTitle.value = '新增科研数据'
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

// 打开编辑对话框
const openEditDialog = async (row) => {
  dialogTitle.value = '编辑科研数据'
  isEdit.value = true
  resetForm()

  // 获取详情
  const res = await getDataById(row.id)
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
    experimentNo: '',
    modelName: '',
    dataset: '',
    accuracy: '',
    precision: '',
    recall: '',
    f1Score: ''
  })
}

// 提交表单
const submitForm = async () => {
  try {
    await formRef.value.validate()
    let res
    if (isEdit.value) {
      res = await updateData(formData.id, formData)
    } else {
      res = await createData(formData)
    }
    ElMessage.success(res.msg)
    dialogVisible.value = false
    getDataList()
  } catch (error) {
    console.error('提交失败:', error)
  }
}

// 删除科研数据
const deleteData = (id) => {
  ElMessageBox.confirm(
      '确定要删除该科研数据吗？',
      '提示',
      {
        type: 'warning'
      }
  ).then(async () => {
    const res = await deleteDataApi(id)
    ElMessage.success(res.msg)
    getDataList()
  }).catch(() => {
    ElMessage.info('已取消删除')
  })
}

// 文件上传前校验
const beforeUpload = (file) => {
  const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.type === 'application/vnd.ms-excel'
  if (!isExcel) {
    ElMessage.error('只能上传Excel文件！')
    return false
  }
  const isLt10M = file.size / 1024 / 1024 < 10
  if (!isLt10M) {
    ElMessage.error('文件大小不能超过10MB！')
    return false
  }
  return true
}

// 导入成功回调
const handleImportSuccess = (res) => {
  ElMessage.success('数据导入成功')
  getDataList()
}

// 导出Excel
const handleExport = async () => {
  try {
    const res = await exportResearchData({
      experimentNo: queryParams.value.experimentNo
    })
    // 创建下载链接
    const blob = new Blob([res], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `科研数据_${new Date().getTime()}.xlsx`
    link.click()
    window.URL.revokeObjectURL(url)
    ElMessage.success('导出成功')
  } catch (error) {
    console.error('导出失败:', error)
  }
}

// 查看可视化图表
const viewChart = async (row) => {
  chartDialogVisible.value = true

  // 获取可视化数据
  const res = await getVisualData(row.experimentNo)

  // 初始化图表
  if (!chartInstance) {
    chartInstance = echarts.init(chartRef.value)
  }

  // 图表配置
  const option = {
    title: {
      text: `${row.experimentNo} 模型性能对比`,
      left: 'center'
    },
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['准确率', '精确率', '召回率', 'F1分数'],
      bottom: 0
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: res.data.map(item => item.modelName)
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 1,
      interval: 0.1
    },
    series: [
      {
        name: '准确率',
        type: 'bar',
        data: res.data.map(item => Number(item.accuracy))
      },
      {
        name: '精确率',
        type: 'bar',
        data: res.data.map(item => Number(item.precision))
      },
      {
        name: '召回率',
        type: 'bar',
        data: res.data.map(item => Number(item.recall))
      },
      {
        name: 'F1分数',
        type: 'bar',
        data: res.data.map(item => Number(item.f1Score))
      }
    ]
  }

  chartInstance.setOption(option)

  // 自适应窗口大小
  window.addEventListener('resize', () => {
    chartInstance.resize()
  })
}

</script>

<style scoped>
.research-data-container {
  padding: 10px;
}
</style>