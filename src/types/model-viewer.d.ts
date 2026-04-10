import type { HTMLAttributes } from "react";

export type ModelViewerAttributes = HTMLAttributes<HTMLElement> & {
  src?: string;
  alt?: string;
  ar?: boolean | string;
  "ar-modes"?: string;
  "camera-controls"?: boolean | string;
  "shadow-intensity"?: string;
  exposure?: string;
  "environment-image"?: string;
  "touch-action"?: string;
  "interaction-prompt"?: string;
  scale?: string;
  "ios-src"?: string;
};

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": ModelViewerAttributes;
    }
  }
}
