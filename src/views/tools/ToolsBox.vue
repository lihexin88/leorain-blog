<template>
  <div id="container-left" class="list asset-item-container">
    <router-view />
  </div>
</template>

<script>
import anime from 'animejs'

export default {
  props: {},
  data () {
    return {
      items: [{
        text: '时间戳转换',
        description: '时间戳转换工具，提供当前时间戳和时间字符串转换功能',
        href: '/tools/timestamp',
        image: 'https://images.leorain.cn/icons/tools/tool_timestamp.png'
      },
      {
        text: '进制转换',
        description: '十进制 二进制 八进制 十六进制等自动转换',
        href: '/tools/radix',
        image: 'https://images.leorain.cn/icons/tools/tool_radix.png'
      },
      {
        text: 'json格式化',
        description: 'json字符串格式化与压缩',
        href: '/tools/json',
        image: 'https://images.leorain.cn/icons/tools/tool_json_format.png'
      },
      {
        text: 'PHP在线运行',
        description: 'PHP在线运行工具',
        href: '/tools/php',
        image: 'https://images.leorain.cn/icons/tools/tool_php.png'
      },
      {
        text: 'JAVA在线运行',
        description: 'JAVA在线运行工具',
        href: '/tools/java',
        image: 'https://images.leorain.cn/icons/tools/tool_java.png'
      },
      {
        text: 'PYTHON在线运行',
        description: 'PYTHON在线运行工具',
        href: '/tools/python',
        image: 'https://images.leorain.cn/icons/tools/tool_python.png'
      },
      {
        text: 'GO在线运行',
        description: 'GOLANG在线运行工具',
        href: '/tools/golang',
        image: 'https://images.leorain.cn/icons/tools/tool_golang.png'
      },
      {
        text: 'C在线运行',
        description: 'c语言在线运行工具',
        href: '/tools/clang',
        image: 'https://images.leorain.cn/icons/tools/tool_clang.png'
      },
      {
        text: 'C++在线运行',
        description: 'c++在线运行工具',
        href: '/tools/cpp',
        image: 'https://images.leorain.cn/icons/tools/tool_cpp.png'
      },
      {
        text: '在线同步绘画',
        description: '在线协作作图工具',
        href: '/tools/draw',
        image: 'https://images.leorain.cn/icons/tools/tool_draw.png'
      },
      {
        text: '在线剪切板',
        description: '在线同步剪切板',
        href: '/tools/clipboard',
        image: 'https://images.leorain.cn/icons/tools/tool_clipboard.png'
      },
      {
        text: '舒尔特表格测试',
        description: '舒尔特表格测试',
        href: '/tools/schulte',
        image: 'https://images.leorain.cn/icons/tools/tool_table_number.png'
      },
      {
        text: 'CPU运行模拟',
        description: 'CPU运行过程模拟',
        href: '/tools/cpu',
        image: 'https://images.leorain.cn/icons/tools/tool_cpu.png'
      },
      {
        text: '我很幸运',
        description: '模拟',
        href: '/tools/lottery',
        image: 'https://images.leorain.cn/icons/tools/tool_lucky.png'
      },
      {
        text: '鱼乐一下',
        description: '钓鱼小游戏',
        href: '/tools/fish',
        image: 'https://images.leorain.cn/icons/tools/tool_fish.png'
      }
      ]
    }
  },
  methods: {
    open_page (location) {
      this.$router.push(location)
    }
  },
  mounted () {
    this.$nextTick(() => {
      anime({
        targets: '.tools-items',
        scale: {
          value: [0, 1],
          duration: 50,
          delay: anime.stagger(10), // All properties except 'scale' inherit 250ms delay
          easing: 'easeInOutSine'
        },
        delay: anime.stagger(50) // All properties except 'scale' inherit 50ms delay
      })
    })
  }
}
</script>
<style scoped lang="scss">
.tool-container {
  display: flex;
  flex-wrap: wrap;
}

.tools-items-box {
  width: 100%;
  display: grid;
  margin: 0 20px;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 16px;
  justify-content: center;
  @media screen and (max-aspect-ratio: 1/1) {
    padding: 0;
  }
  :deep(.el-card__body){
    padding: 5px;
  }
}

.tools-items {
  display: flex;
  justify-content: center;
  cursor: pointer;
  border-radius: 3px;

  :deep(.el-card) {
    width: 100%;
    background-color: rgba(255, 255, 255, 0.5);
  }
}

.tools-items:hover {
  scale: 1.05;
  box-shadow: 0 0 10px black;
  transition: scale 0.2s, box-shadow 0.2s;
}

.item-title {
  text-align: center;
}

.tool-item-image {
  width: 50px;
}

.info {
  padding-top: 30px;
}

.item-box {
  display: flex;
  border-radius: 3px;
}
</style>
