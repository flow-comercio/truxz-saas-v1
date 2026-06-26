'use client'
export function GlowBg() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
      <div
        className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full opacity-20"
        style={{ background: 'radial-gradient(circle, #9D4EDD, transparent 70%)' }}
      />
      <div
        className="absolute top-1/2 -right-40 w-[500px] h-[500px] rounded-full opacity-10"
        style={{ background: 'radial-gradient(circle, #7B2FBE, transparent 70%)' }}
      />
      <div
        className="absolute -bottom-40 left-1/3 w-[400px] h-[400px] rounded-full opacity-15"
        style={{ background: 'radial-gradient(circle, #5A189A, transparent 70%)' }}
      />
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(rgba(157,78,221,1) 1px, transparent 1px), linear-gradient(90deg, rgba(157,78,221,1) 1px, transparent 1px)',
          backgroundSize: '52px 52px',
        }}
      />
    </div>
  )
}
