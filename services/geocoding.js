/**
 * Geocoding and routing utilities using free OpenStreetMap services.
 * - Nominatim for place search / autocomplete
 * - OSRM for driving route polylines
 */

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';
const OSRM_BASE = 'https://router.project-osrm.org';

const REQUEST_HEADERS = {
	'User-Agent': 'QuickRide/1.0 (student-project)',
	Accept: 'application/json',
};

/**
 * Search for places matching the given query text.
 * Returns at most `limit` results.
 */
export async function searchPlaces(query, limit = 5) {
	if (!query || query.trim().length < 2) {
		return [];
	}

	const url = `${NOMINATIM_BASE}/search?q=${encodeURIComponent(query.trim())}&format=json&addressdetails=1&limit=${limit}`;

	const response = await fetch(url, { headers: REQUEST_HEADERS });

	if (!response.ok) {
		return [];
	}

	const data = await response.json();

	return data.map((item) => ({
		displayName: item.display_name,
		lat: parseFloat(item.lat),
		lon: parseFloat(item.lon),
	}));
}

/**
 * Fetch a driving route between two coordinate pairs.
 * Returns an array of { latitude, longitude } points for the polyline.
 */
export async function getRoute(origin, destination) {
	if (!origin || !destination) {
		return [];
	}

	// OSRM expects lon,lat order
	const url = `${OSRM_BASE}/route/v1/driving/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}?overview=full&geometries=polyline`;

	const response = await fetch(url, { headers: REQUEST_HEADERS });

	if (!response.ok) {
		return [];
	}

	const data = await response.json();

	if (!data.routes || data.routes.length === 0) {
		return [];
	}

	return decodePolyline(data.routes[0].geometry);
}

/**
 * Decode a Google-style encoded polyline string into coordinate points.
 * Used to parse OSRM geometry responses.
 */
function decodePolyline(encoded) {
	const points = [];
	let index = 0;
	let lat = 0;
	let lng = 0;

	while (index < encoded.length) {
		let shift = 0;
		let result = 0;
		let byte;

		do {
			byte = encoded.charCodeAt(index++) - 63;
			result |= (byte & 0x1f) << shift;
			shift += 5;
		} while (byte >= 0x20);

		lat += result & 1 ? ~(result >> 1) : result >> 1;

		shift = 0;
		result = 0;

		do {
			byte = encoded.charCodeAt(index++) - 63;
			result |= (byte & 0x1f) << shift;
			shift += 5;
		} while (byte >= 0x20);

		lng += result & 1 ? ~(result >> 1) : result >> 1;

		points.push({
			latitude: lat / 1e5,
			longitude: lng / 1e5,
		});
	}

	return points;
}
