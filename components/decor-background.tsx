type DecorTone = 'light' | 'brand'

/**
 * Fundo decorativo em camadas — malha de gradientes, "orbs" que derivam,
 * aurora cónica, grelha e grão (SVG em /public/patterns). Puramente CSS,
 * só anima transform/opacity, e respeita `prefers-reduced-motion` via globals.css.
 *
 * O posicionamento é do chamador (passar `absolute inset-0`, `sticky ...`, etc.
 * em `className`).
 */
export function DecorBackground({
  tone = 'light',
  className = '',
  animated = true,
}: {
  tone?: DecorTone
  className?: string
  animated?: boolean
}) {
  const anim = (name: string) => (animated ? name : '')

  if (tone === 'brand') {
    return (
      <div aria-hidden className={`pointer-events-none overflow-hidden ${className}`}>
        <div className="absolute inset-0 bg-[#1E1B4B]" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#3730A3] via-[#1E1B4B] to-[#0B1020]" />

        <div
          className={`absolute left-1/2 top-1/2 h-[150%] w-[150%] -translate-x-1/2 -translate-y-1/2 opacity-40 blur-3xl ${anim('animate-aurora')}`}
          style={{
            background:
              'conic-gradient(from 0deg at 50% 50%, #6366F1, #8B5CF6, #22D3EE, #6366F1)',
          }}
        />
        <div
          className={`absolute -left-24 top-8 h-96 w-96 rounded-full bg-[#6366F1] opacity-45 blur-3xl ${anim('animate-drift-a')}`}
        />
        <div
          className={`absolute -right-16 bottom-0 h-[30rem] w-[30rem] rounded-full bg-[#8B5CF6] opacity-30 blur-3xl ${anim('animate-drift-b')}`}
        />

        <div
          className="absolute inset-0 opacity-[0.14]"
          style={{ backgroundImage: "url('/patterns/grid.svg')" }}
        />
        <div
          className="absolute inset-0 opacity-[0.12] mix-blend-overlay"
          style={{ backgroundImage: "url('/patterns/noise.svg')" }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(120% 120% at 50% 0%, transparent 45%, rgba(11,16,32,0.55) 100%)',
          }}
        />
      </div>
    )
  }

  return (
    <div aria-hidden className={`pointer-events-none overflow-hidden ${className}`}>
      <div className="absolute inset-0 bg-[#FAFAFA]" />
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(75% 55% at 12% 0%, #EEF2FF 0%, transparent 60%), radial-gradient(65% 55% at 100% 100%, #F5F3FF 0%, transparent 55%)',
        }}
      />
      <div
        className={`absolute -top-32 -left-32 h-96 w-96 rounded-full opacity-40 blur-3xl ${anim('animate-drift-a')}`}
        style={{ background: 'radial-gradient(circle, #C7D2FE 0%, transparent 70%)' }}
      />
      <div
        className={`absolute -bottom-40 -right-24 h-[30rem] w-[30rem] rounded-full opacity-30 blur-3xl ${anim('animate-drift-b')}`}
        style={{ background: 'radial-gradient(circle, #A5B4FC 0%, transparent 70%)' }}
      />
      <div
        className={`absolute right-1/4 top-1/3 h-72 w-72 rounded-full opacity-20 blur-3xl ${anim('animate-drift-c')}`}
        style={{ background: 'radial-gradient(circle, #818CF8 0%, transparent 70%)' }}
      />
      <div
        className="absolute inset-0 opacity-60"
        style={{ backgroundImage: "url('/patterns/grid.svg')" }}
      />
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{ backgroundImage: "url('/patterns/noise.svg')" }}
      />
    </div>
  )
}
