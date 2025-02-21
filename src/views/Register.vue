<template>
  <div class="wrapper">
    <div class="div-content">
      <div style="margin: 20px 0; text-align: center; font-size: 24px"><b>注 册</b></div>

      <el-form :model="user" :rules="rules" ref="userForm">
        <el-form-item prop="username">
          <el-input placeholder="用户名" size="medium" style="margin: 5px 0" prefix-icon="el-icon-user"
                    v-model="user.username"></el-input>
        </el-form-item>

        <el-form-item prop="password">
          <el-input placeholder="密码" size="medium" style="margin: 5px 0" prefix-icon="el-icon-lock" show-password
                    v-model="user.password"></el-input>
        </el-form-item>

        <el-form-item prop="confirmPassword">
          <el-input placeholder="确认密码" size="medium" style="margin: 5px 0" prefix-icon="el-icon-lock" show-password
                    v-model="user.confirmPassword"></el-input>
        </el-form-item>

        <el-form-item prop="nickname">
          <el-input placeholder="昵称" size="medium" style="margin: 5px 0" prefix-icon="el-icon-data-line"
                    v-model="user.nickname"></el-input>
        </el-form-item>

        <el-form-item prop="email">
          <el-input placeholder="邮箱" size="medium" style="margin: 5px 0" prefix-icon="el-icon-message"
                    v-model="user.email"></el-input>
        </el-form-item>

        <el-form-item style="margin: 30px 0; text-align: center">
          <el-button type="primary" size="small" autocomplete="off" @click="register">确定</el-button>
          <el-button type="primary" size="small" autocomplete="off" @click="reset">重置</el-button>
          <el-button type="warning" size="small" autocomplete="off" @click="$router.push('/login')">返回登陆</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script>
export default {
  name: "Login",
  data() {
    return {
      user: {
        username: '',
        password: '',
        nickname: '',
        email: ''
      },
      rules: {
        username: [
          {required: true, message: '请输入用户名', trigger: 'blur'},
          {min: 4, max: 15, message: '长度应在 4到 15 个字符', trigger: 'blur'},
          {pattern: /^[a-zA-Z0-9_-]{4,15}$/, message: '用户名应由字母、数字、下划线或横线组成', trigger: 'blur'}
        ],
        password: [
          {required: true, message: '请输入密码', trigger: 'blur'},
          {min: 8, message: '密码至少应为8个字符', trigger: 'blur'},
          {pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/, message: '密码应包含数字和大小写字母', trigger: 'blur'}
        ],
        confirmPassword: [
          {required: true, message: '请确认密码', trigger: 'blur'},
          {
            validator: (rule, value, callback) => {
              if (value !== this.user.password) {
                callback(new Error('两次输入的密码不一致'));
              } else {
                callback();
              }
            }, trigger: 'blur'
          }
        ],
        nickname: [
          {required: true, message: '请确认昵称', trigger: 'blur'},
          {min: 2, max: 20, message: '长度应在 2 到 20 个字符', trigger: 'blur'},
          {pattern: /^[\u4e00-\u9fa5_a-zA-Z0-9]{2,20}$/, message: '昵称应由汉字、字母、数字或下划线组成', trigger: 'blur'}
        ],
        email: [
          {required: true, message: '请输入邮箱', trigger: 'blur'},
          {min: 2, max: 20, message: '长度应在 2 到 20 个字符', trigger: 'blur'},
          {pattern: /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/, message: '请输入有效的邮箱地址', trigger: 'blur'}
        ],
      }
    }
  },
  methods: {
    //注册
    register() {
      this.$refs['userForm'].validate((valid) => {
        if (valid) {  // 表单校验合法
          if (this.user.password !== this.user.confirmPassword) {
            this.$message.error("两次输入的密码不一致")
            return false
          }
          this.request.post("/user/register", this.user).then(res => {
            if (res.code === '200') {
              this.$message.success("注册成功")
            } else {
              this.$message.error(res.msg)
            }
          })
        }
      });
    },
    reset() {
      this.$refs['userForm'].resetFields();
    }
  }
}
</script>

<style>
.div-content {
  margin: 180px auto;
  width: 350px;
  height: 480px;
  padding: 20px;
  border-radius: 10px;
  background: rgba(15, 12, 41, 0.6);
  color: #75fee1; /* 文字颜色，确保在深色背景上可见 */
  border-image: linear-gradient(to right, #0abfbc, #10ac84); /* 设置边框渐变色 */
  border-image-slice: 1; /* 确保渐变覆盖整个边框 */
  box-shadow: 0 0 10px rgba(0, 123, 255, 0.5); /* 添加蓝色阴影增加层次感 */
}

.wrapper {
  height: 100vh;
  background-image: url("../../src/assets/image/Home/login.jpg");
  background-size: 100% 100%;
  background-repeat: no-repeat;
  overflow: hidden;
}
</style>