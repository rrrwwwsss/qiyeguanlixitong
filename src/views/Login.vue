<template>
  <div class="wrapper">
    <div class="loginTitle">
      <img src="@/assets/image/Home/login1.png" style="position: relative; width:700px; height: 75px; top: 67px;" alt="" />
      <h1 style="color: #75fee1;position: relative;text-align: center;top: -15px; letter-spacing: 18px;">
        企业管理平台</h1>

    </div>
    <div class="login-div">

      <div style="margin: 20px 0; text-align: center; font-size: 24px"><b>登 录</b></div>

      <el-form :model="user" :rules="rules" ref="userForm">
        <el-form-item prop="username">
          <el-input size="medium" style="margin: 10px 0" prefix-icon="el-icon-user" v-model="user.username"></el-input>
        </el-form-item>
        <el-form-item prop="password">
          <el-input size="medium" style="margin: 10px 0" prefix-icon="el-icon-lock" show-password v-model="user.password"></el-input>
        </el-form-item>
        <el-form-item style="margin: 10px 0; text-align: center">
          <el-button type="primary" size="small" autocomplete="off" @click="login">登录</el-button>
          <el-button type="warning" size="small" autocomplete="off" @click="$router.push('/register')">注册</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script>
import NavigationStore from '@/store/NavigationStore'
import navigationStore from '@/store/NavigationStore'

export default {
  name: 'Login',
  data () {
    return {
      user: {},
      rules: {
        username: [
          { required: true, message: '请输入用户名', trigger: 'blur' }
        ],
        password: [
          { required: true, message: '请输入密码', trigger: 'blur' }
        ]
      }
    }
  },

  beforeCreate () {
    if (localStorage.getItem('user')) {
      this.$router.push('/home')
    }
  },

  mounted () {
    // 登录绑定事件,使用enter登录
    window.addEventListener('keydown', this.keyDown)
  },
  methods: {
    login () {
      this.$refs['userForm'].validate((valid) => {
        if (valid) {
          this.request.post('/user/login', this.user).then(res => {
            if (res.code == 200) {
              localStorage.setItem('user', JSON.stringify(res.data))

              // 生成动态菜单
              NavigationStore.commit('generateMenus', res.data.menus)
              // 生成动态路由
              NavigationStore.commit('generateRoutes')

              this.$router.push('/home')
              this.$message.success('登录成功')
            } else {
              this.$message.error(res.msg)
            }
          })
        }
      })
    },
    keyDown (e) {
      //如果是回车则执行登录方法
      if (e.keyCode == 13) {
        this.login()
      }
    }
  }
}
</script>

<style>
.wrapper {
  height: 100vh;
  background-image: url('@/assets/image/Home/login.jpg');
  background-size: 100% 100%;
  background-repeat: no-repeat;
  overflow: hidden;
}

.login-div {
  margin: 200px auto;
  width: 400px;
  height: 320px;
  padding: 20px;
  border-radius: 10px;
  background-color: rgba(255, 255, 255, 0.2); /* 背景颜色为白色，透明度为50% */
  color: #75fee1; /* 文字颜色，确保在深色背景上可见 */
  border-image: linear-gradient(
    to right,
    #ffffff,
    #10ac84
  ); /* 设置边框渐变色 */
  border-image-slice: 1; /* 确保渐变覆盖整个边框 */
  box-shadow: 0 0 3px rgba(0, 123, 255, 0.5); /* 添加蓝色阴影增加层次感 */
}

.loginTitle {
  position: relative;
  top: 65px;
  text-align: center;
  height: 70px;
}
</style>