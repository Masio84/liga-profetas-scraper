'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

// Definimos la estructura de los datos
interface Match {
  id: number // ID numérico (BIGINT en Supabase)
  home_team: { name: string, logo_url: string | null }
  away_team: { name: string, logo_url: string | null }
  start_time: string
  status: string
  round: number
}

export default function QuinielaPage() {
  const [matches, setMatches] = useState<Match[]>([])
  const [selections, setSelections] = useState<Record<number, 'L' | 'E' | 'V'>>({})
  const [userData, setUserData] = useState({ nombre: '', telefono: '' })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [successId, setSuccessId] = useState<string | null>(null)

  const supabase = createClient()

  // 1. Cargar partidos
  useEffect(() => {
    const loadMatches = async () => {
      const { data, error } = await supabase
        .from('matches')
        .select(`
          id, start_time, status, round,
          home_team:teams!home_team_id(name, logo_url),
          away_team:teams!away_team_id(name, logo_url)
        `)
        // 👇 COMENTADO PARA PRUEBAS: Así verás partidos aunque ya hayan terminado
        // .or('status.eq.scheduled,status.eq.live') 
        .order('start_time', { ascending: false }) // False para ver los más recientes primero
        .limit(20)

      if (error) {
        console.error("Error cargando partidos:", error)
      } else {
        console.log("Partidos cargados:", data) // Revisa la consola (F12) si sigue vacío
        if (data) setMatches(data as any)
      }
      setLoading(false)
    }
    loadMatches()
  }, [])

  // 2. Manejar selección (L, E, V)
  const handleSelection = (matchId: number, pick: 'L' | 'E' | 'V') => {
    setSelections(prev => ({ ...prev, [matchId]: pick }))
  }

  // 3. Enviar formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (Object.keys(selections).length === 0) {
      alert("Selecciona al menos un pronóstico.")
      return
    }
    if (!userData.nombre || !userData.telefono) {
      alert("Por favor escribe tu nombre y teléfono.")
      return
    }

    setSubmitting(true)

    try {
      // Usamos la jornada del primer partido, o 1 por defecto
      const currentRound = matches.length > 0 ? matches.round : 1

      // A. Crear el "Volante" (Participación)
      const { data: participacion, error: partError } = await supabase
        .from('participaciones')
        .insert({
          nombre_completo: userData.nombre,
          telefono: userData.telefono,
          jornada: currentRound,
          monto_pagar: 15.00
        })
        .select()
        .single()

      if (partError) throw partError

      // B. Guardar los pronósticos individuales
      const pronosticosToInsert = Object.entries(selections).map(([matchId, seleccion]) => ({
        participacion_id: participacion.id,
        partido_id: parseInt(matchId),
        seleccion: seleccion
      }))

      const { error: prosError } = await supabase
        .from('pronosticos_quiniela')
        .insert(pronosticosToInsert)

      if (prosError) throw prosError

      // Éxito
      setSuccessId(participacion.id)
      setSelections({}) 
      window.scrollTo(0,0)

    } catch (err: any) {
      console.error(err)
      alert("Error al enviar: " + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  // --- VISTA DE CARGA ---
  if (loading) return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      <p className="animate-pulse text-xl">Cargando la Quiniela...</p>
    </div>
  )

  // --- VISTA DE ÉXITO ---
  if (successId) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-4">
        <div className="bg-green-900/20 border border-green-500 p-8 rounded-2xl max-w-md w-full text-center shadow-2xl">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">✅</span>
          </div>
          <h2 className="text-3xl font-bold mb-2 text-green-400">¡Quiniela Enviada!</h2>
          <p className="text-gray-300 mb-6">Tu participación ha sido registrada.</p>
          
          <div className="bg-gray-900 p-5 rounded-xl border border-gray-700 mb-6 text-left">
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Detalles de Pago</p>
            <p className="flex justify-between text-sm mb-1">
              <span>Monto a pagar:</span>
              <span className="font-bold text-yellow-400 text-lg">$15.00 MXN</span>
            </p>
            <div className="my-3 border-t border-gray-800"></div>
            <p className="text-sm"><span className="text-gray-400">Banco:</span> BBVA / Spin</p>
            <p className="text-sm"><span className="text-gray-400">Cuenta:</span> 1234 5678 9012 3456</p>
            <p className="mt-2 text-center font-mono text-gray-500 text-xs">FOLIO: {successId.slice(0, 8)}</p>
          </div>

          <button 
            onClick={() => setSuccessId(null)}
            className="w-full bg-white text-black font-bold py-3 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Llenar otra quiniela
          </button>
        </div>
      </div>
    )
  }

  // --- VISTA PRINCIPAL ---
  return (
    <main className="min-h-screen bg-gray-950 text-white pb-24">
      {/* Encabezado */}
      <header className="bg-gradient-to-b from-slate-900 to-gray-950 p-6 text-center border-b border-gray-800 sticky top-0 z-10 backdrop-blur-md bg-opacity-80">
        <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500 tracking-tighter">
          LIGA DE PROFETAS
        </h1>
        {/* CORRECCIÓN: Accedemos al primer elemento del array */}
        <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest">
          Jornada {matches.length > 0 ? matches.round : 'Actual'}
        </p>
      </header>

      <form onSubmit={handleSubmit} className="max-w-xl mx-auto p-4 space-y-6 mt-4">
        
        {/* Lista de Partidos */}
        <div className="space-y-4">
          {matches.map((match) => (
            <div key={match.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-4 shadow-lg">
              
              {/* Equipos y Hora */}
              <div className="flex justify-between items-end mb-4 px-2">
                <div className="flex flex-col items-center w-1/3">
                  <img src={match.home_team?.logo_url || '/placeholder.png'} alt="Local" className="w-10 h-10 object-contain mb-2" />
                  <span className="text-[10px] text-center font-bold text-gray-300">{match.home_team?.name}</span>
                </div>

                <div className="flex flex-col items-center w-1/3 pb-2">
                  <span className="text-[10px] text-gray-500 font-mono bg-gray-950 px-2 py-1 rounded">
                    {new Date(match.start_time).toLocaleDateString('es-MX', {weekday: 'short', hour:'2-digit', minute:'2-digit'})}
                  </span>
                </div>

                <div className="flex flex-col items-center w-1/3">
                  <img src={match.away_team?.logo_url || '/placeholder.png'} alt="Visita" className="w-10 h-10 object-contain mb-2" />
                  <span className="text-[10px] text-center font-bold text-gray-300">{match.away_team?.name}</span>
                </div>
              </div>

              {/* Botones de Selección */}
              <div className="grid grid-cols-3 gap-2 bg-gray-950 p-1 rounded-xl">
                {['L', 'E', 'V'].map((option) => {
                  const isSelected = selections[match.id] === option
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => handleSelection(match.id, option as 'L'|'E'|'V')}
                      className={`
                        py-3 rounded-lg font-black text-sm transition-all duration-200
                        ${isSelected 
                          ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg scale-100 ring-2 ring-green-400/50' 
                          : 'bg-gray-800 text-gray-500 hover:bg-gray-700 hover:text-gray-300'}
                      `}
                    >
                      {option === 'L' ? 'LOCAL' : option === 'E' ? 'EMPATE' : 'VISITA'}
                    </button>
                  )
                })}
              </div>

            </div>
          ))}

          {matches.length === 0 && (
            <div className="text-center py-10 text-gray-500 border border-dashed border-gray-800 rounded-xl">
              <p>No se encontraron partidos.</p>
              <p className="text-xs mt-2">Ejecuta el script de Python para cargar datos.</p>
            </div>
          )}
        </div>

        {/* Formulario de Usuario */}
        {matches.length > 0 && (
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 shadow-2xl mt-8">
            <h3 className="text-lg font-bold mb-4 text-white flex items-center gap-2">
              👤 Tus Datos
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1 ml-1">Nombre Completo</label>
                <input 
                  required
                  type="text" 
                  className="w-full bg-gray-950 border border-gray-700 rounded-xl p-3 text-white focus:border-green-500 outline-none transition-all placeholder:text-gray-700"
                  placeholder="Ej. Juan Pérez"
                  value={userData.nombre}
                  onChange={e => setUserData({...userData, nombre: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-xs text-gray-400 mb-1 ml-1">Celular / WhatsApp</label>
                <input 
                  required
                  type="tel" 
                  className="w-full bg-gray-950 border border-gray-700 rounded-xl p-3 text-white focus:border-green-500 outline-none transition-all placeholder:text-gray-700"
                  placeholder="Ej. 55 1234 5678"
                  value={userData.telefono}
                  onChange={e => setUserData({...userData, telefono: e.target.value})}
                />
              </div>

              <button 
                disabled={submitting}
                type="submit" 
                className="w-full mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-4 rounded-xl text-lg shadow-lg shadow-blue-900/20 transition-all disabled:opacity-50"
              >
                {submitting ? 'Enviando...' : `CONFIRMAR ($15 MXN)`}
              </button>
            </div>
          </div>
        )}

      </form>
    </main>
  )
}