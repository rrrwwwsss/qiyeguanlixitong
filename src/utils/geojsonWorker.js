onmessage = function (event) {
  const geojson = event.data // 接收主线程传来的 GeoJSON 数据

  try {
    // 假设 GeoJSON 是有效的，提取需要的数组
    const featuresArray = geojson.features.map((feature) => feature.properties) // 或根据需要选择其他属性
    postMessage(featuresArray) // 将提取的数组发送回主线程
  } catch (error) {
    postMessage({ error: error.message })
  }
}
