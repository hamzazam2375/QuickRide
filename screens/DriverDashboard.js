import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
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

export default function DriverDashboard({ navigation }) {
	const { rideStatus, driverLocation, setDriverLocation, currentRide, acceptRide, startRide, completeRide } = useRide();
	const [locationPermission, setLocationPermission] = useState('loading');
	const [mapRegion, setMapRegion] = useState(DEFAULT_LOCATION_REGION);

	useEffect(() => {
		let isMounted = true;
		let subscription = null;

		const loadLocation = async () => {
			const locationSession = await startDeviceLocationUpdates((nextLocation) => {
				if (!isMounted) {
					return;
				}

				setDriverLocation(nextLocation);
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
			setDriverLocation(locationSession.location);
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
	}, [setDriverLocation]);

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

	return (
		<SafeAreaView style={styles.safeArea}>
			<ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
				<View style={styles.headerCard}>
					<Text style={styles.title}>Driver Dashboard</Text>
					<Text style={styles.subtitle}>Monitor your position and manage the current ride from one place.</Text>
				</View>

				<RideCard title="Current ride status" rightElement={<StatusBadge status={rideStatus} />}>
					<Text style={styles.helperText}>
						{currentRide ? 'A ride is available for driver action.' : 'No active ride is loaded yet.'}
					</Text>
				</RideCard>

				<RideCard
					title="Live map"
					subtitle={locationPermission === 'denied' ? 'Permission required' : 'Driver location'}
				>
					<View style={styles.mapFrame}>
						<MapView style={styles.map} region={mapRegion}>
							{driverLocation ? (
								<Marker coordinate={driverLocation} title="Driver location" description="Driver position" />
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
