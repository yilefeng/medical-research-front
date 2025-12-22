<template>
  <div class="experiment-manage-container">
    <!-- 核心卡片 -->
    <el-card>
      <!-- 卡片头部：搜索 + 新增按钮 -->
      <div class="card-header">
        <el-form :inline="true" :model="searchForm" class="search-form">
          <el-form-item label="实验名称">
            <el-input
                v-model="searchForm.planName"
                placeholder="请输入实验名称模糊查询"
                clearable
                style="width: 300px;"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="getExperimentList">查询</el-button>
            <el-button @click="resetSearch">重置</el-button>
          </el-form-item>
        </el-form>
        <el-button type="primary" icon="Plus" @click="openAddDialog">新增实验方案</el-button>
      </div>

      <!-- 实验方案表格 -->
      <el-table
          :data="experimentList"
          border
          @selection-change="handleSelectionChange"
          style="margin-top: 20px; width: 100%;"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="id" label="实验ID" width="80" align="center" />
        <el-table-column prop="planName" label="实验名称" min-width="200" align="center" />
        <el-table-column prop="researchPurpose" label="研究目的" min-width="300" align="center">
          <template #default="scope">
            <div class="text-ellipsis" :title="scope.row.researchPurpose">
              {{ scope.row.researchPurpose || '-' }}
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="modelInfo" label="模型信息" min-width="200" align="center" />
        <el-table-column prop="createTime" label="创建时间" width="200" align="center" />
        <el-table-column prop="updateTime" label="更新时间" width="200" align="center" />
        <el-table-column label="操作" width="250" align="center">
          <template #default="scope">
            <el-button
                type="primary"
                size="small"
                @click="openEditDialog(scope.row)"
            >编辑</el-button>
            <el-button
                type="danger"
                size="small"
                @click="deleteExperiment(scope.row.id)"
            >删除</el-button>
            <el-button
                type="info"
                size="small"
                @click="viewExperimentDetail(scope.row)"
            >显示</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页组件 -->
      <el-pagination
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          :current-page="currentPage"
          :page-sizes="[10, 20, 50, 100]"
          :page-size="pageSize"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          style="margin-top: 20px; text-align: right;"
      />
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <el-dialog
        :title="isEdit ? '编辑实验方案' : '新增实验方案'"
        v-model="dialogVisible"
        width="600px"
        destroy-on-close
    >
      <el-form
          :model="experimentForm"
          :rules="formRules"
          ref="formRef"
          label-width="100px"
          style="margin-top: 20px;"
      >
        <el-form-item label="实验名称" prop="planName">
          <el-input
              v-model="experimentForm.planName"
              placeholder="请输入实验方案名称"
              maxlength="255"
              show-word-limit
          />
        </el-form-item>
        <el-form-item label="研究目的" prop="researchPurpose">
          <el-input
              v-model="experimentForm.researchPurpose"
              type="textarea"
              rows="4"
              placeholder="请输入实验研究目的（如：对比两种模型在肿瘤诊断中的准确率）"
              maxlength="1000"
              show-word-limit
          />
        </el-form-item>
        <el-form-item label="模型信息" prop="modelInfo">
          <el-input
              v-model="experimentForm.modelInfo"
              placeholder="请输入模型信息（如：模型1=ResNet50，模型2=Vision Transformer）"
              maxlength="500"
              show-word-limit
          />
        </el-form-item>
        <el-form-item label="实验描述" prop="experimentDesc">
          <el-input
              v-model="experimentForm.experimentDesc"
              type="textarea"
              rows="3"
              placeholder="请输入实验补充描述（可选）"
              maxlength="2000"
              show-word-limit
          />
        </el-form-item>
      </el-form>

      <!-- 弹窗底部按钮 -->
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm">确认</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 详情查看弹窗 -->
    <el-dialog title="实验方案详情" v-model="detailVisible" width="600px" destroy-on-close>
      <el-descriptions :column="1" border style="margin-top: 20px;">
        <el-descriptions-item label="实验ID">
          {{ detailForm.id || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="实验名称">
          {{ detailForm.planName || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="研究目的">
          <div style="white-space: pre-wrap; word-break: break-all;">
            {{ detailForm.researchPurpose || '-' }}
          </div>
        </el-descriptions-item>
        <el-descriptions-item label="模型信息">
          {{ detailForm.modelInfo || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="实验描述">
          <div style="white-space: pre-wrap; word-break: break-all;">
            {{ detailForm.experimentDesc || '-' }}
          </div>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">
          {{ detailForm.createTime || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="更新时间">
          {{ detailForm.updateTime || '-' }}
        </el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button type="primary" @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'

// 搜索表单
const searchForm = reactive({
  planName: ''
})

// 表格数据
const experimentList = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const selectedIds = ref([])

// 弹窗相关
const dialogVisible = ref(false)
const detailVisible = ref(false)
const isEdit = ref(false)
const formRef = ref(null)

// 实验表单
const experimentForm = reactive({
  id: '',
  planName: '',
  researchPurpose: '',
  modelInfo: '',
  experimentDesc: ''
})

// 详情表单
const detailForm = reactive({
  id: '',
  planName: '',
  researchPurpose: '',
  modelInfo: '',
  experimentDesc: '',
  createTime: '',
  updateTime: ''
})

// 表单校验规则
const formRules = ref({
  planName: [
    { required: true, message: '请输入实验方案名称', trigger: 'blur' },
    { min: 2, max: 255, message: '长度在 2 到 255 个字符', trigger: 'blur' }
  ],
  researchPurpose: [
    { required: true, message: '请输入研究目的', trigger: 'blur' },
    { min: 5, max: 1000, message: '长度在 5 到 1000 个字符', trigger: 'blur' }
  ],
  modelInfo: [
    { required: true, message: '请输入模型信息', trigger: 'blur' },
    { min: 2, max: 500, message: '长度在 2 到 500 个字符', trigger: 'blur' }
  ]
})

// 获取实验方案列表（分页）
const getExperimentList = async () => {
  try {
    const res = await request.get('/experiment/list', {
      params: {
        planName: searchForm.planName,
        pageNum: currentPage.value,
        pageSize: pageSize.value
      }
    })
    experimentList.value = res.data.records
    total.value = res.data.total
  } catch (e) {
    ElMessage.error('获取实验列表失败：' + (e.msg || e.message))
  }
}

// 分页变化
const handleSizeChange = (val) => {
  pageSize.value = val
  getExperimentList()
}
const handleCurrentChange = (val) => {
  currentPage.value = val
  getExperimentList()
}

// 选择项变化
const handleSelectionChange = (val) => {
  selectedIds.value = val.map(item => item.id)
}

// 重置搜索
const resetSearch = () => {
  searchForm.planName = ''
  currentPage.value = 1
  getExperimentList()
}

// 打开新增弹窗
const openAddDialog = () => {
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

// 打开编辑弹窗
const openEditDialog = (row) => {
  isEdit.value = true
  // 填充表单数据
  experimentForm.id = row.id
  experimentForm.planName = row.planName
  experimentForm.researchPurpose = row.researchPurpose || ''
  experimentForm.modelInfo = row.modelInfo
  experimentForm.experimentDesc = row.experimentDesc || ''
  dialogVisible.value = true
}

// 打开详情弹窗
const viewExperimentDetail = (row) => {
  detailForm.id = row.id
  detailForm.planName = row.planName
  detailForm.researchPurpose = row.researchPurpose || ''
  detailForm.modelInfo = row.modelInfo
  detailForm.experimentDesc = row.experimentDesc || ''
  detailForm.createTime = row.createTime || ''
  detailForm.updateTime = row.updateTime || ''
  detailVisible.value = true
}

// 提交表单（新增/编辑）
const submitForm = async () => {
  if (!formRef.value) return
  // 表单校验
  await formRef.value.validate(async (valid) => {
    if (!valid) return

    try {
      if (isEdit.value) {
        // 编辑操作
        await request.put('/experiment/update', experimentForm)
        ElMessage.success('实验方案编辑成功')
      } else {
        // 新增操作
        await request.post('/experiment/add', experimentForm)
        ElMessage.success('实验方案新增成功')
      }
      // 关闭弹窗 + 刷新列表
      dialogVisible.value = false
      getExperimentList()
    } catch (e) {
      ElMessage.error((isEdit.value ? '编辑' : '新增') + '失败：' + (e.msg || e.message))
    }
  })
}

// 删除实验方案
const deleteExperiment = async (id) => {
  try {
    await ElMessageBox.confirm(
        '确定要删除该实验方案吗？删除后将无法恢复（若存在关联科研数据则删除失败）',
        '警告',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
    )
    await request.delete(`/experiment/${id}`)
    ElMessage.success('实验方案删除成功')
    getExperimentList()
  } catch (e) {
    if (e.msg !== 'cancel') {
      ElMessage.error('删除失败：' + (e.msg || e.message))
    }
  }
}

// 重置表单
const resetForm = () => {
  experimentForm.id = ''
  experimentForm.planName = ''
  experimentForm.researchPurpose = ''
  experimentForm.modelInfo = ''
  experimentForm.experimentDesc = ''
  // 清除校验状态
  if (formRef.value) {
    formRef.value.clearValidate()
  }
}

// 初始化
onMounted(() => {
  getExperimentList()
})

// 监听弹窗关闭，重置表单
watch(dialogVisible, (val) => {
  if (!val) {
    resetForm()
  }
})
</script>

<style scoped>
.experiment-manage-container {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 60px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.search-form {
  flex: 1;
}

.text-ellipsis {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dialog-footer {
  text-align: right;
}

.el-descriptions {
  --el-descriptions-label-width: 120px;
}
</style>