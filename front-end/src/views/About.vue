<template>
  <div class="about">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>关于我们</span>
        </div>
      </template>
      <div class="content">
        <el-descriptions title="项目信息" :column="1" border>
          <el-descriptions-item label="框架">Vue 3</el-descriptions-item>
          <el-descriptions-item label="状态管理">Pinia</el-descriptions-item>
          <el-descriptions-item label="UI组件库">Element Plus</el-descriptions-item>
          <el-descriptions-item label="构建工具">Vite</el-descriptions-item>
          <el-descriptions-item label="样式预处理器">Sass</el-descriptions-item>
          <el-descriptions-item label="自动导入">已配置</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-card>
  </div>
</template>

<script setup>
// 定义组件名称，用于 keep-alive
defineOptions({
  name: 'About'
})

// setup 语法糖自动导入，无需手动导入 Vue API
</script>

<style lang="scss" scoped>
.about {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: bold;
  }

  .content {
    padding: 20px;
  }
}
</style>
