import { StyleSheet, Text, View } from 'react-native';
import { RIDE_STATUSES } from '../context/RideContext';

const STATUS_THEME = {
	[RIDE_STATUSES.IDLE]: { backgroundColor: '#E2E8F0', color: '#0F172A' },
	[RIDE_STATUSES.REQUESTED]: { backgroundColor: '#FEF3C7', color: '#92400E' },
	[RIDE_STATUSES.ACCEPTED]: { backgroundColor: '#DBEAFE', color: '#1D4ED8' },
	[RIDE_STATUSES.ARRIVING]: { backgroundColor: '#EDE9FE', color: '#6D28D9' },
	[RIDE_STATUSES.IN_PROGRESS]: { backgroundColor: '#DCFCE7', color: '#166534' },
	[RIDE_STATUSES.COMPLETED]: { backgroundColor: '#D1FAE5', color: '#065F46' },
	[RIDE_STATUSES.PAYMENT_PENDING]: { backgroundColor: '#FFF7ED', color: '#C2410C' },
	[RIDE_STATUSES.PAID]: { backgroundColor: '#E0E7FF', color: '#3730A3' },
};

export default function StatusBadge({ status, style }) {
	const theme = STATUS_THEME[status] ?? STATUS_THEME[RIDE_STATUSES.IDLE];

	return (
		<View style={[styles.badge, { backgroundColor: theme.backgroundColor }, style]}>
			<Text style={[styles.text, { color: theme.color }]}>{status}</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	badge: {
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderRadius: 999,
	},
	text: {
		fontSize: 13,
		fontWeight: '700',
	},
});
