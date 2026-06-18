import { createContext, useContext, useMemo, useState } from 'react';

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

	const requestRide = (ride = null, location = null) => {
		if (ride !== null) {
			setCurrentRide(ride);
		}

		if (location !== null) {
			setCustomerLocation(location);
		}

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
	};

	const startRide = () => {
		setRideStatus(RIDE_STATUSES.IN_PROGRESS);
	};

	const completeRide = () => {
		setRideStatus(RIDE_STATUSES.COMPLETED);
	};

	const markPaid = () => {
		setRideStatus(RIDE_STATUSES.PAID);
	};

	const value = useMemo(
		() => ({
			currentRide,
			rideStatus,
			customerLocation,
			driverLocation,
			requestRide,
			acceptRide,
			startRide,
			completeRide,
			markPaid,
			setCurrentRide,
			setRideStatus,
			setCustomerLocation,
			setDriverLocation,
		}),
		[currentRide, rideStatus, customerLocation, driverLocation],
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
