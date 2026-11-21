import { useT } from "../../i18n";
import type { MessageKey } from "../../i18n/en";

export type ChipOption<V extends string> = { value: V; labelKey: MessageKey };

/** Single-select filter chips in a horizontally scrolling row. */
export function FilterChips<V extends string>({
  options,
  value,
  onChange,
  labelKey,
}: {
  options: ChipOption<V>[];
  value: V;
  onChange: (value: V) => void;
  labelKey: MessageKey;
}) {
  const { t } = useT();
  return (
    <div
      role="group"
      aria-label={t(labelKey)}
      className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4"
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={`min-h-[44px] shrink-0 rounded-full px-4 text-sm font-bold transition-colors ${
              active
                ? "bg-leaf-800 text-white"
                : "bg-white text-leaf-800 ring-1 ring-inset ring-leaf-800/30"
            }`}
          >
            {t(option.labelKey)}
          </button>
        );
      })}
    </div>
  );
}
