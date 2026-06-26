import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import AdminPanel from './pages/AdminPanel';

function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-indigo-800 text-white px-6 py-5 shadow">
        <h1 className="text-2xl font-bold tracking-wide">🃏 CardLedger</h1>
        <p className="text-indigo-300 text-sm mt-0.5">Casino Card Storage Inventory</p>
      </header>

      <main className="flex-1 px-6 py-10 max-w-2xl w-full mx-auto">
        {/* Placeholder inventory summary */}
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Current Inventory</h2>
          <div className="bg-white border border-gray-200 rounded-lg p-6 text-center text-gray-400 text-sm">
            No card types configured yet.{' '}
            <Link to="/admin/card-types" className="text-indigo-600 hover:underline">
              Set up card types in Admin
            </Link>
            .
          </div>
        </section>

        {/* Action buttons */}
        <section className="mb-10 grid grid-cols-2 gap-4">
          <button
            disabled
            className="bg-green-600 text-white py-5 rounded-xl text-lg font-semibold opacity-40 cursor-not-allowed"
            title="Coming soon"
          >
            ↓ Decks In
          </button>
          <button
            disabled
            className="bg-amber-500 text-white py-5 rounded-xl text-lg font-semibold opacity-40 cursor-not-allowed"
            title="Coming soon"
          >
            ↑ Decks Out
          </button>
          <p className="col-span-2 text-xs text-center text-gray-400">
            Transaction entry coming soon — configure Admin settings first.
          </p>
        </section>

        {/* Admin link */}
        <section>
          <Link
            to="/admin"
            className="block w-full text-center bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-medium transition-colors"
          >
            ⚙️ Open Admin Panel
          </Link>
        </section>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/admin/*" element={<AdminPanel />} />
      </Routes>
    </BrowserRouter>
  );
}
