<template>
<div style="margin-top: 20vw;" id="likes-container">
  <div style="text-align: center;">
      <span class="score" id="count"><b>{{ likeCount }}</b></span><br>
      <button class="like" id="like" @click="tap"><img class="tap" src="https://i.postimg.cc/xCj2Qkp5/2587-D1-A6-37-E0-45-B0-89-E4-3-F4-D29-E83130.png"></button>
  </div>
        <div class="bar">
          <RouterLink to="/task">
            <button class="task">Task</button>
          </RouterLink>
          <RouterLink to="/">
              <button class="game"><b>Game</b></button>
          </RouterLink>
          <RouterLink to="/leader">
              <button class="soon">Leader</button>
          </RouterLink>
        </div>
</div>
</template>

<style scoped>
  body {
      background-color: rgb(0, 0, 0);
      touch-action: none;
      overflow: hidden;
  }
  .score {
      font-family: Geologica;
      color: white;
      font-size: 36px;
  }
  .like {
      margin-top: 20%;
      background-color: black;
      border: none;
  }
  .tap:active {
      transform: translateY(10px);
  }
  .tap {
      width: 320px;
  }
  .bar {
      background-color: rgb(0, 0, 0);
      bottom: 0;
      width: 150%;
      height: 10%;
      border-radius: 25px;
      margin-left: -40vw;
      position: fixed;
  }
  .task {
      background-color: rgb(0, 0, 0);
      width: 33vw;
      height: 105px;
      border: none;
      font-family: Geologica;
      color: white;
      margin-left: 38vw;
  }
  .game {
      background-color: rgb(0, 0, 0);
      width: 33vw;
      height: 100px;
      border: none;
      font-family: Geologica;
      color: white;
      margin-left: -2vw;
      font-size: 18px;
  }
  .soon{
      background-color: rgb(0, 0, 0);
      width: 38vw;
      height: 105px;
      border: none;
      font-family: Geologica;
      color: white;
      margin-left: -1vw;
  }
</style>

<script setup>
import { ref, onMounted } from 'vue';
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getDatabase, ref as dbRef, set, get, onValue } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyBhTL7JcmGtdwPpJyKkwMRoIEOIU17ZxUk",
  authDomain: "tapalka-c9556.firebaseapp.com",
  databaseURL: "https://tapalka-c9556-default-rtdb.firebaseio.com",
  projectId: "tapalka-c9556",
  storageBucket: "tapalka-c9556.firebasestorage.app",
  messagingSenderId: "386428968826",
  appId: "1:386428968826:web:de56837a0bbc2cf27940c3",
  measurementId: "G-YENX5XCT8J"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const likeCount = ref(0);
let userId;

const getUserId = () => {
  userId = localStorage.getItem('userId');
  if (!userId) {
    userId = prompt("Enter your username:", "");
    localStorage.setItem('userId', userId);
  }
  return userId;
};

const tap = async () => {
  userId = getUserId();
  const countsRef = dbRef(db, `counts/${userId}`);
  try {
    const snapshot = await get(countsRef);
    let tap = snapshot.exists() ? snapshot.val().count : 0;
    tap++;
    likeCount.value = tap;
    await set(countsRef, { count: tap });
  } catch (error) {
    console.error("Error updating taps:", error);
  }
};


const fetchInitialLikeCount = async () => {
  userId = getUserId();
  const countsRef = dbRef(db, `counts/${userId}`);
  try {
    const snapshot = await get(countsRef);
    if (snapshot.exists()) {
      likeCount.value = snapshot.val().count;
    }
  } catch (error) {
    console.error("Error fetching initial taps count:", error);
  }
};

onMounted(fetchInitialLikeCount);

</script>
