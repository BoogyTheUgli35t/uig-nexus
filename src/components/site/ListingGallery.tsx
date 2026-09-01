import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Building2, ChevronLeft, ChevronRight, Expand, Star, X } from "lucide-react";
import { groupListingImages, listingImageSection, sizedImage } from "@/lib/media";
import { cn } from "@/lib/utils";

export type ListingImage = {
  id: string;
  storage_path: string;
  position: number;
  caption: string | null;
  is_render: boolean;
};

type Props = {
  images: ListingImage[];
  title: string;
  featured?: boolean | null;
  /** Turns a stored path into a delivery URL (Supabase Storage or a CDN URL). */
  resolve: (path: string) => string;
};

const SWIPE_THRESHOLD = 45;

/**
 * Listing photo gallery.
 *
 * Buyers expect to move through a property the way they would walk it, so the
 * shots are grouped into Outside / Indoors / Area & more (derived from the
 * caption — see listingImageSection) with a jump chip per section. Every
 * navigation route people actually reach for is wired: arrow buttons, left and
 * right arrow keys, a horizontally scrollable thumbnail rail, touch swipe on
 * the stage, and a full-screen lightbox for detail.
 */
export function ListingGallery({ images, title, featured, resolve }: Props) {
  const [index, setIndex] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

  const ordered = useMemo(() => {
    // Flatten the grouped order so index arithmetic and the rail agree.
    return groupListingImages(images).flatMap((g) => g.images);
  }, [images]);

  const groups = useMemo(() => groupListingImages(images), [images]);

  const count = ordered.length;
  const active = ordered[index];
  const hasRenders = images.some((i) => i.is_render);

  const go = useCallback(
    (delta: number) => {
      if (count === 0) return;
      setIndex((i) => (i + delta + count) % count);
    },
    [count],
  );

  // Keep the rail's active thumbnail in view whichever way the image changed.
  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    const thumb = rail.querySelector<HTMLElement>(`[data-thumb="${index}"]`);
    thumb?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
  }, [index]);

  useEffect(() => {
    if (count < 2 && !lightbox) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") {
        go(1);
      } else if (e.key === "ArrowLeft") {
        go(-1);
      } else if (e.key === "Escape" && lightbox) {
        setLightbox(false);
      } else {
        return;
      }
      e.preventDefault();
    }
    // While the lightbox is open it owns the keyboard; otherwise arrows only
    // apply once the gallery itself has focus, so they don't hijack the page.
    const target: HTMLElement | Document = lightbox ? document : (stageRef.current ?? document);
    target.addEventListener("keydown", onKey as EventListener);
    return () => target.removeEventListener("keydown", onKey as EventListener);
  }, [go, lightbox, count]);

  useEffect(() => {
    if (!lightbox) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [lightbox]);

  if (count === 0) {
    return (
      <div className="flex aspect-[4/3] w-full items-center justify-center rounded-xl border border-border bg-background text-muted-foreground">
        <div className="text-center">
          <Building2 className="mx-auto h-10 w-10" />
          <p className="mt-2 text-xs">Photography for this listing is on the way.</p>
        </div>
      </div>
    );
  }

  const sectionOfActive = listingImageSection(active.caption, active.position);

  return (
    <div>
      {/* Stage */}
      <div
        ref={stageRef}
        tabIndex={0}
        role="group"
        aria-roledescription="carousel"
        aria-label={`${title} — photo ${index + 1} of ${count}`}
        className="relative aspect-[4/3] overflow-hidden rounded-xl border border-border bg-background outline-none focus-visible:ring-2 focus-visible:ring-gold"
        onTouchStart={(e) => {
          touchStartX.current = e.touches[0]?.clientX ?? null;
        }}
        onTouchEnd={(e) => {
          const start = touchStartX.current;
          touchStartX.current = null;
          if (start == null) return;
          const dx = (e.changedTouches[0]?.clientX ?? start) - start;
          if (Math.abs(dx) > SWIPE_THRESHOLD) go(dx < 0 ? 1 : -1);
        }}
      >
        <img
          src={sizedImage(resolve(active.storage_path), 1200) ?? resolve(active.storage_path)}
          alt={active.caption ?? title}
          className="h-full w-full cursor-zoom-in object-cover"
          onClick={() => setLightbox(true)}
        />

        <div className="pointer-events-none absolute inset-x-3 top-3 flex flex-wrap items-start justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            {featured && (
              <span className="inline-flex items-center gap-1 rounded-full bg-background/90 px-2.5 py-1 text-xs font-semibold text-gold backdrop-blur">
                <Star className="h-3 w-3 fill-current" /> Featured
              </span>
            )}
            {hasRenders && (
              <span className="rounded-full border border-border bg-background/80 px-3 py-1 text-[11px] text-muted-foreground backdrop-blur">
                Illustrative imagery — actual photos to follow
              </span>
            )}
          </div>
          <span className="rounded-full bg-background/80 px-2.5 py-1 text-[11px] tabular-nums text-muted-foreground backdrop-blur">
            {index + 1} / {count}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setLightbox(true)}
          aria-label="Open full-screen view"
          className="absolute bottom-3 right-3 rounded-full bg-background/80 p-2 text-muted-foreground backdrop-blur transition hover:bg-background hover:text-foreground"
        >
          <Expand className="h-4 w-4" />
        </button>

        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous photo"
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-2 backdrop-blur transition hover:bg-background"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next photo"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-2 backdrop-blur transition hover:bg-background"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}
      </div>

      {/* Section jump chips — only earn their place when there's more than one */}
      {groups.length > 1 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {groups.map((g) => {
            const firstIndex = ordered.findIndex((img) => img.id === g.images[0].id);
            const isActive = g.section === sectionOfActive;
            return (
              <button
                key={g.section}
                type="button"
                onClick={() => setIndex(firstIndex)}
                aria-pressed={isActive}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs transition",
                  isActive
                    ? "border-gold/40 bg-gold/10 text-gold"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {g.label} <span className="tabular-nums opacity-60">{g.images.length}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Thumbnail rail — scrolls sideways, snaps, and never wraps */}
      {count > 1 && (
        <div
          ref={railRef}
          className="mt-3 flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]"
        >
          {ordered.map((img, i) => (
            <button
              key={img.id}
              type="button"
              data-thumb={i}
              onClick={() => setIndex(i)}
              aria-label={img.caption ?? `Photo ${i + 1}`}
              aria-current={i === index}
              className={cn(
                "h-16 w-24 shrink-0 snap-start overflow-hidden rounded-lg border-2 transition sm:h-20 sm:w-28",
                i === index ? "border-gold" : "border-transparent opacity-70 hover:opacity-100",
              )}
            >
              <img
                src={sizedImage(resolve(img.storage_path), 240) ?? resolve(img.storage_path)}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {active.caption && <p className="mt-2 text-xs text-muted-foreground">{active.caption}</p>}

      {/* Lightbox */}
      {lightbox && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${title} — full-screen photo viewer`}
          className="fixed inset-0 z-[120] flex flex-col bg-black/95 p-4 sm:p-8"
          onClick={() => setLightbox(false)}
        >
          <div className="flex items-center justify-between gap-3 text-sm text-white/70">
            <span className="truncate">{active.caption ?? title}</span>
            <span className="shrink-0 tabular-nums">
              {index + 1} / {count}
            </span>
            <button
              type="button"
              onClick={() => setLightbox(false)}
              aria-label="Close full-screen view"
              className="shrink-0 rounded-full p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div
            className="relative flex min-h-0 flex-1 items-center justify-center"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => {
              touchStartX.current = e.touches[0]?.clientX ?? null;
            }}
            onTouchEnd={(e) => {
              const start = touchStartX.current;
              touchStartX.current = null;
              if (start == null) return;
              const dx = (e.changedTouches[0]?.clientX ?? start) - start;
              if (Math.abs(dx) > SWIPE_THRESHOLD) go(dx < 0 ? 1 : -1);
            }}
          >
            <img
              src={sizedImage(resolve(active.storage_path), 1800) ?? resolve(active.storage_path)}
              alt={active.caption ?? title}
              className="max-h-full max-w-full object-contain"
            />
            {count > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => go(-1)}
                  aria-label="Previous photo"
                  className="absolute left-0 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => go(1)}
                  aria-label="Next photo"
                  className="absolute right-0 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
