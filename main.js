import './style.css'

import { app as firebase } from './javaScript/firebase-config'

import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth'
import { getFirestore, setDoc, doc, getDoc, getDocs, addDoc, updateDoc, collection, query, where, arrayUnion, deleteDoc, orderBy, limit } from 'firebase/firestore'
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
  constructor(userEmail, userName, rank, text, objectName, objectType, postDate) {
    this.userEmail = userEmail;
    this.userName = userName;
    this.rank = rank;
    this.text = text;
    this.upvotes = 0;
    this.downvotes = 0;
    this.objectName = objectName;
    this.objectType = objectType;
    this.postDate = postDate;
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
  displaySection("home");
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
  displaySection("home");
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
      htmlString = "<div class='jumbotron text-center' style='margin-bottom:0'><h1>Your Feed</h1>";
      htmlString += "</div>";
      htmlString += "<div class = 'homeBody'></div>";
      currentSection.innerHTML = htmlString;
      displayHomeFeed(true, 'date');
    }
    else if (id == "discover") {
      htmlString = loadingGif;
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
  searchString += "<div id='searchFilterContainer'>";
    searchString += "<div></div>";
    searchString += "<button class='searchFilter' id='searchForArtists'>Artists</button>";
    searchString += "<button class='searchFilter' id='searchForSongs'>Songs</button>";
    searchString += "<button class='searchFilter' id='searchForAlbums'>Albums</button>";
    searchString += "<button class='searchFilter' id='searchForUsers'>Users</button>";
    searchString += "<div></div>";
    
  searchString += "</div>";
  searchString += "</br><p class='alert' id='noFilterAlert'>** You must choose a filter to search ** </p>";
  searchString += "<div id='searchResults2'>";

  searchString += "</div>";
  searchContainer.innerHTML = searchString;
  //filter listeners:
  //const filters = document.getElementsByClassName('searchFilter');
  var filterChoice;
  const userFilter = document.querySelector('#searchForUsers');
  const artistFilter = document.querySelector('#searchForArtists');
  const albumFilter = document.querySelector('#searchForAlbums');
  const songFilter = document.querySelector('#searchForSongs');
  var filterElements = [userFilter,artistFilter,albumFilter,songFilter];
  var filterForUser = false;
  userFilter.addEventListener('click', async e =>{
    e.preventDefault();
    if (filterForUser == false) {
      filterForUser = true;
      userFilter.style= "text-decoration-line: underline; text-decoration-style: wavy;text-decoration-color: #fae466; border-color: #fae466";
      filterChoice = 'users';
      for (let element = 0; element < filterElements.length; element++) {
        let currentElement = filterElements[element];
        if (currentElement != userFilter) {
          currentElement.style = 'text-decoration-line: none; text-decoration-style: none;';
        }
      }
      alertFilterMsg.style.display = 'none';
    }
    else if (filterForUser == true) {
      filterForUser = false;
      userFilter.style = 'text-decoration-line: none; text-decoration-style: none;';
      filterChoice = null;
      alertFilterMsg.style.display = 'block';
    }
  });
 
  var filterForArtist = false;
  artistFilter.addEventListener('click', async e =>{
    e.preventDefault();
    if (filterForArtist == false) {
      filterForArtist = true;
      artistFilter.style= "text-decoration-line: underline; text-decoration-style: wavy;text-decoration-color: #fae466; border-color: #fae466";
      filterChoice = 'artist';
      for (let element = 0; element < filterElements.length; element++) {
        let currentElement = filterElements[element];
        if (currentElement != artistFilter) {
          currentElement.style = 'text-decoration-line: none; text-decoration-style: none;';
        }
      }
      alertFilterMsg.style.display = 'none';
    }
    else if (filterForArtist == true) {
      filterForArtist = false;
      artistFilter.style = 'text-decoration-line: none; text-decoration-style: none;';
      filterChoice = null;
      alertFilterMsg.style.display = 'block';
    }
  });
 
  var filterForAlbums = false;
  albumFilter.addEventListener('click', async e =>{
    e.preventDefault();
    if (filterForAlbums == false) {
      filterForAlbums = true;
      albumFilter.style= "text-decoration-line: underline; text-decoration-style: wavy;text-decoration-color: #fae466; border-color: #fae466";
      filterChoice = 'album';
      for (let element = 0; element < filterElements.length; element++) {
        let currentElement = filterElements[element];
        if (currentElement != albumFilter) {
          currentElement.style = 'text-decoration-line: none; text-decoration-style: none;';
        }
      }
      alertFilterMsg.style.display = 'none';
    }
    else if (filterForAlbums == true) {
      filterForAlbums = false;
      albumFilter.style = 'text-decoration-line: none; text-decoration-style: none;';
      filterChoice = null;
      alertFilterMsg.style.display = 'block';
    }
  });
  
  
  var filterForSongs = false;
  songFilter.addEventListener('click', async e =>{
    e.preventDefault();
    if (filterForSongs == false) {
      filterForSongs = true;
      songFilter.style= "text-decoration-line: underline; text-decoration-style: wavy;text-decoration-color: #fae466; border-color: #fae466";
      filterChoice = 'song';
      for (let element = 0; element < filterElements.length; element++) {
        let currentElement = filterElements[element];
        if (currentElement != songFilter) {
          currentElement.style = 'text-decoration-line: none; text-decoration-style: none;';
        }
      }
      alertFilterMsg.style.display = 'none';
    }
    else if (filterForSongs == true) {
      filterForSongs = false;
      songFilter.style = 'text-decoration-line: none; text-decoration-style: none;';
      filterChoice = null;
      alertFilterMsg.style.display = 'block';
    }
  });

  var alertFilterMsg = document.querySelector('#noFilterAlert');
  //submit search listener:
  const searchForm = document.querySelector("#searchBarContainer2");
  searchForm.addEventListener('submit', async e =>{
    const searchbar = document.querySelector('#searchBar2');
    const userInput = searchbar.value;
    e.preventDefault();
    if (filterChoice == null) {
      alertFilterMsg.style.display = 'block';
    }
    else {
      displaySearchResults(userInput, filterChoice);
    }
  });
}

async function displaySearchResults(input, filterChoice) {
  const searchResultsSection = document.querySelector("#searchResults2");
  var resultString = "<div id = 'resultTitle'>Results:</div>";
  var matchingResults = [];
  var matchingIds = [];
  //------------------------------------
  //query for objects:
  console.log(filterChoice);
  if (filterChoice != 'users') {
    const q = query(collection(db,"objects"), where("tags", "array-contains", input), where("type", "==", filterChoice), limit(20));
    //const q = query(collection(db,"objects"), where("tags", "array-contains", input), where("type", "==", filterChoice), orderBy("averageRanks"), limit(20));
    const querySnapshot = await getDocs(q);

    querySnapshot.forEach((doc) => {
      // doc.data() is never undefined for query doc snapshots
      //console.log(doc.id, " => ", doc.data());
      matchingResults.push(doc.data());
      matchingIds.push(doc.id);
    });
    console.log(matchingResults);
  }
else if (filterChoice == 'users') {
  const userQuery = query(collection(db,"users"), where("email", "==", input));
  const userSnapshot = await getDocs(userQuery);
  var userResults = [];
  var userIds = [];
  userSnapshot.forEach((doc) => {
    // doc.data() is never undefined for query doc snapshots
    //console.log(doc.id, " => ", doc.data());
    matchingResults.push(doc.data());
    matchingIds.push(doc.id);
  });
}
  //------------------------------------


  resultString += "<div id='searchResultContainer'>";

  for (let i =0; i<matchingResults.length; i++) {
    if (matchingResults[i].class == "user") {
      resultString += "<div id='result"+matchingIds[i]+"' class = 'searchResult'>";
      
        resultString += "<div class='objectLabel'>Reputation:</div><div class='objectLabel'>Username:</div><div class='objectLabel'>Posts:</div>";
        let currentRep = matchingResults[i].reputation;
        
        resultString += "<div class='averageRank'>"+currentRep+"</div>";
        let fixedId = fixUserEmail(matchingIds[i]);
        resultString += "<div class='titleValue'><a id='object"+fixedId+"' href='#'>"+matchingResults[i].userName+"</a></div>";
        resultString += "<div><strong>"+matchingResults[i].postCount+"</strong></div>";

      resultString += "</div>";
    }
    else {
      resultString += "<div id='result"+matchingIds[i]+"' class = 'searchResult'>";
      
        resultString += "<div class='objectLabel'>Average Rank:</div><div class='objectLabel'>Title:</div><div class='objectLabel'>Posts:</div>";
        let currentAv = matchingResults[i].averageRanks;
        if (currentAv != 0) {
          currentAv = currentAv.toFixed(1);
        }
        if (isNaN(currentAv)) {
          currentAv = 0;
        }
        resultString += "<div class='averageRank'>"+currentAv+"</div>";
        resultString += "<div class='titleValue'><a id='object"+matchingIds[i]+"' href='#'>"+matchingResults[i].name+"</a></div>";
        resultString += "<div><strong>"+matchingResults[i].postCount+"</strong></div>";

      resultString += "</div>";
    }
    
  }
  resultString += "</div>";
  searchResultsSection.innerHTML = resultString;
  addListenersForSearchResults(matchingResults, matchingIds);
}
async function addListenersForSearchResults(matchingResults, matchingIds) {
  for (let i =0; i<matchingResults.length; i++) {
    if (matchingResults[i].class == "user") {
      let fixedId = fixUserEmail(matchingIds[i]);
      const userNameLinkRef = document.querySelector('#object'+fixedId);
      userNameLinkRef.addEventListener('click', async e =>{
        e.preventDefault();
      displayProfileSection(matchingIds[i]);
      });
    }
    else {
      const objectLinkRef = document.querySelector('#object'+matchingIds[i]);
      objectLinkRef.addEventListener('click', async e =>{
        e.preventDefault();
        displayObjectPopup(matchingIds[i]);
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
const loadingGif = "<img class='loadingGif' src='https://raw.githubusercontent.com/CalColistra/Rank-Anything-App/master/img/loadingGif.gif'>";

async function displayHomeFeed(firstLoad, sortType, postIdDict, postDatas) {
  const homeBody = document.querySelector('.homeBody');
  homeBody.innerHTML = loadingGif;
  if (firstLoad == true) {
    const userRef = await getDoc(doc(db, "users", currentUser.userEmail));
    var followingUsers = userRef.data().following;
    var allFeedPostIds = [];
    for (let i = 0; i <followingUsers.length; i++) {
      let current = followingUsers[i];
      let followingrRef = await getDoc(doc(db, "users", current));
      let currentPosts = followingrRef.data().postIds;
      for (let j = 0; j < currentPosts.length; j++){
        let currentPostId = currentPosts[j];
        allFeedPostIds.push(currentPostId);
      }
    }
    var postDates = [];
    var postRanks = [];
    var postVotes = [];
    var publisherIds = [];
    //console.log(allFeedPostIds);
    for (let i = 0; i < allFeedPostIds.length; i++) {
      let currentPostRef = await getDoc(doc(db, "posts", allFeedPostIds[i]));
      let currentPostDate = currentPostRef.data().datePublished;
      let currentPublisher = currentPostRef.data().publisher;
      publisherIds.push(currentPublisher);
      let splitString = currentPostDate.split("/");
      let month = splitString[0];
      month = Number(month);
      month = month - 1;
      let day = splitString[1];
      if (day.length == 1) {
        day = '0'+day;
      }
  
      let year = splitString[2];
      year = year.substring(0,4);
      let time = splitString[2];
      time = time.substring(8);
      let last2 = time.slice(-2);
      let hrSplit = time.split(":");
      let hrToNum = Number(hrSplit[0]);
      if ((last2 == 'PM')&&(hrToNum != 12)) {
        hrToNum = hrToNum +12;
      }
      else if ((last2 == 'AM')&&(hrToNum == 12)) {
        hrToNum = 24;
      }
      let min = hrSplit[1];
      min = min.split(" ");
      min = min[0];
      
      /*
      console.log(min);
      console.log(last2);
      console.log(hrToNum);
      console.log('time: '+ time);
      console.log('day: '+ day);
      console.log('month: '+ month);
      console.log('year: '+ year);
      */
      var postDate = new Date(Number(year), month, Number(day), Number(hrToNum), Number(min));
      //console.log(postDate);
      postDates.push(postDate);
      let upvote = Number(currentPostRef.data().upvotes);
      let downvote = Number(currentPostRef.data().downvotes);
      let currentPostVote = upvote - downvote;
      postVotes.push(Number(currentPostVote));
      postRanks.push(currentPostRef.data().rank);
    }
    
    let postIdDict = [];
    for (let j =0; j<postDates.length;j++) {
      postIdDict[j] = {
        id: allFeedPostIds[j],
        date: postDates[j],
        publisherId: publisherIds[j],
        rank: postRanks[j],
        vote: postVotes[j]
      }
    }
    
    /*
    console.log(postIdDict[0]);
    console.log(postIdDict[1]);
    let placeHolder = postIdDict[0];
    postIdDict[0] = postIdDict[1];
    postIdDict[1] =  placeHolder;
    
    console.log(postIdDict[0]);
    console.log(postIdDict[1]);
  */
    //console.log(postIdDict);
    postIdDict.sort((d1,d2)=> d1.date - d2.date);
    //console.log(postIdDict);
    let feedString = '';
    var sortUpIcon = 'https://raw.githubusercontent.com/CalColistra/Rank-Anything-App/master/img/sortUpIcon.png';
    var sortDownIcon = 'https://raw.githubusercontent.com/CalColistra/Rank-Anything-App/master/img/sortDownIcon.png';
    var postRefs = [];
    var postDatas = [];
    var objectIds = [];
  
    for (let i = postIdDict.length-1; i >= 0; i-- ){
      let currentPostRef2 = doc(db, "posts", postIdDict[i].id);
      let currentPostRef1 = await getDoc(doc(db, "posts", postIdDict[i].id));
      postRefs[i] = currentPostRef2;
      postDatas[i] = currentPostRef1;
      
      let currentPostRef = currentPostRef1.data();
      let currentPublisherRef = await getDoc(doc(db, "users", currentPostRef.publisher));
      currentPublisherRef = currentPublisherRef.data();
      let objectRef1 = await getDoc(doc(db, "objects", currentPostRef.objectId));
      let objectRef = objectRef1.data();
      objectIds[i] = objectRef1.id;
      feedString += "<div class='feedSortContainer'></div>";
      feedString += "<div class='aFeed' id='"+postIdDict[i].id+"'>";
        feedString += "<div class = 'displayPublisherName'><nobr><p class='profilePostLabel'  style='display: inline;'>User: </p><a href='#' id='publisher"+postIdDict[i].id;
        feedString += "'>";
        feedString += currentPostRef.publisherName+"</a>";
        feedString += "&nbsp;&nbsp;&nbsp;<p class='profilePostLabel'  style='display: inline;'>Rep: </p><p style='display:inline'>"+currentPublisherRef.reputation+"</p></nobr></div>";
        feedString += "<div class = 'feedPostContent'> <img class='objectImg4' src = '"+objectRef.imgUrl+"' style='width:100%;'>";
          feedString += "<div class='rightFeedContent'>";
            feedString += "<div class='rightFeedLabels'>";
            if (objectRef.type == 'artist') {
              feedString += "<div class='profilePostLabel'>Artist:</div>";
            }
            else if (objectRef.type == 'album') {
              feedString += "<div class='profilePostLabel'>Album:</div>";
            }
            else if (objectRef.type == 'song') {
              feedString += "<div class='profilePostLabel'>Song:</div>";
            }
            feedString += "<nobr><div class='profilePostLabel'>"+currentPostRef.publisherName+"'s Rank:&nbsp;"
            feedString += "<div class='rankValue' style='margin:0;display:inline;'>"+currentPostRef.rank+"</div> </div></nobr>";
            if (objectRef.class == 'music') {
              feedString += "<div class='profilePostLabel'><strong><a href='"+objectRef.spotifyLink+"' target='_blank'>Listen on Spotify</a></strong></div>";
            }
            feedString += "</div>";//end labels
            let upvotes = currentPostRef.upvotes;
            let downvotes = currentPostRef.downvotes;
            let votes = upvotes - downvotes;
            feedString += "<div class='rightFeedTitles'>"; 
              feedString += "<a href='#'' id='titleValue"+objectRef1.id+"' class='titleValue'>"+objectRef.name+"</a>";
              feedString += "<div class='voteContainer'>";
              feedString += "<div class='voteButtonContainer'><button class='voteArrowBtn' id='upVoteBtn"+currentPostRef1.id+"'><img class='voteArrow' id='upArrow' src='https://raw.githubusercontent.com/CalColistra/Rank-Anything-App/master/img/upArrowIcon.png'></button>";
              feedString += "<button class='voteArrowBtn' id='downVoteBtn"+currentPostRef1.id+"'> <img class='voteArrow' src='https://raw.githubusercontent.com/CalColistra/Rank-Anything-App/master/img/downArrowIcon.png'> </button></div>";
              feedString += "<div class='voteValue' id='voteValue"+currentPostRef1.id+"'>"+votes+"</div>";
              feedString += "</div>";
            feedString += "</div>";
            feedString += "<div class='rightFeedTitles'>"; 
              feedString += "<div class='textValue'>&nbsp;<p class='profilePostLabel'  style='display: inline;'>Text: </p> "+currentPostRef.text+"</div>";
              feedString += "<div><button id='comment"+currentPostRef1.id+"'>Comment</button> <div class='profileLabel'>Published:<br>"+currentPostRef.datePublished+"</div></div>";
            feedString += "</div>";
          feedString += "</div>";
        feedString += "</div>";
      feedString += "</div>";
      //console.log(currentPostRef);
    }
    homeBody.innerHTML = feedString;
    let sortString = "Sorting by <button class='changeSort' id='sortType"+sortType+"'>"+sortType+"</button> ";
    sortString += "<button id='sortDirectionUp' class='sortDirection'><img class='sortDirectionImg' src='"+sortUpIcon+"'></button>";
    let feedSortContainer = document.querySelector('.feedSortContainer');
    feedSortContainer.innerHTML = sortString;
    addFeedListeners(postIdDict,postRefs,postDatas,objectIds);
  }
  else {
    var feedString = '';
    console.log(postIdDict);
    if (sortType == 'date') {
      postIdDict.sort((d1,d2)=> d1.date - d2.date);
    }
    else if (sortType == 'vote') {
      postIdDict.sort((d1,d2)=> d1.vote - d2.vote);
    }
    else if (sortType == 'rank') {
      postIdDict.sort((d1,d2)=> d1.rank - d2.rank);
    }
    var postRefs = [];
    var postDatas = [];
    var objectIds = [];
    for (let i = postIdDict.length-1; i >= 0; i-- ){
      let currentPostRef2 = doc(db, "posts", postIdDict[i].id);
      let currentPostRef1 = await getDoc(doc(db, "posts", postIdDict[i].id));
      postRefs[i] = currentPostRef2;
      postDatas[i] = currentPostRef1;
      let currentPostRef = currentPostRef1.data();
      let currentPublisherRef = await getDoc(doc(db, "users", currentPostRef.publisher));
      currentPublisherRef = currentPublisherRef.data();
      let objectRef1 = await getDoc(doc(db, "objects", currentPostRef.objectId));
      let objectRef = objectRef1.data();
      objectIds[i] = objectRef1.id;
      feedString += "<div class='feedSortContainer'></div>";
      feedString += "<div class='aFeed' id='"+postIdDict[i].id+"'>";
        feedString += "<div class = 'displayPublisherName'><nobr><p class='profilePostLabel'  style='display: inline;'>User: </p><a href='#' id='publisher"+postIdDict[i].id;
        feedString += "'>";
        feedString += currentPostRef.publisherName+"</a>";
        feedString += "&nbsp;&nbsp;&nbsp;<p class='profilePostLabel'  style='display: inline;'>Rep: </p><p style='display:inline'>"+currentPublisherRef.reputation+"</p></nobr></div>";
        feedString += "<div class = 'feedPostContent'> <img class='objectImg4' src = '"+objectRef.imgUrl+"' style='width:100%;'>";
          feedString += "<div class='rightFeedContent'>";
            feedString += "<div class='rightFeedLabels'>";
            if (objectRef.type == 'artist') {
              feedString += "<div class='profilePostLabel'>Artist:</div>";
            }
            else if (objectRef.type == 'album') {
              feedString += "<div class='profilePostLabel'>Album:</div>";
            }
            else if (objectRef.type == 'song') {
              feedString += "<div class='profilePostLabel'>Song:</div>";
            }
            feedString += "<nobr><div class='profilePostLabel'>"+currentPostRef.publisherName+"'s Rank:&nbsp;"
            feedString += "<div class='rankValue' style='margin:0;display:inline;'>"+currentPostRef.rank+"</div> </div></nobr>";
            if (objectRef.class == 'music') {
              feedString += "<div class='profilePostLabel'><strong><a href='"+objectRef.spotifyLink+"' target='_blank'>Listen on Spotify</a></strong></div>";
            }
            feedString += "</div>";//end labels
            let upvotes = currentPostRef.upvotes;
            let downvotes = currentPostRef.downvotes;
            let votes = upvotes - downvotes;
            feedString += "<div class='rightFeedTitles'>"; 
              feedString += "<a href='#'' id='titleValue"+objectRef1.id+"' class='titleValue'>"+objectRef.name+"</a>";
              feedString += "<div class='voteContainer'>";
              feedString += "<div class='voteButtonContainer'><button class='voteArrowBtn' id='upVoteBtn"+currentPostRef1.id+"'><img class='voteArrow' id='upArrow' src='https://raw.githubusercontent.com/CalColistra/Rank-Anything-App/master/img/upArrowIcon.png'></button>";
              feedString += "<button class='voteArrowBtn' id='downVoteBtn"+currentPostRef1.id+"'> <img class='voteArrow' src='https://raw.githubusercontent.com/CalColistra/Rank-Anything-App/master/img/downArrowIcon.png'> </button></div>";
              feedString += "<div class='voteValue' id='voteValue"+currentPostRef1.id+"'>"+votes+"</div>";
              feedString += "</div>";
            feedString += "</div>";
            feedString += "<div class='rightFeedTitles'>"; 
              feedString += "<div class='textValue'>&nbsp;<p class='profilePostLabel'  style='display: inline;'>Text: </p> "+currentPostRef.text+"</div>";
              feedString += "<div><button id='comment"+currentPostRef1.id+"'>Comment</button> <div class='profileLabel'>Published:<br>"+currentPostRef.datePublished+"</div></div>";
            feedString += "</div>";
          feedString += "</div>";
        feedString += "</div>";
      feedString += "</div>";
      //console.log(currentPostRef);
    }
    homeBody.innerHTML = feedString;
    let sortString = "Sorting by <button class='changeSort' id='sortType"+sortType+"'>"+sortType+"</button> ";
    sortString += "<button id='sortDirectionUp' class='sortDirection'><img class='sortDirectionImg' src='"+sortUpIcon+"'></button>";
    let feedSortContainer = document.querySelector('.feedSortContainer');
    feedSortContainer.innerHTML = sortString;
    addFeedListeners(postIdDict,postRefs,postDatas,objectIds);
  }
}

let sortSelection = "Sort by: <button id='dateSort' class='sortSelections'>Date</button><button id='rankSort' class='sortSelections'>Rank</button>";
sortSelection += "<button id='voteSort' class='sortSelections'>Votes</button>";

async function addFeedListeners(postIdDict,postRefs,postDatas,objectIds) {
  for (let i =0; i<postIdDict.length;i++) {
    let upVoteArray = postDatas[i].data().upVotesArray;
    let downVoteArray = postDatas[i].data().downVotesArray;
    let upVoteRef = document.querySelector("#upVoteBtn"+postIdDict[i].id);
    let downVoteRef = document.querySelector("#downVoteBtn"+postIdDict[i].id);
    if (upVoteArray.includes(currentUser.userEmail)) {
      upVoteRef.innerHTML="<img class='voteArrow' id='upArrow' src='https://raw.githubusercontent.com/CalColistra/Rank-Anything-App/master/img/upArrowIconPressed.png'>";
    }
    else if (downVoteArray.includes(currentUser.userEmail)) {
      downVoteRef.innerHTML="<img class='voteArrow' id='upArrow' src='https://raw.githubusercontent.com/CalColistra/Rank-Anything-App/master/img/downArrowIconPressed.png'>";
    }
    await addVoteListeners(upVoteRef, downVoteRef, postRefs[i], postIdDict[i].id);
    //console.log(postIdDict);
    var currentPublisherLink = document.querySelector('#publisher'+postIdDict[i].id);
    currentPublisherLink.addEventListener('click', async e =>{
      e.preventDefault();
      displayProfileSection(postIdDict[i].publisherId);
    });
    let currentObjectRef = document.querySelector("#titleValue"+objectIds[i]);
    currentObjectRef.addEventListener('click', async e =>{
      e.preventDefault();
      displayObjectPopup(objectIds[i]);
    });
  }
  let feedSortContainer = document.querySelector('.feedSortContainer');
  let feedSortBtn = document.querySelector('.changeSort');
  feedSortBtn.addEventListener('click', async e =>{
    e.preventDefault();
    feedSortContainer.innerHTML = sortSelection;
    let dateSort = document.querySelector("#dateSort");
    let rankSort = document.querySelector("#rankSort");
    let voteSort = document.querySelector("#voteSort");
    dateSort.addEventListener('click', async e =>{
      e.preventDefault();
      changeSort('date', dateSort,postIdDict,postDatas);
    });
    voteSort.addEventListener('click', async e =>{
      e.preventDefault();
      changeSort('vote', voteSort,postIdDict,postDatas);
    });
    rankSort.addEventListener('click', async e =>{
      e.preventDefault();
      changeSort('rank', rankSort,postIdDict,postDatas);
    });
  });
}
async function changeSort(sortType, sortRef, postIdDict, postDatas) {
  var sortUpIcon = 'https://raw.githubusercontent.com/CalColistra/Rank-Anything-App/master/img/sortUpIcon.png';
  var sortDownIcon = 'https://raw.githubusercontent.com/CalColistra/Rank-Anything-App/master/img/sortDownIcon.png';
  let feedSortContainer = document.querySelector('.feedSortContainer');

  let sortString = "Sorting by <button class='changeSort' id='sortType"+sortType+"'>"+sortType+"</button> ";
  sortString += "<button id='sortDirectionUp' class='sortDirection'><img class='sortDirectionImg' src='"+sortUpIcon+"'></button>";
  feedSortContainer.innerHTML = sortString;
  displayHomeFeed(false, sortType,postIdDict,postDatas);
}
//-----------------------------------------------------------------------------------------------------------
//post section:
rankBtn.addEventListener('click', async e => {
  e.preventDefault();
  var blank = '';
  displayPostSection(false, blank);
})
async function displayPostSection(isSpecific, specificId) {
  if (signedIn==false) {
    alert("Please sign in with google.");
  }
  else {
    displaySection("rank");
    if (isSpecific == true) {
        updatePostForm(specificId);
    }
    else{
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
    
  }
}

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
      if ((type == "song") || (type == "album") || (type == "Book") || (type == "Film")) {
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

function getCurrentDateTime () {
  let currentDate = new Date();
  let cDay = currentDate.getDate();
  let cMonth = currentDate.getMonth() + 1;
  let cYear = currentDate.getFullYear();
  let chour = currentDate.getHours();
  let amOrPm;
  if ((chour > 12)&&(chour != 24)) {
    amOrPm = 'PM';
    chour = chour-12;
  }
  else if (chour == 24) {
    amOrPm = 'AM';
    chour = 12;
  }
  else if (chour < 12) {
    amOrPm = 'AM'
  }
  else if (chour == 12) {
    amOrPm = 'PM';
  }
  let minutes = currentDate.getMinutes();
  minutes = String(minutes);
  if (minutes.length == 1) {
    minutes = '0'+minutes;
  }
  let time = chour + ":" + minutes +" "+amOrPm;
  let dateString = cMonth +"/"+cDay+"/"+cYear+" at "+ time;
  let finalString = String(dateString)
  return finalString;
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
        var userPost;
        if ((type == "song") ||(type == "album") || (type == "Book") || (type == "Film")) {
          var userText = textArea.value;
          var objectCreator = docSnap.creator;
          let dateString = String(getCurrentDateTime());
          userPost = new Post(currentUser.userEmail, currentUser.userName, sliderValue, userText, name, type, dateString);
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
            datePublished: dateString,
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
        else if ((type == "artist") || (type == "Author") || (type == "Actor")) {
          var userText = textArea.value;
          let dateString = String(getCurrentDateTime());
          userPost = new Post(currentUser.userEmail, currentUser.userName, sliderValue, userText, name, type,dateString);
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
            datePublished: dateString,
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
        let objectId = docSnap.data().objectId;
        let objectRef = doc(db, "objects", objectId);
        let objectSnap = await getDoc(objectRef);
        profilePostsString += "<div id='"+currentId+"' class = 'aPost'>";
        profilePostsString += "<div id='Rank"+currentId+"' class='displayRank'><div id = 'rankPostLabel"+currentId+"' class='profilePostLabel'>";
        profilePostsString += "<div class='rankValue'>Rank:&nbsp;"+docSnap.data().rank+"</div></div><div class='objectImg'><img class='objectImg2' src='"+objectSnap.data().imgUrl+"'></div></div>";
        profilePostsString += "<div id = 'postContent'>";
        const objectType = docSnap.data().type;
        var displaytype = objectType.charAt(0).toUpperCase();
        displaytype += objectType.substring(1,objectType.length);
        if ((objectType == "song") || (objectType == "album") || (objectType == "Film") || (objectType == "Book")) {
          profilePostsString += "<div id = 'leftPostContent'><div id = 'titlePostLabel"+currentId+"' class='profilePostLabel'>"+displaytype+":</div><a href='#' id='titleValue"+docSnap.data().objectId+"' class='titleValue'>";
          profilePostsString += docSnap.data().objectName+" by "+docSnap.data().objectCreator;
          profilePostsString += "</a></div>";
        }
        else if ((objectType == "artist") || (objectType == "Author") || (objectType == "Actor")) {
          profilePostsString += "<div id = 'leftPostContent'><div id = 'titlePostLabel"+currentId+"' class='profilePostLabel'>"+displaytype+":</div><a href='#' id='titleValue"+docSnap.data().objectId+"' class='titleValue'>";
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
            profilePostsString += "<button id='editPost"+currentId+"'><img id='editIcon' src='/assets/editIcon.5de888a8.png'>Edit Post</button>"; 
            profilePostsString += "<div class = 'profileLabel'>Published:</br>"+docSnap.data().datePublished+"</div>";
            profilePostsString += "</div></div>";
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
        let objectId = docSnap.data().objectId;
        let objectRef = doc(db, "objects", objectId);
        let objectSnap = await getDoc(objectRef);
        profilePostsString += "<div id='"+currentId+"' class = 'aPost'>";
        profilePostsString += "<div id='Rank"+currentId+"' class='displayRank'><div id = 'rankPostLabel"+currentId+"' class='profilePostLabel'>";
        profilePostsString += "<div class='rankValue'>Rank:&nbsp;"+docSnap.data().rank+"</div></div><div class='objectImg'><img class='objectImg2' src='"+objectSnap.data().imgUrl+"'></div></div>";
        profilePostsString += "<div id = 'postContent'>";
        const objectType = docSnap.data().type;
        var displaytype = objectType.charAt(0).toUpperCase();
        displaytype += objectType.substring(1,objectType.length);
        if ((objectType == "song") ||(objectType == "album") || (objectType == "Film") || (objectType == "Book")) {
          profilePostsString += "<div id = 'leftPostContent'><div id = 'titlePostLabel"+currentId+"' class='profilePostLabel'>"+displaytype+":</div><a href='#' id='titleValue"+docSnap.data().objectId+"' class='titleValue'>";
          profilePostsString += docSnap.data().objectName+" by "+docSnap.data().objectCreator;
          profilePostsString += "</a></div>";
        }
        else if ((objectType == "Band") ||(objectType == "artist") || (objectType == "Author") || (objectType == "Actor")) {
          profilePostsString += "<div id = 'leftPostContent'><div id = 'titlePostLabel"+currentId+"' class='profilePostLabel'>"+displaytype+":</div><a href='#' id='titleValue"+docSnap.data().objectId+"' class='titleValue'>";
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
          profilePostsString += "<button id='editPost"+currentId+"'>Blank button</button>"; 
          profilePostsString += "<div class = 'profileLabel'>Published:</br>"+docSnap.data().datePublished+"</div>";
          profilePostsString += "</div></div>";
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
          let upvotes = postSnap.data().upvotes;
          
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
          let currentUserRep = userSnap.data().reputation;
          let newUserRep = currentUserRep - upvotes;
          if (newUserRep < 0) {
            newUserRep = 0;
          }
          let updatedUserPostIds = [];
          for (let i = 0; i < userPostIds.length; i++) {
            if (userPostIds[i] != currentId) {
              updatedUserPostIds.push(userPostIds[i]);
            }
          }
          userPostCount = userPostCount -1;
          currentUser.reputation = newUserRep;
          await updateDoc(doc(db,"users", currentUser.userEmail), {
            postIds: updatedUserPostIds,
            postCount: userPostCount,
            reputation: newUserRep
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
  if (isNaN(averageRank)) {
    averageRank = 0;
  }
  topString = "<div id='leftObjectContent'><div class='objectLabel'>Average Rank:</div>";
  topString += "<div class='averageRank'>"+averageRank+"</div>";
  topString += "</div>";
  topString += "<div id='rightObjectContent'>";
  topString += "<div></div>";
  var displaytype = type.charAt(0).toUpperCase();
  displaytype += type.substring(1,type.length);
  topString += "<div class='objectLabel'>"+displaytype+":</div>";
  if ((type == "song") || (type == "album") || (type == "Film") || (type == "Book")) {
    topString += "<div class='objectLabel'><strong><a href='"+docSnap.data().spotifyLink+"' target='_blank'>Listen on Spotify</a></strong></div>";
  }
  else if ((type == "artist")) {
    topString += "<div class='objectLabel'><strong><a href='"+docSnap.data().spotifyLink+"' target='_blank'>Listen on Spotify</a></strong></div>";
  }
  topString += "<div><img class='objectImg3' src='"+docSnap.data().imgUrl+"'></div>";
  topString += "<div class='titleValue'><strong>"+docSnap.data().name+"</strong>";
 
  if ((type == "song") || (type == "album") || (type == "Film") || (type == "Book")) {
    const q = query(collection(db,"objects"), where("name", "==", docSnap.data().creator), where("type", "==", 'artist') );
    const querySnapshot = await getDocs(q);
    var addString = "";
    querySnapshot.forEach((doc) => {
      if (type == 'song') {
        var currentArtistSongs = doc.data().trackIds;
        if (currentArtistSongs.includes(docSnap.id)){
          // doc.data() is never undefined for query doc snapshots
          //console.log(doc.id, " => ", doc.data());
          objectLinkIds.push("#creator"+doc.id);
          objectIds.push(doc.id);
          addString = "</br>&nbsp;&nbsp;&nbsp;<a id='creator"+doc.id+"' href='#'>"+docSnap.data().creator+"</a>";
        }
      }
      else if (type == 'album') {
        var currentArtistAlbums = doc.data().albumIds;
        if (currentArtistAlbums.includes(docSnap.id)){
          // doc.data() is never undefined for query doc snapshots
          //console.log(doc.id, " => ", doc.data());
          objectLinkIds.push("#creator"+doc.id);
          objectIds.push(doc.id);
          addString = "</br>&nbsp;&nbsp;&nbsp;<a id='creator"+doc.id+"' href='#'>"+docSnap.data().creator+"</a>";
        }
      }
    });
    topString += addString;
  }
  else if ((type == "Band") || (type == "artist") || (type == "Author") || (type == "Actor")) {
    topString += "&nbsp;&nbsp;&nbsp;<a href='#'></a>";
  }
  
  topString += "</div>";
  if ((type == "song") || (type == "album") || (type == "Film") || (type == "Book")) {
    topString += "<div class='objectLabel'><button id='rankIt"+objectId+"'>";
    topString += "<img id='editIcon' src='https://raw.githubusercontent.com/CalColistra/Rank-Anything-App/master/img/editIcon.png'></img>";
    topString += "Rank it</button>&nbsp;&nbsp;";
  }
  else if ((type == "Band")) {
    topString += "<div class='objectLabel'><button id='rankIt"+objectId+"'>";
    topString += "<img id='editIcon' src='https://raw.githubusercontent.com/CalColistra/Rank-Anything-App/master/img/editIcon.png'></img>";
    topString += "Rank it</button>&nbsp;&nbsp;";
  }
  else if ( (type == "artist")) {
    topString += "<div class='objectLabel'><button id='rankIt"+objectId+"'>";
    topString += "<img id='editIcon' src='https://raw.githubusercontent.com/CalColistra/Rank-Anything-App/master/img/editIcon.png'></img>";
    topString += "Rank it</button>&nbsp;&nbsp;";
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
      
    let objectImgUrl = docSnap.data().imgUrl;
    let objectType = docSnap.data().type;
    

        bottomString += "<div class='displayRank'>";
          bottomString += "<div class='profilePostLabel'>";
          bottomString += "<div class='rankValue'>Rank:&nbsp;"+postSnap.data().rank+"</div></div>";
          bottomString += "<div class='objectImg'><img class='objectImg2' src='"+objectImgUrl+"'></div>";
        bottomString += "</div>";

        bottomString += "<div id='postContent'>";

            bottomString += "<div id = 'leftPostContent'><div id = 'titlePostLabel"+currentPostId+"' class='profilePostLabel'>"+displaytype+":</div><div class='titleValue'>";
            if (objectType == 'artist') {
              bottomString += "<strong>"+postSnap.data().objectName+"</strong>";
            }
            else {
              bottomString += "<strong>"+postSnap.data().objectName+"</strong> by "+postSnap.data().objectCreator;
            }
            bottomString += "</div></div>";
            let upvotes = postSnap.data().upvotes;
            let downvotes = postSnap.data().downvotes;
            let votes = upvotes - downvotes;
            bottomString += "<div id = 'rightPostContent'><div id = 'votesPostLabel"+currentPostId+"' class='profilePostLabel'>Votes:</div>";
            bottomString += "<div class='voteContainer'> <div class='voteButtonContainer'>";
            bottomString += "<button class='voteArrowBtn' id = 'upVoteBtn"+currentPostId+"'> <img class='voteArrow' id='upArrow' src='https://raw.githubusercontent.com/CalColistra/Rank-Anything-App/master/img/upArrowIcon.png'> </button>";
            bottomString += "<button class='voteArrowBtn' id = 'downVoteBtn"+currentPostId+"'> <img class='voteArrow' src='https://raw.githubusercontent.com/CalColistra/Rank-Anything-App/master/img/downArrowIcon.png'> </button>";
            bottomString += "</div>"
            bottomString += "<div id='voteValue"+currentPostId+"'>"+votes+"</div></div>";
            bottomString += "<div class = 'profileLabel'>Published:</br>"+postSnap.data().datePublished+"</div>";
            bottomString += "</div>";
            bottomString += "<div id = 'leftPostContent'><div id = 'textPostLabel"+currentPostId+"' class='profilePostLabel'>Text:</div> <div id='textContainer"+currentPostId+"' class='textContainer'> <div id='"+currentPostId+"textValue' class='textValue'>";
            bottomString += postSnap.data().text+"</div></div></div>";
            bottomString += "</div>";

        bottomString += "</div>"; 
  }
  bottomString += "</div>";
  bottomDisplay.innerHTML = bottomString;
  addListenersForObjectPage(objectLinkIds, objectIds, publisherLinkIds, publisherIds, postIds,objectId);
}

async function addListenersForObjectPage(objectLinkIds, objectIds, publisherLinkIds, publisherIds, postIds,rankItId) {
  for (let i=0; i<objectLinkIds.length; i++) {
    addListenersForObjectPage2(objectIds[i], objectLinkIds[i]);
  }
  for (let i=0; i<publisherLinkIds.length; i++) {
    addListenersForObjectPage3(publisherIds[i], publisherLinkIds[i]);
  }
  // handle rank it button --------------------------------------------------------------------------------------
  var rankItRef = document.querySelector('#rankIt'+rankItId);
  rankItRef.addEventListener('click', async e => {
    e.preventDefault();
    displayPostSection(true, rankItId);
  })
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
