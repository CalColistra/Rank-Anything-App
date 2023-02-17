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
  constructor(userEmail, userName, rank, text, objectName, objectCreator, objectType, objectGenre) {
    this.userEmail = userEmail;
    this.userName = userName;
    this.rank = rank;
    this.text = text;
    this.upvotes = 0;
    this.downvotes = 0;
    this.objectName = objectName;
    this.objectCreator = objectCreator;
    this.objectType = objectType;
    this.objectGenre = objectGenre;
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
      postIds:[]
    });
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
const profileLabel = document.querySelector('#profileNavLabel');

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

homeBtn.addEventListener('click', async e => {
  e.preventDefault();
  if (signedIn==false) {
    alert("Please sign in with google.");
  }
  else {
    displayHomeSection();
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
    displayPostSection();
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
          resultsList += "<div><button id = '"+ matchingIds[i]+"' class = 'resultObject'><strong>";
          resultsList += matchingResults[i].name + "</strong></br>"+matchingResults[i].creator;
          resultsList += "</button><div/>";
        }
        searchResults.innerHTML = resultsList;
        addListenersPost(matchingIds,matchingResults);
      }
      
    })
  }
  
})

async function addListenersPost(matchingIds, matchingResults) {
  var userChoiceName, userChoiceCreator, userChoiceType, userChoiceGenre;
  for (let i=0; i < matchingIds.length; i++) {
    var currentId = "#" + matchingIds[i];
    //console.log(currentId);
    var currentResult = document.querySelector(currentId);
    //console.log(currentResult);
    currentResult.addEventListener('click', async e => {
      e.preventDefault();
      userChoiceName = matchingResults[i].name;
      userChoiceCreator = matchingResults[i].creator;
      userChoiceType = matchingResults[i].type;
      userChoiceGenre = matchingResults[i].genre;
      updatePostForm(userChoiceName, userChoiceCreator, userChoiceType, userChoiceGenre, matchingIds[i]);
    })
  }
}

async function updatePostForm(userChoiceName, userChoiceCreator, userChoiceType, userChoiceGenre, objectId){
  var postFormString = "<div> <strong>"+userChoiceName;
      postFormString += "</strong>";
      postFormString += " by " + userChoiceCreator +"</div>";
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
      handlePostInput(userChoiceName, userChoiceCreator, userChoiceType, userChoiceGenre, objectId);
}

async function handlePostInput(objectName, objectCreator, type, genre, objectId) {
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
    //check if user has already made a post for this object**********
    
    const objectRef = await getDoc(doc(db, "objects", objectId));
    if (objectRef.exists()) {
      const docSnap = objectRef.data();
      const postCount = docSnap.postCount;
      const postIds = docSnap.postIds;
      //console.log(postIds);
      if (postIds.includes(currentUser.userEmail)) {
        alert("You have already made a post for " + objectName);
      }
      else {
        await updateDoc(doc(db,"objects", objectId), {
          postCount: postCount + 1,
          postIds: arrayUnion(currentUser.userEmail)
        })
        var userText = textArea.value;
        var userPost = new Post(currentUser.userEmail, currentUser.userName, sliderValue, userText, objectName, objectCreator, type, genre);
        //console.log(userPost.text);
        alert("You have successfully published your post about: " + objectName);
        
        const newPostRef = await addDoc(collection(db, "posts"), {
          publisher: userPost.userEmail,
          publisherName: userPost.userName,
          rank: userPost.rank,
          text: userPost.text,
          objectName: userPost.objectName,
          objectCreator: userPost.objectCreator,
          type: userPost.objectType,
          genre: userPost.objectGenre,
          upvotes: userPost.upvotes,
          downvotes: userPost.downvotes,
          objectId: objectId
        });
        const newPostId = newPostRef.id;
        currentUser.postCount = currentUser.postCount+1;
        currentUser.postIds.push(newPostId);
        await updateDoc(doc(db,"users", currentUser.userEmail), {
          postCount: currentUser.postCount,
          postIds: arrayUnion(newPostId)
        })
      }
    }
    else {
      alert("error finding object");
    }
    
  })
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
const profilePosts = document.querySelector("#profilePosts");


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
    displayProfilePosts();
}

async function displayProfilePosts() {
  //console.log(currentUser.postIds);
  var profilePostsString = "";
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
            profilePostsString += "<div id = 'leftPostContent'><div id = 'titlePostLabel"+currentId+"' class='profilePostLabel'>Title:</div><a href='#' id='titleValue"+currentId+"' class='titleValue'>";
            profilePostsString += docSnap.data().objectName+" by "+docSnap.data().objectCreator;
            profilePostsString += "</a></div>";
            let upvotes = docSnap.data().upvotes;
            let downvotes = docSnap.data().downvotes;
            let votes = upvotes - downvotes;
            profilePostsString += "<div id = 'rightPostContent'><div id = 'votesPostLabel"+currentId+"' class='profilePostLabel'>Votes:</div><div id='voteValue'>";
            profilePostsString += votes+"</div></div>";
            profilePostsString += "<div id = 'leftPostContent'><div id = 'textPostLabel"+currentId+"' class='profilePostLabel'>Text:</div> <div id='textContainer"+currentId+"' class='textContainer'> <div id='"+currentId+"textValue' class='textValue'>";
            profilePostsString += docSnap.data().text+"</div></div></div>";
            profilePostsString += "<div id = 'deleteBtnContainer"+currentId+"'> <button id='deletePost"+currentId+"'>Delete Post</button>";
            profilePostsString += "<button id='editPost"+currentId+"'><img id='editIcon' src='/assets/editIcon.5de888a8.png'>Edit Post</button></div>"; 
            profilePostsString += "</div>";
      profilePostsString += "</div>";
    }
  }
  profilePosts.innerHTML = profilePostsString;
  addListenersForPosts();  
}

async function addListenersForPosts() {
  for (let i = 0; i < currentUser.postIds.length; i++) {
    let currentId = currentUser.postIds[i];
    let postRef = doc(db, "posts", currentId);
    let docSnap = await getDoc(postRef);
    // handle title anchor press  --------------------------------------------------------------------------------------
    const titleClickRef = document.querySelector("#titleValue"+currentId);
    const currentObjectId = docSnap.data().objectId;
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
        displayProfileSection();
      });
      const cancelChangesBtn = document.querySelector('#cancel'+currentId);
      cancelChangesBtn.addEventListener('click', async e => {
        e.preventDefault();
        displayProfileSection();
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
        
        let docSnap = await getDoc(doc(db, "objects", objectId));
        let objectPostCount = docSnap.data().postCount;
        let objectPostIds = docSnap.data().postIds;
        let updatedIds = [];
        for (let i = 0; i < objectPostIds.length; i++) {
          if (objectPostIds[i] != currentUser.userEmail) {
            updatedIds.push(objectPostIds[i]);
          }
        }
        objectPostCount = objectPostCount -1;
        await updateDoc(doc(db,"objects", objectId), {
          postIds: updatedIds,
          postCount: objectPostCount
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
        displayProfileSection();
      })
      noDelete.addEventListener('click', async e => {
        displayProfileSection();
      })
    })
  }
}
//---------------------------------------------------------------------------------
// display object popup section:
const objectPopupRef = document.querySelector("#objectPopup");
async function displayObjectPopup(objectId) {
  for (var i = 0; i < sections.length; i++) {
    sections[i].style.display = 'none';
  }
  for (var i = 0; i < navLabels.length; i++) {
    navLabels[i].style = 'text-decoration-line: none; text-decoration-style: none;';
  }
  objectPopupRef.style.display="block";
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
  
  const objectPostCount = docSnap.data().postCount;
  const averageRank = rankTotals/objectPostCount;
  const topDisplay = document.querySelector("#objectPopupTop");
  const bottomDisplay = document.querySelector("#objectPopupBottom");
  var topString;
  topString = "<div id='leftObjectContent'><div class='objectLabel'>Average Rank:</div>";
  topString += "<div class='averageRank'>"+averageRank+"</div>";
  topString += "</div>";
  topString += "<div id='rightObjectContent'><div class='objectLabel'>Title:</div>";
  topString += "<div class='objectLabel'>Release Date:</div>";
  topString += "<div class='titleValue'><strong>"+docSnap.data().name+"</strong></br>";
  topString += "&nbsp;&nbsp;&nbsp;<a href='#'>"+docSnap.data().creator+"</a>";
  topString += "</div>";
  topString += "<div><strong>"+docSnap.data().releaseDate+"</strong></br>";
  if (objectPostCount == 1) var haveRanked = "<strong>"+objectPostCount+"</strong> user has ranked "+docSnap.data().name;
  else var haveRanked = "<strong>"+objectPostCount+"</strong> users have ranked "+docSnap.data().name;
  topString += haveRanked;
  topString += "</div>";
  topString += "</div>";
  topDisplay.innerHTML = topString;
  var bottomString;
  bottomString = "<h4>Top Posts for "+docSnap.data().name+"</h4>";
  bottomString += "<div id='objectPopupPosts'>";
  for (let i = 0; i < postIds.length; i++) {
    var currentPostId = postIds[i];
    let postSnap = await getDoc(doc(db, "posts", currentPostId));
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
            bottomString += "<div id = 'rightPostContent'><div id = 'votesPostLabel"+currentPostId+"' class='profilePostLabel'>Votes:</div><div id='voteValue'>";
            bottomString += votes+"</div></div>";
            bottomString += "<div id = 'leftPostContent'><div id = 'textPostLabel"+currentPostId+"' class='profilePostLabel'>Text:</div> <div id='textContainer"+currentPostId+"' class='textContainer'> <div id='"+currentPostId+"textValue' class='textValue'>";
            bottomString += postSnap.data().text+"</div></div></div>"; 
            bottomString += "</div>";

        bottomString += "</div>";

      
    bottomString += "</div>"
  }
  bottomString += "</div>";
  bottomDisplay.innerHTML = bottomString;
}


