import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

export default function CheckoutScreen() {
	return (
		<SafeAreaView style={styles.safeArea}>
			<View style={styles.container}>
				<Text style={styles.title}>Checkout</Text>
				<Text style={styles.text}>A simple transaction flow will be implemented later.</Text>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: '#F7F9FC',
	},
	container: {
		flex: 1,
		padding: 24,
		justifyContent: 'center',
	},
	title: {
		fontSize: 28,
		fontWeight: '800',
		color: '#0F172A',
		marginBottom: 10,
	},
	text: {
		fontSize: 16,
		lineHeight: 24,
		color: '#64748B',
	},
});
