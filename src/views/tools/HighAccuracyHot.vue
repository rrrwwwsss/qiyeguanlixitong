<template>
  <div id="app">
    <MapController
      @updateData="updateData"
      @updateStyle="updateStyle"
      @updateShpData="updateShpData"
      @clearShp="clearShp"
      :controllerAttribute="controllerAttribute"
      ref="MapController"
    >
    </MapController>
    <div ref="MapContainer" id="map"></div>
  </div>
</template>

<script>
import leaflet from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { pt } from '@/assets/js/TaxiBackHeat/backheat'
import MapController from '@/components/MapController.vue'

export default {
  name: 'TaxiBackHeat',
  components: { MapController },
  data() {
    return {
      heatLayer: null,
      // 传递到MapController中的数据
      controllerAttribute: {
        mapType: ['高精热力图'],
        isNeedShpLoader: true,
        isNeedCustomColor: false,
        // 控制MapController从服务器请求何种数据. 可填写 'point' 'trace' 'od'
        requiredDataType: 'point',
        // 用于控制FileUploader界面需要哪些字段
        fieldConfig: [
          { field: 'lng', description: '经度' },
          { field: 'lat', description: '纬度' }
        ],
        mapStyleList: [
          {
            name: '黑暗色',
            value:
              'https://api.mapbox.com/styles/v1/litaizeng/cklt2ts8a21u318psl7vdmurq/tiles/256/{z}/{x}/{y}@2x?access_token=pk.eyJ1IjoibGl0YWl6ZW5nIiwiYSI6ImNrbHhycTZyNzEza2IydnBsbmo3dHh0Z3UifQ.q8qjMrqztI3hgqcyxolfMQ'
          },
          {
            name: 'outdoors-v12',
            value:
              'https://api.mapbox.com/styles/v1/mapbox/outdoors-v12/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoibGl0YWl6ZW5nIiwiYSI6ImNrbHhycTZyNzEza2IydnBsbmo3dHh0Z3UifQ.q8qjMrqztI3hgqcyxolfMQ'
          },
          {
            name: 'streets-v12',
            value:
              'https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoibGl0YWl6ZW5nIiwiYSI6ImNrbHhycTZyNzEza2IydnBsbmo3dHh0Z3UifQ.q8qjMrqztI3hgqcyxolfMQ'
          },
          {
            name: 'dark-v11',
            value:
              'https://api.mapbox.com/styles/v1/mapbox/dark-v11/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoibGl0YWl6ZW5nIiwiYSI6ImNrbHhycTZyNzEza2IydnBsbmo3dHh0Z3UifQ.q8qjMrqztI3hgqcyxolfMQ'
          },
          {
            name: 'mapbox卫星图',
            value:
              'https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/256/{z}/{x}/{y}@2x?access_token=pk.eyJ1IjoibGl0YWl6ZW5nIiwiYSI6ImNrbHhycTZyNzEza2IydnBsbmo3dHh0Z3UifQ.q8qjMrqztI3hgqcyxolfMQ'
          },
          {
            name: 'light-v11',
            value:
              'https://api.mapbox.com/styles/v1/mapbox/light-v11/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoibGl0YWl6ZW5nIiwiYSI6ImNrbHhycTZyNzEza2IydnBsbmo3dHh0Z3UifQ.q8qjMrqztI3hgqcyxolfMQ'
          },
          {
            name: 'navigation-day-v1',
            value:
              'https://api.mapbox.com/styles/v1/mapbox/navigation-night-v1/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoibGl0YWl6ZW5nIiwiYSI6ImNrbHhycTZyNzEza2IydnBsbmo3dHh0Z3UifQ.q8qjMrqztI3hgqcyxolfMQ'
          }
        ]
      }
    }
  },

  mounted() {
    this.initMap()
  },

  methods: {
    // region 初始化地图

    initMap() {
      this.zdmap = leaflet
        .map('map', {
          //crs: leaflet.CRS.EPSG4326,
          zoomControl: false, // 禁用缩放控件
          dragging: true // 禁用地图拖动，拖动会导致热力图与底图错位
        })
        .setView([39.9, 116.4], 10)
      // 使用高德的WMS服务
      // subdomains 是一个可选参数，用于指定瓦片服务器的子域名
      this.tileLayer = leaflet
        .tileLayer(
          'http://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',
          {
            subdomains: ['1', '2', '3', '4'],
            maxZoom: 21 // 最大放缩级别
          }
        )
        .addTo(this.zdmap)
    },

    // endregion

    // region 加载热力图

    updateData(mapAttribute) {
      if (this.heatLayer) {
        this.zdmap.removeLayer(this.heatLayer)
      }

      const pointData = mapAttribute.renderData.map((p) => {
        return [p.lat, p.lng, 1]
      })

      this.renderHeatMap(pointData)

      this.$refs.MapController.$refs.FileUploader.closePopup()
    },

    // 以下代码用于逆向热力图，我看不懂，不建议修改。加载数据请传参
    renderHeatMap(pointData) {
      pt()
      leaflet.HeatLayer = (
        leaflet.Layer ? leaflet.Layer : leaflet.Class
      ).extend({
        initialize: function (t, i) {
          ;(this._latlngs = t), leaflet.setOptions(this, i)
        },
        setLatLngs: function (t) {
          return (this._latlngs = t), this.redraw()
        },
        addLatLng: function (t) {
          return this._latlngs.push(t), this.redraw()
        },
        setOptions: function (t) {
          return (
            leaflet.setOptions(this, t),
            this._heat && this._updateOptions(),
            this.redraw()
          )
        },
        redraw: function () {
          return (
            !this._heat ||
              this._frame ||
              this._map._animating ||
              (this._frame = leaflet.Util.requestAnimFrame(this._redraw, this)),
            this
          )
        },
        onAdd: function (t) {
          ;(this._map = t),
            this._canvas || this._initCanvas(),
            t._panes.overlayPane.appendChild(this._canvas),
            t.on('moveend', this._reset, this),
            t.options.zoomAnimation &&
              leaflet.Browser.any3d &&
              t.on('zoomanim', this._animateZoom, this),
            this._reset()
        },
        onRemove: function (t) {
          t.getPanes().overlayPane.removeChild(this._canvas),
            t.off('moveend', this._reset, this),
            t.options.zoomAnimation &&
              t.off('zoomanim', this._animateZoom, this)
        },
        addTo: function (t) {
          return t.addLayer(this), this
        },
        _initCanvas: function () {
          let t = (this._canvas = leaflet.DomUtil.create(
              'canvas',
              'leaflet-heatmap-layer leaflet-layer'
            )),
            i = leaflet.DomUtil.testProp([
              'transformOrigin',
              'WebkitTransformOrigin',
              'msTransformOrigin'
            ])
          t.style[i] = '50% 50%'
          let a = this._map.getSize()
          ;(t.width = a.x), (t.height = a.y)
          let s = this._map.options.zoomAnimation && leaflet.Browser.any3d
          leaflet.DomUtil.addClass(
            t,
            'leaflet-zoom-' + (s ? 'animated' : 'hide')
          ),
            (this._heat = simpleheat(t)),
            this._updateOptions()
        },
        _updateOptions: function () {
          this._heat.radius(
            this.options.radius || this._heat.defaultRadius,
            this.options.blur
          ),
            this.options.gradient && this._heat.gradient(this.options.gradient),
            this.options.max && this._heat.max(this.options.max)
        },
        _reset: function () {
          let t = this._map.containerPointToLayerPoint([0, 0])
          leaflet.DomUtil.setPosition(this._canvas, t)
          let i = this._map.getSize()
          this._heat._width !== i.x &&
            (this._canvas.width = this._heat._width = i.x),
            this._heat._height !== i.y &&
              (this._canvas.height = this._heat._height = i.y),
            this._redraw()
        },
        _redraw: function () {
          var a,
            d = [],
            _ = this._heat._r,
            l = this._map.getSize(),
            m = new leaflet.Bounds(leaflet.point([0, 0]), l),
            testa = this._map.containerPointToLatLng(leaflet.point([0, 0])),
            testb = this._map.containerPointToLatLng(leaflet.point([0, 1])),
            w = this._map.distance(testa, testb),
            n = Math.floor(1500 / w),
            Stations = this._latlngs,
            count = 0,
            f = Math.pow(2, Math.max(0, this._map.getZoom() - 12))
          var Canvaspixel = []
          var xlen = l.x,
            ylen = l.y
          for (var ki = 0; ki < xlen; ki++) {
            Canvaspixel[ki] = new Array()
            for (var kj = 0; kj < ylen; kj++) {
              Canvaspixel[ki][kj] = 0
            }
          }
          var count = 0
          var nn = n * n
          for (var t = 0, i = Stations.length; i > t; t++) {
            //把sss（所有数据的其中一个）转换为像素坐标，判断是否在m(m是屏幕的像素坐标范围)中
            //如果在就使用canvas渲染在屏幕上
            var sss = Stations[t]
            if (((a = this._map.latLngToContainerPoint(sss)), m.contains(a))) {
              //这里a可能会被算成小数，不知道为什么，所以加了Math.floor
              //解决了拖拽地图后a.x为小数，导致Canvaspixel[a.x]读取不到
              var ax = Math.floor(a.x),
                ay = Math.floor(a.y)
              if (n > 0) {
                for (var j = -n; j < n; j++) {
                  for (var k = -n; k < n; k++) {
                    var dd = Math.sqrt(j * j + k * k)
                    if (
                      ax + j >= 0 &&
                      ay + k >= 0 &&
                      ax + j < xlen &&
                      ay + k < ylen &&
                      j * j + k * k <= nn
                    ) {
                      if (j == 0 && k == 0)
                        Canvaspixel[ax + j][ay + k] += sss[2] * f
                      else {
                        if (dd < (2 * n) / 3)
                          Canvaspixel[ax + j][ay + k] += (sss[2] / dd) * f
                        else
                          Canvaspixel[ax + j][ay + k] +=
                            (9 * sss[2] * (1 - dd / n)) / (2 * n)
                      }
                      //count++;
                    }
                  }
                }
              }
            }
          }
          this._heat.data(Canvaspixel).draw(this.options.minOpacity),
            (this._frame = null)
        },
        _animateZoom: function (t) {
          // alert("重新渲染中")
          var i = this._map.getZoomScale(t.zoom),
            a = this._map
              ._getCenterOffset(t.center)
              ._multiplyBy(-i)
              .subtract(this._map._getMapPanePos())
          leaflet.DomUtil.setTransform
            ? leaflet.DomUtil.setTransform(this._canvas, a, i)
            : (this._canvas.style[leaflet.DomUtil.TRANSFORM] =
                leaflet.DomUtil.getTranslateString(a) + ' scale(' + i + ')')
        }
      })
      this.heatLayer = new leaflet.HeatLayer(pointData, {
        maxZoom: 15,
        minOpacity: 0.1,
        radius: 40,
        max: 3.0,
        blur: 10
      })
      this.heatLayer.addTo(this.zdmap)
    },

    // endregion

    // region 加载Shp

    updateShpData(shpData) {
      this.clearShp()
      this.shpLayer = leaflet
        .geoJson(shpData, {
          maxZoom: 21
        })
        .addTo(this.zdmap)
    },

    //清除shp
    clearShp() {
      if (this.shpLayer) {
        this.zdmap.removeLayer(this.shpLayer)
      }
    },

    // endregion

    // region 自定义样式

    updateStyle(mapStyle) {
      if (this.tileLayer) {
        this.zdmap.removeLayer(this.tileLayer)
      }

      this.tileLayer = L.tileLayer(mapStyle.value, {
        maxZoom: 17
      }).addTo(this.zdmap)
    }

    // endregion
  }
}
</script>

<style>
#app {
  height: 100%;
  width: 100%;
  margin: 0;
  padding: 0;
  position: relative;
}

#map {
  z-index: 1;
  height: 100%;
  width: 100%;
}
</style>
