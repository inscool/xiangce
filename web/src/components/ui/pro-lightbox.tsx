"use client";

import type { ReactNode } from "react";

import Lightbox from "yet-another-react-lightbox";
import Fullscreen from "yet-another-react-lightbox/plugins/fullscreen";
import Slideshow from "yet-another-react-lightbox/plugins/slideshow";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import Zoom from "yet-another-react-lightbox/plugins/zoom";

import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";

export type ProLightboxSlide = {
  src: string;
  alt?: string;
  id: string;
  storageKey: string;
};

type Props = {
  open: boolean;
  index: number;
  slides: ProLightboxSlide[];
  onClose: () => void;
  onView?: (index: number) => void;
  renderFooter?: (slide: ProLightboxSlide) => ReactNode;
};

export function ProLightbox({ open, index, slides, onClose, onView, renderFooter }: Props) {
  return (
    <Lightbox
      open={open}
      close={onClose}
      index={index}
      slides={slides}
      carousel={{ finite: false }}
      controller={{ closeOnBackdropClick: true }}
      plugins={[Zoom, Slideshow, Fullscreen, Thumbnails]}
      zoom={{ maxZoomPixelRatio: 4, zoomInMultiplier: 1.6 }}
      thumbnails={{ position: "bottom", border: 0, borderRadius: 8, gap: 10, imageFit: "cover" }}
      on={{ view: ({ index: activeIndex }) => onView?.(activeIndex) }}
      render={
        renderFooter
          ? {
              slideFooter: ({ slide }) => renderFooter(slide as ProLightboxSlide),
            }
          : undefined
      }
    />
  );
}
