# 个人博客前端系统 (Self-Blog Frontend)

这是一个基于 Vue 3 + Vite + Element Plus 构建的现代、全功能个人博客前端系统。

## 🚀 系统功能

### 1. 内容管理
- **文章展示**: 支持 Markdown 渲染，自动生成文章目录。
- **分类与标签**: 通过标签云和分类列表快速检索内容。
- **留言板**: 支持多级评论嵌套和表情互动。
- **推荐文章**: 根据当前阅读内容智能推荐相关文章。

### 2. 在线工具箱
集成了一系列实用的在线开发与学习工具：
- **代码执行器**: 支持 PHP, Java, Python, Golang, C, C++, JSON 等多种语言的在线运行与格式化。
- **时间工具**: 时间戳转换、倒计时等。
- **进制转换**: 支持多种进制间的转换。
- **舒尔特方格**: 专注力训练工具，支持成绩统计。
- **画板**: 在线绘图工具。
- **资源管理**: 查看系统资产、文件列表。
- **其他**: 剪贴板管理、CPU 信息查看、摸鱼日历、媒体工具、抽奖系统等。

### 3. TDK 管理系统
提供灵活的页面元数据（Title, Description, Keywords）管理：
- **静态声明**: 在组件内直接定义固定的 TDK。
- **动态更新**: 根据异步加载的数据（如文章详情）动态生成 SEO 友好的页面元数据。
- **全局混入**: 支持 Options API (`tdk` 选项) 和 Composition API (`useTDK` 钩子)。

### 4. 其他特性
- **响应式设计**: 完美适配手机、平板及 PC 端。
- **背景切换**: 支持动态视频背景或静态图片背景。
- **用户系统**: 支持登录、个人信息维护等功能。
- **滚动进度**: 页面顶部实时显示阅读进度条。

---

## 📂 目录结构说明

```text
src/
├── apis/               # API 请求封装层（基于 axios）
│   ├── article.js      # 文章相关接口
│   ├── schulte.js      # 舒尔特方格接口
│   └── ...
├── assets/             # 静态资源
│   ├── images/         # 图片、Logo
│   └── styles/         # 全局样式（SCSS）
├── components/         # 通用业务组件
│   ├── MarkdownParse.vue  # Markdown 渲染组件
│   ├── NavBar.vue         # 导航栏
│   └── ...
├── router/             # 路由配置
├── store/              # Pinia 状态管理
├── utils/              # 工具函数
│   ├── tdk.js          # TDK 管理核心逻辑
│   └── helpers.js      # 格式化、转换等通用工具
└── views/              # 页面级组件
    ├── home/           # 首页及文章详情
    ├── tools/          # 工具箱各功能页面
    ├── user/           # 登录及个人中心
    └── ...
```

---

## 🛠️ 安装与运行

### 前置条件
- [Node.js](https://nodejs.org/) (建议 v16+)
- [npm](https://www.npmjs.com/) 或 [yarn](https://yarnpkg.com/)

### 1. 安装依赖
```bash
npm install
# 或者
yarn install
```

### 2. 本地开发
```bash
npm run dev
# 或者
yarn serve
```

### 3. 构建打包
```bash
npm run build
# 或者
yarn build
```

---

## 📖 TDK 系统使用说明

### Options API 使用方式
在组件中添加 `tdk` 选项：
```javascript
export default {
  tdk() {
    return {
      title: this.article.title + ' - 详情',
      description: this.article.summary,
      keywords: '关键词1, 关键词2'
    }
  }
}
```

### Composition API 使用方式
使用 `useTDK` 钩子：
```javascript
import { useTDK } from '@/utils/tdk'

setup() {
  useTDK(() => ({
    title: '页面标题',
    description: '页面描述'
  }))
}
```
