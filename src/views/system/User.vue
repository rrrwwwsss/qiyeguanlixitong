<template>
  <div style="padding-left: 15px">
    <!--搜索用户（通过用户名、邮箱、地址） -->
    <div style="padding-top: 15px ">
      <el-input style="width: 200px" placeholder="请输入名称" suffix-icon="el-icon-search" v-model="username"></el-input>
      <el-input style="width: 200px; margin-left: 5px" placeholder="请输入邮箱" suffix-icon="el-icon-message"
                v-model="email"></el-input>
      <el-input style="width: 200px; margin-left: 5px" placeholder="请输入地址" suffix-icon="el-icon-position"
                v-model="address"></el-input>
      <el-button style="margin-left: 10px;" type="primary" @click="load">搜索</el-button>
      <el-button type="warning" @click="reset">重置</el-button>
    </div>
    <div style="padding: 10px 0;">
      <el-button type="primary" @click="handleAdd">新增 <i class="el-icon-circle-plus-outline"></i></el-button>
      <el-popconfirm
          style="margin-left: 10px"
          confirm-button-text='确定'
          cancel-button-text='我再想想'
          icon="el-icon-info"
          icon-color="red"
          title="您确定批量删除这些数据吗？"
          @confirm="delBatch"
      >
        <el-button type="danger" slot="reference">批量删除 <i class="el-icon-remove-outline"></i></el-button>
      </el-popconfirm>
      <el-upload :action="`http://${serverIp}/user/import`" :show-file-list="false" accept="xlsx"
                 :on-success="handleExcelImportSuccess" style="display: inline-block">
        <el-button type="primary" style="margin-left: 10px;">导入 <i class="el-icon-bottom"></i></el-button>
      </el-upload>
      <el-button type="primary" @click="exp" style="margin-left: 10px;">导出 <i class="el-icon-top"></i></el-button>
    </div>

    <div class="tableAll">
      <el-table :data="tableData" border stripe style="margin-top: 10px;width: 100%"
                @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55"></el-table-column>
        <el-table-column prop="id" label="ID" width="80"></el-table-column>
        <el-table-column prop="username" label="用户名" width="140"></el-table-column>
        <el-table-column prop="nickname" label="昵称" width="120"></el-table-column>
        <el-table-column prop="email" label="邮箱"></el-table-column>
        <el-table-column prop="phone" label="电话"></el-table-column>
        <el-table-column prop="address" label="地址"></el-table-column>
        <el-table-column label="操作" width="200" align="center">
          <template #default={row}>
            <el-button type="info" @click="handleEdit(row)"><i class="el-icon-edit"></i></el-button>
            <el-popconfirm
                style="margin-left: 5px"
                confirm-button-text='确定'
                cancel-button-text='我再想想'
                icon="el-icon-info"
                icon-color="red"
                title="您确定删除吗？"
                @confirm="del(row.id)"
            >
              <el-button type="danger" slot="reference"><i class="el-icon-delete"></i></el-button>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div class="page-wrapper">
      <el-pagination class="white-list-tool"
                     background
                     @size-change="handleSizeChange"
                     @current-change="handleCurrentChange"
                     :current-page="pageNum"
                     :page-sizes="[5, 10, 15, 20]"
                     :page-size="pageSize"
                     layout="total, sizes, prev, pager, next, jumper"
                     :total="total">
      </el-pagination>
    </div>

    <el-dialog title="用户信息" :visible.sync="dialogFormVisible" width="30%">
      <el-form label-width="80px" size="small" style="padding: 0 25px 0 0;">
        <el-form-item label="用户名">
          <el-input v-model="form.username" autocomplete="off"></el-input>
        </el-form-item>
        <el-form-item label="昵称">
          <el-input v-model="form.nickname" autocomplete="off"></el-input>
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="form.email" autocomplete="off"></el-input>
        </el-form-item>
        <el-form-item label="电话">
          <el-input v-model="form.phone" autocomplete="off"></el-input>
        </el-form-item>
        <el-form-item label="地址">
          <el-input v-model="form.address" autocomplete="off"></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogFormVisible = false">取 消</el-button>
        <el-button type="primary" @click="save">确 定</el-button>
      </div>
    </el-dialog>

  </div>
</template>

<script>
import {serverIp} from "../../../public/config";

export default {
  name: "User",
  data() {
    return {
      serverIp: serverIp,
      tableData: [],
      total: 0,
      pageNum: 1,
      pageSize: 10,
      username: "",
      password: "",
      nickname: "",
      email: "",
      address: "",
      avatar: "",
      dialogFormVisible: false,
      multipleSelection: [],
      form: {},
      roles: [],
    }
  },
  created() {
    //禁止用户缩放界面  导致变形
    window.addEventListener("mousewheel", function (event) {
      if (event.ctrlKey === true || event.metaKey) {
        event.preventDefault();
      }
    }, {passive: false})

    this.load()
  },
  methods: {
    load() {
      this.request.get("/user/page",
          {
            params: {
              pageNum: this.pageNum,
              pageSize: this.pageSize,
              username: this.username,
              email: this.email,
              address: this.address,
            }
          }).then(res => {
        this.tableData = res.data.records
        this.total = res.data.total
      })
      this.request.get("/role").then(res => {
        this.roles = res.data
      })
    },
    save() {
      this.request.post("/user", this.form).then(res => {
        if (res.code === '200') {
          this.$message.success("保存成功")
          this.dialogFormVisible = false
          this.load()
        } else {
          this.$message.error("保存失败")
        }
      })
    },
    reset() {
      this.username = ""
      this.email = ""
      this.address = ""
      this.load()
    },
    handleAdd() {
      this.dialogFormVisible = true
      this.form = {}
    },
    handleEdit(row) {
      this.form = row
      this.dialogFormVisible = true
    },
    del(id) {
      this.request.delete("/user/" + id).then(res => {
        if (res.data) {
          this.$message.success("删除成功")
          this.load()
        } else {
          this.$message.error("删除失败")
        }
      })
    },
    handleSelectionChange(val) {
      this.multipleSelection = val
    },
    delBatch() {
      let ids = this.multipleSelection.map(v => v.id)
      this.request.post("/user/del/batch", ids).then(res => {
        if (res.data) {
          this.$message.success("批量删除成功")
          this.load()
        } else {
          this.$message.error("批量删除失败")
        }
      })
    },
    handleSizeChange(pageSize) {
      this.pageSize = pageSize
      this.load()
    },
    handleCurrentChange(pageNum) {
      this.pageNum = pageNum
      this.load()
    },
    exp() {
      window.open(`http://${serverIp}/user/export`)
    },
    handleExcelImportSuccess() {
      this.$message.success("导入成功")
      this.load()
    }
  }
}
</script>

<style type="less" scoped>
.tableAll {
  width: 95%;
  /*margin: auto;*/
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
</style>

<style>
.page-wrapper {
  padding: 20px 0px;
}

.white-list-tool.is-background .el-pager li:not(.disabled).active {
  background-color: #fff;
  color: #409EFF;
}

.white-list-tool.is-background .el-pager li.active {
  color: #409EFF;
  cursor: default;
}

.white-list-tool.is-background .el-pager li:hover {
  color: #409EFF;
}

.white-list-tool.is-background .el-pager li:not(.disabled):hover {
  color: #409EFF;
}

.white-list-tool.is-background .el-pager li:not(.disabled).active:hover {
  background-color: #fff;
  color: #409EFF;
}

.white-list-tool.is-background .btn-next .el-icon-arrow-right {
  margin: 0 auto;
}

.white-list-tool.is-background .btn-prev .el-icon-arrow-left {
  margin: 0 auto;
}

</style>
