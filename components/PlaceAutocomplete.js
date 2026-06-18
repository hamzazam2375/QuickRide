import { useCallback, useEffect, useRef, useState } from 'react';
import {
	FlatList,
	Pressable,
	StyleSheet,
	Text,
	TextInput,
	View,
} from 'react-native';
import { searchPlaces } from '../services/geocoding';

const DEBOUNCE_MS = 400;

/**
 * An autocomplete text input that searches for places via Nominatim.
 *
 * Props:
 *   value          – controlled text value
 *   onChangeText   – fired when the user types
 *   onPlaceSelected({ displayName, lat, lon }) – fired when a suggestion is tapped
 *   placeholder    – input placeholder
 *   style          – extra style for the wrapper View
 */
export default function PlaceAutocomplete({
	value,
	onChangeText,
	onPlaceSelected,
	placeholder = 'Search a place...',
	style,
}) {
	const [suggestions, setSuggestions] = useState([]);
	const [showDropdown, setShowDropdown] = useState(false);
	const [isSearching, setIsSearching] = useState(false);
	const debounceTimer = useRef(null);
	const suppressSearch = useRef(false);

	const performSearch = useCallback(async (query) => {
		if (!query || query.trim().length < 2) {
			setSuggestions([]);
			setShowDropdown(false);
			return;
		}

		setIsSearching(true);

		try {
			const results = await searchPlaces(query);
			setSuggestions(results);
			setShowDropdown(results.length > 0);
		} catch {
			setSuggestions([]);
			setShowDropdown(false);
		} finally {
			setIsSearching(false);
		}
	}, []);

	const handleChangeText = useCallback(
		(text) => {
			onChangeText(text);

			// When the user selects a suggestion we update the text programmatically;
			// skip triggering another search in that case.
			if (suppressSearch.current) {
				suppressSearch.current = false;
				return;
			}

			if (debounceTimer.current) {
				clearTimeout(debounceTimer.current);
			}

			debounceTimer.current = setTimeout(() => {
				performSearch(text);
			}, DEBOUNCE_MS);
		},
		[onChangeText, performSearch],
	);

	const handleSelectPlace = useCallback(
		(place) => {
			suppressSearch.current = true;
			onChangeText(place.displayName);
			setSuggestions([]);
			setShowDropdown(false);

			if (onPlaceSelected) {
				onPlaceSelected(place);
			}
		},
		[onChangeText, onPlaceSelected],
	);

	useEffect(() => {
		return () => {
			if (debounceTimer.current) {
				clearTimeout(debounceTimer.current);
			}
		};
	}, []);

	const renderSuggestion = ({ item }) => (
		<Pressable
			style={({ pressed }) => [
				styles.suggestionItem,
				pressed && styles.suggestionPressed,
			]}
			onPress={() => handleSelectPlace(item)}
		>
			<Text style={styles.suggestionIcon}>📍</Text>
			<Text style={styles.suggestionText} numberOfLines={2}>
				{item.displayName}
			</Text>
		</Pressable>
	);

	return (
		<View style={[styles.wrapper, style]}>
			<View style={styles.inputRow}>
				<TextInput
					value={value}
					onChangeText={handleChangeText}
					placeholder={placeholder}
					placeholderTextColor="#94A3B8"
					style={styles.input}
					onFocus={() => {
						if (suggestions.length > 0) {
							setShowDropdown(true);
						}
					}}
				/>
				{isSearching ? (
					<Text style={styles.searchingIndicator}>...</Text>
				) : null}
			</View>

			{showDropdown && suggestions.length > 0 ? (
				<View style={styles.dropdown}>
					<FlatList
						data={suggestions}
						keyExtractor={(item, index) => `${item.lat}-${item.lon}-${index}`}
						renderItem={renderSuggestion}
						keyboardShouldPersistTaps="handled"
						nestedScrollEnabled
						scrollEnabled={false}
					/>
				</View>
			) : null}
		</View>
	);
}

const styles = StyleSheet.create({
	wrapper: {
		zIndex: 10,
	},
	inputRow: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	input: {
		flex: 1,
		marginTop: 10,
		borderWidth: 1,
		borderColor: '#E2E8F0',
		borderRadius: 16,
		paddingHorizontal: 14,
		paddingVertical: 13,
		fontSize: 15,
		color: '#0F172A',
		backgroundColor: '#F8FAFC',
	},
	searchingIndicator: {
		position: 'absolute',
		right: 14,
		top: 22,
		fontSize: 14,
		color: '#94A3B8',
	},
	dropdown: {
		marginTop: 4,
		backgroundColor: '#FFFFFF',
		borderRadius: 14,
		borderWidth: 1,
		borderColor: '#E2E8F0',
		maxHeight: 200,
		overflow: 'hidden',
		shadowColor: '#0F172A',
		shadowOpacity: 0.1,
		shadowRadius: 12,
		shadowOffset: { width: 0, height: 6 },
		elevation: 5,
	},
	suggestionItem: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 14,
		paddingVertical: 12,
		borderBottomWidth: 1,
		borderBottomColor: '#F1F5F9',
		gap: 10,
	},
	suggestionPressed: {
		backgroundColor: '#F1F5F9',
	},
	suggestionIcon: {
		fontSize: 16,
	},
	suggestionText: {
		flex: 1,
		fontSize: 14,
		lineHeight: 20,
		color: '#334155',
	},
});
