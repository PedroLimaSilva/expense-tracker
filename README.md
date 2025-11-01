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
       match /expenses/{expenseId} {
         // Allow read if user is authenticated and owns the expense
         allow read: if request.auth != null && request.auth.uid == resource.data.userId;
         
         // Allow create if user is authenticated and sets their own userId
         allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
         
         // Allow update/delete if user is authenticated and owns the expense
         allow update, delete: if request.auth != null && request.auth.uid == resource.data.userId;
       }
       
       match /income/{incomeId} {
         // Allow read if user is authenticated and owns the income
         allow read: if request.auth != null && request.auth.uid == resource.data.userId;
         
         // Allow create if user is authenticated and sets their own userId
         allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
         
         // Allow update/delete if user is authenticated and owns the income
         allow update, delete: if request.auth != null && request.auth.uid == resource.data.userId;
       }
       
       match /categories/{categoryId} {
         // Allow read if user is authenticated and owns the category
         allow read: if request.auth != null && request.auth.uid == resource.data.userId;
         
         // Allow create if user is authenticated and sets their own userId
         allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
         
         // Allow update/delete if user is authenticated and owns the category
         allow update, delete: if request.auth != null && request.auth.uid == resource.data.userId;
       }
       
       match /userPreferences/{userId} {
         // Allow users to read and write their own preferences
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
     }
   }
   ```
   
   **Important:** Click **"Publish"** after updating the rules!

6. **Run the development server:**
   ```bash
   yarn dev
   ```

7. **Build for production:**
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