import {
    createUserWithEmailAndPassword,
    getAuth,
    GoogleAuthProvider,
    onAuthStateChanged,
    signInWithPopup,
    signInWithRedirect,
    signInWithEmailAndPassword,
    signOut
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import {
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    getFirestore,
    query,
    serverTimestamp,
    setDoc,
    updateDoc,
    where
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import {
    deleteObject,
    getDownloadURL,
    getStorage,
    ref,
    uploadBytes
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-storage.js";
import {
    getFunctions,
    httpsCallable
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-functions.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";

const firebaseConfig = { 
  apiKey : "AIzaSyBDV2PqxXXvyIBsgDqpQsu2m4KrOOV6oPw" , 
  authDomain : "best-web-design.firebaseapp.com" , 
  projectId : "best-web-design" , 
  storageBucket : "best-web-design.firebasestorage.app" , 
  messagingSenderId : "274842395049" , 
  appId : "1:274842395049:web:b4f48a220e9ee58cae24b8" , 
  measurementId : "G-79K2KJW125" 
};

let app = null;
let auth = null;
let db = null;
let storage = null;
let functions = null;

try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    functions = getFunctions(app, "asia-southeast1");
} catch (error) {
    console.error("Lỗi khởi tạo Firebase. Vui lòng kiểm tra firebaseConfig.", error);
}

export {
    auth,
    collection,
    createUserWithEmailAndPassword,
    deleteDoc,
    deleteObject,
    db,
    doc,
    functions,
    getDoc,
    getDocs,
    getDownloadURL,
    GoogleAuthProvider,
    httpsCallable,
    onAuthStateChanged,
    query,
    ref,
    serverTimestamp,
    setDoc,
    signInWithPopup,
    signInWithRedirect,
    signInWithEmailAndPassword,
    signOut,
    storage,
    updateDoc,
    uploadBytes,
    where
};
