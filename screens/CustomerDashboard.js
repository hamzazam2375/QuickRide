import { useEffect, useMemo, useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { useRide, RIDE_STATUSES } from '../context/RideContext';

const DEFAULT_REGION = {
	latitude: 37.78825,
	longitude: -122.4324,
	latitudeDelta: 0.02,
	longitudeDelta: 0.02,
};

const STATUS_STYLES = {
	[RIDE_STATUSES.IDLE]: { backgroundColor: '#E2E8F0', color: '#0F172A' },
	[RIDE_STATUSES.REQUESTED]: { backgroundColor: '#FEF3C7', color: '#92400E' },
	[RIDE_STATUSES.ACCEPTED]: { backgroundColor: '#DBEAFE', color: '#1D4ED8' },
	[RIDE_STATUSES.ARRIVING]: { backgroundColor: '#EDE9FE', color: '#6D28D9' },
	[RIDE_STATUSES.IN_PROGRESS]: { backgroundColor: '#DCFCE7', color: '#166534' },
	[RIDE_STATUSES.COMPLETED]: { backgroundColor: '#D1FAE5', color: '#065F46' },
	[RIDE_STATUSES.PAID]: { backgroundColor: '#E0E7FF', color: '#3730A3' },
};

export default function CustomerDashboard({ navigation }) {
	const { rideStatus, customerLocation, setCustomerLocation, requestRide, currentRide } = useRide();
	const [locationPermission, setLocationPermission] = useState('loading');
	const [mapRegion, setMapRegion] = useState(DEFAULT_REGION);

	useEffect(() => {
		let isMounted = true;

		const loadLocation = async () => {
			const permission = await Location.requestForegroundPermissionsAsync();

			if (!isMounted) {
				return;
			}

			if (permission.status !== 'granted') {
				setLocationPermission('denied');
				return;
			}

			setLocationPermission('granted');
			const position = await Location.getCurrentPositionAsync({
				accuracy: Location.Accuracy.Balanced,
			});

			if (!isMounted) {
				return;
			}

			const nextLocation = {
				latitude: position.coords.latitude,
				longitude: position.coords.longitude,
			};

			setCustomerLocation(nextLocation);
			setMapRegion({
				...nextLocation,
				latitudeDelta: 0.02,
				longitudeDelta: 0.02,
			});
		};

		loadLocation();

		return () => {
			isMounted = false;
		};
	}, [setCustomerLocation]);

	const statusStyle = STATUS_STYLES[rideStatus] ?? STATUS_STYLES[RIDE_STATUSES.IDLE];
	const coordinatesLabel = useMemo(() => {
		if (!customerLocation) {
			return 'Waiting for live coordinates...';
		}

		return `${customerLocation.latitude.toFixed(5)}, ${customerLocation.longitude.toFixed(5)}`;
	}, [customerLocation]);

	const handleBookRide = () => {
		if (rideStatus !== RIDE_STATUSES.IDLE) {
			return;
		}

		requestRide(
			{
				id: `ride-${Date.now()}`,
				createdAt: Date.now(),
				type: 'customer-request',
			},
			customerLocation,
		);
		navigation.navigate('Checkout');
	};

	const bookButtonDisabled = rideStatus !== RIDE_STATUSES.IDLE;

	return (
		<SafeAreaView style={styles.safeArea}>
			<View style={styles.container}>
				<View style={styles.headerCard}>
					<Text style={styles.title}>Customer Dashboard</Text>
					<Text style={styles.subtitle}>Track your position, review your ride state, and start a new booking.</Text>
				</View>

				<View style={styles.card}>
					<View style={styles.rowBetween}>
						<Text style={styles.sectionLabel}>Current ride status</Text>
						<View style={[styles.badge, { backgroundColor: statusStyle.backgroundColor }]}>
							<Text style={[styles.badgeText, { color: statusStyle.color }]}>{rideStatus}</Text>
						</View>
					</View>
					<Text style={styles.helperText}>
						{currentRide ? 'A ride request is being tracked globally.' : 'No ride has been requested yet.'}
					</Text>
				</View>

				<View style={styles.mapCard}>
					<View style={styles.rowBetween}>
						<Text style={styles.sectionLabel}>Live map</Text>
						<Text style={styles.mapHint}>
							{locationPermission === 'denied' ? 'Permission required' : 'Customer location'}
						</Text>
					</View>
					<View style={styles.mapFrame}>
						{locationPermission === 'denied' ? (
							<View style={styles.permissionCard}>
								<Text style={styles.permissionTitle}>Location access is off</Text>
								<Text style={styles.permissionText}>
									Enable location permission to preview your position on the map.
								</Text>
							</View>
						) : (
							<MapView style={styles.map} region={mapRegion}>
								{customerLocation ? (
									<Marker coordinate={customerLocation} title="You are here" />
								) : null}
							</MapView>
						)}
					</View>
				</View>

				<View style={styles.card}>
					<View style={styles.rowBetween}>
						<Text style={styles.sectionLabel}>Current coordinates</Text>
						<Text style={styles.mapHint}>
							{locationPermission === 'loading' ? 'Loading' : 'Live'}
						</Text>
					</View>
					<Text style={styles.coordinates}>{coordinatesLabel}</Text>
				</View>

				<Pressable
					onPress={handleBookRide}
					disabled={bookButtonDisabled}
					style={({ pressed }) => [
						styles.bookButton,
						bookButtonDisabled && styles.bookButtonDisabled,
						pressed && !bookButtonDisabled && styles.bookButtonPressed,
					]}
				>
					<Text style={styles.bookButtonText}>
						{bookButtonDisabled ? 'Ride already requested' : 'Book Ride'}
					</Text>
				</Pressable>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: '#F7F9FC',
	},
	container: {
		flex: 1,
		paddingHorizontal: 20,
		paddingTop: 16,
		paddingBottom: 24,
		gap: 16,
	},
	headerCard: {
		paddingHorizontal: 4,
	},
	title: {
		fontSize: 32,
		lineHeight: 38,
		fontWeight: '800',
		color: '#0F172A',
		letterSpacing: -0.8,
	},
	subtitle: {
		marginTop: 10,
		fontSize: 16,
		lineHeight: 24,
		color: '#64748B',
	},
	card: {
		backgroundColor: '#FFFFFF',
		borderRadius: 22,
		padding: 16,
		shadowColor: '#0F172A',
		shadowOpacity: 0.06,
		shadowRadius: 18,
		shadowOffset: { width: 0, height: 10 },
		elevation: 3,
	},
	mapCard: {
		backgroundColor: '#FFFFFF',
		borderRadius: 22,
		padding: 16,
		shadowColor: '#0F172A',
		shadowOpacity: 0.06,
		shadowRadius: 18,
		shadowOffset: { width: 0, height: 10 },
		elevation: 3,
	},
	rowBetween: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		gap: 12,
	},
	sectionLabel: {
		fontSize: 16,
		fontWeight: '700',
		color: '#0F172A',
	},
	badge: {
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderRadius: 999,
	},
	badgeText: {
		fontSize: 13,
		fontWeight: '700',
	},
	helperText: {
		marginTop: 10,
		fontSize: 14,
		lineHeight: 22,
		color: '#64748B',
	},
	mapHint: {
		fontSize: 13,
		fontWeight: '600',
		color: '#94A3B8',
	},
	mapFrame: {
		marginTop: 14,
		height: 230,
		borderRadius: 18,
		overflow: 'hidden',
		backgroundColor: '#E2E8F0',
	},
	map: {
		flex: 1,
	},
	permissionCard: {
		flex: 1,
		padding: 18,
		justifyContent: 'center',
		alignItems: 'center',
	},
	permissionTitle: {
		fontSize: 16,
		fontWeight: '700',
		color: '#0F172A',
		marginBottom: 8,
	},
	permissionText: {
		fontSize: 14,
		lineHeight: 22,
		color: '#64748B',
		textAlign: 'center',
	},
	coordinates: {
		marginTop: 10,
		fontSize: 15,
		lineHeight: 22,
		fontWeight: '600',
		color: '#0F172A',
	},
	bookButton: {
		backgroundColor: '#111827',
		paddingVertical: 16,
		borderRadius: 18,
		alignItems: 'center',
	},
	bookButtonDisabled: {
		opacity: 0.55,
	},
	bookButtonPressed: {
		opacity: 0.9,
		transform: [{ scale: 0.99 }],
	},
	bookButtonText: {
		fontSize: 16,
		fontWeight: '700',
		color: '#FFFFFF',
	},
});
