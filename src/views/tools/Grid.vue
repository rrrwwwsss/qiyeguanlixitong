<template>
  <div id="app">
    <MapController @updateData="updateData"
                   @updateStyle="updateStyle"
                   :controllerAttribute="controllerAttribute"
                   ref="MapController">
      <template v-slot:other>
        <h5>自定义网格颜色</h5>
        <div style="display: flex; align-items: center">
          <el-select v-model="selectedColorName"
                     placeholder="选择网格颜色"
                     @change="updateGridColor">
            <el-option v-for="color in colorPalettes" :key="color.name"
                       :label="color.name"
                       :value="color.colors">
            </el-option>
          </el-select>
        </div>
      </template>
    </MapController>

    <div ref="MapContainer" id="main" style="height:100%;width:100%;"></div>
  </div>
</template>

<script>
import 'echarts/extension/bmap/bmap'
import baiduMapStyle from '@/assets/js/baiduMapStyle/style'
import echarts from 'echarts'
import MapController from '@/components/MapController.vue'


export default {
  name: 'Grid',
  components: {MapController},
  data() {
    return {
      // 传递到MapController中的数据
      controllerAttribute: {
        mapType: ['网格图'],
        isNeedShpLoader: false,
        isNeedCustomColor: false,
        // 控制MapController从服务器请求何种数据. 可填写 'point' 'trace' 'od'
        requiredDataType: 'point',
        // 用于控制FileUploader界面需要哪些字段
        fieldConfig: [
          {field: 'lng', description: '经度'},
          {field: 'lat', description: '纬度'}
        ],
        mapStyleList: [
          {name: '样式1', value: baiduMapStyle[0]},
          {name: '样式2', value: baiduMapStyle[1]},
          {name: '样式3', value: baiduMapStyle[2]},
          {name: '样式4', value: baiduMapStyle[3]},
          {name: '样式5', value: baiduMapStyle[4]},
          {name: '样式6', value: baiduMapStyle[5]}
        ]
      },

      // 以下数据为网格图独有，不经过MapController处理而直接在此处使用
      // 自定义网格颜色
      selectedColor: ['#FFFF99', '#FFFF00', '#FFCC00', '#FF9900', '#FF6600', '#FF3300', '#FF0000', '#CC3300'],
      selectedColorName: '',
      colorPalettes: [
        {
          name: '颜色1',
          colors: ['#FFFF99', '#FFFF00', '#FFCC00', '#FF9900', '#FF6600', '#FF3300', '#FF0000', '#CC3300']
        },
        {
          name: '颜色2',
          colors: ['#99FFFF', '#00FFFF', '#00CCFF', '#0099FF', '#0066FF', '#0033FF', '#0000FF', '#3300CC']
        },
        {
          name: '颜色3',
          colors: ['#F2FAFC', '#A8CBDF', '#7895C1', '#F5EBAE', '#EF8B67', '#E3625D', '#B54764', '#992224']
        }
      ]
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

    // region 加载网格图

    updateData(mapAttribute) {

      const pointData = mapAttribute.renderData.map(p => {
        return {lng: p.lng, lat: p.lat}
      })

      const worker = new Worker(
        new URL('@/utils/handleDataWorker.js', import.meta.url),
        {type: 'module'}
      )

      // 绑定接收消息的监听
      worker.onmessage = (event) => {
        this.gridData = event.data
        this.renderGridMap()
      }

      // 向分线程发送消息
      worker.postMessage({
        data: pointData,
        type: 'grid'
      })

      this.$refs.MapController.$refs.FileUploader.closePopup()
    },

    renderGridMap() {
      let arrmax = []
      for (let i = 0; i < this.gridData.length; i++) {
        let a = this.gridData[i][2]
        arrmax.push(a)

      }
      //获得最大值最小值
      let maxnum = Math.max.apply(null, arrmax)
      let minnum = Math.min.apply(null, arrmax)

      //对输入数据进行均分
      let ava = (100 * maxnum - 100 * minnum) / 800

      ava = ava.toFixed(2)
      //得到均分数组
      let arr = []
      for (let i = 0; i < 8; i++) {
        let jia = minnum + i * ava
        arr.push(jia)
      }

      function renderItem(params, api) {
        var lngIndex = api.value(0)
        var latIndex = api.value(1)

        var pointLeftTop = getCoord(params, api, lngIndex, latIndex)
        var pointRightBottom = getCoord(params, api, lngIndex + 1, latIndex + 1)
        return {
          type: 'rect',
          shape: {
            x: pointLeftTop[0],
            y: pointLeftTop[1],
            width: pointRightBottom[0] - pointLeftTop[0],
            height: pointRightBottom[1] - pointLeftTop[1]
          },
          style: api.style({
            stroke: 'rgba(0,0,0,0.1)'
          }),
          styleEmphasis: api.styleEmphasis()
        }
      }

      function getCoord(params, api, lngIndex, latIndex) {
        var coords = params.context.coords || (params.context.coords = [])
        var key = lngIndex + '-' + latIndex
        // bmap returns point in integer, which makes cell width unstable.
        // So we have to use right bottom point.
        let latExtent = [115.9, 116.8]
        let lngExtent = [39.5, 40.6]
        let cellCount = [100, 100]
        let cellSizeCoord = [
          (lngExtent[1] - lngExtent[0]) / cellCount[0],
          (latExtent[1] - latExtent[0]) / cellCount[1]
        ]
        return (
          coords[key] ||
          (coords[key] = api.coord([
            +(latExtent[0] + lngIndex * cellSizeCoord[0]).toFixed(6),
            +(lngExtent[0] + latIndex * cellSizeCoord[1]).toFixed(6)
          ]))
        )
      }

      const option = {
        tooltip: {},
        visualMap: {
          title: {
            text: '出租车乘客OD网格图',
            right: '20px',
            top: 26,
            textStyle: {
              fontSize: 23,
              color: '#feb64d'
            }
          },
          type: 'piecewise',
          inverse: true,
          top: 10,
          right: 10,
          pieces: [
            {
              gt: arr[0],
              lte: arr[1],
              color: this.selectedColor[0],
              opacity: 0.7
            },
            {
              gt: arr[1],
              lte: arr[2],
              color: this.selectedColor[1],
              opacity: 0.7
            },
            {
              gt: arr[2],
              lte: arr[3],
              color: this.selectedColor[2],
              opacity: 0.7
            },
            {
              gt: arr[3],
              lte: arr[4],
              color: this.selectedColor[3],
              opacity: 0.7
            },
            {
              gt: arr[4],
              lte: arr[5],
              color: this.selectedColor[4],
              opacity: 0.7
            },
            {
              gt: arr[5],
              lte: arr[6],
              color: this.selectedColor[5],
              opacity: 0.7
            },
            {
              gt: arr[6],
              lte: arr[7],
              color: this.selectedColor[6],
              opacity: 0.7
            },
            {
              gt: arr[7],
              color: this.selectedColor[7],
              opacity: 0.7
            }
          ],
          borderColor: '#ccc',
          borderWidth: 2,
          backgroundColor: '#eee',
          dimension: 2,
          inRange: {
            color: this.selectedColor,
            opacity: 0.7
          }
        },
        series: [
          {
            type: 'custom',
            coordinateSystem: 'bmap',
            renderItem: renderItem,
            animation: false,
            emphasis: {
              itemStyle: {
                color: 'yellow'
              }
            },
            encode: {
              tooltip: 2
            },
            data: this.gridData
          }
        ],
        bmap: {
          center: [116.403, 39.923],
          zoom: 12,
          roam: true,
          mapStyle: {
            styleJson: baiduMapStyle[0]
          }
        }
      }

      this.mapInstance.setOption(option)
    },

    // endregion

    // region 自定义样式

    updateStyle(mapStyle) {
      this.mapModel.setMapStyle({styleJson: mapStyle.value})
    },

    updateGridColor(selectedColor) {
      this.selectedColor = selectedColor
      this.renderGridMap()
    }

    // endregion

  }
}
</script>

<style scoped>
#app {
  position: relative;
  height: 100%;
  width: 100%;
}
</style>

