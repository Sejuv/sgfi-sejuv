import { useState, useEffect } from 'react'

interface GeoInfo {
  ip: string
  city: string
  region: string
  country_name: string
}

export function BottomBar() {
  const [now, setNow] = useState(new Date())
  const [geo, setGeo] = useState<GeoInfo | null>(null)

  // Relógio em tempo real
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // IP + localização
  useEffect(() => {
    fetch('https://ipapi.co/json/')
      .then((r) => r.json())
      .then((data) => {
        setGeo({
          ip: data.ip ?? '—',
          city: data.city ?? '—',
          region: data.region ?? '',
          country_name: data.country_name ?? '',
        })
      })
      .catch(() => {
        setGeo({ ip: '—', city: '—', region: '', country_name: '' })
      })
  }, [])

  const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const dateStr = now.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 h-9 flex items-center justify-between px-4
                 bg-background/90 border-t border-border backdrop-blur
                 text-[11px] text-muted-foreground select-none"
    >
      {/* Esquerda — Localização e IP */}
      <div className="flex items-center gap-2 min-w-0">
        <span>📍</span>
        <span className="truncate">
          {geo
            ? `${geo.city}${geo.region ? `, ${geo.region}` : ''}${geo.country_name ? ` — ${geo.country_name}` : ''}`
            : 'Obtendo localização…'}
        </span>
        <span className="text-border">|</span>
        <span>🌐</span>
        <span className="font-mono">{geo ? geo.ip : '…'}</span>
      </div>

      {/* Centro — Assinatura */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1 whitespace-nowrap font-medium text-foreground/70">
        <span>⚙️</span>
        <span>Produzido por</span>
        <span className="font-semibold text-primary">Taylan Itallo</span>
        <span>—</span>
        <span className="font-semibold">JEOS Sistemas</span>
        <span>💡</span>
      </div>

      {/* Direita — Hora e Data */}
      <div className="flex items-center gap-2">
        <span>🕐</span>
        <span className="font-mono font-semibold text-foreground/80">{timeStr}</span>
        <span className="text-border">|</span>
        <span>📅</span>
        <span>{dateStr}</span>
      </div>
    </div>
  )
}
