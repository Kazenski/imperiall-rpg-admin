'use client'

import { useEffect, useRef, useState } from 'react'
import { Lottie } from 'lottie-react'

export interface SkillVisualEffect {
  effect_type: string
  effect_color: string
  effect_intensity: number
  effect_lottie_url: string
}

export const EFFECT_TYPES: Record<
  string,
  { label: string; icon: string; color: string }
> = {
  slash: { label: 'Corte', icon: '⚔️', color: '#FF4444' },
  fire: { label: 'Fogo', icon: '🔥', color: '#FF6B35' },
  ice: { label: 'Gelo', icon: '❄️', color: '#38BDF8' },
  heal: { label: 'Cura', icon: '💚', color: '#34D399' },
  poison: { label: 'Veneno', icon: '☠️', color: '#22C55E' },
  lightning: { label: 'Raio', icon: '⚡', color: '#FBBF24' },
  buff: { label: 'Buff', icon: '⬆️', color: '#A78BFA' },
  debuff: { label: 'Debuff', icon: '⬇️', color: '#F87171' },
  arcane: { label: 'Arcano', icon: '✨', color: '#A855F7' },
  dark: { label: 'Trevas', icon: '🌑', color: '#6B21A8' },
}

function prand(seed: number) {
  let x = (seed * 2654435761) >>> 0
  x ^= x >>> 15
  x = (x * 2246822519) >>> 0
  x ^= x >>> 13
  return (x % 10000) / 10000
}

function hexA(hex: string, a: number) {
  let h = hex.replace('#', '')
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${Math.max(0, Math.min(1, a)).toFixed(3)})`
}

function useLottieJson(url: string | null) {
  const [loaded, setLoaded] = useState<{ url: string; json: object } | null>(
    null,
  )
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!url) return
    let alive = true
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error('http ' + r.status)
        return r.json()
      })
      .then((j) => {
        if (alive) setLoaded({ url, json: j })
      })
      .catch(() => {
        if (alive) setFailedUrl(url)
      })
    return () => {
      alive = false
    }
  }, [url])
  const data = loaded && loaded.url === url ? loaded.json : null
  const failed = !url || failedUrl === url
  return { data, failed }
}

interface EffectPreviewProps {
  effectType?: string
  effectColor?: string
  effectLottieUrl?: string | null
  effectIntensity?: number
  size?: number
}

export function EffectPreview({
  effectType = 'slash',
  effectColor,
  effectLottieUrl,
  effectIntensity = 1,
  size = 120,
}: EffectPreviewProps) {
  const meta = EFFECT_TYPES[effectType] || EFFECT_TYPES.slash
  const color = effectColor || meta.color
  const url =
    effectLottieUrl && effectLottieUrl.trim()
      ? effectLottieUrl.trim()
      : null
  const { data, failed } = useLottieJson(url)
  const intensity = Math.max(1, Math.min(3, Number(effectIntensity) || 1))

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <div
        style={{
          width: size,
          height: size,
          borderRadius: 12,
          backgroundColor: '#0A0F18',
          border: `2px solid ${color}`,
          boxShadow: `0 0 ${8 * intensity}px ${hexA(color, 0.4)}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {url ? (
          data && !failed ? (
            <Lottie
              key={url}
              src={data}
              autoplay
              style={{ width: size, height: size }}
            />
          ) : (
            <span style={{ fontSize: 12, color: '#94A3B8' }}>
              {failed ? 'Lottie inválido' : 'carregando…'}
            </span>
          )
        ) : (
          <BurstCanvas
            type={effectType}
            color={color}
            intensity={intensity}
            size={size}
          />
        )}
      </div>
      <div style={{ fontSize: 11, color: '#94A3B8', textAlign: 'center' }}>
        {url ? (
          <>{meta.label} • nível {intensity} • Lottie próprio</>
        ) : (
          <>
            {meta.label} • nível {intensity} • efeito do jogo
          </>
        )}
      </div>
    </div>
  )
}

// Mesmo efeito do jogo, desenhado em Canvas (espelho simplificado do
// _EffectBurstPainter do app). Roda em loop para avaliação visual.
function BurstCanvas({
  type,
  color,
  intensity,
  size,
}: {
  type: string
  color: string
  intensity: number
  size: number
}) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    canvas.width = size * dpr
    canvas.height = size * dpr
    ctx.scale(dpr, dpr)
    const duration = intensity === 1 ? 700 : intensity === 2 ? 1000 : 1300
    let raf = 0
    const t0 = performance.now()
    const draw = (now: number) => {
      const p = ((now - t0) % (duration + 350)) / duration
      paintBurst(ctx, size, type, color, intensity, Math.min(1, p))
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [type, color, intensity, size])
  return <canvas ref={ref} style={{ width: size, height: size }} />
}

function paintBurst(
  ctx: CanvasRenderingContext2D,
  size: number,
  type: string,
  color: string,
  intensity: number,
  p: number,
) {
  const c = size / 2
  const maxR = size / 2 - 4
  const extra = intensity - 1
  ctx.clearRect(0, 0, size, size)

  const spark = (x: number, y: number, r: number, a: number, col: string) => {
    if (a <= 0.01 || r <= 0) return
    ctx.beginPath()
    ctx.arc(x, y, r * 2.2, 0, Math.PI * 2)
    ctx.fillStyle = hexA(col, a * 0.35)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(255,255,255,${Math.max(0, Math.min(1, a))})`
    ctx.fill()
  }
  const ring = (
    r: number,
    a: number,
    w: number,
    col: string = color,
    delay = 0,
  ) => {
    const lp = Math.max(0, Math.min(1, (p - delay) / (1 - delay)))
    if (lp <= 0 || lp >= 1) return
    ctx.beginPath()
    ctx.arc(c, c, maxR * (0.15 + lp * 0.85), 0, Math.PI * 2)
    ctx.strokeStyle = hexA(col, (1 - lp) * 0.9 * a)
    ctx.lineWidth = w * (1 - lp) + 1
    ctx.stroke()
  }

  // Clarão.
  const fa = Math.pow(1 - p, 3) * 0.85
  if (fa > 0.01) {
    ctx.beginPath()
    ctx.arc(c, c, maxR * (0.35 + p * 0.45), 0, Math.PI * 2)
    ctx.fillStyle = `rgba(255,255,255,${fa})`
    ctx.fill()
  }
  // Glow.
  ctx.beginPath()
  ctx.arc(c, c, maxR * 0.95, 0, Math.PI * 2)
  ctx.fillStyle = hexA(color, (1 - p) * 0.25)
  ctx.fill()

  if (type === 'slash') {
    const sweep = p * 4.2
    ctx.beginPath()
    ctx.arc(c, c, maxR * 0.72, -2.4, -2.4 + sweep)
    ctx.strokeStyle = `rgba(255,255,255,${1 - p})`
    ctx.lineWidth = 10 * (1 - p) + 3
    ctx.lineCap = 'round'
    ctx.stroke()
    const tipA = -2.4 + sweep
    const tx = c + Math.cos(tipA) * maxR * 0.72
    const ty = c + Math.sin(tipA) * maxR * 0.72
    for (let i = 0; i < 5 + extra * 3; i++) {
      const a = tipA + (prand(i * 7 + 1) - 0.5) * 1.6
      const d = p * maxR * (0.3 + prand(i * 13 + 2) * 0.7)
      spark(tx + Math.cos(a) * d, ty + Math.sin(a) * d, 3.5 - p * 2, (1 - p) * 0.9, color)
    }
  } else if (type === 'fire') {
    const n = 9 + extra * 4
    for (let i = 0; i < n; i++) {
      const fx = (prand(i * 3 + 5) - 0.5) * maxR * 1.1
      const rise = p * maxR * (0.9 + prand(i * 11 + 6) * 0.9)
      const flick = Math.sin(p * 20 + i * 2.4) * maxR * 0.06
      const t = Math.min(1, rise / (maxR * 1.6))
      const col = t < 0.35 ? '#FFE082' : t < 0.7 ? '#FF9E40' : '#E53935'
      ctx.beginPath()
      ctx.arc(c + fx + flick, c + maxR * 0.45 - rise, maxR * 0.16 * (1 - t * 0.7) + 2, 0, Math.PI * 2)
      ctx.fillStyle = hexA(col, (1 - p * 0.7) * 0.9)
      ctx.fill()
    }
    ring(maxR, 1, 6, '#FF6B35')
  } else if (type === 'ice') {
    const n = 6 + extra * 2
    for (let i = 0; i < n; i++) {
      const a = ((2 * Math.PI * i) / n + 0.4) + p * 1.5
      const d = maxR * (0.15 + p * 0.85)
      const x = c + Math.cos(a) * d
      const y = c + Math.sin(a) * d
      const s = maxR * 0.14 * (1 - p * 0.5)
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(a)
      ctx.beginPath()
      ctx.moveTo(0, -s)
      ctx.lineTo(s * 0.45, 0)
      ctx.lineTo(0, s)
      ctx.lineTo(-s * 0.45, 0)
      ctx.closePath()
      ctx.fillStyle = hexA('#B3E5FC', (1 - p) * 0.95)
      ctx.fill()
      ctx.restore()
    }
    ring(maxR, 1, 4, '#B3E5FC')
  } else if (type === 'heal') {
    ring(maxR, 1, 5, '#34D399')
    ring(maxR, 1, 3, '#34D399', 0.25)
    const n = 6 + extra * 3
    ctx.strokeStyle = `rgba(255,255,255,${1 - p})`
    ctx.lineWidth = 4
    ctx.lineCap = 'round'
    for (let i = 0; i < n; i++) {
      const fx = (prand(i * 29 + 2) - 0.5) * maxR * 1.2
      const y = c + maxR * 0.4 - p * maxR * (1.0 + prand(i * 13 + 7) * 0.6)
      const s = maxR * 0.09
      if (i % 2 === 0) {
        ctx.beginPath()
        ctx.moveTo(c + fx - s, y)
        ctx.lineTo(c + fx + s, y)
        ctx.moveTo(c + fx, y - s)
        ctx.lineTo(c + fx, y + s)
        ctx.stroke()
      } else {
        spark(c + fx, y, 3.5, 1 - p * 0.8, '#34D399')
      }
    }
  } else if (type === 'poison') {
    const n = 7 + extra * 3
    for (let i = 0; i < n; i++) {
      const fx = (prand(i * 31 + 1) - 0.5) * maxR
      const y = c + maxR * 0.5 - p * maxR * (1.1 + prand(i * 17 + 5) * 0.7)
      const x = c + fx + Math.sin(p * 8 + i * 1.7) * maxR * 0.1
      const r = maxR * (0.05 + prand(i * 7 + 11) * 0.08)
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.strokeStyle = hexA('#76FF03', (1 - p) * 0.85)
      ctx.lineWidth = 2.5
      ctx.stroke()
    }
  } else if (type === 'lightning') {
    const flicker = (Math.sin(p * 60) * 0.5 + 0.5) * 0.4 + 0.6
    const bolt = (x0: number, y0: number, x1: number, y1: number, w: number, col: string, a: number, seed: number) => {
      ctx.beginPath()
      ctx.moveTo(x0, y0)
      for (let i = 1; i <= 7; i++) {
        const t = i / 7
        const off = i === 7 ? 0 : (prand(seed + i * 37) - 0.5) * 2 * maxR * 0.16
        ctx.lineTo(x0 + (x1 - x0) * t + off, y0 + (y1 - y0) * t + off * 0.5)
      }
      ctx.strokeStyle = hexA(col, a)
      ctx.lineWidth = w
      ctx.lineCap = 'round'
      ctx.stroke()
    }
    bolt(c, c - maxR * 0.9, c, c + maxR * 0.9, 10, '#FBBF24', (1 - p) * flicker * 0.6, 50)
    bolt(c, c - maxR * 0.9, c, c + maxR * 0.9, 5, '#FFFFFF', (1 - p) * flicker, 100)
  } else if (type === 'buff') {
    ring(maxR, 1, 4, '#FFD54F')
    ctx.strokeStyle = hexA('#FFD54F', (1 - p) * 0.9)
    ctx.lineWidth = 4
    ctx.lineCap = 'round'
    const n = 2 + extra
    for (let i = 0; i < n; i++) {
      const fx = (i - (n - 1) / 2) * maxR * 0.4
      const y = c + maxR * 0.3 - p * maxR * 1.2
      const s = maxR * 0.14
      ctx.beginPath()
      ctx.moveTo(c + fx - s, y + s * 0.6)
      ctx.lineTo(c + fx, y - s * 0.6)
      ctx.lineTo(c + fx + s, y + s * 0.6)
      ctx.stroke()
    }
  } else if (type === 'debuff') {
    ctx.beginPath()
    ctx.arc(c, c, maxR * (1.0 - p * 0.55), 0, Math.PI * 2)
    ctx.strokeStyle = hexA('#EF5350', (1 - p * 0.5) * 0.9)
    ctx.lineWidth = 5
    ctx.stroke()
    ctx.strokeStyle = hexA('#EF5350', (1 - p) * 0.9)
    ctx.lineWidth = 4
    const n = 2 + extra
    for (let i = 0; i < n; i++) {
      const fx = (i - (n - 1) / 2) * maxR * 0.4
      const y = c - maxR * 0.5 + p * maxR * 1.2
      const s = maxR * 0.14
      ctx.beginPath()
      ctx.moveTo(c + fx - s, y - s * 0.6)
      ctx.lineTo(c + fx, y + s * 0.6)
      ctx.lineTo(c + fx + s, y - s * 0.6)
      ctx.stroke()
    }
  } else if (type === 'dark') {
    const n = 10 + extra * 5
    for (let i = 0; i < n; i++) {
      const a = ((2 * Math.PI * i) / n) + p * 1.2
      const r1 = maxR * (1.0 - p) * 0.9 + maxR * 0.1
      spark(c + Math.cos(a) * r1, c + Math.sin(a) * r1, 3, 1 - p, color)
    }
    ctx.beginPath()
    ctx.arc(c, c, maxR * (0.55 - p * 0.3), 0, Math.PI * 2)
    ctx.fillStyle = `rgba(0,0,0,${(1 - p) * 0.75})`
    ctx.fill()
  } else {
    // arcane
    ring(maxR, 1, 4, color, 0.15)
    ctx.strokeStyle = hexA('#FFFFFF', (1 - p) * 0.9)
    ctx.lineWidth = 2.5
    for (let k = 0; k < 2; k++) {
      const rot = p * (k === 0 ? 1.5 : -1.1) + k * 0.5
      const points = k === 0 ? 5 : 3
      ctx.beginPath()
      for (let i = 0; i <= points * 2; i++) {
        const a = rot + ((2 * Math.PI * i) / (points * 2))
        const r = (i % 2 === 0 ? maxR * 0.55 : maxR * 0.25) * (1 - p * 0.3)
        const x = c + Math.cos(a) * r
        const y = c + Math.sin(a) * r
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.closePath()
      ctx.stroke()
    }
    const n = 3 + extra * 2
    for (let i = 0; i < n; i++) {
      const a = ((2 * Math.PI * i) / n) - p * 3.5
      const r = maxR * (0.7 - p * 0.25)
      spark(c + Math.cos(a) * r, c + Math.sin(a) * r, 4, 1 - p * 0.6, color)
    }
  }
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  color: '#94A3B8',
  marginBottom: 6,
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  borderRadius: 8,
  border: '1px solid #334155',
  backgroundColor: '#0F172A',
  color: '#E2E8F0',
}

function toColorInput(hex: string) {
  if (!hex) return '#FF4444'
  const h = hex.trim()
  if (/^#[0-9a-fA-F]{6}$/.test(h)) return h
  return '#FF4444'
}

// Bloco pronto para o formulário da skill. Usa hidden inputs para
// funcionar com o fluxo FormData existente da página.
export function SkillEffectFields({
  value,
  onChange,
}: {
  value: SkillVisualEffect
  onChange: (v: SkillVisualEffect) => void
}) {
  const set = (patch: Partial<SkillVisualEffect>) =>
    onChange({ ...value, ...patch })
  const meta = EFFECT_TYPES[value.effect_type] || EFFECT_TYPES.slash
  return (
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
      <input type="hidden" name="effect_type" value={value.effect_type} />
      <input type="hidden" name="effect_color" value={value.effect_color} />
      <input
        type="hidden"
        name="effect_intensity"
        value={String(value.effect_intensity)}
      />
      <input
        type="hidden"
        name="effect_lottie_url"
        value={value.effect_lottie_url || ''}
      />
      <div style={{ flex: 1, minWidth: 240 }}>
        <label style={labelStyle}>Tipo de efeito visual</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {Object.entries(EFFECT_TYPES).map(([type, m]) => (
            <button
              key={type}
              type="button"
              onClick={() =>
                set({ effect_type: type, effect_color: m.color })
              }
              title={m.label}
              style={{
                padding: '6px 10px',
                borderRadius: 8,
                border:
                  value.effect_type === type
                    ? `2px solid ${m.color}`
                    : '1px solid #334155',
                backgroundColor:
                  value.effect_type === type ? m.color + '22' : 'transparent',
                color: '#E2E8F0',
                cursor: 'pointer',
                fontSize: 14,
              }}
            >
              {m.icon} {m.label}
            </button>
          ))}
        </div>

        <div
          style={{
            display: 'flex',
            gap: 12,
            marginTop: 12,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <label style={labelStyle}>Cor</label>
            <input
              type="color"
              value={toColorInput(value.effect_color || meta.color)}
              onChange={(e) => set({ effect_color: e.target.value })}
              style={{ width: 48, height: 32, cursor: 'pointer' }}
            />
          </div>
          <div>
            <label style={labelStyle}>Intensidade</label>
            <div style={{ display: 'flex', gap: 6 }}>
              {[1, 2, 3].map((lv) => (
                <button
                  key={lv}
                  type="button"
                  onClick={() => set({ effect_intensity: lv })}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 6,
                    border:
                      Number(value.effect_intensity || 1) === lv
                        ? `2px solid ${meta.color}`
                        : '1px solid #334155',
                    backgroundColor: 'transparent',
                    color: '#E2E8F0',
                    cursor: 'pointer',
                    fontSize: 12,
                  }}
                >
                  {lv === 1 ? 'Leve' : lv === 2 ? 'Médio' : 'Forte'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <label style={labelStyle}>
            URL Lottie (opcional — vazio usa o efeito do jogo)
          </label>
          <input
            type="url"
            placeholder="https://... .json (Supabase Storage)"
            value={value.effect_lottie_url || ''}
            onChange={(e) => set({ effect_lottie_url: e.target.value })}
            style={inputStyle}
          />
        </div>
      </div>

      <div>
        <label style={labelStyle}>Preview</label>
        <EffectPreview
          effectType={value.effect_type || 'slash'}
          effectColor={value.effect_color || meta.color}
          effectLottieUrl={value.effect_lottie_url}
          effectIntensity={Number(value.effect_intensity || 1)}
          size={140}
        />
      </div>
    </div>
  )
}

export default EffectPreview
