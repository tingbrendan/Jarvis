import { useState } from 'react'
import { useTasksStore, useEventsStore, useHabitsStore, useSettingsStore, todayISO, formatTime } from '../store'
import { QuickCapture } from '../components/QuickCapture'
import { RobinhoodTile } from '../components/RobinhoodTile'
import { Sheet } from '../components/Sheet'
import { showToast } from '../components/Toast'
import type { Tab } from '../App'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

interface Props { onNavigate: (tab: Tab) => void }

export function Home({ onNavigate }: Props) {
  const today = todayISO()
  const now = new Date()
  const tasks = useTasksStore((s) => s.tasks)
  const completeTask = useTasksStore((s) => s.completeTask)
  const events = useEventsStore((s) => s.events)
  const { getDay, logHabit } = useHabitsStore()
  const { settings } = useSettingsStore()
  const day = getDay(today)

  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set())
  const [sleepOpen, setSleepOpen] = useState(false)
  const [sleepInput, setSleepInput] = useState('')

  const todayTasks = tasks.filter((t) => t.status !== 'done' && (!t.dueDate || t.dueDate <= today))
  const upcomingEvents = events
    .filter((e) => e.date >= today)
    .sort((a, b) => (a.date + (a.time ?? '')).localeCompare(b.date + (b.time ?? '')))
    .slice(0, 3)

  const handleComplete = (id: string) => {
    if (completedIds.has(id)) return
    setCompletedIds((s) => new Set([...s, id]))
    setTimeout(() => completeTask(id), 400)
    navigator.vibrate?.(40)
    showToast('Task done ✓')
  }

  const logWater = () => {
    logHabit(today, { water: day.water + 1 })
    navigator.vibrate?.(20)
    showToast(`💧 ${day.water + 1} glasses today`)
  }

  const toggleWorkout = () => {
    logHabit(today, { workout: !day.workout })
    navigator.vibrate?.(20)
    showToast(day.workout ? 'Workout removed' : '💪 Workout logged!')
  }

  return (
    <div className="screen">
      <QuickCapture />
      <div className="screen-inner fade-up">

        {/* Date + greeting */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--t3)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            {DAYS[now.getDay()]}, {MONTHS[now.getMonth()]} {now.getDate()}
          </div>
          <h1 style={{ marginTop: 2 }}>{greeting()}</h1>
        </div>

        {/* Habit quick-log strip */}
        <div style={{
          display: 'flex', gap: 10, marginBottom: 20,
        }}>
          <HabitTile
            icon="💧"
            label={`${day.water} / 8`}
            subLabel="glasses"
            active={day.water >= 8}
            onClick={logWater}
          />
          <HabitTile
            icon="💪"
            label={day.workout ? 'Done' : 'Log it'}
            subLabel="workout"
            active={day.workout}
            onClick={toggleWorkout}
          />
          <HabitTile
            icon="😴"
            label={day.sleep > 0 ? `${day.sleep}h` : '—'}
            subLabel="sleep"
            active={day.sleep >= 7}
            onClick={() => { setSleepInput(day.sleep > 0 ? String(day.sleep) : ''); setSleepOpen(true) }}
          />
        </div>

        {/* Robinhood portfolio */}
        <RobinhoodTile
          apiKey={settings.rhApiKey}
          privateKey={settings.rhPrivateKey}
          onOpenSettings={() => onNavigate('more')}
        />

        {/* Tasks due today */}
        <div className="section-header">
          <span className="section-title">Tasks</span>
          <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('tasks')}>See all</button>
        </div>

        {todayTasks.length === 0 ? (
          <div className="card" style={{ color: 'var(--t3)', fontSize: '0.875rem', textAlign: 'center', padding: '20px' }}>
            No open tasks — you're clear 🎉
          </div>
        ) : (
          todayTasks.slice(0, 5).map((task) => (
            <div key={task.id} className="card" style={{
              display: 'flex', alignItems: 'flex-start', gap: 12,
              opacity: completedIds.has(task.id) ? 0.4 : 1,
              transition: 'opacity 0.3s',
            }}>
              <button onClick={() => handleComplete(task.id)} style={{
                width: 22, height: 22, borderRadius: '50%', flexShrink: 0, marginTop: 1,
                border: `2px solid ${completedIds.has(task.id) ? 'var(--accent)' : 'var(--border-active)'}`,
                background: completedIds.has(task.id) ? 'var(--accent)' : 'transparent',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {completedIds.has(task.id) && <span style={{ color: '#fff', fontSize: '0.65rem' }}>✓</span>}
              </button>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 500, fontSize: '0.9rem', color: 'var(--t1)' }}>{task.title}</div>
                <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                  <span className={`chip chip-${task.priority === 'high' ? 'red' : task.priority === 'medium' ? 'amber' : 'muted'}`}>
                    {task.priority}
                  </span>
                  <span className="chip chip-muted">{task.module}</span>
                </div>
              </div>
            </div>
          ))
        )}

        {/* Upcoming events */}
        {upcomingEvents.length > 0 && (
          <>
            <div className="section-header">
              <span className="section-title">Upcoming</span>
              <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('calendar')}>Calendar</button>
            </div>
            {upcomingEvents.map((ev) => (
              <div key={ev.id} className="card row">
                <div style={{
                  width: 40, height: 40, borderRadius: 10, background: 'var(--accent-soft)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <span style={{ fontSize: '0.6rem', color: 'var(--accent2)', fontWeight: 700, textTransform: 'uppercase' }}>
                    {MONTHS[new Date(ev.date + 'T00:00').getMonth()]}
                  </span>
                  <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent2)', lineHeight: 1 }}>
                    {new Date(ev.date + 'T00:00').getDate()}
                  </span>
                </div>
                <div>
                  <div style={{ fontWeight: 500 }}>{ev.title}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--t3)', marginTop: 2 }}>
                    {ev.time ? formatTime(ev.time) : 'All day'}
                    {ev.recurring && ` · ${ev.recurring}`}
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

        <div style={{ height: 8 }} />
      </div>

      <Sheet open={sleepOpen} onClose={() => setSleepOpen(false)} title="Log Sleep" height="40vh">
        <div className="col" style={{ gap: 14, alignItems: 'center' }}>
          <p style={{ color: 'var(--t3)', fontSize: '0.875rem' }}>How many hours did you sleep?</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <button className="btn btn-ghost" style={{ width: 52, height: 52, fontSize: '1.5rem', borderRadius: '50%' }}
              onClick={() => setSleepInput(String(Math.max(0, parseFloat(sleepInput || '0') - 0.5)))}>−</button>
            <span style={{ fontSize: '2.5rem', fontWeight: 700, minWidth: 80, textAlign: 'center' }}>
              {sleepInput || '0'}h
            </span>
            <button className="btn btn-ghost" style={{ width: 52, height: 52, fontSize: '1.5rem', borderRadius: '50%' }}
              onClick={() => setSleepInput(String(Math.min(14, parseFloat(sleepInput || '0') + 0.5)))}>+</button>
          </div>
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => {
            const h = parseFloat(sleepInput)
            if (h > 0) { logHabit(today, { sleep: h }); showToast(`😴 ${h}h logged`) }
            setSleepOpen(false)
          }}>Save</button>
        </div>
      </Sheet>
    </div>
  )
}

function HabitTile({ icon, label, subLabel, active, onClick }: {
  icon: string; label: string; subLabel: string; active: boolean; onClick: () => void
}) {
  return (
    <button onClick={onClick} style={{
      flex: 1, background: active ? 'var(--accent-soft)' : 'var(--bg-2)',
      border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
      borderRadius: 'var(--radius)', padding: '12px 8px',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
      cursor: 'pointer', transition: 'all 0.2s',
    }}>
      <span style={{ fontSize: '1.4rem' }}>{icon}</span>
      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: active ? 'var(--accent2)' : 'var(--t1)' }}>{label}</span>
      <span style={{ fontSize: '0.65rem', color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{subLabel}</span>
    </button>
  )
}
