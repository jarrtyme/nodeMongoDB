// 注意：在 .js 入口文件中，建议保留手动导入以确保稳定性
// 自动导入主要适用于 .vue 组件文件
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'

// 先导入 Element Plus 基础样式
import 'element-plus/dist/index.css'
// 然后导入我们的全局样式
import './styles/main.scss'
// 最后导入 Element Plus 变量覆盖，确保优先级最高（覆盖 Element Plus 组件中的变量定义）
import './styles/element-plus.scss'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
