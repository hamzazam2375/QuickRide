# QuickRide

> **⚠️ Disclaimer:** This is **not** a full-fledged ride-booking application. QuickRide is an academic assignment built to practice and demonstrate the following concepts in Expo / React Native:
>
> - **Expo Router & Navigation** — stack-based screen navigation with React Navigation
> - **Maps Integration** — rendering interactive maps with `react-native-maps`, markers, and polylines
> - **Push / Local Notifications** — requesting permissions and scheduling notifications via `expo-notifications`
> - **Live Location Tracking** — real-time device location updates using `expo-location`
> - **Route Generation** — fetching and displaying driving routes between two coordinates
> - **Client–Server Scenario** — simulating a customer ↔ driver interaction through shared state (ride request → accept → start → complete → payment flow)
>
> All data is mocked locally; there is no backend server or database.

## How to make it a full-fledged app in the future

To turn this into a real ride-booking application, the following would be needed:

- **Backend server** — Build an API (e.g. Node.js/Express, Firebase, or Supabase) to handle ride requests, driver matching, and payment processing instead of shared local state.
- **Database** — Store users, rides, payments, and ride history in a real database (PostgreSQL, MongoDB, Firestore, etc.).
- **Authentication** — Add user sign-up/login with email, phone number, or social auth so customers and drivers have separate accounts.
- **Real-time communication** — Use WebSockets or Firebase Realtime Database so the customer and driver apps communicate live instead of sharing in-memory state.
- **Payment gateway** — Integrate a real payment provider like Stripe or Razorpay for actual fare collection.
- **Push notifications (remote)** — Switch from local notifications to server-sent push notifications using FCM/APNs. This also requires a development build instead of Expo Go.
- **Driver matching algorithm** — Assign the nearest available driver to a ride request automatically based on location.
- **Ride history & receipts** — Let users view past rides, download receipts, and rate their experience.
- **Development build** — Move from Expo Go to a custom development build (`npx expo run:android` / `npx expo run:ios`) to unlock full native module support.

## How to Run it

## Install dependencies

Run in the project root:

```bash
npm install
```

This installs all required dependencies from package.json, including:

- expo
- react
- react-native
- @react-navigation/native
- @react-navigation/native-stack
- react-native-gesture-handler
- react-native-safe-area-context
- react-native-screens
- react-native-maps
- expo-location
- expo-notifications

## Run the project

Start the development server:

```bash
npx expo start
```

Then open on:

- Android emulator/device
- iOS simulator/device
- Expo Go (for quick testing)