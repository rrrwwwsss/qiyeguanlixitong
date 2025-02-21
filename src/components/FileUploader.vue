<template>
  <div>
    <el-button type="primary" :disabled="isDisabledUpload" @click="outerVisible = true">加载本地文件</el-button>

    <el-dialog style="text-align: center" width="30%" title="点击上传文件" :visible.sync="outerVisible" append-to-body>

      <el-dialog width="60%" title="部分数据预览" :visible.sync="innerVisible" append-to-body>
        <el-table id="data-preview" :data="previewData">
          <el-table-column v-for="(header, index) in headers" :key="index" :prop="header" :label="header">
          </el-table-column>
        </el-table>

        <slot></slot>

      </el-dialog>

      <el-upload id="file-uploader" action="null" accept=".xlsx,.csv,.json" :limit="1" drag :before-upload="() => false"
        :on-change="handleChange" :show-file-list="false">
        <i class="el-icon-upload"></i>
        <div class="el-upload__text">
          <em>点击或将数据拖拽到此处</em>
          <br />
          支持 XLSX / CSV / GeoJSON 文件的解析
        </div>
      </el-upload>

      <div id="file-info" v-if="file">
        <h3>当前文件：</h3>
        <p>{{ file.name }} ({{ (file.size / 1024).toFixed(2) }}KB)</p>
      </div>


      <div slot="footer" class="dialog-footer">
        <el-button @click="outerVisible = false">取 消</el-button>
        <el-button :disabled="objData[0] ? false : true" type="primary" @click="innerVisible = true">预览文件</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
export default {
  props: {
    // 表格中所要展示的列
    message: {
      type: Array,
      required: false
    },
    dataExplain: {
      type: String,
      required: false
    },
    isDisabledUpload: {
      default: false,
      type: Boolean,
      required: false
    }
  },
  data() {
    return {
      //控制提示信息
      tip: [],
      //拖动上传文件数据
      // 上传文件的类型
      updateSelect: '',
      //上传的文件
      file: null,
      //上传文件解析后的列名数组
      updataFileHeader: [],
      //上传文件解析后的数组
      updataFileData: [],
      //上传文件解析后的数组转化为对象
      objData: [],

      //分页数据
      // 当前页
      currentPage: 1,
      // 每一页的数据
      pageSize: 10,
      // 总数据
      totalItems: 100000,
      // 控制弹出框
      outerVisible: false,
      innerVisible: false
    }
  }, // 上传文件表格可视化(利用计算属性+虚拟化表格)
  computed: {
    paginatedData() {
      const start = (this.currentPage - 1) * this.pageSize // 计算当前页的起始索引
      return this.objData.slice(start, start + this.pageSize) // 返回当前页的数据
    },

    previewData() {
      return this.objData.length >= 5 ? this.objData.slice(0, 5) : this.objData
    },

    // 提取表头
    headers() {
      // 如果updataFileData为空数组，则返回空数组
      return this.updataFileHeader || [] // 第一行作为表头
    }
  },
  methods: {
    //关闭弹出框
    closePopup() {
      this.innerVisible = false
      this.outerVisible = false
    },

    //上传文件发生改变时的回调函数
    useWorker(file) {
      const message = this.$message({
        message: '正在读取文件',
        duration: 0
      })

      this.objData = []
      if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || file.type === 'text/csv') {
        const worker = new Worker(
          new URL('../utils/csvExcelWorker.js', import.meta.url),
          { type: 'module' }
        )
        worker.postMessage({ file })
        worker.onmessage = (event) => {
          if (event.data.error) {
            console.error('Error:', event.data.error)
            return event.data.error
          } else {

            const headerRow = event.data[0]
            this.updataFileData = event.data

            // 返回除了表头行之外的数据，并将每一行数据转换为对象
            let datas = event.data.slice(1).map((row) => {
              // 将每一行数据转换为对象
              return row.reduce((obj, item, index) => {
                // 将表头行中的每一列名作为对象的键，将数据作为对象的值
                obj[headerRow[index]] = item
                return obj
              }, {})
            })
            // 动态属性名称的列表

            if (this.message) {
              const propertyNames = this.message
              this.objData = datas.map((item) => {
                // 将动态属性名称映射到 item 对象的属性值
                return Object.fromEntries(
                  propertyNames.map((name) => [name, item[name]])
                )
              })
            } else {
              this.objData = datas
            }

            this.updataFileHeader = Object.keys(this.objData[0])
            this.totalItems = this.objData.length
            if (this.objData) {
              message.close()
              this.$message({
                message: '文件读取成功',
                type: 'success'
              })
              this.$emit('data-sent', this.objData)
              this.innerVisible = true
            }
          }
        }
      } else if (file.type === 'application/json') {

        this.$message('数据加载中，请稍后')
        if (file) {
          const reader = new FileReader() // 创建 FileReader 读取文件
          reader.onload = (e) => {
            const geojson = JSON.parse(e.target.result) // 读取并解析 GeoJSON 文件

            // 创建 Web Worker
            const worker = new Worker(
              new URL('../utils/geojsonWorker.js', import.meta.url),
              { type: 'module' }
            )

            // 监听 Worker 消息
            worker.onmessage = (event) => {
              if (event.data.error) {
                console.error('Error:', event.data.error)
              } else {
                // 将解析后的数据存储到组件中
                this.updataFileData = event.data
                if (this.message) {
                  // 动态属性名称的列表
                  const propertyNames = this.message
                  this.objData = this.updataFileData.map((item) => {
                    // 将动态属性名称映射到 item 对象的属性值
                    return Object.fromEntries(
                      propertyNames.map((name) => [name, item[name]])
                    )
                  })
                } else {
                  this.objData = this.updataFileData
                }

                this.updataFileHeader = Object.keys(this.objData[0])
                this.totalItems = this.objData.length
                if (this.objData) {
                  this.$message('数据加载成功')
                  this.$emit('data-sent', this.objData) // 将数据发送给父组件
                  this.innerVisible = true
                }
              }
            }

            worker.postMessage(geojson) // 将 GeoJSON 数据发送到 Worker
          }

          reader.readAsText(file) // 读取文件内容为文本
        }
      }
    },
    handleChange(file) {
      this.selectedlat = ''
      this.selectedlng = ''
      this.file = file.raw
      this.useWorker(file.raw)
    },
    handlePageChange(newPage) {
      this.currentPage = newPage
    }
  }
}
</script>

<style lang="less">
h2 {
  color: blue;
}

@media (max-width: 1300px) {
  .el-upload-dragger {
    width: 100%;
  }
}

/* 响应式调整：屏幕较小时缩小容器大小 */
@media (max-width: 768px) {
  .el-upload-dragger {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .el-upload-dragger {
    width: 50%;
  }
}

.el-dialog__body {
  padding: 16px;
}

#file-uploader {
  .el-upload {
    width: 100%;

    .el-upload-dragger {
      margin: 0 auto;
    }
  }
}

#file-info {
  display: flex;
  flex-direction: column;
  align-items: start;

  h3 {
    margin: 12px 12px 0 12px;
  }

  p {
    margin: 0 12px;
  }

}

#data-preview {
  width: 100%;
  margin-bottom: 20px;
}
</style>
