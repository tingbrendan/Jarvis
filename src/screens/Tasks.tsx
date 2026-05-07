import { useState, useRef } from 'react'
import { useTasksStore, useSettingsStore, type Task, type Priority, type TaskStatus } from '../store'
import { QuickCapture } from '../components/QuickCapture'
import { Sheet } from '../components/Sheet'
import { showToast } from '../components/Toast'

const PRIORITY_COLORS: Record<Priority, string> = { high: 'var(--red)', medium: 'var(--amber)', low: 'var(--t3)' }
const STATUS_LABELS: Record<TaskStatus, string> = { todo: 'To Do', 'in-progress': 'In Progress', blocked: 'Blocked', done: 'Done' }

type Filter = 'active' | 'done' | 'all'

export function Tasks() {
  const { tasks, updateTask, deleteTask, addTask } = useTasksStore()
  const { settings } = useSettingsStore()
  const [filter, setFilter] = useState<Filter>('active')
  const [editTask, setEditTask] = useState<Task | null>(null)
  const [addOpen, setAddOpen] = useState(false)

  const filtered = tasks.filter((t) => {
    if (filter === 'active') return t.status !== 'done'
    if (filter === 'done') return t.status === 'done'
    return true
  })

  const byPriority = [...filtered].sort((a, b) => {
    const order: Record<Priority, number> = { high: 0, medium: 1, low: 2 }
    return order[a.priority] - order[b.priority]
  })

  return (
    <div className="screen">
      <QuickCapture />
      <div className="screen-inner">
        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          {(['active', 'done', 'all'] as Filter[]).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-ghost'}`}
              style={{ flex: 1, textTransform: 'capitalize' }}>
              {f}
            </button>
          ))}
        </div>

        {byPriority.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">✓</div>
            <p>{filter === 'active' ? 'No open tasks. Add one above.' : 'Nothing here yet.'}</p>
          </div>
        ) : (
          byPriority.map((task) => (
            <SwipeableTask key={task.id} task={task}
              onComplete={() => { updateTask(task.id, { status: 'done' }); navigator.vibrate?.(40); showToast('Task done ✓') }}
              onDelete={() => { deleteTask(task.id); showToast('Deleted', { label: 'Undo', fn: () => addTask({ title: task.title, module: task.module, priority: task.priority, status: task.status, dueDate: task.dueDate, description: task.description }) }) }}
              onEdit={() => setEditTask(task)}
            />
          ))
        )}
      </div>

      {/* Edit Sheet */}
      <Sheet open={!!editTask} onClose={() => setEditTask(null)} title="Edit Task" height="70vh">
        {editTask && (
          <TaskForm
            initial={editTask}
            modules={settings.workModules}
            onSave={(patch) => { updateTask(editTask.id, patch); setEditTask(null); showToast('Saved') }}
            onCancel={() => setEditTask(null)}
          />
        )}
      </Sheet>

      {/* Add Sheet */}
      <Sheet open={addOpen} onClose={() => setAddOpen(false)} title="New Task" height="70vh">
        <TaskForm
          modules={settings.workModules}
          onSave={(data) => {
            addTask({ title: data.title ?? '', module: data.module ?? 'Personal', priority: data.priority ?? 'medium', status: 'todo', description: data.description, dueDate: data.dueDate })
            setAddOpen(false)
            showToast('Task added')
          }}
          onCancel={() => setAddOpen(false)}
        />
      </Sheet>
    </div>
  )
}

// ─── Swipeable task row ───────────────────────────────────────────────────────

function SwipeableTask({ task, onComplete, onDelete, onEdit }: {
  task: Task
  onComplete: () => void
  onDelete: () => void
  onEdit: () => void
}) {
  const startX = useRef(0)
  const elRef = useRef<HTMLDivElement>(null)
  const [offset, setOffset] = useState(0)
  const [swiped, setSwiped] = useState<'left' | 'right' | null>(null)

  const onTouchStart = (e: React.TouchEvent) => { startX.current = e.touches[0]!.clientX }
  const onTouchMove = (e: React.TouchEvent) => {
    const dx = e.touches[0]!.clientX - startX.current
    setOffset(Math.max(-80, Math.min(80, dx)))
  }
  const onTouchEnd = () => {
    if (offset < -60) {
      setSwiped('left')
      setTimeout(onDelete, 300)
    } else if (offset > 60) {
      setSwiped('right')
      setTimeout(onComplete, 300)
    }
    setOffset(0)
  }

  const isDone = task.status === 'done'

  return (
    <div style={{ position: 'relative', marginBottom: 8, overflow: 'hidden', borderRadius: 'var(--radius)' }}>
      {/* Background actions */}
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
        justifyContent: offset < 0 ? 'flex-end' : 'flex-start',
        padding: '0 20px',
        background: offset < -30 ? 'rgba(248,113,113,0.2)' : offset > 30 ? 'rgba(74,222,128,0.2)' : 'transparent',
        transition: 'background 0.15s',
      }}>
        {offset < -30 && <span style={{ color: 'var(--red)', fontWeight: 700, fontSize: '0.85rem' }}>Delete</span>}
        {offset > 30 && <span style={{ color: 'var(--green)', fontWeight: 700, fontSize: '0.85rem' }}>Done ✓</span>}
      </div>

      <div
        ref={elRef}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={onEdit}
        className="card"
        style={{
          transform: swiped ? `translateX(${swiped === 'left' ? '-100%' : '100%'})` : `translateX(${offset}px)`,
          transition: offset === 0 ? 'transform 0.2s' : 'none',
          opacity: isDone ? 0.55 : 1,
          cursor: 'pointer',
        }}
      >
        <div className="row-between">
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontWeight: 500, color: 'var(--t1)',
              textDecoration: isDone ? 'line-through' : 'none',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {task.title}
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
              <span className={`chip ${task.priority === 'high' ? 'chip-red' : task.priority === 'medium' ? 'chip-amber' : 'chip-muted'}`}>
                {task.priority}
              </span>
              <span className="chip chip-muted">{task.module}</span>
              {task.status !== 'todo' && (
                <span className={`chip ${task.status === 'done' ? 'chip-green' : task.status === 'blocked' ? 'chip-red' : 'chip-accent'}`}>
                  {STATUS_LABELS[task.status]}
                </span>
              )}
            </div>
          </div>
          <div style={{ width: 8, borderRadius: 2, height: 36, background: PRIORITY_COLORS[task.priority], flexShrink: 0, marginLeft: 12 }} />
        </div>
        {task.dueDate && (
          <div style={{ marginTop: 6, fontSize: '0.75rem', color: 'var(--t3)' }}>
            Due {task.dueDate}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Task form ────────────────────────────────────────────────────────────────

function TaskForm({ initial, modules, onSave, onCancel }: {
  initial?: Partial<Task>
  modules: string[]
  onSave: (data: Partial<Task>) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState({
    title: initial?.title ?? '',
    module: initial?.module ?? 'Personal',
    priority: initial?.priority ?? 'medium' as Priority,
    status: initial?.status ?? 'todo' as TaskStatus,
    description: initial?.description ?? '',
    dueDate: initial?.dueDate ?? '',
  })

  return (
    <div className="col" style={{ gap: 12 }}>
      <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
        placeholder="Task title" autoFocus />
      <select value={form.module} onChange={(e) => setForm({ ...form, module: e.target.value })}>
        {['Personal', ...modules].map((m) => <option key={m}>{m}</option>)}
      </select>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })}>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as TaskStatus })}>
          {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
        style={{ colorScheme: 'dark' }} />
      <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
        placeholder="Notes (optional)" />
      <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
        <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onCancel}>Cancel</button>
        <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => form.title && onSave(form)}>Save</button>
      </div>
    </div>
  )
}
