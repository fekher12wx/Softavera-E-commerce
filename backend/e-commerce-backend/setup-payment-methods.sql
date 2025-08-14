-- Create payment_methods table if it doesn't exist
CREATE TABLE IF NOT EXISTS payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    config JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on code for faster lookups
CREATE INDEX IF NOT EXISTS idx_payment_methods_code ON payment_methods(code);

-- Create index on is_active for filtering active methods
CREATE INDEX IF NOT EXISTS idx_payment_methods_active ON payment_methods(is_active);

-- Insert default payment methods if they don't exist
INSERT INTO payment_methods (name, code, description, is_active, config) VALUES
    ('Adyen', 'adyen', 'Global payment platform supporting multiple payment methods', false, '{"apiKey": "", "merchantAccount": "", "environment": "test", "webhookUrl": ""}')
ON CONFLICT (code) DO NOTHING;

INSERT INTO payment_methods (name, code, description, is_active, config) VALUES
    ('Paymee', 'paymee', 'Tunisian payment gateway for local and international payments', false, '{"apiToken": "", "vendorId": "", "baseUrl": "https://sandbox.paymee.tn/api/v2", "environment": "sandbox", "webhookUrl": ""}')
ON CONFLICT (code) DO NOTHING;

INSERT INTO payment_methods (name, code, description, is_active, config) VALUES
    ('Konnect', 'konnect', 'Tunisian digital payment network', false, '{"apiKey": "", "merchantId": "", "baseUrl": "https://api.konnect.network", "environment": "test", "webhookUrl": ""}')
ON CONFLICT (code) DO NOTHING;

-- Grant permissions (adjust as needed for your database setup)
-- GRANT ALL PRIVILEGES ON TABLE payment_methods TO your_user;
-- GRANT USAGE, SELECT ON SEQUENCE payment_methods_id_seq TO your_user;
