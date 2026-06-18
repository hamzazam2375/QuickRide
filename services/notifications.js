import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
	handleNotification: async () => ({
		shouldShowAlert: true,
		shouldPlaySound: false,
		shouldSetBadge: false,
	}),
});

let permissionPromise = null;

async function ensureNotificationPermissions() {
	if (!permissionPromise) {
		permissionPromise = (async () => {
			const existingPermissions = await Notifications.getPermissionsAsync();

			if (existingPermissions.granted || existingPermissions.status === 'granted') {
				return true;
			}

			const requestedPermissions = await Notifications.requestPermissionsAsync();
			return requestedPermissions.granted || requestedPermissions.status === 'granted';
		})();
	}

	return permissionPromise;
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
		trigger: null,
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
