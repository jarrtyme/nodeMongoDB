# 路由 Keep-Alive 配置说明

## 功能说明

项目已配置路由的 keep-alive 功能，可以让组件在路由切换时保持状态，不被销毁。

## 配置方式

### 1. 在路由配置中添加 meta.keepAlive

```javascript
{
  path: '/example',
  name: 'Example',
  component: () => import('@/views/Example.vue'),
  meta: {
    keepAlive: true,  // 设置为 true 表示需要缓存
    title: '示例页面'
  }
}
```

### 2. 在组件中定义 name（必须）

使用 `defineOptions` 定义组件名称，名称需与路由的 `name` 保持一致：

```vue
<script setup>
// 定义组件名称，用于 keep-alive
defineOptions({
  name: 'Example'  // 必须与路由的 name 一致
})
</script>
```

## 使用场景

### 需要缓存的情况
- 列表页面（保持滚动位置、筛选条件等）
- 表单页面（保持用户输入）
- 详情页面（避免重复请求数据）

### 不需要缓存的情况
- 登录页面
- 需要实时数据更新的页面
- 设置页面（需要每次都重新加载）

## 示例

### 需要缓存的路由

```javascript
// router/index.js
{
  path: '/list',
  name: 'List',
  component: () => import('@/views/List.vue'),
  meta: {
    keepAlive: true,
    title: '列表页'
  }
}
```

```vue
<!-- views/List.vue -->
<script setup>
defineOptions({
  name: 'List'
})

// 组件状态会被保持，切换路由后回来时数据还在
const data = ref([])
</script>
```

### 不需要缓存的路由

```javascript
// router/index.js
{
  path: '/login',
  name: 'Login',
  component: () => import('@/views/Login.vue'),
  meta: {
    keepAlive: false,  // 或直接不设置 keepAlive
    title: '登录'
  }
}
```

## 注意事项

1. **组件 name 必须与路由 name 一致**，否则 keep-alive 不会生效
2. 使用 `defineOptions` 需要在 Vue 3.3+ 版本
3. keep-alive 会缓存组件实例，注意内存使用
4. 如果组件中有定时器、事件监听等，需要在 `onUnmounted` 中清理（虽然组件被缓存，但可以通过 `onActivated` 和 `onDeactivated` 生命周期钩子处理）

## 生命周期钩子

被 keep-alive 包裹的组件可以使用以下生命周期钩子：

- `onActivated()` - 组件被激活时调用（从缓存中恢复）
- `onDeactivated()` - 组件被停用时调用（进入缓存）

```vue
<script setup>
import { onActivated, onDeactivated } from 'vue'

onActivated(() => {
  console.log('组件被激活')
  // 可以在这里刷新数据
})

onDeactivated(() => {
  console.log('组件被停用')
  // 可以在这里清理一些操作
})
</script>
```

