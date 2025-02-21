<template>
  <div class="app" @click="OptionCardClose">
    <div class="div-arrangement">
      <!--1、 输入关键字进行过滤-->
      <el-card id="tree">
        <div class="container">
          <el-input placeholder="输入关键字进行过滤" v-model="filterText">
          </el-input>
          <el-button type="primary" @click="exp">
            导出 <i class="el-icon-top"></i>
          </el-button>
        </div>

        <el-tree style="margin-top: 12px" class="filter-tree" :data="this.$store.state.data" :highlight-current="true" node-key="id"
          current-node-key="id" :expand-on-click-node="true" :props="defaultProps" accordion @node-click="handleNodeClick"
          @node-contextmenu="floderOption" :filter-node-method="filterNode" ref="tree">
        </el-tree>

        <div :style="{
            'z-index': 9999,
            position: 'fixed',
            left: optionCardX + 'px',
            top: optionCardY + 'px',
            width: '80px',
            background: 'white',
            'box-shadow':
              '0 2px 4px rgba(0, 0, 0, .12), 0 0 6px rgba(0, 0, 0, .04)'
          }" v-show="optionCardShow" id="option-button-group">
          <!--右键删除功能-->
          <el-button @click="handleNodeDelete" class="option-card-button">删除文件</el-button>
        </div>
      </el-card>

      <div id="right">
        <!--2、选取shp文件  action="http://60.205.12.90:9006/file/upload"
                  action="http://localhost:9090/file/upload"
      -->
        <div class="uploadFile">
          <el-upload class="upload-shp" ref="upload" action="http://60.205.12.90:9006/file/upload" :data="userMessage" :on-preview="handlePreview"
            :on-remove="handleRemove" :headers="header" :file-list="fileList" :auto-upload="false">

            <div slot="tip" class="text_tip">只能上传shp文件，且不超过30M</div>

            <el-button slot="trigger" size="small" type="primary">选取shp文件</el-button>
            <el-button style="margin-left: 10px" size="small" type="success" @click="submitUpload">提交文件</el-button>
          </el-upload>
        </div>

        <!--3 、上传点数据  轨迹先数据 OD线数据-->
        <div class="inputFileName">
          <p style="text-align:start; line-height:2; color: white;">
            支持格式为xlsx、csv、geojson，请手动选择对应字段。
          </p>
          <el-input id="tableName" placeholder="请输入数据表名" style="width: 120px; margin-right: 5px" v-model.trim="tableForm.name" @input="validateForm">
          </el-input>
          <el-select v-model="tableForm.father" style="width: 140px" placeholder="请选择数据类型" @change="selectDataType">
            <el-option v-for="item in this.tableTypeSelect" :key="item.value" :label="item.label" :value="item.value">
            </el-option>
          </el-select>

          <FileUploader id="update-file" ref="uploadFile" @data-sent="transfer" :isDisabledUpload="isButtonDisabled">
            <!-- 1.选择点数据的字段 -->
            <div v-if="selectType == '点数据'">
              <el-select v-model="selectedPointCol.cid" placeholder="请选择车辆ID字段" style="margin-right: 20px; width: 150px">
                <el-option v-for="(header, index) in updateFileDataheaders" :key="index" :label="header" :value="header"></el-option>
              </el-select>
              <el-select v-model="selectedPointCol.lng" placeholder="请选择经度字段" style="margin-right: 20px; width: 150px">
                <el-option v-for="(header, index) in updateFileDataheaders" :key="index" :label="header" :value="header"></el-option>
              </el-select>
              <el-select v-model="selectedPointCol.lat" placeholder="请选择纬度字段" style="margin-right: 20px; width: 150px">
                <el-option v-for="(header, index) in updateFileDataheaders" :key="index" :label="header" :value="header"></el-option>
              </el-select>
              <el-button :disabled="!selectedPointCol.lng || !selectedPointCol.lat" type="primary" @click="savePoisToDataBase">
                保存到数据库
              </el-button>
            </div>

            <!-- 2.选择轨迹数据 -->
            <div v-if="selectType == '轨迹线数据'">
              <el-select v-model="selectedTraceCol.time" placeholder="请选择时间字段" style="margin-right: 20px; width: 150px">
                <el-option v-for="(header, index) in updateFileDataheaders" :key="index" :label="header" :value="header"></el-option>
              </el-select>
              <el-select v-model="selectedTraceCol.status" placeholder="请选择载客状态字段" style="margin-right: 20px; width: 150px">
                <el-option v-for="(header, index) in updateFileDataheaders" :key="index" :label="header" :value="header"></el-option>
              </el-select>
              <el-select v-model="selectedTraceCol.lng" placeholder="请选择经度字段" style="margin-right: 20px; width: 150px">
                <el-option v-for="(header, index) in updateFileDataheaders" :key="index" :label="header" :value="header"></el-option>
              </el-select>
              <el-select v-model="selectedTraceCol.lat" placeholder="请选择纬度字段" style="margin-right: 20px; width: 150px">
                <el-option v-for="(header, index) in updateFileDataheaders" :key="index" :label="header" :value="header"></el-option>
              </el-select>

              <el-button :disabled="
                  !selectedTraceCol.time ||
                  !selectedTraceCol.status ||
                  !selectedTraceCol.lng ||
                  !selectedTraceCol.lat
                " type="primary" @click="saveTraceToDataBase">
                保存到数据库
              </el-button>
            </div>
            <!-- 3.选择od数据的字段 -->
            <div v-if="selectType == 'OD线数据'">
              <el-select v-model="selectedODCol.olng" placeholder="请选择起点经度" style="margin-right: 20px; width: 150px">
                <el-option v-for="(header, index) in updateFileDataheaders" :key="index" :label="header" :value="header"></el-option>
              </el-select>
              <el-select v-model="selectedODCol.olat" placeholder="请选择起点纬度" style="margin-right: 20px; width: 150px">
                <el-option v-for="(header, index) in updateFileDataheaders" :key="index" :label="header" :value="header"></el-option>
              </el-select>
              <el-select v-model="selectedODCol.dlng" placeholder="请选择终点经度" style="margin-right: 20px; width: 150px">
                <el-option v-for="(header, index) in updateFileDataheaders" :key="index" :label="header" :value="header"></el-option>
              </el-select>
              <el-select v-model="selectedODCol.dlat" placeholder="请选择终点纬度" style="margin-right: 20px; width: 150px">
                <el-option v-for="(header, index) in updateFileDataheaders" :key="index" :label="header" :value="header"></el-option>
              </el-select>
              <!--<el-select-->
              <!--  v-model="selectedODCol.nameDistrict"-->
              <!--  placeholder="请选择地区名"-->
              <!--  style="margin-right: 20px; width: 150px"-->
              <!--&gt;-->
              <!--  <el-option-->
              <!--    v-for="(header, index) in updateFileDataheaders"-->
              <!--    :key="index"-->
              <!--    :label="header"-->
              <!--    :value="header"-->
              <!--  ></el-option>-->
              <!--</el-select>-->

              <el-button :disabled="
                  !selectedODCol.olng ||
                  !selectedODCol.olat ||
                  !selectedODCol.dlng ||
                  !selectedODCol.dlat
                " type="primary" @click="saveODToDataBase">
                保存到数据库
              </el-button>
            </div>
          </FileUploader>

          <el-dialog title="提示" :visible.sync="uploadDialogVisible" width="30%">
            <p>
              {{
                uploadStatus == 0
                  ? '上传中,请稍后'
                  : uploadStatus == 1
                  ? '上传成功'
                  : '上传失败'
              }}
            </p>

            <span slot="footer" class="dialog-footer">
              <el-button :disabled="uploadStatus != 1" type="primary" @click="uploadSuccess">确 定</el-button>
            </span>
            
          </el-dialog>

        </div>

        <!--4 、 展示数据的表格-->
        <div class="div-2">
          <div id="table">
            <div v-if="parentData === '点数据'">
              <el-table :data="tableData1" style="width: 100%; margin-top: 35px" border stripe @selection-change="handleSelectionChange">
                <el-table-column type="selection" width="55"></el-table-column>
                <el-table-column prop="id" label="ID"></el-table-column>
                <el-table-column prop="cid" label="车辆ID"></el-table-column>
                <el-table-column prop="lng" label="纬度"></el-table-column>
                <el-table-column prop="lat" label="经度"></el-table-column>
              </el-table>
            </div>

            <div v-else-if="parentData === 'OD线数据'">
              <el-table :data="tableData1" style="width: 100%; margin-top: 10px" border stripe>
                <el-table-column type="selection" width="55"></el-table-column>
                <el-table-column prop="olng" label="起点经度"></el-table-column>
                <el-table-column prop="olat" label="起点纬度"></el-table-column>
                <el-table-column prop="dlng" label="终点经度"></el-table-column>
                <el-table-column prop="dlat" label="终点纬度"></el-table-column>
              </el-table>
            </div>

            <div v-else-if="parentData === '轨迹线数据'">
              <el-table :data="tableData1" border stripe style="margin-top: 10px">
                <el-table-column type="selection" width="55"></el-table-column>
                <el-table-column prop="time" label="时间戳"></el-table-column>
                <el-table-column prop="status" label="载客状态"></el-table-column>
                <el-table-column prop="lng" label="经度"></el-table-column>
                <el-table-column prop="lat" label="纬度"></el-table-column>
              </el-table>
            </div>

            <!--判断展示shp数据 右侧表-->
            <div v-else-if="parentData === 'shp数据'">
              <!--<h2>{{parentData}}</h2>-->
              <el-table :data="tableData1" border stripe style="margin-top: 10px">
                <el-table-column type="selection" width="55"></el-table-column>
                <el-table-column prop="id" label="id"></el-table-column>
                <el-table-column prop="name" label="名称"></el-table-column>
                <el-table-column prop="size" label="文件大小"></el-table-column>
              </el-table>
            </div>

            <!-- 被注释分页代码-->
            <div style="background-color: transparent; margin-top: 20px">
              <el-pagination @size-change="handleSizeChange" @current-change="handleCurrentChange" :current-page="pageNum"
                :page-sizes="[5, 10, 15, 20]" :page-size="pageSize" layout="total, sizes, prev, pager, next, jumper" :total="total">
              </el-pagination>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import * as XLSX from 'xlsx'
import FileUploader from '@/components/FileUploader.vue'
import { serverIp } from '../../../public/config'

export default {
  name: 'User',
  components: { FileUploader },
  watch: {
    filterText (val) {
      this.$refs.tree.filter(val)
    }
  },
  computed: {
    // 执行上传动作的后台接口
    myAction () {
      if (this.selectType === '点数据') {
        return this.baseURL + '/taxiData/import'
      } else if (this.selectType === '轨迹线数据') {
        return this.baseURL + '/traceData/import'
      } else if (this.selectType === 'OD线数据') {
        return this.baseURL + '/lineData/import'
      } else {
        return ''
      }
    }
  },
  data () {
    return {
      //新增属性
      updateFileData: [], //UpdateFile传递过来的包含所有列的数组
      updateFileDataheaders: [], //updateFileData所有属性名数组
      uploadStatus: 0, //上传状态，0为上传中，1是上传成功，2是失败
      uploadDialogVisible: false,
      //选择点数据的列名
      selectedPointCol: {
        cid: '',
        lng: '',
        lat: ''
      },
      //选择轨迹数据的列名
      selectedTraceCol: {
        time: '',
        status: '',
        lng: '',
        lat: ''
      },
      //选择od数据的列名
      selectedODCol: {
        olng: '',
        olat: '',
        dlng: '',
        dlat: '',
        nameDistrict: ''
      },

      //用户登录成功之后，存储在浏览器的用户信息，主要是取用户的id信息 el-upload--data
      userMessage: { userId: JSON.parse(localStorage.getItem('user')).id },
      // 左侧树形右键点击出现弹窗
      optionCardX: '',
      optionCardY: '',
      optionCardShow: false, //文件夹节点操作卡是否显示
      optionData: [], //右键选中的节点的data
      node: null, //当前右键选中的节点信息
      tree: null,

      daoruData: '',
      parentData: '点数据',

      selectType: '',

      currentNode: '',
      firstLevelNode: '',

      tableTypeSelect: [
        {
          value: '点数据',
          label: '点数据'
        },
        {
          value: '轨迹线数据',
          label: '轨迹线数据'
        },
        {
          value: 'OD线数据',
          label: 'OD线数据'
        }
      ],
      isShow: 'true',

      baseURL: `http://${serverIp}`, //阿里云
      tableForm: {
        name: '',
        father: ''
      },
      menuIds: {},
      tableName: '',
      tableType: '',
      tableData: [],
      tableData1: [], //这里是从后端获取的所有数据
      pagetableData: [], //分页后的当前页数据

      total: 0, //总数据条数
      pageNum: 1, //当前所在页默认是第一页
      pageSize: 10, //每页显示多少行数据 默认设置为10
      username: '',
      password: '',
      nickname: '',
      email: '',
      address: '',
      avatar: '',

      dialogFormVisible: false,
      multipleSelection: [],
      form: {},
      filterText: '',
      defaultProps: {
        children: 'children',
        label: 'label'
      },

      tableNameTem: '',
      //用于上传shp文件的存储变量名
      fileList: [],

      header: {
        token: window.sessionStorage.getItem('token')
      },
      // 用户自定义导入按钮，刚开始为禁用状态
      isButtonDisabled: true
    }
  },
  mounted () {

  },
  created () {
    //禁止用户缩放界面  导致变形
    window.addEventListener(
      'mousewheel',
      function (event) {
        if (event.ctrlKey === true || event.metaKey) {
          event.preventDefault()
        }
      },
      { passive: false }
    )

    this.$store.commit('updateAllDataMenu')
  },
  methods: {
    
    transfer (data) {
      this.updateFileData = data
      this.updateFileDataheaders = Object.keys(data[0])
    },

    savePoisToDataBase () {
      //如果有数据类型，有表名，才进入后台
      if (this.tableForm.name && this.tableForm.father) {
        if (this.updateFileData.length === 0) {
          return this.$message.error('数据不能为空')
        } else {
          for (let i = 0; i < this.uploadDataSize; i++) {
            let lng = this.updateFileData[i][this.selectedPointCol.lng]
            let lat = this.updateFileData[i][this.selectedPointCol.lat]
            let lnglatIsValid =
              !(lng < -180 || lng > 180) & !(lat > 90 || lat < -90)
            if (!lnglatIsValid) {
              return this.$message.error('数据不合法')
            }
          }
          let data = this.updateFileData.map((item) => {
            return {
              cid: item[this.selectedPointCol.cid],
              lng: item[this.selectedPointCol.lng],
              lat: item[this.selectedPointCol.lat]
            }
          })
          this.$refs.uploadFile.closePopup()
          this.uploadDialogVisible = true
          this.importXlsxFile(data, this.tableForm.name)
          this.importDataMenu()
        }
      } else {
        return this.$message.error('请输入表名和数据类型')
      }
    },

    saveTraceToDataBase () {
      //如果有数据类型，有表名，才进入后台
      if (this.tableForm.name && this.tableForm.father) {
        if (this.updateFileData.length === 0) {
          return this.$message.error('数据不能为空')
        } else {
          for (let i = 0; i < this.uploadDataSize; i++) {
            let time = Number(
              this.updateFileData[i][this.selectedTraceCol.time]
            )
            let status = this.updateFileData[i][this.selectedTraceCol.status]
            let lng = this.updateFileData[i][this.selectedTraceCol.lng]
            let lat = this.updateFileData[i][this.selectedTraceCol.lat]
            let traceIsValid =
              !isNaN(time) &&
              !(status < 0 || status > 4) &&
              !(lng < -180 || lng > 180) &&
              !(lat > 90 || lat < -90)
            if (!traceIsValid) {
              return this.$message.error('数据不合法')
            }
          }

          let data = this.updateFileData.map((item) => {
            return {
              time: item[this.selectedTraceCol.time],
              status: item[this.selectedTraceCol.status],
              lng: item[this.selectedTraceCol.lng],
              lat: item[this.selectedTraceCol.lat]
            }
          })
          this.$refs.uploadFile.closePopup()
          this.uploadDialogVisible = true
          this.importXlsxFile(data, this.tableForm.name)
          this.importDataMenu()
        }
      } else {
        return this.$message.error('请选择表名和数据类型')
      }
    },
    saveODToDataBase () {
      //如果有数据类型，有表名，才进入后台
      if (this.tableForm.name && this.tableForm.father) {
        if (this.updateFileData.length === 0) {
          return this.$message.error('数据不能为空')
        } else {
          for (let i = 0; i < this.uploadDataSize; i++) {
            let olng = this.updateFileData[i][this.selectedODCol.olng]
            let olat = this.updateFileData[i][this.selectedODCol.olat]
            let dlng = this.updateFileData[i][this.selectedODCol.dlng]
            let dlat = this.updateFileData[i][this.selectedODCol.dlat]
            let lnglatIsValid =
              !(olng < -180 || olng > 180) &&
              !(olat > 90 || olat < -90) &&
              !(dlng < -180 || dlng > 180) &&
              !(dlat > 90 || dlat < -90)
            if (!lnglatIsValid) {
              return this.$message.error('数据不合法')
            }
          }
          let data = this.updateFileData.map((item) => {
            return {
              olng: item[this.selectedODCol.olng],
              olat: item[this.selectedODCol.olat],
              dlng: item[this.selectedODCol.dlng],
              dlat: item[this.selectedODCol.dlat],
              name: item[this.selectedODCol.nameDistrict]
            }
          })
          this.$refs.uploadFile.closePopup()
          this.uploadDialogVisible = true
          this.importXlsxFile(data, this.tableForm.name)
          this.importDataMenu()
        }
      } else {
        return this.$message.error('请输入表名和数据类型')
      }
    },
    importXlsxFile (data, fileName) {
      // let data = dataQueue.peek()
      const worksheet = XLSX.utils.json_to_sheet(data)
      // 构造workbook
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'sheet1')

      var file_data = XLSX.write(workbook, {
        bookType: 'xlsx',
        type: 'array'
      })

      const file = new File([file_data], fileName + '.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })
      const formData = new FormData()
      formData.append('userId', this.userMessage.userId)
      formData.append('file', file)

      axios(this.myAction, {
        method: 'post',
        data: formData
      }).then((res) => {
        if (res.status === 200) {
          this.uploadStatus = 1
          this.$message.success('保存成功')
        } else {
          this.uploadStatus = 2
          this.$message.error('保存失败')
        }
      })
    },

    uploadSuccess () {
      this.uploadDialogVisible = false
      javascript: location.reload()
    },

    //加载数据
    load () {
      if (this.parentData === '点数据') {
        this.request
          .get('/taxiData/clickLabel', {
            params: {
              userId: JSON.parse(localStorage.getItem('user')).id,
              tableNameTem: this.tableNameTem,
              pageNum: this.pageNum,
              pageSize: this.pageSize
            }
          })
          .then((res) => {
            this.tableData1 = []
            this.tableData1 = res.data
            this.total = res.count
          })
      } else if (this.parentData === '轨迹线数据') {
        this.request
          .get('/traceData/clickLabel', {
            params: {
              userId: JSON.parse(localStorage.getItem('user')).id,
              tableNameTem: this.tableNameTem,
              pageNum: this.pageNum,
              pageSize: this.pageSize
            }
          })
          .then((res) => {
            this.tableData1 = []
            this.tableData1 = res.data
            this.total = res.count
          })
      } else if (this.parentData === 'OD线数据') {
        this.request
          .get('/lineData/clickLabel', {
            params: {
              userId: JSON.parse(localStorage.getItem('user')).id,
              tableNameTem: this.tableNameTem,
              pageNum: this.pageNum,
              pageSize: this.pageSize
            }
          })
          .then((res) => {
            this.tableData1 = []
            this.tableData1 = res.data
            this.total = res.count
          })
      } else if (this.parentData === 'shp数据') {
        this.request
          .get('/file/page', {
            params: {
              userId: JSON.parse(localStorage.getItem('user')).id,
              name: this.tableNameTem,
              pageNum: this.pageNum,
              pageSize: this.pageSize
            }
          })
          .then((res) => {
            this.tableData1 = []
            this.tableData1 = res.data.records
            this.total = res.data.total
          })
      }
    },

    handleSizeChange (pageSize) {
      this.pageSize = pageSize
      this.load()
    },

    handleCurrentChange (pageNum) {
      this.pageNum = pageNum
      this.load()
    },

    handleAdd () {
      this.dialogFormVisible = true
      this.form = {}
    },

    handleEdit (row) {
      this.form = row
      this.dialogFormVisible = true
    },

    handleSelectionChange (val) {
      this.multipleSelection = val
    },

    selectDataType (data) {
      this.selectType = data
      this.validateForm() // 更新表单验证状态
    },

    //上传文件之前，需要检查文件是否
    // beforeUpload(file) {
    //   if (file.size > 0) {
    //     return true
    //   } else {
    //     this.$message.error('上传文件为空')
    //     return false
    //   }
    // },

    validateForm () {
      this.isButtonDisabled = !this.tableForm.name || !this.tableForm.father
    },

    //导入按钮
    importDataMenu () {
      if (this.tableForm.name && this.tableForm.father) {
        //需要做一个判断，如有有数据，有表名，才进入后台   在datamenu表格中进行插入数据
        this.request
          .post('/dataMenu/add', this.tableForm, {
            params: {
              userId: JSON.parse(localStorage.getItem('user')).id
            }
          })
          .then((res) => {
            if (res.data) {
              this.dialogFormVisible = false
            } else {
            }
          })
      }
    },

    // 文件保存到数据库
    save () {
      this.request.post('/dataMenu', this.form).then((res) => {
        if (res.data) {
          this.$message.success('保存成功')
          this.dialogFormVisible = false
          this.load()
        } else {
          this.$message.error('保存失败')
        }
      })
    },

    //数据导出
    exp () {
      // 如果点击的是下拉菜单的一级节点，则导出一级节点下的所有数据
      // 如果点击的是下拉菜单的二级节点，则导出二级节点对应的数据
      if (this.currentNode === '1' && this.firstLevelNode === '点数据') {
        window.open(`http://${serverIp}/taxiData/export`)
      } else if (
        this.currentNode === '1' &&
        this.firstLevelNode === '轨迹线数据'
      ) {
        window.open(`http://${serverIp}/traceData/export`)
      } else if (
        this.currentNode === '1' &&
        this.firstLevelNode === 'OD线数据'
      ) {
        window.open(`http://${serverIp}/lineData/export`)
      } else if (this.currentNode === '2' && this.parentData === '点数据') {
        //当选择二级下拉菜单导出的时候，二级下拉菜单的nameTable没有值
        window.open(
          `http://${serverIp}/taxiData/exportNode?tableNameTem=` +
          this.tableNameTem
        )
      } else if (this.currentNode === '2' && this.parentData === '轨迹线数据') {
        //当选择二级下拉菜单导出的时候，二级下拉菜单的nameTable没有值
        window.open(
          `http://${serverIp}/traceData/exportNode?tableNameTem=` +
          this.tableNameTem
        )
      } else if (this.currentNode === '2' && this.parentData === 'OD线数据') {
        //当选择二级下拉菜单导出的时候，二级下拉菜单的nameTable没有值
        window.open(
          `http://${serverIp}/lineData/exportNode?tableNameTem=` +
          this.tableNameTem
        )
      }
    },

    //文件上传成功时的钩子
    handleExcelImportSuccess (response, file, fileList) {
      //具体执行操作的
      // this.importClick()
      this.$message.success('导入成功')
      //网页刷新
      // javascript: location.reload()
    },

    filterNode (value, data) {
      if (!value) return true
      return data.label.indexOf(value) !== -1
    },

    // 获取当前页的数据信息
    getPageInfo () {
      //清空pagetableData中的数据
      this.pagetableData = []
      // 获取当前页的数据
      for (let i = (this.pageNum - 1) * this.pageSize; i < this.total; i++) {
        //把遍历的数据添加到pageTicket里面
        this.pagetableData.push(this.tableData1[i])
        //判断是否达到一页的要求
        if (this.pagetableData.length === this.pagesize) break
      }
    },

    //处理左侧树形下拉框点击事件
    handleNodeClick (defaultKeys, node) {
      //判断当前点击的是哪一层节点；1、最外层父节点；2、第二次层子节点；3、末层节点内容；4、.....以此类推
      // 并根据点击的内容显示不同的数据
      // 部分变量赋值为空是为了处理来回点击节点数据传值错误而写的
      if (node.level == 1) {
        this.currentNode = String(node.level)
        this.firstLevelNode = node.label
        // this.companyName = name
        // this.gradeName = ''
      } else if (node.level == 2) {
        this.currentNode = String(node.level)
        // this.gradeName = name
        //当前节点的父节点
        this.parentData = node.parent.data.label
        //当前节点
        this.tableNameTem = node.label

        if (this.parentData === '点数据') {
          // /taxiData/page  接口里分页的代码调整
          this.request
            .get('/taxiData/clickLabel', {
              params: {
                // tableNameTem: this.tableNameTem,
                userId: JSON.parse(localStorage.getItem('user')).id,
                tableNameTem: this.tableNameTem,
                pageNum: this.pageNum,
                pageSize: this.pageSize
              }
            })
            .then((res) => {
              this.tableData1 = res.data
              //获取返回记录的总行数
              this.total = res.count
              this.getPageInfo() //在这里调用获取当前页的数据信息方法
            })
        } else if (this.parentData === '轨迹线数据') {
          this.request
            .get('/traceData/clickLabel', {
              params: {
                userId: JSON.parse(localStorage.getItem('user')).id,
                tableNameTem: this.tableNameTem,
                pageNum: this.pageNum,
                pageSize: this.pageSize
              }
            })
            .then((res) => {
              this.tableData1 = []
              this.tableData1 = res.data
              this.total = res.count
            })
        } else if (this.parentData === 'OD线数据') {
          this.request
            .get('/lineData/clickLabel', {
              params: {
                userId: JSON.parse(localStorage.getItem('user')).id,
                tableNameTem: this.tableNameTem,
                pageNum: this.pageNum,
                pageSize: this.pageSize
              }
            })
            .then((res) => {
              //console.log(res, '后台返回的OD线数据')
              this.tableData1 = []
              this.tableData1 = res.data
              this.total = res.count
            })
        } else if (this.parentData === 'shp数据') {

          this.request
            .get('/file/page', {
              params: {
                userId: JSON.parse(localStorage.getItem('user')).id,
                name: this.tableNameTem,
                pageNum: this.pageNum,
                pageSize: this.pageSize
              }
            })
            .then((res) => {
              this.tableData1 = res.data
              //获取返回记录的总行数
              this.total = res.count
              this.getPageInfo()
            })
        }
      }
    },

    //右键删除数据
    handleNodeDelete () {
      //判断当前点击的是哪一层节点；1、最外层父节点；2、第二次层子节点；3、末层节点内容；4、.....以此类推
      // 并根据点击的内容显示不同的数据
      // 部分变量赋值为空是为了处理来回点击节点数据传值错误而写的
      if (this.parentData === '点数据') {
        this.request
          .delete('/taxiData/clickDelete', {
            params: {
              // tableNameTem: this.tableNameTem,
              userId: JSON.parse(localStorage.getItem('user')).id,
              tableNameTem: this.tableNameTem
            }
          })
          .then((res) => {
            //页面刷新
            javascript: location.reload()
          })
      } else if (this.parentData === '轨迹线数据') {
        this.request
          .delete('/traceData/clickDelete', {
            params: {
              userId: JSON.parse(localStorage.getItem('user')).id,
              tableNameTem: this.tableNameTem
            }
          })
          .then((res) => {
            //页面刷新
            javascript: location.reload()
          })
      } else if (this.parentData === 'OD线数据') {
        this.request
          .delete('/lineData/clickDelete', {
            params: {
              userId: JSON.parse(localStorage.getItem('user')).id,
              tableNameTem: this.tableNameTem
            }
          })
          .then((res) => {
            //页面刷新
            javascript: location.reload()
          })
      } else if (this.parentData === 'shp数据') {
        this.request
          .delete('/file/clickDelete', {
            params: {
              userId: JSON.parse(localStorage.getItem('user')).id,
              name: this.tableNameTem
            }
          })
          .then((res) => {
            //页面刷新
            javascript: location.reload()
          })
      }
    },

    //处理左侧树形下拉框右侧点击事件
    floderOption (e, data, n, t) {
      this.optionCardShow = false
      this.optionCardX = e.x + 20 // 让右键菜单出现在鼠标右键的位置
      this.optionCardY = e.y
      this.optionData = data
      this.node = n // 将当前节点保存
      this.tree = t
      this.optionCardShow = true // 展示右键菜单
    },

    // 点击除树状菜单以外其他区域，菜单隐藏
    OptionCardClose (event) {
      var currentCli = document.getElementById('option-button-group')
      if (currentCli) {
        if (!currentCli.contains(event.target)) {
          //点击到了id为option-button-group以外的区域，就隐藏菜单
          this.optionCardShow = false
        }
      }
    },

    // 刷新界面
    refresh () {
      this.$forceUpdate()
    },

    //用于shp文件上传的代码
    submitUpload () {
      this.$refs.upload.submit()
      this.$forceUpdate()
      javascript: location.reload()
    },

    //on-remove 文件列表移除文件时的钩子
    handleRemove (file, fileList) { },

    //on-preview 点击文件列表中已上传的文件时的钩子
    handlePreview (file) { }
  }
}
</script>

<style lang="less" scoped>
// .app {
//   // display: flex;
//   //元素按照列排
//   // flex-direction: column;
// }
.container {
  display: flex;
  align-items: center;
}
.container > * {
  margin-right: 10px;
}
.container > *:last-child {
  margin-right: 0;
}
.div-arrangement {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  min-width: 900px;
  min-height: 185px;
  #tree {
    flex-grow: 1;
    height: 100%;
    width: 13%;
    background-color: transparent;
    border-color: transparent;
    //background-color: #666666;
    /*设置最小尺寸*/
    min-width: 265px;
    min-height: 183.96px;
  }
  #right {
    flex-grow: 6;
    display: flex;
    flex-wrap: wrap;
    justify-content: space-evenly;
    .uploadFile {
      // display: flex;
      margin-top: 20px;
      margin-right: 10px;
      margin-bottom: 50px;
      background-color: transparent;
    }

    .uploadFile .text_tip {
      margin-top: 10px;
      font-size: 12px;
      color: white;
      top: 2px;
    }

    //用户输入用户名以及需要上传的数据类型
    .inputFileName {
      margin-top: 20px;
      background-color: transparent;
      #update-file {
        display: inline;
        margin-left: 10px;
      }
    }

    .div-2 {
      display: flex;
      justify-content: flex-start;
      margin-right: auto;
    }

    //数据表
    #table {
      margin-top: 60px;
      width: 70vw;
      //background-color: #FFFFFF;
    }
  }
}

::v-deep .el-table__body-wrapper::-webkit-scrollbar {
  width: 8px; // 横向滚动条
  height: 8px; // 纵向滚动条 必写
}

::v-deep .el-table__body-wrapper::-webkit-scrollbar-thumb {
  background-color: #dde;
  border-radius: 3px;
}

/*最外层透明*/
::v-deep .el-table,
::v-deep .el-table__expanded-cell {
  background: rgba(9, 43, 67, 0.1) !important;
}

/* 表格内背景颜色 */
::v-deep .el-table th {
  background: rgba(9, 43, 67, 0.8) !important;
  color: #fff;
  font-size: 16px;
}

::v-deep .el-table tr,
::v-deep .el-table td {
  background: rgba(9, 43, 67, 0.1) !important;
  color: #fff;
  font-size: 14px;
}

// 左侧el-tree右键菜单按钮
.option-card-button {
  width: 100%;
  margin-left: 0;
  font-size: 10px;
  border-radius: 0;
}
</style>
