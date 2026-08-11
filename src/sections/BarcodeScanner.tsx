import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'
import type { IScannerControls } from '@zxing/browser'
import { Camera, CameraOff, Keyboard, Loader2, ScanLine, SearchX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import type { FoodItem } from '@/types'
import { fetchOFFByBarcode } from '@/lib/openfoodfacts'

interface Props {
  open: boolean
  onClose: () => void
  onFound: (food: FoodItem) => void
}

type Status = 'idle' | 'camera' | 'fetching' | 'notfound' | 'error'

export default function BarcodeScanner({ open, onClose, onFound }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [cameraError, setCameraError] = useState(false)
  const [manual, setManual] = useState('')
  const lastCode = useRef('')

  // Arranque/parada de la cámara con el diálogo
  useEffect(() => {
    if (!open) return
    setStatus('idle')
    setCameraError(false)
    lastCode.current = ''
    let cancelled = false
    let controls: IScannerControls | undefined
    const reader = new BrowserMultiFormatReader()

    const start = async () => {
      try {
        // Pequeño retardo para que el <video> esté montado
        await new Promise((r) => setTimeout(r, 300))
        if (cancelled || !videoRef.current) return
        setStatus('camera')
        controls = await reader.decodeFromVideoDevice(undefined, videoRef.current, (result) => {
          if (result && !cancelled) {
            const code = result.getText()
            if (code !== lastCode.current) {
              lastCode.current = code
              lookup(code)
            }
          }
        })
      } catch {
        if (!cancelled) setCameraError(true)
      }
    }
    start()
    return () => {
      cancelled = true
      controls?.stop()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const lookup = async (code: string) => {
    setStatus('fetching')
    try {
      const food = await fetchOFFByBarcode(code)
      if (food) {
        onFound(food)
      } else {
        setStatus('notfound')
      }
    } catch {
      setStatus('error')
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScanLine className="h-5 w-5 text-primary" /> Escanear código de barras
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Visor de cámara */}
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-black">
            <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
            {status === 'camera' && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="h-24 w-3/4 rounded-xl border-2 border-primary/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
              </div>
            )}
            {status === 'fetching' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/70 text-sm">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                Buscando en Open Food Facts…
              </div>
            )}
            {cameraError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/80 px-6 text-center text-sm text-muted-foreground">
                <CameraOff className="h-6 w-6" />
                Cámara no disponible (permiso denegado o sin HTTPS). Usa la entrada manual.
              </div>
            )}
          </div>

          {/* Estado */}
          {status === 'camera' && (
            <p className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Camera className="h-3.5 w-3.5 text-primary" /> Apunta al código de barras del envase
            </p>
          )}
          {status === 'notfound' && (
            <p className="flex items-center gap-2 rounded-xl bg-secondary p-3 text-xs text-muted-foreground">
              <SearchX className="h-4 w-4 shrink-0 text-carbs" />
              Código no encontrado en Open Food Facts. Prueba a buscarlo por nombre en la pestaña «En línea».
            </p>
          )}
          {status === 'error' && (
            <p className="rounded-xl bg-secondary p-3 text-xs text-muted-foreground">
              Error de red al consultar Open Food Facts. Comprueba tu conexión e inténtalo de nuevo.
            </p>
          )}

          {/* Entrada manual */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Keyboard className="h-3.5 w-3.5" /> O introduce el código manualmente
            </div>
            <div className="flex gap-2">
              <Input
                inputMode="numeric"
                placeholder="Ej. 8480000213587"
                value={manual}
                onChange={(e) => setManual(e.target.value.replace(/\D/g, ''))}
                onKeyDown={(e) => e.key === 'Enter' && manual.length >= 8 && lookup(manual)}
              />
              <Button disabled={manual.length < 8 || status === 'fetching'} onClick={() => lookup(manual)}>
                Buscar
              </Button>
            </div>
          </div>

          <p className="text-center text-[10px] text-muted-foreground">
            Datos de Open Food Facts · base abierta de 3M+ productos
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
