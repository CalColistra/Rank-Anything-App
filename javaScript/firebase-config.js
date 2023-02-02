// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyDdMIFo6Cz7Tia744ZzZfXKfoO3A8u2NCo",
    authDomain: "rank-anything-app.firebaseapp.com",
    projectId: "rank-anything-app",
    storageBucket: "rank-anything-app.appspot.com",
    messagingSenderId: "393418323214",
    appId: "1:393418323214:web:d72a4219ca295260e2135f",
    measurementId: "G-C5B7XVEV4T"
  };
  
  // Initialize Firebase
  //const app = initializeApp(firebaseConfig);
  export const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);