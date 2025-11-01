# Expense Tracker PWA

A Progressive Web App (PWA) for tracking personal expenses that works offline and syncs to the cloud when online.

## Features

- ✅ **Offline-first**: Works completely offline using IndexedDB
- ✅ **Cloud Sync**: Automatically syncs with Firebase Firestore when online
- ✅ **Authentication**: Secure user authentication with Firebase Auth
- ✅ **PWA**: Installable as a mobile/desktop app
- ✅ **Real-time Updates**: Real-time sync when connected to the internet
- ✅ **Expense Management**: Add, edit, and delete expenses
- ✅ **Categories**: Organize expenses by categories
- ✅ **Responsive Design**: Works on mobile and desktop

## Getting Started

### Prerequisites

- Node.js (v20.19.0 or higher recommended)
- Yarn package manager
- A Firebase project with Firestore and Authentication enabled

### Setup

1. **Install dependencies:**
   ```bash
   yarn install
   ```

2. **Configure Firebase:**
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication (Email/Password)
   - Create a Firestore database
   - Get your Firebase configuration from Project Settings

3. **Create environment file:**
   ```bash
   cp .env.example .env
   ```

4. **Add your Firebase config to `.env`:**
   ```
   VITE_FIREBASE_API_KEY=your-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
   VITE_FIREBASE_APP_ID=your-app-id
   ```

5. **Set up Firestore Security Rules:**
   ```javascript
   rules_version = '2';
   service cloud.firestore {
      match /databases/{database}/documents {
         
         // Helper function for common auth checks
         function isSignedIn() {
            return request.auth != null;
         }

         function isResourceAuthor() {
            return isSignedIn() && request.auth.uid == resource.data.userId;
         }

         function isRequestAuthor() {
            return isSignedIn() && request.auth.uid == request.resource.data.userId;
         }

         // Expenses
         match /expenses/{expenseId} {
            allow read, update, delete: if isResourceAuthor();
            allow create: if isRequestAuthor();
         }
         
         // Income
         match /income/{incomeId} {
            allow read, update, delete: if isResourceAuthor();
            allow create: if isRequestAuthor();
         }

         // Categories
         match /categories/{categoryId} {
            allow read, update, delete: if isResourceAuthor();
            allow create: if isRequestAuthor();
         }

         // User preferences (special case)
         match /userPreferences/{userId} {
            allow read, write: if isSignedIn() && request.auth.uid == userId;
         }
      }
   }
   ```
   
   **Important:** Click **"Publish"** after updating the rules!

6. **Run the development server:**
   ```bash
   yarn dev
   ```

7. **Access from your phone (local network):**
   - Make sure your phone and computer are on the same Wi-Fi network
   - Find your computer's local IP address:
     - **macOS/Linux**: Run `ipconfig getifaddr en0` or `hostname -I`
     - **Windows**: Run `ipconfig` and look for IPv4 address
   - On your phone's browser, go to: `http://YOUR_IP_ADDRESS:5173`
     - Example: `http://192.168.1.100:5173`
   - The app should load on your phone!
   - **Install as PWA**: On your phone browser, look for "Add to Home Screen" or "Install App" option

   **Note:** Firebase requests work exactly the same from your phone - they're just HTTP requests. Make sure your phone can access the internet for Firebase to work.

8. **Build for production:**
   ```bash
   yarn build
   ```

## How It Works

### Offline-First Architecture

- All expenses are stored locally in IndexedDB first
- When online, changes are automatically synced to Firebase Firestore
- When offline, expenses are marked as "not synced" and will sync automatically when back online
- Real-time listeners update the local database when cloud data changes

### Data Flow

1. **Create Expense**: Saved to IndexedDB → Synced to Firestore (if online)
2. **Update Expense**: Updated in IndexedDB → Synced to Firestore (if online)
3. **Delete Expense**: Deleted from IndexedDB → Deleted from Firestore (if online)
4. **Sync**: Pulls latest changes from Firestore and pushes local changes to cloud

### PWA Features

- Service Worker for offline caching
- Web App Manifest for installability
- Responsive design for mobile and desktop
- Works offline with full functionality

## Project Structure

```
src/
├── components/         # React components
│   ├── Dashboard.tsx   # Main expense dashboard
│   ├── ExpenseForm.tsx # Form for adding/editing expenses
│   ├── ExpenseList.tsx # List of expenses
│   ├── Login.tsx       # Login component
│   ├── Signup.tsx      # Signup component
│   └── PrivateRoute.tsx # Protected route wrapper
├── config/             # Configuration files
│   └── firebase.ts     # Firebase initialization
├── contexts/           # React contexts
│   └── AuthContext.tsx # Authentication context
├── db/                 # Database files
│   └── indexeddb.ts    # IndexedDB setup (Dexie)
├── services/           # Business logic
│   ├── expenseService.ts # Expense CRUD operations
│   └── syncService.ts  # Cloud sync service
└── types/              # TypeScript types
    └── expense.ts      # Expense type definitions
```

## Technologies Used

- **React** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Firebase** - Authentication and Firestore
- **Dexie** - IndexedDB wrapper
- **React Router** - Routing
- **Vite PWA Plugin** - PWA functionality

## License

MIT