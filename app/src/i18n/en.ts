// All user-facing English strings. Every key here must also exist in te.ts.
export const en = {
  "app.name": "Annapoorna Link",
  "app.tagline": "Surplus food to people who need it, before it spoils",

  "lang.toggleLabel": "Change language",
  "lang.en": "EN",
  "lang.te": "తెలుగు",

  "common.demoData": "Demo data",
  "common.back": "Back",
  "common.comingSoon": "This screen is coming soon.",
  "common.account": "Account",
  "common.switchAccount": "Switch account",
  "common.logout": "Log out",

  "role.donor": "Donor",
  "role.receiver": "Receiver",
  "role.volunteer": "Volunteer",
  "role.sponsor": "Sponsor",

  "status.posted": "Posted",
  "status.offered": "Offered",
  "status.claimed": "Claimed",
  "status.volunteer_assigned": "Volunteer assigned",
  "status.picked_up": "Picked up",
  "status.delivered": "Delivered",
  "status.expired": "Expired",
  "status.cancelled": "Cancelled",

  "nav.home": "Home",
  "nav.post": "Post",
  "nav.impact": "Impact",
  "nav.offers": "Offers",
  "nav.needs": "Needs",
  "nav.history": "History",
  "nav.tasks": "Tasks",
  "nav.dashboard": "Dashboard",
  "nav.map": "Map",
  "nav.about": "About",

  "login.title": "Choose a demo account",
  "login.subtitle": "All organisations and people shown are fictional demo data.",
  "login.donorHint": "Caterers, wedding halls, hostel messes and restaurants",
  "login.receiverHint": "Shelters, community kitchens and NGOs",
  "login.volunteerHint": "Pick up and deliver food",
  "login.sponsorHint": "City impact dashboard",
  "login.continueAs": "Continue as {role}",

  "donor.home.title": "My listings",
  "donor.home.postButton": "Post surplus food",
  "donor.home.empty": "No active listings. Post surplus food when you have it.",
  "donor.post.title": "Post surplus food",
  "donor.listing.title": "Listing details",
  "donor.impact.title": "My impact",

  "receiver.offers.title": "Food offers",
  "receiver.offers.empty": "No offers right now. We'll notify you when food is available nearby.",
  "receiver.offer.title": "Offer details",
  "receiver.needs.title": "Today's needs",
  "receiver.history.title": "Received food",

  "volunteer.tasks.title": "Pickup tasks",
  "volunteer.tasks.empty": "No pickup tasks nearby right now.",
  "volunteer.task.title": "Active task",
  "volunteer.history.title": "My deliveries",

  "sponsor.dashboard.title": "City impact",
  "sponsor.map.title": "Activity map",

  "about.title": "About Annapoorna Link",
  "about.body":
    "Annapoorna Link connects surplus food from caterers, wedding halls, hostel messes and restaurants with nearby shelters, community kitchens and NGOs, and coordinates volunteer pickups.",
  "about.disclaimer":
    "Annapoorna Link connects donors and receivers. It does not certify food safety. Receivers should check food before serving.",
  "about.dataNote": "All organisations and people shown are fictional demo data.",

  "notFound.title": "Page not found",
  "notFound.body": "The page you're looking for doesn't exist.",
  "notFound.home": "Go to the start",
} as const;

export type MessageKey = keyof typeof en;
