import { useState, useEffect, useCallback } from 'react'

// ── URL del CSV público (mismo sheet que antes)
const CSV_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vRELo88LzUymKq1Ue71ksRaYIVxp-8H5oLanuqHsDOUek1L3wrg_xnZvuD5qNj7-aGhHDOzGTjErnJS/pub?output=csv'

const mono = "'IBM Plex Mono', monospace"
const sans = "'DM Sans', sans-serif"

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function parseCSVLine(line) {
  const result = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++ }
      else inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current); current = ''
    } else current += char
  }
  result.push(current)
  return result.map(v => v.trim())
}

function isDone(estado) {
  const s = (estado || '').toLowerCase().trim()
  return ['completada', 'completa', 'hecha', 'ok', 'terminada', 'listo', 'done'].includes(s)
}

// Normalizar nombre para comparar (sin acentos, minúsculas, sin espacios dobles)
function normName(n) {
  return (n || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

// ─────────────────────────────────────────────
// Pantalla de selección de usuario
// ─────────────────────────────────────────────
function UserPicker({ operarios, onSelect }) {
  const [search, setSearch] = useState('')

  const filtrados = operarios.filter(op =>
    normName(op).includes(normName(search))
  )

  return (
    <div style={{ fontFamily: sans, padding: '24px 16px' }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{
          fontFamily: mono, fontSize: 10, textTransform: 'uppercase',
          letterSpacing: '.14em', color: '#a09888', marginBottom: 6,
        }}>
          ¿Quién sos?
        </div>
        <div style={{ fontSize: 20, fontWeight: 600, color: '#1a1208', lineHeight: 1.2 }}>
          Seleccioná tu nombre
        </div>
        <div style={{ fontSize: 13, color: '#7a7068', marginTop: 4 }}>
          Solo vas a ver tus tareas asignadas
        </div>
      </div>

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Buscar nombre..."
        autoFocus
        style={{
          width: '100%', padding: '10px 12px', fontSize: 14,
          border: '1px solid #c8bfb2', borderLeft: '3px solid #d4420a',
          background: '#fff', color: '#1a1208', fontFamily: sans,
          outline: 'none', marginBottom: 10, boxSizing: 'border-box',
          borderRadius: 0,
        }}
      />

      {/* Lista */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {filtrados.length === 0 && (
          <div style={{ padding: '20px 0', textAlign: 'center', color: '#a09888', fontFamily: mono, fontSize: 12 }}>
            Sin resultados
          </div>
        )}
        {filtrados.map((op, i) => (
          <button
            key={i}
            onClick={() => onSelect(op)}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 14px', background: '#fff',
              border: '1px solid #ede8e1', borderLeft: '3px solid transparent',
              cursor: 'pointer', textAlign: 'left', transition: 'all .1s',
              fontFamily: sans,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderLeftColor = '#d4420a'
              e.currentTarget.style.background = '#fdf9f6'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderLeftColor = 'transparent'
              e.currentTarget.style.background = '#fff'
            }}
          >
            <div style={{
              width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
              background: '#1a1208', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontFamily: mono, fontSize: 13,
              fontWeight: 700, color: '#fff',
            }}>
              {op.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <span style={{ fontSize: 15, fontWeight: 500, color: '#1a1208' }}>{op}</span>
          </button>
        ))}

        {/* Ver todas */}
        <button
          onClick={() => onSelect('__TODOS__')}
          style={{
            marginTop: 8, padding: '10px 14px',
            background: 'transparent', border: '1px dashed #c8bfb2',
            color: '#a09888', fontSize: 13, cursor: 'pointer', fontFamily: mono,
            letterSpacing: '.06em', textTransform: 'uppercase',
          }}
        >
          Ver todas las tareas →
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────
export default function Tareas() {
  const [tareas, setTareas]         = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)
  const [usuario, setUsuario]       = useState(null)   // null = no elegido aún
  const [filtro, setFiltro]         = useState('todas')
  const [lastFetch, setLastFetch]   = useState(null)

  // ── Persistir usuario en localStorage
  useEffect(() => {
    const saved = localStorage.getItem('logistica_usuario')
    if (saved) setUsuario(saved)
  }, [])

  const elegirUsuario = (nombre) => {
    setUsuario(nombre)
    localStorage.setItem('logistica_usuario', nombre)
  }

  const cambiarUsuario = () => {
    setUsuario(null)
    localStorage.removeItem('logistica_usuario')
  }

  // ── Fetch CSV
  const fetchTareas = useCallback(async () => {
    try {
      setError(null)
      const res = await fetch(CSV_URL)
      if (!res.ok) throw new Error(`Error ${res.status}`)
      const text = await res.text()
      const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
      if (lines.length <= 1) { setTareas([]); setLastFetch(new Date()); return }

      const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim())

      const rows = lines.slice(1).map((line, i) => {
        const values = parseCSVLine(line)
        const row = {}
        headers.forEach((h, idx) => { row[h] = values[idx] || '' })
        return {
          rowIndex:     i + 2, // fila real en el sheet (1-indexed, skip header)
          tarea:        row.tarea || row.descripcion || row.task || row.nombre || values[0] || '',
          responsable:  row.responsable || row.persona || row.asignado || row.operario || values[1] || '',
          estado:       row.estado || row.status || values[9] || '', // col J = idx 9
          fecha:        row.fecha || row.date || '',
          observaciones: row.observaciones || row.notas || row.obs || '',
          turno:        row.turno || row.shift || '',
        }
      }).filter(t => t.tarea && !t.estado.trim())

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

  // ── Toggle estado solo en memoria local (sin escribir en el sheet)
  const toggleEstado = (tarea) => {
    const nuevoEstado = isDone(tarea.estado) ? '' : 'Completada'
    setTareas(prev => prev.map(t =>
      t.rowIndex === tarea.rowIndex ? { ...t, estado: nuevoEstado } : t
    ))
  }

  // ── Derivar lista de operarios únicos del sheet
  const operarios = [...new Set(
    tareas.map(t => t.responsable).filter(Boolean)
  )].sort()

  // ── Filtrar por usuario y estado
  const misTareas = usuario === '__TODOS__'
    ? tareas
    : tareas.filter(t => normName(t.responsable) === normName(usuario || ''))

  const tareasFiltradas = misTareas.filter(t => {
    if (filtro === 'pendientes')  return !isDone(t.estado)
    if (filtro === 'completadas') return isDone(t.estado)
    return true
  })

  const totalMias    = misTareas.length
  const completadas  = misTareas.filter(t => isDone(t.estado)).length
  const pendientes   = totalMias - completadas
  const pct          = totalMias ? Math.round((completadas / totalMias) * 100) : 0

  // ── Si no eligió usuario → mostrar picker
  if (!usuario && !loading && tareas.length > 0) {
    return <UserPicker operarios={operarios} onSelect={elegirUsuario} />
  }

  // ── Si está cargando sin usuario todavía
  if (!usuario && loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: '#a09888', fontFamily: mono, fontSize: 12 }}>
        Cargando...
      </div>
    )
  }

  const nombreMostrado = usuario === '__TODOS__' ? 'Todas las tareas' : usuario

  return (
    <div style={{ fontFamily: sans }}>

      {/* ── Header de usuario */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 14px', background: '#1a1208', marginBottom: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%', background: '#d4420a',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: mono, fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0,
          }}>
            {usuario === '__TODOS__'
              ? '★'
              : (usuario || '').split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
            }
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', lineHeight: 1.2 }}>
              {nombreMostrado}
            </div>
            <div style={{ fontFamily: mono, fontSize: 10, color: 'rgba(255,255,255,.4)', letterSpacing: '.1em' }}>
              {totalMias} tarea{totalMias !== 1 ? 's' : ''} asignadas
            </div>
          </div>
        </div>
        <button
          onClick={cambiarUsuario}
          style={{
            fontSize: 11, fontFamily: mono, letterSpacing: '.08em',
            textTransform: 'uppercase', padding: '5px 10px',
            background: 'transparent', border: '1px solid rgba(255,255,255,.15)',
            color: 'rgba(255,255,255,.5)', cursor: 'pointer',
          }}
        >
          Cambiar
        </button>
      </div>

      {/* ── Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
        {[
          { num: totalMias,   label: 'Total',      accent: '#444' },
          { num: pendientes,  label: 'Pendientes', accent: '#d4420a' },
          { num: completadas, label: 'Listas',     accent: '#1a7a4a' },
        ].map((s, i) => (
          <div key={i} style={{ background: '#1a1208', padding: '10px 12px', borderLeft: `3px solid ${s.accent}` }}>
            <div style={{ fontFamily: mono, fontSize: 24, fontWeight: 700, color: '#fff', lineHeight: 1 }}>{s.num}</div>
            <div style={{ fontFamily: mono, fontSize: 10, textTransform: 'uppercase', letterSpacing: '.1em', color: 'rgba(255,255,255,.38)', marginTop: 3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Barra de progreso */}
      {totalMias > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontFamily: mono, fontSize: 10, textTransform: 'uppercase', letterSpacing: '.1em', color: '#a09888' }}>Progreso del día</span>
            <span style={{ fontFamily: mono, fontSize: 12, fontWeight: 700, color: '#1a1208' }}>{pct}%</span>
          </div>
          <div style={{ height: 6, background: '#e8e3dc', position: 'relative' }}>
            <div style={{
              height: '100%', width: `${pct}%`,
              background: pct === 100 ? '#1a7a4a' : pct >= 60 ? '#d4420a' : '#c0392b',
              transition: 'width .4s ease',
            }} />
          </div>
        </div>
      )}

      {/* ── Filtros */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
        {[
          { id: 'todas',       label: 'Todas' },
          { id: 'pendientes',  label: 'Pendientes' },
          { id: 'completadas', label: 'Completadas' },
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setFiltro(f.id)}
            style={{
              padding: '5px 12px', fontSize: 11, fontWeight: 600,
              letterSpacing: '.06em', textTransform: 'uppercase',
              fontFamily: mono, cursor: 'pointer', borderRadius: 0,
              border: filtro === f.id ? '1px solid #1a1208' : '1px solid #c8bfb2',
              background: filtro === f.id ? '#1a1208' : '#fff',
              color: filtro === f.id ? '#fff' : '#6b6358',
            }}
          >
            {f.label}
          </button>
        ))}
        <button
          onClick={fetchTareas}
          style={{
            marginLeft: 'auto', padding: '5px 10px', fontSize: 13,
            border: '1px solid #c8bfb2', background: '#fff', color: '#6b6358',
            cursor: 'pointer', fontFamily: mono, borderRadius: 0,
          }}
        >
          ↻
        </button>
      </div>

      {/* ── Error */}
      {error && (
        <div style={{
          background: '#fef2f2', border: '1px solid #fca5a5',
          borderLeft: '4px solid #c0392b', padding: '12px 16px', marginBottom: 12,
        }}>
          <div style={{ fontWeight: 600, color: '#7f1d1d', fontSize: 13, marginBottom: 2 }}>Error al cargar</div>
          <div style={{ fontSize: 12, color: '#991b1b' }}>{error}</div>
        </div>
      )}

      {/* ── Loading */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{ height: 64, background: '#e8e3dc' }} />
          ))}
        </div>
      )}

      {/* ── Lista de tareas */}
      {!loading && !error && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

          {tareasFiltradas.length === 0 && (
            <div style={{ padding: '40px 0', textAlign: 'center' }}>
              <div style={{ fontFamily: mono, fontSize: 12, textTransform: 'uppercase', letterSpacing: '.1em', color: '#a09888' }}>
                {filtro === 'completadas' ? 'Nada completado aún' : '¡Todo listo por acá!'}
              </div>
            </div>
          )}

          {tareasFiltradas.map((t, i) => {
            const done = isDone(t.estado)

            return (
              <div
                key={t.rowIndex}
                style={{
                  display: 'flex', alignItems: 'stretch',
                  background: done ? '#f7f4f0' : '#fff',
                  borderLeft: `4px solid ${done ? '#1a7a4a' : '#d4420a'}`,
                  opacity: done ? 0.75 : 1,
                  transition: 'all .15s',
                }}
              >
                {/* Número */}
                <div style={{
                  width: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: mono, fontSize: 11, color: '#b0a898',
                  background: '#f7f4f0', borderRight: '1px solid #ede8e1', flexShrink: 0,
                }}>
                  {i + 1}
                </div>

                {/* Cuerpo */}
                <div style={{ flex: 1, padding: '10px 14px', minWidth: 0 }}>
                  <div style={{
                    fontSize: 15, fontWeight: 600, color: '#1a1208', lineHeight: 1.3,
                    textDecoration: done ? 'line-through' : 'none',
                  }}>
                    {t.tarea}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 5 }}>
                    {/* Responsable (solo en vista todos) */}
                    {usuario === '__TODOS__' && t.responsable && (
                      <span style={{
                        fontSize: 11, color: '#7a7068', background: '#f2ede6',
                        padding: '2px 8px', border: '1px solid #ddd7ce', fontFamily: mono,
                      }}>
                        {t.responsable}
                      </span>
                    )}
                    {t.turno && (
                      <span style={{
                        fontSize: 11, color: '#7a7068', background: '#f2ede6',
                        padding: '2px 8px', border: '1px solid #ddd7ce', fontFamily: mono,
                      }}>
                        Turno {t.turno}
                      </span>
                    )}
                    {t.fecha && (
                      <span style={{
                        fontSize: 11, color: '#7a7068', background: '#f2ede6',
                        padding: '2px 8px', border: '1px solid #ddd7ce', fontFamily: mono,
                      }}>
                        {t.fecha}
                      </span>
                    )}
                    {/* Estado actual */}
                    <span style={{
                      fontSize: 10, fontWeight: 700, letterSpacing: '.1em',
                      textTransform: 'uppercase', fontFamily: mono,
                      padding: '2px 7px',
                      color: done ? '#14532d' : '#7c2d12',
                      background: done ? '#f0fdf4' : '#fff7ed',
                      border: `1px solid ${done ? '#86efac' : '#fdba74'}`,
                    }}>
                      {done ? '✓ Completada' : '○ Pendiente'}
                    </span>
                  </div>

                  {t.observaciones && (
                    <div style={{ fontSize: 11, color: '#9a9088', marginTop: 4, fontStyle: 'italic' }}>
                      {t.observaciones}
                    </div>
                  )}
                </div>

                {/* Botón toggle */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '0 14px', background: '#fafaf8',
                  borderLeft: '1px solid #ede8e1', flexShrink: 0,
                }}>
                  <button
                    onClick={() => toggleEstado(t)}
                    title={done ? 'Marcar como pendiente' : 'Marcar como completada'}
                    style={{
                      width: 36, height: 36,
                      border: `2px solid ${done ? '#1a7a4a' : '#c8bfb2'}`,
                      background: done ? '#1a7a4a' : '#fff',
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 16, color: done ? '#fff' : '#c8bfb2',
                      transition: 'all .15s', borderRadius: 0,
                    }}
                    onMouseEnter={e => {
                      if (!done) {
                        e.currentTarget.style.borderColor = '#1a7a4a'
                        e.currentTarget.style.color = '#1a7a4a'
                      }
                    }}
                    onMouseLeave={e => {
                      if (!done) {
                        e.currentTarget.style.borderColor = '#c8bfb2'
                        e.currentTarget.style.color = '#c8bfb2'
                      }
                    }}
                  >
                    {done ? '✓' : '○'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Footer */}
      {lastFetch && (
        <div style={{
          fontFamily: mono, fontSize: 10, color: '#a09888',
          textAlign: 'center', marginTop: 12, letterSpacing: '.08em',
        }}>
          {lastFetch.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
          {' · '}Auto-refresh 60s
        </div>
      )}
    </div>
  )
}
