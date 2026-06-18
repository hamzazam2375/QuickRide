import { useEffect, createContext, useContext, useMemo, useState } from 'react';
import {
	configureNotifications,
	sendPaymentSuccessNotification,
	sendRideAcceptedNotification,
	sendRideCompletedNotification,
	sendRideStartedNotification,
} from '../services/notifications';

const RideContext = createContext(null);

export const RIDE_STATUSES = {
	IDLE: 'Idle',
	REQUESTED: 'Requested',
	ACCEPTED: 'Accepted',
	ARRIVING: 'Arriving',
	IN_PROGRESS: 'InProgress',
	COMPLETED: 'Completed',
	PAID: 'Paid',
};

export function RideProvider({ children }) {
	const [currentRide, setCurrentRide] = useState(null);
	const [rideStatus, setRideStatus] = useState(RIDE_STATUSES.IDLE);
	const [customerLocation, setCustomerLocation] = useState(null);
	const [driverLocation, setDriverLocation] = useState(null);
	const [pickupLocation, setPickupLocation] = useState('');
	const [destination, setDestination] = useState('');

	useEffect(() => {
		let isMounted = true;

		const prepareNotifications = async () => {
			if (!isMounted) {
				return;
			}

			// Request notification permissions once when app state provider mounts.
			await configureNotifications().catch(() => undefined);
		};

		prepareNotifications();

		return () => {
			isMounted = false;
		};
	}, []);

	const requestRide = (nextPickup, nextDestination) => {
		setPickupLocation(nextPickup);
		setDestination(nextDestination);
		setCurrentRide({
			id: `ride-${Date.now()}`,
			pickupLocation: nextPickup,
			destination: nextDestination,
		});
		setRideStatus(RIDE_STATUSES.REQUESTED);
	};

	const acceptRide = (ride = null, location = null) => {
		if (ride !== null) {
			setCurrentRide(ride);
		}

		if (location !== null) {
			setDriverLocation(location);
		}

		setRideStatus(RIDE_STATUSES.ACCEPTED);
		sendRideAcceptedNotification().catch(() => undefined);
	};

	const startRide = () => {
		setRideStatus(RIDE_STATUSES.IN_PROGRESS);
		sendRideStartedNotification().catch(() => undefined);
	};

	const completeRide = () => {
		setRideStatus(RIDE_STATUSES.COMPLETED);
		sendRideCompletedNotification().catch(() => undefined);
	};

	const markPaid = () => {
		setRideStatus(RIDE_STATUSES.PAID);
		sendPaymentSuccessNotification().catch(() => undefined);
	};

	const value = useMemo(
		() => ({
			currentRide,
			rideStatus,
			customerLocation,
			driverLocation,
			pickupLocation,
			destination,
			requestRide,
			acceptRide,
			startRide,
			completeRide,
			markPaid,
			setCurrentRide,
			setRideStatus,
			setCustomerLocation,
			setDriverLocation,
			setPickupLocation,
			setDestination,
		}),
		[currentRide, rideStatus, customerLocation, driverLocation, pickupLocation, destination],
	);

	return <RideContext.Provider value={value}>{children}</RideContext.Provider>;
}

export function useRide() {
	const context = useContext(RideContext);

	if (!context) {
		throw new Error('useRide must be used within a RideProvider');
	}

	return context;
}
