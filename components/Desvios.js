import { useState, useRef } from 'react'

export default function Desvios() {
  const [foto, setFoto] = useState(null)
  const [fotoPreview, setFotoPreview] = useState(null)
  const [descripcion, setDescripcion] = useState('')
  const [usuario, setUsuario] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [exito, setExito] = useState(false)
  const [error, setError] = useState(null)
  const fileRef = useRef()
  const cameraRef = useRef()

  const handleFoto = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFoto(file)
    const reader = new FileReader()
    reader.onload = (ev) => setFotoPreview(ev.target.result)
    reader.readAsDataURL(file)
  }

  const limpiar = () => {
    setFoto(null)
    setFotoPreview(null)
    setDescripcion('')
    setError(null)
  }

  const guardar = async () => {
    if (!descripcion.trim()) {
      setError('Escribí una descripción del desvío')
      return
    }

    setGuardando(true)
    setError(null)

    try {
      const payload = {
        descripcion: descripcion.trim(),
        usuario: usuario.trim() || 'Anónimo',
        fecha: new Date().toLocaleString('es-AR'),
        fotoBase64: fotoPreview || null,
      }

      const res = await fetch('/api/desvios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error(`Error ${res.status}`)

      setExito(true)
      limpiar()
      setTimeout(() => setExito(false), 3000)
    } catch (e) {
      setError('No se pudo guardar: ' + e.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header info */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex gap-3 items-start">
        <span className="text-xl">⚠️</span>
        <div>
          <div className="text-sm font-medium text-amber-400">Reporte de Desvío 5S</div>
          <div className="text-xs text-[#64748b] mt-0.5">
            Registrá todo lo que no esté en su lugar, en mal estado o fuera de estándar.
          </div>
        </div>
      </div>

      {/* Success message */}
      {exito && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-center">
          <div className="text-3xl mb-2">✅</div>
          <div className="font-medium text-emerald-400">¡Desvío guardado!</div>
          <div className="text-xs text-[#64748b] mt-1">El equipo fue notificado</div>
        </div>
      )}

      {/* Usuario */}
      <div className="bg-[#1a1f2e] rounded-xl border border-[#2a3042] p-4">
        <label className="text-xs font-medium text-[#64748b] uppercase tracking-wider block mb-2">
          Tu nombre (opcional)
        </label>
        <input
          type="text"
          value={usuario}
          onChange={e => setUsuario(e.target.value)}
          placeholder="Ej: Juan García"
          className="w-full bg-[#0f1117] border border-[#2a3042] rounded-lg px-3 py-3 text-sm text-white placeholder-[#64748b] focus:outline-none focus:border-blue-500 transition-colors"
        />
      </div>

      {/* Foto */}
      <div className="bg-[#1a1f2e] rounded-xl border border-[#2a3042] p-4">
        <label className="text-xs font-medium text-[#64748b] uppercase tracking-wider block mb-3">
          Foto del desvío
        </label>

        {fotoPreview ? (
          <div className="relative">
            <img
              src={fotoPreview}
              alt="Preview"
              className="w-full h-48 object-cover rounded-lg"
            />
            <button
              onClick={limpiar}
              className="absolute top-2 right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white text-sm font-bold"
            >
              ✕
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {/* Camera button */}
            <button
              onClick={() => cameraRef.current?.click()}
              className="flex flex-col items-center justify-center gap-2 py-6 rounded-xl border-2 border-dashed border-[#2a3042] text-[#64748b] btn-press hover:border-blue-500/50 hover:text-blue-400 transition-colors"
            >
              <span className="text-3xl">📷</span>
              <span className="text-xs font-medium">Sacar foto</span>
            </button>
            {/* Gallery button */}
            <button
              onClick={() => fileRef.current?.click()}
              className="flex flex-col items-center justify-center gap-2 py-6 rounded-xl border-2 border-dashed border-[#2a3042] text-[#64748b] btn-press hover:border-blue-500/50 hover:text-blue-400 transition-colors"
            >
              <span className="text-3xl">🖼️</span>
              <span className="text-xs font-medium">Desde galería</span>
            </button>
          </div>
        )}

        {/* Hidden inputs */}
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFoto}
        />
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFoto}
        />
      </div>

      {/* Descripcion */}
      <div className="bg-[#1a1f2e] rounded-xl border border-[#2a3042] p-4">
        <label className="text-xs font-medium text-[#64748b] uppercase tracking-wider block mb-2">
          Descripción *
        </label>
        <textarea
          value={descripcion}
          onChange={e => setDescripcion(e.target.value)}
          placeholder='Ej: "Pallet sin identificar en zona de despacho" o "Herramienta fuera de su lugar"'
          rows={4}
          className="w-full bg-[#0f1117] border border-[#2a3042] rounded-lg px-3 py-3 text-sm text-white placeholder-[#64748b] focus:outline-none focus:border-amber-500 transition-colors resize-none"
        />
        <div className="text-right text-[11px] text-[#64748b] mt-1">{descripcion.length}/200</div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-3 text-sm text-red-400">
          ⚠️ {error}
        </div>
      )}

      {/* Submit button */}
      <button
        onClick={guardar}
        disabled={guardando || !descripcion.trim()}
        className="w-full py-4 rounded-xl text-base font-bold btn-press transition-all disabled:opacity-40"
        style={{
          background: guardando || !descripcion.trim()
            ? '#1a1f2e'
            : 'linear-gradient(135deg, #f59e0b, #ef4444)',
          color: 'white',
          border: 'none',
        }}
      >
        {guardando ? '⏳ Guardando desvío...' : '⚠️ Reportar desvío'}
      </button>
    </div>
  )
}
