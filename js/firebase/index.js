import {
    browserLocalPersistence,
    createUserWithEmailAndPassword,
    getAuth,
    getRedirectResult,
    GoogleAuthProvider,
    onAuthStateChanged,
    sendPasswordResetEmail,
    setPersistence,
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

const FIREBASE_AUTH_DOMAIN = "best-web-design.firebaseapp.com";

const firebaseConfig = { 
  apiKey : "AIzaSyBDV2PqxXXvyIBsgDqpQsu2m4KrOOV6oPw" , 
  authDomain : FIREBASE_AUTH_DOMAIN , 
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
let authReady = Promise.resolve();

try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    authReady = setPersistence(auth, browserLocalPersistence).catch((error) => {
        console.error("Không thể thiết lập Firebase Auth persistence.", error);
    });
    db = getFirestore(app);
    storage = getStorage(app);
    functions = getFunctions(app, "asia-southeast1");
} catch (error) {
    console.error("Lỗi khởi tạo Firebase. Vui lòng kiểm tra firebaseConfig.", error);
}

export {
    auth,
    authReady,
    browserLocalPersistence,
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
    getRedirectResult,
    GoogleAuthProvider,
    httpsCallable,
    onAuthStateChanged,
    query,
    ref,
    serverTimestamp,
    sendPasswordResetEmail,
    setPersistence,
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
