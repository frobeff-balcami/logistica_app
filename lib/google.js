import { google } from 'googleapis'

export function getSheetsClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      'Faltan GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET o GOOGLE_REFRESH_TOKEN en variables de entorno.'
    )
  }

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret
  )

  oauth2Client.setCredentials({
    refresh_token: refreshToken,
  })

  return google.sheets({
    version: 'v4',
    auth: oauth2Client,
  })
}