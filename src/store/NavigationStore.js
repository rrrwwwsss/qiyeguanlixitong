import Vue from 'vue'
import Vuex from 'vuex'
import router from '@/router'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    // region 动态菜单

    menus: JSON.parse(localStorage.getItem('menus') || '[]'),
    staticMenus: [
      {
        icon: 'el-icon-magic-stick',
        label: '数据可视化',
        children: [
          {
            icon: 'el-icon-more',
            label: '点可视化',
            children: [
              {
                path: 'scatter',
                name: 'Scatter',
                label: '散点图',
                component: 'tools/Scatter',
              },
              {
                path: 'scatter',
                name: 'Hot',
                label: '热力图',
                component: 'tools/Hot',
              },
              {
                path: 'scatter',
                name: 'HighAccuracyHot',
                label: '高精热力图',
                component: 'tools/HighAccuracyHot',
              },
              {
                path: 'scatter',
                name: 'Grid',
                label: '网格图',
                component: 'tools/Grid',
              },
              {
                path: 'scatter',
                name: 'ThreeDimensional',
                label: '三维柱状图',
                component: 'tools/ThreeDimensional',
              },
              {
                path: 'scatter',
                name: 'Aggregation',
                label: '聚合图',
                component: 'tools/Aggregation',
              },
            ],
          },
          {
            icon: 'el-icon-minus',
            label: '线可视化',
            children: [
              {
                path: 'taxi-trace',
                name: 'taxiTrace',
                label: '三维轨迹图',
                component: 'tools/taxiTrace',
              },
              {
                path: 'OD-density-cluster',
                name: 'OD_Density_Cluster',
                label: 'OD流飞线图',
                component: 'tools/OD_Density_Cluster',
              },
              {
                path: 'sheqv',
                name: 'sheqv',
                label: '社区发现图',
                component: 'tools/sheqv',
              },
            ],
          },
          {
            icon: 'el-icon-picture-outline-round',
            label: '场可视化',
            children: [
              {
                path: 'svector',
                name: 'Svector',
                label: '向量场',
                component: 'tools/Svector',
              },
            ],
          },
        ],
      },
    ],

    // endregion

    // region 动态路由

    flattenMenus: [],

    // endregion

    // region 面包屑 & ActiveMenu

    currentPage: {
      index: 'Home',
      label: '首页',
    },

    // endregion
  },
  mutations: {
    // 动态菜单
    generateMenus(state, onlineMenus) {
      let temp = []
      onlineMenus.forEach((menu) => {
        if (menu.name === '首页') {
          temp.push({
            path: 'home',
            name: 'Home',
            icon: 'el-icon-house',
            label: '首页',
            component: 'system/Home',
          })
        } else if (menu.name === '系统管理') {
          temp.push({
            icon: 'el-icon-s-grid',
            label: '系统管理',
            children: [
              {
                path: 'user',
                name: 'User',
                icon: 'el-icon-user',
                label: '用户管理',
                component: 'system/User',
              },
              {
                path: 'role',
                name: 'Role',
                icon: 'el-icon-s-custom',
                label: '角色管理',
                component: 'system/Role',
              },
              {
                path: 'menu',
                name: 'Menu',
                icon: 'el-icon-menu',
                label: '菜单管理',
                component: 'system/Menu',
              },
            ],
          })
        } else if (menu.name === '数据空间') {
          temp.push({
            path: 'data',
            name: 'Data',
            icon: 'el-icon-document-add',
            label: '数据空间',
            component: 'system/Data',
          })
        }
      })
      state.menus = temp.concat(state.staticMenus)
      localStorage.setItem('menus', JSON.stringify(state.menus))
    },

    // 动态路由
    generateRoutes(state) {
      // 将嵌套的动态菜单扁平化，便于后续处理
      const flattenArray = (arr) => {
        return arr.reduce((acc, item) => {
          acc.push(item)
          if (item.children && Array.isArray(item.children)) {
            acc = acc.concat(flattenArray(item.children))
          }
          return acc
        }, [])
      }
      state.flattenMenus = flattenArray(state.menus)

      // 获取组件资源
      const modules = require.context('@/views', true, /\.vue$/)
      const views = {}
      modules.keys().forEach((key) => {
        const name = key.replace(/(\.\/|\.vue)/g, '')
        views[name] = modules(key).default
      })

      // 从扁平化菜单中过滤出不符合要求的元素（一般为嵌套菜单的父元素，这些元素没有path name component属性，不符合路由要求），然后对符合要求的元素处理成为route
      const routeList = state.flattenMenus
        .filter((menu) => menu.path && menu.name && menu.component)
        .map((menu) => {
          if (menu.path && menu.name && menu.component) {
            return {
              path: menu.path,
              name: menu.name,
              component: views[menu.component],
            }
          }
        })

      // 添加路由
      routeList.forEach((route) => {
        router.addRoute('Main', route)
      })
    },

    // 面包屑 & ActiveMenu
    setCurrentPage(state, currentPageName) {
      state.flattenMenus.forEach((menu) => {
        if (menu.name === currentPageName) {
          state.currentPage = {
            index: menu.name,
            label: menu.label,
          }
          localStorage.setItem('currentPage', JSON.stringify(state.currentPage))
        }
      })
    },
  },
})
