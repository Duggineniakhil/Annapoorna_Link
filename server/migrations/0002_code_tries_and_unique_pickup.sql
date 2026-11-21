-- Wrong-code counters survive restarts; one pickup row per listing.
ALTER TABLE listings ADD COLUMN IF NOT EXISTS pickup_tries INTEGER NOT NULL DEFAULT 0;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS delivery_tries INTEGER NOT NULL DEFAULT 0;
CREATE UNIQUE INDEX IF NOT EXISTS uq_pickups_listing_id ON pickups(listing_id);
