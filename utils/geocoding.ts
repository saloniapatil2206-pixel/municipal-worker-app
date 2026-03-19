/**
 * Performs reverse geocoding using OpenStreetMap Nominatim API.
 * @param lat Latitude
 * @param lng Longitude
 * @returns Full address string
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'CITIZENZ-Worker-App'
        }
      }
    )
    
    if (!response.ok) throw new Error('Geocoding failed')
    
    const data = await response.json()
    return data.display_name || 'Address unavailable'
  } catch (error) {
    console.error('Reverse geocoding error:', error)
    return 'Address unavailable'
  }
}
