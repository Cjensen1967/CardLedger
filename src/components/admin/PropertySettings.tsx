import { useState, useEffect } from 'react';
import type { PropertySettings } from '../../types';

interface Props {
  settings: PropertySettings;
  onSave: (s: PropertySettings) => void;
}

const PRINT_MODE_OPTIONS: { value: PropertySettings['printMode']; label: string }[] = [
  { value: 'pdf_only', label: 'Generate PDF only (no auto-print)' },
  { value: 'auto_print', label: 'Automatically print after submission' },
  { value: 'prompt', label: 'Prompt user to print after submission' },
  { value: 'configurable', label: 'Let user decide each time' },
];

export default function PropertySettingsForm({ settings, onSave }: Props) {
  const [form, setForm] = useState<PropertySettings>(settings);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  function handleChange(field: keyof PropertySettings, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
    setSaved(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-800 mb-1">Property Settings</h2>
      <p className="text-sm text-gray-500 mb-6">
        Configure the property name and PDF defaults shown on every transaction record.
      </p>

      <form onSubmit={handleSubmit} className="max-w-lg space-y-5">
        {/* Property name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Property Name
          </label>
          <input
            type="text"
            value={form.propertyName}
            onChange={e => handleChange('propertyName', e.target.value)}
            placeholder="e.g. Grand Casino"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* PDF Header */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            PDF Header Text
          </label>
          <input
            type="text"
            value={form.pdfHeaderText}
            onChange={e => handleChange('pdfHeaderText', e.target.value)}
            placeholder="e.g. CONFIDENTIAL — Card Storage Log"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* PDF Footer */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            PDF Footer Text
          </label>
          <input
            type="text"
            value={form.pdfFooterText}
            onChange={e => handleChange('pdfFooterText', e.target.value)}
            placeholder="e.g. Authorized personnel only"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* PDF output directory */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            PDF Output Directory
          </label>
          <input
            type="text"
            value={form.pdfOutputDir}
            onChange={e => handleChange('pdfOutputDir', e.target.value)}
            placeholder="e.g. C:\CardLedger\PDFs"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <p className="text-xs text-gray-400 mt-1">
            Used when the app runs as a desktop application.
          </p>
        </div>

        {/* Print mode */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Print / PDF Behaviour
          </label>
          <select
            value={form.printMode}
            onChange={e => handleChange('printMode', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            {PRINT_MODE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            className="bg-indigo-600 text-white px-5 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            Save Settings
          </button>
          {saved && (
            <span className="text-sm text-green-600 font-medium">✓ Saved</span>
          )}
        </div>
      </form>
    </div>
  );
}
