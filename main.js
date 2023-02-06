import './style.css'

import { app as firebase } from './javaScript/firebase-config'

import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth'
import { getFirestore, setDoc, doc, getDoc, collection, onSnapshot } from 'firebase/firestore'

//---------------------------------------------------------------------------------
var signedIn = false;
//---------------------------------------------------------------------------------
//user class
class User {
  constructor(userEmail, userName, followers, following, reputation) {
    this.userEmail = userEmail;
    this.userName = userName;
    this.followers = followers;
    this.following = following;
    this.reputation = reputation;
  }
}
//---------------------------------------------------------------------------------
//handle login/logout:
const auth = getAuth(firebase)
const googleAuthProvider = new GoogleAuthProvider()

const loginBtn = document.querySelector('.login')
const logoutBtn = document.querySelector('.logout')
const displayUser = document.querySelector('.username')
const section = document.querySelector('section')

loginBtn.addEventListener('click', () => {
  signInWithPopup(auth, googleAuthProvider)
                  .then(auth => console.log(auth))
})

logoutBtn.addEventListener('click', () => {
  signOut(auth).then(() => {
      logoutBtn.classList.remove('show');
      logoutBtn.classList.add('hide');
      loginBtn.classList.remove('hide');
      loginBtn.classList.add('show');
      console.log('logged out')
  })
})
var currentUser;
let username;
onAuthStateChanged(auth, user => {
  if(user){
      loginBtn.classList.remove('show');
      loginBtn.classList.add('hide');
      logoutBtn.classList.remove('hide');
      logoutBtn.classList.add('show');
      document.querySelector('h3').innerHTML = '';
      username = user.displayName;
      displayUser.innerHTML = 'Signed in as: ' + username;
      displayUser.classList.remove('hide');
      displayUser.classList.add('show');
      currentUser = new User(user.email, username);
      checkAccount(currentUser.userEmail);
      signedIn = true;
  }else{
      logoutBtn.classList.remove('show');
      loginBtn.classList.add('show');
      displayUser.textContent = 'You are not signed in';
      signedIn = false;
  }
})

//function that checks if it is a returning user or a first time log in:
async function checkAccount(email){
  const userRef = doc(db, "users", email);
  const docSnap = await getDoc(userRef);

if (docSnap.exists()) {
  console.log("Returning User:", docSnap.data());
  currentUser = new User(email,docSnap.data().userName, docSnap.data().followers, docSnap.data().following, docSnap.data().reputation);
} else {
  // doc.data() will be undefined in this case
  console.log("New user!");
  await setDoc(doc(db, "users", email), {
    userName: currentUser.userName,
    email: email,
    followers: [],
    following: [],
    reputation: 0
  });
}
}
//---------------------------------------------------------------------------------
//handle nav bar buttons:
const homeBtn = document.querySelector('#homeBtn');
const homeSection = document.querySelector('#home');
const homeLabel = document.querySelector('#homeLabel');

const discoverBtn = document.querySelector('#discoverBtn');
const discoverSection = document.querySelector('#discover');
const discoverLabel = document.querySelector('#discoverLabel');

const searchBtn = document.querySelector('#searchBtn');
const searchSection = document.querySelector('#search');
const searchLabel = document.querySelector('#searchLabel');

const profileBtn = document.querySelector('#profileBtn');
const profileSection = document.querySelector('#profile');
const profileLabel = document.querySelector('#profileLabel');

const sections = document.getElementsByClassName('section');
const navLabels = document.getElementsByClassName('navLabel');

homeSection.style.display="block";
homeLabel.style= "text-decoration-line: underline; text-decoration-style: wavy;text-decoration-color: #fae466; border-color: #fae466";

homeBtn.addEventListener('click', () => {
  if (signedIn==false) {
    alert("Please sign in with google.");
  }
  else {
    for (var i = 0; i < sections.length; i++) {
      sections[i].style.display = 'none';
    }
    for (var i = 0; i < navLabels.length; i++) {
      navLabels[i].style = 'text-decoration-line: none; text-decoration-style: none;';
    }
    homeSection.style.display="block";
    homeLabel.style= "text-decoration-line: underline; text-decoration-style: wavy;text-decoration-color: #fae466; border-color: #fae466";
  }
})

discoverBtn.addEventListener('click', () => {
  if (signedIn==false) {
    alert("Please sign in with google.");
  }
  else {
    for (var i = 0; i < sections.length; i++) {
      sections[i].style.display = 'none';
    }
    for (var i = 0; i < navLabels.length; i++) {
      navLabels[i].style = 'text-decoration-line: none; text-decoration-style: none;';
    }
    discoverSection.style.display="block";
    discoverLabel.style= "text-decoration-line: underline; text-decoration-style: wavy;text-decoration-color: #fae466; border-color: #fae466";
  }
})

searchBtn.addEventListener('click', () => {
  if (signedIn==false) {
    alert("Please sign in with google.");
  }
  else {
    for (var i = 0; i < sections.length; i++) {
      sections[i].style.display = 'none';
    }
    for (var i = 0; i < navLabels.length; i++) {
      navLabels[i].style = 'text-decoration-line: none; text-decoration-style: none;';
    }
    searchSection.style.display="block";
    searchLabel.style= "text-decoration-line: underline; text-decoration-style: wavy;text-decoration-color: #fae466; border-color: #fae466";
  }
})

const profileName = document.querySelector("#profileName");
const profileFollowing = document.querySelector("#profileFollowing");
const profileFollowers = document.querySelector("#profileFollowers");
const profileReputation = document.querySelector("#profileReputation");
const profileTitle = document.querySelector("#profileTitle");

profileBtn.addEventListener('click', () => {
  if (signedIn==false) {
    alert("Please sign in with google.");
  }
  else {
    for (var i = 0; i < sections.length; i++) {
      sections[i].style.display = 'none';
    }
    for (var i = 0; i < navLabels.length; i++) {
      navLabels[i].style = 'text-decoration-line: none; text-decoration-style: none;';
    }
    profileSection.style.display="block";
    profileTitle.innerHTML = "<h1>Your Profile</h1>";
    profileLabel.style= "text-decoration-line: underline; text-decoration-style: wavy;text-decoration-color: #fae466; border-color: #fae466";
    profileName.innerHTML = "<h2>"+currentUser.userName+"</h2>";
    profileFollowers.innerHTML = "<h2>"+currentUser.followers.length+"</h2>";
    profileFollowing.innerHTML = "<h2>"+currentUser.following.length+"</h2>";
    profileReputation.innerHTML = "<h2>"+currentUser.reputation+"</h2>";
  }
})

//---------------------------------------------------------------------------------
// firestore section

const db = getFirestore(firebase)

const colRef = collection(db, 'todos')

const form = document.querySelector('form')
const input = document.querySelector('input')
const h3 = document.querySelector('h3')

//function that triggers when user hits submit in text box:
form.addEventListener('submit', async e => {
  e.preventDefault()
  
  const docRef = doc(colRef)

  if(auth.currentUser){  //check if user is logged in
      await setDoc(docRef, { todoContent: input.value } )
    }else{
      h3.textContent = 'Please log in'
    }
})

onSnapshot(colRef, col => {

  section.innerHTML = ''

  col.forEach(doc => {
      section.innerHTML += `<div>
          <p id='listWords'>${doc.data().todoContent}</p>
      </div>`
  });
})