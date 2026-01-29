# 🚗 RideSplit Match

A destination-based ride-sharing companion app that helps users find nearby riders heading to the same destination. Users can see each other on a live map, chat in real-time, and share rides to reduce costs.

## Features

- **User Registration & Authentication** - Email/password auth with gender selection
- **Destination Search** - Search for any destination using OpenStreetMap Nominatim geocoding
- **Live Location Tracking** - Real-time GPS tracking with smooth marker animations
- **Gender-Based Matching** - Users only see other users of the same gender (strict filter)
- **Destination Matching** - Match with users going to destinations within 500m radius
- **2km Radius Visualization** - Visual circle showing nearby users on the map
- **Real-time Chat** - In-app messaging with phone number sharing
- **Online/Offline Toggle** - Control when your location is visible to others

## Tech Stack

- **Frontend:** React + Vite + TypeScript
- **Map:** Leaflet + OpenStreetMap tiles
- **Backend:** Firebase (Auth, Firestore, Realtime Database)
- **Geocoding:** OpenStreetMap Nominatim API (free, no API key needed)

## Prerequisites

- Node.js 18+ and npm
- A Firebase account (free tier is sufficient for development)

## Firebase Setup

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" and follow the steps
3. Give your project a name (e.g., "ridesplit-match")
4. Disable Google Analytics (optional for MVP)
5. Click "Create project"

### 2. Enable Authentication

1. In your Firebase project, go to **Authentication** in the left sidebar
2. Click **Get Started**
3. Go to the **Sign-in method** tab
4. Click on **Email/Password**
5. Toggle **Enable** to ON
6. Click **Save**

### 3. Create Firestore Database

1. Go to **Firestore Database** in the left sidebar
2. Click **Create database**
3. Choose **Start in test mode** (for development only!)
4. Select your preferred region
5. Click **Enable**

### 4. Create Realtime Database

1. Go to **Realtime Database** in the left sidebar
2. Click **Create Database**
3. Select your preferred location
4. Choose **Start in test mode** (for development only!)
5. Click **Enable**
6. Note your database URL (e.g., `https://your-project-id-default-rtdb.firebaseio.com`)

### 5. Register Web App and Get Config

1. Go to **Project Settings** (gear icon in top left)
2. Scroll down to "Your apps" section
3. Click the **Web** icon (`</>`)
4. Register your app with a nickname (e.g., "ridesplit-web")
5. Copy the Firebase configuration object

### 6. Create Environment File

Create a `.env` file in the project root with your Firebase config:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_DATABASE_URL=https://your_project_id-default-rtdb.firebaseio.com
```

## Installation

1. **Clone the repository** (if applicable)

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create your `.env` file** with Firebase configuration (see above)

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser** to `http://localhost:5173`

## Usage

### Getting Started

1. **Register** - Create a new account with your name, email, gender, and phone number
2. **Allow Location** - Grant location permission when prompted
3. **Enter Destination** - Search for your destination in the top search bar
4. **Go Online** - Click the "Go Online" button to start matching

### Finding Riders

- When online, you'll see other users (same gender) heading to similar destinations
- Users within 2km appear with a "Nearby" badge
- The 2km radius circle is drawn around your location
- Click "Chat" on any matched user to start a conversation

### Chat

- Chat shows the other user's phone number for easy coordination
- Messages are real-time
- Use the back button to return to the map

### Going Offline

- Click "Go Offline" to hide your location
- Your location data is removed from the database
- You won't see other users and they won't see you

## Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── DestinationSearch.tsx    # Autocomplete destination input
│   ├── MapView.tsx              # Leaflet map with markers
│   ├── MatchList.tsx            # List of matched users
│   └── OnlineToggle.tsx         # Online/offline button
├── firebase/             # Firebase configuration and helpers
│   ├── firebase.ts              # Firebase initialization
│   ├── auth.ts                  # Authentication functions
│   ├── firestore.ts             # Firestore operations
│   └── rtdb.ts                  # Realtime Database operations
├── pages/                # Page components
│   ├── Login.tsx                # Login page
│   ├── Register.tsx             # Registration page
│   ├── MapPage.tsx              # Main map page
│   └── ChatPage.tsx             # Chat page
├── types/                # TypeScript type definitions
│   └── models.ts                # Data models
├── utils/                # Utility functions
│   ├── geo.ts                   # Geolocation utilities (Haversine)
│   └── debounce.ts              # Debounce/throttle utilities
├── App.tsx               # Main app with routing
├── main.tsx              # Entry point
└── index.css             # Global styles
```

## Data Models

### Firestore Collections

**users/{uid}**
```typescript
{
  uid: string;
  email: string;
  name: string;
  gender: 'male' | 'female';
  phone: string;
  createdAt: number;
}
```

**trips/{tripId}**
```typescript
{
  uid: string;
  gender: 'male' | 'female';
  destinationName: string;
  destinationLat: number;
  destinationLng: number;
  status: 'active' | 'inactive';
  createdAt: number;
  updatedAt: number;
}
```

**chats/{chatId}**
```typescript
{
  members: string[];  // [uid1, uid2]
  createdAt: number;
  lastMessage?: string;
  lastMessageAt?: number;
}
```

**chats/{chatId}/messages/{messageId}**
```typescript
{
  senderId: string;
  text: string;
  createdAt: number;
}
```

### Realtime Database

**liveLocations/{uid}**
```typescript
{
  lat: number;
  lng: number;
  heading: number | null;
  updatedAt: number;
  tripId: string;
  isOnline: boolean;
  gender: 'male' | 'female';
  destinationLat: number;
  destinationLng: number;
}
```

## Matching Logic

1. **Gender Filter:** Users only see users of the same gender
2. **Destination Match:** Two destinations match if they're within 500 meters (Haversine distance)
3. **Nearby Status:** Users within 2km are marked as "nearby" with different styling

## Security Notes

⚠️ **This is an MVP with relaxed security rules!**

For production, you should:

1. **Update Firestore Rules** to restrict access:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{uid} {
         allow read: if request.auth != null;
         allow write: if request.auth != null && request.auth.uid == uid;
       }
       match /trips/{tripId} {
         allow read: if request.auth != null;
         allow write: if request.auth != null && resource.data.uid == request.auth.uid;
       }
       // ... add more rules
     }
   }
   ```

2. **Update Realtime Database Rules:**
   ```json
   {
     "rules": {
       "liveLocations": {
         "$uid": {
           ".read": "auth != null",
           ".write": "auth != null && auth.uid == $uid"
         }
       }
     }
   }
   ```

3. Add rate limiting and abuse prevention
4. Implement user blocking/reporting features
5. Add phone number verification

## Deployment

### Firebase Hosting (Recommended)

1. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```bash
   firebase login
   ```

3. Initialize hosting:
   ```bash
   firebase init hosting
   ```

4. Build the app:
   ```bash
   npm run build
   ```

5. Deploy:
   ```bash
   firebase deploy --only hosting
   ```

### Other Hosting Options

Build the app and deploy the `dist` folder to:
- Vercel
- Netlify
- AWS S3 + CloudFront
- Any static file hosting

## Troubleshooting

### Location not working
- Ensure you've allowed location permissions in your browser
- HTTPS is required for geolocation (localhost is an exception)

### Firebase errors
- Double-check your `.env` file has all required values
- Verify the Database URL includes the full path with `.firebaseio.com`

### Map not showing
- Check browser console for any Leaflet errors
- Ensure internet connection (tiles load from OpenStreetMap)

### Users not appearing
- Both users must be online
- Both must have the same gender
- Destinations must be within 500m of each other

## License

MIT License - feel free to use and modify for your own projects!

## Contributing

Contributions are welcome! Please open an issue or PR for any improvements.

---

Built with ❤️ using React, Firebase, and OpenStreetMap
