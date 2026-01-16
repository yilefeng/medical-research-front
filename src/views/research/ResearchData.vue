<template>
  <div class="data-manage-container">
    <el-card>
      <div class="card-header">
        <el-form :inline="true" :model="searchForm" class="search-form">
          <el-form-item label="关联实验">
            <el-select
                v-model="searchForm.experimentId"
                placeholder="请选择实验"
                clearable
                @change="getUserDataList"
            >
              <el-option
                  v-for="item in experimentList"
                  :key="item.id"
                  :label="item.planName"
                  :value="item.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button @click="resetSearch">重置</el-button>
          </el-form-item>
        </el-form>
        <div class="upload-btn">
          <el-button type="success" @click="handleUpload">上传CSV数据</el-button>
          <el-button type="danger" @click="batchDelete" :disabled="selectedIds.length === 0">批量删除</el-button>
        </div>
      </div>

      <el-table :data="dataList" border @selection-change="handleSelectionChange" style="margin-top: 20px;">
        <el-table-column type="selection" width="55" />
        <el-table-column prop="id" label="数据ID" width="80" />
        <el-table-column prop="experimentId" label="实验ID" width="80" />
        <el-table-column prop="trueLabel" label="真实标签" width="120">
          <template #default="scope">
            {{ scope.row.trueLabel === 1 ? '阳性（恶性）' : '阴性（良性）' }}
          </template>
        </el-table-column>
        <el-table-column prop="model1Score" label="模型1评分" width="120" />
        <el-table-column prop="model2Score" label="模型2评分" width="120" />
        <el-table-column prop="dataSource" label="数据来源" width="150" />
        <el-table-column prop="createTime" label="创建时间" width="200" />
        <el-table-column label="操作" width="120">
          <template #default="scope">
            <el-button type="text" @click="deleteSingle(scope.row.id)" style="color: #f56c6c;">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          :current-page="currentPage"
          :page-sizes="[10, 20, 50]"
          :page-size="pageSize"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          style="margin-top: 20px; text-align: right;"
      />
    </el-card>

    <!-- 上传数据弹窗 -->
    <el-dialog title="上传CSV科研数据" v-model="uploadDialogVisible" width="500px" @close="handleDialogClose">
      <el-form
          :model="uploadForm"
          label-width="100px"
          ref="uploadFormRef"
          :rules="uploadFormRules"
      >
        <el-form-item label="关联实验" prop="experimentId">
          <el-select v-model="uploadForm.experimentId" placeholder="请选择实验" clearable>
            <el-option
                v-for="item in experimentList"
                :key="item.id"
                :label="item.planName"
                :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="CSV文件" prop="file">
          <el-upload
              class="upload-demo"
              :auto-upload="false"
              :on-change="handleFileChange"
              :on-remove="handleFileRemove"
              :file-list="fileList"
              accept=".csv"
              ref="fileUploadRef"
              :limit="1"
              :before-upload="beforeFileUpload"
          >
            <el-button type="primary">选择文件</el-button>
            <div slot="tip" class="el-upload__tip">请上传后缀为.csv的文件，大小不超过10MB</div>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="uploadDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitUpload" :loading="uploadLoading">确认上传</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'

// 搜索表单
const searchForm = reactive({
  experimentId: ''
})
// 实验列表
const experimentList = ref([])
// 数据列表
const dataList = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
// 批量选择
const selectedIds = ref([])
// 上传相关
const uploadDialogVisible = ref(false)
const uploadForm = reactive({
  experimentId: ''
})
//完善表单验证规则
const uploadFormRules = reactive({
  experimentId: [
    { required: true, message: '请选择关联实验', trigger: 'change' }
  ],
  file: [
    {
      required: true,
      message: '请选择CSV文件',
      trigger: ['change', 'blur'],  // 增加blur触发，确保校验更全面
      validator: (rule, value, callback) => {
        if (fileList.value.length === 0) {
          callback(new Error('请选择CSV文件'))
        } else {
          callback()
        }
      }
    }
  ]
})
const fileList = ref([])
const uploadFormRef = ref(null)
const fileUploadRef = ref(null)
const selectedFile = ref(null)
//增加上传加载状态，防止重复提交
const uploadLoading = ref(false)

// 获取实验列表
const getExperimentList = async () => {
  try {
    const res = await request.get('/experiment/list', {
      params: {
        pageNum: 1,
        pageSize: 10000
      }
    })
    // 优化：校验返回数据格式，避免空数据导致下拉框异常
    if (res.data && Array.isArray(res.data.records)) {
      experimentList.value = res.data.records
    } else {
      experimentList.value = []
      ElMessage.warning('实验列表为空，请先创建实验')
    }
  } catch (e) {
    const errMsg = e.response?.data?.msg || e.message || '获取实验列表失败'
    ElMessage.error(errMsg)
    experimentList.value = []
  }
}

// 获取数据列表
const getUserDataList = async () => {
  try {
    const res = await request.get('/data/list', {
      params: {
        experimentId: searchForm.experimentId,
        pageNum: currentPage.value,
        pageSize: pageSize.value
      }
    })
    // 优化：校验返回数据格式
    if (res.data) {
      dataList.value = res.data.records || []
      total.value = res.data.total || 0
    } else {
      dataList.value = []
      total.value = 0
    }
  } catch (e) {
    const errMsg = e.response?.data?.msg || e.message || '获取数据列表失败'
    ElMessage.error(errMsg)
    dataList.value = []
    total.value = 0
  }
}

// 分页变化
const handleSizeChange = (val) => {
  pageSize.value = val
  getUserDataList()
}
const handleCurrentChange = (val) => {
  currentPage.value = val
  getUserDataList()
}

// 选择数据变化
const handleSelectionChange = (val) => {
  selectedIds.value = val.map(item => item.id)
}

// 重置搜索
const resetSearch = () => {
  searchForm.experimentId = ''
  currentPage.value = 1
  getUserDataList()
}

// 单个删除
const deleteSingle = async (id) => {
  try {
    await ElMessageBox.confirm('确定要删除该条数据吗？删除后不可恢复！', '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    const res = await request.delete(`/data/${id}`)
    // 优化：删除后处理分页（如果当前页只剩1条数据，删除后跳上一页）
    if (dataList.value.length === 1 && currentPage.value > 1) {
      currentPage.value -= 1
    }
    ElMessage.success(res?.msg || '删除成功')
    getUserDataList()
  } catch (e) {
    if (e !== 'cancel' && e?.msg !== 'cancel' && !e?.toString().includes('cancel')) {
      const errMsg = e?.response?.data?.msg || e?.message || '删除失败'
      ElMessage.error(errMsg)
    }
  }
}

// 批量删除
const batchDelete = async () => {
  try {
    await ElMessageBox.confirm('确定要批量删除选中的数据吗？删除后不可恢复！', '批量删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    const res = await request.delete(`/data/batch?ids=${selectedIds.value.join(',')}`)
    // 优化：批量删除后回到第一页（避免删除后分页无数据）
    currentPage.value = 1
    ElMessage.success(res?.msg || '批量删除成功')
    getUserDataList()
  } catch (e) {
    if (e !== 'cancel' && e?.msg !== 'cancel' && !e?.toString().includes('cancel')) {
      const errMsg = e?.response?.data?.msg || e?.message || '批量删除失败'
      ElMessage.error(errMsg)
    }
  }
}

// 打开上传弹窗
const handleUpload = () => {
  // 前置校验：确保有实验可关联
  if (experimentList.value.length === 0) {
    ElMessage.warning('暂无可用实验，请先创建实验后再上传数据')
    return
  }
  uploadDialogVisible.value = true
  // 重置表单状态
  uploadForm.experimentId = ''
  fileList.value = []
  selectedFile.value = null
  uploadLoading.value = false
  if (uploadFormRef.value) {
    uploadFormRef.value.clearValidate()
  }
  if (fileUploadRef.value) {
    fileUploadRef.value.clearFiles()  // 清空文件选择器的缓存
  }
}

//文件选择变化 - 增加格式/大小校验
const handleFileChange = (file) => {
  // 强制只保留一个文件
  fileList.value = [file]
  selectedFile.value = file.raw

  //校验文件格式（兜底，即使设置了accept也做校验）
  const fileName = file.name
  if (!fileName.endsWith('.csv')) {
    ElMessage.error('请选择后缀为.csv的文件！')
    fileList.value = []
    selectedFile.value = null
    return
  }

  //校验文件大小（10MB = 10 * 1024 * 1024 = 10485760 字节）
  const fileSize = file.size
  const maxSize = 10 * 1024 * 1024
  if (fileSize > maxSize) {
    ElMessage.error('文件大小不能超过10MB，请重新选择！')
    fileList.value = []
    selectedFile.value = null
    return
  }
}

// 文件移除事件 - 清空选中文件
const handleFileRemove = () => {
  fileList.value = []
  selectedFile.value = null
  // 重置文件字段的校验状态
  if (uploadFormRef.value) {
    uploadFormRef.value.clearValidate('file')
  }
}

//文件上传前校验（兜底）
const beforeFileUpload = (file) => {
  const fileName = file.name
  const fileSize = file.size
  const maxSize = 10 * 1024 * 1024

  if (!fileName.endsWith('.csv')) {
    ElMessage.error('仅支持上传.csv格式的文件！')
    return false
  }
  if (fileSize > maxSize) {
    ElMessage.error('文件大小不能超过10MB！')
    return false
  }
  return true
}

//弹窗关闭时清理状态
const handleDialogClose = () => {
  fileList.value = []
  selectedFile.value = null
  uploadLoading.value = false
  if (uploadFormRef.value) {
    uploadFormRef.value.clearValidate()
  }
  if (fileUploadRef.value) {
    fileUploadRef.value.clearFiles()
  }
}

// 提交上传
const submitUpload = async () => {
  if (!uploadFormRef.value) return

  try {
    // 1. 表单验证
    await uploadFormRef.value.validate()
    // 2. 二次校验文件（兜底）
    if (!selectedFile.value) {
      ElMessage.error('请选择要上传的CSV文件！')
      return
    }

    uploadLoading.value = true
    // 3. 构造FormData
    const formData = new FormData()
    formData.append('experimentId', uploadForm.experimentId)
    formData.append('file', selectedFile.value)

    // 4. 提交上传请求
    const res = await request.post('/data/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      // 增加超时配置
      timeout: 60000  // 60秒超时（适配大文件上传）
    })

    ElMessage.success(res?.msg || 'CSV数据上传成功！')
    uploadDialogVisible.value = false
    // 5. 上传成功后刷新数据列表（回到第一页）
    currentPage.value = 1
    getUserDataList()
  } catch (e) {
    // 表单验证失败不提示
    if (e?.name === 'ValidationError') return
    // 上传失败提示
    const errMsg = e?.response?.data?.msg || e?.message || 'CSV数据上传失败，请稍后重试！'
    ElMessage.error(errMsg)
  } finally {
    // 无论成功失败，都关闭加载状态
    uploadLoading.value = false
  }
}

// 初始化
onMounted(() => {
  getExperimentList()
  getUserDataList()
})
</script>

<style scoped>
.data-manage-container {
  padding: 20px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.search-form {
  flex: 1;
}
.upload-btn {
  flex: 1;
  text-align: right;
}
.dialog-footer {
  text-align: right;
}

/* 下拉框样式优化 */
:deep(.search-form .el-select) {
  width: 250px;
  min-width: 220px;
}
:deep(.search-form .el-select-dropdown) {
  min-width: 280px;
}
:deep(.el-dialog .el-select) {
  width: 100%;
}
:deep(.el-dialog .el-select-dropdown) {
  min-width: 300px;
}

/* 优化：表格空数据样式（补充验收细节） */
:deep(.el-table__empty-text) {
  color: #909399;
  font-size: 14px;
}

/* 优化：按钮交互样式 */
:deep(.el-button--text) {
  &:hover {
    color: #f78989 !important;
  }
}
</style>