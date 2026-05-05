import { useState, useEffect, useCallback } from 'react'

const CSV_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vRELo88LzUymKq1Ue71ksRaYIVxp-8H5oLanuqHsDOUek1L3wrg_xnZvuD5qNj7-aGhHDOzGTjErnJS/pub?output=csv'

const mono = "'IBM Plex Mono', monospace"
const sans = "'Inter', 'DM Sans', sans-serif"

// ── Paleta KYRO
const K = {
  bg:          '#0a0a0f',
  surface:     'rgba(255,255,255,0.04)',
  surfaceHov:  'rgba(255,255,255,0.07)',
  border:      'rgba(255,255,255,0.08)',
  borderHov:   'rgba(139,92,246,0.5)',
  purple:      '#8b5cf6',
  purpleD:     '#6d28d9',
  purpleGlow:  'rgba(139,92,246,0.15)',
  green:       '#10b981',
  greenBg:     'rgba(16,185,129,0.12)',
  greenBorder: 'rgba(16,185,129,0.3)',
  orange:      '#f59e0b',
  orangeBg:    'rgba(245,158,11,0.12)',
  orangeBorder:'rgba(245,158,11,0.3)',
  textPrimary: '#f1f5f9',
  textSecond:  '#94a3b8',
  textMuted:   '#475569',
}

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

function normName(n) {
  return (n || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function initials(name) {
  return (name || '').split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
}

// ─────────────────────────────────────────────
// UserPicker — estilo KYRO
// ─────────────────────────────────────────────
function UserPicker({ operarios, onSelect }) {
  const [search, setSearch] = useState('')
  const filtrados = operarios.filter(op => normName(op).includes(normName(search)))

  return (
    <div style={{
      fontFamily: sans, minHeight: '100vh', background: K.bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px 16px',
    }}>
      <div style={{
        position: 'fixed', top: '20%', left: '50%', transform: 'translateX(-50%)',
        width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: 400, position: 'relative' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: K.purpleGlow, border: `1px solid rgba(139,92,246,0.3)`,
            borderRadius: 20, padding: '4px 14px', marginBottom: 16,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: K.purple, display: 'inline-block' }} />
            <span style={{ fontFamily: mono, fontSize: 10, color: K.purple, letterSpacing: '.12em', textTransform: 'uppercase' }}>
              Módulo Tareas
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: K.textPrimary, lineHeight: 1.2 }}>
            ¿Quién sos?
          </div>
          <div style={{ fontSize: 13, color: K.textSecond, marginTop: 6 }}>
            Seleccioná tu nombre para ver tus tareas
          </div>
        </div>

        <input
          type="text" value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar nombre..." autoFocus
          style={{
            width: '100%', padding: '10px 14px', fontSize: 14,
            background: K.surface, border: `1px solid ${K.border}`,
            borderRadius: 8, color: K.textPrimary, fontFamily: sans,
            outline: 'none', marginBottom: 8, boxSizing: 'border-box',
          }}
          onFocus={e => e.target.style.borderColor = K.purple}
          onBlur={e => e.target.style.borderColor = K.border}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {filtrados.length === 0 && (
            <div style={{ padding: '20px 0', textAlign: 'center', color: K.textMuted, fontFamily: mono, fontSize: 12 }}>
              Sin resultados
            </div>
          )}
          {filtrados.map((op, i) => (
            <button key={i} onClick={() => onSelect(op)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px', background: K.surface,
                border: `1px solid ${K.border}`, borderRadius: 8,
                cursor: 'pointer', textAlign: 'left', transition: 'all .15s', fontFamily: sans,
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = K.borderHov; e.currentTarget.style.background = K.surfaceHov }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = K.border; e.currentTarget.style.background = K.surface }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                background: `linear-gradient(135deg, ${K.purple}, ${K.purpleD})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: mono, fontSize: 12, fontWeight: 700, color: '#fff',
              }}>
                {initials(op)}
              </div>
              <span style={{ fontSize: 14, fontWeight: 500, color: K.textPrimary }}>{op}</span>
            </button>
          ))}
          <button onClick={() => onSelect('__TODOS__')}
            style={{
              marginTop: 6, padding: '10px 14px', background: 'transparent',
              border: `1px dashed ${K.border}`, borderRadius: 8,
              color: K.textMuted, fontSize: 12, cursor: 'pointer',
              fontFamily: mono, letterSpacing: '.06em', textTransform: 'uppercase',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = K.textSecond; e.currentTarget.style.borderColor = K.textMuted }}
            onMouseLeave={e => { e.currentTarget.style.color = K.textMuted; e.currentTarget.style.borderColor = K.border }}
          >
            Ver todas las tareas →
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────
export default function Tareas() {
  const [tareas, setTareas]             = useState([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState(null)
  const [usuario, setUsuario]           = useState(null)
  const [filtroEstado, setFiltroEstado] = useState('todas')
  const [filtroResp, setFiltroResp]     = useState('__TODOS__')
  const [lastFetch, setLastFetch]       = useState(null)

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
          rowIndex:      i + 2,
          tarea:         row.tarea || row.descripcion || row.task || row.nombre || values[0] || '',
          responsable:   row.responsable || row.persona || row.asignado || row.operario || values[1] || '',
          estado:        row.estado || row.status || values[9] || '',
          fecha:         row.fecha || row.date || '',
          observaciones: row['observación'] || row.observacion || row.observaciones || row.notas || row.obs || '',
          turno:         row.turno || row.shift || '',
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

  // ── Toggle solo en memoria
  const toggleEstado = (tarea) => {
    const nuevoEstado = isDone(tarea.estado) ? '' : 'Completada'
    setTareas(prev => prev.map(t =>
      t.rowIndex === tarea.rowIndex ? { ...t, estado: nuevoEstado } : t
    ))
  }

  const operarios = [...new Set(tareas.map(t => t.responsable).filter(Boolean))].sort()

  const misTareas = usuario === '__TODOS__'
    ? tareas
    : tareas.filter(t => normName(t.responsable) === normName(usuario || ''))

  const porResponsable = (usuario === '__TODOS__' && filtroResp !== '__TODOS__')
    ? misTareas.filter(t => normName(t.responsable) === normName(filtroResp))
    : misTareas

  const tareasFiltradas = porResponsable.filter(t => {
    if (filtroEstado === 'pendientes')  return !isDone(t.estado)
    if (filtroEstado === 'completadas') return isDone(t.estado)
    return true
  })

  const totalMias   = misTareas.length
  const completadas = misTareas.filter(t => isDone(t.estado)).length
  const pendientes  = totalMias - completadas
  const pct         = totalMias ? Math.round((completadas / totalMias) * 100) : 0

  if (!usuario && !loading && tareas.length > 0) {
    return <UserPicker operarios={operarios} onSelect={elegirUsuario} />
  }
  if (!usuario && loading) {
    return (
      <div style={{
        minHeight: '60vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontFamily: mono, fontSize: 12,
        color: K.textMuted,
      }}>
        Cargando...
      </div>
    )
  }

  const nombreMostrado = usuario === '__TODOS__' ? 'Todas las tareas' : usuario

  return (
    <div style={{ fontFamily: sans }}>

      {/* ── Header usuario */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px',
        background: K.surface,
        border: `1px solid ${K.border}`,
        borderRadius: 10, marginBottom: 14,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
            background: usuario === '__TODOS__'
              ? 'linear-gradient(135deg, #f59e0b, #d97706)'
              : `linear-gradient(135deg, ${K.purple}, ${K.purpleD})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: mono, fontSize: 13, fontWeight: 700, color: '#fff',
          }}>
            {usuario === '__TODOS__' ? '★' : initials(usuario || '')}
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: K.textPrimary, lineHeight: 1.2 }}>
              {nombreMostrado}
            </div>
            <div style={{ fontFamily: mono, fontSize: 10, color: K.textMuted, letterSpacing: '.08em' }}>
              {totalMias} tarea{totalMias !== 1 ? 's' : ''} asignadas
            </div>
          </div>
        </div>
        <button onClick={cambiarUsuario}
          style={{
            fontSize: 11, fontFamily: mono, letterSpacing: '.08em',
            textTransform: 'uppercase', padding: '5px 12px',
            background: 'transparent', border: `1px solid ${K.border}`,
            borderRadius: 6, color: K.textMuted, cursor: 'pointer', transition: 'all .15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = K.purple; e.currentTarget.style.color = K.purple }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = K.border; e.currentTarget.style.color = K.textMuted }}
        >
          Cambiar
        </button>
      </div>

      {/* ── Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
        {[
          { num: totalMias,   label: 'Total',      color: '#e2d9f3', bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.1)' },
          { num: pendientes,  label: 'Pendientes', color: '#fcd34d', bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.1)' },
          { num: completadas, label: 'Listas',     color: '#6ee7b7', bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.1)' },
        ].map((s, i) => (
          <div key={i} style={{
            background: s.bg, border: `1px solid ${s.border}`,
            borderRadius: 10, padding: '12px 14px',
          }}>
            <div style={{ fontFamily: mono, fontSize: 26, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.num}</div>
            <div style={{ fontFamily: mono, fontSize: 9, textTransform: 'uppercase', letterSpacing: '.12em', color: K.textMuted, marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Barra de progreso */}
      {totalMias > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontFamily: mono, fontSize: 10, textTransform: 'uppercase', letterSpacing: '.1em', color: K.textMuted }}>Progreso del día</span>
            <span style={{ fontFamily: mono, fontSize: 11, fontWeight: 700, color: pct === 100 ? K.green : K.purple }}>{pct}%</span>
          </div>
          <div style={{ height: 4, background: K.surface, borderRadius: 4, overflow: 'hidden', border: `1px solid ${K.border}` }}>
            <div style={{
              height: '100%', width: `${pct}%`, borderRadius: 4,
              background: pct === 100
                ? `linear-gradient(90deg, ${K.green}, #059669)`
                : `linear-gradient(90deg, ${K.purple}, ${K.purpleD})`,
              transition: 'width .4s ease',
              boxShadow: pct > 0 ? `0 0 8px ${pct === 100 ? K.green : K.purple}60` : 'none',
            }} />
          </div>
        </div>
      )}

      {/* ── Filtros */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>

        {/* Estado */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {[
            { id: 'todas',       label: 'Todas' },
            { id: 'pendientes',  label: 'Pendientes' },
            { id: 'completadas', label: 'Completadas' },
          ].map(f => (
            <button key={f.id} onClick={() => setFiltroEstado(f.id)}
              style={{
                padding: '5px 12px', fontSize: 11, fontWeight: 600,
                letterSpacing: '.06em', textTransform: 'uppercase',
                fontFamily: mono, cursor: 'pointer', borderRadius: 6,
                border: filtroEstado === f.id ? `1px solid ${K.purple}` : `1px solid ${K.border}`,
                background: filtroEstado === f.id ? K.purpleGlow : 'transparent',
                color: filtroEstado === f.id ? K.purple : K.textMuted,
                transition: 'all .15s',
              }}
            >
              {f.label}
            </button>
          ))}
          <button onClick={fetchTareas} title="Actualizar"
            style={{
              marginLeft: 'auto', padding: '5px 10px', fontSize: 14,
              border: `1px solid ${K.border}`, borderRadius: 6,
              background: 'transparent', color: K.textMuted,
              cursor: 'pointer', transition: 'all .15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = K.purple; e.currentTarget.style.borderColor = K.purple }}
            onMouseLeave={e => { e.currentTarget.style.color = K.textMuted; e.currentTarget.style.borderColor = K.border }}
          >
            ↻
          </button>
        </div>

        {/* Filtro por responsable — solo en vista __TODOS__ */}
        {usuario === '__TODOS__' && operarios.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: mono, fontSize: 9, textTransform: 'uppercase', letterSpacing: '.1em', color: K.textMuted, flexShrink: 0 }}>
              Operario:
            </span>
            <button
              onClick={() => setFiltroResp('__TODOS__')}
              style={{
                padding: '3px 10px', fontSize: 11, fontFamily: mono,
                borderRadius: 20, cursor: 'pointer',
                border: filtroResp === '__TODOS__' ? `1px solid ${K.purple}` : `1px solid ${K.border}`,
                background: filtroResp === '__TODOS__' ? K.purpleGlow : 'transparent',
                color: filtroResp === '__TODOS__' ? K.purple : K.textMuted,
                transition: 'all .15s',
              }}
            >
              Todos
            </button>
            {operarios.map((op, i) => (
              <button key={i} onClick={() => setFiltroResp(op)}
                style={{
                  padding: '3px 10px', fontSize: 11, fontFamily: mono,
                  borderRadius: 20, cursor: 'pointer',
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  border: normName(filtroResp) === normName(op) ? `1px solid ${K.purple}` : `1px solid ${K.border}`,
                  background: normName(filtroResp) === normName(op) ? K.purpleGlow : 'transparent',
                  color: normName(filtroResp) === normName(op) ? K.purple : K.textMuted,
                  transition: 'all .15s',
                }}
              >
                <span style={{
                  width: 16, height: 16, borderRadius: '50%',
                  background: `linear-gradient(135deg, ${K.purple}, ${K.purpleD})`,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 7, fontWeight: 700, color: '#fff', flexShrink: 0,
                }}>
                  {initials(op)}
                </span>
                {op.split(' ')[0]}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Error */}
      {error && (
        <div style={{
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 8, padding: '12px 16px', marginBottom: 12,
        }}>
          <div style={{ fontWeight: 600, color: '#fca5a5', fontSize: 13, marginBottom: 2 }}>Error al cargar</div>
          <div style={{ fontSize: 12, color: '#f87171' }}>{error}</div>
        </div>
      )}

      {/* ── Loading */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{
              height: 68, background: K.surface, borderRadius: 8,
              border: `1px solid ${K.border}`,
            }} />
          ))}
        </div>
      )}

      {/* ── Lista de tareas */}
      {!loading && !error && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {tareasFiltradas.length === 0 && (
            <div style={{ padding: '40px 0', textAlign: 'center' }}>
              <div style={{ fontFamily: mono, fontSize: 12, textTransform: 'uppercase', letterSpacing: '.1em', color: K.textMuted }}>
                {filtroEstado === 'completadas' ? 'Nada completado aún' : '¡Todo listo por acá!'}
              </div>
            </div>
          )}

          {tareasFiltradas.map((t, i) => {
            const done = isDone(t.estado)
            return (
              <div key={t.rowIndex} style={{
                display: 'flex', alignItems: 'stretch',
                background: done ? 'rgba(16,185,129,0.05)' : K.surface,
                border: `1px solid ${done ? K.greenBorder : K.border}`,
                borderRadius: 8, opacity: done ? 0.7 : 1,
                transition: 'all .15s', overflow: 'hidden',
              }}>
                {/* Barra lateral */}
                <div style={{
                  width: 3, flexShrink: 0,
                  background: done ? K.green : `linear-gradient(180deg, ${K.purple}, ${K.purpleD})`,
                }} />

                {/* Número */}
                <div style={{
                  width: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: mono, fontSize: 10, color: K.textMuted, flexShrink: 0,
                }}>
                  {i + 1}
                </div>

                {/* Cuerpo */}
                <div style={{ flex: 1, padding: '10px 12px', minWidth: 0 }}>
                  <div style={{
                    fontSize: 14, fontWeight: 600,
                    color: done ? K.textMuted : K.textPrimary,
                    lineHeight: 1.3,
                    textDecoration: done ? 'line-through' : 'none',
                  }}>
                    {t.tarea}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                    {t.responsable && (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        fontSize: 11, color: K.textSecond,
                        background: K.purpleGlow, border: `1px solid rgba(139,92,246,0.2)`,
                        padding: '2px 8px', borderRadius: 12, fontFamily: mono,
                      }}>
                        <span style={{
                          width: 14, height: 14, borderRadius: '50%',
                          background: `linear-gradient(135deg, ${K.purple}, ${K.purpleD})`,
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 7, fontWeight: 700, color: '#fff', flexShrink: 0,
                        }}>
                          {initials(t.responsable)}
                        </span>
                        {t.responsable}
                      </span>
                    )}
                    {t.turno && (
                      <span style={{
                        fontSize: 11, color: K.textMuted,
                        background: K.surface, border: `1px solid ${K.border}`,
                        padding: '2px 8px', borderRadius: 12, fontFamily: mono,
                      }}>
                        T{t.turno}
                      </span>
                    )}
                    {t.fecha && (
                      <span style={{
                        fontSize: 11, color: K.textMuted,
                        background: K.surface, border: `1px solid ${K.border}`,
                        padding: '2px 8px', borderRadius: 12, fontFamily: mono,
                      }}>
                        {t.fecha}
                      </span>
                    )}
                    <span style={{
                      fontSize: 10, fontWeight: 700, letterSpacing: '.08em',
                      textTransform: 'uppercase', fontFamily: mono,
                      padding: '2px 8px', borderRadius: 12,
                      color: done ? K.green : K.orange,
                      background: done ? K.greenBg : K.orangeBg,
                      border: `1px solid ${done ? K.greenBorder : K.orangeBorder}`,
                    }}>
                      {done ? '✓ Lista' : '○ Pendiente'}
                    </span>
                  </div>

                  {t.observaciones && (
                    <div style={{
                      display: 'flex', alignItems: 'flex-start', gap: 6,
                      marginTop: 8,
                      background: 'rgba(139,92,246,0.08)',
                      border: '1px solid rgba(139,92,246,0.2)',
                      borderLeft: '3px solid #8b5cf6',
                      borderRadius: 6, padding: '6px 10px',
                    }}>
                      <span style={{ fontSize: 11, color: '#8b5cf6', flexShrink: 0 }}>💬</span>
                      <span style={{ fontSize: 12, color: '#c4b5fd', lineHeight: 1.4 }}>
                        {t.observaciones}
                      </span>
                    </div>
                  )}
                </div>

                {/* Botón toggle */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '0 14px', flexShrink: 0, borderLeft: `1px solid ${K.border}`,
                }}>
                  <button
                    onClick={() => toggleEstado(t)}
                    title={done ? 'Marcar como pendiente' : 'Marcar como completada'}
                    style={{
                      width: 32, height: 32, borderRadius: '50%',
                      border: done ? `2px solid ${K.green}` : `2px solid ${K.border}`,
                      background: done ? K.greenBg : 'transparent',
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 14, color: done ? K.green : K.textMuted,
                      transition: 'all .2s',
                      boxShadow: done ? `0 0 8px ${K.green}40` : 'none',
                    }}
                    onMouseEnter={e => {
                      if (!done) {
                        e.currentTarget.style.borderColor = K.green
                        e.currentTarget.style.color = K.green
                        e.currentTarget.style.boxShadow = `0 0 8px ${K.green}40`
                      }
                    }}
                    onMouseLeave={e => {
                      if (!done) {
                        e.currentTarget.style.borderColor = K.border
                        e.currentTarget.style.color = K.textMuted
                        e.currentTarget.style.boxShadow = 'none'
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
          fontFamily: mono, fontSize: 10, color: K.textMuted,
          textAlign: 'center', marginTop: 16, letterSpacing: '.08em',
        }}>
          ↺ {lastFetch.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} · auto-refresh 60s
        </div>
      )}
    </div>
  )
}
