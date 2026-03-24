-- Products table modification
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS is_affiliate_eligible boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS affiliate_commission_rate numeric(5,2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS affiliate_payout_type character varying DEFAULT 'percentage',
  ADD COLUMN IF NOT EXISTS affiliate_fixed_amount integer DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_products_affiliate_eligible
  ON products (is_affiliate_eligible) WHERE is_affiliate_eligible = true;

-- Affiliate Applications
CREATE TABLE IF NOT EXISTS affiliate_applications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name character varying NOT NULL,
  email character varying NOT NULL,
  phone character varying,
  city character varying,
  instagram_link text,
  facebook_link text,
  twitter_link text,
  youtube_link text,
  selling_experience text,
  products_promoted text,
  reason text,
  status character varying NOT NULL DEFAULT 'pending',
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_aff_apps_status ON affiliate_applications (status);
CREATE INDEX IF NOT EXISTS idx_aff_apps_email ON affiliate_applications (email);

-- Affiliates
CREATE TABLE IF NOT EXISTS affiliates (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name character varying NOT NULL,
  email character varying NOT NULL UNIQUE,
  phone character varying,
  city character varying,
  status character varying NOT NULL DEFAULT 'pending',
  level character varying DEFAULT 'Ambassador',
  referral_code character varying NOT NULL UNIQUE,
  total_sales numeric DEFAULT 0,
  total_commission numeric DEFAULT 0,
  available_balance numeric DEFAULT 0,
  instagram_link text,
  facebook_link text,
  twitter_link text,
  youtube_link text,
  upi_id character varying,
  bank_name character varying,
  account_number character varying,
  ifsc_code character varying,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_affiliates_user_id ON affiliates (user_id);
CREATE INDEX IF NOT EXISTS idx_affiliates_email ON affiliates (email);
CREATE INDEX IF NOT EXISTS idx_affiliates_referral_code ON affiliates (referral_code);
CREATE INDEX IF NOT EXISTS idx_affiliates_status ON affiliates (status);

-- Affiliate Links
CREATE TABLE IF NOT EXISTS affiliate_links (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  affiliate_id uuid NOT NULL REFERENCES affiliates(id),
  product_id uuid REFERENCES products(id),
  slug character varying NOT NULL UNIQUE,
  is_active boolean DEFAULT true,
  total_clicks integer DEFAULT 0,
  total_conversions integer DEFAULT 0,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

-- Affiliate Clicks
CREATE TABLE IF NOT EXISTS affiliate_clicks (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  link_id uuid NOT NULL REFERENCES affiliate_links(id),
  ip_address character varying,
  user_agent text,
  referrer text,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

-- Affiliate Sales
CREATE TABLE IF NOT EXISTS affiliate_sales (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  affiliate_id uuid NOT NULL REFERENCES affiliates(id),
  order_id uuid NOT NULL REFERENCES orders(id),
  link_id uuid REFERENCES affiliate_links(id),
  sale_amount numeric NOT NULL,
  commission_rate numeric(5,2) NOT NULL,
  commission_amount numeric NOT NULL,
  status character varying DEFAULT 'pending',
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP
);
