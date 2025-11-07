<template>
  <el-container>
    <el-header>
      <el-menu class="header-menu" mode="horizontal" default-active="home" router :ellipsis="false">
        <el-menu-item index="/" key="home">首页</el-menu-item>
        <el-menu-item index="/about">关于</el-menu-item>
      </el-menu>
    </el-header>

    <el-main>
      <div class="header-bg" style="height: 60px"></div>
      <div class="home">
        <Carousel />
        <el-card>
          <template #header>
            <div class="card-header">
              <span>欢迎</span>
            </div>
          </template>
          <div class="content">
            <h1>{{ appStore.appInfo }}</h1>
            <p>这是一个使用 Vue3 + Pinia + Element Plus + Vite + Sass 搭建的官网项目</p>
            <el-button type="primary" @click="handleClick">点击测试</el-button>
          </div>

          <el-descriptions
            title="Vertical list without border"
            :column="4"
            :size="size"
            direction="vertical"
            :style="blockMargin"
            v-for="i in 10"
          >
            <el-descriptions-item label="Username">kooriookami</el-descriptions-item>
            <el-descriptions-item label="Telephone">18100000000</el-descriptions-item>
            <el-descriptions-item label="Place" :span="2">Suzhou</el-descriptions-item>
            <el-descriptions-item label="Remarks">
              <el-tag size="small">School</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="Address">
              No.1188, Wuzhong Avenue, Wuzhong District, Suzhou, Jiangsu Province
            </el-descriptions-item>
          </el-descriptions>
        </el-card>
      </div>
    </el-main>
    <el-footer>Footer</el-footer>
  </el-container>
</template>

<script setup name="Home">
import Carousel from '@/components/carousel.vue'

// Pinia store 已自动导入，无需手动 import
const appStore = useAppStore()

const handleClick = () => {
  ElMessage.success('自动导入功能正常工作！')
}
</script>

<style lang="scss" scoped>
.home {
  .header-menu {
    backdrop-filter: blur(20px);
    background-color: transparent;
    width: auto;
    height: 44px;
    display: flex;
  }
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: bold;
  }

  .content {
    text-align: center;
    padding: 20px;

    h1 {
      color: $primary-color;
      margin-bottom: 20px;
    }

    p {
      color: $text-color;
      margin-bottom: 20px;
    }
  }
}
.el-menu--horizontal > .el-menu-item:nth-child(1) {
  margin-right: auto;
}
</style>

<style lang="scss">
// 移除 el-menu 的选中样式（全局样式，不使用 scoped）
.header-menu {
  // 覆盖 Element Plus 的 CSS 变量
  --el-menu-hover-bg-color: transparent;
  --el-menu-item-hover-fill: transparent;
  --el-menu-active-color: inherit;
  --el-menu-bg-color: transparent;

  .el-menu-item {
    // 覆盖 CSS 变量
    --el-menu-hover-bg-color: transparent !important;
    --el-menu-item-hover-fill: transparent !important;

    // 移除所有状态的背景色和样式（使用 all 重置所有属性）
    background-color: transparent !important;
    background: transparent !important;
    border-bottom: none !important;
    border: none !important;

    // 移除选中状态
    &.is-active {
      background-color: transparent !important;
      background: transparent !important;
      color: inherit !important;
      border-bottom: none !important;
      border: none !important;
    }

    // 移除 hover 状态
    &:hover {
      background-color: transparent !important;
      background: transparent !important;
      color: inherit !important;
    }

    // 移除焦点状态
    &:focus,
    &:focus-visible {
      background-color: transparent !important;
      background: transparent !important;
      color: inherit !important;
      outline: none !important;
    }

    // 移除点击/激活状态
    &:active {
      background-color: transparent !important;
      background: transparent !important;
      color: inherit !important;
    }

    // 移除所有可能的组合状态
    &.is-active:hover,
    &.is-active:focus,
    &.is-active:active {
      background-color: transparent !important;
      background: transparent !important;
    }

    // 移除所有伪元素（如下划线等）
    &::before,
    &::after {
      display: none !important;
      content: none !important;
    }

    // 移除内部包装元素的背景
    .el-menu-item__content {
      background-color: transparent !important;
      background: transparent !important;
    }
  }

  // 移除菜单项的内部元素样式
  .el-menu-item * {
    color: inherit !important;
    background-color: transparent !important;
    background: transparent !important;
  }

  // 移除所有可能的背景色（使用通配符）
  .el-menu-item[class*='active'],
  .el-menu-item[class*='hover'],
  .el-menu-item[class*='focus'] {
    background-color: transparent !important;
    background: transparent !important;
  }

  // 移除水平菜单的下划线
  &.el-menu--horizontal {
    border-bottom: none !important;

    .el-menu-item {
      border-bottom: none !important;

      &.is-active {
        border-bottom: none !important;
      }
    }
  }
}
</style>
