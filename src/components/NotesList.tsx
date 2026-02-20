import { useState } from 'react';
import { Note, generateId } from '../types/car';

interface Props {
  notes: Note[];
  onChange: (notes: Note[]) => void;
  readOnly?: boolean;
}

export default function NotesList({ notes, onChange, readOnly = false }: Props) {
  const [newNote, setNewNote] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  function handleAdd() {
    if (!newNote.trim()) return;
    const note: Note = {
      id: generateId(),
      text: newNote.trim(),
      createdAt: new Date().toISOString(),
    };
    onChange([note, ...notes]);
    setNewNote('');
  }

  function handleDelete(id: string) {
    onChange(notes.filter(n => n.id !== id));
  }

  function handleEdit(note: Note) {
    setEditingId(note.id);
    setEditText(note.text);
  }

  function handleSaveEdit() {
    if (!editText.trim() || !editingId) return;
    onChange(notes.map(n => (n.id === editingId ? { ...n, text: editText.trim() } : n)));
    setEditingId(null);
    setEditText('');
  }

  function formatDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString('he-IL', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return (
    <div className="notes-list">
      {!readOnly && (
        <div className="note-add">
          <textarea
            placeholder="הוסף הערה או עדכון..."
            value={newNote}
            onChange={e => setNewNote(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleAdd();
              }
            }}
            rows={2}
          />
          <button className="btn btn-primary btn-sm" onClick={handleAdd} disabled={!newNote.trim()}>
            הוסף
          </button>
        </div>
      )}

      {notes.length === 0 ? (
        <p className="notes-empty">אין הערות עדיין</p>
      ) : (
        <div className="notes-items">
          {notes.map(note => (
            <div key={note.id} className="note-item">
              {editingId === note.id ? (
                <div className="note-edit">
                  <textarea
                    value={editText}
                    onChange={e => setEditText(e.target.value)}
                    rows={2}
                    autoFocus
                  />
                  <div className="note-edit-actions">
                    <button className="btn btn-primary btn-sm" onClick={handleSaveEdit}>שמור</button>
                    <button className="btn btn-text btn-sm" onClick={() => setEditingId(null)}>ביטול</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="note-text">{note.text}</div>
                  <div className="note-meta">
                    <span className="note-date">{formatDate(note.createdAt)}</span>
                    {!readOnly && (
                      <span className="note-actions">
                        <button className="note-action-btn" onClick={() => handleEdit(note)} title="ערוך">✏️</button>
                        <button className="note-action-btn" onClick={() => handleDelete(note.id)} title="מחק">🗑️</button>
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
