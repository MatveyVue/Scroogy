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
        <div class="time">{{ time }}s</div>
        <div class="score">{{ score }}</div>
      </div>
      
      <!-- Прогресс-бар -->
      <div class="time-bar" :style="{ width: timePercent + '%' }"></div>
    </div>
    
    <!-- Игровое поле -->
    <div class="game-area">
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
          left: bucketPosition + 'px'
        }"
        @pointerdown="startDrag"
        @pointermove="moveDrag"
        @pointerup="stopDrag"
      >
        🗑️
      </div>
    </div>
    
    <!-- Результат -->
    <div v-if="gameOver" class="game-over">
      <h2>GAME OVER</h2>
      <p class="final-score">Score: {{ score }}</p>
      <button @click="restartGame">PLAY AGAIN</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'

// Реактивные переменные
const time = ref(60)
const score = ref(0)
const gameOver = ref(false)
const showCountdown = ref(true)
const countdown = ref(3)
const bucketPosition = ref(0)
const items = ref([])

// Состояние перетаскивания
const isDragging = ref(false)
const dragStartX = ref(0)
const bucketStartX = ref(0)

// Предметы
const itemTypes = [
  { type: 'apple', icon: '🍎', value: 10 },
  { type: 'star', icon: '⭐', value: 20 },
  { type: 'bomb', icon: '💣', value: -15 }
]

// Компьютед
const timePercent = computed(() => (time.value / 60) * 100)

// Инициализация
const initGame = () => {
  bucketPosition.value = (window.innerWidth - 80) / 2
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

// Начало игры
const startGame = () => {
  time.value = 60
  score.value = 0
  gameOver.value = false
  items.value = []
  
  initGame()
  
  // Таймер игры
  timers.push(setInterval(() => {
    time.value--
    if (time.value <= 0) endGame()
  }, 1000))
  
  // Генерация предметов
  timers.push(setInterval(createItem, 800))
  
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
    speed: 2 + Math.random() * 2
  })
}

// Обновление игры
const updateGame = () => {
  if (gameOver.value) return
  
  const screenHeight = window.innerHeight
  const updatedItems = []
  
  items.value.forEach(item => {
    item.y += item.speed
    
    // Столкновение с ведром
    if (item.y > screenHeight - 150) {
      const bucketLeft = bucketPosition.value
      const bucketRight = bucketPosition.value + 80
      const itemLeft = item.x
      const itemRight = item.x + 60
      
      if (itemLeft < bucketRight && itemRight > bucketLeft) {
        score.value += item.value
        return
      }
    }
    
    // Оставляем на экране
    if (item.y < screenHeight + 100) {
      updatedItems.push(item)
    }
  })
  
  items.value = updatedItems
}

// Конец игры
const endGame = () => {
  gameOver.value = true
  clearTimers()
}

// Перезапуск
const restartGame = () => {
  clearTimers()
  gameOver.value = false
  items.value = []
  countdown.value = 3
  showCountdown.value = true
  startCountdown()
}

// Управление
const startDrag = (e) => {
  if (gameOver.value) return
  isDragging.value = true
  dragStartX.value = e.clientX
  bucketStartX.value = bucketPosition.value
}

const moveDrag = (e) => {
  if (!isDragging.value || gameOver.value) return
  
  const deltaX = e.clientX - dragStartX.value
  const newPos = bucketStartX.value + deltaX
  const width = window.innerWidth
  
  bucketPosition.value = Math.max(0, Math.min(width - 80, newPos))
}

const stopDrag = () => {
  isDragging.value = false
}

// Жизненный цикл
onMounted(() => {
  initGame()
  window.addEventListener('resize', initGame)
  setTimeout(startCountdown, 500)
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

.time, .score {
  font-size: 28px;
  font-weight: bold;
  color: white;
  text-shadow: 0 2px 4px rgba(0,0,0,0.8);
}

.score {
  color: #4dff88;
}

.time-bar {
  width: 100%;
  height: 6px;
  background: linear-gradient(90deg, #ff4500, #ff8c00);
  border-radius: 3px;
  transition: width 1s linear;
}

/* Игровое поле */
.game-area {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
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
  animation: float 3s ease-in-out infinite;
}

.item.star {
  animation: spin 2s linear infinite, glow 1s alternate infinite;
}

.item.bomb {
  animation: shake 0.5s infinite;
}

.bucket {
  position: absolute;
  bottom: 80px;
  width: 70px;
  height: 70px;
  font-size: 50px;
  text-align: center;
  line-height: 70px;
  z-index: 20;
  cursor: pointer;
  filter: drop-shadow(0 4px 12px rgba(255, 165, 0, 0.6));
  transition: transform 0.1s;
  user-select: none;
}

.bucket:active {
  transform: scale(0.95);
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
  font-size: 28px;
  margin: 8px 0;
  font-weight: bold;
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
  50% { transform: translateY(-8px) rotate(5deg); }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes glow {
  from { filter: drop-shadow(0 0 4px gold) brightness(1.1); }
  to { filter: drop-shadow(0 0 12px gold) brightness(1.4); }
}

@keyframes shake {
  0%, 100% { transform: translateX(0px); }
  25% { transform: translateX(-3px); }
  75% { transform: translateX(3px); }
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
    bottom: 70px; 
  }
  .item { 
    width: 45px; 
    height: 45px; 
    font-size: 32px; 
    line-height: 45px; 
  }
  .game-over h2 { font-size: 36px; }
  .final-score { font-size: 24px; }
  .game-over button { padding: 12px 28px; font-size: 16px; }
}
</style>
