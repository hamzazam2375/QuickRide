import * as Location from 'expo-location';

export const DEFAULT_LOCATION_REGION = {
	latitude: 37.78825,
	longitude: -122.4324,
	latitudeDelta: 0.02,
	longitudeDelta: 0.02,
};

export async function requestForegroundLocationPermission() {
	const permission = await Location.requestForegroundPermissionsAsync();

	return permission.status === 'granted';
}

export async function getCurrentDeviceCoordinates() {
	const position = await Location.getCurrentPositionAsync({
		accuracy: Location.Accuracy.Balanced,
	});

	return {
		latitude: position.coords.latitude,
		longitude: position.coords.longitude,
	};
}

export async function startDeviceLocationUpdates(onLocationUpdate) {
	const hasPermission = await requestForegroundLocationPermission();

	// Return a predictable empty session when location permission is denied.
	if (!hasPermission) {
		return {
			permissionGranted: false,
			location: null,
			subscription: null,
		};
	}

	const location = await getCurrentDeviceCoordinates();
	let subscription = null;

	if (typeof onLocationUpdate === 'function') {
		// Keep emitting driver/customer position updates while the screen is mounted.
		subscription = await Location.watchPositionAsync(
			{
				accuracy: Location.Accuracy.Balanced,
				timeInterval: 4000,
				distanceInterval: 5,
			},
			(position) => {
				onLocationUpdate({
					latitude: position.coords.latitude,
					longitude: position.coords.longitude,
				});
			},
		);
	}

	return {
		permissionGranted: true,
		location,
		subscription,
	};
}

export function buildRegionFromCoordinates(coordinates) {
	if (!coordinates) {
		return DEFAULT_LOCATION_REGION;
	}

	return {
		latitude: coordinates.latitude,
		longitude: coordinates.longitude,
		latitudeDelta: 0.02,
		longitudeDelta: 0.02,
	};
}
