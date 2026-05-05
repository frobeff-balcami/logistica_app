import { getSheetsClient } from '../../../lib/google'

const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID
const SHEET_NAME = process.env.GOOGLE_SHEET_TAB || 'Tareas'

function normalizeHeader(value) {
  return (value || '')
    .toString()
    .trim()
    .toLowerCase()
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' })
  }

  try {
    if (!SPREADSHEET_ID) {
      return res.status(500).json({ error: 'Falta GOOGLE_SHEET_ID en variables de entorno' })
    }

    const sheets = getSheetsClient()

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:Z`,
    })

    const rows = response.data.values || []

    if (rows.length < 2) {
      return res.status(200).json({ tareas: [], total: 0 })
    }

    const [headers, ...dataRows] = rows
    const normalizedHeaders = headers.map(normalizeHeader)

    const tareas = dataRows
      .map((row, index) => {
        const obj = {}

        normalizedHeaders.forEach((header, i) => {
          obj[header] = row[i] || ''
        })

        return {
          rowIndex: index + 2, // fila real en Google Sheets
          tarea:
            obj.tarea ||
            obj.descripcion ||
            obj.task ||
            obj.nombre ||
            obj.actividad ||
            '',
          responsable:
            obj.responsable ||
            obj.persona ||
            obj.asignado ||
            obj.operario ||
            '',
          estado:
            obj.estado ||
            obj.status ||
            '',
          prioridad:
            obj.prioridad ||
            '',
          observaciones:
            obj.observaciones ||
            obj.notas ||
            obj.obs ||
            '',
        }
      })
      .filter(t => t.tarea)
      .filter(t => {
        const estado = (t.estado || '').toString().trim().toLowerCase()
        return estado === 'en proceso' || estado === ''
      })

    return res.status(200).json({
      tareas,
      total: tareas.length,
    })
  } catch (error) {
    console.error('Error leyendo tareas:', error.message)
    return res.status(500).json({
      error: error.message,
    })
  }
}