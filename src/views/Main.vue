<template>
  <el-container id="full">

    <el-aside width="auto">
      <Aside :isAsideCollapse="isAsideCollapse" />
    </el-aside>

    <el-container id="main">
      <el-header>
        <Header @changeAsideCollapse="changeAsideCollapse" :asideCollapseButtonIcon="asideCollapseButtonIcon" :user="user" />
      </el-header>
      <el-main>
        <router-view @refreshUser="getUser" />
      </el-main>
    </el-container>

  </el-container>
</template>

<script>
import Header from '@/components/Header'
import Aside from '@/components/Aside'

export default {
  name: 'Main',

  data () {
    return {
      asideCollapseButtonIcon: 'el-icon-s-fold',
      isAsideCollapse: false,
      user: {}
    }
  },
  components: {
    Header,
    Aside
  },

  methods: {

    changeAsideCollapse () {
      // TODO bug：aside收缩状态下，侧边栏子菜单展开时背景透明
      // this.isAsideCollapse = !this.isAsideCollapse
      // this.asideCollapseButtonIcon = this.isAsideCollapse ? 'el-icon-s-unfold' : 'el-icon-s-fold'
    },

    getUser () {
      const username = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).username : ''
      if (username) {
        this.request.get('/user/username/' + username).then(res => {
          this.user = res.data
        })
      }
    }

  }
}
</script>

<style lang="less" scoped>
#full {
  height: 100%;
  border: 1px solid #eee;

  #main {
    .el-header {
      background-color: rgb(52, 217, 162);
      // background-color: rgba(135, 227, 197, 0.322);
      font-size: 12px;
      // border-bottom: 1px solid #234043;
      line-height: 60px;
    }

    .el-main {
      padding: 0;
    }
  }
}
</style>
