<script setup lang="ts">
import { RouterView } from 'vue-router'
import { useTheme } from '@/composables/useTheme'
import ToastContainer from '@/components/ui/ToastContainer.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'

useTheme()
</script>

<template>
  <RouterView />
  <ToastContainer />
  <ConfirmDialog />
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

/* ──────────────────────────────
   DARK THEME (default)
────────────────────────────── */
:root, [data-theme="dark"] {
  --bg-base: #1a1a1a;
  --bg-surface: #232323;
  --bg-card: #252525;
  --bg-card-hover: #2d2d2d;
  --bg-input: #1e1e1e;
  --border: #383838;
  --border-light: #2c2c2c;
  --text-primary: #e8e8e8;
  --text-secondary: #999;
  --text-muted: #666;
  --gold: #D4AF37;
  --gold-hover: #b8942e;
  --gold-light: rgba(212, 175, 55, 0.12);
  --gold-dim: rgba(212, 175, 55, 0.06);
  --success: #3dba6f;
  --danger: #e05252;
  --info: #4da6ff;
  --sidebar-width: 250px;
  --radius: 8px;
  --radius-lg: 12px;
  --shadow: 0 4px 16px rgba(0,0,0,0.4);

  /* Auth page */
  --auth-bg: #121212;
  --auth-card-bg: #1e1e1e;
  --auth-card-border: #3d3520;
  --auth-label: #bda050;
  --auth-input-bg: #161616;
  --auth-input-border: #333333;
  --auth-input-text: #e8e8e8;
  --auth-input-placeholder: #555555;
  --auth-icon: #D4AF37;
  --auth-link: #D4AF37;
  --auth-footer: #666666;
}

/* ──────────────────────────────
   LIGHT THEME
────────────────────────────── */
[data-theme="light"] {
  --bg-base: #f0f0f0;
  --bg-surface: #ffffff;
  --bg-card: #ffffff;
  --bg-card-hover: #f9f9f9;
  --bg-input: #f5f5f5;
  --border: #e0e0e0;
  --border-light: #ebebeb;
  --text-primary: #1a1a1a;
  --text-secondary: #555;
  --text-muted: #999;
  --gold: #C49B1E;
  --gold-hover: #a8840f;
  --gold-light: rgba(196,155,30,0.12);
  --gold-dim: rgba(196,155,30,0.06);
  --success: #22863a;
  --danger: #d73a3a;
  --info: #0366d6;
  --shadow: 0 2px 12px rgba(0,0,0,0.08);

  --auth-bg: #f5f5f5;
  --auth-card-bg: #ffffff;
  --auth-card-border: #d4b96a;
  --auth-label: #6b5a2a;
  --auth-input-bg: #fafafa;
  --auth-input-border: #d4b96a;
  --auth-input-text: #2a1a00;
  --auth-input-placeholder: #bba060;
  --auth-icon: #9a7a30;
  --auth-link: #8a6a20;
  --auth-footer: #b09050;
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 14px;
  color: var(--text-primary);
  background: var(--bg-base);
  -webkit-font-smoothing: antialiased;
  transition: background 0.25s, color 0.25s;
}

a { color: inherit; text-decoration: none; }
button, input, select, textarea { font-family: inherit; font-size: inherit; }

input:not([type="checkbox"]):not([type="radio"]), select, textarea {
  background: var(--bg-input);
  color: var(--text-primary);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 9px 12px;
  outline: none;
  transition: border-color 0.15s, background 0.25s;
  width: 100%;
}

input::placeholder, textarea::placeholder { color: var(--text-muted); }
input:focus, select:focus, textarea:focus { border-color: var(--gold); }
select option { background: var(--bg-card); color: var(--text-primary); }

::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: var(--bg-base); }
::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }

/* Utility classes */
.btn {
  display: inline-flex; align-items: center; gap: 6px; justify-content: center;
  padding: 0 16px; height: 40px; border-radius: var(--radius);
  font-weight: 600; font-size: 0.85rem; cursor: pointer;
  border: none; transition: all 0.18s; white-space: nowrap; letter-spacing: 0.2px;
}
.btn-gold { background: var(--gold); color: #fff; }
[data-theme="dark"] .btn-gold { color: #1a1a1a; }
.btn-gold:hover { background: var(--gold-hover); }
.btn-gold:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-outline { background: transparent; color: var(--text-secondary); border: 1px solid var(--border); }
.btn-outline:hover { border-color: var(--gold); color: var(--gold); }
.btn-ghost { background: transparent; color: var(--text-secondary); border: none; padding: 6px 10px; }
.btn-ghost:hover { color: var(--gold); }
.btn-danger { background: var(--danger); color: #fff; }
.btn-danger:hover { filter: brightness(0.9); }

.card {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  border: 1px solid var(--border-light);
  box-shadow: var(--shadow);
  transition: background 0.25s, border-color 0.25s;
}

.table-responsive {
  width: 100%;
  overflow-x: auto;
}

.section-title { font-size: 1.35rem; font-weight: 700; color: var(--text-primary); }
.section-sub { font-size: 0.82rem; color: var(--text-muted); margin-top: 3px; }

.data-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}
.data-table th {
  padding: 10px 14px;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-muted);
  border-bottom: 1px solid var(--border);
  letter-spacing: 0.5px;
}
.data-table td {
  padding: 14px;
  font-size: 0.85rem;
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-light);
}
.data-table tr:hover td {
  background: var(--bg-card-hover);
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}
.badge-gold { background: var(--gold-light); color: var(--gold); }
.badge-success { background: rgba(61, 186, 111, 0.15); color: var(--success); }
.badge-danger { background: rgba(224, 82, 82, 0.15); color: var(--danger); }
.badge-muted { background: var(--bg-surface); color: var(--text-muted); }
</style>
