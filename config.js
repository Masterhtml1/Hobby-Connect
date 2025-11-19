// Firebase Configuration
// IMPORTANT: Replace these values with your actual Firebase project credentials
// Get these from: Firebase Console > Project Settings > General > Your apps > Web app

const firebaseConfig = {
  apiKey: "AIzaSyDMsZyqBal3KdS67tjXJ3zeqNk7rZ4SHUo",
  authDomain: "hobbyconnect-1dadd.firebaseapp.com",
  projectId: "hobbyconnect-1dadd",
  storageBucket: "hobbyconnect-1dadd.firebasestorage.app",
  messagingSenderId: "974198667440",
  appId: "1:974198667440:web:9aa0c1dcfbe55648496375",
  measurementId: "G-QCK2MF776F"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Firebase services
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Google Auth Provider
const googleProvider = new firebase.auth.GoogleAuthProvider();

// Export for use in app.js
window.firebaseServices = {
    auth,
    db,
    storage,
    googleProvider,
    firebase
};

/*
SETUP INSTRUCTIONS:
==================

1. Create a Firebase Project:
   - Go to https://console.firebase.google.com/
   - Click "Add project" and follow the setup wizard
   - Once created, go to Project Settings

2. Get your config values:
   - In Project Settings, scroll to "Your apps"
   - Click the web icon (</>)
   - Register your app and copy the config object
   - Replace the values above with your actual credentials

3. Enable Authentication:
   - In Firebase Console, go to Authentication > Sign-in method
   - Enable "Email/Password"
   - Enable "Google" sign-in

4. Set up Firestore Database:
   - Go to Firestore Database
   - Click "Create database"
   - Choose "Start in test mode" (for development)
   - Select a location close to your users

5. Configure Firestore Rules (for production):
   Go to Firestore Database > Rules and use:

   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Users collection
       match /users/{userId} {
         allow read: if request.auth != null;
         allow write: if request.auth != null && request.auth.uid == userId;
       }
       
       // Posts collection
       match /posts/{postId} {
         allow read: if request.auth != null;
         allow create: if request.auth != null;
         allow update, delete: if request.auth != null && 
                                  resource.data.authorId == request.auth.uid;
       }
       
       // Comments subcollection
       match /posts/{postId}/comments/{commentId} {
         allow read: if request.auth != null;
         allow create: if request.auth != null;
         allow delete: if request.auth != null && 
                        resource.data.authorId == request.auth.uid;
       }
     }
   }

6. Set up Storage (optional, for profile pictures):
   - Go to Storage
   - Click "Get started"
   - Use test mode for development

7. Configure Storage Rules (for production):
   Go to Storage > Rules and use:

   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       match /profile-pictures/{userId}/{fileName} {
         allow read: if request.auth != null;
         allow write: if request.auth != null && request.auth.uid == userId;
       }
     }
   }

8. Deploy your app:
   - You can use Firebase Hosting or any web hosting service
   - For Firebase Hosting:
     * npm install -g firebase-tools
     * firebase login
     * firebase init hosting
     * firebase deploy

9. Domain Configuration (for production):
   - Add your domain to Firebase Console > Authentication > Settings > Authorized domains
*/
