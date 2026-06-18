import 'react-native-gesture-handler';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { RideProvider } from './context/RideContext';
import RoleSelectionScreen from './screens/RoleSelectionScreen';
import CustomerDashboard from './screens/CustomerDashboard';
import DriverDashboard from './screens/DriverDashboard';
import CheckoutScreen from './screens/CheckoutScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <RideProvider>
      <NavigationContainer>
        <StatusBar style="dark" />
        <Stack.Navigator
          initialRouteName="RoleSelection"
          screenOptions={{
            headerShadowVisible: false,
            headerStyle: { backgroundColor: '#F7F9FC' },
            headerTitleStyle: { fontWeight: '600' },
            contentStyle: { backgroundColor: '#F7F9FC' },
          }}
        >
          <Stack.Screen
            name="RoleSelection"
            component={RoleSelectionScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="CustomerDashboard"
            component={CustomerDashboard}
            options={{ title: 'Customer Dashboard' }}
          />
          <Stack.Screen
            name="DriverDashboard"
            component={DriverDashboard}
            options={{ title: 'Driver Dashboard' }}
          />
          <Stack.Screen
            name="Checkout"
            component={CheckoutScreen}
            options={{ title: 'Checkout' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </RideProvider>
  );
}
