'use client'

import { useState, useEffect, useRef } from 'react'

type GameState = 'idle' | 'shuffling' | 'waiting' | 'revealed'

interface TacoData {
  id: number
  position: number
}

interface ConfettiPiece {
  id: number
  x: number
  color: string
  duration: number
  delay: number
  size: number
  isCircle: boolean
}

interface FillingPiece {
  id: number
  emoji: string
  offsetX: number
  fallDuration: number
  delay: number
}

const SLOT_WIDTH = 130
const NUM_TACOS = 5
const CONTAINER_WIDTH = SLOT_WIDTH * NUM_TACOS

const CONFETTI_COLORS = ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#C77DFF', '#FF9F1C', '#FF6B6B', '#4ECDC4']
const FILLING_EMOJIS = ['🥬', '🧀', '🍅', '🥩', '🌶️']

function generateConfetti(): ConfettiPiece[] {
  return Array.from({ length: 110 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    duration: 2.5 + Math.random() * 2,
    delay: Math.random() * 1.8,
    size: 7 + Math.random() * 11,
    isCircle: Math.random() > 0.5,
  }))
}

function generateFillings(): FillingPiece[] {
  return FILLING_EMOJIS.flatMap((emoji, ei) =>
    Array.from({ length: 3 }, (_, j) => ({
      id: ei * 3 + j,
      emoji,
      offsetX: -25 + Math.random() * 50,
      fallDuration: 0.7 + Math.random() * 0.5,
      delay: ei * 0.06 + j * 0.09,
    }))
  )
}

export default function TacoGame() {
  const [gameState, setGameState] = useState<GameState>('idle')
  const [tacos, setTacos] = useState<TacoData[]>(
    Array.from({ length: NUM_TACOS }, (_, i) => ({ id: i, position: i }))
  )
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [isWin, setIsWin] = useState(false)
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([])
  const [fillings, setFillings] = useState<FillingPiece[]>([])
  const shuffleActiveRef = useRef(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (gameState !== 'shuffling') return

    shuffleActiveRef.current = true
    let count = 0

    const step = () => {
      if (!shuffleActiveRef.current) return
      count++

      setTacos(prev => {
        const arr = [...prev]
        const a = Math.floor(Math.random() * NUM_TACOS)
        let b = Math.floor(Math.random() * (NUM_TACOS - 1))
        if (b >= a) b++
        const tmp = arr[a].position
        arr[a] = { ...arr[a], position: arr[b].position }
        arr[b] = { ...arr[b], position: tmp }
        return arr
      })

      if (count < 32) {
        const speed = count < 18 ? 65 : count < 27 ? 130 : 220
        timerRef.current = setTimeout(step, speed)
      } else {
        setGameState('waiting')
      }
    }

    timerRef.current = setTimeout(step, 65)

    return () => {
      shuffleActiveRef.current = false
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [gameState])

  const startGame = () => {
    shuffleActiveRef.current = false
    if (timerRef.current) clearTimeout(timerRef.current)
    setTacos(Array.from({ length: NUM_TACOS }, (_, i) => ({ id: i, position: i })))
    setSelectedId(null)
    setIsWin(false)
    setConfetti([])
    setFillings([])
    setGameState('shuffling')
  }

  const handleTacoClick = (id: number) => {
    if (gameState !== 'waiting') return

    const win = Math.random() < 0.2
    setSelectedId(id)
    setIsWin(win)
    setGameState('revealed')

    if (win) {
      setConfetti(generateConfetti())
    } else {
      setFillings(generateFillings())
    }
  }

  const isShuffling = gameState === 'shuffling'
  const isWaiting = gameState === 'waiting'
  const isRevealed = gameState === 'revealed'

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      overflow: 'hidden',
      position: 'relative',
      padding: '20px',
    }}>
      <style>{`
        @keyframes confettiFall {
          0%   { transform: translateY(-20px) rotate(0deg) scale(1);   opacity: 1; }
          80%  { opacity: 1; }
          100% { transform: translateY(105vh) rotate(800deg) scale(0.5); opacity: 0; }
        }
        @keyframes fillFall {
          0%   { transform: translateY(0px) rotate(0deg) scale(1);   opacity: 1; }
          100% { transform: translateY(130px) rotate(200deg) scale(0.5); opacity: 0; }
        }
        @keyframes winBounce {
          0%,100% { transform: scale(1)    rotate(0deg); }
          30%      { transform: scale(1.35) rotate(-12deg); }
          60%      { transform: scale(1.35) rotate(12deg); }
        }
        @keyframes winGlow {
          0%,100% { filter: drop-shadow(0 0 10px gold) drop-shadow(0 0 20px orange); }
          50%      { filter: drop-shadow(0 0 25px gold) drop-shadow(0 0 50px gold); }
        }
        @keyframes loseFlip {
          0%   { transform: rotate(0deg) scale(1); }
          50%  { transform: rotate(90deg) scale(0.9); }
          100% { transform: rotate(180deg) scale(1); }
        }
        @keyframes tacoFloat {
          0%,100% { transform: translateY(0px); }
          50%      { transform: translateY(-10px); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px) scale(0.8); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
        @keyframes btnPulse {
          0%,100% { transform: scale(1);    box-shadow: 0 8px 30px rgba(255,107,53,0.5); }
          50%      { transform: scale(1.04); box-shadow: 0 12px 40px rgba(255,107,53,0.8); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20%      { transform: translateX(-6px); }
          40%      { transform: translateX(6px); }
          60%      { transform: translateX(-4px); }
          80%      { transform: translateX(4px); }
        }
        .taco-btn:hover {
          filter: brightness(1.15);
          transform: scale(1.06) !important;
          transition: all 0.15s ease !important;
        }
        .taco-clickable:hover {
          transform: scale(1.12) !important;
          filter: drop-shadow(0 6px 12px rgba(255,200,0,0.6)) !important;
        }
      `}</style>

      {/* Confetti layer */}
      {confetti.map(p => (
        <div
          key={p.id}
          style={{
            position: 'fixed',
            left: `${p.x}%`,
            top: '-30px',
            width: `${p.size}px`,
            height: `${p.size * (p.isCircle ? 1 : 0.5)}px`,
            backgroundColor: p.color,
            borderRadius: p.isCircle ? '50%' : '2px',
            animation: `confettiFall ${p.duration}s ${p.delay}s linear forwards`,
            pointerEvents: 'none',
            zIndex: 50,
          }}
        />
      ))}

      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: '12px' }}>
        <h1 style={{
          color: 'white',
          fontSize: 'clamp(1.8rem, 5vw, 3rem)',
          fontWeight: 900,
          margin: '0 0 6px 0',
          letterSpacing: '3px',
          textTransform: 'uppercase',
          textShadow: '0 2px 30px rgba(255,200,0,0.4)',
        }}>
          🌮 Taco Lucky Dip 🌮
        </h1>
        <p style={{
          color: 'rgba(255,255,255,0.65)',
          fontSize: '1.05rem',
          margin: 0,
          minHeight: '1.4em',
        }}>
          {gameState === 'idle'     && 'Pick your lucky taco — win a $15 gift card!'}
          {gameState === 'shuffling' && '🔀 Watch closely... keep your eye on a taco!'}
          {gameState === 'waiting'   && '👆 Tacos have stopped — pick one now!'}
          {isRevealed && isWin       && '🎉 INCREDIBLE PICK! 🎉'}
          {isRevealed && !isWin      && '😂 Oops — the fillings escaped!'}
        </p>
      </div>

      {/* Taco arena */}
      {gameState !== 'idle' && (
        <div style={{
          position: 'relative',
          width: `${CONTAINER_WIDTH}px`,
          maxWidth: '100%',
          height: '160px',
          margin: '30px auto',
        }}>
          {tacos.map(taco => {
            const isSelected = taco.id === selectedId
            const showWin  = isSelected && isWin  && isRevealed
            const showLose = isSelected && !isWin && isRevealed

            return (
              <div
                key={taco.id}
                onClick={() => handleTacoClick(taco.id)}
                className={isWaiting ? 'taco-clickable' : ''}
                style={{
                  position: 'absolute',
                  left: `${taco.position * SLOT_WIDTH + (SLOT_WIDTH - 100) / 2}px`,
                  top: '0',
                  width: '100px',
                  height: '140px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: isWaiting ? 'pointer' : 'default',
                  transition: `left ${isShuffling ? '0.07s' : '0.25s'} ease`,
                  userSelect: 'none',
                  zIndex: isSelected ? 10 : 1,
                }}
              >
                {/* Falling fillings for selected losing taco */}
                {showLose && fillings.map(f => (
                  <div
                    key={f.id}
                    style={{
                      position: 'absolute',
                      left: `calc(50% + ${f.offsetX}px)`,
                      top: '50px',
                      fontSize: '1.3rem',
                      animation: `fillFall ${f.fallDuration}s ${f.delay}s ease-in forwards`,
                      pointerEvents: 'none',
                      zIndex: 20,
                    }}
                  >
                    {f.emoji}
                  </div>
                ))}

                {/* Taco emoji */}
                <div style={{
                  fontSize: '4.8rem',
                  lineHeight: 1,
                  animation: showWin
                    ? 'winBounce 0.5s ease infinite, winGlow 1s ease infinite'
                    : showLose
                    ? 'loseFlip 0.55s ease forwards'
                    : isWaiting
                    ? 'tacoFloat 2s ease infinite'
                    : undefined,
                  filter: (!isRevealed && isWaiting)
                    ? 'drop-shadow(0 6px 10px rgba(0,0,0,0.6))'
                    : showLose
                    ? 'grayscale(0.4) opacity(0.7)'
                    : undefined,
                  transformOrigin: 'center center',
                  display: 'block',
                }}>
                  🌮
                </div>

                {/* Click indicator dots when waiting */}
                {isWaiting && (
                  <div style={{
                    marginTop: '10px',
                    display: 'flex',
                    gap: '4px',
                  }}>
                    {[0,1,2].map(d => (
                      <div key={d} style={{
                        width: '5px',
                        height: '5px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(255,255,255,0.35)',
                      }} />
                    ))}
                  </div>
                )}

                {/* Shuffling speed indicator */}
                {isShuffling && (
                  <div style={{
                    width: '40px',
                    height: '3px',
                    background: 'linear-gradient(90deg, transparent, rgba(255,200,0,0.6), transparent)',
                    borderRadius: '2px',
                    marginTop: '8px',
                    animation: 'shimmer 0.5s linear infinite',
                    backgroundSize: '200% 100%',
                  }} />
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Result banner */}
      {isRevealed && (
        <div style={{
          animation: 'fadeInUp 0.5s ease forwards',
          textAlign: 'center',
          marginBottom: '28px',
          padding: '0 20px',
        }}>
          {isWin ? (
            <div>
              <div style={{
                fontSize: 'clamp(2rem, 6vw, 3.5rem)',
                fontWeight: 900,
                color: '#FFD700',
                textShadow: '0 0 40px rgba(255,215,0,0.9), 0 0 80px rgba(255,165,0,0.5)',
                marginBottom: '8px',
                animation: 'shimmer 2s linear infinite',
                background: 'linear-gradient(90deg, #FFD700, #FF8C00, #FFD700, #FF8C00, #FFD700)',
                backgroundSize: '300% 100%',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                YOU WIN!
              </div>
              <div style={{
                fontSize: 'clamp(1.4rem, 4vw, 2.2rem)',
                fontWeight: 800,
                color: 'white',
                textShadow: '0 2px 20px rgba(255,255,255,0.3)',
              }}>
                🎁 $15 Gift Card! 🎁
              </div>
            </div>
          ) : (
            <div>
              <div style={{
                fontSize: 'clamp(1.5rem, 4vw, 2.2rem)',
                fontWeight: 800,
                color: 'rgba(255,255,255,0.9)',
                marginBottom: '4px',
                animation: 'shake 0.5s ease',
              }}>
                No luck this time!
              </div>
              <div style={{
                fontSize: '1rem',
                color: 'rgba(255,255,255,0.45)',
              }}>
                The fillings had other plans 🥲
              </div>
            </div>
          )}
        </div>
      )}

      {/* Buttons */}
      {gameState === 'idle' && (
        <button
          onClick={startGame}
          className="taco-btn"
          style={{
            padding: '18px 64px',
            fontSize: '1.35rem',
            fontWeight: 800,
            background: 'linear-gradient(135deg, #FF6B35 0%, #F7C59F 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '60px',
            cursor: 'pointer',
            boxShadow: '0 8px 30px rgba(255,107,53,0.5)',
            animation: 'btnPulse 2.2s ease infinite',
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            textShadow: '0 1px 4px rgba(0,0,0,0.3)',
          }}
        >
          🌮 Start Game
        </button>
      )}

      {isRevealed && (
        <button
          onClick={startGame}
          className="taco-btn"
          style={{
            padding: '14px 44px',
            fontSize: '1.1rem',
            fontWeight: 700,
            background: 'linear-gradient(135deg, #6BCB77 0%, #4D96FF 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '50px',
            cursor: 'pointer',
            boxShadow: '0 6px 20px rgba(75,150,255,0.45)',
            letterSpacing: '1px',
          }}
        >
          🔄 Play Again
        </button>
      )}

      {/* Odds disclaimer */}
      <p style={{
        position: 'fixed',
        bottom: '16px',
        color: 'rgba(255,255,255,0.2)',
        fontSize: '0.72rem',
        letterSpacing: '0.5px',
        margin: 0,
      }}>
        1 in 5 chance of winning · All tacos are equal
      </p>
    </div>
  )
}
