import { LogoInv } from "@/components/LogoInv";

export function Footer() {
  return (
    <footer id="footer">
      <div className="footer-main">
        {/* Značka a partnerstvo */}
        <div className="footer-brand">
          <LogoInv />
          <p>Technická výbava pre tých,<br />ktorí idú ďalej.</p>
          <span className="partner">Oficiálny partner Horskej záchrannej služby</span>
        </div>

        {/* Stĺpec 1: Kolekcie */}
        <div className="footer-column">
          <span className="eyebrow">Kolekcia</span>
          <a href="#kolekcia">Pánsky hardshell</a>
          <a href="#kolekcia">Dámska alpinistická séria</a>
          <a href="#kolekcia">Expedičné batohy</a>
        </div>

        {/* Stĺpec 2: Podpora a servis */}
        <div className="footer-column">
          <span className="eyebrow">Podpora & servis</span>
          <a href="#footer">Sprievodca veľkosťami</a>
          <a href="#footer">Servis & oprava GORE-TEX</a>
          <a href="#footer">Reklamácie</a>
        </div>

        {/* Stĺpec 3: Kontakt a udržateľnosť */}
        <div className="footer-column">
          <span className="eyebrow">Kontakt & eko</span>
          <a href="#footer">Ateliér Tatranská Lomnica</a>
          <a href="#footer">Udržateľnosť</a>
          <a href="#footer">Zákaznícka linka</a>
        </div>
      </div>

      {/* Spodná lišta s copyrightom */}
      <div className="footer-bottom">
        <span>© 2025 VERTEX Tatran. Všetky práva vyhradené.</span>
        <span>Ochrana súkromia &nbsp; Obchodné podmienky &nbsp; Cookies</span>
      </div>
    </footer>
  );
}