import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import ActionButton from '../components/ActionButton';
import RideCard from '../components/RideCard';
import StatusBadge from '../components/StatusBadge';
import { RIDE_STATUSES, useRide } from '../context/RideContext';
import {
	DEFAULT_LOCATION_REGION,
	buildRegionFromCoordinates,
	startDeviceLocationUpdates,
} from '../services/location';
import { getRoute } from '../services/geocoding';

export default function DriverDashboard({ navigation }) {
	const {
		rideStatus,
		driverLocation,
		setDriverLocation,
		currentRide,
		acceptRide,
		startRide,
		completeRide,
		resetRide,
		destination,
		pickupLocation,
		destinationCoords,
		customerLocation,
	} = useRide();

	const [locationPermission, setLocationPermission] = useState('loading');
	const [mapRegion, setMapRegion] = useState(DEFAULT_LOCATION_REGION);
	const [routeCoordinates, setRouteCoordinates] = useState([]);
	const mapRef = useMemo(() => ({ current: null }), []);

	useEffect(() => {
		let isMounted = true;
		let subscription = null;

		const loadLocation = async () => {
			const locationSession = await startDeviceLocationUpdates((nextLocation) => {
				if (!isMounted) {
					return;
				}

				setDriverLocation(nextLocation);
				if (!destinationCoords) {
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
			setDriverLocation(locationSession.location);
			if (!destinationCoords) {
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
	}, [setDriverLocation]);

	// Fetch route on driver map when ride has a destination
	useEffect(() => {
		let cancelled = false;

		const fetchRoute = async () => {
			if (!driverLocation || !destinationCoords) {
				setRouteCoordinates([]);
				return;
			}

			try {
				const route = await getRoute(driverLocation, {
					latitude: destinationCoords.lat,
					longitude: destinationCoords.lon,
				});

				if (!cancelled && route.length > 0) {
					setRouteCoordinates(route);

					if (mapRef.current) {
						const allPoints = [
							driverLocation,
							{ latitude: destinationCoords.lat, longitude: destinationCoords.lon },
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
	}, [driverLocation, destinationCoords]);

	const coordinatesLabel = useMemo(() => {
		if (!driverLocation) {
			return 'Waiting for live coordinates...';
		}

		return `${driverLocation.latitude.toFixed(5)}, ${driverLocation.longitude.toFixed(5)}`;
	}, [driverLocation]);

	const handleAcceptRide = () => {
		acceptRide(currentRide ?? { id: `ride-${Date.now()}` }, driverLocation);
	};

	const handleStartRide = () => {
		startRide();
	};

	const handleCompleteRide = () => {
		completeRide();
		navigation.navigate('Checkout');
	};

	const actionButton =
		rideStatus === RIDE_STATUSES.REQUESTED
			? { label: 'Accept Ride', onPress: handleAcceptRide }
			: rideStatus === RIDE_STATUSES.ACCEPTED
				? { label: 'Start Ride', onPress: handleStartRide }
				: rideStatus === RIDE_STATUSES.IN_PROGRESS
					? { label: 'Complete Ride', onPress: handleCompleteRide }
					: null;

	const hasRideInfo = rideStatus !== RIDE_STATUSES.IDLE && (pickupLocation || destination);
	const showCheckout = rideStatus !== RIDE_STATUSES.IDLE && rideStatus !== RIDE_STATUSES.PAID;

	return (
		<SafeAreaView style={styles.safeArea}>
			<ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
				<View style={styles.headerCard}>
					<Text style={styles.title}>Driver Dashboard</Text>
					<View style={styles.subtitleRow}>
						<Text style={styles.subtitle}>Monitor your position and manage the current ride from one place.</Text>
						{showCheckout ? (
							<TouchableOpacity style={styles.checkoutBtn} onPress={() => navigation.navigate('Checkout')}>
								<Text style={styles.checkoutBtnText}>Checkout →</Text>
							</TouchableOpacity>
						) : null}
					</View>
				</View>

				<RideCard title="Current ride status" rightElement={<StatusBadge status={rideStatus} />}>
					<Text style={styles.helperText}>
						{currentRide ? 'A ride is available for driver action.' : 'No active ride is loaded yet.'}
					</Text>
				</RideCard>

				{hasRideInfo ? (
					<RideCard title="Ride details" subtitle="Customer's pickup and destination">
						{pickupLocation ? (
							<View style={styles.detailBlock}>
								<Text style={styles.detailLabel}>PICKUP</Text>
								<Text style={styles.detailValue} numberOfLines={2}>{pickupLocation}</Text>
							</View>
						) : null}
						{destination ? (
							<View style={styles.detailBlock}>
								<Text style={styles.detailLabel}>DESTINATION</Text>
								<Text style={styles.detailValue} numberOfLines={2}>{destination}</Text>
							</View>
						) : null}
						{destinationCoords ? (
							<View style={styles.coordsBadge}>
								<Text style={styles.coordsBadgeText}>
									📍 {destinationCoords.lat.toFixed(4)}, {destinationCoords.lon.toFixed(4)}
								</Text>
							</View>
						) : null}
					</RideCard>
				) : null}

				<RideCard
					title="Live map"
					subtitle={locationPermission === 'denied' ? 'Permission required' : routeCoordinates.length > 0 ? 'Route to destination' : 'Driver location'}
				>
					<View style={styles.mapFrame}>
						<MapView
							ref={(ref) => { mapRef.current = ref; }}
							style={styles.map}
							region={mapRegion}
						>
							{driverLocation ? (
								<Marker coordinate={driverLocation} title="Driver location" description="Driver position" pinColor="#111827" />
							) : null}

							{destinationCoords ? (
								<Marker
									coordinate={{ latitude: destinationCoords.lat, longitude: destinationCoords.lon }}
									title="Destination"
									description={destination}
									pinColor="#DC2626"
								/>
							) : null}

							{customerLocation ? (
								<Marker
									coordinate={customerLocation}
									title="Customer"
									description="Pickup location"
									pinColor="#3B82F6"
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

				{actionButton ? (
					<ActionButton label={actionButton.label} onPress={actionButton.onPress} />
				) : (
					<RideCard title="Ride activity">
						<Text style={styles.idleText}>Waiting for ride activity.</Text>
					</RideCard>
				)}
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
		paddingTop: 4,
		paddingBottom: 24,
		gap: 16,
	},
	headerCard: {
		paddingHorizontal: 4,
	},
	subtitleRow: {
		flexDirection: 'row',
		alignItems: 'center',
		marginTop: 10,
		gap: 10,
	},
	checkoutBtn: {
		backgroundColor: '#111827',
		paddingHorizontal: 14,
		paddingVertical: 8,
		borderRadius: 20,
	},
	checkoutBtnText: {
		fontSize: 13,
		fontWeight: '700',
		color: '#FFFFFF',
	},
	title: {
		fontSize: 32,
		lineHeight: 38,
		fontWeight: '800',
		color: '#0F172A',
		letterSpacing: -0.8,
	},
	subtitle: {
		flex: 1,
		fontSize: 16,
		lineHeight: 24,
		color: '#64748B',
	},
	helperText: {
		fontSize: 14,
		lineHeight: 22,
		color: '#64748B',
	},
	detailBlock: {
		marginTop: 12,
	},
	detailLabel: {
		fontSize: 11,
		fontWeight: '700',
		color: '#94A3B8',
		textTransform: 'uppercase',
		letterSpacing: 0.8,
		marginBottom: 4,
	},
	detailValue: {
		fontSize: 15,
		lineHeight: 22,
		color: '#0F172A',
		fontWeight: '500',
	},
	coordsBadge: {
		marginTop: 10,
		backgroundColor: '#EFF6FF',
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderRadius: 12,
	},
	coordsBadgeText: {
		fontSize: 13,
		color: '#1D4ED8',
		fontWeight: '600',
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
	coordinates: {
		fontSize: 15,
		lineHeight: 22,
		fontWeight: '600',
		color: '#0F172A',
	},
	idleText: {
		fontSize: 14,
		fontWeight: '600',
		color: '#64748B',
	},
});
