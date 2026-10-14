import { db } from './firebase.config'
import { doc, getDoc, setDoc } from 'firebase/firestore'

export interface Task {
  id: string
  title: string
  desc?: string
  statusId: string
}

export interface Column {
  id: string
  title: string
  color: string
  tasks: Task[]
}

const BOARD_DOC = 'kanban/board'
const LOCAL_STORAGE_KEY = 'korvyan_kanban_board'

const DEFAULT_INITIAL_COLUMNS: Column[] = [
  {
    id: 'backlog',
    title: 'Backlog',
    color: '#9ca3af',
    tasks: [
      { id: 'task-1', title: 'Configurar domínio customizado do novo tenant', desc: 'Validar apontamento DNS CNAME e certificado SSL na Hostinger', statusId: 'backlog' },
      { id: 'task-2', title: 'Revisar modelos de contratos com cláusulas jurídicas', desc: 'Adicionar termos de vigência e carência de adesão', statusId: 'backlog' }
    ]
  },
  {
    id: 'standby',
    title: 'Standby',
    color: '#fcd34d',
    tasks: [
      { id: 'task-3', title: 'Ajuste de contraste e cores do tenant', desc: 'Validar variáveis dinâmicas de tema e badges nos portais', statusId: 'standby' }
    ]
  },
  {
    id: 'doing',
    title: 'Fazendo',
    color: '#8b5cf6',
    tasks: [
      { id: 'task-4', title: 'Auditoria e validação de contratos pendentes', desc: 'Conferir cadastros de titulares e dependentes ativos', statusId: 'doing' }
    ]
  },
  {
    id: 'done',
    title: 'Concluído',
    color: '#34d399',
    tasks: [
      { id: 'task-5', title: 'Integração da central de notificações e comunicados', desc: 'Disparo de avisos aos clientes e equipe técnica', statusId: 'done' }
    ]
  },
]

export async function getKanbanBoard(): Promise<Column[]> {
  try {
    const d = await getDoc(doc(db, 'kanban', 'board'))
    if (d.exists() && Array.isArray(d.data()?.columns) && d.data()?.columns.length > 0) {
      const cols = d.data().columns as Column[]
      try { localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cols)) } catch {}
      return cols
    }
  } catch (err) {
    console.warn('[KanbanService] Firestore indisponível, usando cache local:', err)
  }

  try {
    const cached = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (cached) {
      const parsed = JSON.parse(cached)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch {}

  // Fallback para colunas iniciais com tarefas demonstrativas
  try { localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(DEFAULT_INITIAL_COLUMNS)) } catch {}
  return DEFAULT_INITIAL_COLUMNS
}

export async function saveKanbanBoard(columns: Column[]): Promise<void> {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(columns))
  } catch {}

  try {
    await setDoc(doc(db, 'kanban', 'board'), { columns })
  } catch (err) {
    console.warn('[KanbanService] Erro ao persistir no Firestore, salvo localmente:', err)
  }
}
