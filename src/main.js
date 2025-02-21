import Vue from 'vue'
import App from './App.vue'
import router from './router'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
import request from './utils/request'
import store from './store'
import BaiduMap from 'vue-baidu-map'
import 'echarts-gl'
import echarts from 'echarts'
import vcolorpicker from'vcolorpicker'

Vue.use(vcolorpicker)

Vue.prototype.$echarts = echarts
Vue.use(BaiduMap, {
  ak: 'CLFCQaM6v6wAiyCAHplw5ZVe2orbKbRv',
})

Vue.use(ElementUI, { size: 'mini' })
Vue.prototype.request = request

new Vue({
  router,
  store,
  render: (h) => h(App),
}).$mount('#app')
