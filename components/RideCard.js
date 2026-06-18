import { StyleSheet, Text, View } from 'react-native';

export default function RideCard({ title, subtitle, rightElement, children, style }) {
	return (
		<View style={[styles.card, style]}>
			{title || subtitle || rightElement ? (
				<View style={styles.headerRow}>
					<View style={styles.headerTextBlock}>
						{title ? <Text style={styles.title}>{title}</Text> : null}
						{subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
					</View>
					{rightElement ? <View>{rightElement}</View> : null}
				</View>
			) : null}

			{children}
		</View>
	);
}

const styles = StyleSheet.create({
	card: {
		backgroundColor: '#FFFFFF',
		borderRadius: 22,
		padding: 16,
		shadowColor: '#0F172A',
		shadowOpacity: 0.06,
		shadowRadius: 18,
		shadowOffset: { width: 0, height: 10 },
		elevation: 3,
	},
	headerRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'flex-start',
		gap: 12,
	},
	headerTextBlock: {
		flex: 1,
	},
	title: {
		fontSize: 16,
		fontWeight: '700',
		color: '#0F172A',
	},
	subtitle: {
		marginTop: 6,
		fontSize: 14,
		lineHeight: 20,
		color: '#64748B',
	},
});
