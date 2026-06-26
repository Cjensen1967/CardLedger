import type { PackagingRules } from '../../types';

interface Props {
  rules: PackagingRules;
  onSave: (r: PackagingRules) => void;
}

export default function PackagingRulesAdmin({ rules, onSave }: Props) {
  function toggle() {
    onSave({ ...rules, allowPartialBoxes: !rules.allowPartialBoxes });
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-800 mb-1">Packaging Rules</h2>
      <p className="text-sm text-gray-500 mb-8">
        Control movement rules that apply across all card types.
      </p>

      <div className="max-w-lg bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
        {/* Allow partial boxes */}
        <div className="flex items-center justify-between px-5 py-4">
          <div>
            <p className="text-sm font-medium text-gray-800">Allow Partial Boxes</p>
            <p className="text-xs text-gray-500 mt-0.5">
              When disabled (default), cards may only move in complete boxes.
              Baccarat: full boxes of 8 decks. Single Deck: full boxes of 12 decks.
              Enable only if partial-box movement is explicitly authorised by management.
            </p>
          </div>
          <button
            onClick={toggle}
            aria-pressed={rules.allowPartialBoxes}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
              rules.allowPartialBoxes ? 'bg-indigo-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform ${
                rules.allowPartialBoxes ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      <div className="mt-4 px-1">
        <p className="text-xs text-gray-400">
          Current status:{' '}
          <span
            className={`font-medium ${
              rules.allowPartialBoxes ? 'text-amber-600' : 'text-green-600'
            }`}
          >
            {rules.allowPartialBoxes ? 'Partial boxes allowed' : 'Full boxes only (recommended)'}
          </span>
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Changes take effect immediately and are saved automatically.
        </p>
      </div>
    </div>
  );
}
