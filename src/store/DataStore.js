import Vue from 'vue'
import Vuex from 'vuex'
import request from '@/utils/request'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    // 服务器数据
    onlineDataList: {
      value: '',
      label: '',
      children: [],
    },

    // 服务器shp
    onlineShpList: {
      value: 'shp数据',
      label: 'shp数据',
      children: [],
    },
  },

  mutations: {
    getOnlineDataList(state, requiredDataType) {
      this.commit('resetOnlineDataList')

      const StringMap = {
        point: '点数据',
        trace: '轨迹线数据',
        od: 'OD线数据',
      }

      request
        .get('/dataMenu/find', {
          params: {
            userId: JSON.parse(localStorage.getItem('user')).id,
          },
        })
        .then((res) => {
          state.onlineDataList.value = StringMap[requiredDataType]
          state.onlineDataList.label = StringMap[requiredDataType]
          res.data.forEach((item) => {
            if (item.father === StringMap[requiredDataType]) {
              state.onlineDataList.children.push({
                value: item.name,
                label: item.name,
              })
            }
          })
        })
    },

    resetOnlineDataList(state) {
      state.onlineDataList.children = []
    },

    getOnlineShpList(state) {
      //解决当点击无shp图层后，再点击有shp图层时，shp下拉框数据会有两遍服务器数据
      // state.onlineShpList.children = []
      request
        .get('/dataMenu/find', {
          params: {
            userId: JSON.parse(localStorage.getItem('user')).id,
          },
        })
        .then((res) => {
          res.data.forEach((item) => {
            if (item.father === 'shp数据') {
              state.onlineShpList.children.push({
                value: item.name,
                label: item.name,
              })
            }
          })
        })
    },

    resetOnlineShpList(state) {
      state.onlineShpList.children = []
    },
  },
})
