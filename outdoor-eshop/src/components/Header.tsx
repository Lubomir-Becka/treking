import { Logo } from "@/components/Logo";

function Icon({ children }: { children: React.ReactNode }) {
  return <span className="icon" aria-hidden="true">{children}</span>;
}

export function Header() {
  return (
    <header className="site-header">
     <Logo />
      <nav className="main-nav" aria-label="Hlavná navigácia">
        <a href="#kolekcia">Páni <span>⌄</span></a>
        <a href="#kolekcia">Dámy <span>⌄</span></a>
        <a href="#kolekcia">Deti <span>⌄</span></a>
      </nav>
      
      <div className="search">
        <Icon>⌕</Icon>
        <input aria-label="Hľadať výbavu" placeholder="Hľadať výbavu..." />
      </div>
      
      <div className="header-actions">
        <button aria-label="Obľúbené">
          <Icon>♡</Icon><b>0</b>
        </button>
        <button aria-label="Košík">
          <Icon>♧</Icon><b>2</b>
        </button>
        <button className="account" aria-label="Prihlásenie">
          <Icon>♙</Icon><span>Účet</span>
        </button>
      </div>
    </header>
  );
}