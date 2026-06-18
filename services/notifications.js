import { Alert, Linking, Platform } from 'react-native';

let Notifications = null;

try {
	Notifications = require('expo-notifications');
	Notifications.setNotificationHandler({
		handleNotification: async () => ({
			shouldShowAlert: true,
			shouldPlaySound: false,
			shouldSetBadge: false,
		}),
	});
} catch {
	Notifications = null;
}

/**
 * Request notification permissions.
 * Re-checks every time it is called (no caching) so that restarts
 * can detect when a user has changed their mind in Settings.
 * If the user permanently denied permissions, shows an Alert
 * prompting them to open Settings.
 */
async function ensureNotificationPermissions() {
	if (!Notifications) {
		return false;
	}

	const existingPermissions = await Notifications.getPermissionsAsync();

	if (existingPermissions.granted || existingPermissions.status === 'granted') {
		return true;
	}

	const requestedPermissions = await Notifications.requestPermissionsAsync();

	if (requestedPermissions.granted || requestedPermissions.status === 'granted') {
		return true;
	}

	// Cannot ask again — prompt user to open Settings.
	if (!requestedPermissions.canAskAgain) {
		Alert.alert(
			'Notification Permission Required',
			'QuickRide needs notifications to keep you updated about ride status changes. Please enable notifications in Settings.',
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

export async function configureNotifications() {
	return ensureNotificationPermissions();
}

async function sendLocalNotification(title, body) {
	const permissionGranted = await ensureNotificationPermissions();

	if (!permissionGranted) {
		return false;
	}

	await Notifications.scheduleNotificationAsync({
		content: {
			title,
			body,
		},
		trigger: Platform.OS === 'android'
			? { type: 'timeInterval', seconds: 1, repeats: false }
			: null,
	});

	return true;
}

export async function sendRideAcceptedNotification() {
	return sendLocalNotification('Ride accepted', 'Your ride has been accepted and is being prepared.');
}

export async function sendRideStartedNotification() {
	return sendLocalNotification('Ride started', 'Your driver has started the ride.');
}

export async function sendRideCompletedNotification() {
	return sendLocalNotification('Ride completed', 'Your ride has been completed successfully.');
}

export async function sendPaymentSuccessNotification() {
	return sendLocalNotification('Payment successful', 'Your payment was processed successfully.');
}
