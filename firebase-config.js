// Firebase project settings for Google / Facebook sign-in.
// Fill these in from Firebase console → Project settings → General → Your apps → Web app.
// They identify your project and are not secrets, but do restrict the API key to your
// domains (Google Cloud console → Credentials) and keep Firebase "Authorized domains" tight.
window.BUDDY_FIREBASE_CONFIG = {
  apiKey: "AIzaSyCazOA4xrZS4sA1pf5JF0fEz1Cx8xfbKqg",
  authDomain: "buddyup-32479.firebaseapp.com", // e.g. "your-project.firebaseapp.com"
  projectId: "buddyup-32479",
  appId: "1:865586811357:web:54a60795da076ff48fe634"};

// Photo API (Cloudflare Worker + R2, see worker/). Profile photos are uploaded to and served
// from here; it must match the photo URL pattern in firestore.rules.
window.BUDDY_PHOTO_API = "https://buddyup.fyi";

// Local testing only (ignored unless the site runs on localhost): these numbers skip the
// real SMS and are verified with their fixed code. Keep in sync with Firebase console →
// Authentication → Sign-in method → Phone → Phone numbers for testing.
window.BUDDY_TEST_PHONES = {
  "+4915227513054": "123456",
};
