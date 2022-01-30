
/*
  * Firebase.js
  *
  *
  *  Created on: Oct 8, 2021
  *  Modified on: Nov 13, 2021
  * 
  *      Author: SakuranohanaTH
  * 
 */

// Import the functions you need from the SDKs you need
import firebase from 'firebase/compat/app';
// import { getAnalytics } from "firebase/analytics";
import 'firebase/compat/database';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = firebase.initializeApp({
  apiKey: "AIzaSyDqf3AmjInZsZM2zICKIKkTRg9TTy7imTQ",
  authDomain: "lastmiledeliveryrobot-frab-5.firebaseapp.com",
  databaseURL: "https://lastmiledeliveryrobot-frab-5-default-rtdb.firebaseio.com",
  projectId: "lastmiledeliveryrobot-frab-5",
  storageBucket: "lastmiledeliveryrobot-frab-5.appspot.com",
  messagingSenderId: "616349717264",
  appId: "1:616349717264:web:132497458986949ad58b95",
  measurementId: "G-WD65C757VK"
});

export const db = firebaseConfig.database();