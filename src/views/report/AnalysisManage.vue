<template>
  <div class="analysis-container">
    <el-card>
      <el-form :model="analysisForm" label-width="100px" ref="analysisFormRef">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="关联实验" prop="experimentId" required>
              <el-select v-model="analysisForm.experimentId" placeholder="请选择实验" clearable>
                <el-option
                    v-for="item in experimentList"
                    :key="item.id"
                    :label="item.planName"
                    :value="item.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="检验方法" prop="testMethod" required>
              <el-select v-model="analysisForm.testMethod" placeholder="请选择检验方法" clearable>
                <el-option label="DeLong检验（AUC比较）" value="DeLong检验" />
                <el-option label="单独AUC计算" value="AUC计算" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="报告名称" prop="reportName" required>
              <el-input v-model="analysisForm.reportName" placeholder="请输入报告名称" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20" style="margin-top: 20px;">
          <el-col :span="24">
            <el-form-item>
              <el-button type="primary" @click="openDataDialog">选择科研数据</el-button>
              <el-button type="success" @click="executeAnalysis" :disabled="!dataSelected">执行统计分析</el-button>
              <el-button type="info" @click="resetForm">重置表单</el-button>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <!-- 数据选择弹窗 -->
    <el-dialog title="选择科研数据" v-model="dataDialogVisible" width="800px">
      <el-table :data="dataList" border @selection-change="handleDataSelection" :loading="dataLoading">
        <el-table-column type="selection" width="55" />
        <el-table-column prop="id" label="数据ID" width="80" />
        <el-table-column prop="trueLabel" label="真实标签" width="120">
          <template #default="scope">
            {{ scope.row.trueLabel === 1 ? '阳性（恶性）' : '阴性（良性）' }}
          </template>
        </el-table-column>
        <el-table-column prop="model1Score" label="模型1评分" width="120" />
        <el-table-column prop="model2Score" label="模型2评分" width="120" />
        <el-table-column prop="createTime" label="创建时间" width="200" />
      </el-table>
      <el-pagination
          @size-change="handleDataSizeChange"
          @current-change="handleDataCurrentChange"
          :current-page="dataCurrentPage"
          :page-sizes="[10, 20, 50]"
          :page-size="dataPageSize"
          layout="total, sizes, prev, pager, next, jumper"
          :total="dataTotal"
          style="margin-top: 20px; text-align: right;"
      />
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dataDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmDataSelection">确认选择</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 分析结果展示 -->
    <el-card v-if="analysisResult" title="统计分析结果" style="margin-top: 20px;" :loading="resultLoading">
      <!-- ECharts ROC曲线 -->
      <div class="roc-echarts-container" style="width: 100%; height: 600px; margin-bottom: 30px;">
        <echarts ref="rocEchartsRef" :option="rocEchartsOption" style="width: 100%; height: 100%;" />
      </div>

      <!-- 统计结果表格 -->
      <el-table :data="statResultTable" border style="margin-bottom: 30px;">
        <el-table-column prop="serialNo" label="序号" width="80" align="center" />
        <el-table-column prop="indexName" label="统计指标" min-width="200" align="center" />
        <el-table-column prop="indexValue" label="结果" min-width="200" align="center" />
      </el-table>

      <!-- ROC图片预览 -->
      <div v-if="analysisResult.rocImagePath" style="text-align: center; margin-bottom: 30px;">
        <h3 style="margin-bottom: 15px;">ROC曲线图片预览</h3>
        <img :src="'http://localhost:8080' + analysisResult.rocImagePath" style="max-width: 80%; height: auto; border: 1px solid #e6e6e6;" />
      </div>

      <!-- 操作按钮 -->
      <div style="text-align: center; margin-bottom: 10px;">
        <el-button type="primary" @click="previewPdfReport">预览PDF报告</el-button>
        <el-button type="success" @click="downloadPdfReport" style="margin-left: 20px;">下载PDF报告</el-button>
        <el-button type="info" @click="viewRocDetail" style="margin-left: 20px;" :disabled="!analysisResult.rocImagePath">查看ROC原图</el-button>
      </div>
    </el-card>

    <!-- PDF预览弹窗 -->
    <el-dialog title="PDF分析报告预览" v-model="pdfPreviewVisible" width="1000px" height="85vh" append-to-body>
      <iframe :src="pdfPreviewUrl" style="width: 100%; height: 100%;" frameborder="0" />
    </el-dialog>

    <!-- ROC图片预览弹窗 -->
    <el-dialog title="ROC曲线高清图" v-model="rocImagePreviewVisible" width="800px" append-to-body>
      <img :src="'http://localhost:8080' + analysisResult.rocImagePath" style="width: 100%; height: auto;" />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {

} from '@/api/analysisReport'

// 修改后的正确代码：
import { defineComponent } from 'vue'
import ECharts from 'vue-echarts'
import * as echarts from 'echarts'
import request from "@/utils/request.js";

// 初始化ECharts
const rocEchartsRef = ref(null)
const rocEchartsOption = ref({})

// 表单数据
const analysisForm = reactive({
  experimentId: '',
  testMethod: '',
  reportName: '',
  dataIds: ''
})
const analysisFormRef = ref(null)
const experimentList = ref([])
const dataSelected = ref(false)

// 数据选择弹窗
const dataDialogVisible = ref(false)
const dataList = ref([])
const dataLoading = ref(false)
const dataCurrentPage = ref(1)
const dataPageSize = ref(10)
const dataTotal = ref(0)
const selectedDataList = ref([])

// 分析结果
const analysisResult = ref(null)
const resultLoading = ref(false)
const statResultTable = ref([])

// 预览弹窗
const pdfPreviewVisible = ref(false)
const pdfPreviewUrl = ref('')
const rocImagePreviewVisible = ref(false)

// 获取实验列表
const getExperimentList = async () => {
  try {
    const res = await request.get('/experiment/list',{
      params: {
        pageNum: 1,
        pageSize: 10000
      }
    })
    experimentList.value = res.data.records
  } catch (e) {
    ElMessage.error('获取实验列表失败：' + e.msg)
  }
}

// 打开数据选择弹窗
const openDataDialog = () => {
  if (!analysisForm.experimentId) {
    ElMessage.warning('请先选择关联实验')
    return
  }
  dataDialogVisible.value = true
  getResearchDataList()
}

// 获取科研数据列表（弹窗内）
const getResearchDataList = async () => {
  dataLoading.value = true
  try {
    const res = await request.get('/data/list', {
      params: {
        experimentId: analysisForm.experimentId,
        pageNum: dataCurrentPage.value,
        pageSize: dataPageSize.value
      }
    })
    dataList.value = res.data.records
    dataTotal.value = res.data.total
  } catch (e) {
    ElMessage.error('获取数据列表失败：' + e.msg)
  } finally {
    dataLoading.value = false
  }
}

// 数据选择变化
const handleDataSelection = (val) => {
  selectedDataList.value = val
}

// 数据分页变化
const handleDataSizeChange = (val) => {
  dataPageSize.value = val
  getResearchDataList()
}
const handleDataCurrentChange = (val) => {
  dataCurrentPage.value = val
  getResearchDataList()
}

// 确认数据选择
const confirmDataSelection = () => {
  if (selectedDataList.value.length === 0) {
    ElMessage.warning('请至少选择一条科研数据')
    return
  }
  const dataIds = selectedDataList.value.map(item => item.id).join(',')
  analysisForm.dataIds = dataIds
  dataSelected.value = true
  dataDialogVisible.value = false
  ElMessage.success(`已选择 ${selectedDataList.value.length} 条数据`)
}

// 执行统计分析
const executeAnalysis = async () => {
  if (!analysisForm.testMethod || !analysisForm.reportName) {
    ElMessage.warning('请完善表单必填项')
    return
  }
  resultLoading.value = true
  try {
    const res = await request.post('/analysis/generate', analysisForm)
    analysisResult.value = res.data
    // 构建统计结果表格
    buildStatResultTable()
    // 构建ECharts ROC图
    buildRocEcharts()
    ElMessage.success('统计分析完成，报告生成成功')
  } catch (e) {
    ElMessage.error('分析失败：' + e.msg)
  } finally {
    resultLoading.value = false
  }
}

// 构建统计结果表格
const buildStatResultTable = () => {
  const result = analysisResult.value
  statResultTable.value = [
    { serialNo: 1, indexName: '模型1 AUC值', indexValue: result.auc1.toFixed(4) },
    { serialNo: 2, indexName: '模型2 AUC值', indexValue: result.auc2.toFixed(4) },
    { serialNo: 3, indexName: 'AUC差异（模型1 - 模型2）', indexValue: result.aucDiff.toFixed(4) },
    { serialNo: 4, indexName: '标准误（Std Error）', indexValue: result.stdErr.toFixed(4) },
    { serialNo: 5, indexName: 'Z统计量', indexValue: result.zValue.toFixed(4) },
    { serialNo: 6, indexName: '双侧P值', indexValue: result.pValue.toFixed(4) },
    { serialNo: 7, indexName: '统计学差异判断', indexValue: result.pValue < 0.05 ? '存在显著统计学差异' : '无显著统计学差异' },
    { serialNo: 8, indexName: '报告ID', indexValue: result.reportId },
    { serialNo: 9, indexName: '报告生成时间', indexValue: new Date().toLocaleString() }
  ]
}

// 构建ROC ECharts图表
const buildRocEcharts = () => {
  const result = analysisResult.value
  rocEchartsOption.value = {
    title: {
      text: 'ROC曲线（受试者工作特征曲线）',
      subtext: '基于选中科研数据计算',
      left: 'center',
      textStyle: {
        fontSize: 18,
        fontWeight: 'bold'
      }
    },
    tooltip: {
      trigger: 'item',
      formatter: '{b}<br/>{c0} (FPR) : {c1} (TPR)'
    },
    legend: {
      data: [
        `模型1 (AUC=${result.auc1.toFixed(4)})`,
        `模型2 (AUC=${result.auc2.toFixed(4)})`,
        '随机猜测（基线）'
      ],
      left: 'left',
      top: 30
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      name: '假阳性率（FPR）',
      nameLocation: 'middle',
      nameGap: 30,
      type: 'value',
      min: 0,
      max: 1,
      axisLabel: {
        formatter: '{value}'
      }
    },
    yAxis: {
      name: '真阳性率（TPR）',
      nameLocation: 'middle',
      nameGap: 40,
      type: 'value',
      min: 0,
      max: 1,
      axisLabel: {
        formatter: '{value}'
      }
    },
    series: [
      {
        name: `模型1 (AUC=${result.auc1.toFixed(4)})`,
        type: 'line',
        data: result.fpr1.map((fpr, index) => [fpr, result.tpr1[index]]),
        smooth: false,
        lineStyle: {
          color: '#1989fa',
          width: 2
        },
        symbol: 'none'
      },
      {
        name: `模型2 (AUC=${result.auc2.toFixed(4)})`,
        type: 'line',
        data: result.fpr2.map((fpr, index) => [fpr, result.tpr2[index]]),
        smooth: false,
        lineStyle: {
          color: '#f56c6c',
          width: 2
        },
        symbol: 'none'
      },
      {
        name: '随机猜测（基线）',
        type: 'line',
        data: [[0, 0], [1, 1]],
        smooth: false,
        lineStyle: {
          color: '#909399',
          width: 1,
          type: 'dashed'
        },
        symbol: 'none'
      }
    ]
  }
  // 渲染图表
  rocEchartsRef.value.setOption(rocEchartsOption.value)
}

// 预览PDF报告
const previewPdfReport = () => {
  if (!analysisResult.value || !analysisResult.value.pdfPath) {
    ElMessage.warning('暂无PDF报告可预览')
    return
  }
  pdfPreviewUrl.value = 'http://localhost:8080' + analysisResult.value.pdfPath
  pdfPreviewVisible.value = true
}

// 下载PDF报告
const downloadPdfReport = () => {
  if (!analysisResult.value || !analysisResult.value.pdfPath) {
    ElMessage.warning('暂无PDF报告可下载')
    return
  }
  window.open('http://localhost:8080' + analysisResult.value.pdfPath)
}

// 查看ROC原图
const viewRocDetail = () => {
  rocImagePreviewVisible.value = true
}

// 重置表单
const resetForm = () => {
  analysisForm.experimentId = ''
  analysisForm.testMethod = ''
  analysisForm.reportName = ''
  analysisForm.dataIds = ''
  dataSelected.value = false
  analysisResult.value = null
  statResultTable.value = []
  rocEchartsOption.value = {}
}

// 监听实验ID变化，重置数据选择
watch(() => analysisForm.experimentId, () => {
  dataSelected.value = false
  analysisForm.dataIds = ''
})

// 初始化
onMounted(() => {
  getExperimentList()
})
</script>

<style scoped>
.analysis-container {
  padding: 20px;
}
.dialog-footer {
  text-align: right;
}
.roc-echarts-container {
  border: 1px solid #f0f0f0;
  padding: 10px;
  border-radius: 4px;
}
</style>