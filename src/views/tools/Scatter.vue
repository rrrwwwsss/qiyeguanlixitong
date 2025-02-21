<template>
  <div id="scatterMap">
    <MapController @updateData="updateData"
                   @updateColor="updateLeftColor"
                   @updateStyle="updateLeftStyle"
                   @updateShpData="updateShpData"
                   @clearShp="clearShp"
                   :controllerAttribute="controllerAttribute"
                   ref="MapController">
      <template v-slot:other>
        <h5>右侧地图自定义样式</h5>
        <div id="colors-elect" style="display: flex; align-items: center">
          <el-select v-model="rightSelectedStyle"
                     placeholder="选择地图样式"
                     @change="updateRightStyle">
            <el-option v-for="style in controllerAttribute.mapStyleList" :key="style.name"
                       :label="style.name"
                       :value="style">
            </el-option>
          </el-select>

          <colorPicker style="margin-left: 4px;"
                       v-model="rightSelectedColor"
                       @change="updateRightColor"
                       v-if="controllerAttribute.isNeedCustomColor"/>
        </div>
      </template>
    </MapController>

    <div ref="MapContainer" style="height:100%;width:100%;">
      <!--左视图-->
      <div class="leftmap">
        <!--这里不设置  style后面的样式  是不会显示地图的-->
        <div ref="LeftMapContainer" id="map_container" style="height:100%;width:100%;"></div>
      </div>

      <!--用于将左右两个视图隔开-->
      <div class="middlemap"></div>

      <!--右视图-->
      <div class="rightmap">
        <div ref="RightMapContainer" id="partScatter"></div>
      </div>
    </div>
  </div>
</template>

<script>
import 'echarts-gl'
import 'echarts/extension/bmap/bmap'
import baiduMapStyle from '@/assets/js/baiduMapStyle/style'
import MapController from '@/components/MapController.vue'
import * as mapvgl from 'mapvgl'

export default {
  name: 'Scatter',
  components: {MapController},
  data() {
    return {
      // 传递到MapController中的数据
      controllerAttribute: {
        mapType: ['散点图'],
        isNeedShpLoader: true,
        isNeedCustomColor: true,
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

      // 以下数据为散点图独有，不经过MapController处理而直接在此处使用
      // 右侧地图样式
      rightSelectedStyle: baiduMapStyle[1],
      rightSelectedColor: 'rgba(46, 139, 87, 0.9)'
    }
  },

  mounted() {
    this.initLeftmap()
    this.initRightMap()
  },

  methods: {

    // region 初始化地图

    initLeftmap() {
      this.leftMapInstance = new BMapGL.Map('map_container', {
        restrictCenter: false,
        style: baiduMapStyle[0]
      })
      this.leftMapInstance.enableKeyboard()
      this.leftMapInstance.enableScrollWheelZoom()
      this.leftMapInstance.enableInertialDragging()
      this.leftMapInstance.enableContinuousZoom()
      this.leftMapInstance.setDisplayOptions({
        indoor: false,
        poi: true,
        skyColors: [
          'rgba(5, 5, 30, 0.01)',
          'rgba(5, 5, 30, 1.0)'
        ]
      })
      this.leftMapInstance.centerAndZoom(new BMapGL.Point(116.4, 39.95), 12)
      this.leftMapInstance.setTilt(0)
      this.leftMapInstance.setHeading(0)

      this.leftView = new mapvgl.View({
        map: this.leftMapInstance
      })
    },

    initRightMap() {
      this.rightMapInstance = this.$echarts.init(this.$refs.RightMapContainer)
      this.rightMapInstance.setOption({
        bmap: {
          center: [116.4, 39.95],
          zoom: 12,
          // 用户是否可以拖放和缩放地图
          roam: true
        }
      })
      // 添加百度地图插件bmp，获得地图对象，获取到的百度地图对象适用于所有的百度地图的接口。
      this.rightMapModel = this.rightMapInstance.getModel().getComponent('bmap').getBMap()
      //设置当前地图的样式
      // this.rightMapModel.setMapStyle({style: this.baiduMapStyle[0]})
    },

    // endregion 初始化地图

    // region 加载散点图

    updateData(mapAttribute) {

      // 清除左侧图层
      this.leftView.removeAllLayers()

      // 通过将清空数据源清空的方式清除右侧图层
      this.rightScatterData = []
      this.renderRightScatterMap()

      this.selectedLeftColor = mapAttribute.selectedColor
      this.selectedRightColor = mapAttribute.selectedColor
      this.handleRawScatterData(mapAttribute.renderData)

      // 关闭弹窗
      this.$refs.MapController.$refs.FileUploader.closePopup()
    },

    handleRawScatterData(rawScatterData) {
      // 此处是将点数据转换为GeoJSON格式以添加进左侧散点图
      this.leftScatterData = rawScatterData.map(p => {
        return {
          geometry: {
            type: 'Point',
            coordinates: [p.lng, p.lat]
          }
        }
      })
      // 此处是将点数据转换为能被ECharts识别的格式以添加进右侧散点图
      this.rightScatterData = []
      for (let i = 1; i < rawScatterData.length; i++) {
        if (rawScatterData[i - 1].cid != rawScatterData[i].cid) {
          //0.0125和0.007 是用于解决百度地图经纬度的误差，至于为什么是这么大就不清楚了
          this.rightScatterData.push([
            Number(rawScatterData[i - 1].lng) + 0.0125,
            Number(rawScatterData[i - 1].lat) + 0.007
          ])
        }
      }
      // 添加点
      this.renderLeftScatterMap()
      this.renderRightScatterMap()

    },

    renderLeftScatterMap() {
      // 向左侧散点图添加数据
      this.leftView.addLayer(
        new mapvgl.PointLayer({
          blend: 'lighter',
          shape: 'circle',
          color: this.selectedLeftColor,
          size: 3,
          data: this.leftScatterData
        })
      )

    },

    renderRightScatterMap() {
      const option = {
        title: {
          text: '',
          right: '20px',
          top: 26,
          textStyle: {
            fontSize: 23,
            color: '#feb64d'
          }
        },
        roam: true,
        itemStyle: {
          normal: {
            areaColor: '#5c9ac1',
            borderColor: '#5278a7',
            shadowColor: '#5174a4',
            shadowBlur: 1
          },
          emphasis: {
            areaColor: '#5c9ac1'
          }
        },
        series: [{
          name: '散点图2',
          type: 'scatterGL',
          coordinateSystem: 'bmap',
          data: this.rightScatterData,
          progressive: 1e6,
          progressiveThreshold: 100,
          symbolSize: function () {
            return 5
          },
          // 点周围的泛光效果
          // blendMode: 'lighter',
          showEffectOn: 'render',
          rippleEffect: {
            brushType: 'stroke'
          },
          hoverAnimation: false,
          itemStyle: {
            normal: {
              color: this.selectedRightColor
            }
          },
          zlevel: 3
        }]
      }
      this.rightMapInstance.setOption(option)
    },

    // endregion 加载散点图

    // region 加载shp
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
      this.leftMapInstance.addNormalLayer(this.shpLayer)
    },

    //清除shp
    clearShp() {
      this.leftMapInstance.removeNormalLayer(this.shpLayer)
    },

    // endregion

    // region 自定义样式

    // 如果用户只更改了颜色而不更改数据，则跳过数据处理，使用暂存的数据进行渲染
    updateLeftColor(selectedColor) {
      this.leftView.removeAllLayers()
      this.selectedLeftColor = selectedColor
      this.renderLeftScatterMap()
    },

    updateRightColor(selectedColor) {
      // 先使用临时变量temp保存已经处理好的数据，然后将数据源置空以清除图层
      const temp = this.rightScatterData
      this.rightScatterData = []
      this.renderRightScatterMap()

      // 将临时变量temp赋值给数据源，防止因为切换颜色导致数据丢失
      this.rightScatterData = temp
      this.selectedRightColor = selectedColor
      this.renderRightScatterMap()
    },

    updateLeftStyle(mapStyle) {
      this.leftMapInstance.setMapStyleV2({styleJson: mapStyle.value})
    },

    updateRightStyle(mapStyle) {
      this.rightMapModel.setMapStyle({styleJson: mapStyle.value})
    }

    // endregion

  }
}
</script>

<style scoped>
html,
body,
#scatterMap {
  height: 100%;
  width: 100%;
  margin: 0;
  padding: 0;
  position: relative;
}

.leftmap {
  height: 100%;
  float: left;
  width: 49%;
  margin: 0;
  padding: 0;
}

.middlemap {
  float: left;
  width: 0.1%;
  height: 100%;
  background-color: #113097;
}

.rightmap {
  height: 100%;
  float: left;
  width: 50.9%;
  margin: 0;
  padding: 0;
  background-color: #00ccff;
}

#partScatter {
  width: 100%;
  height: 100%;
}

</style>