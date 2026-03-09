import { useState, useEffect } from 'react'

interface GeoInfo {
  city: string
  region: string
  country_name: string
}

function getLocalIP(): Promise<string> {
  return new Promise((resolve) => {
    try {
      const pc = new RTCPeerConnection({ iceServers: [] })
      pc.createDataChannel('')
      pc.createOffer()
        .then((offer) => pc.setLocalDescription(offer))
        .catch(() => resolve('—'))

      pc.onicecandidate = (ice) => {
        if (!ice || !ice.candidate) return
        const match = ice.candidate.candidate.match(
          /(\d{1,3}(?:\.\d{1,3}){3})/
        )
        if (match && !match[1].startsWith('127.')) {
          resolve(match[1])
          pc.close()
        }
      }

      // fallback se não retornar em 3s
      setTimeout(() => resolve('—'), 3000)
    } catch {
      resolve('—')
    }
  })
}

export function BottomBar() {
  const [now, setNow] = useState(new Date())
  const [localIP, setLocalIP] = useState<string>('…')
  const [geo, setGeo] = useState<GeoInfo | null>(null)

  // Relógio em tempo real
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // IP local via WebRTC
  useEffect(() => {
    getLocalIP().then(setLocalIP)
  }, [])

  // Localização via IP público (apenas cidade/país, sem exibir IP público)
  useEffect(() => {
    fetch('https://ipapi.co/json/')
      .then((r) => r.json())
      .then((data) => {
        setGeo({
          city: data.city ?? '—',
          region: data.region ?? '',
          country_name: data.country_name ?? '',
        })
      })
      .catch(() => {
        setGeo({ city: '—', region: '', country_name: '' })
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
      {/* Esquerda — Localização e IP local */}
      <div className="flex items-center gap-2 min-w-0">
        <span>📍</span>
        <span className="truncate">
          {geo
            ? `${geo.city}${geo.region ? `, ${geo.region}` : ''}${geo.country_name ? ` — ${geo.country_name}` : ''}`
            : 'Obtendo localização…'}
        </span>
        <span className="text-border">|</span>
        <span>🖥️</span>
        <span className="font-mono">{localIP}</span>
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
