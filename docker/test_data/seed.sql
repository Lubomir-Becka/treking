-- ============================================================================
-- VYČISTENIE DÁT A RESETOVANIE SEKVencií (ID pôjdu opäť od 1)
-- ============================================================================
TRUNCATE TABLE 
    shipping, payments, order_items, orders, shipping_methods,
    cart_items, carts, favorites,
    product_variants, product_images, product_colors,
    product_attributes, attributes, products, categories,
    addresses, users 
RESTART IDENTITY CASCADE;

-- ============================================================================
-- 1. POUŽÍVATELIA (users)
-- Pozn.: Heslo pre všetkých je napr. 'heslo123' (v ukážke je bcrypt hash)
-- ============================================================================
INSERT INTO users (first_name, last_name, email, password_hash, phone, role, is_active) VALUES
('Marek', 'Kováč', 'admin@outdoor-eshop.sk', '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekdHgTGmrpHEfIoxm', '+421901111222', 'admin', TRUE),
('Ján', 'Novák', 'jan.novak@example.com', '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekdHgTGmrpHEfIoxm', '+421902333444', 'customer', TRUE),
('Zuzana', 'Horváthová', 'zuzana.h@example.com', '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekdHgTGmrpHEfIoxm', '+421903555666', 'customer', TRUE);

-- ============================================================================
-- 2. ADRESY (addresses)
-- ============================================================================
INSERT INTO addresses (user_id, recipient_name, street, city, postal_code, country, phone, address_label, is_default) VALUES
(2, 'Ján Novák', 'Štefánikova trieda 15', 'Nitra', '949 01', 'SK', '+421902333444', 'home', TRUE),
(2, 'Ján Novák (Firma ABC)', 'Prievozská 4D', 'Bratislava', '821 09', 'SK', '+421902333444', 'work', FALSE),
(3, 'Zuzana Horváthová', 'Hlavná 88', 'Košice', '040 01', 'SK', '+421903555666', 'home', TRUE);

-- ============================================================================
-- 3. KATEGÓRIE (categories) - Stromová štruktúra
-- ============================================================================
-- Hlavné kategórie (id: 1, 2, 3)
INSERT INTO categories (name, slug, description, parent_id) VALUES
('Oblečenie', 'oblecenie', 'Funkčné outdoorové a turistické oblečenie do každého počasia.', NULL),
('Turistická obuv', 'turisticka-obuv', 'Pevná obuv na vysokohorskú turistiku aj ľahký trekking.', NULL),
('Batohy a výbava', 'batohy-a-vybava', 'Turistické batohy, čelovky, stany a kempingové príslušenstvo.', NULL);

-- Podkategórie (id: 4, 5, 6, 7)
INSERT INTO categories (name, slug, description, parent_id) VALUES
('Nepremokavé bundy', 'nepremokave-bundy', 'Hardshellové a membránové bundy do extrémnych podmienok.', 1),
('Nohavice a kraťasy', 'nohavice-a-kratasy', 'Odolné turistické nohavice.', 1),
('Vysoká členková obuv', 'vysoka-clenkova-obuv', 'Celokožené a Gore-Tex topánky do náročného terénu.', 2),
('Čelovky a osvetlenie', 'celovky-a-osvetlenie', 'Výkonné LED čelovky na nočné pochody.', 3);

-- ============================================================================
-- 4. PRODUKTY (products) - Materské záznamy
-- ============================================================================
INSERT INTO products (name, slug, description, brand, category_id, is_active) VALUES
-- ID 1: Bunda
('Pánska hardshell bunda Mammut Crater IV', 'panska-hardshell-bunda-mammut-crater-iv', 'Trojvrstvová nepremokavá bunda s membránou GORE-TEX, ideálna na celoročnú vysokohorskú turistiku a horolezectvo.', 'Mammut', 4, TRUE),
-- ID 2: Topánky
('Pánske turistické topánky Salewa Mountain Trainer Mid', 'panske-topanky-salewa-mountain-trainer-mid', 'Odolná členková obuv z brúsenej kože s podrážkou Vibram a nepremokavou membránou.', 'Salewa', 6, TRUE),
-- ID 3: Čelovka (univerzálny produkt bez farby a veľkosti)
('Nabíjacia čelovka Petzl Actik Core 600', 'nabijacia-celovka-petzl-actik-core-600', 'Ľahká a výkonná nabíjacia čelovka so svietivosťou 600 lúmenov a červeným svetlom.', 'Petzl', 7, TRUE),
-- ID 4: Batoh
('Turistický batoh Deuter Aircontact Core 50+10', 'turisticky-batoh-deuter-aircontact-core-50-10', 'Komfortný expedičný batoh s nastaviteľným chrbtovým systémom na viacdňové prechody.', 'Deuter', 3, TRUE);

-- ============================================================================
-- 5. TECHNICKÉ PARAMETRE (attributes & product_attributes)
-- ============================================================================
INSERT INTO attributes (name, unit) VALUES
('Vodný stĺpec', 'mm'),          -- ID 1
('Priedušnosť', 'g/m²/24h'),     -- ID 2
('Hmotnosť', 'g'),               -- ID 3
('Membrána', NULL),              -- ID 4
('Podrážka', NULL),              -- ID 5
('Svietivosť', 'lm'),            -- ID 6
('Objem', 'l');                  -- ID 7

INSERT INTO product_attributes (product_id, attribute_id, value) VALUES
-- Parametre pre bundu Mammut (product_id = 1)
(1, 1, '28000'),
(1, 2, '20000'),
(1, 3, '480'),
(1, 4, 'GORE-TEX 3L'),
-- Parametre pre topánky Salewa (product_id = 2)
(2, 3, '670'),
(2, 4, 'GORE-TEX Performance Comfort'),
(2, 5, 'Vibram WTC'),
-- Parametre pre čelovku Petzl (product_id = 3)
(3, 3, '88'),
(3, 6, '600'),
-- Parametre pre batoh Deuter (product_id = 4)
(4, 3, '2160'),
(4, 7, '60');

-- ============================================================================
-- 6. FAREBNÉ VERZIE (product_colors)
-- ============================================================================
INSERT INTO product_colors (product_id, color_name, hex_code) VALUES
(1, 'blue', '#0055AA'),   -- ID 1: Bunda Mammut - Modrá
(1, 'red', '#CC2200'),    -- ID 2: Bunda Mammut - Červená
(2, 'brown', '#5C4033'),  -- ID 3: Topánky Salewa - Hnedá
(3, NULL, NULL),          -- ID 4: Čelovka Petzl - Bez špecifickej farby (NULL)
(4, 'green', '#2E5A27');  -- ID 5: Batoh Deuter - Zelená
(5, 'dark grey', '#333333');   -- ID 

-- ============================================================================
-- 7. OBRÁZKY PRODUKTOV (product_images) - Viazané na product_color_id
-- ============================================================================
INSERT INTO product_images (product_color_id, image_url, alt_text, is_primary, display_order) VALUES
-- Fotky pre Modrú bundu Mammut (color_id = 1)
(4, '/img/products/test_bag_green_front.png', 'Detail of green test bag from the front', TRUE, 1),
(4, '/img/products/test_bag_green_side.png', 'Detail of green test bag from the side', FALSE, 2),
(4, '/img/products/test_bag_green_back.png', 'Detail of green test bag from the back', FALSE, 3),
-- Fotky pre Červenú bundu Mammut (color_id = 2)
(4, '/img/products/test_jacket_green_front.png', 'Detail of green test jacket from the front', TRUE, 1),
(4, '/img/products/test_jacket_green_back.png', 'Detail of green test jacket from the behind', FALSE, 2),
-- Fotky pre Hnedé topánky Salewa (color_id = 3)
(5, '/img/products/test_trousers_grey_front.png', 'Detail of grey test trousers from the front', TRUE, 1),
(5, '/img/products/test_trousers_grey_side.png', 'Detail of grey test trousers from the side', FALSE, 2),
-- Fotka pre Čelovku Petzl (color_id = 4)

-- ============================================================================
-- 8. SKLADOVÉ VARIANTY / VEĽKOSTI (product_variants)
-- ============================================================================
INSERT INTO product_variants (product_color_id, sku, size, price, stock, is_active) VALUES
-- Bunda Mammut - Modrá (color_id = 1)
(1, 'MAM-CRA-BLU-S', 'S', 349.90, 5, TRUE),    -- ID 1
(1, 'MAM-CRA-BLU-M', 'M', 349.90, 12, TRUE),   -- ID 2
(1, 'MAM-CRA-BLU-L', 'L', 349.90, 8, TRUE),    -- ID 3
(1, 'MAM-CRA-BLU-XL', 'XL', 349.90, 0, TRUE),  -- ID 4 (Vypredané)
-- Bunda Mammut - Červená (color_id = 2)
(2, 'MAM-CRA-RED-M', 'M', 329.90, 4, TRUE),    -- ID 5 (V zľave)
(2, 'MAM-CRA-RED-L', 'L', 329.90, 6, TRUE),    -- ID 6
-- Topánky Salewa - Hnedá (color_id = 3)
(3, 'SAL-MTN-BRN-41', '41', 219.00, 3, TRUE),  -- ID 7
(3, 'SAL-MTN-BRN-42', '42', 219.00, 10, TRUE), -- ID 8
(3, 'SAL-MTN-BRN-43', '43', 219.00, 7, TRUE),  -- ID 9
-- Čelovka Petzl - Univerzálna veľkosť (color_id = 4, size = NULL)
(4, 'PET-ACT-600-UNI', NULL, 69.90, 25, TRUE), -- ID 10
-- Batoh Deuter - Zelený, univerzálna veľkosť (color_id = 5, size = NULL)
(5, 'DEU-AIR-50-GRN', NULL, 245.00, 9, TRUE);  -- ID 11

-- ============================================================================
-- 9. OBĽÚBENÉ PRODUKTY (favorites)
-- ============================================================================
INSERT INTO favorites (user_id, product_id) VALUES
(2, 1), -- Ján má v obľúbených bundu Mammut
(2, 3), -- Ján má v obľúbených čelovku Petzl
(3, 2); -- Zuzana má v obľúbených topánky Salewa

-- ============================================================================
-- 10. NÁKUPNÝ KOŠÍK (carts & cart_items)
-- ============================================================================
INSERT INTO carts (user_id, session_id) VALUES
(2, NULL),                          -- ID 1: Košík prihláseného Jána
(NULL, 'sess_anon_987654321xyz');   -- ID 2: Košík neprihláseného návštevníka

INSERT INTO cart_items (cart_id, product_variant_id, quantity) VALUES
(1, 2, 1),  -- Ján má v košíku 1x Modrú bundu Mammut (veľkosť M)
(1, 10, 2), -- Ján má v košíku 2x Čelovku Petzl
(2, 8, 1);  -- Anonym má v košíku 1x Topánky Salewa (veľkosť 42)

-- ============================================================================
-- 11. ČÍSELNÍK DOPRAVY (shipping_methods)
-- ============================================================================
INSERT INTO shipping_methods (code, name, price, free_from_amount, is_active) VALUES
('courier', 'Kuriér na adresu (GLS / SPS)', 4.90, 100.00, TRUE),       -- ID 1
('packeta', 'Packeta - Výdajné miesto / Z-Box', 3.50, 80.00, TRUE),    -- ID 2
('post_office', 'Slovenská pošta - Balík na poštu', 3.90, 100.00, TRUE),-- ID 3
('personal_pickup', 'Osobný odber na predajni (Nitra)', 0.00, 0.00, TRUE); -- ID 4

-- ============================================================================
-- 12. OBJEDNÁVKY A POLOŽKY (orders & order_items)
-- ============================================================================
INSERT INTO orders (
    user_id, order_number, items_subtotal, shipping_cost, total_price, status,
    shipping_recipient, shipping_street, shipping_city, shipping_postal_code, shipping_country, shipping_phone, note
) VALUES
-- Objednávka 1 (Ján Novák - Doručená, doprava zadarmo lebo nákup > 100 €)
(
    2, 'OBJ-2026-0001', 419.80, 0.00, 419.80, 'delivered',
    'Ján Novák', 'Štefánikova trieda 15', 'Nitra', '949 01', 'SK', '+421902333444', 'Prosím zavolať 15 minút vopred.'
),
-- Objednávka 2 (Zuzana Horváthová - Nová objednávka, čelovka + Packeta 3.50 €)
(
    3, 'OBJ-2026-0002', 69.90, 3.50, 73.40, 'pending',
    'Zuzana Horváthová', 'Hlavná 88', 'Košice', '040 01', 'SK', '+421903555666', NULL
);

INSERT INTO order_items (order_id, product_variant_id, product_name, sku, color_name, size, quantity, unit_price) VALUES
-- Položky k Objednávke 1 (349.90 + 69.90 = 419.80 €)
(1, 2, 'Pánska hardshell bunda Mammut Crater IV', 'MAM-CRA-BLU-M', 'blue', 'M', 1, 349.90),
(1, 10, 'Nabíjacia čelovka Petzl Actik Core 600', 'PET-ACT-600-UNI', NULL, NULL, 1, 69.90),
-- Položky k Objednávke 2 (69.90 €)
(2, 10, 'Nabíjacia čelovka Petzl Actik Core 600', 'PET-ACT-600-UNI', NULL, NULL, 1, 69.90);

-- ============================================================================
-- 13. PLATBY A ZÁSIELKY (payments & shipping)
-- ============================================================================
INSERT INTO payments (order_id, payment_method, amount, status, transaction_id) VALUES
(1, 'card', 419.80, 'paid', 'GP-TXN-9988776655'),
(2, 'cod', 73.40, 'pending', NULL);

INSERT INTO shipping (order_id, shipping_method_id, shipping_cost, tracking_number, status, shipped_at) VALUES
(1, 1, 0.00, 'GLS-SK-11223344', 'delivered', CURRENT_TIMESTAMP - INTERVAL '2 days'),
(2, 2, 3.50, NULL, 'preparing', NULL);