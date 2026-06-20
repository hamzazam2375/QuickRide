import { LogBox } from 'react-native';
import { registerRootComponent } from 'expo';

// Suppress expo-notifications Expo Go limitation messages (SDK 53+).
// Push notifications require a development build; local notifications still work.
LogBox.ignoreLogs([
	'expo-notifications: Android Push notifications',
	'expo-notifications` functionality is not fully supported',
]);

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
