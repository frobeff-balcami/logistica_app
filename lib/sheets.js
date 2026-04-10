import { google } from 'googleapis'

// ============================================================
// CONFIGURACIÓN DE GOOGLE SHEETS
// ============================================================
// Necesitás una Service Account de Google Cloud.
// Ver README.md para instrucciones detalladas.
// ============================================================

function getAuth() {
  const credentials = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
    ? JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON)
    : null

  if (!credentials) {
    throw new Error(
      'Falta GOOGLE_SERVICE_ACCOUNT_JSON en variables de entorno. ' +
      'Seguí las instrucciones en README.md para configurar Google Sheets API.'
    )
  }

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })

  return auth
}

export async function readSheet(spreadsheetId, range = 'Sheet1!A:Z') {
  const auth = getAuth()
  const sheets = google.sheets({ version: 'v4', auth })

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  })

  return response.data.values || []
}

export async function updateCell(spreadsheetId, range, value) {
  const auth = getAuth()
  const sheets = google.sheets({ version: 'v4', auth })

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [[value]] },
  })
}

export async function appendRow(spreadsheetId, range, values) {
  const auth = getAuth()
  const sheets = google.sheets({ version: 'v4', auth })

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: [values] },
  })
}

// Parsear headers y filas en objetos
export function parseSheetData(rows) {
  if (!rows || rows.length < 2) return []
  const [headers, ...dataRows] = rows
  return dataRows
    .filter(row => row.some(cell => cell?.toString().trim()))
    .map((row, i) => {
      const obj = {}
      headers.forEach((header, j) => {
        if (header) obj[header.toLowerCase().trim()] = row[j] || ''
      })
      obj._rowIndex = i + 2 // 1-indexed, skip header row
      return obj
    })
}
