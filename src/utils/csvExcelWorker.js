import { parse } from 'papaparse'
import * as XLSX from 'xlsx'
onmessage = function (event) {
  const { file } = event.data

  switch (file.type) {
    case 'text/csv':
      let parsedData = [] // 存储解析后的数据
      let offset = 0 // 偏移量

      const readerCSV = file.stream().getReader() // 使用流式读取文件
      const decoder = new TextDecoder('utf-8') // 创建一个文本解码器

      const readNextChunk = async () => {
        const { done, value } = await readerCSV.read() // 读取下一块数据

        if (done) {
          // 如果完成，发送所有解析的数据
          postMessage(parsedData)
          return
        }

        // 将读取到的二进制数据解码为字符串
        const text = decoder.decode(value, { stream: true })

        // 解析 CSV 数据
        parse(text, {
          header: false,
          complete: (results) => {
            parsedData = parsedData.concat(results.data) // 将解析的数据添加到总数据中
            offset += results.data.length

            // 继续读取下一块
            readNextChunk()
          },
          error: (error) => {
            postMessage({ error: error.message })
          },
        })
      }

      readNextChunk() // 开始读取数据
      break
    case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
      
      const fileReader = new FileReader()
      fileReader.readAsArrayBuffer(file)

      fileReader.onload = (ev) => {
        const data = ev.target.result
        const workbook = XLSX.read(data, {
          type: 'array',
        })

        const worksheet = workbook.Sheets[workbook.SheetNames[0]]
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
        })
        postMessage(jsonData)
      }
      break
  }
}
