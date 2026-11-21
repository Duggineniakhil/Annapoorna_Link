-- Annapoorna Link initial schema (docs/03-architecture.md §3)
CREATE TABLE IF NOT EXISTS orgs (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('donor', 'receiver')),
  donor_type TEXT CHECK (donor_type IN ('caterer', 'wedding_hall', 'hostel_mess', 'restaurant')),
  name TEXT NOT NULL,
  area TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  veg_only BOOLEAN NOT NULL DEFAULT FALSE,
  open_from TEXT,
  open_to TEXT,
  reliability NUMERIC(4, 3) NOT NULL DEFAULT 0.8
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  org_id TEXT REFERENCES orgs(id),
  role TEXT NOT NULL CHECK (role IN ('donor', 'receiver', 'volunteer', 'sponsor')),
  display_name TEXT NOT NULL,
  lang TEXT NOT NULL DEFAULT 'en' CHECK (lang IN ('en', 'te')),
  vehicle TEXT CHECK (vehicle IN ('two_wheeler', 'car')),
  capacity_meals INTEGER,
  available BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS receiver_needs (
  org_id TEXT NOT NULL REFERENCES orgs(id),
  date DATE NOT NULL,
  meals_needed INTEGER NOT NULL DEFAULT 0 CHECK (meals_needed >= 0),
  meals_received INTEGER NOT NULL DEFAULT 0 CHECK (meals_received >= 0),
  PRIMARY KEY (org_id, date)
);

CREATE TABLE IF NOT EXISTS listings (
  id TEXT PRIMARY KEY,
  donor_org_id TEXT NOT NULL REFERENCES orgs(id),
  items JSONB NOT NULL,
  total_meals INTEGER NOT NULL CHECK (total_meals >= 0),
  veg BOOLEAN NOT NULL,
  allergens TEXT[] NOT NULL DEFAULT '{}',
  storage TEXT NOT NULL CHECK (storage IN ('hot', 'room', 'chilled')),
  cooked_at TIMESTAMPTZ NOT NULL,
  pickup_by TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('posted', 'offered', 'claimed', 'volunteer_assigned', 'picked_up', 'delivered', 'expired', 'cancelled')),
  pickup_code TEXT CHECK (pickup_code ~ '^[0-9]{4}$'),
  delivery_code TEXT CHECK (delivery_code ~ '^[0-9]{4}$'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  posted_in_ms INTEGER NOT NULL DEFAULT 0 CHECK (posted_in_ms >= 0)
);

CREATE TABLE IF NOT EXISTS offers (
  id TEXT PRIMARY KEY,
  listing_id TEXT NOT NULL REFERENCES listings(id),
  receiver_org_id TEXT NOT NULL REFERENCES orgs(id),
  rank INTEGER NOT NULL CHECK (rank >= 1),
  score NUMERIC(6, 4) NOT NULL,
  reasons JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS pickups (
  id TEXT PRIMARY KEY,
  listing_id TEXT NOT NULL REFERENCES listings(id),
  receiver_org_id TEXT REFERENCES orgs(id),
  volunteer_user_id TEXT REFERENCES users(id),
  status TEXT NOT NULL CHECK (status IN ('posted', 'offered', 'claimed', 'volunteer_assigned', 'picked_up', 'delivered', 'expired', 'cancelled')),
  meals_delivered INTEGER CHECK (meals_delivered >= 0),
  picked_up_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS events (
  id BIGSERIAL PRIMARY KEY,
  listing_id TEXT NOT NULL REFERENCES listings(id),
  type TEXT NOT NULL,
  actor_user_id TEXT REFERENCES users(id),
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS guidance_rules (
  food_category TEXT NOT NULL CHECK (food_category IN ('rice_dish', 'curry', 'bread', 'dry_snack', 'sweet', 'dairy_based', 'salad_cut_fruit')),
  storage TEXT NOT NULL CHECK (storage IN ('hot', 'room', 'chilled')),
  max_window_minutes INTEGER NOT NULL CHECK (max_window_minutes > 0),
  serve_within_minutes INTEGER NOT NULL CHECK (serve_within_minutes > 0),
  guidance_en TEXT NOT NULL,
  guidance_te TEXT NOT NULL,
  PRIMARY KEY (food_category, storage)
);

CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_pickup_by ON listings(pickup_by);
CREATE INDEX IF NOT EXISTS idx_listings_donor_org_id ON listings(donor_org_id);
CREATE INDEX IF NOT EXISTS idx_offers_listing_id ON offers(listing_id);
CREATE INDEX IF NOT EXISTS idx_offers_receiver_org_id ON offers(receiver_org_id);
CREATE INDEX IF NOT EXISTS idx_pickups_listing_id ON pickups(listing_id);
CREATE INDEX IF NOT EXISTS idx_pickups_receiver_org_id ON pickups(receiver_org_id);
CREATE INDEX IF NOT EXISTS idx_pickups_volunteer_user_id ON pickups(volunteer_user_id);
CREATE INDEX IF NOT EXISTS idx_events_listing_id ON events(listing_id);
