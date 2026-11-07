import Image from "next/image";
export function Logo() {
  return (
    <a href="#" className="brand-mark inline-flex items-center gap-2" aria-label="VERTEX Tatran">
      {/* Importované SVG z priečinka public/img/logo.svg */}
      <Image 
        src="/img/logo.svg" 
        alt="VERTEX Tatran Logo" 
        width={42} 
        height={27} 
        priority 
      />
      <span>VERTEX<small>TATRAN</small></span>
    </a>
  );
}