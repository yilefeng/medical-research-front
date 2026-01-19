<template>
  <div class="sys-oper-log-container">
    <el-card>
      <!-- 查询表单 -->
      <div class="card-header">
        <el-input
            v-model="queryParams.username"
            placeholder="请输入操作用户名"
            style="width: 200px; margin-right: 10px;"
            clearable
        ></el-input>
        <el-input
            v-model="queryParams.operModule"
            placeholder="请输入操作模块"
            style="width: 200px; margin-right: 10px;"
            clearable
        ></el-input>
        <el-select
            v-model="queryParams.operType"
            placeholder="请选择操作类型"
            style="width: 150px; margin-right: 10px;"
            clearable
        >
          <el-option label="新增" value="新增"></el-option>
          <el-option label="修改" value="修改"></el-option>
          <el-option label="删除" value="删除"></el-option>
          <el-option label="查询" value="查询"></el-option>
          <el-option label="导入" value="导入"></el-option>
          <el-option label="导出" value="导出"></el-option>
        </el-select>
        <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 300px; margin-right: 10px;"
        ></el-date-picker>
        <el-button type="primary" @click="getOperLogList()">查询</el-button>
        <el-button @click="resetQuery()">重置</el-button>
      </div>

      <!-- 表格 -->
      <el-table :data="tableData" border stripe style="width: 100%" height="600">
        <el-table-column prop="id" label="ID" width="80"></el-table-column>
        <el-table-column prop="username" label="操作用户" width="120"></el-table-column>
        <el-table-column prop="operModule" label="操作模块" width="180"></el-table-column>
        <el-table-column prop="operType" label="操作类型" width="100">
          <template #default="scope">
            <el-tag :type="getOperTypeTagType(scope.row.operType)">
              {{ scope.row.operType }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="operContent" label="操作描述" min-width="200">
          <template #default="scope">
            <!-- 显示完整内容，点击可查看详细信息 -->
            <div class="oper-content-cell" @click="showOperContentDetail(scope.row)">
              {{ scope.row.operContent || '无' }}
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="operIp" label="操作IP" width="150"></el-table-column>
        <el-table-column label="操作时间" prop="operTime" width="200"></el-table-column>
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
  </div>

  <!-- 操作详情弹窗 -->
  <el-dialog
      v-model="contentDialogVisible"
      title="操作详情"
      width="600px"
      append-to-body
      :close-on-click-modal="false"
  >
    <div class="content-detail-container">
      <p><strong>操作内容：</strong>{{ currentContent }}</p>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getOperLogPage } from '@/api/sysOperLog'

// 查询参数
const queryParams = ref({
  username: '',
  operModule: '',
  operType: '',
  startTime: '',
  endTime: ''
})

// 日期范围
const dateRange = ref([])

// 表格数据
const tableData = ref([])
const pageNum = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 页面加载时获取列表
onMounted(() => {
  getOperLogList()
})

// 获取操作日志列表
const getOperLogList = async () => {
  // 处理日期范围
  if (dateRange.value && dateRange.value.length === 2) {
    queryParams.value.startTime = dateRange.value[0]
    queryParams.value.endTime = dateRange.value[1]
  } else {
    queryParams.value.startTime = ''
    queryParams.value.endTime = ''
  }

  try {
    const res = await getOperLogPage({
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      ...queryParams.value
    })
    tableData.value = res.data.records
    total.value = res.data.total
  } catch (error) {
    console.error('获取日志列表失败:', error)
  }
}

// 重置查询条件
const resetQuery = () => {
  queryParams.value = {
    username: '',
    operModule: '',
    operType: ''
  }
  dateRange.value = []
  getOperLogList()
}

// 分页大小改变
const handleSizeChange = (val) => {
  pageSize.value = val
  getOperLogList()
}

// 当前页改变
const handleCurrentChange = (val) => {
  pageNum.value = val
  getOperLogList()
}

// 获取操作类型标签样式
const getOperTypeTagType = (type) => {
  const typeMap = {
    '新增': 'success',
    '修改': 'primary',
    '删除': 'danger',
    '查询': 'info',
    '导入': 'warning',
    '导出': 'warning'
  }
  return typeMap[type] || 'default'
}

// 新增状态变量
const contentDialogVisible = ref(false)
const currentContent = ref('')

// 显示操作内容详情
const showOperContentDetail = (row) => {
  currentContent.value = row.operContent || '无'
  contentDialogVisible.value = true
}

// 弹窗关闭时清理
const handleContentDialogClose = () => {
  contentDialogVisible.value = false
}
</script>

<style scoped>
.sys-oper-log-container {
  padding: 10px;
}
/* 添加样式 */
.content-detail-container {
  padding: 20px;
  font-size: 14px;
  line-height: 1.6;
}

.oper-content-cell {
  cursor: pointer;
  color: #409eff;
  text-decoration: underline;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.oper-content-cell:hover {
  color: #66b1ff;
}
</style>