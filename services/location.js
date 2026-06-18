import * as Location from 'expo-location';
import { Alert, Linking } from 'react-native';

export const DEFAULT_LOCATION_REGION = {
	latitude: 37.78825,
	longitude: -122.4324,
	latitudeDelta: 0.02,
	longitudeDelta: 0.02,
};

/**
 * Request foreground location permission.
 * If the user previously denied the permission, show an alert prompting
 * them to open device Settings so they can grant it manually.
 * This runs on every mount so denied permissions are re-prompted each restart.
 */
export async function requestForegroundLocationPermission() {
	const existing = await Location.getForegroundPermissionsAsync();

	// Already granted — nothing to do.
	if (existing.status === 'granted') {
		return true;
	}

	// Try requesting normally (works on first ask or when "Ask Every Time" is set).
	const requested = await Location.requestForegroundPermissionsAsync();

	if (requested.status === 'granted') {
		return true;
	}

	// Permission denied and cannot ask again — prompt user to open Settings.
	if (!requested.canAskAgain) {
		Alert.alert(
			'Location Permission Required',
			'QuickRide needs access to your location to show your position on the map and calculate routes. Please enable location access in Settings.',
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Open Settings',
					onPress: () => Linking.openSettings(),
				},
			],
		);
	}

	return false;
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
