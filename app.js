import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import {
 getAuth,createUserWithEmailAndPassword,
 signInWithEmailAndPassword,
 GoogleAuthProvider,signInWithPopup,
 onAuthStateChanged,signOut
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";

import {
 getFirestore,doc,setDoc,getDoc,
 updateDoc,addDoc,collection,
 query,where,getDocs,
 serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

/* FIREBASE */
const app = initializeApp({
 apiKey:"AIzaSyCaF0U-gGY0r6uUgQ485NDggSPz5rIop7o",
 authDomain:"robos-ca998.firebaseapp.com",
 projectId:"robos-ca998"
});
const auth=getAuth(app);
const db=getFirestore(app);

/* CLOUDINARY */
const CLOUD="dvhyjrc1q";
const PRESET_PROFILE="upload_profile";
const PRESET_REEL="upload_reels";

/* ENSURE USER DOC */
async function ensureUser(uid,user){
 const ref=doc(db,"users",uid);
 const snap=await getDoc(ref);
 if(!snap.exists()){
  await setDoc(ref,{
   name:user.displayName||"",
   username:user.email?.split("@")[0]||"",
   email:user.email||"",
   bio:"",
   profileImage:""
  });
 }
}

/* AUTH */
signupBtn.onclick=async()=>{
 const c=await createUserWithEmailAndPassword(auth,email.value,password.value);
 await ensureUser(c.user.uid,c.user);
};

loginBtn.onclick=()=>signInWithEmailAndPassword(auth,email.value,password.value);

googleBtn.onclick=async()=>{
 const r=await signInWithPopup(auth,new GoogleAuthProvider());
 await ensureUser(r.user.uid,r.user);
};

/* LOAD PROFILE */
async function loadProfile(uid){
 const snap=await getDoc(doc(db,"users",uid));
 if(!snap.exists()) return;
 const d=snap.data();
 profileImg.src=d.profileImage||"https://via.placeholder.com/120";
 usernameText.innerText="@"+(d.username||"user");
 bioText.innerText=d.bio||"";
}

/* AUTH STATE */
onAuthStateChanged(auth,async u=>{
 if(u){
  authPage.style.display="none";
  mainPage.style.display="block";
  await ensureUser(u.uid,u);
  loadProfile(u.uid);
  loadReels(u.uid);
 }
});

/* PROFILE IMAGE */
profileInput.onchange=async()=>{
 if(!profileInput.files[0]) return;
 const fd=new FormData();
 fd.append("file",profileInput.files[0]);
 fd.append("upload_preset",PRESET_PROFILE);

 const r=await fetch(
  `https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`,
  {method:"POST",body:fd}
 );
 const d=await r.json();
 await updateDoc(doc(db,"users",auth.currentUser.uid),
 {profileImage:d.secure_url});
 loadProfile(auth.currentUser.uid);
};

/* BIO */
saveBioBtn.onclick=async()=>{
 await updateDoc(doc(db,"users",auth.currentUser.uid),
 {bio:bioInput.value});
 loadProfile(auth.currentUser.uid);
};

/* REELS */
async function loadReels(uid){
 myReels.innerHTML="";
 const q=query(collection(db,"reels"),where("uid","==",uid));
 const snap=await getDocs(q);
 snap.forEach(r=>{
  const v=document.createElement("video");
  v.src=r.data().url;
  v.controls=true;
  myReels.appendChild(v);
 });
}

reelInput.onchange=async()=>{
 if(!reelInput.files[0]) return;
 const fd=new FormData();
 fd.append("file",reelInput.files[0]);
 fd.append("upload_preset",PRESET_REEL);

 const r=await fetch(
  `https://api.cloudinary.com/v1_1/${CLOUD}/video/upload`,
  {method:"POST",body:fd}
 );
 const d=await r.json();

 await addDoc(collection(db,"reels"),{
  uid:auth.currentUser.uid,
  url:d.secure_url,
  createdAt:serverTimestamp()
 });

 loadReels(auth.currentUser.uid);
};

/* LOGOUT */
logoutBtn.onclick=()=>{signOut(auth);location.reload()};
