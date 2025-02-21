<template>
  <div id="app">
    <MapController @updateData="updateData" @updateStyle="updateStyle" :controllerAttribute="controllerAttribute"
      ref="MapController">
      <template v-slot:other>
        <h5>自定义向量轨迹颜色</h5>
        <div style="display: flex; align-items: center">
          <el-select v-model="selectedColorName" placeholder="选择向量轨迹颜色" @change="updateSvectorColor">
            <el-option v-for="color in colorPalettes" :key="color.name" :label="color.name" :value="color.colors">
            </el-option>
          </el-select>
        </div>
      </template>
    </MapController>

    <div ref="MapContainer" id="main" style="height: 100%; width: 100%"></div>
  </div>
</template>

<script>
import 'echarts/extension/bmap/bmap'
import baiduMapStyle from '@/assets/js/baiduMapStyle/style'
import MapController from '@/components/MapController.vue'

// 设置安全密钥
window._AMapSecurityConfig = {
  securityJsCode: '2ea80cc47ad3077e3b0803aba12f5849'
}

export default {
  name: 'Svector',
  components: { MapController },
  data() {
    return {
      // 传递到MapController中的数据
      controllerAttribute: {
        mapType: ['轨迹向量场'],
        isNeedShpLoader: false,
        isNeedCustomColor: false,
        // 控制MapController从服务器请求何种数据. 可填写 'point' 'trace' 'od'
        requiredDataType: 'point',
        // 用于控制FileUploader界面需要哪些字段
        fieldConfig: [
          { field: 'cid', description: 'CID' },
          { field: 'lng', description: '经度' },
          { field: 'lat', description: '纬度' }
        ],
        mapStyleList: [
          { name: '样式1', value: baiduMapStyle[0] },
          { name: '样式2', value: baiduMapStyle[1] },
          { name: '样式3', value: baiduMapStyle[2] },
          { name: '样式4', value: baiduMapStyle[3] },
          { name: '样式5', value: baiduMapStyle[4] },
          { name: '样式6', value: baiduMapStyle[5] }
        ]
      },

      // 以下数据为轨迹向量图独有，不经过MapController处理而直接在此处使用
      // 自定义向量颜色
      selectedColor: ['#313695', '#4575b4', '#74add1', '#abd9e9', '#e0f3f8', '#ffffbf', '#fee090', '#fdae61', '#f46d43', '#d73027', '#a50026'],
      selectedColorName: '',
      colorPalettes: [
        {
          name: '颜色1',
          colors: ['#313695', '#4575b4', '#74add1', '#abd9e9', '#e0f3f8', '#ffffbf', '#fee090', '#fdae61', '#f46d43', '#d73027', '#a50026']
        },
        {
          name: '颜色2',
          colors: ['#0fd7ff', '#2aceea', '#44c5d5', '#5fbbc0', '#7ab2ab', '#94a996', '#afa081', '#ca966c',
            '#e48d57', '#e0a58b', '#e5b7a4']
        },
        {
          name: '颜色3',
          colors: ['#f622b4', '#e5b7a4', '#04a069', '#966060', '#7ab2ab', '#94a996', '#afa081', '#ca966c',
            '#c3eadc', '#936d8a', '#e5b7a4']
        },
        {
          name: '颜色4',
          colors: ['#521262', '#6639a6', '#3fc1c9', '#6fe7dd', '#bad7df', '#f6f7d7', '#ffd460', '#f07b3f',
            '#ea5455', '#ff165d', '#e23e57']
        },
      ],
    }
  },

  mounted() {
    this.initMap()
  },

  methods: {

    // region 初始化地图

    initMap() {
      this.mapInstance = this.$echarts.init(this.$refs.MapContainer)
      this.mapInstance.setOption({
        bmap: {
          center: [116.403, 39.923],
          zoom: 12,
          roam: true
        }
      })
      // 添加百度地图插件bmp，获得地图对象，获取到的百度地图对象适用于所有的百度地图的接口。
      this.mapModel = this.mapInstance.getModel().getComponent('bmap').getBMap()
      //设置当前地图的样式
      this.mapModel.setMapStyle(this.mapStyle)
    },

    // endregion

    // region 加载向量场

    updateData(mapAttribute) {

      const message = this.$message({
        message: '正在加载轨迹向量场',
        duration: 0
      })

      const data = mapAttribute.renderData.map(p => {
        return {
          cid: p.cid,
          lng: p.lng,
          lat: p.lat
        }
      })

      const worker = new Worker(
        new URL('@/utils/handleDataWorker.js', import.meta.url),
        { type: 'module' }
      )

      // 绑定接收消息的监听
      worker.onmessage = (event) => {
        this.svectorData = event.data.finalData
        this.maxMag = event.data.maxMag
        this.minMag = event.data.minMag
        this.renderSvectorMap()
        message.close()
        this.$message({
          message: '轨迹向量场加载完成',
          type: 'success'
        })
      }

      // 向分线程发送消息
      worker.postMessage({
        data: data,
        type: 'svector'
      })

      this.$refs.MapController.$refs.FileUploader.closePopup()
    },

    renderSvectorMap() {
      const mapData = {
        title: '',
        mapColor: '#5c9ac1', //地图填充颜色
        borderColor: '#5278a7', //地图边框颜色
        shadowColor: '#5174a4', //阴影颜色
        shadowBlur: 1, //地图阴影
        setIntervalTime: 3000 //默认刷新时间3秒
      }

      this.mapOption = {
        visualMap: {
          show: false,
          left: 'right',
          min: this.minMag,
          max: this.maxMag,
          dimension: 4,
          inRange: {
            color: this.selectedColor
          },
          realtime: false,
          calculable: true,
          textStyle: {
            color: '#fff'
          }
        },
        bmap: {
          center: [116.403, 39.923],
          zoom: 12,
          roam: true
        },

        title: {
          text: mapData.title,
          right: '20px',
          top: 26,
          textStyle: {
            fontSize: 23,
            color: '#feb64d'
          }
        },

        series: [
          {
            type: 'flowGL',
            coordinateSystem: 'bmap',
            data: this.svectorData,
            supersampling: 1,
            particleType: 'line', //粒子类型
            particleDensity: 128, //粒子密度
            // particleSize: 3, //粒子大小
            particleSpeed: 1, //粒子速度
            itemStyle: {
              opacity: 0.7
            }
          }
        ]
      }

      this.mapInstance.setOption(this.mapOption)
    },

    // endregion

    // region 自定义样式

    updateStyle(mapStyle) {
      this.mapModel.setMapStyle({ styleJson: mapStyle.value })
    },

    updateSvectorColor(selectedColor) {
      this.selectedColor = selectedColor
      this.renderSvectorMap()
    },

    // endregion

  },
}
</script>

<style>
#app {
  position: relative;
  height: 100%;
  width: 100%;
}
</style>