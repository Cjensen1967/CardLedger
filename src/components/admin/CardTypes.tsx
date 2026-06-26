import { useState } from 'react';
import type { CardType } from '../../types';

interface Props {
  cardTypes: CardType[];
  onAdd: (ct: Omit<CardType, 'id'>) => void;
  onUpdate: (ct: CardType) => void;
  onToggleActive: (id: string) => void;
}

const BLANK: Omit<CardType, 'id'> = {
  name: '',
  decksPerBox: 8,
  boxesPerCase: 0,
  active: true,
};

export default function CardTypesAdmin({ cardTypes, onAdd, onUpdate, onToggleActive }: Props) {
  const [form, setForm] = useState<Omit<CardType, 'id'>>(BLANK);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<CardType | null>(null);
  const [error, setError] = useState('');

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) { setError('Name is required.'); return; }
    if (form.decksPerBox < 1) { setError('Decks per box must be at least 1.'); return; }
    const duplicate = cardTypes.some(
      ct => ct.name.toLowerCase() === form.name.trim().toLowerCase()
    );
    if (duplicate) { setError('A card type with that name already exists.'); return; }
    onAdd({ ...form, name: form.name.trim() });
    setForm(BLANK);
  }

  function startEdit(ct: CardType) {
    setEditingId(ct.id);
    setEditForm({ ...ct });
  }

  function saveEdit() {
    if (!editForm) return;
    if (!editForm.name.trim()) return;
    onUpdate({ ...editForm, name: editForm.name.trim() });
    setEditingId(null);
    setEditForm(null);
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-800 mb-1">Card Types</h2>
      <p className="text-sm text-gray-500 mb-6">
        Define card types, decks per box, and boxes per case. These values are snapshotted on
        every transaction so historical records are never affected by changes here.
      </p>

      {/* Existing card types */}
      <div className="mb-8">
        {cardTypes.length === 0 ? (
          <p className="text-sm text-gray-400 italic">No card types defined yet.</p>
        ) : (
          <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-center">Decks / Box</th>
                <th className="px-4 py-3 text-center">Boxes / Case</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {cardTypes.map(ct => (
                <tr key={ct.id} className={ct.active ? '' : 'opacity-50'}>
                  {editingId === ct.id && editForm ? (
                    <>
                      <td className="px-4 py-2">
                        <input
                          value={editForm.name}
                          onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                          className="border border-gray-300 rounded px-2 py-1 w-full text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="px-4 py-2 text-center">
                        <input
                          type="number"
                          min={1}
                          value={editForm.decksPerBox}
                          onChange={e =>
                            setEditForm({ ...editForm, decksPerBox: Number(e.target.value) })
                          }
                          className="border border-gray-300 rounded px-2 py-1 w-20 text-sm text-center focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="px-4 py-2 text-center">
                        <input
                          type="number"
                          min={1}
                          value={editForm.boxesPerCase}
                          onChange={e =>
                            setEditForm({ ...editForm, boxesPerCase: Number(e.target.value) })
                          }
                          className="border border-gray-300 rounded px-2 py-1 w-20 text-sm text-center focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="px-4 py-2 text-center text-gray-400">—</td>
                      <td className="px-4 py-2 text-right space-x-2">
                        <button
                          onClick={saveEdit}
                          className="text-indigo-600 hover:underline text-sm"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => { setEditingId(null); setEditForm(null); }}
                          className="text-gray-400 hover:underline text-sm"
                        >
                          Cancel
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 font-medium text-gray-800">{ct.name}</td>
                      <td className="px-4 py-3 text-center text-gray-600">{ct.decksPerBox}</td>
                      <td className="px-4 py-3 text-center text-gray-600">
                        {ct.boxesPerCase > 0 ? ct.boxesPerCase : <span className="text-amber-500 font-medium">Not set</span>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${
                            ct.active
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {ct.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right space-x-3">
                        <button
                          onClick={() => startEdit(ct)}
                          className="text-indigo-600 hover:underline text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onToggleActive(ct.id)}
                          className="text-gray-400 hover:underline text-sm"
                        >
                          {ct.active ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add new card type */}
      <div className="bg-white border border-gray-200 rounded-lg p-5 max-w-lg">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Add Card Type</h3>
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={form.name}
              onChange={e => { setForm({ ...form, name: e.target.value }); setError(''); }}
              placeholder="e.g. Baccarat"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Decks per Box
              </label>
              <input
                type="number"
                min={1}
                value={form.decksPerBox}
                onChange={e => setForm({ ...form, decksPerBox: Number(e.target.value) })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Boxes per Case
              </label>
              <input
                type="number"
                min={1}
                value={form.boxesPerCase === 0 ? '' : form.boxesPerCase}
                onChange={e => setForm({ ...form, boxesPerCase: Number(e.target.value) })}
                placeholder="e.g. 16"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            className="bg-indigo-600 text-white px-5 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            Add Card Type
          </button>
        </form>
      </div>
    </div>
  );
}
