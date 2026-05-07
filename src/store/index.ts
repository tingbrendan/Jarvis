import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ─── Types ───────────────────────────────────────────────────────────────────

export type Priority = 'low' | 'medium' | 'high'
export type TaskStatus = 'todo' | 'in-progress' | 'blocked' | 'done'
export type NoteType = 'work' | 'life'

export interface Task {
  id: string
  title: string
  description?: string
  module: string
  priority: Priority
  status: TaskStatus
  dueDate?: string // ISO date string
  createdAt: string
}

export interface Note {
  id: string
  text: string
  type: NoteType
  category: string
  createdAt: string
}

export interface Event {
  id: string
  title: string
  date: string // YYYY-MM-DD
  time?: string // HH:MM
  recurring?: 'daily' | 'weekdays' | 'weekly' | 'monthly' | null
  createdAt: string
}

export interface Idea {
  id: string
  text: string
  excitement: 1 | 2 | 3 | 4 | 5
  createdAt: string
}

export interface HabitDay {
  date: string // YYYY-MM-DD
  water: number // glasses
  sleep: number // hours
  workout: boolean
  mood?: 1 | 2 | 3 | 4 | 5
}

export interface TimeEntry {
  id: string
  date: string
  module: string
  hours: number
  note?: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}

export interface Settings {
  pin: string
  biometricEnabled: boolean
  claudeApiKey: string
  accentColor: string
  notificationsEnabled: boolean
  workModules: string[]
  rhApiKey: string
  rhPrivateKey: string
}

// ─── Tasks Store ─────────────────────────────────────────────────────────────

interface TasksState {
  tasks: Task[]
  addTask: (t: Omit<Task, 'id' | 'createdAt'>) => void
  updateTask: (id: string, patch: Partial<Task>) => void
  deleteTask: (id: string) => void
  completeTask: (id: string) => void
}

export const useTasksStore = create<TasksState>()(
  persist(
    (set) => ({
      tasks: [],
      addTask: (t) =>
        set((s) => ({
          tasks: [
            { ...t, id: crypto.randomUUID(), createdAt: new Date().toISOString() },
            ...s.tasks,
          ],
        })),
      updateTask: (id, patch) =>
        set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) })),
      deleteTask: (id) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),
      completeTask: (id) =>
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === id ? { ...t, status: 'done' } : t)),
        })),
    }),
    { name: 'jarvis-tasks' }
  )
)

// ─── Notes Store ─────────────────────────────────────────────────────────────

interface NotesState {
  notes: Note[]
  addNote: (n: Omit<Note, 'id' | 'createdAt'>) => void
  updateNote: (id: string, patch: Partial<Note>) => void
  deleteNote: (id: string) => void
}

export const useNotesStore = create<NotesState>()(
  persist(
    (set) => ({
      notes: [],
      addNote: (n) =>
        set((s) => ({
          notes: [
            { ...n, id: crypto.randomUUID(), createdAt: new Date().toISOString() },
            ...s.notes,
          ],
        })),
      updateNote: (id, patch) =>
        set((s) => ({ notes: s.notes.map((n) => (n.id === id ? { ...n, ...patch } : n)) })),
      deleteNote: (id) => set((s) => ({ notes: s.notes.filter((n) => n.id !== id) })),
    }),
    { name: 'jarvis-notes' }
  )
)

// ─── Events Store ─────────────────────────────────────────────────────────────

interface EventsState {
  events: Event[]
  addEvent: (e: Omit<Event, 'id' | 'createdAt'>) => void
  updateEvent: (id: string, patch: Partial<Event>) => void
  deleteEvent: (id: string) => void
}

export const useEventsStore = create<EventsState>()(
  persist(
    (set) => ({
      events: [],
      addEvent: (e) =>
        set((s) => ({
          events: [
            { ...e, id: crypto.randomUUID(), createdAt: new Date().toISOString() },
            ...s.events,
          ],
        })),
      updateEvent: (id, patch) =>
        set((s) => ({ events: s.events.map((e) => (e.id === id ? { ...e, ...patch } : e)) })),
      deleteEvent: (id) => set((s) => ({ events: s.events.filter((e) => e.id !== id) })),
    }),
    { name: 'jarvis-events' }
  )
)

// ─── Ideas Store ──────────────────────────────────────────────────────────────

interface IdeasState {
  ideas: Idea[]
  addIdea: (i: Omit<Idea, 'id' | 'createdAt'>) => void
  deleteIdea: (id: string) => void
}

export const useIdeasStore = create<IdeasState>()(
  persist(
    (set) => ({
      ideas: [],
      addIdea: (i) =>
        set((s) => ({
          ideas: [
            { ...i, id: crypto.randomUUID(), createdAt: new Date().toISOString() },
            ...s.ideas,
          ],
        })),
      deleteIdea: (id) => set((s) => ({ ideas: s.ideas.filter((i) => i.id !== id) })),
    }),
    { name: 'jarvis-ideas' }
  )
)

// ─── Habits Store ─────────────────────────────────────────────────────────────

interface HabitsState {
  days: HabitDay[]
  timeLog: TimeEntry[]
  logHabit: (date: string, patch: Partial<Omit<HabitDay, 'date'>>) => void
  addTimeEntry: (e: Omit<TimeEntry, 'id'>) => void
  getDay: (date: string) => HabitDay
}

const defaultDay = (date: string): HabitDay => ({ date, water: 0, sleep: 0, workout: false })

export const useHabitsStore = create<HabitsState>()(
  persist(
    (set, get) => ({
      days: [],
      timeLog: [],
      logHabit: (date, patch) =>
        set((s) => {
          const existing = s.days.find((d) => d.date === date)
          if (existing) {
            return { days: s.days.map((d) => (d.date === date ? { ...d, ...patch } : d)) }
          }
          return { days: [...s.days, { ...defaultDay(date), ...patch }] }
        }),
      addTimeEntry: (e) =>
        set((s) => ({ timeLog: [...s.timeLog, { ...e, id: crypto.randomUUID() }] })),
      getDay: (date) => get().days.find((d) => d.date === date) ?? defaultDay(date),
    }),
    { name: 'jarvis-habits' }
  )
)

// ─── Chat Store ───────────────────────────────────────────────────────────────

interface ChatState {
  messages: ChatMessage[]
  addMessage: (m: Omit<ChatMessage, 'id' | 'createdAt'>) => void
  clearHistory: () => void
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      messages: [],
      addMessage: (m) =>
        set((s) => ({
          messages: [
            ...s.messages,
            { ...m, id: crypto.randomUUID(), createdAt: new Date().toISOString() },
          ],
        })),
      clearHistory: () => set({ messages: [] }),
    }),
    { name: 'jarvis-chat' }
  )
)

// ─── Settings Store ───────────────────────────────────────────────────────────

interface SettingsState {
  settings: Settings
  updateSettings: (patch: Partial<Settings>) => void
  isSetup: boolean
  setSetup: (v: boolean) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: {
        pin: '',
        biometricEnabled: false,
        claudeApiKey: '',
        accentColor: '#7c6af7',
        notificationsEnabled: false,
        workModules: ['JIRA Triage', 'Meetings', 'Training', 'Admin', 'Python', 'Infrastructure'],
        rhApiKey: '',
        rhPrivateKey: '',
      },
      isSetup: false,
      updateSettings: (patch) =>
        set((s) => ({ settings: { ...s.settings, ...patch } })),
      setSetup: (v) => set({ isSetup: v }),
    }),
    { name: 'jarvis-settings' }
  )
)

// ─── Helpers ─────────────────────────────────────────────────────────────────

export const todayISO = () => new Date().toISOString().slice(0, 10)

export const formatDate = (iso: string) => {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export const formatTime = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number)
  const ampm = (h ?? 0) >= 12 ? 'pm' : 'am'
  const hour = (h ?? 0) % 12 || 12
  return `${hour}:${String(m ?? 0).padStart(2, '0')}${ampm}`
}
