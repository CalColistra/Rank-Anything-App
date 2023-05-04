// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCUDSHQDzAePCzXqbO3KLD7CrheB0qqPQM",
  authDomain: "real-ranks.firebaseapp.com",
  projectId: "real-ranks",
  storageBucket: "real-ranks.appspot.com",
  messagingSenderId: "907485907537",
  appId: "1:907485907537:web:827023d98b094f709b4670",
  measurementId: "G-J5QLN42B55"
};
  
  // Initialize Firebase
  //const app = initializeApp(firebaseConfig);
  export const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);