import { getSheetsClient } from '../../../lib/google'

const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID
const SHEET_NAME = process.env.GOOGLE_SHEET_TAB || 'Tareas'
const STATUS_COLUMN = process.env.GOOGLE_SHEET_STATUS_COLUMN || 'C'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' })
  }

  try {
    if (!SPREADSHEET_ID) {
      return res.status(500).json({ error: 'Falta GOOGLE_SHEET_ID en variables de entorno' })
    }

    const { rowIndex } = req.body

    if (!rowIndex) {
      return res.status(400).json({ error: 'Falta rowIndex' })
    }

    const sheets = getSheetsClient()

    const range = `${SHEET_NAME}!${STATUS_COLUMN}${rowIndex}`

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [['Terminada']],
      },
    })

    return res.status(200).json({
      ok: true,
      updatedRange: range,
      newStatus: 'Terminada',
    })
  } catch (error) {
    console.error('Error actualizando tarea:', error.message)
    return res.status(500).json({
      error: error.message,
    })
  }
}