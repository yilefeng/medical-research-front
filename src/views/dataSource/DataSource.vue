<template>
  <div class="data-source-container">
    <el-card>
      <!-- 查询表单 -->
      <div class="card-header">
        <el-input
            v-model="queryParams.sourceName"
            placeholder="请输入数据源名称"
            style="width: 200px; margin-right: 10px;"
            clearable
        ></el-input>
        <el-select
            v-model="queryParams.sourceType"
            placeholder="请选择数据源类型"
            style="width: 150px; margin-right: 10px;"
            clearable
        >
          <el-option label="Excel" value="Excel"></el-option>
          <el-option label="数据库" value="数据库"></el-option>
        </el-select>
        <el-button type="primary" @click="getSourceList()">查询</el-button>
        <el-button @click="resetQuery()">重置</el-button>
        <el-button type="success" @click="openExcelSourceDialog()" style="margin-left: 10px;">新增Excel源</el-button>
        <el-button type="warning" @click="openDbSourceDialog()" style="margin-left: 10px;">新增数据库源</el-button>
      </div>

      <!-- 表格 -->
      <el-table :data="tableData" border stripe style="width: 100%">
        <el-table-column prop="id" label="ID" width="80"></el-table-column>
        <el-table-column prop="sourceName" label="数据源名称" min-width="200"></el-table-column>
        <el-table-column prop="sourceType" label="类型" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.sourceType === 'Excel' ? 'info' : 'primary'">
              {{ scope.row.sourceType }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="filePath" label="文件路径" min-width="300" v-if="showFilePath">
          <template #default="scope">
            <a :href="scope.row.filePath" target="_blank" v-if="scope.row.filePath">查看文件</a>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="dbUrl" label="数据库地址" min-width="250" v-if="showDbInfo">
          <template #default="scope">
            {{ scope.row.dbUrl || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="dbUsername" label="数据库账号" width="120" v-if="showDbInfo">
          <template #default="scope">
            {{ scope.row.dbUsername || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180"></el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="scope">
            <el-button type="primary" size="small" @click="openEditDialog(scope.row)">编辑</el-button>
            <el-button
                type="success"
                size="small"
                @click="testDbConnection(scope.row)"
                v-if="scope.row.sourceType === '数据库'"
            >测试连接</el-button>
            <el-button type="danger" size="small" @click="deleteSource(scope.row.id)">删除</el-button>
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

    <!-- Excel数据源新增对话框 -->
    <el-dialog
        v-model="excelDialogVisible"
        title="新增Excel数据源"
        width="500px"
    >
      <el-form :model="excelForm" :rules="excelFormRules" ref="excelFormRef" label-width="100px">
        <el-form-item label="数据源名称" prop="sourceName">
          <el-input v-model="excelForm.sourceName" placeholder="请输入数据源名称"></el-input>
        </el-form-item>
        <el-form-item label="Excel文件" prop="file">
          <el-upload
              class="upload-demo"
              :action="uploadUrl"
              :headers="uploadHeaders"
              :on-success="handleExcelUploadSuccess"
              :before-upload="beforeExcelUpload"
              :auto-upload="false"
              ref="uploadRef"
          >
            <el-button type="primary">点击上传</el-button>
            <div slot="tip" class="el-upload__tip">只能上传Excel文件，且不超过10MB</div>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="excelDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitExcelSource()">确定</el-button>
      </template>
    </el-dialog>

    <!-- 数据库数据源新增/编辑对话框 -->
    <el-dialog
        v-model="dbDialogVisible"
        :title="dbDialogTitle"
        width="600px"
        @close="resetDbForm()"
    >
      <el-form :model="dbForm" :rules="dbFormRules" ref="dbFormRef" label-width="100px">
        <el-form-item label="数据源名称" prop="sourceName">
          <el-input v-model="dbForm.sourceName" placeholder="请输入数据源名称"></el-input>
        </el-form-item>
        <el-form-item label="数据库地址" prop="dbUrl">
          <el-input v-model="dbForm.dbUrl" placeholder="如：jdbc:mysql://localhost:3306/test"></el-input>
        </el-form-item>
        <el-form-item label="数据库账号" prop="dbUsername">
          <el-input v-model="dbForm.dbUsername" placeholder="请输入数据库账号"></el-input>
        </el-form-item>
        <el-form-item label="数据库密码" prop="dbPassword">
          <el-input v-model="dbForm.dbPassword" type="password" placeholder="请输入数据库密码"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dbDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitDbSource()">确定</el-button>
        <el-button
            type="success"
            @click="testConnection()"
            v-if="isEditDb"
        >测试连接</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getToken } from '@/utils/auth'
import {
  getSourcePage, createExcelSource, createDbSource,
  updateSource, deleteSource as deleteSourceApi, getSourceById,
  testDbConnection as testDbConnectionApi
} from '@/api/dataSource'

// 查询参数
const queryParams = ref({
  sourceName: '',
  sourceType: ''
})

// 表格数据
const tableData = ref([])
const pageNum = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 控制表格列显示
const showFilePath = ref(true)
const showDbInfo = ref(true)

// 对话框相关
const excelDialogVisible = ref(false)
const dbDialogVisible = ref(false)
const dbDialogTitle = ref('新增数据库数据源')
const isEditDb = ref(false)

// 表单引用
const excelFormRef = ref(null)
const dbFormRef = ref(null)
const uploadRef = ref(null)

// Excel表单数据
const excelForm = reactive({
  sourceName: '',
  file: ''
})

// 数据库表单数据
const dbForm = reactive({
  id: '',
  sourceName: '',
  dbUrl: '',
  dbUsername: '',
  dbPassword: ''
})

// 上传配置
const uploadUrl = ref('/api/data/source/excel')
const uploadHeaders = ref({
  token: getToken()
})
let uploadedFilePath = ref('')

// 表单校验规则
const excelFormRules = ref({
  sourceName: [{ required: true, message: '请输入数据源名称', trigger: 'blur' }],
  file: [{ required: true, message: '请上传Excel文件', trigger: 'change' }]
})

const dbFormRules = ref({
  sourceName: [{ required: true, message: '请输入数据源名称', trigger: 'blur' }],
  dbUrl: [{ required: true, message: '请输入数据库地址', trigger: 'blur' }],
  dbUsername: [{ required: true, message: '请输入数据库账号', trigger: 'blur' }],
  dbPassword: [{ required: true, message: '请输入数据库密码', trigger: 'blur' }]
})

// 监听数据源类型，控制表格列显示
watch(() => queryParams.value.sourceType, (val) => {
  if (val === 'Excel') {
    showFilePath.value = true
    showDbInfo.value = false
  } else if (val === '数据库') {
    showFilePath.value = false
    showDbInfo.value = true
  } else {
    showFilePath.value = true
    showDbInfo.value = true
  }
})

// 页面加载时获取列表
onMounted(() => {
  getSourceList()
})

// 获取数据源列表
const getSourceList = async () => {
  try {
    const res = await getSourcePage({
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
    sourceName: '',
    sourceType: ''
  }
  showFilePath.value = true
  showDbInfo.value = true
  getSourceList()
}

// 分页大小改变
const handleSizeChange = (val) => {
  pageSize.value = val
  getSourceList()
}

// 当前页改变
const handleCurrentChange = (val) => {
  pageNum.value = val
  getSourceList()
}

// 打开Excel数据源新增对话框
const openExcelSourceDialog = () => {
  excelForm.sourceName = ''
  uploadedFilePath.value = ''
  if (uploadRef.value) {
    uploadRef.value.clearFiles()
  }
  excelDialogVisible.value = true
}

// 打开数据库数据源新增对话框
const openDbSourceDialog = () => {
  dbDialogTitle.value = '新增数据库数据源'
  isEditDb.value = false
  resetDbForm()
  dbDialogVisible.value = true
}

// 打开编辑对话框
const openEditDialog = async (row) => {
  if (row.sourceType === 'Excel') {
    ElMessage.warning('Excel数据源暂不支持编辑，请删除后重新上传')
    return
  }

  dbDialogTitle.value = '编辑数据库数据源'
  isEditDb.value = true
  resetDbForm()

  // 获取详情
  const res = await getSourceById(row.id)
  Object.assign(dbForm, res.data)
  dbDialogVisible.value = true
}

// 重置数据库表单
const resetDbForm = () => {
  if (dbFormRef.value) {
    dbFormRef.value.resetFields()
  }
  Object.assign(dbForm, {
    id: '',
    sourceName: '',
    dbUrl: '',
    dbUsername: '',
    dbPassword: ''
  })
}

// Excel文件上传前校验
const beforeExcelUpload = (file) => {
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

// Excel上传成功回调
const handleExcelUploadSuccess = (res) => {
  uploadedFilePath.value = res.data
  ElMessage.success('文件上传成功')
}

// 提交Excel数据源
const submitExcelSource = async () => {
  if (!excelForm.sourceName) {
    ElMessage.warning('请输入数据源名称')
    return
  }
  if (!uploadedFilePath.value) {
    // 手动触发上传
    uploadRef.value.submit()
    return
  }

  try {
    const formData = new FormData()
    formData.append('sourceName', excelForm.sourceName)
    formData.append('file', uploadedFilePath.value)

    const res = await createExcelSource(formData)
    ElMessage.success(res.msg)
    excelDialogVisible.value = false
    getSourceList()
  } catch (error) {
    console.error('创建Excel数据源失败:', error)
  }
}

// 提交数据库数据源
const submitDbSource = async () => {
  try {
    await dbFormRef.value.validate()
    let res
    if (isEditDb.value) {
      res = await updateSource(dbForm.id, dbForm)
    } else {
      res = await createDbSource(dbForm)
    }
    ElMessage.success(res.msg)
    dbDialogVisible.value = false
    getSourceList()
  } catch (error) {
    console.error('提交失败:', error)
  }
}

// 测试数据库连接
const testConnection = async () => {
  try {
    await dbFormRef.value.validate()
    const res = await testDbConnection(dbForm)
    ElMessage.success(res.msg)
  } catch (error) {
    ElMessage.error('连接失败：' + error.msg)
  }
}

// 测试现有数据源连接
const testDbConnection = async (row) => {
  try {
    const res = await testDbConnection({
      dbUrl: row.dbUrl,
      dbUsername: row.dbUsername,
      dbPassword: row.dbPassword
    })
    ElMessage.success(res.msg)
  } catch (error) {
    ElMessage.error('连接失败：' + error.msg)
  }
}

// 删除数据源
const deleteSource = (id) => {
  ElMessageBox.confirm(
      '确定要删除该数据源吗？',
      '提示',
      {
        type: 'warning'
      }
  ).then(async () => {
    const res = await deleteSource(id)
    ElMessage.success(res.msg)
    getSourceList()
  }).catch(() => {
    ElMessage.info('已取消删除')
  })
}
</script>

<style scoped>
.data-source-container {
  padding: 10px;
}

.upload-demo {
  margin-bottom: 0;
}
</style>