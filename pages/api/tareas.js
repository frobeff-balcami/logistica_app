import { readSheet, updateCell, parseSheetData } from '../../lib/sheets'

// ID de la planilla de tareas
// https://docs.google.com/spreadsheets/d/1XrWrRznjT7geN7kvR_L2yuTnthLAULTyr0JEaQVq7_o/
const SPREADSHEET_ID = '1XrWrRznjT7geN7kvR_L2yuTnthLAULTyr0JEaQVq7_o'

// Columna donde está el estado (0-indexed desde A)
// Ajustar según tu planilla. Por defecto asumimos:
// Columna A: Tarea, B: Responsable, C: Estado
// Letra de columna del estado para el update:
const STATUS_COLUMN_LETTER = 'C'

export default async function handler(req, res) {
  // GET - Leer tareas
  if (req.method === 'GET') {
    try {
      const rows = await readSheet(SPREADSHEET_ID, 'A:F')
      const data = parseSheetData(rows)

      // Normalizar nombres de columnas
      const tareas = data.map(row => ({
        rowIndex: row._rowIndex,
        tarea: row.tarea || row.descripcion || row.task || row['nombre'] || Object.values(row)[0] || '',
        responsable: row.responsable || row.responsable || row.persona || row.asignado || row['nombre'] || '',
        estado: row.estado || row.status || row.estado || '',
        fecha: row.fecha || row.date || '',
        observaciones: row.observaciones || row.notas || row.obs || '',
      }))

      return res.status(200).json({ tareas, total: tareas.length })
    } catch (error) {
      console.error('Error leyendo tareas:', error.message)
      return res.status(500).json({
        error: error.message,
        hint: 'Verificá que GOOGLE_SERVICE_ACCOUNT_JSON esté configurado y tenga acceso a la planilla'
      })
    }
  }

  // POST - Actualizar estado de una tarea
  if (req.method === 'POST') {
    const { rowIndex, status } = req.body

    if (!rowIndex || !status) {
      return res.status(400).json({ error: 'Faltan campos: rowIndex y status' })
    }

    try {
      // Actualizar celda de estado
      const range = `${STATUS_COLUMN_LETTER}${rowIndex}`
      await updateCell(SPREADSHEET_ID, range, status)
      return res.status(200).json({ ok: true, updated: range })
    } catch (error) {
      console.error('Error actualizando tarea:', error.message)
      return res.status(500).json({ error: error.message })
    }
  }

  return res.status(405).json({ error: 'Método no permitido' })
}
