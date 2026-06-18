import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RoleSelectionScreen({ navigation }) {
	return (
		<SafeAreaView style={styles.safeArea}>
			<ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
				<View style={styles.hero}>
					<Text style={styles.title}>QuickRide</Text>
					<Text style={styles.subtitle}>
						Choose how you want to continue in the app.
					</Text>
				</View>

				<View style={styles.card}>
					<Pressable
						onPress={() => navigation.navigate('CustomerDashboard')}
						style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
					>
						<Text style={styles.primaryButtonText}>Continue as Customer</Text>
					</Pressable>

					<Pressable
						onPress={() => navigation.navigate('DriverDashboard')}
						style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
					>
						<Text style={styles.secondaryButtonText}>Continue as Driver</Text>
					</Pressable>
				</View>
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
		paddingHorizontal: 24,
		paddingVertical: 32,
		justifyContent: 'center',
	},
	hero: {
		marginBottom: 28,
	},
	title: {
		fontSize: 42,
		lineHeight: 48,
		fontWeight: '800',
		color: '#0F172A',
		letterSpacing: -1,
	},
	subtitle: {
		marginTop: 12,
		fontSize: 16,
		lineHeight: 24,
		color: '#64748B',
		maxWidth: 320,
	},
	card: {
		backgroundColor: '#FFFFFF',
		borderRadius: 24,
		padding: 18,
		shadowColor: '#0F172A',
		shadowOpacity: 0.08,
		shadowRadius: 24,
		shadowOffset: { width: 0, height: 12 },
		elevation: 4,
	},
	primaryButton: {
		backgroundColor: '#111827',
		borderRadius: 18,
		paddingVertical: 16,
		alignItems: 'center',
		marginBottom: 14,
	},
	secondaryButton: {
		backgroundColor: '#E2E8F0',
		borderRadius: 18,
		paddingVertical: 16,
		alignItems: 'center',
	},
	primaryButtonText: {
		color: '#FFFFFF',
		fontSize: 16,
		fontWeight: '700',
	},
	secondaryButtonText: {
		color: '#0F172A',
		fontSize: 16,
		fontWeight: '700',
	},
	pressed: {
		opacity: 0.85,
		transform: [{ scale: 0.99 }],
	},
});
