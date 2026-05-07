import { useState } from 'react'
import { useEventsStore, type Event, todayISO, formatTime } from '../store'
import { QuickCapture } from '../components/QuickCapture'
import { Sheet } from '../components/Sheet'
import { showToast } from '../components/Toast'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const DAYS_FULL = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']

export function Calendar() {
  const { events, addEvent, deleteEvent } = useEventsStore()
  const [newOpen, setNewOpen] = useState(false)
  const [viewEvent, setViewEvent] = useState<Event | null>(null)
  const [form, setForm] = useState({
    title: '', date: todayISO(), time: '', recurring: '' as Event['recurring'] | '',
  })

  const today = todayISO()
  const upcoming = [...events]
    .filter((e) => e.date >= today)
    .sort((a, b) => (a.date + (a.time ?? '')).localeCompare(b.date + (b.time ?? '')))

  const past = [...events]
    .filter((e) => e.date < today)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 10)

  const save = () => {
    if (!form.title.trim() || !form.date) return
    addEvent({ title: form.title, date: form.date, time: form.time || undefined, recurring: (form.recurring || null) as Event['recurring'] })
    setNewOpen(false)
    setForm({ title: '', date: todayISO(), time: '', recurring: '' })
    showToast('Event added')
  }

  return (
    <div className="screen">
      <QuickCapture />
      <div className="screen-inner">
        <div className="row-between" style={{ marginBottom: 16 }}>
          <h2>Calendar</h2>
          <button className="btn btn-primary btn-sm" onClick={() => setNewOpen(true)}>+ Event</button>
        </div>

        {upcoming.length === 0 && past.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">▦</div>
            <p>No events yet. Add one above or use quick capture.</p>
          </div>
        ) : (
          <>
            {upcoming.length > 0 && (
              <>
                <div className="section-header"><span className="section-title">Upcoming</span></div>
                {upcoming.map((ev) => <EventRow key={ev.id} event={ev} onOpen={() => setViewEvent(ev)} />)}
              </>
            )}
            {past.length > 0 && (
              <>
                <div className="section-header" style={{ marginTop: 24 }}><span className="section-title">Past</span></div>
                {past.map((ev) => <EventRow key={ev.id} event={ev} onOpen={() => setViewEvent(ev)} muted />)}
              </>
            )}
          </>
        )}
      </div>

      {/* New event */}
      <Sheet open={newOpen} onClose={() => setNewOpen(false)} title="New Event" height="65vh">
        <div className="col" style={{ gap: 12 }}>
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Event title" autoFocus />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
              style={{ colorScheme: 'dark' }} />
            <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })}
              style={{ colorScheme: 'dark' }} />
          </div>
          <select value={form.recurring ?? ''} onChange={(e) => setForm({ ...form, recurring: e.target.value as Event['recurring'] })}>
            <option value="">One-time</option>
            <option value="daily">Daily</option>
            <option value="weekdays">Weekdays</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setNewOpen(false)}>Cancel</button>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={save}>Add</button>
          </div>
        </div>
      </Sheet>

      {/* View event */}
      <Sheet open={!!viewEvent} onClose={() => setViewEvent(null)} title="Event" height="50vh">
        {viewEvent && (
          <div className="col">
            <h2 style={{ fontSize: '1.2rem' }}>{viewEvent.title}</h2>
            <div style={{ color: 'var(--t2)', fontSize: '0.9rem', marginTop: 4 }}>
              {DAYS_FULL[new Date(viewEvent.date + 'T00:00').getDay()]},{' '}
              {MONTHS[new Date(viewEvent.date + 'T00:00').getMonth()]} {new Date(viewEvent.date + 'T00:00').getDate()}
              {viewEvent.time ? ` at ${formatTime(viewEvent.time)}` : ''}
            </div>
            {viewEvent.recurring && (
              <span className="chip chip-accent" style={{ marginTop: 8, alignSelf: 'flex-start' }}>
                Repeats {viewEvent.recurring}
              </span>
            )}
            <button className="btn btn-danger" style={{ marginTop: 20 }}
              onClick={() => { deleteEvent(viewEvent.id); setViewEvent(null); showToast('Event deleted') }}>
              Delete Event
            </button>
          </div>
        )}
      </Sheet>
    </div>
  )
}

function EventRow({ event, onOpen, muted = false }: { event: Event; onOpen: () => void; muted?: boolean }) {
  const d = new Date(event.date + 'T00:00')
  return (
    <div className="card row" style={{ marginBottom: 8, cursor: 'pointer', opacity: muted ? 0.5 : 1 }} onClick={onOpen}>
      <div style={{
        width: 44, height: 44, borderRadius: 10,
        background: muted ? 'var(--bg-3)' : 'var(--accent-soft)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <span style={{ fontSize: '0.58rem', color: muted ? 'var(--t3)' : 'var(--accent2)', fontWeight: 700, textTransform: 'uppercase' }}>
          {MONTHS[d.getMonth()]}
        </span>
        <span style={{ fontSize: '1.1rem', fontWeight: 700, color: muted ? 'var(--t2)' : 'var(--accent2)', lineHeight: 1 }}>
          {d.getDate()}
        </span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{event.title}</div>
        <div style={{ fontSize: '0.78rem', color: 'var(--t3)', marginTop: 3 }}>
          {event.time ? formatTime(event.time) : 'All day'}
          {event.recurring ? ` · ${event.recurring}` : ''}
        </div>
      </div>
    </div>
  )
}
