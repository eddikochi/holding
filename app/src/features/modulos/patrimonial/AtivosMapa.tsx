import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Ativo } from '../../../models/types';

/**
 * Mapa dos ativos (Leaflet + OpenStreetMap). Usa circleMarkers (sem imagens
 * externas) para funcionar no HTML single-file. Degrada graciosamente:
 * sem internet ou sem tiles, mostra a lista em vez do mapa.
 */
export function AtivosMapa({ ativos }: { ativos: Ativo[] }) {
  const comCoord = ativos.filter((a) => a.lat != null && a.lng != null);
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const [online, setOnline] = useState<boolean>(typeof navigator === 'undefined' ? true : navigator.onLine);
  const [tilesFalharam, setTilesFalharam] = useState(false);

  useEffect(() => {
    function atualiza() { setOnline(navigator.onLine); }
    window.addEventListener('online', atualiza);
    window.addEventListener('offline', atualiza);
    return () => { window.removeEventListener('online', atualiza); window.removeEventListener('offline', atualiza); };
  }, []);

  const mostrarMapa = online && !tilesFalharam && comCoord.length > 0;

  useEffect(() => {
    if (!mostrarMapa || !ref.current) return;
    // São Borja como centro padrão
    const map = L.map(ref.current).setView([-28.66, -56.0], 12);
    mapRef.current = map;
    const tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap',
    });
    tiles.on('tileerror', () => setTilesFalharam(true));
    tiles.addTo(map);

    // cores vêm dos design tokens (trocar no tokens.css reflete aqui também)
    const raiz = getComputedStyle(document.documentElement);
    const corBorda = raiz.getPropertyValue('--blue').trim() || '#1e3a5f';
    const corPreenche = raiz.getPropertyValue('--amber').trim() || '#c0762a';
    const pontos: L.LatLngExpression[] = [];
    for (const a of comCoord) {
      const ll: L.LatLngExpression = [a.lat!, a.lng!];
      pontos.push(ll);
      L.circleMarker(ll, { radius: 8, color: corBorda, fillColor: corPreenche, fillOpacity: 0.9, weight: 2 })
        .addTo(map)
        .bindPopup(`<b>${a.nome}</b><br>${a.endereco || ''}`);
    }
    if (pontos.length === 1) map.setView(pontos[0], 14);
    else if (pontos.length > 1) map.fitBounds(L.latLngBounds(pontos).pad(0.2));

    // corrige render dentro de container que acabou de aparecer
    setTimeout(() => map.invalidateSize(), 100);

    return () => { map.remove(); mapRef.current = null; };
  }, [mostrarMapa, comCoord]);

  if (comCoord.length === 0) {
    return (
      <p style={{ color: 'var(--ink-soft)', fontSize: 13 }}>
        Nenhum ativo com coordenadas ainda. Preencha lat/lng na ficha de um ativo para plotá-lo no mapa.
      </p>
    );
  }

  if (!mostrarMapa) {
    return (
      <div>
        <div className="alerta">
          {online ? 'Não foi possível carregar o mapa (tiles).' : 'Você está offline.'} Mostrando a lista dos ativos com coordenadas.
        </div>
        <ul style={{ fontSize: 13 }}>
          {comCoord.map((a) => <li key={a.id}><b>{a.nome}</b>: {a.lat}, {a.lng} {a.endereco ? `— ${a.endereco}` : ''}</li>)}
        </ul>
      </div>
    );
  }

  return <div ref={ref} style={{ height: 360, borderRadius: 'var(--r-panel)', overflow: 'hidden', border: '1px solid var(--line)' }} />;
}
