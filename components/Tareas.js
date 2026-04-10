import { useState, useEffect, useCallback, useMemo } from 'react'

const STATUS_MAP = {
  'en proceso': { label: 'En proceso', cls: 'badge-pending', icon: '◑' },
  proceso: { label: 'En proceso', cls: 'badge-pending', icon: '◑' },
  '': { label: 'Sin estado', cls: 'badge-pending', icon: '○' },
}

function normalizeText(value) {
  return (value || '').toString().trim().toLowerCase()
}

function getStatus(val) {
  const key = normalizeText(val)
  return STATUS_MAP[key] || { label: val || 'Sin estado', cls: 'badge-pending', icon: '○' }
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

function formatStatusLabel(value) {
  const s = normalizeText(value)
  if (!s) return 'Sin estado'

  const map = {
    'en proceso': 'En proceso',
    proceso: 'En proceso',
  }

  return map[s] || value
}

export default function Tareas() {
  const [tareas, setTareas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [responsableFiltro, setResponsableFiltro] = useState('todos')
  const [lastFetch, setLastFetch] = useState(null)

  const fetchTareas = useCallback(async () => {
    try {
      setError(null)

      const res = await fetch(
        'https://docs.google.com/spreadsheets/d/e/2PACX-1vRELo88LzUymKq1Ue71ksRaYIVxp-8H5oLanuqHsDOUek1L3wrg_xnZvuD5qNj7-aGhHDOzGTjErnJS/pub?gid=0&single=true&output=csv'
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
        setTareas([])
        setLastFetch(new Date())
        return
      }

      const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim())

      const rows = lines.slice(1).map((line, index) => {
        const values = parseCSVLine(line)
        const row = {}

        headers.forEach((header, i) => {
          row[header] = values[i] || ''
        })

        return {
          rowIndex: index + 2,
          tarea:
            row.tarea ||
            row.descripcion ||
            row.task ||
            row['nombre'] ||
            row['actividad'] ||
            '',
          responsable:
            row.responsable ||
            row.persona ||
            row.asignado ||
            row.operario ||
            '',
          estado:
            row.estado ||
            row.status ||
            '',
          prioridad:
            row.prioridad ||
            '',
          observaciones:
            row.observaciones ||
            row.notas ||
            row.obs ||
            '',
        }
      })
      .filter(t => t.tarea)
      .filter(t => {
        const estado = normalizeText(t.estado)
        return estado === 'en proceso' || estado === ''
      })

      setTareas(rows)
      setLastFetch(new Date())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTareas()
    const interval = setInterval(fetchTareas, 60000)
    return () => clearInterval(interval)
  }, [fetchTareas])

  const responsables = useMemo(() => {
    const unicos = [...new Set(
      tareas
        .map(t => (t.responsable || '').trim())
        .filter(Boolean)
    )]
    return unicos.sort((a, b) => a.localeCompare(b))
  }, [tareas])

  const filtered = tareas.filter(t => {
    if (responsableFiltro !== 'todos' && t.responsable !== responsableFiltro) return false
    return true
  })

  const sinEstadoCount = tareas.filter(t => normalizeText(t.estado) === '').length
  const enProcesoCount = tareas.filter(t => normalizeText(t.estado) === 'en proceso').length

  return (
    <div className="p-4 space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#1a1f2e] rounded-xl p-3 border border-[#2a3042]">
          <div className="text-2xl font-display font-bold text-white">{tareas.length}</div>
          <div className="text-[11px] text-[#64748b] mt-0.5">Activas</div>
        </div>

        <div className="bg-[#1a1f2e] rounded-xl p-3 border border-[rgba(245,158,11,0.3)]">
          <div className="text-2xl font-display font-bold text-amber-400">{enProcesoCount}</div>
          <div className="text-[11px] text-[#64748b] mt-0.5">En proceso</div>
        </div>

        <div className="bg-[#1a1f2e] rounded-xl p-3 border border-[rgba(59,130,246,0.3)]">
          <div className="text-2xl font-display font-bold text-blue-400">{sinEstadoCount}</div>
          <div className="text-[11px] text-[#64748b] mt-0.5">Sin estado</div>
        </div>
      </div>

      <div className="bg-[#1a1f2e] rounded-xl border border-[#2a3042] p-3">
        <div className="text-[11px] text-[#64748b] uppercase tracking-wider mb-2">
          Filtrar por responsable
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setResponsableFiltro('todos')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium btn-press transition-all ${
              responsableFiltro === 'todos'
                ? 'bg-violet-500 text-white'
                : 'bg-[#0f1117] text-[#64748b] border border-[#2a3042]'
            }`}
          >
            Todos
          </button>

          {responsables.map(resp => (
            <button
              key={resp}
              onClick={() => setResponsableFiltro(resp)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium btn-press transition-all ${
                responsableFiltro === resp
                  ? 'bg-violet-500 text-white'
                  : 'bg-[#0f1117] text-[#64748b] border border-[#2a3042]'
              }`}
            >
              {resp}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={fetchTareas}
        className="w-full px-3 py-2.5 rounded-xl text-xs font-medium bg-[#1a1f2e] text-[#64748b] border border-[#2a3042] btn-press"
      >
        ↻ Actualizar
      </button>

      {error && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4 text-sm text-red-400">
          <div className="font-bold mb-1">⚠️ Error al cargar tareas</div>
          <div className="text-xs">{error}</div>
        </div>
      )}

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="skeleton h-20 rounded-xl" />
          ))}
        </div>
      )}

      {!loading && !error && (
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="text-center py-12 text-[#64748b]">
              <div className="text-4xl mb-3">📋</div>
              <div className="font-medium">No hay tareas para mostrar</div>
            </div>
          )}

          {filtered.map((tarea, i) => {
            const st = getStatus(tarea.estado)

            return (
              <div
                key={i}
                className="bg-[#1a1f2e] rounded-xl border border-[#2a3042] transition-all"
                style={{ borderColor: 'rgba(245,158,11,0.2)' }}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        {tarea.responsable && (
                          <span className="text-sm px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/30 font-semibold">
                            👤 {tarea.responsable}
                          </span>
                        )}

                        {tarea.prioridad && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white border border-white/10">
                            🏷️ {tarea.prioridad}
                          </span>
                        )}
                      </div>

                      <div className="text-base font-semibold leading-tight text-white">
                        {tarea.tarea}
                      </div>

                      {tarea.observaciones && (
                        <div className="text-xs text-[#64748b] mt-2">
                          {tarea.observaciones}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${st.cls}`}>
                        {st.icon} {formatStatusLabel(tarea.estado)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {lastFetch && (
        <div className="text-center text-[11px] text-[#64748b]">
          Actualizado {lastFetch.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
          {' · '}Solo muestra En proceso o sin estado
        </div>
      )}
    </div>
  )
}