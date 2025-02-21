//1.处理向量场的数据
//data数据形式{cid，lng，lat}
function handleSvectorData(data) {
  let o = [data[0]] //o表示一辆出租车的起始点
  let d = [] //d表示一辆出租车的终点
  //如果i-1的Cid和i的Cid不相同，则将i-1给与d，i给与o
  for (let i = 1; i < data.length; i++) {
    if (data[i].cid != data[i - 1].cid) {
      o.push(data[i])
      d.push(data[i - 1])
    }
  }
  d.push(data[data.length - 1])
  let geoData = []
  for (let i = 0; i < o.length; i++) {
    let dx = (d[i].lng - o[i].lng) * 1000
    let dy = (d[i].lat - o[i].lat) * 1000
    let lng = Number(o[i].lng) + 0.0125
    let lat = Number(o[i].lat) + 0.007
    geoData.push({ dx, dy, lng, lat })
  }

  var maxMag = 0
  var minMag = Infinity
  let finalData = []
  let latExtent = [115.9, 116.8]
  let lngExtent = [39.5, 40.6]
  let cellCount = [100, 100]
  let cellSizeCoord = [
    (lngExtent[1] - lngExtent[0]) / cellCount[0],
    (latExtent[1] - latExtent[0]) / cellCount[1]
  ]
  for (let i = 0; i < cellCount[0]; i++) {
    let lat1 = lngExtent[0] + cellSizeCoord[0] * (i - 1)
    let lat2 = lngExtent[0] + cellSizeCoord[0] * (i + 2)
    for (let j = 0; j < cellCount[1]; j++) {
      let dx = 0
      let dy = 0
      let lng1 = latExtent[0] + cellSizeCoord[1] * (j - 1)
      let lng2 = latExtent[0] + cellSizeCoord[1] * (j + 2)
      for (let k = 0; k < geoData.length; k++) {
        if (geoData[k].lat > lat1 && geoData[k].lat < lat2) {
          if (geoData[k].lng > lng1 && geoData[k].lng < lng2) {
            dx = dx + geoData[k].dx
            dy = dy + geoData[k].dy
          }
        }
      }

      let mag = Math.sqrt(dx * dx + dy * dy)
      // console.log(dx, dy, mag)
      let lngCell = lng1 + cellSizeCoord[1] / 2
      let latCell = lat1 + cellSizeCoord[0] / 2
      finalData.push([lngCell, latCell, dx, dy, mag])
      maxMag = Math.max(mag, maxMag)
      minMag = Math.min(mag, minMag)
    }
  }
  return { maxMag, minMag, finalData }
}
//2.处理网格图的数据
//形参data的数据形式{lng,lat}
function handleGridData(data) {
  let finalData = []
  let latExtent = [115.9, 116.8]
  let lngExtent = [39.5, 40.6]
  let cellCount = [100, 100]
  let cellSizeCoord = [
    (lngExtent[1] - lngExtent[0]) / cellCount[0],
    (latExtent[1] - latExtent[0]) / cellCount[1]
  ]
  let length = data.length
  for (let i = 0; i < cellCount[0]; i++) {
    let lat1 = lngExtent[0] + cellSizeCoord[0] * i
    let lat2 = lngExtent[0] + cellSizeCoord[0] * (i + 1)
    for (let j = 0; j < cellCount[1]; j++) {
      let count = 0
      let lng1 = latExtent[0] + cellSizeCoord[1] * j
      let lng2 = latExtent[0] + cellSizeCoord[1] * (j + 1)
      for (let k = 0; k < length; k++) {
        if (data[k].lat > lat1 && data[k].lat < lat2) {
          if (data[k].lng > lng1 && data[k].lng < lng2) {
            count++
          }
        }
      }
      finalData.push([i, j, count])
    }
  }
  return finalData
}

onmessage = function (event) {
  var data = event.data
  //计算
  var result
  switch (data.type) {
    case 'grid':
      result = handleGridData(data.data)
      break
    case 'svector':
      result = handleSvectorData(data.data)
      break
  }
  //  = handleSvectorData(data)
  postMessage(result)
}
