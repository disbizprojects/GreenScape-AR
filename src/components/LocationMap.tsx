"use client";

import type { LatLngExpression } from "leaflet";
import dynamic from "next/dynamic";
import { useMemo } from "react";

const MapInner = dynamic(() => import("./LocationMapInner"), { ssr: false });

type Props = {
  lat: number;
  lng: number;
  onLocationChange: (lat: number, lng: number) => void;
  className?: string;
};

export function LocationMap({ lat, lng, onLocationChange, className }: Props) {
  const center = useMemo<LatLngExpression>(() => [lat, lng], [lat, lng]);
  return (
    <div className={className}>
      <MapInner center={center} onLocationChange={onLocationChange} />
    </div>
  );
}
