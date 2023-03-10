import './style.css'

import { app as firebase } from './javaScript/firebase-config'

import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth'
import { getFirestore, setDoc, doc, getDoc, getDocs, addDoc, updateDoc, collection, query, where, arrayUnion, deleteDoc } from 'firebase/firestore'
import { async } from '@firebase/util';

//---------------------------------------------------------------------------------
var signedIn = false;
const db = getFirestore(firebase)
//---------------------------------------------------------------------------------
//user class
class User {
  constructor(userEmail, userName, followers, following, reputation, postCount, postIds) {
    this.userEmail = userEmail;
    this.userName = userName;
    this.followers = followers;
    this.following = following;
    this.reputation = reputation;
    this.postCount = postCount;
    this.postIds = postIds;
  }
}

//post class:
class Post {
  constructor(userEmail, userName, rank, text, objectName, objectType) {
    this.userEmail = userEmail;
    this.userName = userName;
    this.rank = rank;
    this.text = text;
    this.upvotes = 0;
    this.downvotes = 0;
    this.objectName = objectName;
    this.objectType = objectType;
  }
}

//---------------------------------------------------------------------------------
//handle login/logout:
const auth = getAuth(firebase)
const googleAuthProvider = new GoogleAuthProvider()

const loginBtn = document.querySelector('.login')
const logoutBtn = document.querySelector('.logout')
const displayUser = document.querySelector('.username')

loginBtn.addEventListener('click', async e => {
  e.preventDefault();
  signInWithPopup(auth, googleAuthProvider)
                  .then(auth => console.log(auth))
})

logoutBtn.addEventListener('click', async e => {
  e.preventDefault();
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
      checkAccount(user.email, user.displayName);
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
async function checkAccount(email, name){
  const userRef = doc(db, "users", email);
  const docSnap = await getDoc(userRef);
if (docSnap.exists()) {
  console.log("Returning User:", docSnap.data());
  currentUser = new User(email,docSnap.data().userName, docSnap.data().followers, docSnap.data().following, docSnap.data().reputation, docSnap.data().postCount, docSnap.data().postIds);
} else {
    // doc.data() will be undefined in this case
    console.log("New user!");
    currentUser = new User(email, name, 0, 0, 0, 0);
    await setDoc(doc(db, "users", email), {
      userName: currentUser.userName,
      email: email,
      followers: [],
      following: [],
      reputation: 0,
      postCount:0,
      postIds:[],
      class: "user"
    });
  }
  displayUser.innerHTML = 'Signed in as: ' + currentUser.userName;
}


//---------------------------------------------------------------------------------
//handle nav bar buttons:
const homeBtn = document.querySelector('#homeBtn');
const homeSection = document.querySelector('#home');
const homeLabel = document.querySelector('#homeNavLabel');

const discoverBtn = document.querySelector('#discoverBtn');
const discoverSection = document.querySelector('#discover');
const discoverLabel = document.querySelector('#discoverNavLabel');

const searchBtn = document.querySelector('#searchBtn');
const searchSection = document.querySelector('#search');
const searchLabel = document.querySelector('#searchNavLabel');

const rankBtn = document.querySelector('#rankBtn');
const rankSection = document.querySelector('#rank');
const rankLabel = document.querySelector('#rankNavLabel');

const profileBtn = document.querySelector('#profileBtn');
const profileSection = document.querySelector('#profile');
const profileLabel = document.querySelector('#profileNavLabel');

const sections = document.getElementsByClassName('section');
const navLabels = document.getElementsByClassName('navLabel');
//-----------------------------------------------------------------------------------------------------------
//display section function:
async function displaySection(id) {
  if (signedIn==false) {
    alert("Please sign in with google.");
  }
  else {
    for (var i = 0; i < sections.length; i++) {
      sections[i].style.display = 'none';
      sections[i].innerHTML = "";
    }
    for (var i = 0; i < navLabels.length; i++) {
      navLabels[i].style = 'text-decoration-line: none; text-decoration-style: none;';
    }
    var currentSection = document.querySelector("#"+id);
    currentSection.style.display="block";
    if (id != "objectPopup") {
      var currentNavLabel = document.querySelector("#"+id+"NavLabel");
      currentNavLabel.style= "text-decoration-line: underline; text-decoration-style: wavy;text-decoration-color: #fae466; border-color: #fae466";
    }
    var htmlString;
    if (id == "home") {
      htmlString = "<div class='jumbotron text-center' style='margin-bottom:0'><h1>Home Page</h1></div>";
      currentSection.innerHTML = htmlString;
    }
    else if (id == "discover") {
      htmlString = "<div class='jumbotron text-center' style='margin-bottom:0'> <h1>Explore</h1></div>";
      currentSection.innerHTML = htmlString;
    }
    else if (id == "search") {
     htmlString = "<div class='jumbotron text-center' style='margin-bottom:0'><h1>Search</h1></div>";
     htmlString += "<div id='searchContainer'></div>";
     currentSection.innerHTML = htmlString;
    }
    else if (id == "rank") {
      htmlString = "<div id='rankContainer'><div id='leftSearch'>";
      htmlString += "<div id='rankSearchTitle' class='jumbotron text-center' style='margin-bottom:0'>";
      htmlString += "<h1>Search</h1><form id='searchBarContainer'>";
      htmlString += "<input id='searchBar' type='text'> <button id='searchButton'  class='smallEditBtn'>";
      htmlString += "<img id='searchIcon' src='https://raw.githubusercontent.com/CalColistra/Rank-Anything-App/master/img/searchIcon.png' alt=''></button></form>";
      htmlString += "<div id='searchResults'></div></div></div>";
      htmlString += "<div id='rightCreate'><div id='rankSearchTitle' class='jumbotron text-center' style='margin-bottom:0'>";   
      htmlString += "<h1>Create a post</h1> </div><form id='postForm'>  &#8592; Find something to rank using the search bar on the left.";
      htmlString += "</form></div> </div>";
      currentSection.innerHTML = htmlString;
     }
     else if (id == "profile") {
      htmlString = "<div class='jumbotron text-center' style='margin-bottom:0' id='profileTitle'></div>";
      htmlString += "<div class='profileDisplay'>";
      htmlString += "<div class='profileLabel'>Username:</div>";
      htmlString += "<div class='profileLabel'>Posts:</div><div class='profileLabel'>Followers:</div>";
      htmlString += "<div class='profileLabel'>Following:</div><div class='profileLabel'>Reputation:</div>";
      htmlString += "<div id='profileName'><div id = 'displayUsername'></div> ";
      htmlString +=  "<div id = 'displayUsername'></div><div id = 'displayUsername'></div>";
      htmlString += "<button id='editName' class='smallEditBtn'><img id='editIcon' src='https://raw.githubusercontent.com/CalColistra/Rank-Anything-App/master/img/editIcon.png'>Edit</button>";
      htmlString += "<div id='editNameForm'></div></div>";
      htmlString += "<div id='postCount'></div><div id='profileFollowers'></div> <div id='profileFollowing'></div>"; 
      htmlString += "<div id='profileReputation'></div><div id='followButton'></div>  </div>"; 
      htmlString += "<div class='jumbotron text-center' style='margin-bottom:0' id='profileTitle'>Top Posts</div>"; 
      htmlString += "<div id='profilePosts'></div>";
      currentSection.innerHTML = htmlString;
     }
     else if (id == "objectPopup") {
      htmlString = "<div id='objectPopupContainer'> <div id='objectPopupTop'></div>";
      htmlString += "<div id='objectPopupBottom'> </div> </div>";
      currentSection.innerHTML = htmlString;
     }
  }
}

//-----------------------------------------------------------------------------------------------------------
//Search section:
searchBtn.addEventListener('click', async e => {
  e.preventDefault();
  if (signedIn==false) {
    alert("Please sign in with google.");
  }
  else {
    displaySection("search");
    displaySearchSection();
  }
});
async function displaySearchSection() {
  const searchContainer = document.querySelector("#searchContainer");
  var searchString = "";
  searchString += "<form id='searchBarContainer2'>";
    searchString += "<div></div>";
    searchString += "<input id='searchBar2' type='text'>";
    searchString += "<button id='searchButton'  class='smallEditBtn'>";
    searchString += "<img id='searchIcon' src='https://raw.githubusercontent.com/CalColistra/Rank-Anything-App/master/img/searchIcon.png' alt=''> </button>";
    searchString += "<div></div>";
  searchString += "</form>";
  searchString += "<div id='seachFilterContainer'>";
    searchString += "<div></div>";
    searchString += "<button class='searchFilter' id='searchForAll'>All</button>";
    searchString += "<button class='searchFilter' id='searchForUsers'>Users</button>";
    searchString += "<button class='searchFilter' id='searchForMusic'>Music</button>";
    searchString += "<button class='searchFilter' id='searchForFilm'>Film</button>";
    searchString += "<button class='searchFilter' id='searchForLocation'>Locations</button>";
    searchString += "<button class='searchFilter' id='searchForOther'>Other</button>";
    searchString += "<div></div>";
  searchString += "</div>";
  searchString += "<div id='searchResults2'>";

  searchString += "</div>";
  searchContainer.innerHTML = searchString;
  //filter listeners:
  //const filters = document.getElementsByClassName('searchFilter');
  const userFilter = document.querySelector('#searchForUsers');
  var filterForUser = false;
  userFilter.addEventListener('click', async e =>{
    e.preventDefault();
    if (filterForUser == false) {
      filterForUser = true;
      userFilter.style= "text-decoration-line: underline; text-decoration-style: wavy;text-decoration-color: #fae466; border-color: #fae466";
      filterForAll = false;
      allFilter.style = 'text-decoration-line: none; text-decoration-style: none;';
    }
    else if (filterForUser == true) {
      filterForUser = false;
      userFilter.style = 'text-decoration-line: none; text-decoration-style: none;';
    }
  });
  const musicFilter = document.querySelector('#searchForMusic');
  var filterForMusic = false;
  musicFilter.addEventListener('click', async e =>{
    e.preventDefault();
    if (filterForMusic == false) {
      filterForMusic = true;
      musicFilter.style= "text-decoration-line: underline; text-decoration-style: wavy;text-decoration-color: #fae466; border-color: #fae466";
      filterForAll = false;
      allFilter.style = 'text-decoration-line: none; text-decoration-style: none;';
    }
    else if (filterForMusic == true) {
      filterForMusic = false;
      musicFilter.style = 'text-decoration-line: none; text-decoration-style: none;';
    }
  });
  const filmFilter = document.querySelector('#searchForFilm');
  var filterForFilm = false;
  filmFilter.addEventListener('click', async e =>{
    e.preventDefault();
    if (filterForFilm == false) {
      filterForFilm = true;
      filmFilter.style= "text-decoration-line: underline; text-decoration-style: wavy;text-decoration-color: #fae466; border-color: #fae466";
      filterForAll = false;
      allFilter.style = 'text-decoration-line: none; text-decoration-style: none;';
    }
    else if (filterForFilm == true) {
      filterForFilm = false;
      filmFilter.style = 'text-decoration-line: none; text-decoration-style: none;';
    }
  });
  const locationFilter = document.querySelector('#searchForLocation');
  var filterForLocation = false;
  locationFilter.addEventListener('click', async e =>{
    e.preventDefault();
    if (filterForLocation == false) {
      filterForLocation = true;
      locationFilter.style= "text-decoration-line: underline; text-decoration-style: wavy;text-decoration-color: #fae466; border-color: #fae466";
      filterForAll = false;
      allFilter.style = 'text-decoration-line: none; text-decoration-style: none;';
    }
    else if (filterForLocation == true) {
      filterForLocation = false;
      locationFilter.style = 'text-decoration-line: none; text-decoration-style: none;';
    }
  });
  const otherFilter = document.querySelector('#searchForOther');
  var filterForOther = false;
  otherFilter.addEventListener('click', async e =>{
    e.preventDefault();
    if (filterForOther == false) {
      filterForOther = true;
      otherFilter.style= "text-decoration-line: underline; text-decoration-style: wavy;text-decoration-color: #fae466; border-color: #fae466";
      filterForAll = false;
      allFilter.style = 'text-decoration-line: none; text-decoration-style: none;';
    }
    else if (filterForOther == true) {
      filterForOther = false;
      otherFilter.style = 'text-decoration-line: none; text-decoration-style: none;';
    }
  });
  const allFilter = document.querySelector('#searchForAll');
  var filterForAll = true;
  allFilter.style= "text-decoration-line: underline; text-decoration-style: wavy;text-decoration-color: #fae466; border-color: #fae466";
  allFilter.addEventListener('click', async e =>{
    e.preventDefault();
    if (filterForAll == false) {
      filterForAll = true;
      allFilter.style= "text-decoration-line: underline; text-decoration-style: wavy;text-decoration-color: #fae466; border-color: #fae466";

      filterForUser = false;
      userFilter.style = 'text-decoration-line: none; text-decoration-style: none;';
      filterForMusic = false;
      musicFilter.style = 'text-decoration-line: none; text-decoration-style: none;';
      filterForFilm = false;
      filmFilter.style = 'text-decoration-line: none; text-decoration-style: none;';
      filterForLocation = false;
      locationFilter.style = 'text-decoration-line: none; text-decoration-style: none;';
      filterForOther = false;
      otherFilter.style = 'text-decoration-line: none; text-decoration-style: none;';
    }
    else if (filterForAll == true) {
      filterForAll = false;
      allFilter.style = 'text-decoration-line: none; text-decoration-style: none;';
    }
  });
  
  //submit search listener:
  const searchForm = document.querySelector("#searchBarContainer2");
  searchForm.addEventListener('submit', async e =>{
    const searchbar = document.querySelector('#searchBar2');
    const userInput = searchbar.value;
    e.preventDefault();
    displaySearchResults(userInput, filterForUser, filterForMusic, filterForFilm, filterForLocation, filterForOther, filterForAll);
  });
}

async function displaySearchResults(input, filterForUser, filterForMusic, filterForFilm, filterForLocation, filterForOther, filterForAll) {
  const searchResultsSection = document.querySelector("#searchResults2");
  var resultString = "<div id = 'resultTitle'>Results:</div>";
  //------------------------------------
  //query for objects:
  const q = query(collection(db,"objects"), where("tags", "array-contains", input));
  const querySnapshot = await getDocs(q);
  var matchingResults = [];
  var matchingIds = [];
  querySnapshot.forEach((doc) => {
    // doc.data() is never undefined for query doc snapshots
    //console.log(doc.id, " => ", doc.data());
    matchingResults.push(doc.data());
    matchingIds.push(doc.id);
  });

  const userQuery = query(collection(db,"users"), where("email", "==", input));
  const userSnapshot = await getDocs(userQuery);
  var userResults = [];
  var userIds = [];
  userSnapshot.forEach((doc) => {
    // doc.data() is never undefined for query doc snapshots
    //console.log(doc.id, " => ", doc.data());
    userResults.push(doc.data());
    userIds.push(doc.id);
  });

  let filteredResults = [];
  let filteredIds = [];
  //------------------------------------
  //query for users:
  if (filterForUser == true) {
    for (let i =0; i<userResults.length; i++) {
      filteredResults.push(userResults[i]);
      filteredIds.push(userIds[i]);
    }
  }
  //------------------------------------
  //query for music:
  if (filterForMusic == true) {
    for (let i =0; i<matchingResults.length; i++) {
      let objectClass = matchingResults[i].class;
      if (objectClass == "music") {
        filteredResults.push(matchingResults[i]);
        filteredIds.push(matchingIds[i]);
      }
    }
  }
  //------------------------------------
  //query for Film:
  if (filterForFilm == true) {
    for (let i =0; i<matchingResults.length; i++) {
      let objectClass = matchingResults[i].class;
      if (objectClass == "film") {
        filteredResults.push(matchingResults[i]);
        filteredIds.push(matchingIds[i]);
      }
    }
  }
  //------------------------------------
  //query for location:
  if (filterForLocation == true) {
    for (let i =0; i<matchingResults.length; i++) {
      let objectClass = matchingResults[i].class;
      if (objectClass == "location") {
        filteredResults.push(matchingResults[i]);
        filteredIds.push(matchingIds[i]);
      }
    }
  }
  //------------------------------------
  //query for other:
  if (filterForOther == true) {
    for (let i =0; i<matchingResults.length; i++) {
      let objectClass = matchingResults[i].class;
      if (objectClass == "other") {
        filteredResults.push(matchingResults[i]);
        filteredIds.push(matchingIds[i]);
      }
    }
  }
  //------------------------------------ 
  if (filterForAll == true) {
    filteredResults = userResults;
    filteredIds = userIds;
    for (let i = 0; i<matchingResults.length; i++) {
      filteredResults.push(matchingResults[i]);
      filteredIds.push(matchingIds[i]);
    }

  }
  resultString += "<div id='searchResultContainer'>";

  for (let i =0; i<filteredResults.length; i++) {
    if (filteredResults[i].class == "user") {
      resultString += "<div id='result"+filteredIds[i]+"' class = 'searchResult'>";
      
        resultString += "<div class='objectLabel'>Reputation:</div><div class='objectLabel'>Username:</div><div class='objectLabel'>Posts:</div>";
        let currentRep = filteredResults[i].reputation;
        
        resultString += "<div class='averageRank'>"+currentRep+"</div>";
        let fixedId = fixUserEmail(filteredIds[i]);
        resultString += "<div class='titleValue'><a id='object"+fixedId+"' href='#'>"+filteredResults[i].userName+"</a></div>";
        resultString += "<div><strong>"+filteredResults[i].postCount+"</strong></div>";

      resultString += "</div>";
    }
    else {
      resultString += "<div id='result"+filteredIds[i]+"' class = 'searchResult'>";
      
        resultString += "<div class='objectLabel'>Average Rank:</div><div class='objectLabel'>Title:</div><div class='objectLabel'>Posts:</div>";
        let currentAv = filteredResults[i].averageRanks;
        if (currentAv != 0) {
          currentAv = currentAv.toFixed(1);
        }
        resultString += "<div class='averageRank'>"+currentAv+"</div>";
        resultString += "<div class='titleValue'><a id='object"+filteredIds[i]+"' href='#'>"+filteredResults[i].name+"</a></div>";
        resultString += "<div><strong>"+filteredResults[i].postCount+"</strong></div>";

      resultString += "</div>";
    }
    
  }
  resultString += "</div>";
  searchResultsSection.innerHTML = resultString;
  addListenersForSearchResults(filteredResults, filteredIds);
}
async function addListenersForSearchResults(filteredResults, filteredIds) {
  for (let i =0; i<filteredResults.length; i++) {
    if (filteredResults[i].class == "user") {
      let fixedId = fixUserEmail(filteredIds[i]);
      const userNameLinkRef = document.querySelector('#object'+fixedId);
      userNameLinkRef.addEventListener('click', async e =>{
        e.preventDefault();
      displayProfileSection(filteredIds[i]);
      });
    }
    else {
      const objectLinkRef = document.querySelector('#object'+filteredIds[i]);
      objectLinkRef.addEventListener('click', async e =>{
        e.preventDefault();
        displayObjectPopup(filteredIds[i]);
      });
    }
  }
}
//-----------------------------------------------------------------------------------------------------------
//home section:
homeSection.style.display="block";
homeLabel.style= "text-decoration-line: underline; text-decoration-style: wavy;text-decoration-color: #fae466; border-color: #fae466";



homeBtn.addEventListener('click', async e => {
  e.preventDefault();
  if (signedIn==false) {
    alert("Please sign in with google.");
  }
  else {
    displaySection("home");
  }
})
//-----------------------------------------------------------------------------------------------------------
//post section:
rankBtn.addEventListener('click', async e => {
  e.preventDefault();
  if (signedIn==false) {
    alert("Please sign in with google.");
  }
  else {
    displaySection("rank");
    const postSearchBarForm = document.querySelector("#searchBarContainer");
    const searchResults = document.querySelector("#searchResults");
    const searchBarInput = document.querySelector("#searchBar");
    postSearchBarForm.addEventListener('submit', async e =>{
      e.preventDefault();
      var searchInputValue = searchBarInput.value;
      const postForm = document.querySelector("#postForm");
      if (searchInputValue == "") {
        postForm.innerHTML = "&#8592; Find something to rank using the search bar on the left.";
        searchResults.innerHTML = "";
      }
      else{
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
        //console.log(matchingResults);
        let resultsList = "";
        for (let i=0; i < matchingResults.length; i++) {
          resultsList += "<div><button id = '"+matchingIds[i]+"' class = 'resultObject'><strong>";
          resultsList += matchingResults[i].name + "</strong>";

          //resultsList += "</br>"+matchingResults[i].creator;
          resultsList += "</button></div>";
        }
        searchResults.innerHTML = resultsList;
        addListenersPost(matchingIds);
      }
      
    })
  }
  
})

async function addListenersPost(matchingIds) {
  for (let i=0; i < matchingIds.length; i++) {
    var objectId = matchingIds[i];
    //console.log(objectId);
    var currentId = "#" + objectId;
    var currentResult = document.querySelector(currentId);
    setUpListener(currentResult, objectId);
  }
}

async function setUpListener(currentResult, objectId) {
  //console.log("setting up listener for object: " +objectId);
  currentResult.addEventListener('click', async e => {
    e.preventDefault();
    updatePostForm(objectId);
  })
}

async function updatePostForm(objectId){
  const objectRef = await getDoc(doc(db, "objects", objectId));
  const type = objectRef.data().type;
  const name = objectRef.data().name;
  var postFormString = "<div> <strong>"+name;
      postFormString += "</strong>";
      if ((type == "Song") || (type == "Book") || (type == "Film")) {
        const creator = objectRef.data().creator;
        postFormString += " by " + creator;
      }
      postFormString += "</div>";
      postFormString += "<div id='scaleInput'> <div id = 'postLabel'>Your rank on 0-5 scale: </div>";
      postFormString += "<input type='range' min='0' max='50' value='0' id='rankInput'>";
      postFormString += "<div id='displaySliderValue'> </div>";
      
      postFormString += "</div>";
      postFormString += "<div id='postText'>";
      postFormString += "<div>Add text to your post: </br> (optional) </br></br></div>";
      postFormString += "<textarea id='textArea' maxlength='500'></textarea>";
      postFormString += "</div>";
      postFormString += "</br><button id='publish"+objectId+"' class='publishPostButton' type='submit'>Publish</button></br>";
      postForm.innerHTML = postFormString;
      handlePostInput(name, type, objectId);
}

async function handlePostInput(name, type, objectId) {
  const slider = document.querySelector("#rankInput");
  const displaySliderValue = document.querySelector("#displaySliderValue");
  const publishId = "#publish"+objectId;
  const submitPostBtn = document.querySelector(publishId);
  var sliderValue = 0;
  displaySliderValue.innerHTML = sliderValue;
  slider.oninput = function() {
    sliderValue = this.value;
    sliderValue = sliderValue/10;
    displaySliderValue.innerHTML = sliderValue;
  }

  const textArea = document.querySelector("#textArea");
  submitPostBtn.addEventListener('click', async e =>{
    e.preventDefault();
    //check if user has already made a post for this object:
    const objectRef = await getDoc(doc(db, "objects", objectId));
    if (objectRef.exists()) {
      const docSnap = objectRef.data();
      var postCount = docSnap.postCount;
      //console.log(postCount);
      var postIds = docSnap.postIds;
      var averageRank = docSnap.averageRanks;
      //console.log(postIds);
      if (postIds.includes(currentUser.userEmail)) {
        alert("You have already made a post for " + name);
      }
      else {
        
        if ((type == "Song") || (type == "Book") || (type == "Film")) {
          var userText = textArea.value;
          var objectCreator = docSnap.creator;
          var genre = docSnap.genre;
          var userPost = new Post(currentUser.userEmail, currentUser.userName, sliderValue, userText, name, type, genre);
          var upVotesArray = [];
          var downVotesArray = [];
          //console.log(userPost.text);
          alert("You have successfully published your post about: " + name);
          
          const newPostRef = await addDoc(collection(db, "posts"), {
            publisher: userPost.userEmail,
            publisherName: userPost.userName,
            rank: userPost.rank,
            text: userPost.text,
            objectName: userPost.objectName,
            objectCreator: objectCreator,
            type: userPost.objectType,
            genre: genre,
            upvotes: userPost.upvotes,
            downvotes: userPost.downvotes,
            objectId: objectId,
            upVotesArray: upVotesArray,
            downVotesArray: downVotesArray
          });
          const newPostId = newPostRef.id;
          currentUser.postCount = currentUser.postCount+1;
          currentUser.postIds.push(newPostId);
          await updateDoc(doc(db,"users", currentUser.userEmail), {
            postCount: currentUser.postCount,
            postIds: arrayUnion(newPostId)
          })
        }
        else if ((type == "Band") || (type == "Artist") || (type == "Author") || (type == "Actor")) {
          var userText = textArea.value;
          var userPost = new Post(currentUser.userEmail, currentUser.userName, sliderValue, userText, name, type);
          //console.log(userPost.text);
          alert("You have successfully published your post about: " + name);
          var upVotesArray = [];
          var downVotesArray = [];

          const newPostRef = await addDoc(collection(db, "posts"), {
            publisher: userPost.userEmail,
            publisherName: userPost.userName,
            rank: userPost.rank,
            text: userPost.text,
            objectName: userPost.objectName,
            type: userPost.objectType,
            upvotes: userPost.upvotes,
            downvotes: userPost.downvotes,
            objectId: objectId,
            upVotesArray: upVotesArray,
            downVotesArray: downVotesArray
          });
          const newPostId = newPostRef.id;
          currentUser.postCount = currentUser.postCount+1;
          currentUser.postIds.push(newPostId);
          await updateDoc(doc(db,"users", currentUser.userEmail), {
            postCount: currentUser.postCount,
            postIds: arrayUnion(newPostId)
          })
        }
        var rankTotals = averageRank * postCount;
        rankTotals = rankTotals + userPost.rank;
        postCount = postCount + 1;
        averageRank = rankTotals/postCount;
        //console.log(postCount);
        await updateDoc(doc(db,"objects", objectId), {
          postCount: postCount,
          postIds: arrayUnion(currentUser.userEmail),
          averageRanks: averageRank
        })
      }
    }
    else {
      alert("error finding object");
    }
    
  })
}

//-----------------------------------------------------------------------------------------------------------
//explore section:
discoverBtn.addEventListener('click', () => {
  if (signedIn==false) {
    alert("Please sign in with google.");
  }
  else {
    displaySection("discover");
  }
})

//-----------------------------------------------------------------------------------------------------------
//Profile section:



profileBtn.addEventListener('click', () => {
  if (signedIn==false) {
    alert("Please sign in with google.");
  }
  else {
    displayProfileSection(currentUser.userEmail);
  }
})

async function displayProfileSection(userId) {
    displaySection("profile");
    const displayUsername = document.querySelector("#displayUsername");
    const editNameForm = document.querySelector("#editNameForm");
    const profileFollowing = document.querySelector("#profileFollowing");
    const profileFollowers = document.querySelector("#profileFollowers");
    const profileReputation = document.querySelector("#profileReputation");
    const profileTitle = document.querySelector("#profileTitle");
    const postCount = document.querySelector("#postCount");
    const profilePosts = document.querySelector("#profilePosts");
    const editNameBtn = document.querySelector("#editName");
    const followBtn = document.querySelector("#followButton");
    editNameForm.innerHTML ="";
    profileSection.style.display="block";
    //console.log(userId, currentUser.userEmail);
    if (userId == currentUser.userEmail) {
      followBtn.style.display = "none";
      profileTitle.innerHTML = "<h1>Your Profile</h1>";
      profileLabel.style= "text-decoration-line: underline; text-decoration-style: wavy;text-decoration-color: #fae466; border-color: #fae466";
      displayUsername.innerHTML = "<h2>"+currentUser.userName+"</h2>";
      profileFollowers.innerHTML = "<h2>"+currentUser.followers.length+"</h2>";
      profileFollowing.innerHTML = "<h2>"+currentUser.following.length+"</h2>";
      profileReputation.innerHTML = "<h2>"+currentUser.reputation+"</h2>";
      postCount.innerHTML = "<h2>"+currentUser.postCount+"</h2>";

      
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
      displayProfilePosts(userId);
    }
    else if (userId != currentUser.userEmail) {
      editNameBtn.style.display='none';
      //console.log("in else");
      let userRef = doc(db, "users", userId);
      let userSnap = await getDoc(userRef);
      let followers = userSnap.data().followers;
      let following = userSnap.data().following;
      let isFollowing;
      let followButtonContent;
      if (followers.includes(currentUser.userEmail)) {
        isFollowing = true;
        followButtonContent = "<button id='followBtn'>Unfollow</button>";
      }
      else {
        isFollowing = false;
        followButtonContent = "<button id='followBtn'>Follow</button>";
      }
      followBtn.style.display = "block";
      followBtn.innerHTML = followButtonContent;
      addListenerForFollowBtn(isFollowing, userId, followBtn, followers, profileFollowers);
      profileTitle.innerHTML = "<h1>"+userSnap.data().userName+"'s Profile</h1>";
      displayUsername.innerHTML = "<h2>"+userSnap.data().userName+"</h2>";
      profileFollowers.innerHTML = "<h2>"+followers.length+"</h2>";
      profileFollowing.innerHTML = "<h2>"+following.length+"</h2>";
      profileReputation.innerHTML = "<h2>"+userSnap.data().reputation+"</h2>";
      postCount.innerHTML = "<h2>"+userSnap.data().postCount+"</h2>";
      displayProfilePosts(userId);
    }
    
    
}

async function addListenerForFollowBtn(isFollowing, userId, followBtn, followers, profileFollowers) {
  followBtn.addEventListener('click', async e => {
    e.preventDefault();
    if (isFollowing==false) {
      isFollowing = true;
      followers.push(currentUser.userEmail);
      await updateDoc(doc(db,"users", userId), {
        followers: arrayUnion(currentUser.userEmail)
      });
      if (!(currentUser.following.includes(userId))) currentUser.following.push(userId);
      
      await updateDoc(doc(db,"users", currentUser.userEmail), {
        following: arrayUnion(userId)
      });
      followBtn.innerHTML = "<button id='followBtn'>Unfollow</button>";
    }
    else {
      isFollowing = false;
      let fixedFollowers = [];
      for (let i=0; i<followers.length; i++) {
        if (followers[i] != currentUser.userEmail) {
          fixedFollowers.push(followers[i]);
        }
      }
      await updateDoc(doc(db,"users", userId), {
        followers: fixedFollowers
      });
      let fixedUserFollowers = [];
      for (let i=0; i<currentUser.following.length; i++) {
        if (currentUser.following[i] != userId) {
          fixedUserFollowers.push(currentUser.following[i]);
        }
      }
      currentUser.following = fixedUserFollowers;
      await updateDoc(doc(db,"users", currentUser.userEmail), {
        following: fixedUserFollowers
      });
      followBtn.innerHTML = "<button id='followBtn'>Follow</button>";
      followers = fixedFollowers;
    }
    //console.log(currentUser.following);
    profileFollowers.innerHTML = "<h2>"+followers.length+"</h2>";
  });
}
async function displayProfilePosts(userId) {
  //console.log(currentUser.postIds);
  var profilePostsString = "";
  if (userId == currentUser.userEmail) {
    for (let i = 0; i < currentUser.postIds.length; i++) {
      //console.log("init");
      let currentId = currentUser.postIds[i];
      let postRef = doc(db, "posts", currentId);
      let docSnap = await getDoc(postRef);
      if (docSnap.exists()) {
        
        profilePostsString += "<div id='"+currentId+"' class = 'aPost'>";
        profilePostsString += "<div id='Rank"+currentId+"' class='displayRank'><div id = 'rankPostLabel"+currentId+"' class='profilePostLabel'>";
        profilePostsString += "Rank:</div><div class='rankValue'>"+docSnap.data().rank+"</div></div>";
        profilePostsString += "<div id = 'postContent'>";
        const objectType = docSnap.data().type;
        if ((objectType == "Song") || (objectType == "Film") || (objectType == "Book")) {
          profilePostsString += "<div id = 'leftPostContent'><div id = 'titlePostLabel"+currentId+"' class='profilePostLabel'>Title:</div><a href='#' id='titleValue"+docSnap.data().objectId+"' class='titleValue'>";
          profilePostsString += docSnap.data().objectName+" by "+docSnap.data().objectCreator;
          profilePostsString += "</a></div>";
        }
        else if ((objectType == "Band") ||(objectType == "Artist") || (objectType == "Author") || (objectType == "Actor")) {
          profilePostsString += "<div id = 'leftPostContent'><div id = 'titlePostLabel"+currentId+"' class='profilePostLabel'>Title:</div><a href='#' id='titleValue"+docSnap.data().objectId+"' class='titleValue'>";
          profilePostsString += docSnap.data().objectName;
          profilePostsString += "</a></div>";
        }
            
            let upvotes = docSnap.data().upvotes;
            let downvotes = docSnap.data().downvotes;
            let votes = upvotes - downvotes;
            profilePostsString += "<div id = 'rightPostContent'><div id = 'votesPostLabel"+currentId+"' class='profilePostLabel'>Votes:</div>";
            profilePostsString += "<div class='voteContainer'>";
              profilePostsString += "<div class='voteButtonContainer'>";
                profilePostsString += "<button class='voteArrowBtn' id = 'upVoteBtn"+currentId+"'> <img class='voteArrow' id='upArrow' src='https://raw.githubusercontent.com/CalColistra/Rank-Anything-App/master/img/upArrowIcon.png'> </button>";
                profilePostsString += "<button class='voteArrowBtn' id = 'downVoteBtn"+currentId+"'> <img class='voteArrow' src='https://raw.githubusercontent.com/CalColistra/Rank-Anything-App/master/img/downArrowIcon.png'> </button>";
              profilePostsString += "</div>";
            profilePostsString += "<div class='voteValue' id='voteValue"+currentId+"'>"+votes+"</div>";
            profilePostsString += "</div></div>";
            profilePostsString += "<div id = 'leftPostContent'><div id = 'textPostLabel"+currentId+"' class='profilePostLabel'>Text:</div> <div id='textContainer"+currentId+"' class='textContainer'> <div id='"+currentId+"textValue' class='textValue'>";
            profilePostsString += docSnap.data().text+"</div></div></div>";
            profilePostsString += "<div id = 'deleteBtnContainer"+currentId+"'> <button id='deletePost"+currentId+"'>Delete Post</button>";
            profilePostsString += "<button id='editPost"+currentId+"'><img id='editIcon' src='/assets/editIcon.5de888a8.png'>Edit Post</button></div>"; 
            profilePostsString += "</div>";
        profilePostsString += "</div>";        
        
        
      }
    }
  }
  else {
    //console.log("displaying " + userId+" posts");
    let userRef = doc(db, "users", userId);
    let userSnap = await getDoc(userRef);
    for (let i = 0; i < userSnap.data().postCount; i++) {
      //console.log("init");
      let postIds = userSnap.data().postIds;
      let currentId = postIds[i];
      let postRef = doc(db, "posts", currentId);
      let docSnap = await getDoc(postRef);
      if (docSnap.exists()) {
        
        profilePostsString += "<div id='"+currentId+"' class = 'aPost'>";
        profilePostsString += "<div id='Rank"+currentId+"' class='displayRank'><div id = 'rankPostLabel"+currentId+"' class='profilePostLabel'>";
        profilePostsString += "Rank:</div><div class='rankValue'>"+docSnap.data().rank+"</div></div>";
        profilePostsString += "<div id = 'postContent'>";
        const objectType = docSnap.data().type;
        if ((objectType == "Song") || (objectType == "Film") || (objectType == "Book")) {
          profilePostsString += "<div id = 'leftPostContent'><div id = 'titlePostLabel"+currentId+"' class='profilePostLabel'>Title:</div><a href='#' id='titleValue"+docSnap.data().objectId+"' class='titleValue'>";
          profilePostsString += docSnap.data().objectName+" by "+docSnap.data().objectCreator;
          profilePostsString += "</a></div>";
        }
        else if ((objectType == "Band") ||(objectType == "Artist") || (objectType == "Author") || (objectType == "Actor")) {
          profilePostsString += "<div id = 'leftPostContent'><div id = 'titlePostLabel"+currentId+"' class='profilePostLabel'>Title:</div><a href='#' id='titleValue"+docSnap.data().objectId+"' class='titleValue'>";
          profilePostsString += docSnap.data().objectName;
          profilePostsString += "</a></div>";
        }
            
          let upvotes = docSnap.data().upvotes;
          let downvotes = docSnap.data().downvotes;
          let votes = upvotes - downvotes;
          profilePostsString += "<div id = 'rightPostContent'><div id = 'votesPostLabel"+currentId+"' class='profilePostLabel'>Votes:</div>";
          profilePostsString += "<div class='voteContainer'>";
            profilePostsString += "<div class='voteButtonContainer'>";
              profilePostsString += "<button class='voteArrowBtn' id = 'upVoteBtn"+currentId+"'> <img class='voteArrow' id='upArrow' src='https://raw.githubusercontent.com/CalColistra/Rank-Anything-App/master/img/upArrowIcon.png'> </button>";
              profilePostsString += "<button class='voteArrowBtn' id = 'downVoteBtn"+currentId+"'> <img class='voteArrow' src='https://raw.githubusercontent.com/CalColistra/Rank-Anything-App/master/img/downArrowIcon.png'> </button>";
            profilePostsString += "</div>";
          profilePostsString += "<div class='voteValue' id='voteValue"+currentId+"'>"+votes+"</div>";
          profilePostsString += "</div></div>";
          profilePostsString += "<div id = 'leftPostContent'><div id = 'textPostLabel"+currentId+"' class='profilePostLabel'>Text:</div> <div id='textContainer"+currentId+"' class='textContainer'> <div id='"+currentId+"textValue' class='textValue'>";
          profilePostsString += docSnap.data().text+"</div></div></div>";
          profilePostsString += "<div id = 'deleteBtnContainer"+currentId+"'> <button id='comments"+currentId+"'>Comments</button>";
          profilePostsString += "<button id='editPost"+currentId+"'>Blank button</button></div>"; 
          profilePostsString += "</div>";
        profilePostsString += "</div>";        
        
        
      }
    }
  }
  //console.log(profilePostsString);
  profilePosts.innerHTML = profilePostsString;
  addListenersForPosts(userId);  
}

async function addListenersForPosts(userId) {
  if (userId == currentUser.userEmail) {
    for (let i = 0; i < currentUser.postIds.length; i++) {
      let currentId = currentUser.postIds[i];
      let postRef = doc(db, "posts", currentId);
      let docSnap = await getDoc(postRef);
      // handle voteButton press  --------------------------------------------------------------------------------------
      const upVoteRef = document.querySelector("#upVoteBtn"+currentId);
      const downVoteRef = document.querySelector("#downVoteBtn"+currentId);
      var upVoteArray = docSnap.data().upVotesArray;
      var downVoteArray = docSnap.data().downVotesArray;
      if (upVoteArray.includes(userId)) {
        upVoteRef.innerHTML="<img class='voteArrow' id='upArrow' src='https://raw.githubusercontent.com/CalColistra/Rank-Anything-App/master/img/upArrowIconPressed.png'>";
      }
      else if (downVoteArray.includes(userId)) {
        downVoteRef.innerHTML="<img class='voteArrow' id='upArrow' src='https://raw.githubusercontent.com/CalColistra/Rank-Anything-App/master/img/downArrowIconPressed.png'>";
      }
      await addVoteListeners(upVoteRef, downVoteRef, postRef, currentId);
      // handle title anchor press  --------------------------------------------------------------------------------------
      const currentObjectId = docSnap.data().objectId;
      const titleClickRef = document.querySelector("#titleValue"+currentObjectId);
      
      titleClickRef.addEventListener('click', async e => {
        e.preventDefault();
        displayObjectPopup(currentObjectId);
      });

      // handle edit post button press  --------------------------------------------------------------------------------------
      const editPostId = "#editPost"+currentId;
      const editPostBtnRef = document.querySelector(editPostId);
      const rankRef = document.querySelector("#Rank"+currentId);
      const textRef = document.querySelector("#textContainer"+currentId);
      const editPostContainer = document.querySelector("#deleteBtnContainer"+currentId);
      editPostBtnRef.addEventListener('click', async e => {
        e.preventDefault();
        editPostContainer.innerHTML = "<button id='confirmChanges"+currentId+"'>Confirm Changes</button><button id='cancel"+currentId+"'>Cancel Changes</button>";
        var newRankString;
        newRankString = "<div> <div class = 'profilePostLabel'>Your rank on 0-5 scale: </div>"
    
        let oldRankValue = docSnap.data().rank;
        let sliderValue = oldRankValue;
        oldRankValue = oldRankValue*10;
        newRankString += "<input type='range' min='0' max='50' value='"+oldRankValue+"' id='newRankInput"+currentId+"'>";
        newRankString += "<div id='rankValue"+currentId+"' class='rankValue' > </div>";
        rankRef.innerHTML = newRankString;
        const slider = document.querySelector("#newRankInput"+currentId);
        const displaySliderValue = document.querySelector("#rankValue"+currentId);
        displaySliderValue.innerHTML = oldRankValue/10;
        slider.oninput = function() {
          sliderValue = this.value;
          sliderValue = sliderValue/10;
          displaySliderValue.innerHTML = sliderValue;
        }

        const textLabel = document.querySelector("#textPostLabel"+currentId);
        textLabel.innerHTML = "Edit your text:";
        var newTextString;
        var oldText = docSnap.data().text;
        newTextString = "<textarea id='editTextArea"+currentId+"' class='editTextArea' maxlength='500'>"+oldText+"</textarea>";
        textRef.innerHTML = newTextString;

        const confirmChangesBtn = document.querySelector('#confirmChanges'+currentId);
        confirmChangesBtn.addEventListener('click', async e => {
          e.preventDefault();
          let newTextContent = document.querySelector("#editTextArea"+currentId).value;
          await updateDoc(postRef, {
            rank: sliderValue,
            text: newTextContent
          })
          alert("You have successfully editted your post.");
          displayProfileSection(userId);

          let objectRef = doc(db, "objects", docSnap.data().objectId);
          let objectSnap = await getDoc(objectRef);

          var averageRank = objectSnap.data().averageRanks;
          var postCount = objectSnap.data().postCount;

          var rankTotals = averageRank * postCount;
          rankTotals = rankTotals - (oldRankValue/10);
          rankTotals = rankTotals + sliderValue;
          averageRank = rankTotals/postCount;
          await updateDoc(doc(db,"objects", docSnap.data().objectId), {
            averageRanks: averageRank
          });

        });
        const cancelChangesBtn = document.querySelector('#cancel'+currentId);
        cancelChangesBtn.addEventListener('click', async e => {
          e.preventDefault();
          displayProfileSection(userId);
        });
      });




      // handle delete button press  --------------------------------------------------------------------------------------
      const deleteBtnId = "#deletePost"+currentId;
      const deleteBtnRef = document.querySelector(deleteBtnId);
      const deleteBtnContainer = document.querySelector("#deleteBtnContainer"+currentId);
      deleteBtnRef.addEventListener('click', async e => {
        e.preventDefault();
        var deletePromptString = "";
        deletePromptString += "Are you sure you want to delete this post?</br>";
        deletePromptString += "<button id='sureDelete"+currentId+"'>Yes</button><button id='noDelete'>No</button>";
        deleteBtnContainer.style = "background-color: #ffffff; border-style: solid;";
        deleteBtnContainer.innerHTML = deletePromptString;
        const sureDelete = document.querySelector("#sureDelete"+currentId);
        const noDelete = document.querySelector("#noDelete");
        sureDelete.addEventListener('click', async e => {
          e.preventDefault();
          let postSnap = await getDoc(doc(db, "posts", currentId));
          let objectId = postSnap.data().objectId;
          let oldRank = postSnap.data().rank;
          
          let docSnap = await getDoc(doc(db, "objects", objectId));
          let objectPostCount = docSnap.data().postCount;
          let objectPostIds = docSnap.data().postIds;
          let objectRankAverage = docSnap.data().averageRanks;
          objectRankAverage = objectRankAverage - oldRank;
          let rankTotals = objectRankAverage * objectPostCount;
          let newRankAverage;
          if (objectPostCount == 0) {
            newRankAverage = 0;
          }
          else {
            newRankAverage = rankTotals/objectPostCount;
          }
          let updatedIds = [];
          for (let i = 0; i < objectPostIds.length; i++) {
            if (objectPostIds[i] != currentUser.userEmail) {
              updatedIds.push(objectPostIds[i]);
            }
          }
          objectPostCount = objectPostCount -1;
          await updateDoc(doc(db,"objects", objectId), {
            postIds: updatedIds,
            postCount: objectPostCount,
            averageRanks: newRankAverage
          })
          let userSnap = await getDoc(doc(db, "users", currentUser.userEmail));
          let userPostCount = userSnap.data().postCount;
          let userPostIds = userSnap.data().postIds;
          let updatedUserPostIds = [];
          for (let i = 0; i < userPostIds.length; i++) {
            if (userPostIds[i] != currentId) {
              updatedUserPostIds.push(userPostIds[i]);
            }
          }
          userPostCount = userPostCount -1;
          await updateDoc(doc(db,"users", currentUser.userEmail), {
            postIds: updatedUserPostIds,
            postCount: userPostCount
          })
          await deleteDoc(doc(db, "posts", currentId));
          currentUser.postIds = updatedUserPostIds;
          currentUser.postCount = userPostCount;
          displayProfileSection(userId);
        })
        noDelete.addEventListener('click', async e => {
          displayProfileSection(userId);
        })
      })
    }
  }
  else {
    let userRef = doc(db, "users", userId);
    let userSnap = await getDoc(userRef);
    let postIds = userSnap.data().postIds;
    for (let i = 0; i < postIds.length; i++) {
      let currentId = postIds[i];
      let postRef = doc(db, "posts", currentId);
      let docSnap = await getDoc(postRef);
      // handle voteButton press  --------------------------------------------------------------------------------------
      const upVoteRef = document.querySelector("#upVoteBtn"+currentId);
      const downVoteRef = document.querySelector("#downVoteBtn"+currentId);
      var upVoteArray = docSnap.data().upVotesArray;
      var downVoteArray = docSnap.data().downVotesArray;
      if (upVoteArray.includes(currentUser.userEmail)) {
        upVoteRef.innerHTML="<img class='voteArrow' id='upArrow' src='https://raw.githubusercontent.com/CalColistra/Rank-Anything-App/master/img/upArrowIconPressed.png'>";
      }
      else if (downVoteArray.includes(currentUser.userEmail)) {
        downVoteRef.innerHTML="<img class='voteArrow' id='upArrow' src='https://raw.githubusercontent.com/CalColistra/Rank-Anything-App/master/img/downArrowIconPressed.png'>";
      }
      await addVoteListeners(upVoteRef, downVoteRef, postRef, currentId);
      // handle title anchor press  --------------------------------------------------------------------------------------
      const currentObjectId = docSnap.data().objectId;
      //console.log(currentObjectId);
      const titleClickRef = document.querySelector("#titleValue"+currentObjectId);
      
      titleClickRef.addEventListener('click', async e => {
        e.preventDefault();
        displayObjectPopup(currentObjectId);
      });
    }
  }
}
//---------------------------------------------------------------------------------
async function handleVote(type, postRef, userId, currentId, upVoteRef, downVoteRef) {
  let docSnap = await getDoc(postRef);
  var upVoteArray = docSnap.data().upVotesArray;
  var downVoteArray = docSnap.data().downVotesArray;
  var upVotes = docSnap.data().upvotes;
  var downVotes = docSnap.data().downvotes;
  var postPublisher = docSnap.data().publisher;
  var userRef = doc(db, "users", postPublisher);
  var publisherSnap = await getDoc(userRef);
  var publisherRep = publisherSnap.data().reputation;
  if (type == "up") {
    if (upVoteArray.includes(userId)) {
      var updatedUpVoteArray = [];
        for (let i=0; i<upVoteArray.length; i++) {
          if (upVoteArray[i] != userId) {
            updatedUpVoteArray.push(upVoteArray[i]);
          }
        }
        upVotes = upVotes - 1;
        await updateDoc(postRef, {
          upvotes: upVotes,
          upVotesArray: updatedUpVoteArray
        });
        publisherRep = publisherRep - 1;
        if (postPublisher == currentUser.userEmail) currentUser.reputation =  publisherRep;
        await updateDoc(userRef, {
          reputation: publisherRep
        });
        upVoteRef.innerHTML="<img class='voteArrow' id='upArrow' src='https://raw.githubusercontent.com/CalColistra/Rank-Anything-App/master/img/upArrowIcon.png'>";
    }
    else {
      if (downVoteArray.includes(userId)) {
        var updatedDownVoteArray = [];
        for (let i=0; i<downVoteArray.length; i++) {
          if (downVoteArray[i] != userId) {
            updatedDownVoteArray.push(downVoteArray[i]);
          }
        }
        downVotes = downVotes - 1;
      }
      else updatedDownVoteArray = downVoteArray;
      upVoteArray.push(userId);
      upVotes = upVotes + 1;
      await updateDoc(postRef, {
        upvotes: upVotes,
        downvotes: downVotes,
        upVotesArray: upVoteArray,
        downVotesArray: updatedDownVoteArray
      });
      publisherRep = publisherRep + 1;
      if (postPublisher == currentUser.userEmail) currentUser.reputation =  publisherRep;
      await updateDoc(userRef, {
        reputation: publisherRep
      });
      upVoteRef.innerHTML="<img class='voteArrow' id='upArrow' src='https://raw.githubusercontent.com/CalColistra/Rank-Anything-App/master/img/upArrowIconPressed.png'>";
      downVoteRef.innerHTML="<img class='voteArrow' id='upArrow' src='https://raw.githubusercontent.com/CalColistra/Rank-Anything-App/master/img/downArrowIcon.png'>";
    }
  }
  else if (type == "down") {
    if (downVoteArray.includes(userId)) {
      var updatedDownVoteArray = [];
        for (let i=0; i<downVoteArray.length; i++) {
          if (downVoteArray[i] != userId) {
            updatedDownVoteArray.push(upVoteArray[i]);
          }
        }
        downVotes = downVotes - 1;
        await updateDoc(postRef, {
          downvotes: downVotes,
          downVotesArray: updatedDownVoteArray
        });
        downVoteRef.innerHTML="<img class='voteArrow' id='upArrow' src='https://raw.githubusercontent.com/CalColistra/Rank-Anything-App/master/img/downArrowIcon.png'>";
    }
    else {
      if (upVoteArray.includes(userId)) {
        var updatedUpVoteArray = [];
        for (let i=0; i<upVoteArray.length; i++) {
          if (upVoteArray[i] != userId) {
            updatedUpVoteArray.push(upVoteArray[i]);
          }
        }
        upVotes = upVotes - 1;
        publisherRep = publisherRep - 1;
        if (postPublisher == currentUser.userEmail) currentUser.reputation =  publisherRep;
        await updateDoc(userRef, {
          reputation: publisherRep
        });
      }
      else updatedUpVoteArray = upVoteArray;
      downVoteArray.push(userId);
      downVotes = downVotes + 1;
      await updateDoc(postRef, {
        upvotes: upVotes,
        downvotes: downVotes,
        upVotesArray: updatedUpVoteArray,
        downVotesArray: downVoteArray
      });
      upVoteRef.innerHTML="<img class='voteArrow' id='upArrow' src='https://raw.githubusercontent.com/CalColistra/Rank-Anything-App/master/img/upArrowIcon.png'>";
      downVoteRef.innerHTML="<img class='voteArrow' id='upArrow' src='https://raw.githubusercontent.com/CalColistra/Rank-Anything-App/master/img/downArrowIconPressed.png'>";
    }
  }
  var voteValueRef = document.querySelector("#voteValue"+currentId);
  var voteValue = upVotes-downVotes;
  //console.log(voteValueRef);
  //console.log(upVotes + " - " +downVotes);
  voteValueRef.innerHTML = voteValue; 
}
//---------------------------------------------------------------------------------
// display object popup section:

async function displayObjectPopup(objectId) {
  displaySection("objectPopup");
  let docSnap = await getDoc(doc(db, "objects", objectId));
  const q = query(collection(db,"posts"), where("objectId", "==", objectId));
  const querySnapshot = await getDocs(q);
  var rankTotals = 0;
  let postIds = [];
  querySnapshot.forEach((doc) => {
    // doc.data() is never undefined for query doc snapshots
    //console.log(doc.id, " => ", doc.data());
    rankTotals = rankTotals + doc.data().rank;
    postIds.push(doc.id);
  });
  let objectLinkIds = [];
  let objectIds = [];
  const objectPostCount = docSnap.data().postCount;
  var averageRank = rankTotals/objectPostCount;
  averageRank = averageRank.toFixed(1);
  const topDisplay = document.querySelector("#objectPopupTop");
  const bottomDisplay = document.querySelector("#objectPopupBottom");
  const type = docSnap.data().type;
  var topString;
  topString = "<div id='leftObjectContent'><div class='objectLabel'>Average Rank:</div>";
  topString += "<div class='averageRank'>"+averageRank+"</div>";
  topString += "</div>";
  topString += "<div id='rightObjectContent'><div class='objectLabel'>Title:</div>";
  if ((type == "Song") || (type == "Film") || (type == "Book")) {
    topString += "<div class='objectLabel'>Release Date:</div>";
  }
  else if ((type == "Band")) {
    topString += "<div class='objectLabel'>Established:</div>";
  }
  else if ((type == "Artist") || (type == "Author") || (type == "Actor")) {
    topString += "<div class='objectLabel'>Born:</div>";
  }
 
  topString += "<div class='titleValue'><strong>"+docSnap.data().name+"</strong>";
 
  if ((type == "Song") || (type == "Film") || (type == "Book")) {
    const q = query(collection(db,"objects"), where("name", "==", docSnap.data().creator));
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
      // doc.data() is never undefined for query doc snapshots
      //console.log(doc.id, " => ", doc.data());
      objectLinkIds.push("#creator"+doc.id);
      objectIds.push(doc.id);
      topString += "</br>&nbsp;&nbsp;&nbsp;<a id='creator"+doc.id+"' href='#'>"+docSnap.data().creator+"</a>";
    });
  }
  else if ((type == "Band") || (type == "Artist") || (type == "Author") || (type == "Actor")) {
    topString += "&nbsp;&nbsp;&nbsp;<a href='#'></a>";
  }
  topString += "</div>";
  if ((type == "Song") || (type == "Film") || (type == "Book")) {
    topString += "<div><strong>"+docSnap.data().releaseDate+"</strong></br>";
  }
  else if ((type == "Band")) {
    topString += "<div><strong>"+docSnap.data().established+"</strong></br>";
  }
  else if ( (type == "Artist") || (type == "Author") || (type == "Actor")) {
    topString += "<div><strong>"+docSnap.data().born+"</strong></br>";
  }
 
 
  if (objectPostCount == 1) var haveRanked = "<strong>"+objectPostCount+"</strong> user has ranked "+docSnap.data().name;
  else var haveRanked = "<strong>"+objectPostCount+"</strong> users have ranked "+docSnap.data().name;
  topString += haveRanked;
  topString += "</div>";
  topString += "</div>";
  topDisplay.innerHTML = topString;
  var bottomString;
  bottomString = "<h4>Top Posts for "+docSnap.data().name+"</h4>";
  bottomString += "<div id='objectPopupPosts'>";
  var publisherLinkIds = [];
  var publisherIds = [];
  for (let i = 0; i < postIds.length; i++) {
    var currentPostId = postIds[i];
    let postSnap = await getDoc(doc(db, "posts", currentPostId));
    bottomString += "<div class='displayPublisherName'> <p class='profilePostLabel' style='display: inline; padding:0;'>User: </p>";
    let notFixedUserId = postSnap.data().publisher;
    let fixedId = fixUserEmail(notFixedUserId);
    bottomString += "<a href='#'  id='publisherName"+fixedId+"' 'display: inline-block;'>"+postSnap.data().publisherName+"</a>";
    let userSnap = await getDoc(doc(db, "users", postSnap.data().publisher));
    bottomString += "&nbsp;&nbsp;&nbsp; <p class='profilePostLabel' style='display: inline; padding:0;'>Rep: </p>"+userSnap.data().reputation;
    bottomString += "</div>";
    
    publisherLinkIds.push("#publisherName"+fixedId);
    publisherIds.push(postSnap.data().publisher);
    bottomString += "<div id ='objectPost"+currentPostId+"' class='aPost'>";
      

        bottomString += "<div class='displayRank'>";
          bottomString += "<div class='profilePostLabel'>Rank:</div>";
          bottomString += "<div class='rankValue'>"+postSnap.data().rank+"</div>";
        bottomString += "</div>";

        bottomString += "<div id='postContent'>";

            bottomString += "<div id = 'leftPostContent'><div id = 'titlePostLabel"+currentPostId+"' class='profilePostLabel'>Title:</div><div class='titleValue'>";
            bottomString += "<strong>"+postSnap.data().objectName+"</strong> by "+postSnap.data().objectCreator;
            bottomString += "</div></div>";
            let upvotes = postSnap.data().upvotes;
            let downvotes = postSnap.data().downvotes;
            let votes = upvotes - downvotes;
            bottomString += "<div id = 'rightPostContent'><div id = 'votesPostLabel"+currentPostId+"' class='profilePostLabel'>Votes:</div>";
            bottomString += "<div class='voteContainer'> <div class='voteButtonContainer'>";
            bottomString += "<button class='voteArrowBtn' id = 'upVoteBtn"+currentPostId+"'> <img class='voteArrow' id='upArrow' src='https://raw.githubusercontent.com/CalColistra/Rank-Anything-App/master/img/upArrowIcon.png'> </button>";
            bottomString += "<button class='voteArrowBtn' id = 'downVoteBtn"+currentPostId+"'> <img class='voteArrow' src='https://raw.githubusercontent.com/CalColistra/Rank-Anything-App/master/img/downArrowIcon.png'> </button>";
            bottomString += "</div>"
            bottomString += "<div id='voteValue"+currentPostId+"'>"+votes+"</div></div></div>";
            bottomString += "<div id = 'leftPostContent'><div id = 'textPostLabel"+currentPostId+"' class='profilePostLabel'>Text:</div> <div id='textContainer"+currentPostId+"' class='textContainer'> <div id='"+currentPostId+"textValue' class='textValue'>";
            bottomString += postSnap.data().text+"</div></div></div>";
            bottomString += "</div>";

        bottomString += "</div>"; 
  }
  bottomString += "</div>";
  bottomDisplay.innerHTML = bottomString;
  addListenersForObjectPage(objectLinkIds, objectIds, publisherLinkIds, publisherIds, postIds);
}

async function addListenersForObjectPage(objectLinkIds, objectIds, publisherLinkIds, publisherIds, postIds) {
  for (let i=0; i<objectLinkIds.length; i++) {
    addListenersForObjectPage2(objectIds[i], objectLinkIds[i]);
  }
  for (let i=0; i<publisherLinkIds.length; i++) {
    addListenersForObjectPage3(publisherIds[i], publisherLinkIds[i]);
  }
  // handle voteButton press  --------------------------------------------------------------------------------------
  for (let i = 0; i<postIds.length; i++) {
    var currentId = postIds[i];
    //console.log(currentId);
    var upVoteRef = document.querySelector("#upVoteBtn"+currentId);
    //console.log(upVoteRef);
    var downVoteRef = document.querySelector("#downVoteBtn"+currentId);
    let postRef = doc(db, "posts", currentId);
    let docSnap = await getDoc(postRef);
    var upVoteArray = docSnap.data().upVotesArray;
    var downVoteArray = docSnap.data().downVotesArray;
    //console.log(downVoteArray);
    if (upVoteArray.includes(currentUser.userEmail)) {
      upVoteRef.innerHTML="<img class='voteArrow' id='upArrow' src='https://raw.githubusercontent.com/CalColistra/Rank-Anything-App/master/img/upArrowIconPressed.png'>";
    }
    else if (downVoteArray.includes(currentUser.userEmail)) {
      downVoteRef.innerHTML="<img class='voteArrow' id='upArrow' src='https://raw.githubusercontent.com/CalColistra/Rank-Anything-App/master/img/downArrowIconPressed.png'>";
    }
    await addVoteListeners(upVoteRef, downVoteRef, postRef, currentId);
  }
}

async function addVoteListeners(upVoteRef, downVoteRef, postRef, currentId) {
  upVoteRef.addEventListener('click', async e => {
    e.preventDefault();
    handleVote("up", postRef, currentUser.userEmail, currentId, upVoteRef, downVoteRef);
  });
  downVoteRef.addEventListener('click', async e => {
    e.preventDefault();
    handleVote("down", postRef, currentUser.userEmail, currentId, upVoteRef, downVoteRef);
  });
}


async function addListenersForObjectPage2(objectId, linkRef) {
  var currentLinkRef = document.querySelector(linkRef);
  currentLinkRef.addEventListener('click', async e => {
    e.preventDefault();
    for (var i = 0; i < sections.length; i++) {
      sections[i].style.display = 'none';
    }
    for (var i = 0; i < navLabels.length; i++) {
      navLabels[i].style = 'text-decoration-line: none; text-decoration-style: none;';
    }
    displayObjectPopup(objectId);
  });
}

async function addListenersForObjectPage3(userId, linkRef) {
  var currentLinkRef = document.querySelector(linkRef);
  currentLinkRef.addEventListener('click', async e => {
    e.preventDefault();
    for (var i = 0; i < sections.length; i++) {
      sections[i].style.display = 'none';
    }
    for (var i = 0; i < navLabels.length; i++) {
      navLabels[i].style = 'text-decoration-line: none; text-decoration-style: none;';
    }
    //console.log("calling displayProfileSection(" +userId);
    displayProfileSection(userId);
  });
}

function fixUserEmail(notFixedUserId){ 
  let fixedUserId = "";
  let stringLen = notFixedUserId.length;
  for (let i=0; i < stringLen; i++) {
    let currentLetter = notFixedUserId[i];
    if (currentLetter == "@") {
      fixedUserId = fixedUserId + 'AT';
    }
    else if (currentLetter ==".") {
      fixedUserId = fixedUserId + 'DOT';
    }
    else {
      fixedUserId = fixedUserId + currentLetter;
    }

  }
  return fixedUserId;
}
