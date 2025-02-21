<template>
  <el-menu :default-active="currentPage.index" class="el-menu-vertical-demo" :collapse="isAsideCollapse" text-color="black" active-text-color="green"
    :unique-opened="true">

    <div id="title">
      <img src="@/assets/image/Home/logo.png">
      <b v-show="!isAsideCollapse">企业管理系统</b>
    </div>

    <!-- 动态渲染菜单列表 -->
    <template v-for="menu in menus">

      <!-- 不含子菜单 -->
      <el-menu-item v-if="!menu.children" :index="menu.name" @click="clickMenu(menu.name)">
        <i :class="menu.icon" />
        <span slot="title">{{ menu.label }}</span>
      </el-menu-item>

      <!-- 含子菜单 -->
      <el-submenu v-else :index="menu.label">

        <span slot="title"><i :class="menu.icon" />{{ menu.label }}</span>

        <template v-for="subMenu in menu.children">

          <!-- 不含二级子菜单-->
          <el-menu-item v-if="!subMenu.children" :index="subMenu.name" @click="clickMenu(subMenu.name)">
            <i :class="subMenu.icon" />
            <span slot="title">{{ subMenu.label }}</span>
          </el-menu-item>

          <!-- 含二级子菜单 -->
          <el-submenu v-else :index="subMenu.label">
            <span slot="title"><i :class="subMenu.icon" />{{ subMenu.label }}</span>
            <el-menu-item v-for="subSubMenu in subMenu.children" :key="subSubMenu.name" :index="subSubMenu.name" @click="clickMenu(subSubMenu.name)">
              <span slot="title">{{ subSubMenu.label }}</span>
            </el-menu-item>
          </el-submenu>

        </template>
      </el-submenu>
    </template>
  </el-menu>
</template>

<script>

import NavigationStore from '@/store/NavigationStore'

export default {
  name: 'Aside',
  props: ['isAsideCollapse'],
  data () {
    return {

      menus: NavigationStore.state.menus,
      currentPage: NavigationStore.state.currentPage,
    }
  },

  methods: {
    clickMenu (name) {
      this.$router.replace({
        name: name
      })
    }
  }
}
</script>


<style lang="less">
.el-menu-vertical-demo:not(.el-menu--collapse) {
  width: 200px;
  min-height: 400px;
}

.el-menu {
  height: 100%;
  border: none;
  background-color: rgba(152, 219, 192, 0.308);
  i {
    color: black;
  }

  #title {
    height: 60px;
    line-height: 60px;
    text-align: center;
    background-color: rgb(52, 217, 162);
    border-right: 0.7px solid #ffffff;
    img {
      width: 30px;
      position: relative;
      top: 9px;
      margin-right: 4px;
    }

    b {
      color: black;
    }
  }
}

.el-menu-item,
.el-menu-item.is-active,
.el-submenu .el-submenu__title .el-submenu.is-active {
  background-color: transparent !important;
}

::-webkit-scrollbar {
  width: 0 !important;
}

.menus {
  height: 56px;
  margin: 0;
  padding: 0;
}
</style>