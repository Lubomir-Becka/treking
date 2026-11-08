import Image from "next/image";
import type { ProductImage } from "../../domain/products/product";
import styles from "./styles/product-gallery.module.css";

type ProductGalleryProps = {
  images: ProductImage[];
  selectedImage: number;
  onSelectImage: (index: number) => void;
};

export function ProductGallery({
  images,
  selectedImage,
  onSelectImage,
}: ProductGalleryProps) {
  return (
    <div className={styles.gallery}>
      <div className={styles.hero} >
        {images[selectedImage] ? (
          <Image
            src={images[selectedImage].url}
            alt={images[selectedImage].alt}
            fill
            priority
            sizes="(max-width: 760px) 100vw, 58vw"
          />
        ) : (
          <span>Produktový náhľad</span>
        )}
        <span>Produktová galéria</span>
        <b>{images.length ? `${selectedImage + 1} / ${images.length}` : "Bez obrázka"}</b>
      </div>

      {images.length > 0 && (
        <div className={styles.thumbnails} aria-label="Galéria produktu">
          {images.map((image, index) => (
            <button
              key={image.url}
              type="button"
              className={index === selectedImage ? styles.active : ""}
              onClick={() => onSelectImage(index)}
              aria-label={image.alt}
            >
              <Image src={image.url} alt="" fill sizes="100px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
