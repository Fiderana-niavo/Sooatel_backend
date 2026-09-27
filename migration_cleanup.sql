-- 1. Insérer les anciennes données dans la nouvelle table de lignes
INSERT INTO supplier_payment_line (id_supplier_payment, id_payment_method, amount)
SELECT id_supplier_payment, id_payment_method, amount
FROM supplier_payment
WHERE id_payment_method IS NOT NULL;

-- 2. Supprimer la colonne (et implicitement sa Foreign Key)
ALTER TABLE supplier_payment DROP COLUMN id_payment_method;
