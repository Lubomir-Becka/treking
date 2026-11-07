"use client";

import Image from "next/image";
import { useState } from "react";

type Product = {
  name: string;
  type: string;
  detail: string;
  price: string;
  image: string;
};

const menProducts: Product[] = [
  { name: "Kriváň Pro Shell 3L", type: "Vrchná vrstva · GORE-TEX Pro 3L", detail: "28 000 mm vodný stĺpec", price: "549 €", image: "/img/products/test_jacket_green_front.png" },
  { name: "Gerlaš Alpine Pants", type: "Nohavice · Schoeller® Keprotec", detail: "Odolnosť proti oderu", price: "289 €", image: "/img/products/test_trousers_grey_side.png" },
  { name: "Rysy Alpine GTX", type: "Expedičná obuv · Vibram® Megagrip", detail: "Vysokohorská nepremokavosť", price: "269 €", image: "/img/products/test_bag_green_side.png" },
  { name: "Lomnica Pack 45L", type: "Transport · Cordura® 500D", detail: "Ultraľahký expedičný batoh", price: "219 €", image: "/img/products/test_bag_green_front.png" },
];

const womenProducts: Product[] = [
  { name: "Rysy Hybrid Active Jacket", type: "Hybridná izolácia · Pertex®", detail: "Zateplená vetruodolná bunda", price: "239 €", image: "/img/products/test_jacket_green_front.png" },
  { name: "Tatran Merino Tights", type: "Termoregulácia · 200g Merino", detail: "Funkčné kompresné legíny", price: "129 €", image: "/img/products/test_trousers_grey_side.png" },
  { name: "Štrbské Speed Vest 8L", type: "Hydratácia · 3D Mesh", detail: "Ultraľahká bežecká hydratácia", price: "119 €", image: "/img/products/test_bag_green_front.png" },
  { name: "Tatril Trail Grip Shoes", type: "Agilita · Vibram® Megagrip", detail: "Horská bežecká technická obuv", price: "179 €", image: "/img/products/test_bag_green_side.png" },
];

const categories = [
  ["Hardshell bundy", "8 modelov", "/img/products/test_jacket_green_front.png"],
  ["Funkčné nohavice", "6 modelov", "/img/products/test_trousers_grey_side.png"],
  ["Vysokohorská obuv", "4 modely", "/img/products/test_bag_green_side.png"],
  ["Batohy & vesty", "5 modelov", "/img/products/test_bag_green_front.png"],
  ["Termoprádlo & vrstvy", "7 modelov", "/img/products/test_jacket_green_side.png"],
  ["Technické doplnky", "9 modelov", "/img/products/test_bag_green_back.png"],
];

function MountainMark() {
  return (
    <div className="brand-mark" aria-label="VERTEX Tatran">
      <svg viewBox="0 0 42 27" aria-hidden="true"><path d="M1 24 13 8l5 6 8-12 15 22H1Z" /><path d="m13 8 3 5-6 2 3-7Zm13-6 4 7-6-2 2-5Z" fill="#e5a93c" /></svg>
      <span>VERTEX<small>TATRAN</small></span>
    </div>
  );
}

function Icon({ children }: { children: React.ReactNode }) {
  return <span className="icon" aria-hidden="true">{children}</span>;
}

function ProductList({ products, selected, onSelect }: { products: Product[]; selected: number; onSelect: (index: number) => void }) {
  const product = products[selected];
  return (
    <div className="lookbook-products">
      <div className="product-preview">
        <Image src={product.image} alt={product.name} fill sizes="(max-width: 700px) 100vw, 35vw" />
      </div>
      <div className="product-info">
        <span className="eyebrow">{product.type}</span>
        <h3>{product.name}</h3>
        <p>{product.detail}</p>
        <strong>{product.price}</strong>
        <a href="#kolekcia">Zobraziť detail <span>→</span></a>
      </div>
      <div className="product-selector">
        {products.map((item, index) => (
          <button className={index === selected ? "selected" : ""} key={item.name} onClick={() => onSelect(index)} aria-label={`Vybrať ${item.name}`}>
            <Image src={item.image} alt="" width={68} height={68} />
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const [menSelected, setMenSelected] = useState(0);
  const [womenSelected, setWomenSelected] = useState(0);

  return (
    <div className="site-shell">
      <header className="site-header">
        <a href="#" className="logo-link"><MountainMark /></a>
        <nav className="main-nav" aria-label="Hlavná navigácia">
          <a href="#kolekcia">Páni <span>⌄</span></a>
          <a href="#kolekcia">Dámy <span>⌄</span></a>
          <a href="#kolekcia">Deti <span>⌄</span></a>
        </nav>
        <div className="search"><Icon>⌕</Icon><input aria-label="Hľadať výbavu" placeholder="Hľadať výbavu..." /></div>
        <div className="header-actions">
          <button aria-label="Obľúbené"><Icon>♡</Icon><b>0</b></button>
          <button aria-label="Košík"><Icon>♧</Icon><b>2</b></button>
          <button className="account" aria-label="Prihlásenie"><Icon>♙</Icon><span>Účet</span></button>
        </div>
      </header>

      <main>
        <section className="hero">
          <Image src="/img/hero-section.png" alt="Panoráma Vysokých Tatier" fill priority sizes="100vw" />
          <div className="hero-overlay" />
          <div className="hero-content">
            <span className="eyebrow">Vysoké Tatry · Expedičný štandard 2025</span>
            <h1>Tatran.<br /><strong>Absolútna ochrana.</strong></h1>
            <p>Nekompromisné 3-vrstvové membrány a technická výbava navrhnutá pre najtvrdšie podmienky stredoeurópskych veľhôr.</p>
            <div className="hero-actions"><a className="button button-light" href="#kolekcia">Preskúmať kolekciu <span>→</span></a><a className="button button-outline" href="#lookbook">Lookbook výbavy <span>↗</span></a></div>
          </div>
          <div className="hero-meta"><span>▲ Lomnický štít / 2 634 m n. m.</span><span>Architektúra ticha a síl</span></div>
        </section>

        <section className="lookbook section" id="lookbook">
          <div className="section-heading"><div><span className="eyebrow">Lookbook · Alpine rigs</span><h2>Exkluzívne kolekcie vo<br /><em>vysokohorskom teréne</em></h2></div><p>Kompletné zostavy testované v najdrsnejších podmienkach Tatier. Preskúmajte celú výstroj a jednotlivé vrstvy technického systému.</p></div>
          <div className="rig">
            <div className="rig-title"><span>Rig 01</span><h3>Pánska zimná expedícia · Lomnický hrebeň</h3><span>GORE-TEX PRO 3L · ZIMA 2025</span></div>
            <div className="rig-grid"><div className="scene"><Image src="/img/propag_men.png" alt="Mužská expedičná zostava v Tatrách" fill sizes="(max-width: 700px) 100vw, 50vw" /><span className="scene-tag">Kompletná výstroj · 2 635 m n. m.</span></div><ProductList products={menProducts} selected={menSelected} onSelect={setMenSelected} /></div>
          </div>
          <div className="rig">
            <div className="rig-title"><span>Rig 02</span><h3>Dámska aktívna zostava · Priečne sedlo</h3><span>ACTIVE HYBRID · RÝCHLY POHYB</span></div>
            <div className="rig-grid reverse"><div className="scene"><Image src="/img/propag_women.png" alt="Dámska trailová zostava v Tatrách" fill sizes="(max-width: 700px) 100vw, 50vw" /><span className="scene-tag">Kompletná výstroj · 2 352 m n. m.</span></div><ProductList products={womenProducts} selected={womenSelected} onSelect={setWomenSelected} /></div>
          </div>
        </section>

        <section className="categories section" id="kolekcia"><div className="section-heading compact"><div><span className="eyebrow">Technická kolekcia</span><h2>Vyberte si svoj<br /><em>systém ochrany.</em></h2></div><a className="text-link" href="#footer">Všetky kategórie →</a></div><div className="category-grid">{categories.map(([name, count, image], index) => <a href="#lookbook" className="category-card" key={name}><span className="category-number">0{index + 1}</span><div><h3>{name}</h3><p>{count}</p></div><Image src={image} alt={name} fill sizes="(max-width: 700px) 50vw, 20vw" /><span className="category-arrow">↗</span></a>)}</div></section>

        <section className="proof"><div className="proof-intro"><span className="eyebrow">Tatranský štandard</span><h2>Navrhnuté pre extrém.<br /><em>Overené v zime vysokých Tatier.</em></h2></div><div className="proof-items"><div><strong>28 000<br />mm</strong><span>Vodný stĺpec</span><p>Prémiová ochrana proti snehu, dažďu a vetru.</p></div><div><strong>100%</strong><span>Tatranský craft</span><p>Testované v najnáročnejších podmienkach Vysokých Tatier.</p></div><div><strong>Doživotná</strong><span>záruka</span><p>Zabezpečujeme servis a starostlivosť o výstroj.</p></div></div></section>
      </main>

      <footer id="footer"><div className="footer-main"><div className="footer-brand"><MountainMark /><p>Technická výbava pre tých,<br />ktorí idú ďalej.</p><span className="partner">Oficiálny partner Horskej záchrannej služby</span></div><div className="footer-column"><span className="eyebrow">Kolekcia</span><a href="#kolekcia">Pánsky hardshell</a><a href="#kolekcia">Dámska alpinistická séria</a><a href="#kolekcia">Expedičné batohy</a></div><div className="footer-column"><span className="eyebrow">Podpora & servis</span><a href="#footer">Sprievodca veľkosťami</a><a href="#footer">Servis & oprava GORE-TEX</a><a href="#footer">Reklamácie</a></div><div className="footer-column"><span className="eyebrow">Kontakt & eko</span><a href="#footer">Ateliér Tatranská Lomnica</a><a href="#footer">Udržateľnosť</a><a href="#footer">Zákaznícka linka</a></div></div><div className="footer-bottom"><span>© 2025 VERTEX Tatran. Všetky práva vyhradené.</span><span>Ochrana súkromia &nbsp; Obchodné podmienky &nbsp; Cookies</span></div></footer>
    </div>
  );
}
