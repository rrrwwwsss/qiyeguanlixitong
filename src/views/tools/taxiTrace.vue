<template>
  <div id="app">
    <MapController @updateData="updateData" @updateStyle="updateStyle" @updateShpData="updateShpData"
      @clearShp="clearShp" :controllerAttribute="controllerAttribute" ref="MapController">
      <template v-slot:other>
        <div>
          <h5>自定义轨迹颜色</h5>
          <div id="figure-legends" style="display: flex; align-items: center; font-size: 14px">
            <div class="figure-legends-item">
              <span>下车</span>
              <colorPicker v-model="traceColor[0]" @change="updateTraceColor(0, traceColor[0])" />
            </div>
            <div class="figure-legends-item">
              <span>空载</span>
              <colorPicker v-model="traceColor[1]" @change="updateTraceColor(1, traceColor[1])" />
            </div>
            <div class="figure-legends-item">
              <span>驻车</span>
              <colorPicker v-model="traceColor[2]" @change="updateTraceColor(2, traceColor[2])" />
            </div>
            <div class="figure-legends-item">
              <span>乘客</span>
              <colorPicker v-model="traceColor[3]" @change="updateTraceColor(3, traceColor[3])" />
            </div>
            <div class="figure-legends-item">
              <span>其他</span>
              <colorPicker v-model="traceColor[4]" @change="updateTraceColor(4, traceColor[4])" />
            </div>
          </div>
        </div>
      </template>
    </MapController>
    <div ref="MapContainer" id="map" class="container"></div>
    <div id="progress" v-if="!(playProgress === 100 || playProgress === 0)">
      <el-progress type="circle" :percentage="playProgress"></el-progress>
    </div>
  </div>
</template>

<script>
import 'maptalks/dist/maptalks.css'
import * as maptalks from 'maptalks'
import MapController from '@/components/MapController.vue'

export default {
  name: 'Trace',
  components: { MapController },
  data() {
    return {
      // 传递到MapController中的数据
      controllerAttribute: {
        mapType: ['三维轨迹图'],
        isNeedShpLoader: true,
        isNeedCustomColor: false,
        // 控制MapController从服务器请求何种数据. 可填写 'point' 'trace' 'od'
        requiredDataType: 'trace',
        // 用于控制FileUploader界面需要哪些字段
        fieldConfig: [
          { field: 'time', description: '时间' },
          { field: 'lng', description: '经度' },
          { field: 'lat', description: '纬度' },
          { field: 'state', description: '载客状态' }
        ],
        mapStyleList: [
          {
            name: '黑暗色',
            value: 'https://api.mapbox.com/styles/v1/litaizeng/cklt2ts8a21u318psl7vdmurq/tiles/256/{z}/{x}/{y}@2x?access_token=pk.eyJ1IjoibGl0YWl6ZW5nIiwiYSI6ImNrbHhycTZyNzEza2IydnBsbmo3dHh0Z3UifQ.q8qjMrqztI3hgqcyxolfMQ'
          },
          {
            name: 'outdoors-v12',
            value: 'https://api.mapbox.com/styles/v1/mapbox/outdoors-v12/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoibGl0YWl6ZW5nIiwiYSI6ImNrbHhycTZyNzEza2IydnBsbmo3dHh0Z3UifQ.q8qjMrqztI3hgqcyxolfMQ'
          },
          {
            name: 'streets-v12',
            value: 'https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoibGl0YWl6ZW5nIiwiYSI6ImNrbHhycTZyNzEza2IydnBsbmo3dHh0Z3UifQ.q8qjMrqztI3hgqcyxolfMQ'
          },
          {
            name: 'dark-v11',
            value: 'https://api.mapbox.com/styles/v1/mapbox/dark-v11/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoibGl0YWl6ZW5nIiwiYSI6ImNrbHhycTZyNzEza2IydnBsbmo3dHh0Z3UifQ.q8qjMrqztI3hgqcyxolfMQ'
          },
          {
            name: 'mapbox卫星图',
            value: 'https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/256/{z}/{x}/{y}@2x?access_token=pk.eyJ1IjoibGl0YWl6ZW5nIiwiYSI6ImNrbHhycTZyNzEza2IydnBsbmo3dHh0Z3UifQ.q8qjMrqztI3hgqcyxolfMQ'
          },
          {
            name: 'light-v11',
            value: 'https://api.mapbox.com/styles/v1/mapbox/light-v11/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoibGl0YWl6ZW5nIiwiYSI6ImNrbHhycTZyNzEza2IydnBsbmo3dHh0Z3UifQ.q8qjMrqztI3hgqcyxolfMQ'
          },
          {
            name: 'navigation-day-v1',
            value: 'https://api.mapbox.com/styles/v1/mapbox/navigation-night-v1/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoibGl0YWl6ZW5nIiwiYSI6ImNrbHhycTZyNzEza2IydnBsbmo3dHh0Z3UifQ.q8qjMrqztI3hgqcyxolfMQ'
          }
        ]
      },

      // 以下数据为三维轨迹图独有，不经过MapController处理而直接在此处使用
      // 自定义轨迹颜色
      traceColor: ['#ffc56e', '#0092bc', '#d0006f', '#800080', '#e6e6e6'],
      playProgress: 0
    }
  },

  mounted() {
    this.initMap()
  },

  methods: {

    // region 初始化地图

    initMap() {
      this.mapInstance = new maptalks.Map('map', {
        center: [116.409686, 39.99999999],
        zoom: 11,
        pitch: 56, //俯视角
        bearing: 30,  // 旋转角
        dragRotatePitch: true,
        baseLayer: new maptalks.TileLayer('base', {
          urlTemplate: this.controllerAttribute.mapStyleList[0].value,
          subdomains: ['a', 'b', 'c', 'd'],
          attribution: false
        })
      })
    },

    // endregion

    // region 加载三维轨迹图

    updateData(mapAttribute) {


      this.traceData = mapAttribute.renderData.map(p => {
        return {
          height: p.time * 0.1,
          lng: p.lng,
          lat: p.lat,
          status: p.status
        }
      })
      this.renderTraceMap()

      this.$refs.MapController.$refs.FileUploader.closePopup()
    },

    renderTraceMap() {
      clearInterval(this.interval)
      this.mapInstance.removeLayer(this.traceLayer)

      this.traceLayer = new maptalks.VectorLayer('vector',
        {
          enableAltitude: true //启用高度渲染几何图形
        }).addTo(this.mapInstance)
      this.mapInstance.addLayer(this.traceLayer)

      const that = this
      let count = 0
      this.playProgress = 0
      this.isRendering = true

      const message = this.$message({
        message: '正在播放轨迹',
        duration: 0
      })

      this.interval = setInterval(() => {
        this.playProgress = Math.round(count / this.traceData.length * 100)

        //这里添加两组数据是为了避免轨迹产生断点
        const tracePoint = [
          [this.traceData[count].lng, this.traceData[count].lat],
          [this.traceData[count + 1].lng, this.traceData[count + 1].lat]
        ]
        const traceHeight = [
          this.traceData[count].height,
          this.traceData[count + 1].height
        ]
        new maptalks.LineString(tracePoint, {
          'properties': {
            'altitude': traceHeight
          },
          'symbol': {
            'lineColor': that.traceColor[this.traceData[count].status],
            'lineWidth': 2.5,
            'textPlacement': 'vertex'
          }
        }).addTo(that.traceLayer)

        // 计数加1，开始加载下一组数据；当计数超过数据范围时，停止循环
        count = count + 1
        if (count >= this.traceData.length - 1) {
          clearInterval(this.interval)
          message.close()
          this.$message({
            message: '轨迹播放完成',
            type: 'success'
          })
          this.isRendering = false
        }
      }, 3)
    },

    // endregion

    // region 加载shp

    updateShpData(shpData) {
      this.clearShp()

      this.shpLayer = new maptalks.VectorLayer('shpLayer')
      this.shpLayer.setStyle({
        symbol: {
          'polygonFill': 'rgba(0, 0, 255, 0.3)', // 设置填充颜色及透明度
          'lineColor': '#000', // 设置边界线颜色
          'lineWidth': 1 // 设置边界线宽度
        }
      })
      this.shpLayer.addGeometry(shpData)

      this.mapInstance.addLayer(this.shpLayer)
    },

    clearShp() {
      if (this.shpLayer) {
        this.mapInstance.removeLayer(this.shpLayer)
      }
    },

    // endregion

    // region 自定义样式

    updateStyle(mapStyle) {
      this.mapInstance.removeLayer(this.mapInstance.getBaseLayer())
      this.mapInstance.setBaseLayer(new maptalks.TileLayer('base', {
        urlTemplate: mapStyle.value,
        attribution: false
      }))
    },

    updateTraceColor(index, selectedColor) {
      this.traceColor[index] = selectedColor
      this.renderTraceMap()
    }

    // endregion

  },
}
</script>

<style scoped>
#app {
  position: relative;
  width: 100%;
  height: 100%
}

.container {
  width: 100%;
  height: 100%
}

#figure-legends .figure-legends-item {
  margin-right: 8px;
}

#figure-legends .figure-legends-item span {
  margin-right: 4px;
}

#progress {
  position: absolute;
  padding: 16px;
  border-radius: 50%;
  bottom: 32px;
  left: 120px;
  transform: translateX(-50%);
  background-color: rgba(49, 51, 53, 0.7);
}
</style>
