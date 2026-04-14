import { useState, useEffect, useRef, useCallback } from 'react'
import { QRCodeSVG } from 'qrcode.react'

// ─── Prompts ────────────────────────────────────────────────────────────────

const PROMPTS = {
  1: [
    "If your job had a theme song, what genre would it be?",
    "What's the thing you actually do vs what your job title says you do?",
    "What brought you into the room tonight — work curiosity, personal project, or mild chaos?",
    "If you had to explain your job to a 10-year-old, what's the one sentence version?",
    "What's the tab you always have open that says the most about you?",
    "Are you here because someone sent you a link, or did you find this yourself?",
  ],
  2: [
    "What's a problem you've been quietly trying to solve for months?",
    "What did you try to build with AI that completely fell apart?",
    "Where does your work end and your actual interests begin — or is there no line?",
    "What's the last thing you made that you were genuinely proud of?",
    "What would you be working on if no one was paying you?",
    "What's a tool or idea you think is underrated right now?",
  ],
  3: [
    "What's your honest take on AI — excited, nervous, or performing one of those?",
    "What's a take you have about your industry that would get you in trouble?",
    "What's the most overhyped thing in tech right now?",
    "If you could delete one meeting format from existence, which one?",
    "What's something you used to believe about your work that you've completely reversed on?",
    "What's the skill you have that no one at your company knows about?",
  ],
  4: [
    "What would you actually want to build together if you met the right person tonight?",
    "What's the one intro you're hoping someone makes for you this year?",
    "If tonight spawned a side project, what would it be?",
    "What are you looking for that LinkedIn search can't find?",
    "Who's the person in the room you most want to talk to and why haven't you yet?",
    "What would make tonight actually useful to you in 6 months time?",
  ],
}

function getTier(round) {
  if (round <= 2) return 1
  if (round <= 4) return 2
  if (round <= 6) return 3
  return 4
}

function getPrompt(round) {
  const tier = getTier(round)
  const pool = PROMPTS[tier]
  return pool[Math.floor(Math.random() * pool.length)]
}

// ─── Game Modes ─────────────────────────────────────────────────────────────

const MODES = ['TAP_RACE', 'REACTION', 'PATTERN', 'QUICK_DRAW', 'RELEASE']

const MODE_META = {
  TAP_RACE:   { name: 'TAP RACE',   rule: 'Tap your zone as fast as you can. Most taps in 5 seconds wins.' },
  REACTION:   { name: 'REACTION',   rule: 'Wait for the flash, then tap first. False start = you lose.' },
  PATTERN:    { name: 'PATTERN',    rule: 'Mirror the sequence with ← ● →. First to finish correctly wins.' },
  QUICK_DRAW: { name: 'QUICK DRAW', rule: 'Hold your zone when HOLD appears. Press before = false start.' },
  RELEASE:    { name: 'RELEASE',    rule: 'Hold to start. Release the moment LET GO flashes. Fastest wins.' },
}

function pickMode() {
  return MODES[Math.floor(Math.random() * MODES.length)]
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const S = {
  root: {
    position: 'fixed',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    background: '#0a0a0a',
    overflow: 'hidden',
    touchAction: 'none',
    userSelect: 'none',
    WebkitUserSelect: 'none',
  },
  // ── Idle ──
  idleWrap: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1.5rem',
    padding: '2rem',
  },
  logo: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: 'clamp(5rem, 20vw, 9rem)',
    lineHeight: 1,
    letterSpacing: '0.05em',
    color: '#E8FF47',
  },
  tagline: {
    fontFamily: "'Space Mono', monospace",
    fontSize: 'clamp(0.75rem, 3vw, 1rem)',
    color: '#888',
    textAlign: 'center',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
  armBtn: {
    marginTop: '1rem',
    background: '#E8FF47',
    color: '#0a0a0a',
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: 'clamp(1.4rem, 6vw, 2rem)',
    letterSpacing: '0.1em',
    border: 'none',
    padding: '1rem 3rem',
    cursor: 'pointer',
    outline: 'none',
    WebkitTapHighlightColor: 'transparent',
  },
  qrBtn: {
    position: 'absolute',
    bottom: '1.5rem',
    right: '1.5rem',
    background: 'transparent',
    border: '1px solid #333',
    borderRadius: '6px',
    width: '2.5rem',
    height: '2.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    outline: 'none',
    WebkitTapHighlightColor: 'transparent',
  },
  // ── QR Modal ──
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.85)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  modalBox: {
    background: '#fff',
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.75rem',
  },
  modalLabel: {
    fontFamily: "'Space Mono', monospace",
    fontSize: '0.65rem',
    color: '#0a0a0a',
    textAlign: 'center',
    letterSpacing: '0.05em',
  },
  // ── Reveal ──
  revealWrap: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1rem',
    padding: '2rem',
  },
  revealMode: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: 'clamp(3rem, 14vw, 6rem)',
    color: '#E8FF47',
    letterSpacing: '0.05em',
    textAlign: 'center',
  },
  revealRule: {
    fontFamily: "'Space Mono', monospace",
    fontSize: 'clamp(0.7rem, 3vw, 0.9rem)',
    color: '#aaa',
    textAlign: 'center',
    maxWidth: '26ch',
    lineHeight: 1.5,
  },
  countdown: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: 'clamp(5rem, 22vw, 10rem)',
    color: '#fff',
    lineHeight: 1,
    animation: 'pulse 0.5s ease-in-out',
  },
  goText: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: 'clamp(5rem, 22vw, 10rem)',
    color: '#E8FF47',
    lineHeight: 1,
    animation: 'pulse 0.3s ease-in-out',
  },
  // ── Play layout ──
  zone: (flipped, bg, active) => ({
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transform: flipped ? 'rotate(180deg)' : 'none',
    background: bg || '#111',
    transition: 'background 0.1s',
    cursor: 'pointer',
    WebkitTapHighlightColor: 'transparent',
  }),
  centreBar: {
    flexShrink: 0,
    height: '4.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#1a1a1a',
    borderTop: '1px solid #222',
    borderBottom: '1px solid #222',
    position: 'relative',
  },
  centreText: (color) => ({
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: 'clamp(1.2rem, 5vw, 1.8rem)',
    color: color || '#fff',
    letterSpacing: '0.08em',
  }),
  zoneLabel: (color) => ({
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: 'clamp(2rem, 10vw, 4rem)',
    color: color || '#333',
    letterSpacing: '0.1em',
    pointerEvents: 'none',
  }),
  tapCount: {
    position: 'absolute',
    fontFamily: "'Space Mono', monospace",
    fontSize: 'clamp(0.65rem, 2.5vw, 0.8rem)',
    color: '#666',
  },
  // ── Result ──
  resultWrap: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1.2rem',
    padding: '2rem',
  },
  resultTitle: {
    fontFamily: "'Space Mono', monospace",
    fontSize: 'clamp(0.65rem, 2.5vw, 0.8rem)',
    color: '#555',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
  },
  winnerName: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: 'clamp(4rem, 18vw, 7rem)',
    color: '#E8FF47',
    lineHeight: 1,
    animation: 'slideUp 0.5s ease-out',
  },
  tierBadge: {
    fontFamily: "'Space Mono', monospace",
    fontSize: 'clamp(0.55rem, 2vw, 0.7rem)',
    color: '#555',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
  },
  prompt: {
    fontFamily: "'Space Mono', monospace",
    fontSize: 'clamp(0.8rem, 3.5vw, 1.1rem)',
    color: '#fff',
    textAlign: 'center',
    maxWidth: '28ch',
    lineHeight: 1.6,
    animation: 'slideUp 0.6s ease-out 0.15s both',
  },
  promptArrow: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: 'clamp(0.9rem, 3.5vw, 1.2rem)',
    color: '#555',
    letterSpacing: '0.08em',
    animation: 'slideUp 0.6s ease-out 0.2s both',
  },
  btnRow: {
    display: 'flex',
    gap: '1rem',
    marginTop: '0.5rem',
  },
  btn: (primary) => ({
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: 'clamp(1.1rem, 5vw, 1.5rem)',
    letterSpacing: '0.1em',
    padding: '0.8rem 2rem',
    border: primary ? 'none' : '1px solid #333',
    background: primary ? '#E8FF47' : 'transparent',
    color: primary ? '#0a0a0a' : '#888',
    cursor: 'pointer',
    outline: 'none',
    WebkitTapHighlightColor: 'transparent',
  }),
}

// ─── QR Icon ────────────────────────────────────────────────────────────────

function QRIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="1" y="1" width="6" height="6" rx="0.5" stroke="#666" strokeWidth="1.5" fill="none"/>
      <rect x="11" y="1" width="6" height="6" rx="0.5" stroke="#666" strokeWidth="1.5" fill="none"/>
      <rect x="1" y="11" width="6" height="6" rx="0.5" stroke="#666" strokeWidth="1.5" fill="none"/>
      <rect x="3" y="3" width="2" height="2" fill="#666"/>
      <rect x="13" y="3" width="2" height="2" fill="#666"/>
      <rect x="3" y="13" width="2" height="2" fill="#666"/>
      <rect x="11" y="11" width="2" height="2" fill="#666"/>
      <rect x="14" y="11" width="3" height="2" fill="#666"/>
      <rect x="11" y="14" width="2" height="3" fill="#666"/>
      <rect x="14" y="14" width="3" height="3" fill="#666"/>
    </svg>
  )
}

// ─── Idle Screen ─────────────────────────────────────────────────────────────

function IdleScreen({ onArm }) {
  const [showQR, setShowQR] = useState(false)
  return (
    <>
      <div style={S.idleWrap}>
        <div style={S.logo}>DUEL</div>
        <div style={S.tagline}>Two players. One phone.{'\n'}Loser starts the conversation.</div>
        <button
          style={S.armBtn}
          onPointerDown={onArm}
        >
          ARM
        </button>
      </div>

      <button
        style={S.qrBtn}
        onPointerDown={() => setShowQR(true)}
        aria-label="LinkedIn QR code"
      >
        <QRIcon />
      </button>

      {showQR && (
        <div
          style={S.modalOverlay}
          onPointerDown={() => setShowQR(false)}
        >
          <div
            style={S.modalBox}
            onPointerDown={e => e.stopPropagation()}
          >
            <QRCodeSVG
              value="https://www.linkedin.com/in/alice-springett-816116172"
              size={180}
              bgColor="#fff"
              fgColor="#0a0a0a"
            />
            <div style={S.modalLabel}>linkedin.com/in/alice-springett-816116172</div>
          </div>
        </div>
      )}
    </>
  )
}

// ─── Reveal Screen ───────────────────────────────────────────────────────────

function RevealScreen({ mode, onDone }) {
  const [step, setStep] = useState('mode') // mode → 3 → 2 → 1 → go
  const meta = MODE_META[mode]

  useEffect(() => {
    const seq = [
      { from: 'mode', to: '3',  delay: 1400 },
      { from: '3',    to: '2',  delay: 900  },
      { from: '2',    to: '1',  delay: 900  },
      { from: '1',    to: 'go', delay: 900  },
      { from: 'go',   to: null, delay: 700  },
    ]
    let timer
    function run(s) {
      const entry = seq.find(e => e.from === s)
      if (!entry) return
      timer = setTimeout(() => {
        if (entry.to) {
          setStep(entry.to)
          run(entry.to)
        } else {
          onDone()
        }
      }, entry.delay)
    }
    run(step)
    return () => clearTimeout(timer)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={S.revealWrap}>
      {step === 'mode' && (
        <>
          <div style={S.revealMode}>{meta.name}</div>
          <div style={S.revealRule}>{meta.rule}</div>
        </>
      )}
      {step === '3' && <div key="3" style={S.countdown}>3</div>}
      {step === '2' && <div key="2" style={S.countdown}>2</div>}
      {step === '1' && <div key="1" style={S.countdown}>1</div>}
      {step === 'go' && <div key="go" style={S.goText}>GO</div>}
    </div>
  )
}

// ─── TAP RACE ───────────────────────────────────────────────────────────────

function TapRaceGame({ onResult }) {
  const DURATION = 5000
  const [timeLeft, setTimeLeft] = useState(DURATION)
  const [counts, setCounts] = useState([0, 0])
  const countsRef = useRef([0, 0])
  const resolvedRef = useRef(false)

  useEffect(() => {
    const start = Date.now()
    const interval = setInterval(() => {
      const elapsed = Date.now() - start
      const remaining = Math.max(0, DURATION - elapsed)
      setTimeLeft(remaining)
      if (remaining <= 0) {
        clearInterval(interval)
        if (!resolvedRef.current) {
          resolvedRef.current = true
          const [a, b] = countsRef.current
          let winner
          if (a > b) winner = 0
          else if (b > a) winner = 1
          else winner = Math.random() < 0.5 ? 0 : 1
          onResult(winner)
        }
      }
    }, 100)
    return () => clearInterval(interval)
  }, [onResult])

  const tap = useCallback((player) => {
    if (resolvedRef.current) return
    countsRef.current[player]++
    setCounts([...countsRef.current])
  }, [])

  const displayTime = (timeLeft / 1000).toFixed(1)

  return (
    <>
      <div
        style={{ ...S.zone(true, '#111'), flex: 1 }}
        onPointerDown={() => tap(0)}
      >
        <span style={S.zoneLabel('#2a2a2a')}>TAP</span>
      </div>
      <div style={S.centreBar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <span style={{ ...S.centreText('#E8FF47'), minWidth: '3ch', textAlign: 'right' }}>
            {counts[0]}
          </span>
          <span style={S.centreText('#555')}>
            {displayTime}s
          </span>
          <span style={{ ...S.centreText('#E8FF47'), minWidth: '3ch', textAlign: 'left' }}>
            {counts[1]}
          </span>
        </div>
      </div>
      <div
        style={{ ...S.zone(false, '#111'), flex: 1 }}
        onPointerDown={() => tap(1)}
      >
        <span style={S.zoneLabel('#2a2a2a')}>TAP</span>
      </div>
    </>
  )
}

// ─── REACTION ───────────────────────────────────────────────────────────────

function ReactionGame({ onResult }) {
  const [phase, setPhase] = useState('waiting') // waiting | flash | done
  const resolvedRef = useRef(false)
  const flashTimeRef = useRef(null)

  useEffect(() => {
    const delay = 1800 + Math.random() * 3500
    const timer = setTimeout(() => {
      flashTimeRef.current = Date.now()
      setPhase('flash')
    }, delay)
    return () => clearTimeout(timer)
  }, [])

  const handlePress = useCallback((player) => {
    if (resolvedRef.current) return
    resolvedRef.current = true
    if (phase === 'waiting') {
      // false start
      onResult(1 - player)
    } else {
      onResult(player)
    }
  }, [phase, onResult])

  const bg = phase === 'flash' ? '#E8FF47' : '#111'
  const label = phase === 'flash' ? '' : ''

  return (
    <>
      <div
        style={{ ...S.zone(true, bg), flex: 1, transition: 'background 0.05s' }}
        onPointerDown={() => handlePress(0)}
      >
        {phase === 'waiting' && <span style={S.zoneLabel('#1a1a1a')}>READY</span>}
      </div>
      <div style={S.centreBar}>
        <span style={S.centreText(phase === 'flash' ? '#0a0a0a' : '#444')}>
          {phase === 'waiting' ? 'WAIT...' : 'NOW!'}
        </span>
      </div>
      <div
        style={{ ...S.zone(false, bg), flex: 1, transition: 'background 0.05s' }}
        onPointerDown={() => handlePress(1)}
      >
        {phase === 'waiting' && <span style={S.zoneLabel('#1a1a1a')}>READY</span>}
      </div>
    </>
  )
}

// ─── PATTERN ────────────────────────────────────────────────────────────────

const PATTERN_DIRS = ['L', 'C', 'R']

function generatePattern() {
  const len = 4 + Math.floor(Math.random() * 3) // 4–6
  return Array.from({ length: len }, () => PATTERN_DIRS[Math.floor(Math.random() * 3)])
}

function PatternGame({ onResult }) {
  const [sequence] = useState(generatePattern)
  const [playIdx, setPlayIdx] = useState(0)        // which step is highlighted during playback
  const [playDone, setPlayDone] = useState(false)  // playback finished
  const [highlight, setHighlight] = useState(null) // 'L'|'C'|'R'|null during playback
  const inputRef = useRef([[], []])                // inputs per player
  const resolvedRef = useRef(false)

  // Playback
  useEffect(() => {
    let i = 0
    function step() {
      if (i >= sequence.length) {
        setHighlight(null)
        setPlayDone(true)
        return
      }
      setHighlight(sequence[i])
      setPlayIdx(i)
      i++
      setTimeout(step, 550)
    }
    const t = setTimeout(step, 600)
    return () => clearTimeout(t)
  }, [sequence])

  const handleInput = useCallback((player, dir) => {
    if (!playDone || resolvedRef.current) return
    const arr = inputRef.current[player]
    arr.push(dir)
    const expected = sequence[arr.length - 1]

    if (dir !== expected) {
      // wrong — opponent wins
      if (!resolvedRef.current) {
        resolvedRef.current = true
        onResult(1 - player)
      }
      return
    }
    if (arr.length === sequence.length) {
      // completed
      if (!resolvedRef.current) {
        resolvedRef.current = true
        // check if both finished simultaneously (unlikely but handle)
        onResult(player)
      }
    }
  }, [playDone, sequence, onResult])

  function PatternButtons({ player, flipped }) {
    const progress = inputRef.current[player].length
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          transform: flipped ? 'rotate(180deg)' : 'none',
          gap: '0.5rem',
        }}
      >
        {/* Sequence dots */}
        <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.5rem' }}>
          {sequence.map((s, i) => (
            <div
              key={i}
              style={{
                width: '0.5rem',
                height: '0.5rem',
                borderRadius: '50%',
                background: i < progress ? '#E8FF47' : (highlight === s && !playDone ? '#E8FF47' : '#333'),
                transition: 'background 0.1s',
              }}
            />
          ))}
        </div>
        {/* Buttons */}
        <div style={{ display: 'flex', gap: '1rem' }}>
          {['L', 'C', 'R'].map(dir => (
            <div
              key={dir}
              style={{
                width: 'clamp(3rem, 12vw, 4rem)',
                height: 'clamp(3rem, 12vw, 4rem)',
                background: (!playDone && highlight === dir) ? '#E8FF47' : '#222',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
                transition: 'background 0.1s',
              }}
              onPointerDown={() => handleInput(player, dir)}
            >
              <span style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: 'clamp(1rem, 4vw, 1.5rem)',
                color: (!playDone && highlight === dir) ? '#0a0a0a' : '#666',
              }}>
                {dir === 'L' ? '←' : dir === 'R' ? '→' : '●'}
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      <PatternButtons player={0} flipped={true} />
      <div style={S.centreBar}>
        <span style={S.centreText(!playDone ? '#E8FF47' : '#555')}>
          {!playDone ? 'WATCH' : 'GO'}
        </span>
      </div>
      <PatternButtons player={1} flipped={false} />
    </>
  )
}

// ─── QUICK DRAW ─────────────────────────────────────────────────────────────

function QuickDrawGame({ onResult }) {
  const [phase, setPhase] = useState('waiting') // waiting | hold | done
  const resolvedRef = useRef(false)

  useEffect(() => {
    const delay = 1800 + Math.random() * 3500
    const timer = setTimeout(() => {
      setPhase('hold')
    }, delay)
    return () => clearTimeout(timer)
  }, [])

  const handlePress = useCallback((player) => {
    if (resolvedRef.current) return
    resolvedRef.current = true
    if (phase === 'waiting') {
      onResult(1 - player)
    } else {
      onResult(player)
    }
  }, [phase, onResult])

  const flashBg = phase === 'hold' ? '#E8FF47' : '#111'

  return (
    <>
      <div
        style={{ ...S.zone(true, flashBg), flex: 1 }}
        onPointerDown={() => handlePress(0)}
      >
        <span style={S.zoneLabel(phase === 'hold' ? '#0a0a0a33' : '#1a1a1a')}>
          {phase === 'waiting' ? 'READY' : ''}
        </span>
      </div>
      <div style={{ ...S.centreBar, background: phase === 'hold' ? '#E8FF47' : '#1a1a1a' }}>
        <span style={S.centreText(phase === 'hold' ? '#0a0a0a' : '#444')}>
          {phase === 'waiting' ? 'WAIT...' : 'HOLD!'}
        </span>
      </div>
      <div
        style={{ ...S.zone(false, flashBg), flex: 1 }}
        onPointerDown={() => handlePress(1)}
      >
        <span style={S.zoneLabel(phase === 'hold' ? '#0a0a0a33' : '#1a1a1a')}>
          {phase === 'waiting' ? 'READY' : ''}
        </span>
      </div>
    </>
  )
}

// ─── RELEASE ────────────────────────────────────────────────────────────────

function ReleaseGame({ onResult }) {
  // phases: waiting | countdown | flash | beat | done
  const [phase, setPhase] = useState('waiting')
  const [holding, setHolding] = useState([false, false])
  const [countStep, setCountStep] = useState(3)
  const [beatTimes, setBeatTimes] = useState([null, null])

  const holdingRef = useRef([false, false])
  const resolvedRef = useRef(false)
  const flashTimeRef = useRef(null)
  const releasedRef = useRef([false, false])
  const releaseTimesRef = useRef([null, null])
  const phaseRef = useRef('waiting')
  const countdownStartedRef = useRef(false)

  const startCountdown = useCallback(() => {
    let step = 3
    setCountStep(3)
    setPhase('countdown')
    phaseRef.current = 'countdown'

    function tick() {
      step--
      if (step > 0) {
        setCountStep(step)
        setTimeout(tick, 800)
      } else {
        // flash
        flashTimeRef.current = Date.now()
        setPhase('flash')
        phaseRef.current = 'flash'

        // resolve after small window
        setTimeout(() => {
          if (!resolvedRef.current) {
            resolvedRef.current = true
            const [t0, t1] = releaseTimesRef.current
            // if neither released
            if (t0 === null && t1 === null) {
              onResult(Math.random() < 0.5 ? 0 : 1)
            } else if (t0 === null) {
              onResult(1)
            } else if (t1 === null) {
              onResult(0)
            } else {
              const winner = t0 <= t1 ? 0 : 1
              setBeatTimes([t0, t1])
              setPhase('beat')
              phaseRef.current = 'beat'
              // Show beat screen then go to result
              setTimeout(() => onResult(winner), 2000)
              resolvedRef.current = false // allow beat screen to show
            }
          }
        }, 3000)
      }
    }
    setTimeout(tick, 800)
  }, [onResult])

  const handleDown = useCallback((player) => {
    if (phaseRef.current !== 'waiting' && phaseRef.current !== 'countdown') return
    if (phaseRef.current === 'flash') {
      // false start in flash? no — in release, pressing down is penalised only if not already holding
      return
    }
    holdingRef.current[player] = true
    setHolding([...holdingRef.current])

    if (holdingRef.current[0] && holdingRef.current[1] && !countdownStartedRef.current) {
      countdownStartedRef.current = true
      startCountdown()
    }
  }, [startCountdown])

  const handleUp = useCallback((player) => {
    holdingRef.current[player] = false
    setHolding([...holdingRef.current])

    if (phaseRef.current === 'flash' || phaseRef.current === 'countdown') {
      if (phaseRef.current === 'countdown') {
        // Released before flash — opponent wins
        if (!resolvedRef.current) {
          resolvedRef.current = true
          onResult(1 - player)
        }
        return
      }
      // flash phase
      if (!releasedRef.current[player]) {
        releasedRef.current[player] = true
        releaseTimesRef.current[player] = Date.now() - flashTimeRef.current
      }
    }
  }, [onResult])

  if (phase === 'beat') {
    return (
      <>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', transform: 'rotate(180deg)' }}>
          <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(2rem, 10vw, 4rem)', color: '#E8FF47' }}>
            {beatTimes[0] !== null ? `${beatTimes[0]}ms` : '—'}
          </span>
        </div>
        <div style={S.centreBar}>
          <span style={S.centreText('#555')}>REACTION TIME</span>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(2rem, 10vw, 4rem)', color: '#E8FF47' }}>
            {beatTimes[1] !== null ? `${beatTimes[1]}ms` : '—'}
          </span>
        </div>
      </>
    )
  }

  const bothHolding = holding[0] && holding[1]
  const flashActive = phase === 'flash'
  const zoneBg = flashActive ? '#E8FF47' : (phase === 'countdown' ? '#1a2a0a' : '#111')

  function centreContent() {
    if (phase === 'waiting') {
      if (!holding[0] && !holding[1]) return 'HOLD BOTH'
      if (holding[0] && !holding[1]) return 'WAITING...'
      if (!holding[0] && holding[1]) return 'WAITING...'
      return 'BOTH HELD'
    }
    if (phase === 'countdown') return `${countStep}`
    if (phase === 'flash') return 'LET GO!'
    return ''
  }

  const centreColor = flashActive ? '#0a0a0a' : (phase === 'countdown' ? '#E8FF47' : '#555')

  return (
    <>
      <div
        style={{ ...S.zone(true, zoneBg), flex: 1, transition: 'background 0.05s' }}
        onPointerDown={() => handleDown(0)}
        onPointerUp={() => handleUp(0)}
      >
        {!holding[0] && phase === 'waiting' && (
          <span style={S.zoneLabel('#1a1a1a')}>HOLD</span>
        )}
      </div>
      <div style={{ ...S.centreBar, background: flashActive ? '#E8FF47' : '#1a1a1a' }}>
        <span style={{ ...S.centreText(centreColor), animation: phase === 'countdown' ? 'pulse 0.4s ease-in-out' : 'none' }}>
          {centreContent()}
        </span>
      </div>
      <div
        style={{ ...S.zone(false, zoneBg), flex: 1, transition: 'background 0.05s' }}
        onPointerDown={() => handleDown(1)}
        onPointerUp={() => handleUp(1)}
      >
        {!holding[1] && phase === 'waiting' && (
          <span style={S.zoneLabel('#1a1a1a')}>HOLD</span>
        )}
      </div>
    </>
  )
}

// ─── Playing Screen ──────────────────────────────────────────────────────────

function PlayingScreen({ mode, onResult }) {
  const GameComponent = {
    TAP_RACE:   TapRaceGame,
    REACTION:   ReactionGame,
    PATTERN:    PatternGame,
    QUICK_DRAW: QuickDrawGame,
    RELEASE:    ReleaseGame,
  }[mode]

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <GameComponent onResult={onResult} />
    </div>
  )
}

// ─── Result Screen ───────────────────────────────────────────────────────────

function ResultScreen({ winner, round, onRematch, onNewPerson }) {
  const tier = getTier(round)
  const prompt = useRef(getPrompt(round)).current
  const winnerLabel = winner === 0 ? 'PLAYER 1' : 'PLAYER 2'
  const tierLabels = { 1: 'OPENER', 2: 'GO DEEPER', 3: 'SPICY', 4: 'CONNECT' }

  return (
    <div style={S.resultWrap}>
      <div style={S.resultTitle}>WINNER</div>
      <div style={S.winnerName}>{winnerLabel}</div>
      <div style={S.tierBadge}>TIER {tier} — {tierLabels[tier]}</div>
      <div style={{ width: '3rem', height: '1px', background: '#222', margin: '0.25rem 0' }} />
      <div style={S.promptArrow}>LOSER ASKS →</div>
      <div style={S.prompt}>"{prompt}"</div>
      <div style={S.btnRow}>
        <button style={S.btn(false)} onPointerDown={onNewPerson}>NEW PERSON</button>
        <button style={S.btn(true)} onPointerDown={onRematch}>REMATCH</button>
      </div>
    </div>
  )
}

// ─── Root App ────────────────────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen] = useState('idle')   // idle | reveal | playing | result
  const [mode, setMode] = useState(null)
  const [winner, setWinner] = useState(null)
  const roundRef = useRef(0)

  const handleArm = useCallback(() => {
    const m = pickMode()
    setMode(m)
    setScreen('reveal')
  }, [])

  const handleRevealDone = useCallback(() => {
    setScreen('playing')
  }, [])

  const handleResult = useCallback((w) => {
    roundRef.current++
    setWinner(w)
    setScreen('result')
  }, [])

  const handleRematch = useCallback(() => {
    const m = pickMode()
    setMode(m)
    setScreen('reveal')
  }, [])

  const handleNewPerson = useCallback(() => {
    roundRef.current = 0
    setMode(null)
    setWinner(null)
    setScreen('idle')
  }, [])

  return (
    <div style={S.root}>
      {screen === 'idle' && (
        <IdleScreen onArm={handleArm} />
      )}
      {screen === 'reveal' && (
        <RevealScreen mode={mode} onDone={handleRevealDone} />
      )}
      {screen === 'playing' && (
        <PlayingScreen
          key={roundRef.current}
          mode={mode}
          onResult={handleResult}
        />
      )}
      {screen === 'result' && (
        <ResultScreen
          winner={winner}
          round={roundRef.current}
          onRematch={handleRematch}
          onNewPerson={handleNewPerson}
        />
      )}
    </div>
  )
}
