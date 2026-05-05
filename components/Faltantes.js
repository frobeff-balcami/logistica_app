import { useState, useEffect, useCallback } from 'react'

function getPriorityLevel(dias) {
  if (dias >= 14) {
    return {
      label: 'CRÍTICO',
      color: '#ef4444',
      bg: 'rgba(239,68,68,0.10)',
      border: 'rgba(239,68,68,0.30)',
      icon: '🔴'
    }
  }
  if (dias >= 7) {
    return {
      label: 'URGENTE',
      color: '#f59e0b',
      bg: 'rgba(245,158,11,0.10)',
      border: 'rgba(245,158,11,0.30)',
      icon: '🟡'
    }
  }
  return {
    label: 'NORMAL',
    color: '#3b82f6',
    bg: 'rgba(59,130,246,0.10)',
    border: 'rgba(59,130,246,0.30)',
    icon: '🔵'
  }
}

function diasDesde(fechaStr) {
  if (!fechaStr) return 0

  try {
    const texto = fechaStr.toString().trim()
    const parts = texto.split('/')

    let dia, mes, anio

    if (parts.length === 3) {
      dia = parseInt(parts[0], 10)
      mes = parseInt(parts[1], 10) - 1
      anio = parseInt(parts[2], 10)

      if (anio < 100) anio += 2000
    } else if (parts.length === 2) {
      dia = parseInt(parts[0], 10)
      mes = parseInt(parts[1], 10) - 1
      anio = new Date().getFullYear()
    } else {
      const fechaDirecta = new Date(texto)
      if (isNaN(fechaDirecta.getTime())) return 0
      return Math.floor((Date.now() - fechaDirecta.getTime()) / (1000 * 60 * 60 * 24))
    }

    const fecha = new Date(anio, mes, dia)
    if (isNaN(fecha.getTime())) return 0

    return Math.floor((Date.now() - fecha.getTime()) / (1000 * 60 * 60 * 24))
  } catch {
    return 0
  }
}

function parseCSVLine(line) {
  const result = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const nextChar = line[i + 1]

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }

  result.push(current)
  return result.map(v => v.trim())
}

function normalizeStatus(status) {
  return (status || '').toString().trim().toLowerCase()
}

function isResolvedStatus(status) {
  const s = normalizeStatus(status)
  return ['resuelto', 'ok', 'hecho', 'cerrado', 'finalizado', 'terminado'].includes(s)
}

function formatStatus(status) {
  const s = normalizeStatus(status)
  if (!s) return ''

  const map = {
    pendiente: 'Pendiente',
    mecanizado: 'Mecanizado',
    mecanizando: 'Mecanizando',
    calidad: 'Calidad',
    compras: 'Compras',
    comprado: 'Comprado',
    proveedor: 'Proveedor',
    produccion: 'Producción',
    producción: 'Producción',
    armado: 'Armado',
    resuelto: 'Resuelto',
    cerrado: 'Cerrado',
    hecho: 'Hecho',
    ok: 'OK',
  }

  return map[s] || status
}

export default function Faltantes() {
  const [faltantes, setFaltantes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filtro, setFiltro] = useState('todos')
  const [lastFetch, setLastFetch] = useState(null)
  const [entregados, setEntregados] = useState(new Set())  // IDs entregados localmente
  const [comentarios, setComentarios] = useState({})  // comentarios locales por _key
  const [comentarioAbierto, setComentarioAbierto] = useState(null)  // _key del card con input abierto
  const [comentarioTemp, setComentarioTemp] = useState('')  // texto en edición

  const fetchFaltantes = useCallback(async () => {
    try {
      setError(null)

      const res = await fetch(
        'https://docs.google.com/spreadsheets/d/e/2PACX-1vRPUpnSeeItrAUJcIajZDL3STcj4pSCsRxXbaZcNWAmXAsicRn2TTFC-MnuWKPZcSwv7bCRpK-wD4ab/pub?gid=0&single=true&output=csv'
      )

      if (!res.ok) {
        throw new Error(`Error ${res.status}`)
      }

      const text = await res.text()

      const lines = text
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(Boolean)

      if (lines.length <= 1) {
        setFaltantes([])
        setLastFetch(new Date())
        return
      }

      const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim())

      const rows = lines
        .slice(1)
        .map(line => {
          const values = parseCSVLine(line)
          const row = {}

          headers.forEach((header, index) => {
            row[header] = values[index] || ''
          })

          return {
            _key: `${values[0]||''}-${values[1]||''}-${i}`,
            producto:
              row.producto ||
              row.item ||
              row.articulo ||
              row.nombre ||
              row.material ||
              '',
            fecha:
              row.fecha ||
              row['fecha pedido'] ||
              row['fecha de pedido'] ||
              row.date ||
              '',
            cantidad:
              row.cantidad ||
              row.faltante ||
              row.qty ||
              row['cantidad faltante'] ||
              '',
            unidad:
              row.unidad ||
              row.um ||
              row['unidad de medida'] ||
              '',
            estado:
              row.estado ||
              row.status ||
              '',
            maquina:
              row.maquina ||
              row.máquina ||
              '',
            area:
              row.area ||
              row['área'] ||
              row.sector ||
              row.etapa ||
              '',
            observaciones:
              row.observaciones ||
              row.notas ||
              row.obs ||
              row.comentarios ||
              '',
          }
        })
        .filter(f => f.producto)
        .filter(f => !isResolvedStatus(f.estado))

      setFaltantes(rows)
      setLastFetch(new Date())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchFaltantes()
    const interval = setInterval(fetchFaltantes, 120000)
    return () => clearInterval(interval)
  }, [fetchFaltantes])

  const guardarComentario = (key) => {
    if (comentarioTemp.trim()) {
      setComentarios(prev => ({ ...prev, [key]: comentarioTemp.trim() }))
    } else {
      setComentarios(prev => { const next = { ...prev }; delete next[key]; return next })
    }
    setComentarioAbierto(null)
    setComentarioTemp('')
  }

  const abrirComentario = (key, textoActual) => {
    setComentarioAbierto(key)
    setComentarioTemp(textoActual || '')
  }

  const marcarEntregado = (key) => {
    setEntregados(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const conDias = faltantes
    .map(f => ({
      ...f,
      dias: diasDesde(f.fecha),
      entregado: entregados.has(f._key),
      comentarioLocal: comentarios[f._key] || '',
    }))
    .sort((a, b) => b.dias - a.dias)

  const filtrados = conDias.filter(f => {
    if (filtro === 'entregados') return f.entregado
    if (f.entregado) return false  // ocultar entregados en otras vistas
    const p = getPriorityLevel(f.dias)
    if (filtro === 'criticos') return p.label === 'CRÍTICO'
    if (filtro === 'urgentes') return p.label === 'URGENTE'
    return true
  })

  const entregadosCount = conDias.filter(f => f.entregado).length
  const criticos = conDias.filter(f => !f.entregado && getPriorityLevel(f.dias).label === 'CRÍTICO').length
  const urgentes = conDias.filter(f => !f.entregado && getPriorityLevel(f.dias).label === 'URGENTE').length
  const normales = conDias.filter(f => !f.entregado && getPriorityLevel(f.dias).label === 'NORMAL').length

  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.09),rgba(255,255,255,0.03))] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.25)] backdrop-blur-md">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(239,68,68,0.16),transparent_25%)]" />
        <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#fca5a5]">
              Módulo
            </div>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Faltantes
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/70 sm:text-base">
              Visualización de piezas pendientes, antigüedad, estado y prioridad operativa.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70 backdrop-blur">
            <span className="font-semibold text-white">Criterio:</span> urgente desde 7 días · crítico desde 14 días
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <div className="rounded-[24px] border border-white/10 bg-white/5 p-4 shadow-[0_14px_35px_rgba(0,0,0,0.18)] backdrop-blur">
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45">
            Total
          </div>
          <div className="mt-2 text-3xl font-extrabold text-white">
            {faltantes.length}
          </div>
          <div className="mt-1 text-xs text-white/40">
            Pendientes activos
          </div>
        </div>

        <div className="rounded-[24px] border border-red-500/20 bg-red-500/10 p-4 shadow-[0_14px_35px_rgba(0,0,0,0.18)] backdrop-blur">
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-red-200/80">
            Críticos
          </div>
          <div className="mt-2 text-3xl font-extrabold text-red-300">
            {criticos}
          </div>
          <div className="mt-1 text-xs text-red-100/60">
            Mayor prioridad
          </div>
        </div>

        <div className="rounded-[24px] border border-amber-500/20 bg-amber-500/10 p-4 shadow-[0_14px_35px_rgba(0,0,0,0.18)] backdrop-blur">
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-100/80">
            Urgentes
          </div>
          <div className="mt-2 text-3xl font-extrabold text-amber-300">
            {urgentes}
          </div>
          <div className="mt-1 text-xs text-amber-100/60">
            Requieren seguimiento
          </div>
        </div>

        <div className="rounded-[24px] border border-blue-500/20 bg-blue-500/10 p-4 shadow-[0_14px_35px_rgba(0,0,0,0.18)] backdrop-blur">
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-100/80">
            Normales
          </div>
          <div className="mt-2 text-3xl font-extrabold text-blue-300">
            {normales}
          </div>
          <div className="mt-1 text-xs text-blue-100/60">
            Prioridad baja
          </div>
        </div>
        <div className="rounded-[24px] border border-emerald-500/20 bg-emerald-500/10 p-4 shadow-[0_14px_35px_rgba(0,0,0,0.18)] backdrop-blur">
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-100/80">
            Entregados
          </div>
          <div className="mt-2 text-3xl font-extrabold text-emerald-300">
            {entregadosCount}
          </div>
          <div className="mt-1 text-xs text-emerald-100/60">
            Esta sesión
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-[24px] border border-white/10 bg-white/5 p-3 shadow-[0_14px_35px_rgba(0,0,0,0.16)] backdrop-blur">
        {[
          { id: 'todos', label: 'Todos' },
          { id: 'criticos', label: '🔴 Críticos' },
          { id: 'urgentes', label: '🟡 Urgentes' },
          { id: 'entregados', label: '✓ Entregados' },
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setFiltro(f.id)}
            className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition-all ${
              filtro === f.id
                ? 'bg-[#c1121f] text-white shadow-[0_10px_25px_rgba(193,18,31,0.35)]'
                : 'border border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
            }`}
          >
            {f.label}
          </button>
        ))}

        <button
          onClick={fetchFaltantes}
          className="ml-auto rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white/70 transition hover:bg-white/10 hover:text-white"
        >
          ↻ Actualizar
        </button>
      </div>

      {error && (
        <div className="rounded-[24px] border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200 shadow-[0_14px_35px_rgba(0,0,0,0.16)]">
          <div className="mb-1 font-bold">⚠️ Error al cargar faltantes</div>
          <div className="text-xs text-red-100/80">{error}</div>
        </div>
      )}

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-[24px] border border-white/10 bg-white/5"
            />
          ))}
        </div>
      )}

      {!loading && !error && (
        <div className="space-y-4">
          {filtrados.length === 0 && (
            <div className="rounded-[28px] border border-white/10 bg-white/5 px-6 py-14 text-center shadow-[0_14px_35px_rgba(0,0,0,0.16)] backdrop-blur">
              <div className="mb-3 text-5xl">📦</div>
              <div className="text-lg font-semibold text-white">
                Sin faltantes en esta categoría
              </div>
              <div className="mt-2 text-sm text-white/50">
                Probá cambiar el filtro o actualizá los datos.
              </div>
            </div>
          )}

          {filtrados.map((f, i) => {
            const p = f.entregado ? { color: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.25)', label: 'ENTREGADO', icon: '✓' } : getPriorityLevel(f.dias)

            return (
              <div
                key={f._key}
                className="group relative overflow-hidden rounded-[28px] border p-5 shadow-[0_18px_45px_rgba(0,0,0,0.18)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_55px_rgba(0,0,0,0.25)]"
                style={{
                  background: `linear-gradient(135deg, ${p.bg}, rgba(255,255,255,0.03))`,
                  borderColor: p.border,
                }}
              >
                <div
                  className="absolute inset-y-0 left-0 w-1.5 rounded-l-[28px]"
                  style={{ background: p.color }}
                />

                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1 pl-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-white/10 bg-black/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-white/55">
                        #{i + 1}
                      </span>

                      <span
                        className="rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em]"
                        style={{
                          color: p.color,
                          background: `${p.color}22`,
                          border: `1px solid ${p.border}`,
                        }}
                      >
                        {p.icon} {p.label}
                      </span>

                      {f.estado && (
                        <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/70">
                          ⚙ {formatStatus(f.estado)}
                        </span>
                      )}

                      {f.maquina && (
                        <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/70">
                          🏭 {f.maquina}
                        </span>
                      )}
                      {f.area && (
                        <span style={{
                          borderRadius: 20,
                          padding: '2px 10px',
                          fontSize: 11,
                          fontWeight: 700,
                          letterSpacing: '.1em',
                          textTransform: 'uppercase',
                          background: 'rgba(139,92,246,0.15)',
                          border: '1px solid rgba(139,92,246,0.35)',
                          color: '#c4b5fd',
                        }}>
                          📍 {f.area}
                        </span>
                      )}
                    </div>

                    <h3 className="mt-4 break-words text-xl font-extrabold tracking-tight text-white sm:text-2xl">
                      {f.producto}
                    </h3>

                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:max-w-2xl">
                      {f.fecha && (
                        <div className="rounded-2xl border border-white/10 bg-black/10 px-3 py-2">
                          <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
                            Fecha
                          </div>
                          <div className="mt-1 text-sm font-semibold text-white/85">
                            {f.fecha}
                          </div>
                        </div>
                      )}

                      <div className="rounded-2xl border border-white/10 bg-black/10 px-3 py-2">
                        <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
                          Antigüedad
                        </div>
                        <div className="mt-1 text-sm font-semibold text-white/85">
                          {f.dias} día{f.dias !== 1 ? 's' : ''}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-black/10 px-3 py-2">
                        <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
                          Unidad
                        </div>
                        <div className="mt-1 text-sm font-semibold text-white/85">
                          {f.unidad || 'unid.'}
                        </div>
                      </div>
                    </div>

                    {f.observaciones && (
                      <div className="mt-4 rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-sm leading-6 text-white/65">
                        {f.observaciones}
                      </div>
                    )}

                    {/* Comentario local */}
                    <div style={{ marginTop: 12 }}>
                      {comentarioAbierto === f._key ? (
                        <div style={{
                          background: 'rgba(139,92,246,0.08)',
                          border: '1px solid rgba(139,92,246,0.3)',
                          borderRadius: 12, padding: '10px 12px',
                        }}>
                          <textarea
                            autoFocus
                            value={comentarioTemp}
                            onChange={e => setComentarioTemp(e.target.value)}
                            placeholder="Escribí un comentario..."
                            rows={2}
                            style={{
                              width: '100%', background: 'transparent',
                              border: 'none', outline: 'none', resize: 'none',
                              color: '#e2e8f0', fontSize: 13, lineHeight: 1.5,
                              fontFamily: 'inherit', boxSizing: 'border-box',
                            }}
                          />
                          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                            <button
                              onClick={() => guardarComentario(f._key)}
                              style={{
                                padding: '5px 14px', borderRadius: 8, fontSize: 12,
                                fontWeight: 700, cursor: 'pointer',
                                background: 'rgba(139,92,246,0.3)',
                                border: '1px solid rgba(139,92,246,0.5)',
                                color: '#c4b5fd', letterSpacing: '.04em',
                              }}
                            >
                              Guardar
                            </button>
                            <button
                              onClick={() => setComentarioAbierto(null)}
                              style={{
                                padding: '5px 14px', borderRadius: 8, fontSize: 12,
                                cursor: 'pointer', background: 'transparent',
                                border: '1px solid rgba(255,255,255,0.1)',
                                color: 'rgba(255,255,255,0.4)', letterSpacing: '.04em',
                              }}
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => abrirComentario(f._key, f.comentarioLocal)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 7,
                            padding: '6px 12px', borderRadius: 10, cursor: 'pointer',
                            background: f.comentarioLocal ? 'rgba(139,92,246,0.08)' : 'transparent',
                            border: f.comentarioLocal ? '1px solid rgba(139,92,246,0.25)' : '1px dashed rgba(255,255,255,0.12)',
                            color: f.comentarioLocal ? '#c4b5fd' : 'rgba(255,255,255,0.3)',
                            fontSize: 12, textAlign: 'left', maxWidth: '100%',
                            transition: 'all .15s',
                          }}
                        >
                          <span style={{ flexShrink: 0 }}>💬</span>
                          <span style={{
                            overflow: 'hidden', textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap', maxWidth: 300,
                          }}>
                            {f.comentarioLocal || 'Agregar comentario...'}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 lg:min-w-[140px] flex flex-col gap-3">
                    <div className="rounded-[24px] border border-white/10 bg-black/10 px-5 py-4 text-center backdrop-blur">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
                        Cantidad
                      </div>
                      <div
                        className="mt-2 text-3xl font-extrabold tracking-tight"
                        style={{ color: p.color }}
                      >
                        {f.cantidad || '-'}
                      </div>
                      <div className="mt-1 text-xs text-white/45">
                        {f.unidad || 'unid.'}
                      </div>
                    </div>
                    <button
                      onClick={() => marcarEntregado(f._key)}
                      style={{
                        padding: '10px 14px',
                        borderRadius: 16,
                        border: f.entregado ? '1px solid rgba(16,185,129,0.5)' : '1px solid rgba(139,92,246,0.4)',
                        background: f.entregado ? 'rgba(16,185,129,0.15)' : 'rgba(139,92,246,0.15)',
                        color: f.entregado ? '#6ee7b7' : '#c4b5fd',
                        fontSize: 12,
                        fontWeight: 700,
                        letterSpacing: '.06em',
                        textTransform: 'uppercase',
                        cursor: 'pointer',
                        transition: 'all .2s',
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                      }}
                    >
                      {f.entregado ? '✓ Entregado' : '○ Entregar'}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {lastFetch && (
        <div className="pt-1 text-center text-[11px] uppercase tracking-[0.14em] text-white/35">
          Actualizado{' '}
          {lastFetch.toLocaleTimeString('es-AR', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      )}
    </div>
  )
}