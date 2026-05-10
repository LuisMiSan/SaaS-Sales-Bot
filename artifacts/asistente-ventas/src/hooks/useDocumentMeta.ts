import { useEffect } from "react";

const DEFAULT_TITLE = "Pujamostucoche.es — Compra coches a precio mayorista";
const DEFAULT_DESC = "Compra coches de ocasión a precio mayorista en Madrid. Sin margen de concesionario, sin comisiones ocultas. Bloquea tu coche 2 horas gratis y sin compromiso.";
const DEFAULT_URL = "https://pujamostucoche.es";
const DEFAULT_IMG = "https://pujamostucoche.es/opengraph.jpg";

function setMeta(name: string, content: string) {
  let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("name", name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setOg(property: string, content: string) {
  let el = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("property", property);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setTwitter(name: string, content: string) {
  let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("name", name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setCanonical(url: string) {
  let el = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", url);
}

function setJsonLd(id: string, data: object) {
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement("script");
    el.id = id;
    el.setAttribute("type", "application/ld+json");
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

function removeJsonLd(id: string) {
  document.getElementById(id)?.remove();
}

interface DocumentMetaProps {
  title: string;
  description?: string;
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogUrl?: string;
  ogType?: string;
}

export function useDocumentMeta({
  title,
  description,
  canonical,
  ogTitle,
  ogDescription,
  ogImage,
  ogUrl,
  ogType = "website",
}: DocumentMetaProps) {
  useEffect(() => {
    const desc = description ?? DEFAULT_DESC;
    const url = canonical ?? ogUrl ?? DEFAULT_URL;
    const img = ogImage ?? DEFAULT_IMG;

    document.title = title;
    setMeta("description", desc);
    setOg("og:title", ogTitle ?? title);
    setOg("og:description", ogDescription ?? desc);
    setOg("og:url", url);
    setOg("og:type", ogType);
    setOg("og:image", img);
    setTwitter("twitter:title", ogTitle ?? title);
    setTwitter("twitter:description", ogDescription ?? desc);
    setTwitter("twitter:image", img);
    setCanonical(url);

    return () => {
      document.title = DEFAULT_TITLE;
      setMeta("description", DEFAULT_DESC);
      setOg("og:title", DEFAULT_TITLE);
      setOg("og:description", DEFAULT_DESC);
      setOg("og:url", DEFAULT_URL);
      setOg("og:type", "website");
      setOg("og:image", DEFAULT_IMG);
      setTwitter("twitter:title", DEFAULT_TITLE);
      setTwitter("twitter:description", DEFAULT_DESC);
      setTwitter("twitter:image", DEFAULT_IMG);
      setCanonical(DEFAULT_URL);
    };
  }, [title, description, canonical, ogTitle, ogDescription, ogImage, ogUrl, ogType]);
}

interface CarForJsonLd {
  id: number;
  make: string;
  model: string;
  year: number;
  price: number;
  km: number;
  fuel?: string | null;
  color?: string | null;
  bodyType?: string | null;
  description?: string | null;
  location?: string | null;
  imageUrl?: string | null;
}

export function useCarJsonLd(car: CarForJsonLd | null | undefined) {
  useEffect(() => {
    if (!car) return;
    const schema = {
      "@context": "https://schema.org",
      "@type": "Car",
      "@id": `https://pujamostucoche.es/tienda/coche/${car.id}`,
      "name": `${car.make} ${car.model} ${car.year}`,
      "brand": { "@type": "Brand", "name": car.make },
      "model": car.model,
      "vehicleModelDate": String(car.year),
      "mileageFromOdometer": { "@type": "QuantitativeValue", "value": car.km, "unitCode": "KMT" },
      ...(car.fuel ? { "fuelType": car.fuel } : {}),
      ...(car.color ? { "color": car.color } : {}),
      ...(car.bodyType ? { "bodyType": car.bodyType } : {}),
      ...(car.description ? { "description": car.description } : {}),
      ...(car.imageUrl ? { "image": car.imageUrl } : {}),
      "url": `https://pujamostucoche.es/tienda/coche/${car.id}`,
      "offers": {
        "@type": "Offer",
        "price": car.price,
        "priceCurrency": "EUR",
        "availability": "https://schema.org/InStock",
        "url": `https://pujamostucoche.es/tienda/coche/${car.id}`,
        "seller": {
          "@type": "AutoDealer",
          "name": "Pujamostucoche",
          "url": "https://pujamostucoche.es",
        },
      },
    };
    setJsonLd("ld-car", schema);
    return () => removeJsonLd("ld-car");
  }, [car?.id]);
}
