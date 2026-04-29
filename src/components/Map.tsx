'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface MapMarker {
  id: string;
  name: string;
  position: [number, number];
}

interface MapProps {
  center: [number, number];
  zoom: number;
  markers?: MapMarker[];
  onMarkerClick?: (id: string) => void;
  draggable?: boolean;
  onLocationSelect?: (pos: { lat: number; lng: number; address: string }) => void;
  height?: string;
  showSearch?: boolean;
}

interface SearchResult {
  display_name: string;
  lat: string;
  lon: string;
}

// Fix Leaflet icon issue with Next.js at module level
function fixLeafletIcons() {
  // @ts-ignore
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
}

export default function Map({
  center,
  zoom,
  markers = [],
  onMarkerClick,
  draggable = false,
  onLocationSelect,
  height = '400px',
  showSearch = false,
}: MapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const draggableMarkerRef = useRef<L.Marker | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState('');
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  // Reverse geocode a position
  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await res.json();
      return (data.display_name as string) || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    } catch {
      return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    }
  }, []);

  // Search by text query
  const handleSearch = useCallback(async (q: string) => {
    if (q.trim().length < 3) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&countrycodes=ke&limit=5`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data: SearchResult[] = await res.json();
      setSearchResults(data);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const onSearchInput = (val: string) => {
    setSearchQuery(val);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => handleSearch(val), 400);
  };

  const selectSearchResult = useCallback(async (result: SearchResult) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    setSearchQuery(result.display_name);
    setSelectedAddress(result.display_name);
    setSearchResults([]);

    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([lat, lng], 16, { animate: true });

      if (draggable && draggableMarkerRef.current) {
        draggableMarkerRef.current.setLatLng([lat, lng]);
      }
    }

    onLocationSelect?.({ lat, lng, address: result.display_name });
  }, [draggable, onLocationSelect]);

  // Initialize map once
  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current || mapInstanceRef.current) return;

    fixLeafletIcons();

    const map = L.map(mapContainerRef.current, {
      center,
      zoom,
      zoomControl: true,
      scrollWheelZoom: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    // Layer group for static markers
    const layerGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = layerGroup;

    // Draggable home pin
    if (draggable) {
      const pin = L.marker(center, {
        draggable: true,
        autoPan: true,
      }).addTo(map);
      pin.bindPopup('📍 Drag to your location').openPopup();

      pin.on('dragend', async () => {
        const pos = pin.getLatLng();
        const address = await reverseGeocode(pos.lat, pos.lng);
        setSelectedAddress(address);
        onLocationSelect?.({ lat: pos.lat, lng: pos.lng, address });
      });

      // Also allow tap-to-place on mobile
      map.on('click', async (e: L.LeafletMouseEvent) => {
        if (!draggable) return;
        pin.setLatLng(e.latlng);
        const address = await reverseGeocode(e.latlng.lat, e.latlng.lng);
        setSelectedAddress(address);
        onLocationSelect?.({ lat: e.latlng.lat, lng: e.latlng.lng, address });
      });

      draggableMarkerRef.current = pin;
    }

    mapInstanceRef.current = map;

    // Invalidate size after mount (fixes mobile blank map)
    setTimeout(() => map.invalidateSize(), 300);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      draggableMarkerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync static markers
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;
    markersLayerRef.current.clearLayers();
    markers.forEach((m) => {
      const marker = L.marker(m.position).addTo(markersLayerRef.current!);
      marker.bindPopup(`<strong>${m.name}</strong>`);
      marker.on('click', () => onMarkerClick?.(m.id));
    });
  }, [markers, onMarkerClick]);

  // Sync center/zoom from props
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView(center, zoom, { animate: true });
    }
  }, [center, zoom]);

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {/* Search Bar */}
      {(showSearch || draggable) && (
        <div style={{
          position: 'absolute',
          top: 10,
          left: 10,
          right: 10,
          zIndex: 1000,
        }}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchInput(e.target.value)}
              placeholder="🔍 Search for your location..."
              style={{
                width: '100%',
                padding: '10px 16px',
                borderRadius: 12,
                border: '1px solid rgba(52,211,153,0.3)',
                background: 'rgba(10,14,13,0.92)',
                backdropFilter: 'blur(12px)',
                color: '#f0fdf4',
                fontSize: '0.9rem',
                outline: 'none',
                fontFamily: 'Inter, sans-serif',
                boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
              }}
            />
            {searching && (
              <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#34d399', fontSize: '0.75rem' }}>
                Searching...
              </div>
            )}
          </div>

          {/* Search Results Dropdown */}
          {searchResults.length > 0 && (
            <div style={{
              marginTop: 4,
              background: 'rgba(10,14,13,0.97)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(52,211,153,0.2)',
              borderRadius: 12,
              overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            }}>
              {searchResults.map((r, i) => (
                <button
                  key={i}
                  onClick={() => selectSearchResult(r)}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '10px 16px',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: i < searchResults.length - 1 ? '1px solid rgba(52,211,153,0.08)' : 'none',
                    color: '#f0fdf4',
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    fontFamily: 'Inter, sans-serif',
                    lineHeight: 1.4,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(52,211,153,0.08)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  📍 {r.display_name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Selected Address Pill */}
      {draggable && selectedAddress && (
        <div style={{
          position: 'absolute',
          bottom: 10,
          left: 10,
          right: 10,
          zIndex: 1000,
          background: 'rgba(10,14,13,0.9)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(52,211,153,0.3)',
          borderRadius: 10,
          padding: '8px 12px',
          fontSize: '0.78rem',
          color: '#34d399',
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        }}>
          ✅ {selectedAddress.length > 80 ? selectedAddress.slice(0, 77) + '...' : selectedAddress}
        </div>
      )}

      {/* Map Container */}
      <div
        ref={mapContainerRef}
        style={{
          height,
          width: '100%',
          borderRadius: 16,
          overflow: 'hidden',
          zIndex: 1,
        }}
      />
    </div>
  );
}
