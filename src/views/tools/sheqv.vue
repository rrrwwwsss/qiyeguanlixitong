<template>
  <div id="odmap" class="odmap">
    <MapController @updateData="updateData" @updateColor="updateOdStreamColor" @updateStyle="updateStyle" :controllerAttribute="controllerAttribute"
      ref="MapController">
    </MapController>

    <div class="rightmap" ref="partODMap">
      <div ref="MapContainer" id="partOD"></div>
    </div>
  </div>
</template>
  
  <script>
import echarts from 'echarts'
import 'echarts-gl'
import 'echarts/extension/bmap/bmap'
import baiduMapStyle from '@/assets/js/baiduMapStyle/style'
import MapController from '@/components/MapController.vue'
import { Loading } from 'element-ui'
import mapboxgl from 'mapbox-gl';
export default {
  name: 'ODFlyLine',
  components: { MapController },

  data () {
    return {
      // 颜色表
      colorList: {},
      // 传递到MapController中的数据
      controllerAttribute: {
        mapType: ['OD社区划分'],
        isNeedShpLoader: false,
        isNeedCustomColor: true,
        // 控制MapController从服务器请求何种数据. 可填写 'point' 'trace' 'od'
        requiredDataType: 'od',
        // 用于控制FileUploader界面需要哪些字段
        fieldConfig: [
          { field: 'olng', description: '起点经度' },
          { field: 'olat', description: '起点纬度' },
          { field: 'dlng', description: '终点经度' },
          { field: 'dlat', description: '终点纬度' }
        ],
        mapStyleList: [
          { name: '样式1', value: baiduMapStyle[0] },
          { name: '样式2', value: baiduMapStyle[1] },
          { name: '样式3', value: baiduMapStyle[2] },
          { name: '样式4', value: baiduMapStyle[3] },
          { name: '样式5', value: baiduMapStyle[4] },
          { name: '样式6', value: baiduMapStyle[5] }
        ]
      }
    }
  },

  mounted () {
    this.initMap()
  },

  methods: {
    // region 初始化地图

    initMap () {
      // this.mapInstance = this.$echarts.init(this.$refs.MapContainer)
      // this.mapInstance.setOption({
      //   bmap: {
      //     center: [116.4, 39.95],
      //     zoom: 11,
      //     roam: true
      //   }
      // })
      const styleMap = {
        "version": 8,
        "sources": {
          "raster-tiles": {
            "type": "raster",
            'tiles': [
              // wprd0{1-4} 
              // scl=1&style=7 为矢量图（含路网和注记）
              // scl=2&style=7 为矢量图（含路网但不含注记）
              // scl=1&style=6 为影像底图（不含路网，不含注记）
              // scl=2&style=6 为影像底图（不含路网、不含注记）
              // scl=1&style=8 为影像路图（含路网，含注记）
              // scl=2&style=8 为影像路网（含路网，不含注记）
              "http://wprd01.is.autonavi.com/appmaptile?x={x}&y={y}&z={z}&lang=zh_cn&size=1&scl=1&style=7"
            ],
            "tileSize": 256
          }
        },
        "layers": [{
          "id": "simple-tiles",
          "type": "raster",
          "source": "raster-tiles",
          "minzoom": 0,
          // "maxzoom": 18
        }]
      }

      mapboxgl.accessToken = 'pk.eyJ1IjoiMTUxMzI3MDY1ODUiLCJhIjoiY201bHJ5cjh3MXJtbjJrczYzcGhkY3JjOSJ9.hSC4cIbmRM5ix-3Y8wnQ9A';
      this.mapInstance = new mapboxgl.Map({
        container: this.$refs.MapContainer, // container ID
        center: [116.4074, 39.9042], // starting position [lng, lat]. Note that lat must be set between -90 and 90
        style: styleMap,
        zoom: 9, // starting zoom
        // pitch: 62, // 初始倾斜角度
        // bearing: -20 // 初始渲染角度
        projection: 'globe' // 地球模式
      });
      this.mapInstance.on('style.load', () => {
        this.mapInstance.setFog({

        })
      })
    },

    // endregion

    // region 加载OD数据

    updateData (mapAttribute) {
      this.odSteamColor = mapAttribute.selectedColor
      this.odType = 3
      this.handleOdDensityData(mapAttribute)


      this.$refs.MapController.$refs.FileUploader.closePopup()
    },

    handleOdDensityData (mapAttribute) {
      this.submitFile(mapAttribute.renderData, 0)
      // this.renderOdStream()
    },

    handleOdStreamData (rawOdData) {
      let layerName = "countries-layer"
      let sourceName = "countries"
      // 假设我们有一个图层 'countries-layer' 和一个数据源 'countries'
      if (this.mapInstance.getLayer(layerName)) {
        this.mapInstance.removeLayer(layerName); // 删除图层
      }

      if (this.mapInstance.getSource(sourceName)) {
        this.mapInstance.removeSource(sourceName); // 删除数据源
      }
      this.mapInstance.addSource(sourceName, {
        type: 'geojson',
        data: rawOdData
      });

      // 添加图层
      this.mapInstance.addLayer({
        id: layerName,
        type: 'fill',
        source: 'countries',
        paint: {
          'fill-opacity': 0.7  // 设置填充的不透明度
        }
      });
      function updateColorMapping (mapInstance, layerName, newColorMapping) {
        // 构造新的 Mapbox 颜色表达式
        const colorExpression = ['match', ['get', 'group']];

        // 遍历新的颜色映射，添加到表达式中
        Object.entries(newColorMapping).forEach(([group, color]) => {
          colorExpression.push(Number(group), color); // group 是属性值，color 是对应颜色
        });

        // 添加默认颜色
        colorExpression.push('gray'); // 未匹配到时的默认颜色

        // 更新图层的填充颜色
        mapInstance.setPaintProperty(layerName, 'fill-color', colorExpression);
      }

      // 定义新的颜色映射
      const newColorMapping = this.colorList;

      // 动态更新颜色映射
      updateColorMapping(this.mapInstance, 'countries-layer', newColorMapping);
    },

    renderOdStream () {
      this.mapOption = {
        baseOption: {
          // 地图飞线样式选项
          series: [
            {
              name: 'Taxi', //名称
              type: 'lines', //线图
              coordinateSystem: 'bmap',
              //进式渲染时每一帧绘制图形数量，设为 0 时不启用渐进式渲染，支持每个系列单独配置。
              //1e6代表 10的16次方
              progressive: 1e6,
              //'lighter' 也是比较常见的一种混合模式，该模式下图形数量集中的区域会颜色叠加成高亮度的颜色（白色）
              //blendMode: 'lighter',
              hoverAnimation: false,
              zlevel: 3,
              effect: {
                show: true,
                constantSpeed: 30,
                period: 8, //箭头指向速度，值越小速度越快
                trailLength: 0.6, //特效尾迹长度[0,1]值越大，尾迹越长重
                trailWidth: 1,
                symbol: 'arrow', // 使用箭头作为特效符号
                symbolSize: 2, // 设置箭头大小
                itemStyle: {
                  color: '#ff0000' // 设置箭头颜色为红色
                }
              },
              postEffect: {
                enable: true
              },
              lineStyle: {
                normal: {
                  width: 0.1, //线条宽度
                  opacity: 0.6, //尾迹线条透明度
                  color: this.odSteamColor,
                  // 设置为曲线段
                  curveness: 0.2 // 曲线的弯曲程度，值在 [0, 1] 之间，0 为直线
                }
              },
              data: this.odData
            }
          ]
        }
      }
      this.mapInstance = echarts.init(this.$refs.MapContainer)

      this.mapInstance.setOption(this.mapOption) // 获取到的百度地图对象bmap适用于所有的百度地图的接口
    },

    // endregion

    // region 自定义样式

    updateStyle (mapStyle) {
      this.mapInstance
        .getModel()
        .getComponent('bmap')
        .getBMap()
        .setMapStyle({ styleJson: mapStyle.value })
    },

    updateOdStreamColor (selectedColor) {
      this.odSteamColor = selectedColor
      this.renderOdStream()
    },

    // endregion

    // 将数组转换为 CSV 格式
    convertArrayToCSV (array, xvanze = 1) {
      let dataAll = []
      if (xvanze == 1) {
        dataAll = array
          .filter(
            (item) =>
              item[this.selecteddlat] &&
              item[this.selecteddlng] &&
              item[this.selectedolng] &&
              item[this.selectedolat]
          ) // Filter out items without lng/lat
          .map((item) => ({
            f_lon: parseFloat(item[this.selectedolng]),
            f_lat: parseFloat(item[this.selectedolat]),
            t_lat: parseFloat(item[this.selecteddlat]),
            t_lon: parseFloat(item[this.selecteddlng])
          }))
      } else {
        dataAll = array.map((item) => ({
          f_lon: parseFloat(item.olng),
          f_lat: parseFloat(item.olat),
          t_lat: parseFloat(item.dlat),
          t_lon: parseFloat(item.dlng)
        }))
      }

      const header = Object.keys(dataAll[0]).join(',') + '\n' // 获取头部行（字段名）
      const rows = dataAll.map((obj) => Object.values(obj).join(',')).join('\n') // 获取每一行
      return header + rows
    },

    // Python后端的数据上传(参数传对象数组)
    async submitFile (file, xvanze = 1) {
      // 动态颜色分配函数
      function generateColorPalette (totalGroups) {
        const colors = [];
        for (let i = 0; i < totalGroups; i++) {
          // 使用 HSL 色相生成颜色，每个组分配一个均匀的色相
          const hue = Math.round((360 / totalGroups) * i); // 色相值
          colors.push(`hsl(${hue}, 70%, 50%)`); // 70% 饱和度，50% 亮度
        }
        return colors;
      }

      // 创建动态分配颜色的映射器
      function createColorMapper (totalGroups) {
        const colorPalette = generateColorPalette(totalGroups);
        const colorMap = new Map(); // 使用 Map 存储 group 和对应颜色
        let groupIndex = 0;

        return function getColor (group) {
          if (!colorMap.has(group)) {
            // 如果该 group 尚未分配颜色，分配一个新颜色
            colorMap.set(group, colorPalette[groupIndex % totalGroups]);
            groupIndex++;
          }
          return colorMap.get(group);
        };
      }
      this.fullscreenLoading = true

      if (!file) {
        alert('请先选择一个文件')
        return
      }
      const csvContent = this.convertArrayToCSV(file, xvanze)

      // 2. 创建 Blob 对象，将 CSV 内容转换为 Blob
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })

      // 3. 创建 FormData 对象，并附加 Blob 文件
      const formData = new FormData()
      formData.append('file', blob) // 'file' 是后端接收文件时的字段名, 'data.csv' 是文件名
      formData.append('odType', this.odType) // 添加 odType 参数
      const loadingInstance = Loading.service({
        lock: true,
        text: '加载中，服务器配置较差，请耐心等待',
        background: 'rgba(0, 0, 0, 0.7)'
      })
      //将本地文件传输给Python后端
      try {
        const response = await fetch('http://127.0.0.1:5000/upload', {
          //   const response = await fetch('http://60.205.12.90:5000/upload', {
          method: 'POST',
          body: formData
        })
        loadingInstance.close()
        // console.log(response)
        if (response.ok) {
          const data = await response.json()
          const totalGroups = data.features.length // 假设总共 5 个 group; // 假设总共 5 个 group
          const getColor = createColorMapper(totalGroups);
          data.features.forEach(feature => {
            const group = feature.properties.group;
            const newMapping = { [group]: getColor(group) }; // 使用方括号动态设置键
            this.colorList = {
              ...this.colorList,
              ...newMapping
            };
          });
          console.log(this.colorList)
          this.handleOdStreamData(data)
          // this.odData = data.map((p) => {
          //   return {
          //     coords: [
          //       [p.f_lon, p.f_lat],
          //       [p.t_lon, p.t_lat]
          //     ]
          //   }
          // })
          // this.renderOdStream()

          this.$message({
            message: "社区划分完成",
            type: 'success'
          })
        } else {
          const error = await response.json()
        }
      } catch (error) {
        loadingInstance.close()
        this.$message({
          message: '服务器响应失败',
          type: 'fail'
        })
        console.error('Error uploading file:', error)
      }
    }
  }
}
  </script>
  
  <style>
html,
body,
#odmap {
  height: 100%;
  width: 100%;
  margin: 0;
  padding: 0;
}

#odmap {
  position: relative;
  height: 100%;
  width: 100%;
}

.rightmap {
  height: 100%;
  float: left;
  width: 100%;
  margin: 0;
  padding: 0;
}

#partOD {
  width: 100%;
  height: 100%;
}
</style>
  