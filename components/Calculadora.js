import { useState } from 'react'

export default function Calculadora() {
  const [peso, setPeso] = useState('')
  const metros = peso ? (parseFloat(peso) * 1.27).toFixed(2) : null
  const [historial, setHistorial] = useState([])

  const guardarCalculo = () => {
    if (!metros) return
    const nuevo = {
      peso: parseFloat(peso),
      metros: parseFloat(metros),
      hora: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
    }
    setHistorial(prev => [nuevo, ...prev].slice(0, 10))
  }

  const limpiar = () => {
    setPeso('')
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header info */}
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex gap-3 items-start">
        <span className="text-xl">🧮</span>
        <div>
          <div className="text-sm font-medium text-emerald-400">Calculadora de alambre</div>
          <div className="text-xs text-[#64748b] mt-0.5">
            Fórmula: <span className="font-display text-white">metros = peso × 1.27</span>
          </div>
        </div>
      </div>

      {/* Calculator card */}
      <div className="bg-[#1a1f2e] rounded-2xl border border-[#2a3042] p-5">
        {/* Input */}
        <label className="text-xs font-medium text-[#64748b] uppercase tracking-wider block mb-3">
          Peso en kilogramos
        </label>
        <div className="flex gap-3 mb-5">
          <div className="relative flex-1">
            <input
              type="number"
              inputMode="decimal"
              value={peso}
              onChange={e => setPeso(e.target.value)}
              placeholder="0.00"
              className="w-full bg-[#0f1117] border border-[#2a3042] rounded-xl px-4 py-4 text-2xl font-display text-white placeholder-[#2a3042] focus:outline-none focus:border-emerald-500 transition-colors text-center"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#64748b] text-sm font-medium">kg</span>
          </div>
          <button
            onClick={limpiar}
            className="w-14 h-14 rounded-xl bg-[#0f1117] border border-[#2a3042] text-[#64748b] text-xl btn-press"
          >
            ⌫
          </button>
        </div>

        {/* Result */}
        <div className={`rounded-2xl p-6 text-center transition-all ${
          metros
            ? 'bg-emerald-500/10 border border-emerald-500/30'
            : 'bg-[#0f1117] border border-[#2a3042]'
        }`}>
          {metros ? (
            <>
              <div className="text-[#64748b] text-xs uppercase tracking-wider mb-2">Metros de alambre</div>
              <div className="font-display text-6xl font-bold text-emerald-400 leading-none">
                {metros}
              </div>
              <div className="text-emerald-300/60 text-lg mt-2">metros</div>
              <div className="text-xs text-[#64748b] mt-3">
                {peso} kg × 1.27 = {metros} m
              </div>
            </>
          ) : (
            <>
              <div className="text-[#64748b] text-xs uppercase tracking-wider mb-2">Resultado</div>
              <div className="font-display text-5xl font-bold text-[#2a3042]">—</div>
              <div className="text-[#64748b] text-sm mt-3">Ingresá el peso para calcular</div>
            </>
          )}
        </div>

        {/* Quick presets */}
        <div className="mt-4">
          <div className="text-xs text-[#64748b] mb-2">Valores rápidos (kg)</div>
          <div className="grid grid-cols-4 gap-2">
            {[1, 5, 10, 25, 50, 100, 250, 500].map(v => (
              <button
                key={v}
                onClick={() => setPeso(v.toString())}
                className={`py-2.5 rounded-lg text-sm font-display font-bold btn-press transition-all ${
                  parseFloat(peso) === v
                    ? 'bg-emerald-500 text-white'
                    : 'bg-[#0f1117] border border-[#2a3042] text-[#64748b] hover:border-emerald-500/50'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Save button */}
        {metros && (
          <button
            onClick={guardarCalculo}
            className="mt-4 w-full py-3 rounded-xl text-sm font-medium btn-press"
            style={{
              background: 'rgba(16,185,129,0.1)',
              border: '1px solid rgba(16,185,129,0.3)',
              color: '#10b981'
            }}
          >
            📌 Guardar en historial
          </button>
        )}
      </div>

      {/* Historial */}
      {historial.length > 0 && (
        <div className="bg-[#1a1f2e] rounded-xl border border-[#2a3042] p-4">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-medium text-[#64748b] uppercase tracking-wider">Historial</span>
            <button
              onClick={() => setHistorial([])}
              className="text-xs text-[#64748b] hover:text-red-400 transition-colors"
            >
              Limpiar
            </button>
          </div>
          <div className="space-y-2">
            {historial.map((h, i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b border-[#2a3042] last:border-0">
                <div className="text-sm text-[#64748b]">
                  <span className="text-white font-display">{h.peso}</span> kg
                </div>
                <div className="text-sm">
                  <span className="text-emerald-400 font-display font-bold">{h.metros}</span>
                  <span className="text-[#64748b]"> m</span>
                </div>
                <div className="text-xs text-[#64748b]">{h.hora}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
