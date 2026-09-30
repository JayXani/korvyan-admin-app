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

export async function getKanbanBoard(): Promise<Column[]> {
  const d = await getDoc(doc(db, BOARD_DOC))
  if (d.exists()) {
    return d.data().columns as Column[]
  }
  return [
    { id: 'backlog', title: 'Backlog', color: '#9ca3af', tasks: [] },
    { id: 'standby', title: 'Standby', color: '#fcd34d', tasks: [] },
    { id: 'doing', title: 'Fazendo', color: '#8b5cf6', tasks: [] },
    { id: 'done', title: 'Concluído', color: '#34d399', tasks: [] },
  ]
}

export async function saveKanbanBoard(columns: Column[]): Promise<void> {
  await setDoc(doc(db, BOARD_DOC), { columns })
}
