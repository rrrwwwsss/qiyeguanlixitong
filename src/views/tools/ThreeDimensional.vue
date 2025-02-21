<template>
  <div id="app">

    <MapController @updateData="updateData"
                   @updateStyle="updateStyle"
                   @updateShpData="updateShpData"
                   @clearShp="clearShp"
                   :controllerAttribute="controllerAttribute"
                   ref="MapController">
      <template v-slot:other>
        <h5>自定义柱状图颜色</h5>
        <div style="display: flex; align-items: center">
          <el-select v-model="selectedColorName"
                     placeholder="选择柱状图颜色"
                     @change="updateHistogramColor">
            <el-option v-for="color in colorPalettes" :key="color.name"
                       :label="color.name"
                       :value="color.colors">
            </el-option>
          </el-select>
        </div>
      </template>
    </MapController>


    <!--展示高德的div容器-->
    <div ref="MapContainer" id="autonavi_map" :style="{height:'100%',width:'100%'}"></div>
  </div>
</template>
<script>
import MapController from '@/components/MapController.vue'
import AMapLoader from '@amap/amap-jsapi-loader'

// 设置安全密钥

// let polygonLayer, loca
export default {
  components: {MapController},
  data() {
    return {
      // 传递到MapController中的数据
      controllerAttribute: {
        mapType: ['三维柱状图'],
        isNeedCustomColor: false,
        isNeedShpLoader: true,
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
      },

      mapInstance: null,

      // 以下数据为三维柱状图图独有，不经过MapController处理而直接在此处使用
      // 自定义柱体颜色
      selectedColor: ['#FFFF99', '#FFFF00', '#FFCC00', '#FF9900', '#FF6600', '#FF3300', '#FF0000', '#CC3300'],
      selectedColorName: '',
      colorPalettes: [
        {
          name: '样式1',
          colors: ['#FFFF99', '#FFFF00', '#FFCC00', '#FF9900', '#FF6600', '#FF3300', '#FF0000', '#CC3300']
        },
        {
          name: '样式2',
          colors: ['#5e5a68', '#705764', '#825560', '#94525b', '#a64f57', '#b74d53', '#c94a4f', '#db474a']
        },
        {
          name: '样式3',
          colors: ['#e0a58b', '#A8CBDF', '#7895C1', '#F5EBAE', '#EF8B67', '#E3625D', '#B54764', '#992224']
        }
      ]
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
        plugins: ['AMap.ToolBar', 'AMap.Driving', 'AMap.HeatMap', 'AMap.ScatterPointLayer', 'AMap.MarkerCluster'], // 需要使用的的插件列表，如比例尺'AMap.Scale'等
        'Loca': {  //是否加载 Loca,缺省不加载
          'version': '2.0.0'  //Loca 版本,缺省1.3.2
        }
      }).then((AMap) => {
        // 初始化地图
        this.mapInstance = new AMap.Map('autonavi_map', {
          viewMode: '3D', //  是否为3D地图模式
          zoom: 12.5, // 初始化地图级别
          pitch: 45,
          center: [116.404582, 39.90359], //中心点坐标
          resizeEnable: true,
          mapStyle: 'amap://styles/dark',
          //专门用于高德地图截图功能的代码，不然截图就是一片空白
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

    // region 加载三维柱状图

    updateData(mapAttribute) {
      this.histogramData = mapAttribute.renderData.map(p => {
        return {
          'type': 'Feature',
          'geometry': {
            'type': 'Point',
            'coordinates': [p.lng, p.lat]
          },
          'properties': {
            // 生成对应的权重值(展示在界面上就是高度)。生成[1,10]的随机数
            'count': Math.floor(Math.random() * 2) + 1
          }
        }
      })

      this.renderHistogramMap()

      this.$refs.MapController.$refs.FileUploader.closePopup()
    },

    renderHistogramMap() {
      this.clearHistogram()


      this.autonavi_loca = new Loca.Container({
        map: this.mapInstance,
        opacity: 1
      })
      // 环境光，对于可以接受光照的图层（PolygonLayer 等）会增加环境光的影响。环境光只能有一个，多余的会被忽略。
      this.autonavi_loca.AmbientLight = {
        intensity: 0.3,
        color: '#fff'
      }
      // 平行光，对于可以接受光照的图层（PolygonLayer 等）会增加平行光的影响。平行光一般用来模拟太阳的光照。 它的方向由 position 射向 target。position和target的坐标是一个位置加 z 值（单位米）高度决定。比如: [1, 1, 1000] 代表x:1, y:1, 高度1000米。 如果模拟一个从正南方向的平行光，可以设置target: [0,0,0], position: [0,-1,0]
      this.autonavi_loca.DirectionalLight = {
        intensity: 1.2,
        color: '#fff',
        target: [0, 1, 0],
        position: [0, -1, 1]
      }
      // 点光，对于可以接受光照的图层（PolygonLayer 等）会增加点光的影响。点光源通常用来突出展示场景中的某些物体。 它的位置和平行光不太一样，x和y是地图上的经纬度位置，z是高度米，比如北京上空一万米的位置放一个点光源：position: [116.39079, 39.90624, 10000]。 光照的distance代表光能照射的最远距离是多少。
      this.autonavi_loca.PointLight = {
        color: 'rgb(100,100,100)',
        position: [114.2517, 30.552128, 20000],
        intensity: 1.6,
        // 距离表示从光源到光照强度为 0 的位置，0 就是光不会消失。
        distance: 100000
      }

      //加载数据
      this.geo = new Loca.GeoJSONSource({
        data: {
          type: 'FeatureCollection',
          features: this.histogramData
        }
      })

      // 格图，将普通的点数据按照网格划分成若干区域，每个网格区域都会包含落在此区域内的点数据信息。 每个网格格子支持单独设置自定义的高度信息、颜色信息。 要注意的是：我们认为所有网格格子必须是唯一的大小（radius）和间隙（gap）。 我们还在带有高度的网格中加入了可接受光照信息的属性：acceptLight。假如设置了光照并在图层中开启接受光照， 那么每个立体网格将会有光照反射的效果。
      var ll = new Loca.GridLayer({
        // loca,
        zIndex: 10,
        opacity: 1,
        visible: true,
        zooms: [2, 22],
        acceptLight: true

      })
      //设置柱状图颜色 蓝紫色(最疏)＜青绿色＜青色＜淡黄色＜深黄色＜淡红色＜红色(最密)来区分的。
      const colors = this.selectedColor
      const heights = [100, 200, 400, 600, 800, 1400, 1800, 4000]

      //添加数据，进行渲染
      ll.setSource(this.geo)

      ll.setStyle({
        unit: 'meter',
        radius: 66,
        gap: 0,
        altitude: 100,
        height: function (index, feature) {
          var ranks = feature.coordinates && feature.coordinates.length || 0
          return ranks < 5 ?
              heights[0] : ranks < 10 ?
                  heights[1] : ranks < 20 ?
                      heights[2] : ranks < 30 ?
                          heights[3] : ranks < 50 ?
                              heights[4] : ranks < 80 ?
                                  heights[5] : ranks < 100 ?
                                      heights[6] : heights[7]
        },
        topColor: function (index, feature) {
          var ranks = feature.coordinates && feature.coordinates.length || 0
          return ranks < 5 ?
              colors[0] : ranks < 10 ?
                  colors[1] : ranks < 20 ?
                      colors[2] : ranks < 30 ?
                          colors[3] : ranks < 50 ?
                              colors[4] : ranks < 80 ?
                                  colors[5] : ranks < 100 ?
                                      colors[6] : colors[7]
        }
      })


      this.autonavi_loca.add(ll)

      this.autonavi_lengend = new Loca.Legend({
        loca: this.autonavi_loca,
        title: {
          label: '车辆密度(辆)',
          fontColor: 'rgba(255,255,255,0.4)',
          fontSize: '16px'
        },
        style: {
          backgroundColor: 'rgba(255,255,255,0.1)',
          right: '20px',
          bottom: '20px',
          fontSize: '12px'
        },
        dataMap: [
          {label: 100, color: colors[7]},
          {label: 80, color: colors[6]},
          {label: 50, color: colors[5]},
          {label: 40, color: colors[4]},
          {label: 30, color: colors[3]},
          {label: 20, color: colors[2]},
          {label: 10, color: colors[1]},
          {label: 5, color: colors[0]}
        ]
      })

    },

    clearHistogram() {
      /**
       * 高德地图相关的地图图层清理
       */
      // 移除图例 ，对应第二个功能中的图例
      if (this.autonavi_lengend != null) {
        this.autonavi_lengend.remove()
      }
      //清空数据
      this.geo = null

      // 清楚loca图层上显示的样式
      if (this.autonavi_loca != null) {
        this.autonavi_loca.clear()
      }
    },


    // endregion

    // region 加载shp

    updateShpData(shpData) {
      // console.log(shpData)
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
    },

    updateHistogramColor(selectedColor) {
      this.selectedColor = selectedColor
      this.renderHistogramMap()
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