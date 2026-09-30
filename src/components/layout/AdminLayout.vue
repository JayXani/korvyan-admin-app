<template>
  <div class="admin-layout">
    <AdminSidebar />
    <div class="admin-main">
      <AdminHeader />
      <main class="admin-content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import AdminSidebar from './AdminSidebar.vue'
import AdminHeader from './AdminHeader.vue'
</script>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
  background: var(--bg-base);
}

.admin-main {
  flex: 1;
  margin-left: var(--sidebar-width);
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  min-width: 0;
}

.admin-content {
  flex: 1;
  padding: 2rem;
}
</style>
