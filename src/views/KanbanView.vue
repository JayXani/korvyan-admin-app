<template>
  <div class="kanban-container">
    <div class="bo-page-header">
      <div>
        <h1>Quadro de Tarefas</h1>
        <p>Gerenciamento simples de tarefas da plataforma.</p>
      </div>
      <div>
        <button class="btn btn-primary" style="background: var(--master-brand); color: white; white-space: nowrap;" @click="showNewTaskModal = true"><i class="fas fa-plus"></i> Nova Tarefa</button>
      </div>
    </div>

    <!-- Modal Nova Tarefa -->
    <div v-if="showNewTaskModal" class="modal-overlay" @click.self="showNewTaskModal = false">
      <div class="modal-content" style="max-width: 500px; background: var(--bg-bo-card); border: 1px solid var(--border-bo);">
        <div class="modal-header" style="border-bottom-color: var(--border-bo);">
          <h3 style="color: var(--text-bo);">Adicionar Nova Tarefa</h3>
          <button class="icon-btn" @click="showNewTaskModal = false" style="color: var(--text-bo-muted);"><i class="fas fa-times"></i></button>
        </div>
        <div class="modal-body" style="display: flex; flex-direction: column; gap: 1rem;">
          <div class="form-field">
            <label class="form-label" style="color: var(--text-bo-muted);">TÍTULO DA TAREFA</label>
            <input v-model="newTaskTitle" type="text" placeholder="Ex: Ajustar cores do tema" class="filter-select" />
          </div>
          <div class="form-field">
            <label class="form-label" style="color: var(--text-bo-muted);">DESCRIÇÃO (OPCIONAL)</label>
            <textarea v-model="newTaskDesc" placeholder="Detalhes da tarefa..." class="filter-select" style="resize: vertical; min-height: 80px; font-size: 0.85rem;"></textarea>
          </div>
        </div>
        <div class="modal-footer" style="border-top-color: var(--border-bo); display: flex; justify-content: flex-end; gap: 12px; margin-top: 1rem; padding-top: 1rem;">
          <button class="btn btn-outline" @click="showNewTaskModal = false">Cancelar</button>
          <button class="btn btn-primary" style="background: var(--master-brand); color: white;" @click="newTask"><i class="fas fa-plus"></i> Criar Tarefa</button>
        </div>
      </div>
    </div>

    <div class="kanban-board">
      <div v-for="col in columns" :key="col.id" class="kanban-column">
        <h3 class="column-title" :style="{ borderTopColor: col.color }">
          <span>{{ col.title }}</span>
          <span class="badge">{{ col.tasks.length }}</span>
        </h3>
        <div class="column-body">
          <div v-for="task in col.tasks" :key="task.id" class="kanban-task">
            <h4>{{ task.title }}</h4>
            <p v-if="task.desc" class="task-desc">{{ task.desc }}</p>
            <div class="task-actions">
              <select v-model="task.statusId" @change="moveTask(task, col.id)" class="filter-select select-sm">
                <option v-for="c in columns" :key="c.id" :value="c.id">{{ c.title }}</option>
              </select>
              <button class="icon-btn-sm text-danger" title="Excluir" @click="deleteTask(task, col.id)">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
          <div v-if="col.tasks.length === 0" class="empty-col">Nenhuma tarefa</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useToast } from '@/composables/useToast'
import { getKanbanBoard, saveKanbanBoard, type Column, type Task } from '@/services/kanban.service'

const { success: toastSuccess, error: toastError } = useToast()

const showNewTaskModal = ref(false)
const newTaskTitle = ref('')
const newTaskDesc = ref('')
const loading = ref(true)

const columns = ref<Column[]>([])

onMounted(async () => {
  try {
    columns.value = await getKanbanBoard()
  } catch (e) {
    toastError('Erro ao carregar o quadro Kanban.')
  } finally {
    loading.value = false
  }
})

async function saveBoard() {
  try {
    await saveKanbanBoard(columns.value)
  } catch (e) {
    toastError('Erro ao salvar no Firestore.')
  }
}

function generateId() {
  return Math.random().toString(36).substr(2, 9)
}

async function newTask() {
  if (!newTaskTitle.value.trim()) {
    toastError('Digite um título para a tarefa!')
    return
  }
  const t: Task = { id: generateId(), title: newTaskTitle.value.trim(), desc: newTaskDesc.value.trim(), statusId: 'backlog' }
  columns.value[0].tasks.push(t)
  toastSuccess('Tarefa criada no Backlog!')
  newTaskTitle.value = ''
  newTaskDesc.value = ''
  showNewTaskModal.value = false
  await saveBoard()
}

async function deleteTask(task: Task, colId: string) {
  const col = columns.value.find(c => c.id === colId)
  if (col) {
    col.tasks = col.tasks.filter(t => t.id !== task.id)
    toastSuccess('Tarefa excluída.')
    await saveBoard()
  }
}

async function moveTask(task: Task, oldColId: string) {
  const oldCol = columns.value.find(c => c.id === oldColId)
  const newCol = columns.value.find(c => c.id === task.statusId)
  if (oldCol && newCol && oldCol.id !== newCol.id) {
    oldCol.tasks = oldCol.tasks.filter(t => t.id !== task.id)
    newCol.tasks.push(task)
    await saveBoard()
  }
}
</script>

<style scoped>
.kanban-container { padding: 1rem; }
.kanban-board { display: flex; gap: 1rem; overflow-x: auto; padding-bottom: 1rem; }
.kanban-column { flex: 1; min-width: 280px; background: var(--bg-surface); border-radius: 8px; border: 1px solid var(--border); display: flex; flex-direction: column; }
.column-title { 
  padding: 1rem; margin: 0; font-size: 0.95rem; font-weight: 600; 
  border-bottom: 1px solid var(--border-light); 
  border-top: 4px solid; border-top-left-radius: 8px; border-top-right-radius: 8px; 
  display: flex; justify-content: space-between; align-items: center;
}
.column-title .badge { background: var(--bg-input); padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; color: var(--text-muted); }
.column-body { padding: 1rem; flex: 1; display: flex; flex-direction: column; gap: 0.75rem; }
.kanban-task { background: var(--bg-card); border: 1px solid var(--border-light); padding: 1rem; border-radius: 6px; box-shadow: var(--shadow-sm); transition: transform 0.2s, box-shadow 0.2s; }
.kanban-task:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
.kanban-task h4 { margin: 0 0 0.75rem 0; font-size: 0.9rem; font-weight: 500; color: var(--text-primary); }
.task-desc { margin: 0 0 0.75rem 0; font-size: 0.8rem; color: var(--text-muted); line-height: 1.4; }
.task-actions { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
.select-sm { padding: 4px 8px; font-size: 0.75rem; border-radius: 4px; border: 1px solid var(--border); background: var(--bg-input); color: var(--text-primary); flex: 1; }
.icon-btn-sm { background: transparent; border: none; font-size: 1rem; cursor: pointer; padding: 4px; border-radius: 4px; transition: background 0.2s; }
.icon-btn-sm:hover { background: rgba(239, 68, 68, 0.1); }
.text-danger { color: #ef4444; }

.bo-page-header { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 2rem; }
.bo-page-header h1 { font-size: 1.6rem; font-weight: 800; margin-bottom: 6px; color: var(--text-primary); }
.bo-page-header p { color: var(--text-muted); font-size: 0.9rem; margin: 0; }
.icon-btn { background: none; border: none; font-size: 1.2rem; cursor: pointer; padding: 4px; border-radius: 6px; transition: background 0.2s; }
.icon-btn:hover { background: rgba(255,255,255,0.05); }

/* Modal */
.modal-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; }
.modal-content { background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px; padding: 1.5rem; width: 100%; box-shadow: var(--shadow-lg); }
.modal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 1px solid var(--border-light); }
.modal-header h3 { font-size: 1.1rem; margin: 0; color: var(--text-primary); }
.form-field { display: flex; flex-direction: column; gap: 6px; }
.form-label { font-size: 0.75rem; font-weight: 700; color: var(--text-muted); letter-spacing: 0.5px; }
.filter-select { background: var(--bg-input); border: 1px solid var(--border); border-radius: 8px; padding: 10px 12px; color: var(--text-primary); font-size: 0.9rem; width: 100%; transition: border-color 0.2s; }
.filter-select:focus { outline: none; border-color: var(--primary); }
.empty-col { text-align: center; color: var(--text-muted); font-size: 0.85rem; padding: 2rem 0; border: 2px dashed var(--border-light); border-radius: 8px; }
</style>
