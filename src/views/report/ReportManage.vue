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
        <el-table-column prop="planName" label="实验名称" width="100" align="center" />
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

    <!-- ROC图片预览弹窗 -->
    <el-dialog title="ROC曲线高清图" v-model="rocImagePreviewVisible" width="800px" append-to-body>
      <img :src="rocImagePreviewUrl" style="width: 100%; height: auto;" />
    </el-dialog>

    <!-- PDF预览弹窗 -->
    <el-dialog
        v-model="pdfPreviewVisible"
        :title="pdfPreviewTitle"
        width="90%"
        append-to-body
        :close-on-click-modal="false"
        destroy-on-close
        @close="handlePdfDialogClose"
    >
      <div class="pdf-preview-container">
        <!-- 加载状态 -->
        <div v-if="pdfLoading" class="pdf-loading">
          <el-icon class="loading-icon"><Loading /></el-icon>
          <span>正在加载PDF，请稍候...</span>
        </div>

        <!-- 错误提示 -->
        <div v-if="pdfError" class="pdf-error">
          <el-icon class="error-icon"><CircleClose /></el-icon>
          <span>{{ pdfError }}</span>
        </div>

        <!-- PDF预览内容 -->
        <div v-if="!pdfLoading && !pdfError" class="pdf-content">
          <!-- PDF控制栏 -->
          <div class="pdf-controls">
            <el-button
                type="primary"
                size="small"
                @click="prevPdfPage"
                :disabled="pdfCurrentPage <= 1"
                icon="ArrowLeft"
            >
              上一页
            </el-button>
            <span class="page-info">
              {{ pdfCurrentPage }} / {{ pdfTotalPages }}
            </span>
            <el-button
                type="primary"
                size="small"
                @click="nextPdfPage"
                :disabled="pdfCurrentPage >= pdfTotalPages"
                icon="ArrowRight"
            >
              下一页
            </el-button>

            <!-- 新增：缩放选择器（原有） -->
            <el-select
                v-model="pdfScale"
                size="small"
                style="width: 100px; margin-left: 10px;"
                @change="handlePdfScaleChange"
            >
              <el-option label="50%" value="0.5" />
              <el-option label="100%" value="1" />
              <el-option label="150%" value="1.5" />
              <el-option label="200%" value="2" />
            </el-select>

            <!-- 新增：手动修正按钮 -->
            <el-button
                type="warning"
                size="small"
                style="margin-left: 10px;"
                @click="rotate90"
                icon="Refresh"
            >
              旋转90°
            </el-button>
            <el-button
                type="warning"
                size="small"
                style="margin-left: 5px;"
                @click="toggleFlipX"
                :icon="manualFlipX ? 'Switch' : 'RefreshRight'"
            >
              左右翻转
            </el-button>
            <el-button
                type="warning"
                size="small"
                style="margin-left: 5px;"
                @click="toggleFlipY"
                :icon="manualFlipY ? 'Switch' : 'RefreshLeft'"
            >
              上下翻转
            </el-button>
            <el-button
                type="info"
                size="small"
                style="margin-left: 5px;"
                @click="resetTransform"
                icon="RefreshLeft"
            >
              重置修正
            </el-button>
            <el-select
                v-model="pdfScale"
                size="small"
                style="width: 100px; margin-left: 10px;"
                @change="handlePdfScaleChange"
            >
              <el-option label="50%" value="0.5" />
              <el-option label="100%" value="1" />
              <el-option label="150%" value="1.5" />
              <el-option label="200%" value="2" />
            </el-select>
            <el-button
                type="success"
                size="small"
                style="margin-left: 10px;"
                @click="downloadReport(currentPdfRow)"
                icon="Download"
            >
              下载PDF
            </el-button>
          </div>

          <!-- PDF渲染画布 -->
          <div class="pdf-canvas-wrapper">
            <canvas ref="pdfCanvas" class="pdf-canvas" />
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox, ElIcon} from 'element-plus'
import {
  Loading,
  ArrowLeft,
  ArrowRight,
  Download,
  CircleClose,
  Loading as LoadingIcon
} from '@element-plus/icons-vue'
import request from '@/utils/request'
import * as pdfjsLib from 'pdfjs-dist'

// ===================== 核心适配：v5.4.530 Worker配置 =====================
// v5.x 推荐的Worker配置方式（适配ES Module）
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.mjs',
    import.meta.url
).toString()

// v5.x 中文支持配置（版本对齐）
const PDFJS_VERSION = '5.4.530'
const cMapUrl = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/cmaps/`

// ===================== 响应式数据（v5.x 关键：pdfDoc必须是普通变量） =====================
const searchForm = reactive({
  reportName: ''
})
const reportList = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const selectedIds = ref([])

const rocImagePreviewVisible = ref(false)
const rocImagePreviewUrl = ref('')

// PDF预览相关（v5.x 核心：所有pdfjs实例都不用ref/reactive）
const pdfPreviewVisible = ref(false)
const pdfPreviewTitle = ref('')
const pdfLoading = ref(false)
const pdfError = ref('')
const pdfCurrentPage = ref(1)
const pdfTotalPages = ref(0)
const pdfScale = ref('1')
const pdfCanvas = ref(null)
let pdfDoc = null // 普通变量：v5.x 绝对不能用ref
let currentRenderTask = null // 新增：追踪当前渲染任务，防止冲突
const currentPdfRow = ref(null)
const pdfLoadTimeout = ref(null)
const isRendering = ref(false)

const manualRotate = ref(0) // 手动旋转角度：0/90/180/270
const manualFlipX = ref(false) // 手动水平翻转（左右反）
const manualFlipY = ref(false) // 手动垂直翻转（上下反）

// ===================== 工具函数（v5.x 适配：彻底移除destroy()） =====================
const buildFileUrl = (path, isDownload = false) => {
  if (!path) return ''
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }
  const params = new URLSearchParams({
    path: path,
    download: isDownload ? 'true' : 'false'
  })
  return `/api/download?${params.toString()}`
}

/**
 * v5.x 专属：安全清理PDF资源（彻底不用destroy()）
 */
const clearPdfResources = () => {
  // 1. 取消当前渲染任务（v5.x 新增：防止渲染中清理导致私有字段错误）
  if (currentRenderTask) {
    try {
      currentRenderTask.cancel()
    } catch (e) {
      console.warn('取消渲染任务警告：', e.message)
    }
    currentRenderTask = null
  }

  // 2. 清除超时定时器
  if (pdfLoadTimeout.value) {
    clearTimeout(pdfLoadTimeout.value)
    pdfLoadTimeout.value = null
  }

  // 3. v5.x 核心：只用cleanup()，绝对不调用destroy()
  if (pdfDoc) {
    try {
      // v5.x cleanup()是唯一安全的清理方法
      if (typeof pdfDoc.cleanup === 'function') {
        pdfDoc.cleanup()
      }
    } catch (e) {
      // v5.x 私有字段访问错误直接忽略（不影响功能）
      console.warn('PDF实例清理警告（v5.x 正常现象）：', e.message)
    }
    pdfDoc = null // 必须清空引用
  }

  // 4. 重置状态
  pdfCurrentPage.value = 1
  pdfScale.value = '1'
  pdfError.value = ''
  currentPdfRow.value = null
  isRendering.value = false
}

// ===================== 业务逻辑（v5.x 适配） =====================
const getReportList = async () => {
  try {
    const res = await request.get('/report/list', {
      params: {
        reportName: searchForm.reportName,
        pageNum: currentPage.value,
        pageSize: pageSize.value
      }
    })
    reportList.value = res.data?.records || []
    total.value = res.data?.total || 0
  } catch (e) {
    const errMsg = e.msg || e.message || '未知错误'
    ElMessage.error(`获取报告列表失败：${errMsg}`)
    console.error('获取报告列表异常：', e)
  }
}

const handleSelectionChange = (val) => {
  selectedIds.value = val.map(item => item.id)
}

const handleSizeChange = (val) => {
  pageSize.value = val
  getReportList()
}
const handleCurrentChange = (val) => {
  currentPage.value = val
  getReportList()
}

const resetSearch = () => {
  searchForm.reportName = ''
  getReportList()
}

// v5.x 加载PDF：适配新的getDocument参数
const loadAndRenderPdf = async (pdfUrl) => {
  if (!pdfUrl) {
    pdfError.value = 'PDF地址为空'
    pdfLoading.value = false
    return
  }

  try {
    pdfLoading.value = true
    pdfError.value = ''

    // v5.x 超时时间延长到20秒（大文件适配）
    pdfLoadTimeout.value = setTimeout(() => {
      pdfError.value = 'PDF加载超时，请检查网络或文件是否存在'
      pdfLoading.value = false
    }, 20000)

    // 先清理旧实例（v5.x 必须）
    if (pdfDoc) {
      clearPdfResources()
    }

    const response = await fetch(pdfUrl)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('application/pdf')) {
      throw new Error(`无效的文件类型：${contentType || '未知'}`)
    }

    const pdfData = await response.arrayBuffer()

    // v5.x getDocument 配置（新增兼容项）
    const pdfInstance = await pdfjsLib.getDocument({
      data: pdfData,
      cMapUrl,
      cMapPacked: true,
      disableWorker: false,
      maxImageSize: Infinity,
      verbosity: pdfjsLib.VerbosityLevel.ERROR,
      enableXfa: false,
      disableRange: true,
      // v5.x 新增：关闭流式渲染，避免私有字段冲突
      useSystemFonts: true,
      disableFontFace: true
    }).promise

    clearTimeout(pdfLoadTimeout.value)
    pdfLoadTimeout.value = null

    pdfDoc = pdfInstance
    pdfTotalPages.value = pdfDoc.numPages || 0

    console.log('PDF加载成功：', pdfTotalPages.value)

    if (pdfTotalPages.value === 0) {
      pdfError.value = 'PDF文件无内容'
      return
    }
    pdfCurrentPage.value = Math.min(pdfCurrentPage.value, pdfTotalPages.value)
    await renderPdfPage(pdfCurrentPage.value)
  } catch (err) {
    let errMsg = err.message || '加载失败'
    // v5.x 私有字段错误特殊处理
    if (err.message && err.message.includes('private field')) {
      errMsg = 'PDF加载失败（v5.x 兼容问题），请刷新页面重试'
    }
    pdfError.value = `PDF加载失败：${errMsg}`
    console.error('PDF加载异常（v5.x）：', err)
    ElMessage.error(`PDF预览失败：${errMsg}`)
  } finally {
    pdfLoading.value = false
  }
}

// v5.x 渲染PDF：适配Page实例的私有字段限制
const renderPdfPage = async (pageNum) => {
  if (isRendering.value || !pdfDoc || !pdfCanvas.value || pageNum < 1 || pageNum > pdfTotalPages.value) {
    return;
  }

  let page = null;
  try {
    isRendering.value = true;
    pdfError.value = '';

    // 1. 获取Page实例
    page = await pdfDoc.getPage(pageNum);

    // 2. 重置Canvas和上下文
    const canvas = pdfCanvas.value;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) {
      throw new Error('无法获取Canvas绘图上下文');
    }
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.setTransform(1, 0, 0, 1, 0, 0); // 重置变换矩阵

    // 3. 获取基础视口（不做任何自动修正）
    const scale = Number(pdfScale.value) || 1;
    const viewport = page.getViewport({ scale });
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    // 4. 核心：组合变换（自动+手动）
    context.save();
    // 步骤1：平移到画布中心（所有变换的基准点）
    context.translate(canvas.width / 2, canvas.height / 2);

    // 步骤2：应用手动旋转（优先级最高）
    const rotateRadian = (manualRotate.value * Math.PI) / 180; // 角度转弧度
    context.rotate(rotateRadian);

    // 步骤3：应用手动翻转
    const flipX = manualFlipX.value ? -1 : 1;
    const flipY = manualFlipY.value ? -1 : 1;
    context.scale(flipX, flipY);

    // 步骤4：平移回画布原点
    context.translate(-canvas.width / 2, -canvas.height / 2);

    // 5. 渲染PDF
    currentRenderTask = page.render({
      canvasContext: context,
      viewport: viewport
    });
    await currentRenderTask.promise;

    context.restore(); // 恢复上下文状态

  } catch (err) {
    let errMsg = err.message || '渲染失败';
    if (err.message && err.message.includes('private field')) {
      errMsg = 'PDF渲染失败，请重试';
    }
    pdfError.value = `PDF渲染失败：${errMsg}`;
    console.error('PDF渲染异常：', err);
    ElMessage.warning(`PDF渲染失败：${errMsg}`);
  } finally {
    if (page && typeof page.cleanup === 'function') {
      try {
        await page.cleanup();
      } catch (e) {
        console.warn('Page实例清理警告：', e.message);
      }
    }
    currentRenderTask = null;
    isRendering.value = false;
  }
};

// 手动旋转90°
const rotate90 = () => {
  manualRotate.value = (manualRotate.value + 90) % 360;
  renderPdfPage(pdfCurrentPage.value);
};

// 切换水平翻转（左右反）
const toggleFlipX = () => {
  manualFlipX.value = !manualFlipX.value;
  renderPdfPage(pdfCurrentPage.value);
};

// 切换垂直翻转（上下反）
const toggleFlipY = () => {
  manualFlipY.value = !manualFlipY.value;
  renderPdfPage(pdfCurrentPage.value);
};

// 重置所有手动修正
const resetTransform = () => {
  manualRotate.value = 0;
  manualFlipX.value = false;
  manualFlipY.value = false;
  renderPdfPage(pdfCurrentPage.value);
};

// 分页方法（v5.x 无变化，保持异步+锁）
const prevPdfPage = async () => {
  if (pdfCurrentPage.value <= 1 || isRendering.value) return

  pdfCurrentPage.value--
  await renderPdfPage(pdfCurrentPage.value)
}

const nextPdfPage = async () => {
  if (pdfCurrentPage.value >= pdfTotalPages.value || isRendering.value) return

  pdfCurrentPage.value++
  await renderPdfPage(pdfCurrentPage.value)
}

// 缩放控制（v5.x 防抖+锁）
const handlePdfScaleChange = () => {
  if (isRendering.value) return

  clearTimeout(window.pdfScaleTimer)
  window.pdfScaleTimer = setTimeout(async () => {
    await renderPdfPage(pdfCurrentPage.value)
  }, 300)
}

// 预览PDF（v5.x 无变化）
const previewReport = async (row) => {
  if (!row || !row.pdfPath) {
    ElMessage.warning('该报告暂无PDF文件可预览')
    return
  }

  clearPdfResources()
  currentPdfRow.value = row
  pdfPreviewTitle.value = `PDF预览 - ${row.reportName}`
  pdfPreviewVisible.value = true

  const pdfUrl = buildFileUrl(row.pdfPath)
  await loadAndRenderPdf(pdfUrl)
  pdfCurrentPage.value = Math.min(pdfCurrentPage.value, pdfTotalPages.value)
  await renderPdfPage(pdfCurrentPage.value)
}

// 下载PDF（v5.x 无变化）
const downloadReport = (row) => {
  if (!row?.pdfPath) {
    ElMessage.warning('该报告暂无PDF文件可下载')
    return
  }
  try {
    const downloadUrl = buildFileUrl(row.pdfPath, true)
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = `${row.reportName || '报告'}.pdf`
    link.rel = 'noopener noreferrer'
    document.body.appendChild(link)
    const event = new MouseEvent('click')
    link.dispatchEvent(event)
    document.body.removeChild(link)
  } catch (error) {
    const errMsg = error.message || '下载失败'
    ElMessage.error(`PDF下载失败：${errMsg}`)
    console.error('PDF下载异常：', error)
  }
}

// 预览ROC图片（v5.x 无变化）
const previewRocImage = (row) => {
  if (!row?.rocImagePath) {
    ElMessage.warning('该报告暂无ROC图片可预览')
    return
  }
  rocImagePreviewUrl.value = buildFileUrl(row.rocImagePath)
  rocImagePreviewVisible.value = true
}

// 删除报告（v5.x 无变化）
const deleteReport = async (id) => {
  if (!id) return
  try {
    await ElMessageBox.confirm(
        '确定要删除该报告吗？删除后将无法恢复（含PDF及ROC图片）',
        '警告',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
    )
    const res = await request.delete(`/report/${id}`)
    ElMessage.success(res.msg || '删除成功')
    getReportList()
  } catch (e) {
    if (e?.msg !== 'cancel' && e?.message !== 'cancel') {
      const errMsg = e.msg || e.message || '删除失败'
      ElMessage.error(`删除失败：${errMsg}`)
    }
  }
}

// 弹窗关闭（v5.x 必须清理）
const handlePdfDialogClose = () => {
  clearPdfResources()
}

// 组件卸载（v5.x 强制清理）
onUnmounted(() => {
  clearPdfResources()
  if (window.pdfScaleTimer) {
    clearTimeout(window.pdfScaleTimer)
  }
})

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

/* PDF预览样式（优化：加载状态、错误状态样式） */
.pdf-preview-container {
  width: 100%;
  height: 80vh;
  display: flex;
  flex-direction: column;
}
.pdf-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  font-size: 16px;
  color: #666;
  gap: 10px;
}
.loading-icon {
  font-size: 20px;
  animation: el-loading-rotate 2s linear infinite;
}
.pdf-error {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  font-size: 16px;
  color: #f56c6c;
  gap: 10px;
}
.error-icon {
  font-size: 20px;
}
.pdf-controls {
  display: flex;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #e6e6e6;
  margin-bottom: 10px;
}
.page-info {
  margin: 0 10px;
  font-size: 14px;
  color: #666;
}
.pdf-canvas-wrapper {
  flex: 1;
  overflow: auto;
  display: flex;
  justify-content: center;
  padding: 10px;
  background-color: #f9f9f9;
}
.pdf-canvas {
  box-shadow: 0 0 8px rgba(0,0,0,0.1);
  border-radius: 4px;
}

/* 加载动画（复用Element Plus风格） */
@keyframes el-loading-rotate {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
