import { useState } from 'react';
import type { Color, CardType } from '../../types';

interface Props {
  colors: Color[];
  cardTypes: CardType[];
  onAdd: (c: Omit<Color, 'id'>) => void;
  onUpdate: (c: Color) => void;
  onToggleActive: (id: string) => void;
}

const BLANK = (cardTypes: CardType[]): Omit<Color, 'id'> => ({
  name: '',
  cardTypeIds: cardTypes.filter(ct => ct.active).map(ct => ct.id),
  active: true,
});

export default function ColorsAdmin({
  colors,
  cardTypes,
  onAdd,
  onUpdate,
  onToggleActive,
}: Props) {
  const [form, setForm] = useState<Omit<Color, 'id'>>(BLANK(cardTypes));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Color | null>(null);
  const [error, setError] = useState('');

  function toggleCardTypeInForm(
    ctId: string,
    ids: string[],
    setter: (ids: string[]) => void
  ) {
    setter(
      ids.includes(ctId) ? ids.filter(id => id !== ctId) : [...ids, ctId]
    );
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) { setError('Color name is required.'); return; }
    const duplicate = colors.some(
      c => c.name.toLowerCase() === form.name.trim().toLowerCase()
    );
    if (duplicate) { setError('A color with that name already exists.'); return; }
    onAdd({ ...form, name: form.name.trim() });
    setForm(BLANK(cardTypes));
  }

  function startEdit(c: Color) {
    setEditingId(c.id);
    setEditForm({ ...c, cardTypeIds: [...c.cardTypeIds] });
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
      <h2 className="text-2xl font-semibold text-gray-800 mb-1">Colors</h2>
      <p className="text-sm text-gray-500 mb-6">
        Define card colors and assign them to card types. Only active colors assigned to a card
        type will appear in the transaction form.
      </p>

      {/* Existing colors */}
      <div className="mb-8">
        {colors.length === 0 ? (
          <p className="text-sm text-gray-400 italic">No colors defined yet.</p>
        ) : (
          <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left">Color Name</th>
                <th className="px-4 py-3 text-left">Assigned Card Types</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {colors.map(c => {
                const assignedNames = c.cardTypeIds
                  .map(id => cardTypes.find(ct => ct.id === id)?.name)
                  .filter(Boolean)
                  .join(', ');
                return (
                  <tr key={c.id} className={c.active ? '' : 'opacity-50'}>
                    {editingId === c.id && editForm ? (
                      <>
                        <td className="px-4 py-2">
                          <input
                            value={editForm.name}
                            onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                            className="border border-gray-300 rounded px-2 py-1 w-full text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex flex-wrap gap-2">
                            {cardTypes
                              .filter(ct => ct.active)
                              .map(ct => (
                                <label
                                  key={ct.id}
                                  className="flex items-center gap-1 text-sm cursor-pointer"
                                >
                                  <input
                                    type="checkbox"
                                    checked={editForm.cardTypeIds.includes(ct.id)}
                                    onChange={() =>
                                      toggleCardTypeInForm(ct.id, editForm.cardTypeIds, ids =>
                                        setEditForm({ ...editForm, cardTypeIds: ids })
                                      )
                                    }
                                    className="accent-indigo-600"
                                  />
                                  {ct.name}
                                </label>
                              ))}
                          </div>
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
                        <td className="px-4 py-3 font-medium text-gray-800">{c.name}</td>
                        <td className="px-4 py-3 text-gray-600">
                          {assignedNames || <span className="text-amber-500 italic text-xs">None assigned</span>}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${
                              c.active
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-500'
                            }`}
                          >
                            {c.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right space-x-3">
                          <button
                            onClick={() => startEdit(c)}
                            className="text-indigo-600 hover:underline text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => onToggleActive(c.id)}
                            className="text-gray-400 hover:underline text-sm"
                          >
                            {c.active ? 'Deactivate' : 'Activate'}
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Add new color */}
      <div className="bg-white border border-gray-200 rounded-lg p-5 max-w-lg">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Add Color</h3>
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Color Name</label>
            <input
              type="text"
              value={form.name}
              onChange={e => { setForm({ ...form, name: e.target.value }); setError(''); }}
              placeholder="e.g. Blue"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assign to Card Types
            </label>
            {cardTypes.filter(ct => ct.active).length === 0 ? (
              <p className="text-xs text-amber-600">
                No active card types. Add card types first.
              </p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {cardTypes
                  .filter(ct => ct.active)
                  .map(ct => (
                    <label
                      key={ct.id}
                      className="flex items-center gap-1.5 text-sm cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={form.cardTypeIds.includes(ct.id)}
                        onChange={() =>
                          toggleCardTypeInForm(ct.id, form.cardTypeIds, ids =>
                            setForm({ ...form, cardTypeIds: ids })
                          )
                        }
                        className="accent-indigo-600"
                      />
                      {ct.name}
                    </label>
                  ))}
              </div>
            )}
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            className="bg-indigo-600 text-white px-5 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            Add Color
          </button>
        </form>
      </div>
    </div>
  );
}
