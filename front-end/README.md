# Vue3 官网项目

基于 Vue3 + Pinia + Element Plus + Vite + Sass 搭建的现代化官网项目。

## 技术栈

- **Vue 3** - 渐进式 JavaScript 框架
- **Pinia** - 状态管理
- **Element Plus** - UI 组件库（自动导入）
- **Vite** - 下一代前端构建工具
- **Sass** - CSS 预处理器
- **unplugin-auto-import** - 自动导入 Vue API
- **unplugin-vue-components** - 自动导入组件
- **Prettier** - 代码格式化工具

## 特性

- ✅ Vue3 Composition API + Setup 语法糖
- ✅ Pinia 状态管理
- ✅ Element Plus 组件自动导入
- ✅ Vue API 自动导入（ref、reactive、computed 等）
- ✅ Sass 全局变量支持
- ✅ 路径别名配置（@ 指向 src）
- ✅ 路由配置
- ✅ 前端代理配置
- ✅ Prettier 代码格式化

## 项目结构

```
wdmlzff/
├── public/              # 静态资源（直接复制到构建输出）
│   ├── favicon.ico     # 网站图标
│   └── robots.txt      # 搜索引擎爬虫配置
├── src/
│   ├── api/            # API 接口
│   ├── assets/         # 资源文件（需通过 import 导入）
│   ├── components/     # 组件
│   ├── stores/         # Pinia stores
│   ├── router/         # 路由配置
│   ├── utils/          # 工具函数
│   ├── views/          # 页面视图
│   ├── styles/         # 全局样式（Sass）
│   │   ├── main.scss   # 主样式文件
│   │   └── variables.scss # Sass 变量
│   ├── App.vue         # 根组件
│   └── main.js         # 入口文件
├── index.html
├── package.json
├── vite.config.js      # Vite配置
├── jsconfig.json       # JavaScript配置
└── README.md
```

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发

```bash
npm run dev
```

### 构建

```bash
npm run build
```

### 预览

```bash
npm run preview
```

## 使用说明

### 自动导入

项目已配置自动导入，无需手动导入：

- **Vue API**: `ref`、`reactive`、`computed`、`watch` 等可直接使用
- **Vue Router**: `useRoute`、`useRouter` 等可直接使用
- **Pinia**: `defineStore`、`storeToRefs` 等可直接使用
- **Element Plus**: 组件可直接使用，无需导入

### Sass 变量

在 `src/styles/variables.scss` 中定义全局变量，可在任何 `.vue` 文件中直接使用：

```scss
.my-component {
  color: $primary-color;
}
```

### 路径别名

使用 `@` 指向 `src` 目录：

```javascript
import { useAppStore } from '@/stores'
import Home from '@/views/Home.vue'
```

### Public 文件夹

`public` 文件夹用于存放静态资源，这些文件会被直接复制到构建输出的根目录，可以通过绝对路径访问：

- **favicon.ico** - 网站图标，通过 `/favicon.ico` 访问
- **robots.txt** - 搜索引擎爬虫配置，通过 `/robots.txt` 访问
- **其他静态文件** - 如 `logo.png`，通过 `/logo.png` 访问

**与 `src/assets` 的区别**：
- `public/` - 文件不会被 Vite 处理，直接复制到输出目录，适合 favicon、robots.txt 等
- `src/assets/` - 文件会被 Vite 处理（压缩、优化等），适合图片、字体等资源

### 前端代理

项目已配置开发环境代理，所有 `/api` 开头的请求会被代理到后端服务器。

配置位置：`vite.config.js` 中的 `server.proxy`

### 代码格式化

使用 Prettier 进行代码格式化：

```bash
# 格式化所有代码
npm run format

# 检查代码格式
npm run format:check
```

## 开发规范

- 使用 Setup 语法糖编写组件
- 遵循 Vue3 Composition API 最佳实践
- 使用 Pinia 进行状态管理
- 使用 Prettier 格式化代码
