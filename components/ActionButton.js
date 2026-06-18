import { Pressable, StyleSheet, Text } from 'react-native';

export default function ActionButton({ label, onPress, disabled = false }) {
	return (
		<Pressable
			onPress={onPress}
			disabled={disabled}
			style={({ pressed }) => [
				styles.button,
				disabled && styles.buttonDisabled,
				pressed && !disabled && styles.pressed,
			]}
		>
			<Text style={[styles.text, disabled && styles.textDisabled]}>{label}</Text>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	button: {
		backgroundColor: '#111827',
		paddingVertical: 16,
		paddingHorizontal: 18,
		borderRadius: 18,
		alignItems: 'center',
	},
	pressed: {
		opacity: 0.9,
		transform: [{ scale: 0.99 }],
	},
	buttonDisabled: {
		opacity: 0.55,
		backgroundColor: '#94A3B8',
	},
	text: {
		fontSize: 16,
		fontWeight: '700',
		color: '#FFFFFF',
	},
	textDisabled: {
		color: '#E2E8F0',
	},
});
