import { useT } from "../i18n";
import { Screen, ComingSoon } from "../components/Screen";
import { EmptyState } from "../components/EmptyState";

// Placeholder screens. Each is replaced by its real implementation in a later task (A4–A11).

export function DonorPost() {
  return (
    <Screen titleKey="donor.post.title">
      <ComingSoon />
    </Screen>
  );
}

export function DonorListingDetail() {
  return (
    <Screen titleKey="donor.listing.title" demoData>
      <ComingSoon />
    </Screen>
  );
}

export function DonorImpact() {
  return (
    <Screen titleKey="donor.impact.title" demoData>
      <ComingSoon />
    </Screen>
  );
}

export function ReceiverOffers() {
  const { t } = useT();
  return (
    <Screen titleKey="receiver.offers.title" demoData>
      <EmptyState icon="🍲" message={t("receiver.offers.empty")} />
    </Screen>
  );
}

export function ReceiverOfferDetail() {
  return (
    <Screen titleKey="receiver.offer.title" demoData>
      <ComingSoon />
    </Screen>
  );
}

export function ReceiverNeeds() {
  return (
    <Screen titleKey="receiver.needs.title">
      <ComingSoon />
    </Screen>
  );
}

export function ReceiverHistory() {
  return (
    <Screen titleKey="receiver.history.title" demoData>
      <ComingSoon />
    </Screen>
  );
}

export function VolunteerTasks() {
  const { t } = useT();
  return (
    <Screen titleKey="volunteer.tasks.title" demoData>
      <EmptyState icon="🛵" message={t("volunteer.tasks.empty")} />
    </Screen>
  );
}

export function VolunteerTaskDetail() {
  return (
    <Screen titleKey="volunteer.task.title" demoData>
      <ComingSoon />
    </Screen>
  );
}

export function VolunteerHistory() {
  return (
    <Screen titleKey="volunteer.history.title" demoData>
      <ComingSoon />
    </Screen>
  );
}

export function SponsorDashboard() {
  return (
    <Screen titleKey="sponsor.dashboard.title" demoData>
      <ComingSoon />
    </Screen>
  );
}

export function SponsorMap() {
  return (
    <Screen titleKey="sponsor.map.title" demoData>
      <ComingSoon />
    </Screen>
  );
}
