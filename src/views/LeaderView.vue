<template>
    <center>
      <img src="https://em-content.zobj.net/source/telegram/386/trophy_1f3c6.webp" width="300vw" style="margin-top: 8vw">
    </center>
    <h2 style="font-family: Geologica; color: white;">Leaders:</h2>
    <div class="lider" id="leaderboard">
      <table>
        <thead>
          <tr>
            <th style="font-family: Geologica;">User</th>
            <th style="font-family: Geologica;">Score</th>
          </tr>
        </thead>
        <tbody id="leaderboard-body">
          <tr v-for="(user, index) in sortedCounts" :key="index">
            <td>{{ user[0] }}</td>
            <td>{{ user[1].count }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="bar">
      <a href="task.html">
        <button class="task">Task</button>
      </a>
      <RouterLink to="/">
        <button class="game">Game</button>
      </RouterLink>
      <RouterLink to="/leader">
        <button class="soon"><b>Leader</b></button>
      </RouterLink>
    </div>
  </template>
  
  <style scoped>
    body {
      font-family: Geologica;
      background-color: rgb(0, 0, 0);
      color: white;
      touch-action: none; 
    }
    #leaderboard {
      width: 100%;
      height: 100%;
      margin-top: 10vw;
      text-align: center;
      color: white;
    }
    #leaderboard table {
      width: 100%;
      border-collapse: collapse;
      color: white;
    }
    #leaderboard th, #leaderboard td {
      padding: 10px;
      border: 1px solid #000000;
      text-align: left;
      color: white;
      font-family: Geologica;
    }
    h2 {
      margin-top: -5vw;
      position: absolute;
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
    .task, .game, .soon {
      background-color: rgb(0, 0, 0);
      border: none;
      font-family: Geologica;
      color: white;
    }
    .task {
      width: 33vw;
      height: 105px;
      margin-left: 38vw;
    }
    .game {
      width: 33vw;
      height: 100px;
      margin-left: -2vw;
    }
    .soon {
      width: 38vw;
      height: 105px;
      margin-left: -1vw;
      font-size: 18px;
    }
  </style>
  
  <script>
  import { initializeApp } from "firebase/app";
  import { getDatabase, ref, onValue } from "firebase/database";
  
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
  
  export default {
    data() {
      return {
        counts: {}
      };
    },
    computed: {
      sortedCounts() {
        return Object.entries(this.counts).sort((a, b) => b[1].count - a[1].count);
      }
    },
    mounted() {
      const countsRef = ref(db, 'counts/');
      onValue(countsRef, (snapshot) => {
        this.counts = snapshot.val() || {};
      });
    }
  };
  </script>
