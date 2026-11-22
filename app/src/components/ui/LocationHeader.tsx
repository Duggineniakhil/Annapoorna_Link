import { useT } from "../../i18n";
import { Icon } from "./Icon";

/** "Within 8 km of · Begumpet" header (pattern from Olio's listings radius). */
export function LocationHeader({ area, radiusKm }: { area: string; radiusKm: number }) {
  const { t } = useT();
  return (
    <div className="flex flex-col">
      <span className="text-xs font-medium text-ink/70">
        {t("location.within", { km: radiusKm })}
      </span>
      <span className="flex items-center gap-1 text-lg font-bold text-ink">
        <Icon name="pin" className="h-5 w-5 text-leaf-700" />
        {area}
      </span>
    </div>
  );
}
