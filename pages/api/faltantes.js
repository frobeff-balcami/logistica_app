import { readSheet, parseSheetData } from '../../lib/sheets'

// ID de la planilla de faltantes
// https://docs.google.com/spreadsheets/d/1gUABUn3h-49DJz92Bt_Y495AyVlBIpiGoXD2dAB8lUg/
const SPREADSHEET_ID = '1gUABUn3h-49DJz92Bt_Y495AyVlBIpiGoXD2dAB8lUg'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' })
  }

  try {
    const rows = await readSheet(SPREADSHEET_ID, 'A:H')
    const data = parseSheetData(rows)

    const faltantes = data.map(row => ({
      // Intentar varios nombres de columna posibles
      producto: row.producto || row.item || row.articulo || row.nombre || row.material || Object.values(row)[0] || '',
      fecha: row.fecha || row.date || row['fecha de pedido'] || row['fecha pedido'] || '',
      cantidad: row.cantidad || row.faltante || row.qty || row['cantidad faltante'] || '',
      unidad: row.unidad || row.um || row['unidad de medida'] || '',
      observaciones: row.observaciones || row.notas || row.obs || row.comentarios || '',
      proveedor: row.proveedor || row.supplier || '',
    })).filter(f => f.producto) // Filtrar filas vacías

    return res.status(200).json({ faltantes, total: faltantes.length })
  } catch (error) {
    console.error('Error leyendo faltantes:', error.message)
    return res.status(500).json({
      error: error.message,
      hint: 'Verificá que GOOGLE_SERVICE_ACCOUNT_JSON esté configurado'
    })
  }
}
