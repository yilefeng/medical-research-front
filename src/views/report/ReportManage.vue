<template>
  <div class="report-manage-container">
    <el-card>
      <div class="card-header">
        <el-form :inline="true" :model="searchForm" class="search-form">
          <el-form-item label="报告名称">
            <el-input v-model="searchForm.reportName" placeholder="请输入报告名称模糊查询" clearable />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="getReportList">查询</el-button>
            <el-button @click="resetSearch">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <el-table :data="reportList" border @selection-change="handleSelectionChange" style="margin-top: 20px;">
        <el-table-column type="selection" width="55" />
        <el-table-column prop="id" label="报告ID" width="80" align="center" />
        <el-table-column prop="reportName" label="报告名称" min-width="200" align="center" />
        <el-table-column prop="experimentId" label="关联实验ID" width="100" align="center" />
        <el-table-column prop="testMethod" label="检验方法" width="150" align="center" />
        <el-table-column prop="auc1" label="模型1 AUC" width="120" align="center">
          <template #default="scope">
            {{ scope.row.auc1 ? scope.row.auc1.toFixed(4) : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="auc2" label="模型2 AUC" width="120" align="center">
          <template #default="scope">
            {{ scope.row.auc2 ? scope.row.auc2.toFixed(4) : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="pValue" label="双侧P值" width="120" align="center">
          <template #default="scope">
            {{ scope.row.pValue ? scope.row.pValue.toFixed(4) : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="200" align="center" />
        <el-table-column label="操作" width="280" align="center">
          <template #default="scope">
            <el-button type="primary" size="small" @click="previewReport(scope.row)">预览PDF</el-button>
            <el-button type="success" size="small" @click="downloadReport(scope.row)" style="margin-left: 5px;">下载PDF</el-button>
            <el-button type="info" size="small" @click="previewRocImage(scope.row)" style="margin-left: 5px;" :disabled="!scope.row.rocImagePath">查看ROC图</el-button>
            <el-button type="danger" size="small" @click="deleteReport(scope.row.id)" style="margin-left: 5px;">删除</el-button>
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

    <!-- PDF预览弹窗 -->
    <el-dialog title="分析报告PDF预览" v-model="pdfPreviewVisible" width="800px" append-to-body>
      <img
          :src="pdfPreviewUrl"
          style="width: 100%; height: auto;"
      />
    </el-dialog>

    <!-- ROC图片预览弹窗 -->
    <el-dialog title="ROC曲线高清图" v-model="rocImagePreviewVisible" width="800px" append-to-body>
      <img :src="rocImagePreviewUrl" style="width: 100%; height: auto;" />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'

// 搜索表单
const searchForm = reactive({
  reportName: ''
})

// 报告列表
const reportList = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const selectedIds = ref([])

// 预览弹窗
const pdfPreviewVisible = ref(false)
const pdfPreviewUrl = ref('')
const rocImagePreviewVisible = ref(false)
const rocImagePreviewUrl = ref('')

// 获取报告列表
const getReportList = async () => {
  try {
    const res = await request.get('/report/list', {
      params: {
        reportName: searchForm.reportName,
        pageNum: currentPage.value,
        pageSize: pageSize.value
      }
    })
    reportList.value = res.data.records
    total.value = res.data.total
  } catch (e) {
    ElMessage.error('获取报告列表失败：' + e.msg)
  }
}

// 选择变化
const handleSelectionChange = (val) => {
  selectedIds.value = val.map(item => item.id)
}

// 分页变化
const handleSizeChange = (val) => {
  pageSize.value = val
  getReportList()
}
const handleCurrentChange = (val) => {
  currentPage.value = val
  getReportList()
}

// 重置搜索
const resetSearch = () => {
  searchForm.reportName = ''
  getReportList()
}

// 预览PDF报告
const previewReport = (row) => {
  if (!row.pdfPath) {
    ElMessage.warning('该报告暂无PDF文件可预览')
    return
  }
  // PDF预览, 从服务器获取
  pdfPreviewUrl.value = 'http://localhost:8080/api/download/?png=true&path=' + row.pdfPath
  pdfPreviewVisible.value = true
}

// 下载PDF报告
const downloadReport = (row) => {
  if (!row.pdfPath) {
    ElMessage.warning('该报告暂无PDF文件可下载')
    return
  }
  window.open('http://localhost:8080/api/download/?open=false&path=' + row.pdfPath)
}

// 预览ROC图片
const previewRocImage = (row) => {
  if (!row.rocImagePath) {
    ElMessage.warning('该报告暂无ROC图片可预览')
    return
  }
  rocImagePreviewUrl.value = 'http://localhost:8080/api/download/?path=' + row.rocImagePath
  rocImagePreviewVisible.value = true
}

// 删除单个报告
const deleteReport = async (id) => {
  try {
    await ElMessageBox.confirm('确定要删除该报告吗？删除后将无法恢复（含PDF及ROC图片）', '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    const res = await request.delete(`/report/${id}`)
    ElMessage.success(res.msg)
    getReportList()
  } catch (e) {
    if (e.msg !== 'cancel') {
      ElMessage.error('删除失败：' + e.msg)
    }
  }
}

// 初始化
onMounted(() => {
  getReportList()
})
</script>

<style scoped>
.report-manage-container {
  padding: 20px;
}
.card-header {
  display: flex;
  justify-content: flex-start;
  align-items: center;
}
.search-form {
  width: 100%;
}
</style>