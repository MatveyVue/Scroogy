<template>
  <div class="game-container">
    <!-- Обратный отсчет -->
    <div v-if="showCountdown" class="countdown">
      <div class="countdown-number">{{ countdown }}</div>
    </div>
    
    <!-- Игровой интерфейс -->
    <div class="game-ui">
      <!-- Прогресс-бар времени -->
      <div class="time-bar-container">
        <div class="time-bar" :style="{ width: timePercent + '%' }"></div>
        <span class="time-text">{{ time }}s</span>
      </div>
      
      <!-- Счет -->
      <div class="score-display">
        <span class="score">{{ score }}</span>
        <span class="best-score">Best: {{ bestScore }}</span>
      </div>
    </div>
    
    <!-- Игровое поле -->
    <div class="game-area">
      <!-- Предметы -->
      <div 
        v-for="item in items" 
        :key="item.id"
        class="item"
        :class="item.type"
        :style="{ left: item.x + 'px', top: item.y + 'px' }"
      >
        {{ item.icon }}
      </div>
      
      <!-- Ведро -->
      <div 
        class="bucket" 
        :style="{ left: bucketPosition + 'px' }"
        @pointerdown="startDrag"
        @pointermove="moveDrag"
        @pointerup="stopDrag"
        @pointercancel="stopDrag"
      >
        🗑️
      </div>
    </div>
    
    <!-- Градиент -->
    <div class="gradient"></div>
    
    <!-- Результат -->
    <div v-if="gameOver" class="game-over">
      <h2>GAME OVER</h2>
      <p class="final-score">Score: {{ score }}</p>
      <p class="final-best">Best: {{ bestScore }}</p>
      <p v-if="isNewRecord" class="new-record">🎉 NEW RECORD!</p>
      <button @click="restartGame">PLAY AGAIN</button>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, computed } from 'vue'

export default {
  name: 'DarkCatchGame',
  
  setup() {
    // Игровые состояния
    const time = ref(60)
    const score = ref(0)
    const bestScore = ref(0)
    const gameOver = ref(false)
    const isPlaying = ref(false)
    const showCountdown = ref(true)
    const countdown = ref(3)
    const isNewRecord = ref(false)
    
    // Игровые элементы
    const bucketPosition = ref(0)
    const items = ref([])
    const isDragging = ref(false)
    const dragStartX = ref(0)
    const bucketStartX = ref(0)
    
    // Таймеры
    let countdownTimer = null
    let gameTimer = null
    let itemTimer = null
    let gameLoop = null
    
    // Конфигурация предметов
    const itemTypes = [
      { type: 'apple', icon: '🍎', value: 10 },
      { type: 'star', icon: '⭐', value: 20 },
      { type: 'bomb', icon: '💣', value: -15 }
    ]
    
    // Компьютеды
    const timePercent = computed(() => (time.value / 60) * 100)
    
    // ========================
    // ОСНОВНЫЕ МЕТОДЫ ИГРЫ
    // ========================
    
    // Инициализация игры
    const initGame = () => {
      const width = window.innerWidth
      bucketPosition.value = Math.max(0, (width - 80) / 2)
    }
    
    // Обратный отсчет
    const startCountdown = () => {
      countdownTimer = setInterval(() => {
        countdown.value--
        if (countdown.value <= 0) {
          clearInterval(countdownTimer)
          showCountdown.value = false
          startGame()
        }
      }, 1000)
    }
    
    // Начало игры
    const startGame = () => {
      loadBestScore()
      
      time.value = 60
      score.value = 0
      gameOver.value = false
      isPlaying.value = true
      isNewRecord.value = false
      items.value = []
      
      // Позиция ведра
      initGame()
      
      // Таймер игры
      gameTimer = setInterval(() => {
        time.value--
        if (time.value <= 0) endGame()
      }, 1000)
      
      // Генерация предметов
      itemTimer = setInterval(createItem, 800)
      
      // Игровой цикл
      gameLoop = setInterval(updateGame, 16)
    }
    
    // Создание предмета
    const createItem = () => {
      if (!isPlaying.value || gameOver.value) return
      
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
      if (!isPlaying.value || gameOver.value) return
      
      const screenHeight = window.innerHeight
      const updatedItems = []
      
      for (const item of items.value) {
        item.y += item.speed
        
        // Проверка столкновения
        if (item.y > screenHeight - 150) {
          const bucketLeft = bucketPosition.value
          const bucketRight = bucketPosition.value + 80
          const itemLeft = item.x
          const itemRight = item.x + 60
          
          if (itemLeft < bucketRight && itemRight > bucketLeft) {
            score.value += item.value
            continue // Удаляем предмет
          }
        }
        
        // Оставляем если еще на экране
        if (item.y < screenHeight + 100) {
          updatedItems.push(item)
        }
      }
      
      items.value = updatedItems
    }
    
    // Конец игры
    const endGame = () => {
      gameOver.value = true
      isPlaying.value = false
      
      // Очистка таймеров
      clearInterval(gameTimer)
      clearInterval(itemTimer)
      clearInterval(gameLoop)
      
      // Проверка нового рекорда
      if (score.value > bestScore.value) {
        isNewRecord.value = true
        bestScore.value = score.value
        saveBestScore()
      }
    }
    
    // Перезапуск
    const restartGame = () => {
      clearAllTimers()
      gameOver.value = false
      items.value = []
      isNewRecord.value = false
      countdown.value = 3
      showCountdown.value = true
      startCountdown()
    }
    
    // Очистка всех таймеров
    const clearAllTimers = () => {
      if (countdownTimer) clearInterval(countdownTimer)
      if (gameTimer) clearInterval(gameTimer)
      if (itemTimer) clearInterval(itemTimer)
      if (gameLoop) clearInterval(gameLoop)
    }
    
    // ========================
    // УПРАВЛЕНИЕ (используем Pointer Events)
    // ========================
    
    const startDrag = (e) => {
      if (!isPlaying.value) return
      e.preventDefault()
      isDragging.value = true
      dragStartX.value = e.clientX
      bucketStartX.value = bucketPosition.value
      
      // Устанавливаем захват указателя
      e.currentTarget.setPointerCapture(e.pointerId)
    }
    
    const moveDrag = (e) => {
      if (!isPlaying.value || !isDragging.value) return
      e.preventDefault()
      
      const dragX = e.clientX
      const deltaX = dragX - dragStartX.value
      const width = window.innerWidth
      
      let newPos = bucketStartX.value + deltaX
      newPos = Math.max(0, Math.min(width - 80, newPos))
      
      bucketPosition.value = newPos
    }
    
    const stopDrag = () => {
      isDragging.value = false
    }
    
    // ========================
    // СОХРАНЕНИЕ ДАННЫХ
    // ========================
    
    // Загрузка лучшего счета
    const loadBestScore = () => {
      try {
        const saved = localStorage.getItem('catch_game_best_score')
        if (saved) {
          bestScore.value = parseInt(saved) || 0
        }
      } catch (error) {
        console.log('Не удалось загрузить счет из localStorage')
      }
    }
    
    // Сохранение лучшего счета
    const saveBestScore = () => {
      try {
        localStorage.setItem('catch_game_best_score', bestScore.value.toString())
        console.log('Счет сохранен локально:', bestScore.value)
      } catch (error) {
        console.log('Не удалось сохранить счет в localStorage')
      }
    }
    
    // ========================
    // ЖИЗНЕННЫЙ ЦИКЛ
    // ========================
    
    onMounted(() => {
      initGame()
      window.addEventListener('resize', initGame)
      
      // Запуск обратного отсчета
      setTimeout(() => {
        startCountdown()
      }, 500)
    })
    
    onUnmounted(() => {
      clearAllTimers()
      window.removeEventListener('resize', initGame)
    })
    
    return {
      // Реактивные данные
      time, score, bestScore, gameOver, isPlaying,
      showCountdown, countdown, isNewRecord, timePercent,
      bucketPosition, items,
      
      // Методы
      restartGame,
      startDrag, moveDrag, stopDrag
    }
  }
}
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
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 100;
  background: rgba(0, 0, 0, 0.3);
}

/* Прогресс-бар времени */
.time-bar-container {
  width: 100%;
  height: 16px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  overflow: hidden;
  position: relative;
}

.time-bar {
  height: 100%;
  background: linear-gradient(90deg, #ff4500, #ff8c00);
  border-radius: 8px;
  transition: width 1s linear;
}

.time-text {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 11px;
  text-shadow: 0 1px 2px rgba(0,0,0,0.8);
}

/* Отображение счета */
.score-display {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 8px 16px;
}

.score {
  font-size: 32px;
  font-weight: bold;
  color: #fff;
  text-shadow: 0 0 10px rgba(100, 255, 100, 0.8);
}

.best-score {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
}

/* Игровое поле */
.game-area {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}

/* Предметы */
.item {
  position: absolute;
  width: 50px;
  height: 50px;
  font-size: 36px;
  text-align: center;
  line-height: 50px;
  pointer-events: none;
  z-index: 10;
  will-change: transform;
  transition: transform 0.1s;
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

/* Ведро */
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
  -webkit-user-drag: none;
}

.bucket:active {
  transform: scale(0.95);
}

/* Градиент */
.gradient {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 150px;
  background: linear-gradient(to top, 
    rgba(255, 69, 0, 0.3) 0%, 
    rgba(255, 69, 0, 0.15) 50%, 
    transparent 100%);
  pointer-events: none;
  z-index: 1;
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

.final-best {
  color: #ffd700;
  font-size: 22px;
  margin: 8px 0;
}

.new-record {
  color: #4dff88;
  font-size: 24px;
  font-weight: bold;
  margin: 16px 0;
  text-shadow: 0 0 8px rgba(77, 255, 136, 0.8);
  animation: glowText 1.5s infinite alternate;
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
  transition: all 0.2s;
  font-weight: bold;
  letter-spacing: 1px;
  box-shadow: 0 4px 12px rgba(255, 69, 0, 0.4);
}

.game-over button:hover {
  background: linear-gradient(to right, #ff5500, #ff9c00);
  transform: scale(1.05);
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

@keyframes glowText {
  from { text-shadow: 0 0 8px rgba(77, 255, 136, 0.6); }
  to { text-shadow: 0 0 16px rgba(77, 255, 136, 1); }
}

/* Адаптивность */
@media (max-width: 768px) {
  .countdown-number { font-size: 70px; }
  .score { font-size: 28px; }
  .best-score { font-size: 12px; }
  .bucket { 
    width: 65px; 
    height: 65px; 
    font-size: 46px; 
    line-height: 65px; 
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
  .final-best { font-size: 20px; }
  .new-record { font-size: 20px; }
  .game-over button { padding: 12px 28px; font-size: 16px; }
}

@media (max-width: 480px) {
  .countdown-number { font-size: 50px; }
  .bucket { 
    width: 60px; 
    height: 60px; 
    font-size: 42px; 
    line-height: 60px; 
    bottom: 60px; 
  }
  .item { 
    width: 40px; 
    height: 40px; 
    font-size: 28px; 
    line-height: 40px; 
  }
}
</style>
