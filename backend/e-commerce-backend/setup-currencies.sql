-- Create currencies table
CREATE TABLE IF NOT EXISTS currencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  code VARCHAR(10) NOT NULL UNIQUE,
  symbol VARCHAR(10) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  exchange_rate DECIMAL(10,6) DEFAULT 1.000000,
  is_base BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on code for faster lookups
CREATE INDEX IF NOT EXISTS idx_currencies_code ON currencies(code);

-- Create index on is_base for faster base currency lookups
CREATE INDEX IF NOT EXISTS idx_currencies_is_base ON currencies(is_base);

-- Create index on is_active for faster active currency lookups
CREATE INDEX IF NOT EXISTS idx_currencies_is_active ON currencies(is_active);

-- Insert default currencies
INSERT INTO currencies (name, code, symbol, is_active, exchange_rate, is_base) VALUES
  ('US Dollar', 'USD', '$', true, 1.000000, true),
  ('Euro', 'EUR', '€', true, 0.850000, false),
  ('Tunisian Dinar', 'TND', 'DT', true, 2.850000, false)
ON CONFLICT (code) DO NOTHING;

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_currencies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_currencies_updated_at
  BEFORE UPDATE ON currencies
  FOR EACH ROW
  EXECUTE FUNCTION update_currencies_updated_at();
