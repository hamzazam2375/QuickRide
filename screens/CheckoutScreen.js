import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import ActionButton from '../components/ActionButton';
import RideCard from '../components/RideCard';
import StatusBadge from '../components/StatusBadge';
import { useRide, RIDE_STATUSES } from '../context/RideContext';
import { SafeAreaView } from 'react-native-safe-area-context';

const FLOW_STEPS = [
	RIDE_STATUSES.REQUESTED,
	RIDE_STATUSES.ACCEPTED,
	RIDE_STATUSES.ARRIVING,
	RIDE_STATUSES.IN_PROGRESS,
	RIDE_STATUSES.COMPLETED,
	RIDE_STATUSES.PAYMENT_PENDING,
	RIDE_STATUSES.PAID,
];

const MOCK_FARE = 18.75;

export default function CheckoutScreen({ navigation }) {
	const { currentRide, rideStatus, pickupLocation, destination, markPaid, initiatePayment, userRole } = useRide();
	const [paymentCompleted, setPaymentCompleted] = useState(rideStatus === RIDE_STATUSES.PAID);

	const rideSummary = useMemo(() => {
		if (!currentRide && !pickupLocation && !destination) {
			return {
				pickup: 'Not set',
				destination: 'Not set',
			};
		}

		return {
			pickup: pickupLocation || currentRide?.pickupLocation || 'Not set',
			destination: destination || currentRide?.destination || 'Not set',
		};
	}, [currentRide, pickupLocation, destination]);

	const currentStepIndex = FLOW_STEPS.indexOf(rideStatus);

	// Customer: can press PAY NOW when ride is Completed
	const canCustomerPay = userRole === 'customer' && rideStatus === RIDE_STATUSES.COMPLETED;
	// Customer sees "waiting" when PaymentPending
	const isWaitingForDriver = userRole === 'customer' && rideStatus === RIDE_STATUSES.PAYMENT_PENDING;
	// Driver: can complete payment when PaymentPending
	const canDriverCompletePay = userRole === 'driver' && rideStatus === RIDE_STATUSES.PAYMENT_PENDING;

	const handleCustomerPay = () => {
		initiatePayment();
	};

	const handleDriverCompletePay = () => {
		markPaid();
		setPaymentCompleted(true);
	};

	const handleReturnToDashboard = () => {
		navigation.goBack();
	};

	return (
		<SafeAreaView style={styles.safeArea}>
			<ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
				<View style={styles.headerCard}>
					<Text style={styles.title}>Checkout</Text>
					<Text style={styles.subtitle}>Review the ride summary and complete the payment.</Text>
				</View>

					<RideCard title="Ride summary" subtitle="Review the booking details before payment.">
					<View style={styles.summaryBlock}>
						<Text style={styles.summaryLabel}>Pickup Location</Text>
						<Text style={styles.summaryText}>{rideSummary.pickup}</Text>
					</View>
					<View style={styles.summaryBlock}>
						<Text style={styles.summaryLabel}>Destination</Text>
						<Text style={styles.summaryText}>{rideSummary.destination}</Text>
					</View>
					<View style={styles.rowBetween}>
						<Text style={styles.summaryLabel}>Current Ride Status</Text>
						<StatusBadge status={rideStatus} />
					</View>
					<View style={styles.summaryBlock}>
						<Text style={styles.summaryLabel}>Mock Fare Amount</Text>
						<Text style={styles.fareAmount}>${MOCK_FARE.toFixed(2)}</Text>
					</View>
				</RideCard>

				<RideCard title="Ride progress" rightElement={<StatusBadge status={rideStatus} />}>
					<View style={styles.flowContainer}>
						{FLOW_STEPS.map((step, index) => {
							const isActive = index <= currentStepIndex;
							const isCurrent = index === currentStepIndex;

							return (
								<View key={step} style={styles.flowRow}>
									<View style={[styles.flowDot, isActive && styles.flowDotActive, isCurrent && styles.flowDotCurrent]} />
									<Text style={[styles.flowLabel, isActive && styles.flowLabelActive]}>
										{step}
										{isCurrent ? '  ●' : ''}
									</Text>
								</View>
							);
						})}
					</View>
				</RideCard>

				{/* Customer: PAY NOW button when ride is Completed */}
				{canCustomerPay ? (
					<ActionButton label="PAY NOW" onPress={handleCustomerPay} />
				) : null}

				{/* Customer: Waiting for driver confirmation when PaymentPending */}
				{isWaitingForDriver ? (
					<RideCard title="Payment Submitted">
						<View style={styles.pendingContainer}>
							<Text style={styles.pendingIcon}>⏳</Text>
							<Text style={styles.pendingText}>Waiting for driver confirmation...</Text>
							<Text style={styles.pendingSubtext}>Your payment is being processed. The driver will confirm it shortly.</Text>
						</View>
					</RideCard>
				) : null}

				{/* Driver: Complete Payment button when PaymentPending */}
				{canDriverCompletePay ? (
					<RideCard title="Payment Confirmation" subtitle="The customer has submitted payment.">
						<Text style={styles.pendingDriverText}>
							The customer has paid ${MOCK_FARE.toFixed(2)}. Confirm to complete the transaction.
						</Text>
					</RideCard>
				) : null}
				{canDriverCompletePay ? (
					<ActionButton label="Complete Payment" onPress={handleDriverCompletePay} />
				) : null}

				{rideStatus === RIDE_STATUSES.PAID || paymentCompleted ? (
					<RideCard title="Payment Successful" subtitle="Your payment has been processed successfully.">
						<Text style={styles.successText}>Thank you for riding with QuickRide.</Text>
					</RideCard>
				) : null}

				{rideStatus === RIDE_STATUSES.PAID || paymentCompleted ? (
					<ActionButton label="Return to Dashboard" onPress={handleReturnToDashboard} />
				) : null}
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
	summaryText: {
		fontSize: 15,
		lineHeight: 22,
		color: '#64748B',
	},
	summaryLabel: {
		fontSize: 13,
		fontWeight: '700',
		color: '#94A3B8',
		textTransform: 'uppercase',
		letterSpacing: 0.6,
	},
	summaryBlock: {
		marginTop: 14,
	},
	rowBetween: {
		marginTop: 14,
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	flowContainer: {
		marginTop: 14,
		gap: 10,
	},
	flowRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
	},
	flowDot: {
		width: 12,
		height: 12,
		borderRadius: 999,
		backgroundColor: '#CBD5E1',
	},
	flowDotActive: {
		backgroundColor: '#111827',
	},
	flowDotCurrent: {
		transform: [{ scale: 1.15 }],
	},
	flowLabel: {
		fontSize: 14,
		fontWeight: '600',
		color: '#94A3B8',
	},
	flowLabelActive: {
		color: '#0F172A',
	},
	fareAmount: {
		fontSize: 22,
		fontWeight: '800',
		color: '#0F172A',
	},
	successText: {
		fontSize: 14,
		lineHeight: 22,
		color: '#64748B',
	},
	pendingContainer: {
		alignItems: 'center',
		paddingVertical: 12,
	},
	pendingIcon: {
		fontSize: 32,
		marginBottom: 8,
	},
	pendingText: {
		fontSize: 16,
		fontWeight: '700',
		color: '#C2410C',
		textAlign: 'center',
	},
	pendingSubtext: {
		marginTop: 6,
		fontSize: 14,
		lineHeight: 20,
		color: '#64748B',
		textAlign: 'center',
	},
	pendingDriverText: {
		marginTop: 8,
		fontSize: 14,
		lineHeight: 22,
		color: '#0F172A',
	},
});
