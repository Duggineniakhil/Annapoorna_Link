import type { Org, Role, User } from "../types/api";

export interface DemoAccount {
  account_id: string;
  role: Role;
  label: string;
  area: string;
  org?: Org;
  user: User;
}

// Fictional, area-level demo accounts (docs/04-sample-data-plan.md §4).
export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    account_id: "donor-sri-sai",
    role: "donor",
    label: "Sri Sai Caterers",
    area: "Kukatpally",
    org: {
      id: "org-sri-sai",
      type: "donor",
      donor_type: "caterer",
      name: "Sri Sai Caterers",
      area: "Kukatpally",
      lat: 17.4849,
      lng: 78.4138,
    },
    user: {
      id: "user-sri-sai",
      role: "donor",
      display_name: "Sri Sai Caterers",
      org_id: "org-sri-sai",
      lang: "en",
    },
  },
  {
    account_id: "donor-green-valley",
    role: "donor",
    label: "Green Valley Hostel Mess",
    area: "Ameerpet",
    org: {
      id: "org-green-valley",
      type: "donor",
      donor_type: "hostel_mess",
      name: "Green Valley Hostel Mess",
      area: "Ameerpet",
      lat: 17.4375,
      lng: 78.4483,
    },
    user: {
      id: "user-green-valley",
      role: "donor",
      display_name: "Green Valley Hostel Mess",
      org_id: "org-green-valley",
      lang: "en",
    },
  },
  {
    account_id: "receiver-asha",
    role: "receiver",
    label: "Asha Night Shelter",
    area: "Mehdipatnam",
    org: {
      id: "org-asha",
      type: "receiver",
      name: "Asha Night Shelter",
      area: "Mehdipatnam",
      lat: 17.395,
      lng: 78.44,
      veg_only: true,
    },
    user: {
      id: "user-asha",
      role: "receiver",
      display_name: "Asha Night Shelter",
      org_id: "org-asha",
      lang: "en",
    },
  },
  {
    account_id: "receiver-annadanam",
    role: "receiver",
    label: "Annadanam Community Kitchen",
    area: "Begumpet",
    org: {
      id: "org-annadanam",
      type: "receiver",
      name: "Annadanam Community Kitchen",
      area: "Begumpet",
      lat: 17.4431,
      lng: 78.4664,
    },
    user: {
      id: "user-annadanam",
      role: "receiver",
      display_name: "Annadanam Community Kitchen",
      org_id: "org-annadanam",
      lang: "en",
    },
  },
  {
    account_id: "volunteer-ravi",
    role: "volunteer",
    label: "Ravi K.",
    area: "Kukatpally",
    user: {
      id: "user-ravi",
      role: "volunteer",
      display_name: "Ravi K.",
      lang: "en",
      vehicle: "two-wheeler",
    },
  },
  {
    account_id: "sponsor-csr",
    role: "sponsor",
    label: "Demo CSR Sponsor",
    area: "Hyderabad",
    user: {
      id: "user-csr",
      role: "sponsor",
      display_name: "Demo CSR Sponsor",
      lang: "en",
    },
  },
];
