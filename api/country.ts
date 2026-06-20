import type { VercelRequest, VercelResponse } from '@vercel/node'

// Returns the country code from Cloudflare header
// Behind Cloudflare, the CF-IPCountry header contains the ISO 3166-1 alpha-2 country code
export default async function country (req: VercelRequest, res: VercelResponse): Promise<void> {
  const cfCountry = req.headers['cf-ipcountry']
    ?? req.headers['cf-ipcountry'.toLowerCase()]
    ?? req.headers['x-vercel-ip-country']
    ?? ''

  const country = Array.isArray(cfCountry) ? cfCountry[0] : cfCountry

  res.status(200).json({
    country: country.toUpperCase() || 'unknown'
  })
}
