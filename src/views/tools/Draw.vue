<template>
  <div class="draw">
    <div class="draw-list-tips">
      <el-button class="tips-button" @click="switchDrawer">展开</el-button>
    </div>
    <div class="draw-container">
      <div class="draw-list-container">
        <el-drawer
            :before-close="checkIfShowDrawer"
            :visible.sync="show_draw_list"
            direction="ltr"
            :size=560
        >
          <div slot="title">
            <div>画布列表</div>
            <div style="margin-bottom: 10px;width: 100%">
              <el-button type="success" @click="show_new_draw_modal">新建画布</el-button>
              <el-button type="info" @click="reload_draw_list">刷新</el-button>
            </div>
          </div>
          <div class="drawer-list-content" ref="drawerList" v-infinite-scroll="handleScroll">
            <div v-for="i in draw_list" class="drawer-list-item">
              <div class="drawer-list-title">
                <div>
                  {{ i.name }}
                </div>
                <div v-if="check_current(i.asset_id)">
                  [已选中]
                </div>
                <div>
                  <el-popconfirm
                      title="确认删除画布吗？"
                      @confirm="delete_asset(i.asset_id)"
                  >
                    <span slot="reference" class="delete-button el-icon-delete"></span>
                  </el-popconfirm>
                </div>
              </div>
              <div class="drawer-list-image" @click="go_to_draw(i.asset_id)">
                <el-image
                    style="width: 220px; height: 100%"
                    :src="i.cover_image?.data?.display_url"
                    fit="cover"
                >
                  <div slot="error">
                    <i class="el-icon-picture-outline image-error-slot"></i>
                  </div>
                </el-image>
              </div>
            </div>
          </div>
          <div style="text-align: center;background-color: #efefef;padding: 5px"
               v-if="page === this.asset_list_meta?.pagination?.total_pages">到底啦 ~.~
          </div>
          <div style="display: flex;justify-content: center;align-items: center;height: 57px">
            <div style="text-align: center;padding: 5px"
                 class="spinner"
                 v-if="page !== this.asset_list_meta?.pagination?.total_pages">
            </div>
          </div>
        </el-drawer>
      </div>
      <div id="drawer" class="drawer" :class="{'drawer-disabled': drawing}">
        <canvas id="drawCanvas"></canvas>
      </div>
      <div class="draw-setting-container">
        <el-drawer :visible.sync="show_draw_setting" direction="rtl">
          <div class="draw-setting-content">
            <div>
              <div>
                <span>画笔颜色</span>
              </div>
              <div>
                <!--                颜色选择区域-->
                <input type="color" v-model="printerColor" value="#ce1e1e">
                <!--                拾色器-->

                <div class="color-selector-demo-container">
                  <div v-for="color in  demo_colors" class="color-selector-demo" :style="{background: color.color}"
                       :title="color.title" @click="printerColor = color.color">
                  </div>
                </div>
              </div>
              <div style="border-bottom: dashed 1px #d8d2d2;margin-bottom: 30px">

              </div>
            </div>
            <div>
              <div>
                <span>
                  画笔粗细
                </span>
              </div>
              <el-slider v-model="lineWidth" show-input :max=20 :min=0.5 :step=0.01></el-slider>
            </div>
            <div>
              <el-button @click="reset">清空</el-button>
              <el-button @click="export_image">导出</el-button>
              <el-button @click="upload_image">上传</el-button>
              <el-button @click="save">保存</el-button>
            </div>
          </div>
        </el-drawer>
      </div>
    </div>
    <div class="draw-setting-tips">
      <el-button class="tips-button" @click="switchDrawerSetting">展开</el-button>
    </div>
    <modal :show="show_new_modal" @close="show_new_modal = false" :show-footer="true" @cancel="show_new_modal = false" @confirm="create_new_draw">
      <div slot="header">创建新画布ฅ˙-˙ฅ</div>
      <div>
        <el-input v-model="new_asset_name" placeholder="请输入画布名称">名称</el-input>
      </div>
    </modal>
  </div>
</template>
<script>

import {Client} from "@stomp/stompjs";
import SockJS from "sockjs-client";
import Modal from "../../../dashboard/components/Modal.vue";
import {dataURLToBlob, updateURLParameter} from "../../../vendor/tools";
import debounce from 'lodash/debounce'; // 防抖函数
import Swal from "sweetalert2";
import moment from "moment";

export default {
  components: {Modal},
  data() {
    return {
      asset_list_meta: null,
      asset_name: null,
      new_asset_name: null,
      show_new_modal: false,
      asset_id: null,
      default_dir_asset_id: null,
      demo_colors: [
        {
          color: "#FFFFFF",
          title: "白"
        },
        {
          color: "#000000",
          title: "黑"
        },
        {
          color: "#FF0000",
          title: "红"
        },
        {
          color: "#00FF00",
          title: "绿"
        },
        {
          color: "#0000FF",
          title: "蓝"
        },
        {
          color: "#FFFF00",
          title: "黄"
        },
        {
          color: "#00FFFF",
          title: "青"
        },
        {
          color: "#FF00FF",
          title: "紫"
        },
        {
          color: "#FFA500",
          title: "橙"
        },
        {
          color: "#A52A2A",
          title: "棕"
        },
        {
          color: "#808080",
          title: "灰"
        },
        {
          color: "#FFC0CB",
          title: "粉"
        },
        {
          color: "#ADD8E6",
          title: "天蓝色"
        },
      ],
      show_draw_list: false,
      show_draw_setting: false,
      canvasTx: null,
      canvas: null,
      drawing: false,
      lineWidth: 3,
      printerColor: "#ce1e1e",
      currentLine: [],  // 当前线段的坐标
      lines: [],         // 所有线段的坐标集合
      stompClient: null,
      page: 1,
      per_page: 10,
      draw_list: [],
      loading_draw_list: false,
      tool_access_token: null,
    };
  },
  methods: {
    delete_asset(asset_id) {
      this.$http.delete('/draws/' + asset_id).then((response) => {
        console.log(response)
        this.draw_list = this.draw_list.filter(item => item.asset_id !== asset_id)
        toastr.warning("已删除")
      })
    },
    check_current(asset_id) {
      return asset_id === this.asset_id ?? false
    },
    reload_draw_list() {
      this.draw_list = []
      this.page = 1
      this.get_draw_list()
    },
    handleScroll: debounce(function () {
      if (this?.asset_list_meta?.pagination?.links?.next) {
        this.page++;
        this.get_draw_list();
      }
    }, 500),
    create_new_draw() {
      if (!this.new_asset_name) {
        toastr.error("名称不能为空", '', {
          positionClass: 'toast-top-center'
        })
        return
      }
      this.$http.post('/draws', {
        name: this.new_asset_name,
      }).then((response) => {
        this.asset_id = response.data.data.asset_id
        this.show_new_modal = false;
        this.show_draw_list = true;
        this.new_asset_name = null
        window.location.href = '/tools/draw?asset_id=' + this.asset_id;
      })
    },
    show_new_draw_modal() {
      this.show_draw_list = false;
      this.show_new_modal = true;
    },
    /**
     * 保存
     */
    save() {
      this.$http.post(process.env.DRAW_WS_HOST + '/draw/paint/save', {
        draw_id: this.asset_id,
      }).then((response) => {
        toastr.success("保存成功")
      })
    },
    /**
     * 跳转到指定的画布
     */
    go_to_draw(asset_id) {
      if (this.asset_id === asset_id) {
        return
      }
      this.show_draw_list = false;
      this.show_draw_setting = false;
      this.asset_id = asset_id;
      // 加载当前数据
      this.$http.get('/draws/' + this.asset_id).then((response) => {
        this.asset_name = response.data.data.name;
      })
      this.load()
      updateURLParameter('asset_id', asset_id)
    },
    /**
     * 获取默认文件夹
     */
    get_default_dir() {
      this.$http.get('/assets/info/default').then((response) => {
        this.default_dir_asset_id = response.data.data.asset_id
      })
    },
    /**
     * 上传文件，获取上传的key
     */
    upload_image() {
      // 获取默认文件夹
      if (this.default_dir_asset_id === null) {
        this.get_default_dir()
      }
      // 获取预创建文件信息
      this.$http.get('/assets/upload', {
        params: {
          file_name: this.asset_id + '.png',
        }
      }).then((response) => {
        // canvas 截图
        const fileObject = response.data.url.object
        const fileUrl = response.data.url.url
        const dataURL = this.canvas.toDataURL("image/png");
        const blob = dataURLToBlob(dataURL);
        const file = new File([blob], this.asset_id + '.png', {type: blob.type});
        let xhr = new XMLHttpRequest()
        xhr.open('PUT', fileUrl, false)
        xhr.onload = function () {
          if (xhr.status >= 200 && xhr.status < 300) {
            toastr.success('封面图已上传')
          } else {
            toastr.error('上传失败')
          }
        }
        xhr.onerror = function () {
          toastr.error('上传失败')
        }
        xhr.setRequestHeader('Content-Type', '')
        xhr.send(file)
        // 文件数据入库
        const asset_create_url = 'assets'
        this.$http.post(asset_create_url, {
          type: this.getFileType(file),
          name: this.asset_name + "_" + this.asset_id + '.png',
          url: fileObject,
          dir_id: this.default_dir_asset_id,
          use_vector: false,
        }).then((response) => {
          // 更新封面
          this.$http.patch('/draws/' + this.asset_id, {
            cover_image_asset_id: response.data.data.asset_id
          }).then((response) => {
            this.draw_list.forEach(item => {
              if (item.asset_id === this.asset_id) {
                item.cover_image_asset_id = response.data.data.asset_id
              }
            })
          })
        }).catch(({response}) => {
          toastr.error(response.status + ' : ' + response.statusText)
        })
      })
    },
    getFileType(file) {
      // 获取文件类型
      const type = file.type;

      if (type.startsWith('image/')) {
        return 1;
      } else if (type.startsWith('audio/')) {
        return 3;
      } else if (type.startsWith('video/')) {
        return 2;
      } else {
        return 5;
      }
    },
    /**
     * 获取绘画列表
     */
    get_draw_list() {
      if (this.loading_draw_list) return;
      this.loading_draw_list = true;
      this.$http.get('/draws', {
        params: {
          page: this.page,
          per_page: this.per_page,
          include: 'cover_image,user',
        }
      }).then((response) => {
        if (response?.data?.data?.length > 0) {
          response.data.data.forEach(item => {
            this.draw_list.push(item)
          })
        } else {
          this.show_draw_list = false
          this.show_new_modal = true
        }
        this.asset_list_meta = response.data.meta ?? {}
        this.loading_draw_list = false;
      }).catch((response) => {
        console.log(response)
        if (response.status === 401) {
          this.show_draw_list = false
          Swal.fire({
            title: '未登录',
            text: '点击确认跳转到登录页面...',
            icon: 'warning',
            confirmButtonText: '确定',
          }).then((result) => {
            window.location.href = '/login'
          })
        }
      })
    },
    checkIfShowDrawer() {
      if (this.asset_id === null) {
        toastr.error("请先选择或创建画布")
        this.show_draw_list = true;
      } else {
        this.show_draw_list = !this.show_draw_list;
      }
    },
    export_image() {
      const image = this.canvas.toDataURL("image/png"); // 默认格式是 PNG

// 创建一个下载链接
      const link = document.createElement("a");
      link.href = image;
      link.download = this.asset_id + "-" + moment().format('YYYY-MM-DD-HH-mm-ss') + ".png"; // 设置下载文件名
      link.click();
    },
    reset() {
      this.show_draw_setting = false
      Swal.fire({
        title: '清空画布',
        text: '确认清空画布吗?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: '确认',
        cancelButtonText: '取消',
      }).then((result) => {
        if (result.isConfirmed) {
          this.sendMessage('/draw/paint', JSON.stringify({
                draw_id: this.asset_id,
                paint_bean: {
                  type: 2
                }
              })
          )
        }
        this.show_draw_setting = true
      })
    },
    switchDrawer() {
      this.show_draw_list = !this.show_draw_list;
      if (this.show_draw_list && this.draw_list.length === 0) {
        this.get_draw_list()
      }
    },
    switchDrawerSetting() {
      this.show_draw_setting = !this.show_draw_setting;
    },
    async connectWebSocket() {
      const accessToken = await this.$accessToken(1)
      if (accessToken === false){
        toastr.error("获取Access token失败")
        return false
      }
      this.tool_access_token = accessToken
      // 1. 创建 SockJS 连接
      const socket = new SockJS(process.env.DRAW_WS_HOST + '/draw?access_token=' + this.tool_access_token); // WebSocket 端点

      // 2. 创建 STOMP 客户端
      this.stompClient = new Client({
        webSocketFactory: () => socket, // 连接 SockJS
        reconnectDelay: 1000,           // 断线重连间隔时间
        heartbeatIncoming: 1000,
        heartbeatOutgoing: 1000,
      });

      // 3. 连接 WebSocket
      this.stompClient.onConnect = () => {
        toastr.success("服务器已连接")
        // 订阅服务端的频道 "/topic/timestamp"
        this.stompClient.subscribe('/draw/message', (message) => {
          const paintBean = JSON.parse(message.body);
          this.drawing = true
          if (paintBean.type === 2) {
            // 清除画布
            this.canvasTx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.drawing = false
            return
          }
          // 设置样式
          this.canvasTx.lineWidth = paintBean.lineWidth;
          this.canvasTx.strokeStyle = paintBean.color;
          this.canvasTx.beginPath();
          // 移动到初始位置
          this.canvasTx.moveTo(paintBean.positionList[0].x, paintBean.positionList[0].y);
          for (let i = 0; i < paintBean.positionList.length - 1; i++) {
            this.canvasTx.lineTo(paintBean.positionList[i + 1].x, paintBean.positionList[i + 1].y);
          }
          this.canvasTx.stroke();
          this.canvasTx.closePath();
          this.drawing = false
        });
      };

      // 4. 错误处理
      this.stompClient.onStompError = (frame) => {
        console.error('WebSocket 错误: ', frame);
      };
      this.stompClient.onWebSocketClose = (frame) => {
        setTimeout(() => {
          toastr.warning("断线重连中")
          this.connectWebSocket()
        }, 2000)
      }

      this.stompClient.activate(); // 激活连接
    },
    sendMessage(destination, message) {
      if (this.stompClient && this.stompClient.connected) {
        this.stompClient.publish({
          destination: destination,
          body: message,
        });
      } else {
        console.log(this.stompClient)
      }
    },
    getMousePos(event) {
      const rect = this.canvas.getBoundingClientRect();
      return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      };
    },
    paintOver(event) {
      this.drawing = true;
      // 保存完成的线段到 lines
      this.lines.push(this.currentLine);
      // 推送到服务端
      const destination = "/draw/paint"; // 替换为你的目标
      this.sendMessage(destination, JSON.stringify({
        draw_id: this.asset_id,
        paint_bean: {
          positionList: this.currentLine,
          color: this.printerColor,
          lineWidth: this.lineWidth,
        }
      }))
      this.currentLine = []; // 清空当前线段
      this.drawing = false;
    },
    load() {
      this.canvasTx.clearRect(0, 0, this.canvas.width, this.canvas.height); // 清空画布
      // 加载当前数据
      this.$http.get('/draws/' + this.asset_id).then((response) => {
        this.asset_name = response.data.data.name;
      })
      // 从服务端获取已存在的数据
      this.$http.get(process.env.DRAW_WS_HOST + '/draw/paint/init', {
        params: {
          draw_id: this.asset_id,
        }
      }).then((response) => {
        this.lines = response.data ?? []

        const data = this.lines;
        if (data.length === 0) return;
        let currentPathIndex = 0;
        let currentPointIndex = 0;

        const drawNextStep = () => {
          if (currentPathIndex >= data.length) return; // 绘制结束

          const path = data[currentPathIndex];
          const points = path.positionList;

          // 如果是第一个点，初始化路径
          if (currentPointIndex === 0) {
            this.canvasTx.strokeStyle = path.color;
            this.printerColor = path.color;
            this.lineWidth = path.lineWidth;
            this.canvasTx.lineWidth = path.lineWidth;
            this.canvasTx.beginPath();
            this.canvasTx.moveTo(points[0].x, points[0].y);
          }

          // 连接到下一个点
          if (currentPointIndex < points.length) {
            const point = points[currentPointIndex];
            this.canvasTx.lineTo(point.x, point.y);
            this.canvasTx.stroke();
            currentPointIndex++;
          }

          // 如果当前路径绘制完，切换到下一条路径
          if (currentPointIndex >= points.length) {
            currentPointIndex = 0;
            currentPathIndex++;
          }

          // 使用 requestAnimationFrame 递归调用
          requestAnimationFrame(drawNextStep);
        }
        this.drawing = true;
        drawNextStep();
        this.drawing = false;
      })
    },
  }
  ,
  watch: {
    printerColor(newValue) {
      this.canvasTx.strokeStyle = newValue;
    },
  }
  ,
  mounted() {
    const urlParams = new URLSearchParams(window.location.search);
    // 初始化画布
    this.asset_id = urlParams.get('asset_id');

    this.canvas = document.getElementById("drawCanvas");
    this.canvas.width = document.getElementById('drawer').offsetWidth;
    this.canvas.height = document.getElementById('drawer').offsetHeight;
    this.canvasTx = this.canvas.getContext('2d');
    this.canvasTx.lineWidth = this.lineWidth;
    this.canvasTx.strokeStyle = this.printerColor;
    this.canvasTx.lineJoin = 'round'

    // 绑定鼠标按下事件
    this.canvas.addEventListener('mousedown', (event) => {
      // 关闭已存在的画布
      this.$http.post(process.env.DRAW_WS_HOST + '/draw/lock/get', {
        type: 0,
        draw_id: this.asset_id,
      }).then((response) => {
        if (response.data === true) {
          this.drawing = true;
          this.currentLine = []; // 清空当前线段
          const pos = this.getMousePos(event);
          this.currentLine.push({x: pos.x, y: pos.y});
          this.canvasTx.beginPath();
          this.canvasTx.lineWidth = this.lineWidth
          this.canvasTx.moveTo(pos.x, pos.y);
        } else {
          this.drawing = true;
        }
      })
    });

    // 绑定鼠标移动事件
    this.canvas.addEventListener('mousemove', (event) => {
      if (this.drawing) {
        const pos = this.getMousePos(event);
        this.canvasTx.lineTo(pos.x, pos.y);
        this.canvasTx.stroke();
        this.currentLine.push({x: pos.x, y: pos.y}); // 保存当前线段的坐标
      }
    });

    // 绑定鼠标抬起事件
    this.canvas.addEventListener('mouseup', (event) => {
      if (this.currentLine.length > 0) {
        this.paintOver(event)
      }
    });
    // 绑定鼠标离开事件
    this.canvas.addEventListener('mouseleave', (event) => {
      if (this.currentLine.length > 0) {
        this.paintOver(event)
      }
    });
    // 开启链接
    this.connectWebSocket()
    // 判断是否有初始化数据
    if (urlParams.get('asset_id') === null) {
      // 弹出创建框
      this.show_draw_list = true
      this.get_draw_list()
      return
    }
    // 加载绘制数据
    this.load();

  }
}
</script>

<style scoped lang="scss">

.delete-button {
  color: #FFFFFF;
  cursor: pointer;
  padding: 1px;
  background-color: #fb9e9e;
  border-color: #fb9e9e;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.drawer-list-loading {
  position: absolute;
  top: 50%;
  width: 100%;
  z-index: 1;
  background-color: grey;
  display: flex;
  justify-content: center;
  align-items: center;
  visibility: hidden; /* 初始隐藏 */
}

.drawer-list-content {
  display: flex;
  flex-wrap: wrap;
  margin: 20px;
}
.custom-scrollbar::-webkit-scrollbar {
  width: 10px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: linear-gradient(to bottom, #e4e4e4, #fff); /* 渐变滑轨背景 */
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.4); /* 半透明滑块 */
  border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.6); /* 鼠标悬停时的滑块颜色 */
}

.drawer-list-item {
  width: 50%;
  display: block;
  // 设置内容水平居中
  justify-content: center;
  padding: 10px;
  border: 1px #d8d2d2 dashed;
}

.drawer-list-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.drawer-list-image {
  cursor: pointer;
  box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.3), 0 0 10px rgba(248, 160, 160, 0.2);
  width: 100%;
  display: flex;
  justify-content: center;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.drawer-list-image:hover {
  cursor: pointer;
  transform: scale(1.05);
  box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.3), 0 0 10px rgba(248, 160, 160, 0.2);
}

.draw-list-tips {
  display: block;
  height: 100px;
  width: 10px;
  position: absolute;
  left: 10px;
  top: 40%;
  opacity: .5;
}

.tips-button {
  width: 10px;
  height: 100px;
  text-wrap: wrap;
  text-align: left;
}

.drawer {
  width: 100%;
  height: 100%;
}

.draw-disabled {
  cursor: not-allowed;
}

.draw-container {
  width: 100%;
  height: 90vh;
  border: 1px solid #d8d2d2;
  background-color: white;
}

.draw-setting-tips {
  display: block;
  height: 100px;
  width: 10px;
  position: absolute;
  right: 50px;
  top: 40%;
  opacity: .5;
}

.draw-setting-container {
  margin: 10px;
}

.draw-setting-content {
  margin: 20px;
}

.color-selector-demo-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
}

.color-selector-demo {
  border: 1px dashed #808080;
  margin: 2px;
  width: 30px;
  height: 30px;
}
.image-error-slot{
  min-height: 120px;
}
</style>
