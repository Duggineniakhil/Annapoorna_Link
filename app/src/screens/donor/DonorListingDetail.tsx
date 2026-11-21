import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import type { Listing } from "../../types/api";
import { useT } from "../../i18n";
import { useAuth } from "../../auth/AuthContext";
import { config } from "../../config";
import { apiRequest } from "../../services/api";
import { Screen } from "../../components/Screen";
import { Card } from "../../components/ui/Card";
import { Icon } from "../../components/ui/Icon";
import { ListingCard } from "../../components/food/ListingCard";
import { LISTINGS } from "../../mocks/fixtures";

// Minimal detail screen: the listing card, its guidance and the post confirmation.
// The status timeline, handover code and cancel action are added in A5.

export default function DonorListingDetail() {
  const { t, lang } = useT();
  const { id } = useParams();
  const { org } = useAuth();
  const location = useLocation();
  const postedIn = (location.state as { postedInMs?: number } | null)?.postedInMs;
  const [showToast, setShowToast] = useState(postedIn !== undefined);
  const [listing, setListing] = useState<Listing | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiRequest<Listing>("GET", `/api/listings/${id ?? ""}`)
      .then((l) => !cancelled && setListing(l))
      .catch((err: unknown) => {
        if (cancelled) return;
        // Demo listings shown on the donor home live in fixtures, not the mock store.
        const demo = config.useMocks ? LISTINGS.find((l) => l.id === id) : undefined;
        if (demo) setListing(demo);
        else setError(err instanceof Error ? err.message : String(err));
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <Screen titleKey="donor.listing.title" demoData>
      {showToast && postedIn !== undefined && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-2xl bg-leaf-800 p-4 text-white shadow-card"
        >
          <Icon name="check" className="mt-0.5 h-6 w-6 shrink-0 text-turmeric-300" />
          <p className="flex-1 font-bold">
            {t("post.success", { s: Math.max(1, Math.round(postedIn / 1000)) })}
          </p>
          <button
            type="button"
            onClick={() => setShowToast(false)}
            aria-label={t("post.dismiss")}
            className="-m-2 flex h-11 w-11 items-center justify-center rounded-full text-2xl leading-none text-white/80 hover:bg-white/10"
          >
            ×
          </button>
        </div>
      )}

      {error && (
        <p role="alert" className="rounded-2xl bg-chilli-50 p-4 font-medium text-chilli-700">
          {error}
        </p>
      )}

      {listing && (
        <>
          <ListingCard
            listing={listing}
            donorName={org?.name ?? ""}
            area={org?.area ?? ""}
            showSteps
          />
          <Card className="flex flex-col gap-2 p-4">
            <h2 className="flex items-center gap-2 font-bold text-ink">
              <Icon name="info" className="h-5 w-5 text-leaf-700" />
              {t("post.safetyTitle")}
            </h2>
            <p className="text-sm text-ink/80">
              {lang === "te" ? listing.safety.guidance_te : listing.safety.guidance_en}
            </p>
            <p className="text-xs text-ink/50">{t("about.disclaimer")}</p>
          </Card>
        </>
      )}
    </Screen>
  );
}
