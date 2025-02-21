<!--百度地图-->
<template>
  <div id="app">
    <MapController @updateData="updateData"
                   @updateStyle="updateStyle"
                   @updateShpData="updateShpData"
                   @clearShp="clearShp"
                   :controllerAttribute="controllerAttribute"
                   ref="MapController">
    </MapController>
    <div ref="MapContainer" id="map_container" :style="{height:'100%',width:'100%'}"></div>
  </div>
</template>

<script>
import 'echarts/extension/bmap/bmap'
import baiduMapStyle from '@/assets/js/baiduMapStyle/style'
import MapController from '@/components/MapController.vue'
import * as mapvgl from 'mapvgl'

export default {
  components: {MapController},
  data() {
    return {
      // 传递到MapController中的数据
      controllerAttribute: {
        mapType: ['热力图', '三维热力图'],
        isNeedShpLoader: true,
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
      }
    }
  },

  mounted() {
    this.initMapv()
  },

  methods: {

    // region 初始化地图

    initMapv() {
      this.mapInstance = new BMapGL.Map('map_container', {
        restrictCenter: false,
        style: baiduMapStyle[0]
      })
      this.mapInstance.enableKeyboard()
      this.mapInstance.enableScrollWheelZoom()
      this.mapInstance.enableInertialDragging()
      this.mapInstance.enableContinuousZoom()
      this.mapInstance.setDisplayOptions({
        indoor: false,
        poi: true,
        skyColors: [
          'rgba(5, 5, 30, 0.01)',
          'rgba(5, 5, 30, 1.0)'
        ]
      })
      this.mapInstance.centerAndZoom(new BMapGL.Point(116.4, 39.95), 12)
      this.mapInstance.setTilt(45)
      this.mapInstance.setHeading(0)

      this.leftView = new mapvgl.View({
        map: this.mapInstance
      })

      this.view = new mapvgl.View({
        map: this.mapInstance
      })

    },

    // endregion

    // region 加载热力图

    updateData(mapAttribute) {
      this.view.removeAllLayers()
      this.handleRawPointData(mapAttribute)
    },

    handleRawPointData(mapAttribute) {
      // 此处是将点数据转换为GeoJSON格式以添加进热力图
      this.renderData = mapAttribute.renderData.map(p => {
        return {
          geometry: {
            type: 'Point',
            coordinates: [p.lng, p.lat]
          }
        }
      })

      if (mapAttribute.mapType === '热力图') {
        this.renderHeatMap(this.renderData)
      } else if (mapAttribute.mapType === '三维热力图') {
        this.renderHeat3DMap(this.renderData)
      }
      this.$refs.MapController.$refs.FileUploader.closePopup()
    },

    renderHeatMap(pointData) {
      this.view.addLayer(
        new mapvgl.HeatmapLayer({
          height: 0,
          radius: 60,
          gradient: {
            0.25: 'rgba(0,255,51, 1)',
            0.55: 'rgba(0,153,51, 1)',
            0.85: 'rgba(255,255,51)',
            1.0: 'rgba(255,0,0)'
          },
          data: pointData
        })
      )
    },

    renderHeat3DMap(pointData) {
      this.view.addLayer(
        new mapvgl.HeatmapLayer({
          size: 10,
          max: 30,
          height: 60,
          unit: 'px',
          gradient: {
            0.25: 'rgba(89, 233, 179, 1)',
            0.55: 'rgba(182, 243, 147, 1)',
            0.85: 'rgba(254, 255, 140, 1)',
            0.9: 'rgba(217, 29, 28, 1)'
          },
          data: pointData
        })
      )
    },

    // endregion

    // region 加载服务器shp
    updateShpData(shpData) {
      if (!this.shpLayer) {
        this.shpLayer = new BMapGL.FillLayer({
          crs: 'GCJ02',
          autoSelect: true,
          border: true,
          style: {
            //填充颜色的透明度为 30%
            fillOpacity: .3,
            //设置要素边界线的宽度为 1 像素
            strokeWeight: 1,
            //设置要素边界线的颜色为蓝色
            strokeColor: 'blue'
          }
        })
      }
      // 向图层中添加shp数据，随后向地图容器中添加图层
      this.shpLayer.setData(shpData)
      this.mapInstance.addNormalLayer(this.shpLayer)
    },

    //清除shp
    clearShp() {
      this.mapInstance.removeNormalLayer(this.shpLayer)
    },

    // endregion

    // region 自定义样式

    updateStyle(mapStyle) {
      this.mapInstance.setMapStyleV2({styleJson: mapStyle.value})
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