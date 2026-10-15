'use client'

import { useEffect, useState } from 'react'
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

// Efeitos PRONTOS (LottieFiles, gratuitos). Funcionam sem upload.
// Se a skill tiver effect_lottie_url, ele tem prioridade sobre estes.
export const READY_MADE_LOTTIE: Record<string, string> = {
  slash: 'https://assets9.lottiefiles.com/packages/lf20_u4yrau.json',
  fire: 'https://assets9.lottiefiles.com/packages/lf20_bq33rmco.json',
  ice: 'https://assets9.lottiefiles.com/packages/lf20_tll0jwrk.json',
  heal: 'https://assets9.lottiefiles.com/packages/lf20_jgf0seun.json',
  poison: 'https://assets9.lottiefiles.com/packages/lf20_8phcqmgf.json',
  lightning: 'https://assets9.lottiefiles.com/packages/lf20_wdlrto6v.json',
  buff: 'https://assets9.lottiefiles.com/packages/lf20_ys68rd9v.json',
  debuff: 'https://assets9.lottiefiles.com/packages/lf20_8qsvylvq.json',
  arcane: 'https://assets9.lottiefiles.com/packages/lf20_u4yrau.json',
  dark: 'https://assets9.lottiefiles.com/packages/lf20_9bs4dz7x.json',
}

function useLottieJson(url: string | null) {
  const [data, setData] = useState<object | null>(null)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    if (!url) {
      setData(null)
      setFailed(true)
      return
    }
    let alive = true
    setData(null)
    setFailed(false)
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error('http ' + r.status)
        return r.json()
      })
      .then((j) => {
        if (alive) setData(j)
      })
      .catch(() => {
        if (alive) setFailed(true)
      })
    return () => {
      alive = false
    }
  }, [url])
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
  size = 96,
}: EffectPreviewProps) {
  const meta = EFFECT_TYPES[effectType] || EFFECT_TYPES.slash
  const color = effectColor || meta.color
  const url =
    effectLottieUrl && effectLottieUrl.trim()
      ? effectLottieUrl.trim()
      : READY_MADE_LOTTIE[effectType]
  const { data, failed } = useLottieJson(url || null)

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
          boxShadow: `0 0 ${8 * effectIntensity}px ${color}66`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {data && !failed ? (
          <Lottie
            key={url}
            src={data}
            autoplay
            style={{ width: size, height: size }}
          />
        ) : (
          <FallbackGlyph
            icon={meta.icon}
            color={color}
            intensity={effectIntensity}
            size={size}
            loading={!failed}
          />
        )}
      </div>
      <div
        style={{ fontSize: 11, color: '#94A3B8', textAlign: 'center' }}
      >
        {failed || !data ? (
          <>
            fallback nativo (sem Lottie) • {meta.label} • nível{' '}
            {effectIntensity}
          </>
        ) : (
          <>
            {meta.label} • nível {effectIntensity} • Lottie OK
          </>
        )}
      </div>
    </div>
  )
}

function FallbackGlyph({
  icon,
  color,
  intensity,
  size,
  loading,
}: {
  icon: string
  color: string
  intensity: number
  size: number
  loading: boolean
}) {
  const scale = 1 + (intensity - 1) * 0.25
  return (
    <div
      style={{
        width: size * 0.6,
        height: size * 0.6,
        borderRadius: '50%',
        border: `2px solid ${color}`,
        backgroundColor: color + '33',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.3 * scale,
        animation: loading
          ? 'effect-pulse 1s ease-in-out infinite'
          : 'effect-pop 0.6s ease-out',
      }}
    >
      {icon}
      <style>{`
        @keyframes effect-pulse { 0%,100% { transform: scale(1); opacity: .7; } 50% { transform: scale(1.15); opacity: 1; } }
        @keyframes effect-pop { 0% { transform: scale(.3); opacity: 0; } 60% { transform: scale(1.1); opacity: 1; } 100% { transform: scale(1); } }
      `}</style>
    </div>
  )
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
            URL Lottie (opcional — vazio usa o pronto)
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
          size={120}
        />
      </div>
    </div>
  )
}

export default EffectPreview
