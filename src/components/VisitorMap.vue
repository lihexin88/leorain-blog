<template>
  <div id="visitorMap"
       style="height: 350px;width:100%;border: 1px solid rgba(166,166,166,0.49);border-radius: 4px;z-index: 1"></div>
</template>
<script>
import L from "leaflet";
import SockJS from "sockjs-client";
import {Client} from "@stomp/stompjs";
import "leaflet/dist/leaflet.css";
import {visitorMapApi} from "@/apis";

// 创建自定义闪烁图标
const createPulsingIcon = (type = 1) => {
  if (type === 1) {
    return L.divIcon({
      className: 'pulsing-icon',
      iconSize: [20, 20],
      html: `<div class="pulse-container"><div class="pulse-circle-blue"></div></div>`
    });
  } else if (type === 2) {
    return L.divIcon({
      className: 'pulsing-icon',
      iconSize: [20, 20],
      html: `<div class="pulse-container"><div class="pulse-circle-red"></div></div>`
    });
  }
}

export default {
  data() {
    return {
      connection_retried: 0,
      stompClient: null,
      chinaBounds: [
        [3.86, 73.66], // 中国最南西（海南南部海域）
        [53.55, 135.05], // 中国最北东
      ],
      map: null,
      markers: new Map(),
      tiandituToken: "c5429bb758af21ec9e639fb42551136e",
      chinaCities: null,
      geojsonLayer: null, // 存储 GeoJSON 图层
    }
  },
  async mounted() {
    // 延迟初始化确保DOM渲染完成
    this.$nextTick(() => {
      visitorMapApi.getCountryMap().then((response) => {
        this.chinaCities = response
        this.initMap()
        this.connectWebSocket()
        // 初始加载城市 GeoJSON 数据
        this.addCityBorders();
      })
    });
  },
  methods: {
    // 初始化地图
    initMap() {
      // 初始化地图
      this.map = L.map('visitorMap', {
        center: [35.8617, 104.1954], // 中国中心
        zoom: 4,
        minZoom: 4,
        maxZoom: 6,
        trackResize: true,
        zoomControl: false,
        maxBounds: this.chinaBounds, // 限制地图范围
      }); // 初始定位中国
      this.map.attributionControl.setPrefix('');
      // 基础图层（不包含文字）
      const baseLayer = L.tileLayer(`https://t{s}.tianditu.gov.cn/DataServer?T=vec_w&x={x}&y={y}&l={z}&tk=${this.tiandituToken}`, {
        subdomains: "01234567",
        attribution: '',
        zIndex: 1,
      });

// 添加到地图
      baseLayer.addTo(this.map);
      // 监听缩放，添加 GeoJSON
      this.map.on("zoomend", () => {
        let zoom = this.map.getZoom();
        console.log("当前缩放级别:", zoom);

        if (zoom <= 3) {
          L.geoJSON(cityBorders, {
            style: {
              color: "green",
              weight: .5
            },
            onEachFeature: (feature, layer) => {
              layer.bindTooltip(feature.properties.name, {permanent: true});
            }
          }).addTo(this.map);
        }
      })
    },
    addCityBorders() {
      // 移除之前的 GeoJSON 图层（如果存在）
      if (this.geojsonLayer) {
        this.map.removeLayer(this.geojsonLayer);
      }

      // 加载城市轮廓
      this.geojsonLayer = L.geoJSON(this.chinaCities, {
        style: {
          color: "green", // 轮廓颜色
          weight: .1, // 线宽
          fillOpacity: 0, // 透明填充
        },
        onEachFeature: (feature, layer) => {
          let cityName = feature.properties.name;
          let cityCenter = layer.getBounds().getCenter();

          // 在城市中心点添加名称
          L.marker(cityCenter, {
            icon: L.divIcon({
              className: "city-label",
              html: `<span>${cityName}</span>`,
              iconSize: [60, 20],
            }),
          }).addTo(this.map);
        },
      }).addTo(this.map);
    },
    updateMarker(location) {

      // 加强类型转换和错误处理
      const lat = parseFloat(location.lat)
      const lng = parseFloat(location.lng)
      const type = location.type

      if (isNaN(lat) || isNaN(lng)) {
        console.error('坐标格式错误，期望数字类型', location)
        return
      }

      // 验证坐标范围
      if (Math.abs(lat) > 90 || Math.abs(lng) > 180) {
        console.error('坐标值超出合理范围', lat, lng)
        return
      }

      const key = `${lat}-${lng}`

      try {
        const newMarker = L.marker([lat, lng], {
          icon: createPulsingIcon(type),
          zIndexOffset: 999 // 确保显示在最上层
        }).addTo(this.map)
        // 保存标记实例
        this.markers.set(key, newMarker);
        // 10秒后自动移除标记
        setTimeout(() => {
          if (this.markers.has(key)) {
            this.markers.get(key).remove();
            this.markers.delete(key);
          }
        }, 1000);
      } catch (e) {
        console.error('创建标记失败：', e)
      }
    },

    async connectWebSocket() {
      // 1. 创建 SockJS 连接
      const socket = new SockJS(process.env.DRAW_WS_HOST + '/ws'); // WebSocket 端点

      // 2. 创建 STOMP 客户端
      this.stompClient = new Client({
        webSocketFactory: () => socket, // 连接 SockJS
        reconnectDelay: 1000,           // 断线重连间隔时间
        heartbeatIncoming: 1000,
        heartbeatOutgoing: 1000,
      });

      // 3. 连接 WebSocket
      this.stompClient.onConnect = () => {
        this.connection_retried = 0
        this.stompClient.subscribe('/info/visitors/location', (message) => {
          const visitor = message.body.split(",")
          this.updateMarker({
            lat: parseFloat(visitor[0]),
            lng: parseFloat(visitor[1]),
            type: parseInt(visitor[2]),
          })
        });
      };

      // 4. 错误处理
      this.stompClient.onStompError = (frame) => {
        console.log("错误")
      };
      this.stompClient.onWebSocketClose = (frame) => {
        if (frame.code === 2000) {
          this.$accessToken(2)
          this.button_type = 'info'
          console.error("链接已断开")
          return;
        }
        if (!this.show_visitor) {
          return
        }
        setTimeout(() => {
          console.error("断线重连中")
          this.connection_retried++
          if (this.connection_retried > 3) {
            this.connection_retried = 0
            return
          }
          this.connectWebSocket()
        }, 2000)
      }
      this.stompClient.onDisconnect = () => {
        this.button_type = 'info'
        console.error("链接已断开")
      }

      this.stompClient.activate(); // 激活连接
    },
  },
}
</script>

<style scoped lang="scss">
/* 脉冲动画效果 */
::v-deep .pulse-container {
  position: relative;
  width: 20px;
  height: 20px;
}

::v-deep .pulse-circle-red {
  position: absolute;
  width: 100%;
  height: 100%;
  background-color: rgba(223, 86, 80, 0.29) !important;
  border-radius: 50%;
  opacity: 0;
  animation: pulse 1.5s 0s 1;
}

::v-deep .pulse-circle-blue {
  position: absolute;
  width: 100%;
  height: 100%;
  background-color: rgba(37, 196, 221, 0.29) !important;
  border-radius: 50%;
  opacity: 0;
  animation: pulse 1.5s 0s 1;
}

@keyframes pulse {
  0% {
    transform: scale(0.8);
    opacity: 1;
  }
  50% {
    transform: scale(2);
    opacity: 0;
  }
  100% {
    transform: scale(0.8);
    opacity: 0;
  }
}

::v-deep .leaflet-tooltip {
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid #ccc;
  border-radius: 4px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
}
</style>