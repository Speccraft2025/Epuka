'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface MapProps {
  center: [number, number];
  zoom: number;
  markers?: Array<{ id: string; name: string; position: [number, number] }>;
  onMarkerClick?: (id: string) => void;
  draggable?: boolean;
  onLocationSelect?: (pos: { lat: number; lng: number; address?: string }) => void;
  height?: string;
}

export default function Map({ 
  center, 
  zoom, 
  markers = [], 
  onMarkerClick, 
  draggable = false, 
  onLocationSelect,
  height = "400px" 
}: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current) return;

    // Fix for default marker icons in Leaflet + Webpack/Next.js
    // @ts-ignore
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    });

    if (!leafletMap.current) {
      leafletMap.current = L.map(mapRef.current).setView(center, zoom);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(leafletMap.current);
    } else {
      leafletMap.current.setView(center, zoom);
    }

    // Clear old markers
    leafletMap.current.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        leafletMap.current?.removeLayer(layer);
      }
    });

    // Add static markers (for lab list)
    markers.forEach(m => {
      const marker = L.marker(m.position).addTo(leafletMap.current!);
      marker.bindPopup(m.name);
      marker.on('click', () => onMarkerClick?.(m.id));
    });

    // Add draggable marker (for home collection)
    if (draggable) {
      markerRef.current = L.marker(center, { draggable: true }).addTo(leafletMap.current);
      markerRef.current.on('dragend', async () => {
        const pos = markerRef.current!.getLatLng();
        // Simple reverse geocoding using Nominatim (OpenStreetMap)
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.lat}&lon=${pos.lng}`);
          const data = await res.json();
          onLocationSelect?.({ lat: pos.lat, lng: pos.lng, address: data.display_name });
        } catch (e) {
          onLocationSelect?.({ lat: pos.lat, lng: pos.lng });
        }
      });
    }

    return () => {
      // Clean up map on unmount
      if (leafletMap.current) {
        // leafletMap.current.remove();
        // leafletMap.current = null;
      }
    };
  }, [center, zoom, markers, draggable, onMarkerClick, onLocationSelect]);

  return <div ref={mapRef} style={{ height, width: '100%', borderRadius: '12px', overflow: 'hidden' }} />;
}
