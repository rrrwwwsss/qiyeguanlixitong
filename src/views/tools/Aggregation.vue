<template>
  <div id="app">
    <MapController @updateData="updateData"
                   @updateStyle="updateStyle"
                   @updateShpData="updateShpData"
                   @clearShp="clearShp"
                   :controllerAttribute="controllerAttribute"
                   ref="MapController">
    </MapController>
    <div ref="MapContainer" id="map" :style="{height:'100%', width:'100%'}"></div>
  </div>
</template>
<script>

import AMapLoader from '@amap/amap-jsapi-loader'
import MapController from '@/components/MapController.vue'

export default {
  components: {MapController},
  data() {
    return {
      // 传递到MapController中的数据
      controllerAttribute: {
        mapType: ['聚合图'],
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
          {name: '标准', value: 'amap://styles/normal'},
          {name: '远山黛', value: 'amap://styles/whitesmoke'},
          {name: '月光银', value: 'amap://styles/light'},
          {name: '幻影黑', value: 'amap://styles/dark'},
          {name: '草色青', value: 'amap://styles/fresh'},
          {name: '雅士灰', value: 'amap://styles/grey'},
          {name: '涂鸦', value: 'amap://styles/graffiti'},
          {name: '马卡龙', value: 'amap://styles/macaron'},
          {name: '极夜蓝', value: 'amap://styles/darkblue'},
          {name: '靛青蓝', value: 'amap://styles/blue'},
          {name: '酱籽', value: 'amap://styles/wine'}
        ]
      }
    }
  },

  mounted() {
    this.initAMap()
  },

  methods: {

    // region 初始化地图

    initAMap() {
      AMapLoader.load({
        key: '3b20e3a90d6b5fdd4d073285823e4ab5', //key值是key值 和安全密钥不同
        version: '2.0', // 指定要加载的 JSAPI 的版本，缺省时默认为 1.4.15
        plugins: ['AMap.MarkerCluster'], // 需要使用的的插件列表，如比例尺'AMap.Scale'等
        'Loca': {  //是否加载 Loca,缺省不加载
          'version': '2.0.0'  //Loca 版本,缺省1.3.2
        }
      })
          .then((AMap) => {
            // 初始化地图
            this.mapInstance = new AMap.Map('map', {
              viewMode: '3D', //  是否为3D地图模式
              zoom: 12.5, // 初始化地图级别
              center: [116.404582, 39.90359], //中心点坐标
              resizeEnable: true,
              //设置地图样式
              mapStyle: 'amap://styles/dark',
              //地图使用截图功能时必须在初始化地图时增加参数，参数内容
              WebGLParams: {
                preserveDrawingBuffer: true
              }
            })

            // 创建 Loca 实例
            this.loca = new Loca.Container({
              map: this.mapInstance
            })

            //创建面图层
            this.polygonLayer = new Loca.PolygonLayer({
              loca: this.loca,
              zooms: [2, 20],
              zIndex: 10,
              visible: true,
              opacity: 1,
              cullface: 'back',
              acceptLight: true,
              shininess: 30,
              hasSide: true,
              depth: true
            })
          })
    },

    // endregion

    // region 加载聚合图

    updateData(mapAttribute) {

      // 渲染前清除上一个数据
      if(this.clusterLayer){
        this.clusterLayer.setMap(null)
      }

      const aggregateData = mapAttribute.renderData.map(p => {
        return {
          lnglat: [p.lng, p.lat]
        }
      })
      this.renderAggregateMap(aggregateData)
      this.$refs.MapController.$refs.FileUploader.closePopup()
    },

    renderAggregateMap(aggregateData) {
      this.clusterLayer = new AMap.MarkerCluster(this.mapInstance, aggregateData, {
        gridSize: 60, // 设置网格像素大小
        renderMarker: (context) => {
          context.marker.setContent('<div style="background-color: hsla(180, 100%, 50%, 0.3); height: 18px; width: 18px; border: 1px solid hsl(180, 100%, 40%); border-radius: 12px; box-shadow: hsl(180, 100%, 50%) 0px 0px 3px;"></div>')
          context.marker.setOffset(new AMap.Pixel(-9, -9))
        }
      })
    },

    // endregion

    // region 加载shp

    updateShpData(shpData) {
      // 图层添加数据
      this.polygonLayer.setSource(new Loca.GeoJSONSource({data: shpData}))
      // 设置样式
      this.polygonLayer.setStyle({
        topColor: 'rgba(64,158,255,0.3)',
        sideColor: 'rgba(255, 71, 58, 0.8)',
        height: 100,
        altitude: 1
      })
      this.loca.add(this.polygonLayer)
    },

    clearShp() {
      this.loca.remove(this.polygonLayer)
    },

    // endregion

    // region 自定义样式

    updateStyle(mapStyle) {
      this.mapInstance.setMapStyle(mapStyle.value)
    }

    // endregion

  },
}
</script>

<style scoped>
#app {
  position: relative;
  height: 100%;
  width: 100%;
}
</style>