import { appendRow } from '../../lib/sheets'

// Podés crear una nueva planilla para los desvíos
// o usar una pestaña separada en la planilla de tareas.
// IMPORTANTE: Reemplazá con el ID de tu planilla de desvíos
// y asegurate que la Service Account tenga acceso.
const DESVIOS_SPREADSHEET_ID = process.env.DESVIOS_SPREADSHEET_ID || ''

// Si no hay planilla configurada, guardar en la misma de tareas
// (en una hoja llamada "Desvios")
const DESVIOS_RANGE = 'Desvios!A:E'

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' })
  }

  const { descripcion, usuario, fecha, fotoBase64 } = req.body

  if (!descripcion) {
    return res.status(400).json({ error: 'La descripción es requerida' })
  }

  const spreadsheetId = DESVIOS_SPREADSHEET_ID

  if (!spreadsheetId) {
    // Si no hay spreadsheet configurada, igual responder OK
    // (el desvío se "pierde" pero no rompe la app)
    console.warn('DESVIOS_SPREADSHEET_ID no configurado. El desvío no se guardó en Sheets.')
    return res.status(200).json({
      ok: true,
      message: 'Desvío recibido (configurar DESVIOS_SPREADSHEET_ID para persistir)',
    })
  }

  try {
    // Si hay foto, guardarla como link o string truncado
    // Para producción: subir a Google Drive o Cloudinary
    const fotoInfo = fotoBase64
      ? '[foto adjunta - integrar con Drive para almacenamiento]'
      : 'sin foto'

    await appendRow(spreadsheetId, DESVIOS_RANGE, [
      fecha || new Date().toLocaleString('es-AR'),
      usuario || 'Anónimo',
      descripcion,
      fotoInfo,
      'Pendiente resolución',
    ])

    return res.status(200).json({ ok: true })
  } catch (error) {
    console.error('Error guardando desvío:', error.message)
    return res.status(500).json({ error: error.message })
  }
}
