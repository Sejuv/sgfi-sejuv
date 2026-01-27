import { useState, useEffect } from "react"
import { MapPin, ThermometerSimple, Seal } from "@phosphor-icons/react"

export function Footer() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [weather, setWeather] = useState<{ temp: number; location: string } | null>(null)

  useEffect(() => {
    // Atualizar hora a cada segundo
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    // Obter localização e clima
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            // Usando API gratuita do Open-Meteo
            const response = await fetch(
              `https://api.open-meteo.com/v1/forecast?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}&current_weather=true`
            )
            const data = await response.json()
            
            // Geocoding reverso para obter nome da cidade
            const geoResponse = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}`
            )
            const geoData = await geoResponse.json()
            
            setWeather({
              temp: Math.round(data.current_weather.temperature),
              location: geoData.address.city || geoData.address.town || geoData.address.village || "Localização"
            })
          } catch (error) {
            // Fallback para Irauçuba
            setWeather({
              temp: 28,
              location: "Irauçuba"
            })
          }
        },
        () => {
          // Erro de geolocalização - usar padrão
          setWeather({
            temp: 28,
            location: "Irauçuba"
          })
        }
      )
    } else {
      setWeather({
        temp: 28,
        location: "Irauçuba"
      })
    }

    return () => clearInterval(interval)
  }, [])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("pt-BR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    })
  }

  return (
    <footer className="flex h-10 shrink-0 items-center border-t bg-card/80 backdrop-blur-sm px-4">
      <div className="flex items-center justify-between w-full text-xs">
        {/* Lado Esquerdo - Localização e Temperatura */}
        <div className="flex items-center gap-3 text-muted-foreground">
          {weather && (
            <>
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" weight="fill" />
                <span>{weather.location}</span>
              </div>
              <div className="flex items-center gap-1">
                <ThermometerSimple className="h-4 w-4" weight="fill" />
                <span>{weather.temp}°C</span>
              </div>
            </>
          )}
        </div>

        {/* Centro - Desenvolvido por */}
        <div className="flex items-center gap-2 text-muted-foreground">
          <Seal className="h-4 w-4" weight="fill" />
          <span className="font-medium">Desenvolvido por JEOS Sistemas</span>
        </div>

        {/* Lado Direito - Hora e Data */}
        <div className="flex items-center gap-3 text-muted-foreground">
          <span className="font-mono font-semibold tabular-nums">{formatTime(currentTime)}</span>
          <span className="capitalize">{formatDate(currentTime)}</span>
        </div>
      </div>
    </footer>
  )
}
