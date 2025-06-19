-- Add a column for adjusted risk rating if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'risks' 
                  AND column_name = 'adjusted_risk_rating') THEN
        ALTER TABLE risks ADD COLUMN adjusted_risk_rating real;
    END IF;
END $$;

-- Update risk priorities based on PMBOK-compliant calculation

-- Risk ID: R - 43 (Transfer, Open)
-- Base score: 0.4 * 100 = 40
-- Adjustments: Transfer (35%), Open (100%)
-- Adjusted score: 40 * 0.35 * 1.0 = 14
-- Category: Moderate
UPDATE risks SET adjusted_risk_rating = 14, priority_rank = 10 WHERE risk_id = 'R - 43';

-- Risk ID: R - 17 (Transfer, Open)
-- Base score: 0.6 * 100 = 60
-- Adjustments: Transfer (35%), Open (100%)
-- Adjusted score: 60 * 0.35 * 1.0 = 21
-- Category: Moderate
UPDATE risks SET adjusted_risk_rating = 21, priority_rank = 10 WHERE risk_id = 'R - 17';

-- Risk ID: R - 19 (Transfer, Open)
-- Base score: 0.6 * 60 = 36
-- Adjustments: Transfer (35%), Open (100%)
-- Adjusted score: 36 * 0.35 * 1.0 = 12.6
-- Category: Low
UPDATE risks SET adjusted_risk_rating = 12.6, priority_rank = 20 WHERE risk_id = 'R - 19';

-- Risk ID: R - 27 (Transfer, Open)
-- Base score: 0.6 * 80 = 48
-- Adjustments: Transfer (35%), Open (100%)
-- Adjusted score: 48 * 0.35 * 1.0 = 16.8
-- Category: Moderate
UPDATE risks SET adjusted_risk_rating = 16.8, priority_rank = 10 WHERE risk_id = 'R - 27';

-- Risk ID: R - 16 (Accept, Open)
-- Base score: 0.4 * 60 = 24
-- Adjustments: Accept (100%), Open (100%)
-- Adjusted score: 24 * 1.0 * 1.0 = 24
-- Category: Moderate
UPDATE risks SET adjusted_risk_rating = 24, priority_rank = 10 WHERE risk_id = 'R - 16';

-- Risk ID: R - 20 (Accept, Open)
-- Base score: 0.6 * 80 = 48
-- Adjustments: Accept (100%), Open (100%)
-- Adjusted score: 48 * 1.0 * 1.0 = 48
-- Category: High
UPDATE risks SET adjusted_risk_rating = 48, priority_rank = 5 WHERE risk_id = 'R - 20';

-- Risk ID: R - 25 (Accept, Open)
-- Base score: 0.4 * 60 = 24
-- Adjustments: Accept (100%), Open (100%)
-- Adjusted score: 24 * 1.0 * 1.0 = 24
-- Category: Moderate
UPDATE risks SET adjusted_risk_rating = 24, priority_rank = 10 WHERE risk_id = 'R - 25';

-- Risk ID: R - 38 (Accept, Open)
-- Base score: 0.6 * 100 = 60
-- Adjustments: Accept (100%), Open (100%)
-- Adjusted score: 60 * 1.0 * 1.0 = 60
-- Category: High
UPDATE risks SET adjusted_risk_rating = 60, priority_rank = 5 WHERE risk_id = 'R - 38';

-- Risk ID: R - 44 (Accept, Open)
-- Base score: 0.4 * 40 = 16
-- Adjustments: Accept (100%), Open (100%)
-- Adjusted score: 16 * 1.0 * 1.0 = 16
-- Category: Moderate
UPDATE risks SET adjusted_risk_rating = 16, priority_rank = 10 WHERE risk_id = 'R - 44';

-- Risk ID: R - 12 (Accept, Open)
-- Base score: 0.8 * 40 = 32
-- Adjustments: Accept (100%), Open (100%)
-- Adjusted score: 32 * 1.0 * 1.0 = 32
-- Category: Moderate
UPDATE risks SET adjusted_risk_rating = 32, priority_rank = 10 WHERE risk_id = 'R - 12';

-- Risk ID: R - 5 (Accept, Open)
-- Base score: 0.8 * 80 = 64
-- Adjustments: Accept (100%), Open (100%)
-- Adjusted score: 64 * 1.0 * 1.0 = 64
-- Category: Extreme
UPDATE risks SET adjusted_risk_rating = 64, priority_rank = 1 WHERE risk_id = 'R - 5';

-- Risk ID: R - 26 (Accept, Open)
-- Base score: 0.4 * 100 = 40
-- Adjustments: Accept (100%), Open (100%)
-- Adjusted score: 40 * 1.0 * 1.0 = 40
-- Category: High
UPDATE risks SET adjusted_risk_rating = 40, priority_rank = 5 WHERE risk_id = 'R - 26';

-- Risk ID: R - 15 (Accept, Open)
-- Base score: 0.6 * 100 = 60
-- Adjustments: Accept (100%), Open (100%)
-- Adjusted score: 60 * 1.0 * 1.0 = 60
-- Category: High
UPDATE risks SET adjusted_risk_rating = 60, priority_rank = 5 WHERE risk_id = 'R - 15';

-- Risk ID: R - 36 (Accept, Open)
-- Base score: 0.4 * 100 = 40
-- Adjustments: Accept (100%), Open (100%)
-- Adjusted score: 40 * 1.0 * 1.0 = 40
-- Category: High
UPDATE risks SET adjusted_risk_rating = 40, priority_rank = 5 WHERE risk_id = 'R - 36';

-- Risk ID: R - 18 (Accept, Open)
-- Base score: 0.4 * 100 = 40
-- Adjustments: Accept (100%), Open (100%)
-- Adjusted score: 40 * 1.0 * 1.0 = 40
-- Category: High
UPDATE risks SET adjusted_risk_rating = 40, priority_rank = 5 WHERE risk_id = 'R - 18';

-- Risk ID: R - 22 (Accept, Open)
-- Base score: 0.8 * 80 = 64
-- Adjustments: Accept (100%), Open (100%)
-- Adjusted score: 64 * 1.0 * 1.0 = 64
-- Category: Extreme
UPDATE risks SET adjusted_risk_rating = 64, priority_rank = 1 WHERE risk_id = 'R - 22';

-- Risk ID: R - 39 (Accept, Open)
-- Base score: 0.4 * 80 = 32
-- Adjustments: Accept (100%), Open (100%)
-- Adjusted score: 32 * 1.0 * 1.0 = 32
-- Category: Moderate
UPDATE risks SET adjusted_risk_rating = 32, priority_rank = 10 WHERE risk_id = 'R - 39';

-- Risk ID: R - 30 (Accept, Open)
-- Base score: 0.6 * 60 = 36
-- Adjustments: Accept (100%), Open (100%)
-- Adjusted score: 36 * 1.0 * 1.0 = 36
-- Category: High
UPDATE risks SET adjusted_risk_rating = 36, priority_rank = 5 WHERE risk_id = 'R - 30';

-- Risk ID: R - 13 (Accept, Open)
-- Base score: 0.8 * 60 = 48
-- Adjustments: Accept (100%), Open (100%)
-- Adjusted score: 48 * 1.0 * 1.0 = 48
-- Category: High
UPDATE risks SET adjusted_risk_rating = 48, priority_rank = 5 WHERE risk_id = 'R - 13';

-- Risk ID: R - 2 (Accept, Open)
-- Base score: 1.0 * 60 = 60
-- Adjustments: Accept (100%), Open (100%)
-- Adjusted score: 60 * 1.0 * 1.0 = 60
-- Category: High
UPDATE risks SET adjusted_risk_rating = 60, priority_rank = 5 WHERE risk_id = 'R - 2';

-- Risk ID: R - 21 (Accept, Open)
-- Base score: 0.8 * 60 = 48
-- Adjustments: Accept (100%), Open (100%)
-- Adjusted score: 48 * 1.0 * 1.0 = 48
-- Category: High
UPDATE risks SET adjusted_risk_rating = 48, priority_rank = 5 WHERE risk_id = 'R - 21';

-- Risk ID: R - 8 (Accept, Open)
-- Base score: 0.6 * 80 = 48
-- Adjustments: Accept (100%), Open (100%)
-- Adjusted score: 48 * 1.0 * 1.0 = 48
-- Category: High
UPDATE risks SET adjusted_risk_rating = 48, priority_rank = 5 WHERE risk_id = 'R - 8';

-- Risk ID: R - 40 (Accept, Open)
-- Base score: 0.6 * 80 = 48
-- Adjustments: Accept (100%), Open (100%)
-- Adjusted score: 48 * 1.0 * 1.0 = 48
-- Category: High
UPDATE risks SET adjusted_risk_rating = 48, priority_rank = 5 WHERE risk_id = 'R - 40';

-- Risk ID: R - 14 (Accept, Open)
-- Base score: 0.4 * 60 = 24
-- Adjustments: Accept (100%), Open (100%)
-- Adjusted score: 24 * 1.0 * 1.0 = 24
-- Category: Moderate
UPDATE risks SET adjusted_risk_rating = 24, priority_rank = 10 WHERE risk_id = 'R - 14';

-- Risk ID: R - 7 (Accept, Open)
-- Base score: 0.4 * 100 = 40
-- Adjustments: Accept (100%), Open (100%)
-- Adjusted score: 40 * 1.0 * 1.0 = 40
-- Category: High
UPDATE risks SET adjusted_risk_rating = 40, priority_rank = 5 WHERE risk_id = 'R - 7';

-- Risk ID: R - 24 (Accept, Open)
-- Base score: 0.4 * 40 = 16
-- Adjustments: Accept (100%), Open (100%)
-- Adjusted score: 16 * 1.0 * 1.0 = 16
-- Category: Moderate
UPDATE risks SET adjusted_risk_rating = 16, priority_rank = 10 WHERE risk_id = 'R - 24';

-- Risk ID: R - 42 (Accept, Open)
-- Base score: 0.6 * 60 = 36
-- Adjustments: Accept (100%), Open (100%)
-- Adjusted score: 36 * 1.0 * 1.0 = 36
-- Category: High
UPDATE risks SET adjusted_risk_rating = 36, priority_rank = 5 WHERE risk_id = 'R - 42';

-- Risk ID: R - 31 (Accept, Open)
-- Base score: 0.6 * 60 = 36
-- Adjustments: Accept (100%), Open (100%)
-- Adjusted score: 36 * 1.0 * 1.0 = 36
-- Category: High
UPDATE risks SET adjusted_risk_rating = 36, priority_rank = 5 WHERE risk_id = 'R - 31';