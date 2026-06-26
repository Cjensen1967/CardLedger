import { NavLink, Outlet } from 'react-router-dom';

const navItems = [
  { to: '/admin/settings', label: '⚙️ Property Settings' },
  { to: '/admin/card-types', label: '🃏 Card Types' },
  { to: '/admin/colors', label: '🎨 Colors' },
  { to: '/admin/employees', label: '👤 Employees' },
  { to: '/admin/packaging', label: '📦 Packaging Rules' },
];

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="bg-indigo-800 text-white px-6 py-4 flex items-center gap-4 shadow">
        <NavLink to="/" className="text-indigo-300 hover:text-white text-sm">
          ← Dashboard
        </NavLink>
        <h1 className="text-xl font-semibold tracking-wide">Admin Panel</h1>
      </header>

      <div className="flex min-h-[calc(100vh-64px)]">
        {/* Sidebar */}
        <nav className="w-56 bg-white border-r border-gray-200 py-4 shrink-0">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `block px-5 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 border-r-4 border-indigo-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Main content */}
        <main className="flex-1 p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
