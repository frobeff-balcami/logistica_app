import { useState, useEffect } from 'react'

export default function Layout({ children, activeTab, setActiveTab, currentModule }) {
  const [time, setTime] = useState('')
  const [date, setDate] = useState('')

  useEffect(() => {
    const update = () => {
      const now = new Date()
      setTime(now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }))
      setDate(
        now.toLocaleDateString('es-AR', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        })
      )
    }

    update()
    const interval = setInterval(update, 10000)
    return () => clearInterval(interval)
  }, [])

  const isHome = activeTab === 'home'

  return (
    <div className="min-h-screen bg-[#0b1220]">
      <div className="relative overflow-hidden border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(193,18,31,0.28),transparent_28%),radial-gradient(circle_at_top_right,rgba(255,255,255,0.10),transparent_20%),linear-gradient(135deg,#0b1220_0%,#111827_45%,#162033_100%)]">
        <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(255,255,255,0.14)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.14)_1px,transparent_1px)] [background-size:32px_32px]" />

        <header className="relative z-10">
          <div className="mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-5 lg:px-8">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
                {!isHome && (
                  <button
                    onClick={() => setActiveTab('home')}
                    className="inline-flex w-fit items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3.5 py-2 text-sm font-semibold text-white/90 backdrop-blur transition hover:border-[#c1121f]/50 hover:bg-white/10"
                  >
                    <span>←</span>
                    <span>Inicio</span>
                  </button>
                )}

                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-sm font-extrabold tracking-[0.22em] text-[#111827] shadow-[0_20px_50px_rgba(0,0,0,0.35)] sm:h-14 sm:w-14 sm:text-base">
                    B
                  </div>

                  <div className="min-w-0">
                    <div className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#f87171] sm:text-[11px] sm:tracking-[0.35em]">
                      Balcami
                    </div>

                    <h1 className="mt-1 text-xl font-extrabold leading-tight tracking-tight text-white sm:text-3xl">
                      {isHome ? 'Panel de módulos' : currentModule?.label || 'Panel operativo'}
                    </h1>

                    <p className="mt-1 text-xs capitalize text-white/65 sm:text-sm">
                      {date}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/10 px-3 py-3 text-white shadow-[0_12px_35px_rgba(0,0,0,0.20)] backdrop-blur-md sm:rounded-3xl sm:px-5 sm:py-4">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/55 sm:text-[11px] sm:tracking-[0.2em]">
                    Hora
                  </div>
                  <div className="mt-1 text-lg font-extrabold tracking-tight sm:text-2xl">
                    {time}
                  </div>
                </div>

                <div className="rounded-2xl border border-[#c1121f]/25 bg-[#ffffff12] px-3 py-3 text-white shadow-[0_12px_35px_rgba(0,0,0,0.20)] backdrop-blur-md sm:rounded-3xl sm:px-5 sm:py-4">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#fca5a5] sm:text-[11px] sm:tracking-[0.2em]">
                    Área
                  </div>
                  <div className="mt-1 text-sm font-bold leading-tight text-white sm:text-base">
                    Logística interna
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {isHome && (
          <div className="relative z-10 mx-auto max-w-7xl px-3 pb-6 sm:px-6 sm:pb-8 lg:px-8">
            <div className="max-w-3xl rounded-[24px] border border-white/10 bg-white/5 p-4 text-white shadow-[0_18px_60px_rgba(0,0,0,0.22)] backdrop-blur-md sm:rounded-[32px] sm:p-6">
              <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#fca5a5] sm:text-[11px] sm:tracking-[0.28em]">
                Centro de control
              </div>

              <h2 className="mt-2 text-xl font-bold leading-tight tracking-tight sm:text-3xl">
                Gestión operativa clara, rápida y visual
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/72 sm:text-base">
                Accedé a tareas, faltantes, indicadores y desvíos desde un solo lugar, con una visual más fuerte y pensada para uso operativo.
              </p>
            </div>
          </div>
        )}
      </div>

      <main className="-mt-1 pb-6 sm:-mt-2 sm:pb-8">
        <div className="mx-auto max-w-7xl px-2.5 sm:px-6 lg:px-8">
          <div className="rounded-t-[24px] bg-[#1e293b] p-3 shadow-[0_-10px_40px_rgba(15,23,42,0.06)] sm:rounded-t-[34px] sm:p-5 lg:p-6">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}