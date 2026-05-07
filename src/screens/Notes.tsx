import { useState } from 'react'
import { useNotesStore, type Note, type NoteType } from '../store'
import { QuickCapture } from '../components/QuickCapture'
import { Sheet } from '../components/Sheet'
import { showToast } from '../components/Toast'

export function Notes() {
  const { notes, addNote, deleteNote } = useNotesStore()
  const [tab, setTab] = useState<NoteType | 'all'>('all')
  const [editNote, setEditNote] = useState<Note | null>(null)
  const [newOpen, setNewOpen] = useState(false)
  const [form, setForm] = useState({ text: '', type: 'life' as NoteType, category: 'General' })

  const filtered = notes.filter((n) => tab === 'all' || n.type === tab)

  const save = () => {
    if (!form.text.trim()) return
    addNote(form)
    setNewOpen(false)
    setForm({ text: '', type: 'life', category: 'General' })
    showToast('Note saved')
  }

  return (
    <div className="screen">
      <QuickCapture />
      <div className="screen-inner">
        {/* Tab filter */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          {(['all', 'work', 'life'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`btn btn-sm ${tab === t ? 'btn-primary' : 'btn-ghost'}`}
              style={{ flex: 1, textTransform: 'capitalize' }}>{t}</button>
          ))}
          <button className="btn btn-primary btn-sm" onClick={() => setNewOpen(true)}>+</button>
        </div>

        {filtered.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">✎</div>
            <p>No notes yet. Type in the bar above or tap +.</p>
          </div>
        ) : (
          filtered.map((note) => (
            <NoteCard key={note.id} note={note}
              onDelete={() => {
                deleteNote(note.id)
                showToast('Deleted', {
                  label: 'Undo',
                  fn: () => addNote({ text: note.text, type: note.type, category: note.category }),
                })
              }}
              onOpen={() => setEditNote(note)}
            />
          ))
        )}
      </div>

      {/* New note sheet */}
      <Sheet open={newOpen} onClose={() => setNewOpen(false)} title="New Note" height="60vh">
        <div className="col" style={{ gap: 12 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['work', 'life'] as NoteType[]).map((t) => (
              <button key={t} onClick={() => setForm({ ...form, type: t })}
                className={`btn btn-sm ${form.type === t ? 'btn-primary' : 'btn-ghost'}`}
                style={{ flex: 1, textTransform: 'capitalize' }}>{t}</button>
            ))}
          </div>
          <textarea value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })}
            placeholder="What's on your mind?" autoFocus style={{ minHeight: 120 }} />
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setNewOpen(false)}>Cancel</button>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={save}>Save</button>
          </div>
        </div>
      </Sheet>

      {/* View note sheet */}
      <Sheet open={!!editNote} onClose={() => setEditNote(null)} title="Note" height="70vh">
        {editNote && (
          <div className="col">
            <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, color: 'var(--t1)' }}>{editNote.text}</p>
            <div style={{ marginTop: 12, display: 'flex', gap: 6 }}>
              <span className={`chip ${editNote.type === 'work' ? 'chip-accent' : 'chip-green'}`}>{editNote.type}</span>
              <span className="chip chip-muted">{new Date(editNote.createdAt).toLocaleDateString()}</span>
            </div>
            <button className="btn btn-danger" style={{ marginTop: 16 }}
              onClick={() => { deleteNote(editNote.id); setEditNote(null); showToast('Deleted') }}>
              Delete Note
            </button>
          </div>
        )}
      </Sheet>
    </div>
  )
}

function NoteCard({ note, onDelete, onOpen }: { note: Note; onDelete: () => void; onOpen: () => void }) {
  const preview = note.text.length > 120 ? note.text.slice(0, 120) + '…' : note.text

  return (
    <div className="card" style={{ cursor: 'pointer', marginBottom: 8 }} onClick={onOpen}>
      <div className="row-between" style={{ marginBottom: 8 }}>
        <span className={`chip ${note.type === 'work' ? 'chip-accent' : 'chip-green'}`}>{note.type}</span>
        <button onClick={(e) => { e.stopPropagation(); onDelete() }}
          style={{ background: 'none', border: 'none', color: 'var(--t3)', cursor: 'pointer', fontSize: '1.1rem', lineHeight: 1, padding: 4 }}>×</button>
      </div>
      <p style={{ fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--t1)' }}>{preview}</p>
      <div style={{ marginTop: 8, fontSize: '0.72rem', color: 'var(--t3)' }}>
        {new Date(note.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
      </div>
    </div>
  )
}
