"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { letterSizes, numericSizes, validateBatchVariantInput, validateColorInput, validateVariantInput, type AdminColor, type AdminVariant } from "@/features/products/domain/AdminInventory";
import { isValidProductImage } from "@/features/products/domain/ProductImage";
import styles from "./admin.module.css";

type Props = {
  productId: number;
  productName: string;
  onChanged: () => Promise<void>;
  onBlockedChange: (blocked: boolean) => void;
  onDirtyChange: (dirty: boolean) => void;
};

function isInventory(value: unknown): value is AdminColor[] {
  return Array.isArray(value) && value.every((color: unknown) => {
    if (!color || typeof color !== "object" || !("id" in color) ||
      typeof color.id !== "number" || !("name" in color) ||
      !(typeof color.name === "string" || color.name === null) ||
      !("hexCode" in color) || !(typeof color.hexCode === "string" || color.hexCode === null) ||
      !("imageUrl" in color) || !(typeof color.imageUrl === "string" || color.imageUrl === null) ||
      !("images" in color) || !Array.isArray(color.images) ||
      !("variants" in color) || !Array.isArray(color.variants)) return false;
    return color.images.every((image: unknown) =>
      image !== null && typeof image === "object" &&
      "id" in image && typeof image.id === "number" &&
      "url" in image && typeof image.url === "string" &&
      "isPrimary" in image && typeof image.isPrimary === "boolean") &&
      color.variants.every((variant: unknown) =>
      variant !== null && typeof variant === "object" &&
      "id" in variant && typeof variant.id === "number" &&
      "sku" in variant && typeof variant.sku === "string" &&
      "size" in variant && (typeof variant.size === "string" || variant.size === null) &&
      "price" in variant && typeof variant.price === "string" &&
      "stock" in variant && typeof variant.stock === "number" &&
      "isActive" in variant && typeof variant.isActive === "boolean");
  });
}

const emptyVariant = { sku: "", size: "", price: "", stock: "0", isActive: true };

export function ProductInventory({ productId, productName, onChanged, onBlockedChange, onDirtyChange }: Props) {
  const [colors, setColors] = useState<AdminColor[]>([]);
  const [colorId, setColorId] = useState<number | null>(null);
  const [colorName, setColorName] = useState("");
  const [hexCode, setHexCode] = useState("#000000");
  const [variantColorId, setVariantColorId] = useState<number | null>(null);
  const [variantId, setVariantId] = useState<number | null>(null);
  const [variant, setVariant] = useState(emptyVariant);
  const [sizeType, setSizeType] = useState<"letter" | "numeric">("letter");
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [batchPrice, setBatchPrice] = useState("");
  const [fileByColor, setFileByColor] = useState<Record<number, File | undefined>>({});
  const [uploadVersions, setUploadVersions] = useState<Record<number, number>>({});
  const [busy, setBusy] = useState(true);
  const [needsRefresh, setNeedsRefresh] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const endpoint = `/api/admin/products/${productId}/inventory`;
  const editedColor = colors.find((color) => color.id === colorId);
  const editedVariant = colors.flatMap((color) => color.variants).find((item) => item.id === variantId);
  const dirtyColor = colorId === null
    ? colorName !== "" || hexCode !== "#000000"
    : colorName !== (editedColor?.name ?? "") || hexCode !== (editedColor?.hexCode ?? "#000000");
  const dirtyVariant = variantColorId !== null && (variantId === null
    ? selectedSizes.length > 0 || batchPrice !== ""
    : variant.sku !== editedVariant?.sku || variant.size !== (editedVariant?.size ?? "") ||
      variant.price !== editedVariant?.price || variant.stock !== String(editedVariant?.stock) ||
      variant.isActive !== editedVariant?.isActive);
  const dirty = dirtyColor || dirtyVariant || Object.values(fileByColor).some(Boolean);

  useEffect(() => {
    onBlockedChange(busy || needsRefresh);
  }, [busy, needsRefresh, onBlockedChange]);

  useEffect(() => {
    onDirtyChange(dirty);
  }, [dirty, onDirtyChange]);

  const load = useCallback(async (signal?: AbortSignal) => {
    const response = await fetch(endpoint, { cache: "no-store", signal });
    if (!response.ok) throw new Error("Farby a varianty sa nepodarilo načítať.");
    const result: unknown = await response.json();
    if (!result || typeof result !== "object" || !("data" in result) || !isInventory(result.data)) {
      throw new Error("Server vrátil neplatné údaje produktu.");
    }
    setColors(result.data);
  }, [endpoint]);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal)
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setNeedsRefresh(true);
          setMessage(error instanceof Error ? error.message : "Produkt sa nepodarilo načítať.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setBusy(false);
      });
    return () => controller.abort();
  }, [load]);

  async function refresh() {
    setBusy(true);
    try {
      await Promise.all([load(), onChanged()]);
      setNeedsRefresh(false);
      setMessage("Údaje sú obnovené. Skontrolujte poslednú zmenu.");
    } catch (error) {
      setNeedsRefresh(true);
      setMessage(error instanceof Error ? error.message : "Údaje sa nepodarilo obnoviť.");
    } finally {
      setBusy(false);
    }
  }

  async function mutate(path: string, method: string, body: BodyInit, contentType?: string) {
    if (busy || needsRefresh) return false;
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch(path, {
        method,
        body,
        ...(contentType ? { headers: { "Content-Type": contentType } } : {}),
      });
      if (!response.ok) {
        if (response.status >= 500 || (response.status === 409 && path.startsWith("/api/admin/product-images/"))) {
          setNeedsRefresh(true);
        }
        const result: unknown = await response.json();
        const error = result && typeof result === "object" && "error" in result && typeof result.error === "string"
          ? result.error : "Zmenu sa nepodarilo vykonať.";
        throw new Error(error);
      }
      setNeedsRefresh(true);
      const result: unknown = await response.json();
      if (!result || typeof result !== "object" || !("data" in result) ||
        !result.data || typeof result.data !== "object" ||
        !("success" in result.data) || result.data.success !== true) {
        throw new Error("Výsledok zmeny nie je známy. Obnovte údaje.");
      }
      await Promise.all([load(), onChanged()]);
      setNeedsRefresh(false);
      setMessage("Zmena bola uložená.");
      return true;
    } catch (error) {
      if (error instanceof TypeError) setNeedsRefresh(true);
      setMessage(error instanceof Error ? error.message : "Výsledok zmeny nie je známy.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  function saveColor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationError = validateColorInput({ name: colorName, hexCode });
    if (validationError) {
      setMessage(validationError);
      return;
    }
    void mutate(endpoint, "POST", JSON.stringify({
      action: "saveColor",
      ...(colorId === null ? {} : { colorId }),
      input: { name: colorName, hexCode },
    }), "application/json").then((saved) => {
      if (saved) {
        setColorId(null);
        setColorName("");
        setHexCode("#000000");
      }
    });
  }

  function saveVariant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (variantColorId === null) {
      setMessage("Vyberte farbu variantu.");
      return;
    }
    const body = variantId === null
      ? { action: "createVariants", colorId: variantColorId, input: { sizes: selectedSizes, price: batchPrice } }
      : { action: "saveVariant", colorId: variantColorId, variantId, input: { ...variant, stock: variant.stock.trim() === "" ? NaN : Number(variant.stock) } };
    const validationError = variantId === null
      ? validateBatchVariantInput(body.input)
      : validateVariantInput(body.input);
    if (validationError) {
      setMessage(validationError);
      return;
    }
    void mutate(endpoint, "POST", JSON.stringify(body), "application/json").then((saved) => {
      if (saved) {
        setVariantColorId(null);
        setVariant(emptyVariant);
        setSelectedSizes([]);
        setBatchPrice("");
      }
    });
  }

  function editVariant(color: AdminColor, selected: AdminVariant) {
    setVariantColorId(color.id);
    setVariantId(selected.id);
    setVariant({
      sku: selected.sku,
      size: selected.size ?? "",
      price: selected.price,
      stock: String(selected.stock),
      isActive: selected.isActive,
    });
  }

  async function addImage(color: AdminColor) {
    const file = fileByColor[color.id];
    if (!file) {
      setMessage("Vyberte obrázok.");
      return;
    }
    if (!isValidProductImage(file)) {
      setMessage("Povolené sú obrázky JPEG, PNG a WebP do 5 MB.");
      return;
    }
    const body = new FormData();
    body.append("image", file);
    const saved = await mutate(`/api/admin/product-images/${color.id}`, "POST", body);
    if (saved) {
      setFileByColor((current) => ({ ...current, [color.id]: undefined }));
      setUploadVersions((versions) => ({
        ...versions,
        [color.id]: (versions[color.id] ?? 0) + 1,
      }));
    }
  }

  function changeGallery(color: AdminColor, operation: object) {
    void mutate(`/api/admin/product-images/${color.id}`, "PATCH", JSON.stringify(operation), "application/json");
  }

  function moveImage(color: AdminColor, index: number, direction: -1 | 1) {
    const ids = color.images.map((image) => image.id);
    const next = index + direction;
    if (next < 0 || next >= ids.length) return;
    [ids[index], ids[next]] = [ids[next], ids[index]];
    changeGallery(color, { type: "order", imageIds: ids });
  }

  const disabled = busy || needsRefresh;
  return (
    <section className={styles.inventory}>
      <h3>Farby a varianty: {productName}</h3>
      {message && <p role="status">{message}</p>}
      {needsRefresh && (
        <button type="button" disabled={busy} onClick={() => void refresh()}>
          Obnoviť údaje
        </button>
      )}
      <form className={styles.form} onSubmit={saveColor}>
        <h4>{colorId === null ? "Nová farba" : `Upraviť farbu: ${colorName}`}</h4>
        <label>
          Názov farby
          <input
            required
            maxLength={30}
            value={colorName}
            disabled={disabled}
            onChange={(event) => setColorName(event.target.value)}
          />
        </label>
        <label>
          HEX farby
          <input
            required
            pattern="#[0-9a-fA-F]{6}"
            value={hexCode}
            disabled={disabled}
            onChange={(event) => setHexCode(event.target.value)}
          />
        </label>
        <div className={styles.actions}>
          <button type="submit" disabled={disabled}>
            Uložiť farbu
          </button>
          {colorId !== null && (
            <button type="button" disabled={disabled} onClick={() => {
              setColorId(null);
              setColorName("");
              setHexCode("#000000");
            }}>
              Zrušiť úpravu farby
            </button>
          )}
        </div>
      </form>
      {colors.length === 0 && !needsRefresh && <p>Produkt zatiaľ nemá žiadne farby.</p>}
      {colors.map((color) => (
        <section key={color.id} className={styles.colorCard}>
          <h4>{color.name ?? "Nešpecifikovaná farba"} · {color.hexCode ?? "bez HEX"}</h4>
          <div className={styles.actions}>
            <button type="button" disabled={disabled} onClick={() => {
              setColorId(color.id);
              setColorName(color.name ?? "");
              setHexCode(color.hexCode ?? "#000000");
            }}>
              Upraviť farbu
            </button>
            <button type="button" disabled={disabled} onClick={() => {
              if (window.confirm("Odstrániť prázdnu farbu?")) {
                void mutate(endpoint, "POST", JSON.stringify({ action: "deleteColor", colorId: color.id }), "application/json");
              }
            }}>
              Odstrániť farbu
            </button>
          </div>
          <p>Farbu s variantmi, obrázkami alebo obľúbenými položkami nemožno odstrániť.</p>
          <h5>Obrázky</h5>
          {color.images.length === 0 && <p>Farba zatiaľ nemá obrázky.</p>}
          <ul className={styles.categoryList}>
            {color.images.map((image, index) => (
              <li key={image.id} className={styles.categoryItem}>
                <div>
                  <img src={image.url} alt={`Obrázok ${index + 1}: ${color.name ?? productName}`} className={styles.productImage} />
                  <p>{index + 1}. obrázok {image.isPrimary && "· Hlavný"}</p>
                </div>
                <div className={styles.actions}>
                  <button type="button" disabled={disabled || index === 0} onClick={() => moveImage(color, index, -1)}>Posunúť vyššie</button>
                  <button type="button" disabled={disabled || index === color.images.length - 1} onClick={() => moveImage(color, index, 1)}>Posunúť nižšie</button>
                  <button type="button" disabled={disabled || image.isPrimary} onClick={() => changeGallery(color, { type: "primary", imageId: image.id })}>Nastaviť ako hlavný</button>
                  <button type="button" disabled={disabled} onClick={() => {
                    if (window.confirm("Odstrániť obrázok?")) changeGallery(color, { type: "delete", imageId: image.id });
                  }}>Odstrániť obrázok</button>
                </div>
              </li>
            ))}
          </ul>
          <label>
            Obrázok (JPEG, PNG alebo WebP, najviac 5 MB)
            <input
              key={`${color.id}-${uploadVersions[color.id] ?? 0}`}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={disabled}
              onChange={(event) => setFileByColor((current) => ({
                ...current,
                [color.id]: event.target.files?.[0],
              }))}
            />
          </label>
          <div className={styles.actions}>
            <button type="button" disabled={disabled || !fileByColor[color.id]} onClick={() => void addImage(color)}>
              Pridať obrázok
            </button>
          </div>
          <p>Ak existuje ďalší obrázok, po odstránení sa stane hlavným.</p>
          <h5>Varianty</h5>
          {color.variants.length === 0 ? <p>Farba zatiaľ nemá varianty.</p> : (
            <ul className={styles.categoryList}>
              {color.variants.map((item) => (
                <li key={item.id} className={styles.categoryItem}>
                  <span>
                    {item.size ?? "Bez veľkosti"} · {item.sku} · {item.price} € ·
                    sklad: {item.stock} · {item.isActive ? "Aktívny" : "Deaktivovaný"}
                  </span>
                  <button type="button" disabled={disabled} onClick={() => editVariant(color, item)}>
                    Upraviť variant
                  </button>
                </li>
              ))}
            </ul>
          )}
          <button type="button" disabled={disabled} onClick={() => {
            setVariantColorId(color.id);
            setVariantId(null);
            setVariant(emptyVariant);
            setSelectedSizes([]);
            setBatchPrice("");
            setSizeType("letter");
          }}>
            Pridať veľkosti
          </button>
          {variantColorId === color.id && (
            <form className={styles.form} onSubmit={saveVariant}>
              {variantId === null ? (
                <>
                  <h5>Vyberte veľkosti: {color.name}</h5>
                  <label>
                    Typ veľkostí
                    <select value={sizeType} disabled={disabled} onChange={(event) => {
                      setSizeType(event.target.value === "numeric" ? "numeric" : "letter");
                      setSelectedSizes([]);
                    }}>
                      <option value="letter">Písmenové</option>
                      <option value="numeric">Číselné</option>
                    </select>
                  </label>
                  <fieldset>
                    <legend>Veľkosti</legend>
                    <div className={styles.sizeChoices}>
                      {(sizeType === "letter" ? letterSizes : numericSizes).map((size) => (
                        <label key={size}>
                          <input type="checkbox" checked={selectedSizes.includes(size)}
                            disabled={disabled || color.variants.some((item) => item.size === size)}
                            onChange={(event) => setSelectedSizes((current) =>
                              event.target.checked ? [...current, size] : current.filter((value) => value !== size))} />
                          {size}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  <label>
                    Spoločná cena v €
                    <input required inputMode="decimal" pattern="[0-9]{1,8}([.][0-9]{1,2})?"
                      value={batchPrice} disabled={disabled} onChange={(event) => setBatchPrice(event.target.value)} />
                  </label>
                  <p>SKU sa vytvorí automaticky. Sklad bude 0 a možno ho doplniť pri úprave variantu.</p>
                </>
              ) : (
                <>
              <h5>Upraviť variant: {variant.sku}</h5>
              <label>
                SKU
                <input required maxLength={100} value={variant.sku} disabled={disabled}
                  onChange={(event) => setVariant({ ...variant, sku: event.target.value })} />
              </label>
              <label>
                Veľkosť
                <input required maxLength={20} value={variant.size} disabled={disabled}
                  onChange={(event) => setVariant({ ...variant, size: event.target.value })} />
              </label>
              <label>
                Cena v €
                <input required type="text" inputMode="decimal" pattern="[0-9]{1,8}([.][0-9]{1,2})?"
                  value={variant.price} disabled={disabled}
                  onChange={(event) => setVariant({ ...variant, price: event.target.value })} />
              </label>
              <label>
                Sklad
                <input required type="number" min="0" max="2147483647" step="1"
                  value={variant.stock} disabled={disabled}
                  onChange={(event) => setVariant({ ...variant, stock: event.target.value })} />
              </label>
              <label>
                <input type="checkbox" checked={variant.isActive} disabled={disabled}
                  onChange={(event) => setVariant({ ...variant, isActive: event.target.checked })} />
                Aktívny variant
              </label>
                </>
              )}
              <div className={styles.actions}>
                <button type="submit" disabled={disabled}>{variantId === null ? "Vytvoriť varianty" : "Uložiť variant"}</button>
                <button type="button" disabled={disabled} onClick={() => setVariantColorId(null)}>Zrušiť úpravu variantu</button>
              </div>
            </form>
          )}
        </section>
      ))}
    </section>
  );
}
