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

    <!-- 数据选择弹窗（优化：新增全选复选框，移除原有全选/清空按钮） -->
    <el-dialog title="选择科研数据" v-model="dataDialogVisible" width="800px">
      <!-- 全局全选复选框 -->
      <div style="margin-bottom: 15px; display: flex; align-items: center;">
        <el-checkbox
            v-model="allDataSelected"
            @change="handleAllDataChange"
            label="全选该实验所有数据"
        />
        <span style="margin-left: 10px; color: #666; font-size: 12px;">
          共 {{ allDataIds.length }} 条数据
        </span>
      </div>

      <el-table
          :data="dataList"
          border
          @selection-change="handleDataSelection"
          :loading="dataLoading"
          ref="dataTableRef"
          :reserve-selection="true"
      >
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
      <div class="roc-echarts-container" style="width: 100%; height: 600px; margin-bottom: 30px;">
        <ECharts
            ref="rocEchartsRef"
            :option="getOptions"
            style="width: 100%; height: 100%;"
        />
      </div>
    </el-card>

    <!-- PDF预览弹窗 -->
    <el-dialog title="PDF分析报告预览" v-model="pdfPreviewVisible" width="1000px" height="85vh" append-to-body>
      <iframe :src="pdfPreviewUrl" style="width: 100%; height: 100%;" frameborder="0" />
    </el-dialog>
  </div>
</template>

<script setup>
import {ref, onMounted, reactive, watch, computed,nextTick } from 'vue'
import {ElMessage, ElMessageBox} from 'element-plus'
import ECharts from 'vue-echarts'
import * as echarts from 'echarts'
import {use} from 'echarts/core'
import {LineChart} from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  GraphicComponent
} from 'echarts/components'
import {CanvasRenderer} from 'echarts/renderers'
import request from "@/utils/request.js";

// 注册ECharts模块
use([
  LineChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  GraphicComponent,
  CanvasRenderer
])

// 初始化ECharts实例引用
const rocEchartsRef = ref(null)

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

// 数据选择弹窗（优化：新增全局全选相关状态）
const dataDialogVisible = ref(false)
const dataList = ref([])
const dataLoading = ref(false)
const dataCurrentPage = ref(1)
const dataPageSize = ref(10)
const dataTotal = ref(0)
const dataTableRef = ref(null)
const allDataSelected = ref(false) // 全局全选复选框状态
const allDataIds = ref([]) // 该实验所有数据ID（非分页）
const selectedDataIds = ref(new Set()) // 全局选中的ID集合（去重）

// 分析结果
const analysisResult = ref(null)
const resultLoading = ref(false)

// 预览弹窗
const pdfPreviewVisible = ref(false)
const pdfPreviewUrl = ref('')

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
    ElMessage.error('获取实验列表失败：' + (e.msg || e.message))
  }
}

// 获取该实验所有数据ID（支撑全局全选，非分页）
const getAllDataIds = async (experimentId) => {
  try {
    const res = await request.get('/data/list', {
      params: {
        experimentId,
        pageNum: 1,
        pageSize: 99999 // 足够大的数值，获取全部数据
      }
    })
    const allData = res.data.records
    allDataIds.value = allData.map(item => item.id) // 存储所有数据ID
    return allDataIds.value
  } catch (e) {
    ElMessage.error('获取全部数据ID失败：' + (e.msg || e.message))
    return []
  }
}

// 打开数据选择弹窗（优化：初始化全选状态）
const openDataDialog = async () => {
  if (!analysisForm.experimentId) {
    ElMessage.warning('请先选择关联实验')
    return
  }
  // 重置弹窗状态
  allDataSelected.value = false
  selectedDataIds.value.clear()
  allDataIds.value = []
  dataCurrentPage.value = 1

  // 获取该实验所有数据ID
  await getAllDataIds(analysisForm.experimentId)

  // 打开弹窗并加载当前页数据
  dataDialogVisible.value = true
  getResearchDataList()
}

// 获取科研数据列表（弹窗内分页数据）
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

    // 回显已选中的行（分页切换后保留选中状态）
    nextTick(() => {
      if (dataTableRef.value && dataList.value.length > 0) {
        dataList.value.forEach(row => {
          if (selectedDataIds.value.has(row.id)) {
            dataTableRef.value.toggleRowSelection(row, true)
          }
        })
      }
    })
  } catch (e) {
    ElMessage.error('获取数据列表失败：' + (e.msg || e.message))
  } finally {
    dataLoading.value = false
  }
}

// 表格行选择变化（同步到全局选中ID集合）
const handleDataSelection = (val) => {
  const currentPageIds = val.map(item => item.id)

  // 新增当前页选中的ID
  currentPageIds.forEach(id => {
    selectedDataIds.value.add(id)
  })

  // 移除当前页取消选中的ID
  dataList.value.forEach(row => {
    if (!currentPageIds.includes(row.id) && selectedDataIds.value.has(row.id)) {
      selectedDataIds.value.delete(row.id)
    }
  })

  // 更新全选复选框状态：选中ID数量等于总数据数量则勾选
  allDataSelected.value = selectedDataIds.value.size === allDataIds.value.length
}

// 全局全选复选框变化（控制所有数据选中/取消）
const handleAllDataChange = (checked) => {
  if (checked) {
    // 全选：添加所有数据ID到选中集合
    allDataIds.value.forEach(id => {
      selectedDataIds.value.add(id)
    })
    // 勾选当前页所有行
    nextTick(() => {
      if (dataTableRef.value && dataList.value.length > 0) {
        dataList.value.forEach(row => {
          dataTableRef.value.toggleRowSelection(row, true)
        })
      }
    })
    ElMessage.success(`已选中该实验全部 ${allDataIds.value.length} 条数据`)
  } else {
    // 取消全选：清空选中集合
    selectedDataIds.value.clear()
    // 取消当前页所有行选中
    nextTick(() => {
      if (dataTableRef.value) {
        dataTableRef.value.clearSelection()
      }
    })
    ElMessage.info('已取消所有数据选中状态')
  }
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

// 确认数据选择（优化：使用全局选中ID集合）
const confirmDataSelection = () => {
  const selectedIdArr = Array.from(selectedDataIds.value)
  if (selectedIdArr.length === 0) {
    ElMessage.warning('请至少选择一条科研数据')
    return
  }
  // 拼接ID字符串
  analysisForm.dataIds = selectedIdArr.join(',')
  dataSelected.value = true
  dataDialogVisible.value = false
  ElMessage.success(`已选择 ${selectedIdArr.length} 条数据`)
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
    console.log('分析结果数据：', analysisResult.value)
    ElMessage.success('统计分析完成，报告生成成功')
  } catch (e) {
    ElMessage.error('分析失败：' + (e.msg || e.message))
  } finally {
    resultLoading.value = false
  }
}

// 计算属性：生成ECharts ROC曲线配置项
const getOptions = computed(() => {
  const result = analysisResult.value
  if (!result) {
    return {}
  }

  // 验证必要字段是否存在
  const requiredFields = ['auc1', 'auc2', 'fpr1', 'tpr1', 'fpr2', 'tpr2']
  const hasMissingField = requiredFields.some(field => !result[field])
  if (hasMissingField) {
    console.warn('分析结果缺少必要字段，无法渲染ROC曲线', requiredFields.filter(field => !result[field]))
    return {}
  }

  return {
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
      formatter: function (params) {
        if (params.seriesName === '随机猜测（基线）') {
          return params.seriesName;
        }
        return `${params.seriesName}<br/>FPR: ${params.value[0].toFixed(4)}<br/>TPR: ${params.value[1].toFixed(4)}`;
      }
    },
    legend: {
      data: [
        `模型1 (AUC=${result.auc1.toFixed(4)})`,
        `模型2 (AUC=${result.auc2.toFixed(4)})`,
        '随机猜测（基线）'
      ],
      left: 'left',
      top: 30,
      textStyle: {
        fontSize: 12
      }
    },
    grid: {
      left: '12%',
      right: '8%',
      bottom: '12%',
      top: '18%',
      containLabel: true
    },
    xAxis: {
      name: '假阳性率（FPR）',
      nameLocation: 'middle',
      nameGap: 30,
      nameTextStyle: {
        fontSize: 14,
        fontWeight: 'bold'
      },
      type: 'value',
      min: 0,
      max: 1,
      axisLabel: {
        formatter: '{value}',
        fontSize: 12
      },
      splitLine: {
        show: true,
        lineStyle: {
          color: '#f0f0f0',
          type: 'solid'
        }
      },
      axisLine: {
        show: true,
        lineStyle: {
          color: '#333'
        }
      }
    },
    yAxis: {
      name: '真阳性率（TPR）',
      nameLocation: 'middle',
      nameGap: 50,
      nameTextStyle: {
        fontSize: 14,
        fontWeight: 'bold'
      },
      type: 'value',
      min: 0,
      max: 1,
      axisLabel: {
        formatter: '{value}',
        fontSize: 12
      },
      splitLine: {
        show: true,
        lineStyle: {
          color: '#f0f0f0',
          type: 'solid'
        }
      },
      axisLine: {
        show: true,
        lineStyle: {
          color: '#333'
        }
      }
    },
    series: [
      {
        name: `模型1 (AUC=${result.auc1.toFixed(4)})`,
        type: 'line',
        data: result.fpr1.map((fpr, index) => [parseFloat(fpr), parseFloat(result.tpr1[index])]),
        smooth: false,
        lineStyle: {
          color: '#1989fa',
          width: 3
        },
        itemStyle: {
          color: '#1989fa'
        },
        symbol: 'circle',
        symbolSize: 6,
        showSymbol: false,
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [{
              offset: 0, color: 'rgba(25, 137, 250, 0.3)'
            }, {
              offset: 1, color: 'rgba(25, 137, 250, 0.1)'
            }]
          }
        },
        emphasis: {
          focus: 'series',
          lineStyle: {
            width: 4
          },
          itemStyle: {
            symbolSize: 8
          }
        }
      },
      {
        name: `模型2 (AUC=${result.auc2.toFixed(4)})`,
        type: 'line',
        data: result.fpr2.map((fpr, index) => [parseFloat(fpr), parseFloat(result.tpr2[index])]),
        smooth: false,
        lineStyle: {
          color: '#f56c6c',
          width: 3
        },
        itemStyle: {
          color: '#f56c6c'
        },
        symbol: 'circle',
        symbolSize: 6,
        showSymbol: false,
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [{
              offset: 0, color: 'rgba(245, 108, 108, 0.3)'
            }, {
              offset: 1, color: 'rgba(245, 108, 108, 0.1)'
            }]
          }
        },
        emphasis: {
          focus: 'series',
          lineStyle: {
            width: 4
          },
          itemStyle: {
            symbolSize: 8
          }
        }
      },
      {
        name: '随机猜测（基线）',
        type: 'line',
        data: [[0, 0], [1, 1]],
        smooth: false,
        lineStyle: {
          color: '#909399',
          width: 2,
          type: 'dashed'
        },
        symbol: 'none',
        showSymbol: false,
        emphasis: {
          disabled: true
        }
      }
    ],
    graphic: [
      {
        type: 'text',
        left: 'center',
        bottom: 5,
        style: {
          text: '曲线越靠近左上角表示模型性能越好',
          fill: '#666',
          fontSize: 12
        }
      }
    ]
  }
})

// 监听ECharts配置项变化，强制刷新图表
watch(getOptions, (newOption) => {
  if (rocEchartsRef.value && newOption && Object.keys(newOption).length > 0) {
    rocEchartsRef.value.setOption(newOption, true)
  }
}, {deep: true})

// 重置表单
const resetForm = () => {
  analysisForm.experimentId = ''
  analysisForm.testMethod = ''
  analysisForm.reportName = ''
  analysisForm.dataIds = ''
  dataSelected.value = false
  analysisResult.value = null
  // 重置全选相关状态
  allDataSelected.value = false
  selectedDataIds.value.clear()
  allDataIds.value = []
}

// 监听实验ID变化，重置数据选择
watch(() => analysisForm.experimentId, () => {
  dataSelected.value = false
  analysisForm.dataIds = ''
  allDataSelected.value = false
  selectedDataIds.value.clear()
  allDataIds.value = []
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