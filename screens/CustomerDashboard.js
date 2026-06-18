import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import ActionButton from '../components/ActionButton';
import RideCard from '../components/RideCard';
import StatusBadge from '../components/StatusBadge';
import { useRide, RIDE_STATUSES } from '../context/RideContext';
import {
	DEFAULT_LOCATION_REGION,
	buildRegionFromCoordinates,
	startDeviceLocationUpdates,
} from '../services/location';

export default function CustomerDashboard({ navigation }) {
	const { rideStatus, customerLocation, setCustomerLocation, requestRide, currentRide, pickupLocation: storedPickupLocation, destination: storedDestination } = useRide();
	const [locationPermission, setLocationPermission] = useState('loading');
	const [mapRegion, setMapRegion] = useState(DEFAULT_LOCATION_REGION);
	const [pickupLocation, setPickupLocation] = useState(storedPickupLocation || '');
	const [destination, setDestination] = useState(storedDestination || '');
	const [isPickupEdited, setIsPickupEdited] = useState(Boolean(storedPickupLocation));

	useEffect(() => {
		let isMounted = true;
		let subscription = null;

		const loadLocation = async () => {
			const locationSession = await startDeviceLocationUpdates((nextLocation) => {
				if (!isMounted) {
					return;
				}

				setCustomerLocation(nextLocation);
				setMapRegion(buildRegionFromCoordinates(nextLocation));
			});

			if (!isMounted) {
				if (locationSession.subscription) {
					locationSession.subscription.remove();
				}
				return;
			}

			if (!locationSession.permissionGranted) {
				setLocationPermission('denied');
				return;
			}

			setLocationPermission('granted');
			setCustomerLocation(locationSession.location);
			setMapRegion(buildRegionFromCoordinates(locationSession.location));
			subscription = locationSession.subscription;
		};

		loadLocation();

		return () => {
			isMounted = false;
			if (subscription) {
				subscription.remove();
			}
		};
	}, [setCustomerLocation]);

	useEffect(() => {
		if (!customerLocation || isPickupEdited) {
			return;
		}

		const coordinatesValue = `${customerLocation.latitude.toFixed(5)}, ${customerLocation.longitude.toFixed(5)}`;
		setPickupLocation(coordinatesValue);
	}, [customerLocation, isPickupEdited]);

	const coordinatesLabel = useMemo(() => {
		if (!customerLocation) {
			return 'Waiting for live coordinates...';
		}

		return `${customerLocation.latitude.toFixed(5)}, ${customerLocation.longitude.toFixed(5)}`;
	}, [customerLocation]);

	const isPickupValid = pickupLocation.trim().length > 0;
	const isDestinationValid = destination.trim().length > 0;
	const bookButtonDisabled = rideStatus !== RIDE_STATUSES.IDLE || !isPickupValid || !isDestinationValid;

	const handleBookRide = () => {
		if (bookButtonDisabled) {
			return;
		}

		requestRide(pickupLocation.trim(), destination.trim());
		navigation.navigate('Checkout');
	};

	return (
		<SafeAreaView style={styles.safeArea}>
			<ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
				<View style={styles.headerCard}>
					<Text style={styles.title}>Customer Dashboard</Text>
					<Text style={styles.subtitle}>Track your position, review your ride state, and start a new booking.</Text>
				</View>

					<RideCard
						title="Current ride status"
						rightElement={<StatusBadge status={rideStatus} />}
					>
						<Text style={styles.helperText}>
							{currentRide ? 'A ride request is being tracked globally.' : 'No ride has been requested yet.'}
						</Text>
					</RideCard>

					<RideCard title="Pickup Location" subtitle="Automatically populated from your current coordinates when available.">
					<TextInput
						value={pickupLocation}
						onChangeText={(value) => {
							setPickupLocation(value);
							setIsPickupEdited(true);
						}}
						placeholder="Use current coordinates or edit pickup"
						placeholderTextColor="#94A3B8"
						style={styles.input}
					/>
				</RideCard>

				<RideCard title="Destination" subtitle="Destination field is required to book the ride.">
					<TextInput
						value={destination}
						onChangeText={setDestination}
						placeholder="Enter destination"
						placeholderTextColor="#94A3B8"
						style={styles.input}
					/>
				</RideCard>

				<RideCard
					title="Live map"
					subtitle={locationPermission === 'denied' ? 'Permission required' : 'Customer location'}
				>
					<View style={styles.mapFrame}>
						<MapView style={styles.map} region={mapRegion}>
							{customerLocation ? (
								<Marker coordinate={customerLocation} title="You are here" description="Customer location" />
							) : null}
						</MapView>
						{locationPermission === 'denied' ? (
							<View style={styles.permissionOverlay} pointerEvents="none">
								<View style={styles.permissionCard}>
									<Text style={styles.permissionTitle}>Location access is off</Text>
									<Text style={styles.permissionText}>
										Enable location permission to preview your position on the map.
									</Text>
								</View>
							</View>
						) : null}
					</View>
				</RideCard>

				<RideCard title="Current coordinates" subtitle={locationPermission === 'loading' ? 'Loading' : 'Live'}>
					<Text style={styles.coordinates}>{coordinatesLabel}</Text>
				</RideCard>

				<RideCard title="Booking details" subtitle="Pickup and destination are required to book a ride.">
					<Text style={styles.helperText}>Edit the pickup if needed, then continue to checkout.</Text>
				</RideCard>

				<ActionButton
					label={bookButtonDisabled ? 'Ride already requested' : 'Book Ride'}
					onPress={handleBookRide}
					disabled={bookButtonDisabled}
				/>
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: '#F7F9FC',
	},
	container: {
		flexGrow: 1,
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
	helperText: {
		fontSize: 14,
		lineHeight: 22,
		color: '#64748B',
	},
	mapFrame: {
		marginTop: 10,
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
	permissionOverlay: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: 'rgba(247, 249, 252, 0.78)',
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
	input: {
		marginTop: 10,
		borderWidth: 1,
		borderColor: '#E2E8F0',
		borderRadius: 16,
		paddingHorizontal: 14,
		paddingVertical: 13,
		fontSize: 15,
		color: '#0F172A',
		backgroundColor: '#F8FAFC',
	},
	coordinates: {
		fontSize: 15,
		lineHeight: 22,
		fontWeight: '600',
		color: '#0F172A',
	},
});
