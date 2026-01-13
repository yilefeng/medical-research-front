<template>
  <div class="data-manage-container">
    <el-card>
      <div class="card-header">
        <el-form :inline="true" :model="searchForm" class="search-form">
          <el-form-item label="关联实验">
            <!-- 关键修改：添加@change事件，选择后自动查询 -->
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
<!--            <el-button type="primary" @click="getUserDataList">查询</el-button>-->
            <el-button @click="resetSearch">重置</el-button>
          </el-form-item>
        </el-form>
        <div class="upload-btn">
          <el-upload
              class="upload-demo"
              action="#"
              :auto-upload="false"
              ref="uploadRef"
          >
            <el-button type="success" @click="handleUpload">上传CSV数据</el-button>
          </el-upload>
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
    <el-dialog title="上传CSV科研数据" v-model="uploadDialogVisible" width="500px">
      <!-- 关键修改：添加表单验证规则 -->
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
              :file-list="fileList"
              accept=".csv"
              ref="fileUploadRef"
          >
            <el-button type="primary">选择文件</el-button>
            <div slot="tip" class="el-upload__tip">请上传后缀为.csv的文件，大小不超过10MB</div>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="uploadDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitUpload">确认上传</el-button>
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
// 关键修改：上传表单验证规则
const uploadFormRules = reactive({
  experimentId: [
    { required: true, message: '请选择关联实验', trigger: 'change' }
  ],
  file: [
    { required: true, message: '请选择CSV文件', trigger: 'change' }
  ]
})
const fileList = ref([])
const uploadFormRef = ref(null)
const fileUploadRef = ref(null)
const uploadRef = ref(null)
const selectedFile = ref(null)

// 获取实验列表
const getExperimentList = async () => {
  try {
    const res = await request.get('/experiment/list', {
      params: {
        pageNum: 1,
        pageSize: 10000
      }
    })
    experimentList.value = res.data.records
  } catch (e) {
    // 关键修改：兼容不同错误信息格式
    const errMsg = e.response?.data?.msg || e.message || '获取实验列表失败'
    ElMessage.error(errMsg)
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
    dataList.value = res.data.records
    total.value = res.data.total
  } catch (e) {
    // 关键修改：兼容不同错误信息格式
    const errMsg = e.response?.data?.msg || e.message || '获取数据列表失败'
    ElMessage.error(errMsg)
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
  getUserDataList()
}

// 单个删除
const deleteSingle = async (id) => {
  try {
    await ElMessageBox.confirm('确定要删除该条数据吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    const res = await request.delete(`/data/${id}`)
    ElMessage.success(res.msg || '删除成功')
    getUserDataList()
  } catch (e) {
    // 关键修改：兼容取消操作和不同错误格式
    if (e !== 'cancel' && e.msg !== 'cancel') {
      const errMsg = e.response?.data?.msg || e.message || '删除失败'
      ElMessage.error(errMsg)
    }
  }
}

// 批量删除
const batchDelete = async () => {
  try {
    await ElMessageBox.confirm('确定要批量删除选中的数据吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    const res = await request.delete(`/data/batch?ids=${selectedIds.value.join(',')}`)
    ElMessage.success(res.msg || '批量删除成功')
    getUserDataList()
  } catch (e) {
    if (e !== 'cancel' && e.msg !== 'cancel') {
      const errMsg = e.response?.data?.msg || e.message || '批量删除失败'
      ElMessage.error(errMsg)
    }
  }
}

// 打开上传弹窗
const handleUpload = () => {
  uploadDialogVisible.value = true
  uploadForm.experimentId = ''
  fileList.value = []
  selectedFile.value = null
  // 关键修改：重置表单验证状态
  if (uploadFormRef.value) {
    uploadFormRef.value.clearValidate()
  }
}

// 文件变化
const handleFileChange = (file) => {
  fileList.value = [file]
  selectedFile.value = file.raw
}

// 提交上传
const submitUpload = async () => {
  // 关键修改：使用表单验证
  if (!uploadFormRef.value) return
  try {
    await uploadFormRef.value.validate()
    // 验证通过后提交
    const formData = new FormData()
    formData.append('experimentId', uploadForm.experimentId)
    formData.append('file', selectedFile.value)

    const res = await request.post('/data/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    ElMessage.success(res.msg || '上传成功')
    uploadDialogVisible.value = false
    getUserDataList()
  } catch (e) {
    // 表单验证失败不提示错误
    if (e.name === 'ValidationError') return
    // 接口请求失败提示
    const errMsg = e.response?.data?.msg || e.message || '上传失败'
    ElMessage.error(errMsg)
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

/* 关键修改：调整下拉框宽度，解决宽度不足问题 */
/* 搜索栏的关联实验下拉框 */
:deep(.search-form .el-select) {
  width: 250px; /* 可根据需求调整，比如220px/300px */
  /* 也可设置最小宽度：min-width: 220px; */
}
/* 搜索栏下拉选项面板 */
:deep(.search-form .el-select-dropdown) {
  min-width: 280px; /* 面板宽度略大于输入框，避免长名称截断 */
}

/* 上传弹窗中的关联实验下拉框 */
:deep(.el-dialog .el-select) {
  width: 100%; /* 占满父容器，最大化利用弹窗空间 */
}
:deep(.el-dialog .el-select-dropdown) {
  min-width: 300px; /* 弹窗内下拉面板宽度适配 */
}
</style>