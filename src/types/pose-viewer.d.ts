import type { DetailedHTMLProps, HTMLAttributes } from "react";

// JSX typing untuk web component <pose-viewer> (Stencil, dari sign.mt).
// Hanya prop yang kita pakai; sisanya diwarisi dari HTMLAttributes.
type PoseViewerProps = DetailedHTMLProps<
  HTMLAttributes<HTMLElement>,
  HTMLElement
> & {
  src?: string;
  loop?: boolean;
  autoplay?: boolean;
  background?: string;
  "aspect-ratio"?: number;
};

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "pose-viewer": PoseViewerProps;
    }
  }
}
