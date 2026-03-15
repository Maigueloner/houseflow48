-- =============================================================
-- Category Management Cleanup
-- 1. Delete 8 English test categories (name-based, guarded)
-- 2. Rename Gastos Operativos BD → Gastos Operativos DB
-- 3. Insert Salud y Bienestar if missing
-- 4. Backfill icons on 13 approved categories
-- =============================================================

-- 1. Delete English test categories only if unreferenced by transactions
DELETE FROM public.categories
WHERE name IN (
    'Education',
    'Entertainment',
    'Groceries',
    'Healthcare',
    'Rent',
    'Subscription',
    'Transport',
    'Utilities'
)
AND id NOT IN (
    SELECT category_id FROM public.transactions WHERE category_id IS NOT NULL
);

-- 2. Rename Gastos Operativos BD → Gastos Operativos DB
UPDATE public.categories
SET name = 'Gastos Operativos DB'
WHERE name = 'Gastos Operativos BD';

-- 3. Insert Salud y Bienestar if it does not already exist
INSERT INTO public.categories (household_id, name, icon)
SELECT
    h.id,
    'Salud y Bienestar',
    'heart-pulse'
FROM public.households h
WHERE NOT EXISTS (
    SELECT 1 FROM public.categories c
    WHERE c.household_id = h.id
    AND c.name = 'Salud y Bienestar'
);

-- 4. Backfill icons on approved categories
UPDATE public.categories SET icon = 'utensils'      WHERE name = 'Comida y bebida';
UPDATE public.categories SET icon = 'home'           WHERE name = 'Casa';
UPDATE public.categories SET icon = 'heart-pulse'    WHERE name = 'Salud y Bienestar';
UPDATE public.categories SET icon = 'smile'          WHERE name = 'Ocio';
UPDATE public.categories SET icon = 'bus'            WHERE name = 'Transporte';
UPDATE public.categories SET icon = 'cat'            WHERE name = 'Gatas';
UPDATE public.categories SET icon = 'shopping-cart'  WHERE name = 'Supermercado';
UPDATE public.categories SET icon = 'scale'          WHERE name = 'Gastos Legales';
UPDATE public.categories SET icon = 'cigarette'      WHERE name = 'Humo';
UPDATE public.categories SET icon = 'database'       WHERE name = 'Gastos Operativos DB';
UPDATE public.categories SET icon = 'plane'          WHERE name = 'Viajes';
UPDATE public.categories SET icon = 'zap'            WHERE name = 'Servicios';
UPDATE public.categories SET icon = 'piggy-bank'     WHERE name = 'Savings';
