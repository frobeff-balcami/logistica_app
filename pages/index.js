import { useMemo, useState } from 'react'
import Layout from '../components/Layout'
import Tareas from '../components/Tareas'
import Faltantes from '../components/Faltantes'
import Calculadora from '../components/Calculadora'

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('home')

  const modules = useMemo(
    () => [
      {
        id: 'tareas',
        label: 'Tareas',
        description: 'Seguimiento de tareas activas por responsable',
        icon: '📋',
        accent: 'from-[#c1121f]/30 to-transparent',
        iconStyle: 'border-[#fca5a5]/30 bg-[#c1121f]/10 text-[#fecaca]',
        badge: 'Operativo',
        component: <Tareas />,
      },
      {
        id: 'faltantes',
        label: 'Faltantes',
        description: 'Piezas pendientes, estado y prioridad',
        icon: '📦',
        accent: 'from-[#d97706]/30 to-transparent',
        iconStyle: 'border-[#fcd34d]/30 bg-[#d97706]/10 text-[#fde68a]',
        badge: 'Prioridad',
        component: <Faltantes />,
      },
      {
        id: 'kpis',
        label: 'KPIs',
        description: 'Indicadores operativos del área',
        icon: '📊',
        accent: 'from-[#2563eb]/30 to-transparent',
        iconStyle: 'border-[#93c5fd]/30 bg-[#2563eb]/10 text-[#bfdbfe]',
        badge: 'Control',
        component: <KPIs />,
      },
      {
        id: 'desvios',
        label: 'Desvíos',
        description: 'Registro de desvíos y observaciones',
        icon: '⚠️',
        accent: 'from-[#ea580c]/30 to-transparent',
        iconStyle: 'border-[#fdba74]/30 bg-[#ea580c]/10 text-[#fed7aa]',
        badge: 'Seguimiento',
        component: <Desvios />,
      },
      {
        id: 'calculadora',
        label: 'Alambre',
        description: 'Cálculo rápido de peso a metros',
        icon: '🧮',
        accent: 'from-[#059669]/30 to-transparent',
        iconStyle: 'border-[#86efac]/30 bg-[#059669]/10 text-[#bbf7d0]',
        badge: 'Utilidad',
        component: <Calculadora />,
      },
    ],
    []
  )

  const currentModule = modules.find((module) => module.id === activeTab)

  return (
    <Layout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      currentModule={currentModule}
    >
      {activeTab === 'home' ? (
        <div className="space-y-5 sm:space-y-7">
          <section className="relative overflow-hidden rounded-[24px] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.10),rgba(255,255,255,0.03))] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.22)] backdrop-blur-md sm:rounded-[30px] sm:p-6 lg:p-7">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(193,18,31,0.18),transparent_25%)]" />

            <div className="relative z-10">
              <div className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#fca5a5] sm:text-[11px]">
                Balcami
              </div>

              <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-3xl">
                  <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl lg:text-4xl">
                    Panel operativo
                  </h2>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-white/70 sm:mt-3 sm:text-base sm:leading-7">
                    Accedé a los módulos del área y gestioná tareas, faltantes,
                    indicadores y reportes desde un solo lugar.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:min-w-[280px]">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur sm:p-4">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/45 sm:text-[11px]">
                      Módulos
                    </div>
                    <div className="mt-1 text-xl font-extrabold text-white sm:text-2xl">
                      {modules.length}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#c1121f]/20 bg-[#c1121f]/10 p-3 backdrop-blur sm:p-4">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#fecaca] sm:text-[11px]">
                      Área
                    </div>
                    <div className="mt-1 text-sm font-bold text-white">
                      Logística
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section>
            <div className="mb-3 sm:mb-4">
              <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/40 sm:text-[11px]">
                Módulos
              </div>
              <h3 className="mt-1 text-lg font-bold text-white sm:text-xl">
                Centro de navegación
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {modules.map((module) => (
                <button
                  key={module.id}
                  onClick={() => setActiveTab(module.id)}
                  className="group relative min-h-[210px] overflow-hidden rounded-[22px] border border-white/10 bg-white/5 p-4 text-left shadow-[0_18px_45px_rgba(0,0,0,0.18)] backdrop-blur-md transition duration-200 active:scale-[0.99] sm:min-h-[230px] sm:rounded-[26px] sm:p-5 hover:border-[#c1121f]/40 hover:bg-white/10 hover:shadow-[0_24px_60px_rgba(0,0,0,0.35)]"
                >
                  <div
                    className={`absolute inset-x-0 top-0 h-20 bg-gradient-to-br ${module.accent} opacity-80 transition duration-200 group-hover:opacity-100 sm:h-24`}
                  />

                  <div className="relative z-10 flex h-full flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-2xl border text-xl shadow-inner sm:h-14 sm:w-14 sm:text-2xl ${module.iconStyle}`}
                      >
                        {module.icon}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/55 sm:px-3 sm:text-[11px]">
                          {module.badge}
                        </span>
                        <span className="text-base text-white/35 transition group-hover:translate-x-1 group-hover:text-white/80 sm:text-lg">
                          →
                        </span>
                      </div>
                    </div>

                    <div className="mt-6 sm:mt-8">
                      <h4 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                        {module.label}
                      </h4>
                      <p className="mt-2 max-w-[30ch] text-sm leading-6 text-white/65">
                        {module.description}
                      </p>
                    </div>

                    <div className="mt-auto pt-5">
                      <div className="flex items-center justify-between border-t border-white/10 pt-4">
                        <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/35 sm:text-xs">
                          Abrir módulo
                        </span>
                        <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/70 transition group-hover:bg-[#c1121f]/20 group-hover:text-white sm:text-xs">
                          Ver más
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>
        </div>
      ) : (
        <div className="rounded-[24px] border border-white/10 bg-white/5 p-3 shadow-[0_20px_60px_rgba(0,0,0,0.22)] backdrop-blur-md sm:rounded-[30px] sm:p-5 lg:p-6">
          {currentModule?.component}
        </div>
      )}
    </Layout>
  )
}
