-- Script to add fiscal fields to existing invoice_settings table
-- Run this script if you already have an invoice_settings table

-- Add fiscal fields to existing table
ALTER TABLE invoice_settings 
ADD COLUMN IF NOT EXISTS fiscal_number VARCHAR(255) DEFAULT '',
ADD COLUMN IF NOT EXISTS tax_registration_number VARCHAR(255) DEFAULT '',
ADD COLUMN IF NOT EXISTS siret_number VARCHAR(255) DEFAULT '';

-- Update existing records to have empty fiscal fields
    UPDATE invoice_settings 
    SET 
    fiscal_number = COALESCE(fiscal_number, ''),
    tax_registration_number = COALESCE(tax_registration_number, ''),
    siret_number = COALESCE(siret_number, '')
    WHERE fiscal_number IS NULL 
    OR tax_registration_number IS NULL 
    OR siret_number IS NULL;

-- Verify the table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'invoice_settings' 
ORDER BY ordinal_position;
