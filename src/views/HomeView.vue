<template>
  <div class="game-container">
    <!-- Обратный отсчет -->
    <div v-if="showCountdown" class="countdown">
      <div class="countdown-number">{{ countdown }}</div>
    </div>
    
    <!-- Игровой интерфейс -->
    <div class="game-ui">
      <!-- Время и счет -->
      <div class="stats">
      <center>
        <div class="time">{{ time }}s</div>
        <div style="font-size: 36px;" class="score">{{ score }}</div>
      </center>
      </div>
      
      <!-- Прогресс-бар -->
      <div class="time-bar" :style="{ width: timePercent + '%' }"></div>
      
      <!-- Индикатор лучшего счета -->
      <div class="best-score" v-if="bestScore > 0">
        Best: {{ bestScore }}
      </div>
    </div>
    
    <!-- Игровое поле -->
    <div 
      class="game-area"
      @pointerdown="startDrag"
      @pointermove="moveDrag"
      @pointerup="stopDrag"
      @touchstart="handleTouch"
      @touchmove="handleTouch"
    >
      <!-- Предметы -->
      <div 
        v-for="item in items" 
        :key="item.id"
        class="item"
        :class="item.type"
        :style="{ 
          left: item.x + 'px', 
          top: item.y + 'px'
        }"
      >
        {{ item.icon }}
      </div>
      
      <!-- Ведро -->
      <div 
        class="bucket" 
        :style="{ 
          left: bucketPosition.x + 'px',
          top: bucketPosition.y + 'px'
        }"
      >
        🗑️
      </div>
      
      <!-- Индикатор касания -->
      <div v-if="isDragging" class="touch-indicator" :style="{
        left: touchPosition.x + 'px',
        top: touchPosition.y + 'px'
      }"></div>
    </div>
    
    <!-- Результат -->
    <div v-if="gameOver" class="game-over">
      <h2>GAME OVER</h2>
      <p class="final-score">Score: {{ score }}</p>
      <p class="best-record" v-if="bestScore > 0">Best: {{ bestScore }}</p>
      <p class="new-record" v-if="isNewRecord && score > 0">🎉 NEW RECORD!</p>
      <button @click="restartGame">PLAY AGAIN</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { 
  initializeApp 
} from 'firebase/app'
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  query, 
  where, 
  orderBy, 
  limit,
  addDoc,
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore'

// Firebase конфигурация
const firebaseConfig = {
  apiKey: "AIzaSyA8rX6_Xv9PzDlIkskaOpGIxInrhHVVWwY",
  authDomain: "hateusersbot.firebaseapp.com",
  projectId: "hateusersbot",
  storageBucket: "hateusersbot.firebasestorage.app",
  messagingSenderId: "57127310738",
  appId: "1:57127310738:web:fc736be930b64a861c5d4b"
}

// Инициализация Firebase
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

// Реактивные переменные
const time = ref(30)
const score = ref(0)
const bestScore = ref(0)
const gameOver = ref(false)
const isNewRecord = ref(false)
const showCountdown = ref(true)
const countdown = ref(3)

// Позиции ведра и касания
const bucketPosition = ref({ x: 0, y: 0 })
const touchPosition = ref({ x: 0, y: 0 })
const items = ref([])

// Состояние перетаскивания
const isDragging = ref(false)

// Данные пользователя
const userData = ref({
  id: null,
  username: 'Guest',
  firstName: 'Player'
})

// Предметы с увеличенными значениями
const itemTypes = [
  { type: 'apple', icon: '🍎', value: 10 },
  { type: 'star', icon: '⭐', value: 20 },
  { type: 'bomb', icon: '💣', value: -30 }
]

// Компьютед
const timePercent = computed(() => (time.value / 30) * 50)

// Инициализация пользователя из Telegram
const initUser = () => {
  if (window.Telegram?.WebApp) {
    const tg = window.Telegram.WebApp
    tg.ready()
    tg.expand()
    
    const user = tg.initDataUnsafe?.user
    if (user) {
      userData.value = {
        id: user.id.toString(),
        username: user.username || `user_${user.id}`,
        firstName: user.first_name || 'Player'
      }
    } else {
      // Если нет данных пользователя, создаем гостя
      userData.value = {
        id: `guest_${Date.now()}`,
        username: `Guest_${Math.floor(Math.random() * 1000)}`,
        firstName: 'Guest'
      }
    }
  } else {
    // Для разработки
    userData.value = {
      id: `dev_${Date.now()}`,
      username: 'Developer',
      firstName: 'Dev'
    }
  }
  
  console.log('User initialized:', userData.value)
}

// Инициализация игры
const initGame = () => {
  const width = window.innerWidth
  const height = window.innerHeight
  bucketPosition.value = { 
    x: (width - 80) / 2,
    y: height - 150 
  }
}

// Таймеры
let timers = []

// Очистка таймеров
const clearTimers = () => {
  timers.forEach(timer => clearInterval(timer))
  timers = []
}

// Обратный отсчет
const startCountdown = () => {
  const timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(timer)
      showCountdown.value = false
      startGame()
    }
  }, 1000)
  timers.push(timer)
}

// Загрузка лучшего счета
const loadBestScore = async () => {
  try {
    // Сначала пробуем из localStorage
    const savedScore = localStorage.getItem('catch_game_best_score')
    if (savedScore) {
      bestScore.value = parseInt(savedScore) || 0
    }
    
    // Затем из Firebase для данного пользователя
    if (userData.value.id) {
      const docRef = doc(db, 'users', userData.value.id)
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        const data = docSnap.data()
        if (data.bestScore && data.bestScore > bestScore.value) {
          bestScore.value = data.bestScore
        }
      }
    }
  } catch (error) {
    console.log('Error loading best score:', error)
  }
}

// Сохранение счета в Firebase
const saveScoreToFirebase = async () => {
  try {
    if (!userData.value.id) return
    
    const userRef = doc(db, 'users', userData.value.id)
    const userSnap = await getDoc(userRef)
    
    // Обновляем лучший счет пользователя
    if (score.value > bestScore.value) {
      bestScore.value = score.value
      localStorage.setItem('catch_game_best_score', score.value.toString())
      
      await setDoc(userRef, {
        userId: userData.value.id,
        username: userData.value.username,
        firstName: userData.value.firstName,
        bestScore: score.value,
        lastScore: score.value,
        gamesPlayed: userSnap.exists() ? (userSnap.data().gamesPlayed || 0) + 1 : 1,
        totalScore: userSnap.exists() ? (userSnap.data().totalScore || 0) + score.value : score.value,
        updatedAt: serverTimestamp()
      }, { merge: true })
    }
    
    // Сохраняем каждый результат в историю
    const scoreData = {
      userId: userData.value.id,
      username: userData.value.username,
      score: score.value,
      date: new Date().toISOString(),
      timestamp: Date.now()
    }
    
    // Добавляем в коллекцию scores
    await addDoc(collection(db, 'scores'), scoreData)
    
    // Также добавляем в историю пользователя
    await addDoc(collection(db, `users/${userData.value.id}/history`), scoreData)
    
    console.log('Score saved to Firebase')
    
  } catch (error) {
    console.error('Error saving score to Firebase:', error)
  }
}

// Начало игры
const startGame = async () => {
  await loadBestScore()
  
  time.value = 30
  score.value = 0
  gameOver.value = false
  isNewRecord.value = false
  items.value = []
  
  initGame()
  
  // Таймер игры
  timers.push(setInterval(() => {
    time.value--
    if (time.value <= 0) endGame()
  }, 1000))
  
  // Генерация предметов (чаще для сложности)
  timers.push(setInterval(createItem, 600))
  
  // Игровой цикл
  timers.push(setInterval(updateGame, 16))
}

// Создание предмета
const createItem = () => {
  if (gameOver.value) return
  
  const type = itemTypes[Math.floor(Math.random() * itemTypes.length)]
  const width = window.innerWidth
  
  items.value.push({
    id: Date.now() + Math.random(),
    type: type.type,
    icon: type.icon,
    value: type.value,
    x: Math.random() * (width - 60),
    y: -60,
    speed: 4 + Math.random() * 4 // Увеличенная скорость
  })
}

// Обновление игры
const updateGame = () => {
  if (gameOver.value) return
  
  const screenHeight = window.innerHeight
  const updatedItems = []
  
  items.value.forEach(item => {
    // Ускоренное падение
    item.y += item.speed * 1.2
    
    // Столкновение с ведром
    const bucketRect = {
      left: bucketPosition.value.x,
      right: bucketPosition.value.x + 80,
      top: bucketPosition.value.y,
      bottom: bucketPosition.value.y + 80
    }
    
    const itemRect = {
      left: item.x,
      right: item.x + 60,
      top: item.y,
      bottom: item.y + 60
    }
    
    // Проверка столкновения
    if (itemRect.left < bucketRect.right &&
        itemRect.right > bucketRect.left &&
        itemRect.top < bucketRect.bottom &&
        itemRect.bottom > bucketRect.top) {
      
      score.value += item.value
      // Ограничиваем счет снизу
      if (score.value < 0) score.value = 0
      return
    }
    
    // Оставляем на экране
    if (item.y < screenHeight + 100) {
      updatedItems.push(item)
    }
  })
  
  items.value = updatedItems
}

// Конец игры
const endGame = async () => {
  gameOver.value = true
  clearTimers()
  
  // Проверяем, новый ли это рекорд
  if (score.value > bestScore.value) {
    isNewRecord.value = true
    await saveScoreToFirebase()
  }
}

// Перезапуск
const restartGame = () => {
  clearTimers()
  gameOver.value = false
  items.value = []
  countdown.value = 3
  showCountdown.value = true
  isNewRecord.value = false
  setTimeout(startCountdown, 500)
}

// Управление - можно водить в любом месте экрана
const startDrag = (e) => {
  if (gameOver.value) return
  isDragging.value = true
  updateBucketPosition(e.clientX, e.clientY)
}

const moveDrag = (e) => {
  if (!isDragging.value || gameOver.value) return
  updateBucketPosition(e.clientX, e.clientY)
}

const stopDrag = () => {
  isDragging.value = false
}

// Обработка касаний
const handleTouch = (e) => {
  if (gameOver.value) return
  
  e.preventDefault()
  const touch = e.touches[0]
  if (!touch) return
  
  updateBucketPosition(touch.clientX, touch.clientY)
}

// Обновление позиции ведра
const updateBucketPosition = (clientX, clientY) => {
  touchPosition.value = { x: clientX, y: clientY }
  
  const width = window.innerWidth
  const height = window.innerHeight
  
  // Ведро следует за пальцем/курсором
  let newX = clientX - 40 // Центрирование
  let newY = clientY - 40
  
  // Ограничиваем в пределах экрана
  newX = Math.max(10, Math.min(width - 90, newX))
  newY = Math.max(10, Math.min(height - 90, newY))
  
  bucketPosition.value = { x: newX, y: newY }
}

// Получение всех рекордов пользователя
const getUserRecords = async () => {
  try {
    if (!userData.value.id) return []
    
    const scoresRef = collection(db, 'scores')
    const q = query(
      scoresRef, 
      where('userId', '==', userData.value.id),
      orderBy('score', 'desc'),
      limit(10)
    )
    
    // Здесь можно получить и отобразить все рекорды
    // const querySnapshot = await getDocs(q)
    // const records = querySnapshot.docs.map(doc => doc.data())
    // return records
    
  } catch (error) {
    console.log('Error getting user records:', error)
    return []
  }
}

// Жизненный цикл
onMounted(() => {
  initUser()
  initGame()
  window.addEventListener('resize', initGame)
  setTimeout(startCountdown, 500)
  
  // Загружаем рекорды при старте
  loadBestScore()
})

onUnmounted(() => {
  clearTimers()
  window.removeEventListener('resize', initGame)
})
</script>

<style scoped>
.game-container {
  width: 100%;
  height: 100%;
  background: #000;
  position: fixed;
  top: 0;
  left: 0;
  overflow: hidden;
  font-family: system-ui, -apple-system, sans-serif;
  user-select: none;
  touch-action: none;
  cursor: pointer;
}

/* Обратный отсчет */
.countdown {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.countdown-number {
  font-size: 100px;
  font-weight: bold;
  color: #ff4500;
  text-shadow: 0 0 30px rgba(255, 69, 0, 0.8);
  animation: pulse 1s infinite;
}

/* Игровой интерфейс */
.game-ui {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  padding: 20px 12px 8px;
  z-index: 100;
  pointer-events: none;
}

.stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.time {
  font-size: 20px;
  font-weight: bold;
  color: white;
  text-shadow: 0 2px 4px rgba(0,0,0,0.8);
  position: absolute;
  top: 50px;
  left: 50%;
  transform: translateX(-50%);
}

.score {
  font-size: 20px;
  font-weight: bold;
  color: #ffffff;
  position: absolute;
  top: 100px;
  left: 50%;
  transform: translateX(-50%);
}

.best-score {
  position: absolute;
  top: 120px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 14px;
  color: #ffd700;
  font-weight: 500;
}

.time-bar {
  width: 300px;
  height: 6px;
  background: white;
  border-radius: 3px;
  transition: width 1s linear;
  position: absolute;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
}

/* Игровое поле */
.game-area {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  cursor: grab;
}

.game-area:active {
  cursor: grabbing;
}

.item {
  position: absolute;
  width: 50px;
  height: 50px;
  font-size: 36px;
  text-align: center;
  line-height: 50px;
  pointer-events: none;
  z-index: 10;
}

.item.apple {
  animation: float 2s ease-in-out infinite;
  filter: drop-shadow(0 0 10px rgba(255, 50, 50, 0.6));
}

.item.star {
  animation: spin 1.5s linear infinite, glow 1s alternate infinite;
  filter: drop-shadow(0 0 15px gold);
}

.item.bomb {
  animation: shake 0.3s infinite;
  filter: drop-shadow(0 0 15px rgba(255, 0, 0, 0.8));
}

.bucket {
  position: absolute;
  width: 80px;
  height: 80px;
  font-size: 50px;
  text-align: center;
  line-height: 70px;
  z-index: 20;
  cursor: pointer;
  filter: drop-shadow(0 4px 12px rgba(255, 165, 0, 0.6));
  transition: transform 0.1s;
  user-select: none;
  pointer-events: none;
}

.bucket:active {
  transform: scale(0.95);
}

/* Индикатор касания */
.touch-indicator {
  position: absolute;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255,69,0,0.3) 0%, rgba(255,69,0,0) 70%);
  transform: translate(-50%, -50%);
  z-index: 15;
  pointer-events: none;
  animation: ripple 0.5s infinite alternate;
}

/* Результат */
.game-over {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.95);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  text-align: center;
}

.game-over h2 {
  color: #fff;
  font-size: 42px;
  margin-bottom: 24px;
  text-shadow: 0 0 15px #ff4500;
}

.final-score {
  color: #fff;
  font-size: 32px;
  margin: 8px 0;
  font-weight: bold;
}

.best-record {
  color: #ffd700;
  font-size: 24px;
  margin: 8px 0;
  font-weight: 500;
}

.new-record {
  color: #4dff88;
  font-size: 28px;
  font-weight: bold;
  margin: 15px 0;
  text-shadow: 0 0 10px rgba(77, 255, 136, 0.8);
  animation: glowText 1s infinite alternate;
}

.game-over button {
  margin-top: 24px;
  padding: 14px 36px;
  font-size: 18px;
  background: linear-gradient(to right, #ff4500, #ff8c00);
  color: #fff;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  font-weight: bold;
  box-shadow: 0 4px 12px rgba(255, 69, 0, 0.4);
}

.game-over button:active {
  transform: scale(0.95);
}

/* Анимации */
@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.9; }
}

@keyframes float {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-10px) rotate(5deg); }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes glow {
  from { filter: drop-shadow(0 0 6px gold) brightness(1.2); }
  to { filter: drop-shadow(0 0 20px gold) brightness(1.5); }
}

@keyframes shake {
  0%, 100% { transform: translateX(0px); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

@keyframes glowText {
  from { text-shadow: 0 0 10px rgba(77, 255, 136, 0.8); }
  to { text-shadow: 0 0 20px rgba(77, 255, 136, 1); }
}

@keyframes ripple {
  0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.8; }
  100% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.3; }
}

/* Адаптивность */
@media (max-width: 768px) {
  .countdown-number { font-size: 70px; }
  .time, .score { font-size: 24px; }
  .bucket { 
    width: 60px; 
    height: 60px; 
    font-size: 42px; 
    line-height: 60px; 
  }
  .item { 
    width: 45px; 
    height: 45px; 
    font-size: 32px; 
    line-height: 45px; 
  }
  .game-over h2 { font-size: 36px; }
  .final-score { font-size: 28px; }
  .best-record { font-size: 20px; }
  .new-record { font-size: 24px; }
  .game-over button { padding: 12px 28px; font-size: 16px; }
}
</style>
