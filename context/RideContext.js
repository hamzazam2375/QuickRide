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
	PAYMENT_PENDING: 'PaymentPending',
	PAID: 'Paid',
};

export function RideProvider({ children }) {
	const [currentRide, setCurrentRide] = useState(null);
	const [rideStatus, setRideStatus] = useState(RIDE_STATUSES.IDLE);
	const [customerLocation, setCustomerLocation] = useState(null);
	const [driverLocation, setDriverLocation] = useState(null);
	const [pickupLocation, setPickupLocation] = useState('');
	const [destination, setDestination] = useState('');
	const [destinationCoords, setDestinationCoords] = useState(null);
	const [userRole, setUserRole] = useState(null); // 'customer' | 'driver'

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

	const requestRide = (nextPickup, nextDestination, nextDestinationCoords = null) => {
		setPickupLocation(nextPickup);
		setDestination(nextDestination);
		if (nextDestinationCoords) {
			setDestinationCoords(nextDestinationCoords);
		}
		setCurrentRide({
			id: `ride-${Date.now()}`,
			pickupLocation: nextPickup,
			destination: nextDestination,
			destinationCoords: nextDestinationCoords,
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

	const initiatePayment = () => {
		setRideStatus(RIDE_STATUSES.PAYMENT_PENDING);
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
			destinationCoords,
			userRole,
			requestRide,
			acceptRide,
			startRide,
			completeRide,
			initiatePayment,
			markPaid,
			setCurrentRide,
			setRideStatus,
			setCustomerLocation,
			setDriverLocation,
			setPickupLocation,
			setDestination,
			setDestinationCoords,
			setUserRole,
		}),
		[currentRide, rideStatus, customerLocation, driverLocation, pickupLocation, destination, destinationCoords, userRole],
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
