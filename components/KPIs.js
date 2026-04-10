import { useState, useEffect } from 'react'

// KPI Card component
function KPICard({ emoji, label, value, unit, color, sublabel, trend }) {
  return (
    <div className="bg-[#1a1f2e] rounded-xl p-4 border border-[#2a3042]">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs text-[#64748b] uppercase tracking-wider mb-2">{label}</div>
          <div className="flex items-baseline gap-1">
            <span className="font-display text-3xl font-bold" style={{ color }}>{value}</span>
            {unit && <span className="text-[#64748b] text-sm">{unit}</span>}
          </div>
          {sublabel && <div className="text-xs text-[#64748b] mt-1">{sublabel}</div>}
        </div>
        <div className="text-3xl">{emoji}</div>
      </div>
      {trend !== undefined && (
        <div className={`mt-2 text-xs flex items-center gap-1 ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% vs ayer
        </div>
      )}
    </div>
  )
}

export default function KPIs() {
  const [kpis, setKpis] = useState(null)
  const [loading, setLoading] = useState(true)
  const [alertas, setAlertas] = useState([])

  useEffect(() => {
    // Fetch both
    Promise.all([
      fetch('/api/tareas').then(r => r.json()).catch(() => ({ tareas: [] })),
      fetch('/api/faltantes').then(r => r.json()).catch(() => ({ faltantes: [] })),
    ]).then(([tareasData, faltantesData]) => {
      const tareas = tareasData.tareas || []
      const faltantes = faltantesData.faltantes || []

      const completadas = tareas.filter(t => {
        const st = (t.estado || '').toLowerCase().trim()
        return ['completada', 'completa', 'hecha', 'ok'].includes(st)
      })

      const pendientes = tareas.filter(t => {
        const st = (t.estado || '').toLowerCase().trim()
        return !['completada', 'completa', 'hecha', 'ok'].includes(st)
      })

      // Calcular días faltantes
      const diasFn = (fechaStr) => {
        if (!fechaStr) return 0
        try {
          const parts = fechaStr.toString().split('/')
          let fecha
          if (parts.length === 3) {
            fecha = new Date(`${parts[2]}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}`)
          } else {
            fecha = new Date(fechaStr)
          }
          return Math.floor((Date.now() - fecha.getTime()) / (1000 * 60 * 60 * 24))
        } catch { return 0 }
      }

      const criticos = faltantes.filter(f => diasFn(f.fecha) >= 7)

      setKpis({
        totalTareas: tareas.length,
        completadas: completadas.length,
        pendientes: pendientes.length,
        porcentajeCompletion: tareas.length ? Math.round((completadas.length / tareas.length) * 100) : 0,
        totalFaltantes: faltantes.length,
        criticos: criticos.length,
      })

      // Generar alertas
      const nuevasAlertas = []
      if (pendientes.length > 0) {
        nuevasAlertas.push({
          tipo: 'warning',
          msg: `${pendientes.length} tarea${pendientes.length !== 1 ? 's' : ''} pendiente${pendientes.length !== 1 ? 's' : ''} hoy`,
          icon: '📋'
        })
      }
      if (criticos.length > 0) {
        nuevasAlertas.push({
          tipo: 'critical',
          msg: `${criticos.length} faltante${criticos.length !== 1 ? 's' : ''} crítico${criticos.length !== 1 ? 's' : ''} (más de 7 días)`,
          icon: '🔴'
        })
      }
      if (tareas.length > 0 && completadas.length === tareas.length) {
        nuevasAlertas.push({
          tipo: 'success',
          msg: '¡Todas las tareas del día completadas!',
          icon: '🎉'
        })
      }
      setAlertas(nuevasAlertas)
    }).finally(() => setLoading(false))
  }, [])

  const now = new Date()
  const hora = now.getHours()
  const turno = hora < 6 ? 'Nocturno' : hora < 14 ? 'Mañana' : hora < 22 ? 'Tarde' : 'Nocturno'

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3 flex gap-3 items-start">
        <span className="text-xl">📊</span>
        <div>
          <div className="text-sm font-medium text-purple-400">Dashboard operativo</div>
          <div className="text-xs text-[#64748b] mt-0.5">
            Turno {turno} · {now.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
        </div>
      </div>

      {/* Alertas */}
      {alertas.length > 0 && (
        <div className="space-y-2">
          {alertas.map((a, i) => (
            <div key={i} className={`rounded-xl p-3 flex gap-3 items-center text-sm border ${
              a.tipo === 'critical' ? 'bg-red-900/20 border-red-500/30 text-red-300' :
              a.tipo === 'warning'  ? 'bg-amber-900/20 border-amber-500/30 text-amber-300' :
              'bg-emerald-900/20 border-emerald-500/30 text-emerald-300'
            }`}>
              <span className="text-xl shrink-0">{a.icon}</span>
              <span>{a.msg}</span>
            </div>
          ))}
        </div>
      )}

      {/* KPIs Grid */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {[1,2,3,4].map(i => <div key={i} className="skeleton h-28 rounded-xl" />)}
        </div>
      ) : kpis && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <KPICard
              emoji="📋" label="Tareas hoy"
              value={kpis.totalTareas} color="#3b82f6"
              sublabel="en el sheet"
            />
            <KPICard
              emoji="✅" label="Completadas"
              value={kpis.completadas} unit={`/ ${kpis.totalTareas}`}
              color="#10b981"
              sublabel={`${kpis.porcentajeCompletion}% del día`}
            />
            <KPICard
              emoji="⏳" label="Pendientes"
              value={kpis.pendientes} color="#f59e0b"
              sublabel="por hacer"
            />
            <KPICard
              emoji="🔴" label="Faltantes críticos"
              value={kpis.criticos} color="#ef4444"
              sublabel="+7 días esperando"
            />
          </div>

          {/* Completion gauge */}
          <div className="bg-[#1a1f2e] rounded-xl p-4 border border-[#2a3042]">
            <div className="flex justify-between text-xs text-[#64748b] mb-3">
              <span>Avance del turno</span>
              <span className="font-display text-white font-bold text-base">{kpis.porcentajeCompletion}%</span>
            </div>
            <div className="h-4 bg-[#0f1117] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${kpis.porcentajeCompletion}%`,
                  background: kpis.porcentajeCompletion === 100
                    ? 'linear-gradient(90deg, #10b981, #34d399)'
                    : kpis.porcentajeCompletion >= 60
                    ? 'linear-gradient(90deg, #f59e0b, #fcd34d)'
                    : 'linear-gradient(90deg, #ef4444, #f87171)',
                }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-[#64748b] mt-2">
              <span>0%</span>
              <span>Meta: 100%</span>
            </div>
          </div>
        </>
      )}

      {/* Propuestas de mejora */}
      <div className="bg-[#1a1f2e] rounded-xl border border-[#2a3042] p-4">
        <div className="text-xs font-medium text-[#64748b] uppercase tracking-wider mb-3">
          🧠 Funcionalidades próximas
        </div>
        <div className="space-y-3">
          {[
            {
              emoji: '🔔',
              title: 'Alertas Push (WhatsApp/Telegram)',
              desc: 'Cuando un faltante supera N días sin resolver, notifica automáticamente al supervisor.',
              tag: 'Alta prioridad'
            },
            {
              emoji: '📈',
              title: 'Historial de desvíos',
              desc: 'Ver todos los desvíos reportados en el mes, con filtros por zona/operario. KPI de recurrencia.',
              tag: 'Calidad'
            },
            {
              emoji: '🏭',
              title: 'Capacidad de carga por turno',
              desc: 'Registro diario de cuántos pallets/bultos se procesaron por turno. Gráfico semanal.',
              tag: 'Productividad'
            },
          ].map((item, i) => (
            <div key={i} className="flex gap-3 items-start p-3 bg-[#0f1117] rounded-lg border border-[#2a3042]">
              <span className="text-2xl shrink-0">{item.emoji}</span>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-white">{item.title}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
                    {item.tag}
                  </span>
                </div>
                <p className="text-xs text-[#64748b] mt-1 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
