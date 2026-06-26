import { useState } from 'react';
import type { Employee } from '../../types';

interface Props {
  employees: Employee[];
  onAdd: (e: Omit<Employee, 'id'>) => void;
  onUpdate: (e: Employee) => void;
  onToggleActive: (id: string) => void;
}

const ROLES: { value: Employee['role']; label: string }[] = [
  { value: 'security', label: 'Security' },
  { value: 'gaming_management', label: 'Gaming Management' },
  { value: 'admin', label: 'Admin' },
];

const BLANK: Omit<Employee, 'id'> = {
  name: '',
  employeeId: '',
  role: 'security',
  active: true,
};

export default function EmployeesAdmin({
  employees,
  onAdd,
  onUpdate,
  onToggleActive,
}: Props) {
  const [form, setForm] = useState<Omit<Employee, 'id'>>(BLANK);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Employee | null>(null);
  const [error, setError] = useState('');
  const [roleFilter, setRoleFilter] = useState<Employee['role'] | 'all'>('all');

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) { setError('Name is required.'); return; }
    if (!form.employeeId.trim()) { setError('Employee ID is required.'); return; }
    const duplicate = employees.some(
      emp => emp.employeeId.toLowerCase() === form.employeeId.trim().toLowerCase()
    );
    if (duplicate) { setError('An employee with that ID already exists.'); return; }
    onAdd({ ...form, name: form.name.trim(), employeeId: form.employeeId.trim() });
    setForm(BLANK);
  }

  function startEdit(emp: Employee) {
    setEditingId(emp.id);
    setEditForm({ ...emp });
  }

  function saveEdit() {
    if (!editForm) return;
    if (!editForm.name.trim() || !editForm.employeeId.trim()) return;
    onUpdate({ ...editForm, name: editForm.name.trim(), employeeId: editForm.employeeId.trim() });
    setEditingId(null);
    setEditForm(null);
  }

  const roleLabel = (role: Employee['role']) =>
    ROLES.find(r => r.value === role)?.label ?? role;

  const roleBadge = (role: Employee['role']) => {
    const colors: Record<Employee['role'], string> = {
      security: 'bg-blue-100 text-blue-700',
      gaming_management: 'bg-purple-100 text-purple-700',
      admin: 'bg-amber-100 text-amber-700',
    };
    return colors[role];
  };

  const filtered =
    roleFilter === 'all' ? employees : employees.filter(e => e.role === roleFilter);

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-800 mb-1">Employees</h2>
      <p className="text-sm text-gray-500 mb-6">
        Manage the employee list used for transaction sign-off. Only active employees appear in
        the transaction form for Security and Gaming Management selection.
      </p>

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        {(['all', 'security', 'gaming_management', 'admin'] as const).map(r => (
          <button
            key={r}
            onClick={() => setRoleFilter(r)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              roleFilter === r
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {r === 'all' ? 'All' : roleLabel(r)}
          </button>
        ))}
      </div>

      {/* Employee table */}
      <div className="mb-8">
        {filtered.length === 0 ? (
          <p className="text-sm text-gray-400 italic">No employees found.</p>
        ) : (
          <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Employee ID</th>
                <th className="px-4 py-3 text-left">Role</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {filtered.map(emp => (
                <tr key={emp.id} className={emp.active ? '' : 'opacity-50'}>
                  {editingId === emp.id && editForm ? (
                    <>
                      <td className="px-4 py-2">
                        <input
                          value={editForm.name}
                          onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                          className="border border-gray-300 rounded px-2 py-1 w-full text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          value={editForm.employeeId}
                          onChange={e =>
                            setEditForm({ ...editForm, employeeId: e.target.value })
                          }
                          className="border border-gray-300 rounded px-2 py-1 w-full text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <select
                          value={editForm.role}
                          onChange={e =>
                            setEditForm({
                              ...editForm,
                              role: e.target.value as Employee['role'],
                            })
                          }
                          className="border border-gray-300 rounded px-2 py-1 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          {ROLES.map(r => (
                            <option key={r.value} value={r.value}>
                              {r.label}
                            </option>
                          ))}
                        </select>
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
                      <td className="px-4 py-3 font-medium text-gray-800">{emp.name}</td>
                      <td className="px-4 py-3 font-mono text-gray-600">{emp.employeeId}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${roleBadge(
                            emp.role
                          )}`}
                        >
                          {roleLabel(emp.role)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${
                            emp.active
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {emp.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right space-x-3">
                        <button
                          onClick={() => startEdit(emp)}
                          className="text-indigo-600 hover:underline text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onToggleActive(emp.id)}
                          className="text-gray-400 hover:underline text-sm"
                        >
                          {emp.active ? 'Deactivate' : 'Activate'}
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

      {/* Add employee */}
      <div className="bg-white border border-gray-200 rounded-lg p-5 max-w-lg">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Add Employee</h3>
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              value={form.name}
              onChange={e => { setForm({ ...form, name: e.target.value }); setError(''); }}
              placeholder="e.g. Jane Smith"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Employee ID / Badge #
            </label>
            <input
              type="text"
              value={form.employeeId}
              onChange={e => { setForm({ ...form, employeeId: e.target.value }); setError(''); }}
              placeholder="e.g. 10042"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={form.role}
              onChange={e => setForm({ ...form, role: e.target.value as Employee['role'] })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {ROLES.map(r => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            className="bg-indigo-600 text-white px-5 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            Add Employee
          </button>
        </form>
      </div>
    </div>
  );
}
