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
  --sidebar-width: 224px;
  --radius: 8px;
  --radius-lg: 12px;
  --shadow: 0 4px 16px rgba(0,0,0,0.4);

  /* Auth page specific — Premium Dark Theme */
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

  /* Auth page specific */
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

/* ──── Modern Custom Checkbox ──── */
input[type="checkbox"] {
  appearance: none;
  -webkit-appearance: none;
  width: 20px;
  height: 20px;
  border: 2px solid var(--border);
  border-radius: 6px;
  background-color: var(--bg-input);
  cursor: pointer;
  position: relative;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

input[type="checkbox"]:hover {
  border-color: var(--gold);
}

input[type="checkbox"]:checked {
  background-color: var(--gold);
  border-color: var(--gold);
}

input[type="checkbox"]:checked::after {
  content: '';
  position: absolute;
  width: 5px;
  height: 10px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
  margin-top: -2px;
}

[data-theme="dark"] input[type="checkbox"]:checked::after {
  border-color: #1a1a1a;
}
input::placeholder, textarea::placeholder { color: var(--text-muted); }
input:focus, select:focus, textarea:focus { border-color: var(--gold); }
select option { background: var(--bg-card); color: var(--text-primary); }

::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: var(--bg-base); }
::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }

/* ──── Utility classes ──── */
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
.btn-outline.btn-gold,
[data-theme="dark"] .btn-outline.btn-gold {
  background: rgba(212, 175, 55, 0.14) !important;
  color: var(--gold) !important;
  border-color: var(--gold) !important;
}
.btn-outline.btn-gold i,
.btn-outline.btn-gold span,
[data-theme="dark"] .btn-outline.btn-gold i,
[data-theme="dark"] .btn-outline.btn-gold span {
  color: var(--gold) !important;
}
.btn-outline.btn-gold:hover {
  background: var(--gold) !important;
  color: #1a1a1a !important;
}
.btn-outline.btn-gold:hover i,
.btn-outline.btn-gold:hover span {
  color: #1a1a1a !important;
}
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
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.table-responsive {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.section-title { font-size: 1.35rem; font-weight: 700; color: var(--text-primary); }
.section-sub { font-size: 0.82rem; color: var(--text-muted); margin-top: 3px; }

.form-label { font-size: 0.78rem; color: var(--text-secondary); font-weight: 500; margin-bottom: 5px; display: block; }
.required-asterisk, .form-label .required-asterisk { color: var(--danger, #ef4444) !important; font-weight: 700; margin-left: 3px; }
.form-row { display: grid; gap: 1rem; }
.form-row-2 { grid-template-columns: 1fr 1fr; }
.form-row-3 { grid-template-columns: 1fr 1fr 1fr; }
.form-field { display: flex; flex-direction: column; }

.badge-status {
  display: inline-flex; align-items: center;
  padding: 3px 10px; border-radius: 20px;
  font-size: 0.7rem; font-weight: 700; letter-spacing: 0.4px; text-transform: uppercase;
}
.badge-ativo { background: rgba(61,186,111,0.15); color: var(--success); }
.badge-pendente { background: rgba(212,175,55,0.15); color: var(--gold); }
.badge-cancelado { background: rgba(224,82,82,0.15); color: var(--danger); }
.badge-inativo { background: rgba(153,153,153,0.12); color: var(--text-muted); }
.badge-pago { background: rgba(61,186,111,0.15); color: var(--success); }

.page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
.page-header-left { display: flex; flex-direction: column; }

.data-table { 
  width: 100%; 
  border-collapse: collapse; 
  table-layout: fixed;
  min-width: 760px;
}
.data-table th {
  text-align: left; padding: 10px 14px;
  font-size: 0.72rem; font-weight: 600; color: var(--text-muted);
  text-transform: uppercase; letter-spacing: 0.6px;
  border-bottom: 1px solid var(--border-light);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.data-table td {
  padding: 13px 14px; font-size: 0.85rem; color: var(--text-secondary);
  border-bottom: 1px solid var(--border-light); vertical-align: middle;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.data-table tr:last-child td { border-bottom: none; }
.data-table tbody tr:hover { background: var(--gold-dim); }

.table-clickable-row {
  cursor: pointer;
  transition: background-color 0.15s ease;
}
.table-clickable-row:hover {
  background: var(--bg-surface-hover, rgba(255, 255, 255, 0.04)) !important;
}

.data-table th:last-child,
.data-table td:last-child {
  text-align: right;
  white-space: nowrap;
}

.pagination { display: flex; align-items: center; gap: 4px; justify-content: flex-end; }
.pagination-btn {
  min-width: 36px; height: 36px; border-radius: var(--radius); border: 1px solid var(--border);
  background: var(--bg-card); color: var(--text-secondary); cursor: pointer;
  display: flex; align-items: center; justify-content: center; font-size: 0.9rem; padding: 0 10px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
.pagination-btn:hover, .pagination-btn.active { background: var(--gold); border-color: var(--gold); color: #fff; }
[data-theme="dark"] .pagination-btn:hover, [data-theme="dark"] .pagination-btn.active { color: #1a1a1a; }
.pagination-btn:disabled { opacity: 0.35; cursor: default; }

.search-bar {
  display: flex; align-items: center; gap: 8px;
  background: var(--bg-input); border: 1px solid var(--border);
  border-radius: var(--radius); padding: 0 14px; height: 40px; flex: 1; min-width: 200px; max-width: 340px;
}
.search-bar i { color: var(--text-muted); font-size: 0.9rem; flex-shrink: 0; }
.search-bar input { border: none !important; background: transparent; padding: 0 !important; width: 100%; height: 100%; outline: none; box-shadow: none !important; }

.filter-bar { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 1rem; }
.filter-select {
  background: var(--bg-input); border: 1px solid var(--border);
  border-radius: var(--radius); padding: 0 14px; color: var(--text-secondary);
  font-size: 0.85rem; cursor: pointer; min-width: 140px; width: auto; height: 40px;
  outline: none;
}
.filter-select:focus { border-color: var(--gold); }

.modal-overlay {
  position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
  background: rgba(0, 0, 0, 0.4); z-index: 9999;
  display: flex; align-items: center; justify-content: center;
  backdrop-filter: blur(4px);
}
.modal-content, .modal-card, .modal-box {
  background: var(--bg-card); border-radius: var(--radius-lg);
  padding: 24px; box-shadow: 0 10px 40px rgba(0,0,0,0.2);
  border: 1px solid var(--border-light);
  max-height: 90vh; overflow-y: auto;
}
.modal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
.modal-header h3 { font-size: 1.15rem; font-weight: 700; color: var(--text-primary); }
.btn-icon { background: none; border: none; font-size: 1.1rem; color: var(--text-muted); cursor: pointer; transition: 0.2s; }
.btn-icon:hover { color: var(--gold); }
</style>
