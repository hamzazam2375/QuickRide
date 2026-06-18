import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import ActionButton from '../components/ActionButton';
import PlaceAutocomplete from '../components/PlaceAutocomplete';
import RideCard from '../components/RideCard';
import StatusBadge from '../components/StatusBadge';
import { useRide, RIDE_STATUSES } from '../context/RideContext';
import {
	DEFAULT_LOCATION_REGION,
	buildRegionFromCoordinates,
	startDeviceLocationUpdates,
} from '../services/location';
import { getRoute } from '../services/geocoding';

export default function CustomerDashboard({ navigation }) {
	const {
		rideStatus,
		customerLocation,
		setCustomerLocation,
		requestRide,
		currentRide,
		pickupLocation: storedPickupLocation,
		destination: storedDestination,
		destinationCoords: storedDestinationCoords,
		setDestinationCoords,
	} = useRide();

	const [locationPermission, setLocationPermission] = useState('loading');
	const [mapRegion, setMapRegion] = useState(DEFAULT_LOCATION_REGION);
	const [pickupLocation, setPickupLocation] = useState(storedPickupLocation || '');
	const [destination, setDestination] = useState(storedDestination || '');
	const [isPickupEdited, setIsPickupEdited] = useState(Boolean(storedPickupLocation));

	const [destCoords, setDestCoords] = useState(storedDestinationCoords || null);
	const [routeCoordinates, setRouteCoordinates] = useState([]);

	const mapRef = useRef(null);

	useEffect(() => {
		let isMounted = true;
		let subscription = null;

		const loadLocation = async () => {
			const locationSession = await startDeviceLocationUpdates((nextLocation) => {
				if (!isMounted) {
					return;
				}

				setCustomerLocation(nextLocation);
				// Only update region if there's no route (route has its own fitToCoordinates)
				if (!destCoords) {
					setMapRegion(buildRegionFromCoordinates(nextLocation));
				}
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
			if (!destCoords) {
				setMapRegion(buildRegionFromCoordinates(locationSession.location));
			}
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

	// Fetch route when both pickup and destination coordinates are available
	useEffect(() => {
		let cancelled = false;

		const fetchRoute = async () => {
			if (!customerLocation || !destCoords) {
				setRouteCoordinates([]);
				return;
			}

			try {
				const route = await getRoute(customerLocation, {
					latitude: destCoords.lat,
					longitude: destCoords.lon,
				});

				if (!cancelled && route.length > 0) {
					setRouteCoordinates(route);

					// Fit the map to show the full route
					if (mapRef.current) {
						const allPoints = [
							customerLocation,
							{ latitude: destCoords.lat, longitude: destCoords.lon },
							...route,
						];
						mapRef.current.fitToCoordinates(allPoints, {
							edgePadding: { top: 60, right: 60, bottom: 60, left: 60 },
							animated: true,
						});
					}
				}
			} catch {
				if (!cancelled) {
					setRouteCoordinates([]);
				}
			}
		};

		fetchRoute();

		return () => {
			cancelled = true;
		};
	}, [customerLocation, destCoords]);

	const coordinatesLabel = useMemo(() => {
		if (!customerLocation) {
			return 'Waiting for live coordinates...';
		}

		return `${customerLocation.latitude.toFixed(5)}, ${customerLocation.longitude.toFixed(5)}`;
	}, [customerLocation]);

	const isPickupValid = pickupLocation.trim().length > 0;
	const isDestinationValid = destination.trim().length > 0;
	const bookButtonDisabled = rideStatus !== RIDE_STATUSES.IDLE || !isPickupValid || !isDestinationValid;

	const handlePlaceSelected = useCallback(
		(place) => {
			const coords = { lat: place.lat, lon: place.lon };
			setDestCoords(coords);
			setDestinationCoords(coords);
		},
		[setDestinationCoords],
	);

	const handleDestinationChange = useCallback((text) => {
		setDestination(text);
		// Clear destination coordinates if user starts typing again
		if (text.length < 2) {
			setDestCoords(null);
			setRouteCoordinates([]);
		}
	}, []);

	const handleBookRide = () => {
		if (bookButtonDisabled) {
			return;
		}

		requestRide(pickupLocation.trim(), destination.trim(), destCoords);
		navigation.navigate('Checkout');
	};

	return (
		<SafeAreaView style={styles.safeArea}>
			<ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
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

				<RideCard title="Destination" subtitle="Search for a place to set as your destination.">
					<PlaceAutocomplete
						value={destination}
						onChangeText={handleDestinationChange}
						onPlaceSelected={handlePlaceSelected}
						placeholder="Search destination..."
					/>
					{destCoords ? (
						<View style={styles.selectedPlaceBadge}>
							<Text style={styles.selectedPlaceText}>
								📍 {destCoords.lat.toFixed(4)}, {destCoords.lon.toFixed(4)}
							</Text>
						</View>
					) : null}
				</RideCard>

				<RideCard
					title="Live map"
					subtitle={locationPermission === 'denied' ? 'Permission required' : routeCoordinates.length > 0 ? 'Route preview' : 'Customer location'}
				>
					<View style={styles.mapFrame}>
						<MapView ref={mapRef} style={styles.map} region={mapRegion}>
							{customerLocation ? (
								<Marker coordinate={customerLocation} title="You are here" description="Customer location" pinColor="#111827" />
							) : null}

							{destCoords ? (
								<Marker
									coordinate={{ latitude: destCoords.lat, longitude: destCoords.lon }}
									title="Destination"
									description={destination}
									pinColor="#DC2626"
								/>
							) : null}

							{routeCoordinates.length > 0 ? (
								<Polyline
									coordinates={routeCoordinates}
									strokeColor="#3B82F6"
									strokeWidth={4}
									lineDashPattern={[0]}
								/>
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
		height: 280,
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
	selectedPlaceBadge: {
		marginTop: 8,
		backgroundColor: '#EFF6FF',
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderRadius: 12,
	},
	selectedPlaceText: {
		fontSize: 13,
		color: '#1D4ED8',
		fontWeight: '600',
	},
});
