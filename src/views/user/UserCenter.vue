<template>
  <div class="user-center-container">
    <el-card>
      <!-- 个人中心标签页 -->
      <el-tabs v-model="activeTab" type="card" style="margin-bottom: 20px;">
        <el-tab-pane label="个人信息" name="info">
          <el-form
              :model="userForm"
              :rules="userRules"
              ref="userFormRef"
              label-width="100px"
              style="max-width: 600px;"
          >
            <el-form-item label="用户名" prop="username">
              <el-input v-model="userForm.username" disabled placeholder="用户名不可修改"></el-input>
            </el-form-item>
            <el-form-item label="真实姓名" prop="realName">
              <el-input v-model="userForm.realName" placeholder="请输入真实姓名"></el-input>
            </el-form-item>
            <el-form-item label="手机号" prop="phone">
              <el-input v-model="userForm.phone" placeholder="请输入手机号"></el-input>
            </el-form-item>
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="userForm.email" placeholder="请输入邮箱"></el-input>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="submitUserInfo()">保存修改</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="修改密码" name="password">
          <el-form
              :model="pwdForm"
              :rules="pwdRules"
              ref="pwdFormRef"
              label-width="100px"
              style="max-width: 600px;"
          >
            <el-form-item label="原密码" prop="oldPassword">
              <el-input
                  v-model="pwdForm.oldPassword"
                  type="password"
                  placeholder="请输入原密码"
                  show-password
              ></el-input>
            </el-form-item>
            <el-form-item label="新密码" prop="newPassword">
              <el-input
                  v-model="pwdForm.newPassword"
                  type="password"
                  placeholder="请输入新密码（6-20位）"
                  show-password
              ></el-input>
            </el-form-item>
            <el-form-item label="确认新密码" prop="confirmPassword">
              <el-input
                  v-model="pwdForm.confirmPassword"
                  type="password"
                  placeholder="请再次输入新密码"
                  show-password
              ></el-input>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="submitChangePwd()">修改密码</el-button>
              <el-button @click="resetPwdForm()">重置</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
// 导入对应的API（请根据你的实际接口路径调整）
import {
  getUserInfo, // 获取当前登录用户信息
  updateUserInfo, // 更新个人信息
  changePassword // 修改密码
} from '@/api/sysUser'

import { aesEncrypt, aesDecrypt } from '@/utils/aes'

// 激活的标签页
const activeTab = ref('info')

// 表单Ref
const userFormRef = ref(null)
const pwdFormRef = ref(null)

// 个人信息表单数据
const userForm = reactive({
  id: '', // 用户ID
  username: '', // 用户名（不可修改）
  realName: '', // 真实姓名
  phone: '', // 手机号
  email: '' // 邮箱
})

// 密码修改表单数据
const pwdForm = reactive({
  oldPassword: '', // 原密码
  newPassword: '', // 新密码
  confirmPassword: '' // 确认新密码
})

// 个人信息校验规则（复用并优化原有规则）
const userRules = ref({
  realName: [
    { required: true, message: '请输入真实姓名', trigger: 'blur' },
    { min: 2, max: 10, message: '真实姓名长度应在2-20个字符之间', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号格式', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' },
    { max: 50, message: '邮箱长度不能超过50个字符', trigger: 'blur' }
  ]
})

// 密码修改校验规则
const pwdRules = ref({
  oldPassword: [
    { required: true, message: '请输入原密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度应在6-20个字符之间', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度应在6-20个字符之间', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value === pwdForm.oldPassword) {
          callback(new Error('新密码不能与原密码相同'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== pwdForm.newPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
})

// 页面加载时获取当前用户信息
onMounted(() => {
  getCurrentUserInfo()
})

// 获取当前用户信息
const getCurrentUserInfo = async () => {
  try {
    const res = await getUserInfo() // 接口无需传参，后端通过token获取当前用户
    Object.assign(userForm, res.data)
  } catch (error) {
    console.error('获取个人信息失败:', error)
    ElMessage.error('获取个人信息失败，请刷新重试')
  }
}

// 提交个人信息修改
const submitUserInfo = async () => {
  try {
    await userFormRef.value.validate()
    const res = await updateUserInfo({
      realName: userForm.realName,
      phone: userForm.phone,
      email: userForm.email
    })
    ElMessage.success(res.msg || '个人信息修改成功')
    // 重新获取最新信息
    getCurrentUserInfo()
  } catch (error) {
    console.error('修改个人信息失败:', error)
    ElMessage.error('修改个人信息失败，请重试')
  }
}

// 提交密码修改
const submitChangePwd = async () => {
  try {
    await pwdFormRef.value.validate()
    // 二次确认
    await ElMessageBox.confirm(
        '确定要修改密码吗？修改后请重新登录',
        '提示',
        { type: 'warning' }
    )
    const res = await changePassword({
      oldPassword: aesEncrypt(pwdForm.oldPassword),
      newPassword: aesEncrypt(pwdForm.newPassword)
    })
    ElMessage.success(res.msg || '密码修改成功，请重新登录')
    // 重置密码表单
    resetPwdForm()
    // 这里可根据实际需求，跳转到登录页或退出登录
    // logout()
  } catch (error) {
    if (error !== 'cancel') { // 排除用户取消确认的情况
      console.error('修改密码失败:', error)
      ElMessage.error(error.msg || '修改密码失败，原密码错误或系统异常')
    }
  }
}

// 重置密码表单
const resetPwdForm = () => {
  if (pwdFormRef.value) {
    pwdFormRef.value.resetFields()
  }
  Object.assign(pwdForm, {
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
}
</script>

<style scoped>
.user-center-container {
  padding: 10px;
}

.el-form {
  margin-top: 20px;
}

.el-form-item {
  margin-bottom: 20px;
}
</style>