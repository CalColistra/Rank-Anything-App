import './style.css'

import { app as firebase } from './javaScript/firebase-config'

import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth'
import { getFirestore, setDoc, doc, getDoc, getDocs, updateDoc, collection, query, where} from 'firebase/firestore'

//---------------------------------------------------------------------------------
var signedIn = false;
const db = getFirestore(firebase)
//---------------------------------------------------------------------------------
//user class
class User {
  constructor(userEmail, userName, followers, following, reputation, postCount) {
    this.userEmail = userEmail;
    this.userName = userName;
    this.followers = followers;
    this.following = following;
    this.reputation = reputation;
    this.postCount = postCount;
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
  displayHomeSection();
  currentUser = null;
  signOut(auth).then(() => {
      logoutBtn.classList.remove('show');
      logoutBtn.classList.add('hide');
      loginBtn.classList.remove('hide');
      loginBtn.classList.add('show');
      console.log('logged out');
  })
})
var currentUser;
onAuthStateChanged(auth, user => {
  if(user){
      loginBtn.classList.remove('show');
      loginBtn.classList.add('hide');
      logoutBtn.classList.remove('hide');
      logoutBtn.classList.add('show');
      checkAccount(user.email);
      signedIn = true;
      displayUser.classList.remove('hide');
      displayUser.classList.add('show');
      
  }else{
      logoutBtn.classList.remove('show');
      loginBtn.classList.add('show');
      displayUser.textContent = 'You are not signed in';
      currentUser = null;
      signedIn = false;
  }
})

//function that checks if it is a returning user or a first time log in:
async function checkAccount(email){
  const userRef = doc(db, "users", email);
  const docSnap = await getDoc(userRef);

if (docSnap.exists()) {
  console.log("Returning User:", docSnap.data());
  currentUser = new User(email,docSnap.data().userName, docSnap.data().followers, docSnap.data().following, docSnap.data().reputation, docSnap.data().postCount);
} else {
    // doc.data() will be undefined in this case
    console.log("New user!");
    await setDoc(doc(db, "users", email), {
      userName: currentUser.userName,
      email: email,
      followers: [],
      following: [],
      reputation: 0,
      postCount:0
    });
    currentUser = new User(email,docSnap.data().userName, docSnap.data().followers, docSnap.data().following, docSnap.data().reputation, docSnap.data().postCount);
  }
  displayUser.innerHTML = 'Signed in as: ' + currentUser.userName;
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

const rankBtn = document.querySelector('#rankBtn');
const rankSection = document.querySelector('#rank');
const rankLabel = document.querySelector('#rankLabel');

const profileBtn = document.querySelector('#profileBtn');
const profileSection = document.querySelector('#profile');
const profileLabel = document.querySelector('#profileLabel');

const sections = document.getElementsByClassName('section');
const navLabels = document.getElementsByClassName('navLabel');

//-----------------------------------------------------------------------------------------------------------
//home section:
homeSection.style.display="block";
homeLabel.style= "text-decoration-line: underline; text-decoration-style: wavy;text-decoration-color: #fae466; border-color: #fae466";

async function displayHomeSection(){
  for (var i = 0; i < sections.length; i++) {
    sections[i].style.display = 'none';
  }
  for (var i = 0; i < navLabels.length; i++) {
    navLabels[i].style = 'text-decoration-line: none; text-decoration-style: none;';
  }
  homeSection.style.display="block";
  homeLabel.style= "text-decoration-line: underline; text-decoration-style: wavy;text-decoration-color: #fae466; border-color: #fae466";
}

homeBtn.addEventListener('click', () => {
  if (signedIn==false) {
    alert("Please sign in with google.");
  }
  else {
    displayHomeSection();
  }
})
//-----------------------------------------------------------------------------------------------------------
//post section:
rankBtn.addEventListener('click', () => {
  if (signedIn==false) {
    alert("Please sign in with google.");
  }
  else {
    displayPostSection();
    const postSearchBarForm = document.querySelector("#searchBarContainer");
    const searchResults = document.querySelector("#searchResults");
    const searchBarInput = document.querySelector("#searchBar");
    postSearchBarForm.addEventListener('submit', async e =>{
      e.preventDefault();
      var searchInputValue = searchBarInput.value;
      const q = query(collection(db,"objects"), where("tags", "array-contains", searchInputValue));
      const querySnapshot = await getDocs(q);
      var matchingResults = [];
      var matchingIds = [];
      querySnapshot.forEach((doc) => {
        // doc.data() is never undefined for query doc snapshots
        //console.log(doc.id, " => ", doc.data());
        matchingResults.push(doc.data());
        matchingIds.push(doc.id);
      });
      console.log(matchingResults);
      let resultsList = "";
      for (let i=0; i < matchingResults.length; i++) {
        resultsList += "<div><button id = '"+ matchingIds[i]+"' class = 'resultObject'><strong>";
        resultsList += matchingResults[i].name + "</strong></br>"+matchingResults[i].creator;
        resultsList += "</button><div/>";
      }
      searchResults.innerHTML = resultsList;
      addListenersPost(matchingIds,matchingResults);
    })
  }
  
})

async function addListenersPost(matchingIds, matchingResults) {
  for (let i=0; i < matchingIds.length; i++) {
    var currentId = "#" + matchingIds[i];
    //console.log(currentId);

    var currentResult = document.querySelector(currentId);
    //console.log(currentResult);
    const postForm = document.querySelector("#postForm");
    currentResult.addEventListener('click', () => {
      var postFormString = "<strong>"+matchingResults[i].name;
      postFormString += "</strong>";
      postForm.innerHTML = postFormString;
    })
  }
}


async function displayPostSection(){
  for (var i = 0; i < sections.length; i++) {
    sections[i].style.display = 'none';
  }
  for (var i = 0; i < navLabels.length; i++) {
    navLabels[i].style = 'text-decoration-line: none; text-decoration-style: none;';
  }
  rankSection.style.display="block";
  rankLabel.style= "text-decoration-line: underline; text-decoration-style: wavy;text-decoration-color: #fae466; border-color: #fae466";
}

//-----------------------------------------------------------------------------------------------------------
//explore section:
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
//-----------------------------------------------------------------------------------------------------------
//Search section:
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

//-----------------------------------------------------------------------------------------------------------
//Profile section:
const displayUsername = document.querySelector("#displayUsername");
const editNameForm = document.querySelector("#editNameForm");
const profileFollowing = document.querySelector("#profileFollowing");
const profileFollowers = document.querySelector("#profileFollowers");
const profileReputation = document.querySelector("#profileReputation");
const profileTitle = document.querySelector("#profileTitle");
const postCount = document.querySelector("#postCount");



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
    displayProfileSection();
  }
})

async function displayProfileSection() {
    editNameForm.innerHTML ="";
    profileSection.style.display="block";
    profileTitle.innerHTML = "<h1>Your Profile</h1>";
    profileLabel.style= "text-decoration-line: underline; text-decoration-style: wavy;text-decoration-color: #fae466; border-color: #fae466";
    displayUsername.innerHTML = "<h2>"+currentUser.userName+"</h2>";
    profileFollowers.innerHTML = "<h2>"+currentUser.followers.length+"</h2>";
    profileFollowing.innerHTML = "<h2>"+currentUser.following.length+"</h2>";
    profileReputation.innerHTML = "<h2>"+currentUser.reputation+"</h2>";
    postCount.innerHTML = "<h2>"+currentUser.postCount+"</h2>";

    const editNameBtn = document.querySelector("#editName");
    editNameBtn.style.display="inline";
    const submitNameBtn = "&nbsp; <button id='submitButton' class='smallEditBtn'><input value='Submit' type='submit'></button>";
    
    editNameBtn.addEventListener('click', () => {
      editNameBtn.style.display="none";
      editNameForm.innerHTML = "<form id='newNameForm'> <label>Enter your new username:</label>  <input id='newNameInput' type='text'>"+submitNameBtn +"</form>";
      const newNameForm = document.querySelector("#newNameForm");
      const newNameInput = document.querySelector("#newNameInput");

      newNameForm.addEventListener('submit', async e =>{
        var newName = newNameInput.value;
        if (newName =='') {
          alert("Please don't submit an empty username");
        }
        else if(newName.length>16) {
          alert("Usernames must be less than 17 characters.");
        }
        else{
          e.preventDefault();
          editNameForm.innerHTML="";
          currentUser.userName=newName;
          await updateDoc(doc(db,"users", currentUser.userEmail), {
            userName: newName
          });
          displayUser.innerHTML = 'Signed in as: ' + currentUser.userName;
          displayProfileSection();
        }
      })
    })
}
//---------------------------------------------------------------------------------



