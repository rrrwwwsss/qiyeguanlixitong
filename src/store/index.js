import Vue from 'vue'
import Vuex from 'vuex'
import request from '@/utils/request'
import router from '@/router'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    data: [
      {
        value: '点数据',
        label: '点数据',
        children: []
      },
      {
        value: '轨迹线数据',
        label: '轨迹线数据',
        children: []
      },
      {
        value: 'OD线数据',
        label: 'OD线数据',
        children: []
      },
      {
        value: 'shp数据',
        label: 'shp数据',
        children: []
      }
    ],
  },
  mutations: {
    //退出用户登录的操作
    logout() {
      // 清空缓存
      localStorage.removeItem('user')
      localStorage.removeItem('menus')
      router.push('/login')
    },

    //用于加载数据空间中 tree控件的下拉菜单
    updateAllDataMenu(state) {
      //登录用户的id
      const userNumber = JSON.parse(localStorage.getItem('user')).id
      //首先清空数据
      for (let i = 0; i < state.data.length; i++) {
        state.data[i].children = []
      }

      request.get('/dataMenu/find',
        {
          params: {
            userId: userNumber
          }
        }).then(res => {
          for (let i = 0; i < res.data.length; i++) {
            //点数据
            if (res.data[i].father === state.data[0].label && res.data[i].user_id != 0) {
              state.data[0].children.push(
                {value: res.data[i].name, label: res.data[i].name}
              )
            }
            // 轨迹数据
            else if (res.data[i].father === state.data[1].label) {
              state.data[1].children.push(
                {value: res.data[i].name, label: res.data[i].name}
              )
            }
            // OD数据
            else if (res.data[i].father === state.data[2].label) {
              state.data[2].children.push(
                {value: res.data[i].name, label: res.data[i].name}
              )
            }
            //shp数据
            else if (res.data[i].father === state.data[3].label) {
              state.data[3].children.push(
                {value: res.data[i].name, label: res.data[i].name}
              )
            }
          }
        }
      )
    },

  }

})

