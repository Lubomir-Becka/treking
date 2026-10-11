# TREKING

Ľubomír Bečka

5YZR31

Stručný opis projektu
Projektom je internetový obchod s oblečením a doplnkami na turistiku. Je určený turistom a všetkým, ktorí trávia čas v prírode a hľadajú vhodné oblečenie či výbavu. Aplikácia umožní zákazníkom prehliadať a vyhľadávať produkty, prezerať si ich podrobnosti a vytvárať objednávky.


##Role v projekte
Neprihlásený používateľ (návštevník) – môže prehliadať a vyhľadávať produkty, zobrazovať ich podrobnosti a vkladať ich do  košíka. Na dokončenie objednávky sa musí zaregistrovať alebo prihlásiť.
Prihlásený používateľ (zákazník) – môže využívať funkcie návštevníka a navyše spravovať obľúbené produkty, dokončovať objednávky, vyberať spôsob platby a miesto doručenia a prezerať si svoje objednávky.
Správca – spravuje sortiment e-shopu, vrátane pridávania, úpravy a odstraňovania produktov a kategórií. Zároveň spravuje používateľské účty. 
###Prípady použitia podľa rolí
Neprihlásený používateľ
- Prehliada e-shop.
- Vyhľadáva produkty.
- Zobrazuje podrobnosti o produkte.
- Vkladá produkty do košíka.
- Pokúša sa dokončiť objednávku (zobrazí sa upozorneni: je nutné sa zaregistrovať alebo prihlásiť)
- Registruje sa.
- Prihlasuje sa.
Prihlásený používateľ
- Prehliada e-shop
- Vyhľadáva produkty
- Zobrazuje podrobnosti o produkte
- Pridáva produkty medzi obľúbené
- Prezerá si obľúbené produkty
- Odstraňuje produkty z obľúbených
- Vkladá produkty do košíka
- Otvára a zatvára košík
- Odstraňuje produkty z košíka
- Dokončuje objednávku
- Vyberá spôsob platby
- Vyberá miesto doručenia
- Platí objednávku
- Ruší objednávku 
- Prezerá si svoje objednávky a ich podrobnosti.
- Odhlasuje sa.
Správca
- Prihlasuje sa do administračnej časti e-shopu.
- Pridáva, upravuje a odstraňuje produkty.
- Spravuje kategórie produktov.
- Aktualizuje ceny, skladovú dostupnosť, fotografie a opis produktov.
- Spravuje používateľské účty.
- Odhlasuje sa z administračnej časti.
## Plánované entity
Používateľ
- Ukladá údaje o zákazníkoch a správcoch.
- Atribúty: ID používateľa, meno, priezvisko, e-mail, heslo, telefón, rola, dátum registrácie.
- Vzťahy: používateľ môže mať viacero objednávok a viacero obľúbených produktov. Doručovacie adresy možno uložiť priamo pri používateľovi alebo v samostatnej entite.

Adresa
- Ukladá adresy používateľov určené na doručenie objednávok.

- Atribúty: ID adresy, ID používateľa, meno a priezvisko príjemcu, ulica, mesto, PSČ, krajina, telefón, označenie adresy.
- Vzťahy: jedna adresa patrí jednému používateľovi; používateľ môže mať viacero adries. Objednávka môže odkazovať na adresu použitú pri nákupe.

Kategória
- Zoskupuje produkty do prehľadných kategórií, napríklad turistické bundy, obuv alebo batohy.
- Atribúty: ID kategórie, názov, opis, prípadne nadradená kategória.
- Vzťahy: kategória môže obsahovať viacero produktov. Nadradená kategória môže mať viacero podkategórií.

Produkt
- Ukladá informácie o oblečení a doplnkoch ponúkaných v e-shope.
- Atribúty: ID produktu, názov, opis, cena, značka, veľkosť, farba, skladová dostupnosť, obrázok, ID kategórie.
- Vzťahy: produkt patrí do kategórie. Môže sa nachádzať vo viacerých položkách objednávok a môže byť uložený medzi obľúbenými produktmi viacerých používateľov.

Obľúbený produkt
- Prepája používateľov s produktmi, ktoré si uložili medzi obľúbené.
- Atribúty: ID záznamu, ID používateľa, ID produktu, dátum pridania.
- Vzťahy: každý záznam patrí jednému používateľovi a jednému produktu. Táto entita rieši vzťah mnoho k mnohým medzi používateľmi a produktmi.

Košík
- Ukladá produkty, ktoré si používateľ vybral pred dokončením objednávky.
- Atribúty: ID košíka, ID používateľa alebo identifikátor návštevníckej relácie, dátum vytvorenia, dátum poslednej úpravy.
- Vzťahy: košík môže obsahovať viacero položiek. Pri dokončení nákupu sa jeho obsah prenesie do objednávky.

Položka košíka
- Ukladá konkrétny produkt a jeho množstvo v košíku.
- Atribúty: ID položky, ID košíka, ID produktu, množstvo, cena produktu v čase vloženia.
- Vzťahy: každá položka patrí do jedného košíka a odkazuje na jeden produkt.

Objednávka
- Ukladá informácie o nákupe uskutočnenom zákazníkom.
- Atribúty: ID objednávky, ID používateľa, číslo objednávky, dátum vytvorenia, stav, celková cena, spôsob dopravy, spôsob platby, doručovacia adresa.
- Vzťahy: objednávka patrí jednému používateľovi a obsahuje jednu alebo viac položiek objednávky. Môže mať priradenú platbu a použitú doručovaciu adresu.

Položka objednávky
- Ukladá produkty a ich množstvá v konkrétnej objednávke. Uchováva cenu v čase nákupu, aby sa údaje objednávky nemenili pri neskoršej zmene ceny produktu.
- Atribúty: ID položky, ID objednávky, ID produktu, názov produktu v čase nákupu, množstvo, jednotková cena.
- Vzťahy: každá položka patrí do jednej objednávky a odkazuje na jeden produkt.

Platba
- Zaznamenáva platbu za objednávku.
- Atribúty: ID platby, ID objednávky, spôsob platby, suma, stav platby, dátum platby, identifikátor transakcie.
- Vzťahy: platba patrí k jednej objednávke. Podľa požiadaviek systému môže mať objednávka jednu alebo viacero platobných transakcií, napríklad pri opakovanom pokuse o platbu.
- Navrhnite hlavné dátové entity aplikácie, ktoré budú reprezentované v databáze, napríklad Používateľ, Produkt, Objednávka alebo Rezervácia. Pri každej entite stručne uveďte jej účel, najdôležitejšie atribúty a základné vzťahy k ostatným entitám.

Doprava
- Ukladá informácie o doručení objednávky.
- Atribúty: ID dopravy, ID objednávky, spôsob dopravy, adresa alebo výdajné miesto, sledovacie číslo, stav zásielky, dátum odoslania.
- Vzťahy: doprava sa viaže na jednu objednávku. 
## Vzťahy medzi entitami
Používateľ – Objednávka (1:N): jeden používateľ môže vytvoriť viacero objednávok, každá objednávka patrí jednému používateľovi.
Používateľ – Adresa (1:N): používateľ môže mať uložených viacero adries, každá adresa patrí jednému používateľovi.
Kategória – Produkt (1:N): jedna kategória môže obsahovať viacero produktov, každý produkt patrí do jednej kategórie.
Objednávka – Položka objednávky (1:N): objednávka obsahuje jednu alebo viac položiek; každá položka patrí do jednej objednávky.
Produkt – Položka objednávky (1:N): jeden produkt sa môže objaviť vo viacerých položkách objednávok, každá položka odkazuje na jeden produkt. 
Používateľ – Produkt (M:N, obľúbené): používateľ môže označiť viacero produktov ako obľúbené a jeden produkt môže byť obľúbený viacerými používateľmi.
Košík – Položka košíka (1:N): jeden košík môže obsahovať viacero položiek; každá položka patrí do jedného košíka.
Produkt – Položka košíka (1:N): jeden produkt sa môže nachádzať vo viacerých košíkoch, každá položka košíka odkazuje na jeden produkt.
Objednávka – Platba (1:N): systém ukladá aj opakované pokusy o platbu
Objednávka – Doprava (1:N): môže sa stať, že objednávka bude rozdelená do viacerých zásielok.
## Hlavné stránky aplikácie
Domovská stránka – predstavuje e-shop, zobrazuje vybrané alebo akciové produkty a umožňuje prejsť do kategórií či vyhľadávania.
Zoznam produktov – zobrazuje produkty v zvolenej kategórii alebo výsledky vyhľadávania. Používateľ môže produkty filtrovať a zoradiť.
Detail produktu – obsahuje názov, fotografiu, opis, cenu, veľkosť alebo farbu, dostupnosť a tlačidlo na vloženie produktu do košíka.
Košík – zobrazuje vybrané produkty, ich množstvo a celkovú cenu. Používateľ tu môže upravovať množstvo alebo produkty odstrániť.
Prihlásenie a registrácia – umožňuje používateľovi prihlásiť sa do účtu alebo vytvoriť nový účet.
Dokončenie objednávky – umožňuje zadať alebo vybrať doručovaciu adresu, vybrať spôsob dopravy a platby a skontrolovať objednávku pred jej odoslaním.
Potvrdenie objednávky – zobrazuje informáciu o úspešnom vytvorení objednávky a jej základné údaje.
Môj účet – umožňuje upravovať osobné údaje, spravovať adresy a prezerať históriu objednávok.
Obľúbené produkty – zobrazuje produkty uložené používateľom, z ktorých ich môže otvoriť alebo odstrániť.
Administrácia – určená správcovi na správu produktov, kategórií a objednávok.
## Rozdelenie funkcionality
Základné funkcie

- Zobrazenie zoznamu produktov a ich podrobností.
- Prehliadanie produktov podľa kategórií.
- Vyhľadávanie produktov podľa názvu.
- Registrácia a prihlásenie používateľa.
- Pridávanie produktov do košíka.
- Zobrazenie obsahu košíka a úprava množstva produktov.
- Odstraňovanie produktov z košíka.
- Dokončenie objednávky prihláseným používateľom.
- Výber spôsobu platby a zadanie doručovacej adresy.
- Zobrazenie potvrdenia o vytvorenej objednávke.
- Zobrazenie histórie objednávok používateľa.
- Správa produktov správcom: pridávanie, úprava a odstraňovanie produktov.

Rozširujúce funkcie
- Ukladanie produktov medzi obľúbené.
- Filtrovanie produktov podľa ceny, značky, veľkosti, farby alebo dostupnosti.
- Zoradenie produktov podľa ceny, názvu, novosti alebo obľúbenosti.
- Hodnotenia a recenzie produktov.
- Viacero uložených doručovacích adries používateľa.
- E-mailové potvrdenie objednávky a informácie o zmene jej stavu.
- Možnosť zrušiť objednávku, pokiaľ ešte nebola odoslaná.
- Prehľadné štatistiky predaja pre správcu.
- Správa používateľských účtov a rolí v administračnej časti.
- Výdajné miesta a sledovanie zásielky.
