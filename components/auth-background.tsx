export function AuthBackground({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#FAFAFA]">
      <div
        className="absolute -top-32 -left-32 h-96 w-96 rounded-full opacity-40 blur-3xl animate-float-slow"
        style={{ background: 'radial-gradient(circle, #C7D2FE 0%, transparent 70%)' }}
      />
      <div
        className="absolute -bottom-40 -right-20 h-[28rem] w-[28rem] rounded-full opacity-30 blur-3xl animate-float-slower"
        style={{ background: 'radial-gradient(circle, #A5B4FC 0%, transparent 70%)' }}
      />
      <div
        className="absolute top-1/3 right-1/4 h-64 w-64 rounded-full opacity-20 blur-3xl animate-float-slow"
        style={{ background: 'radial-gradient(circle, #818CF8 0%, transparent 70%)', animationDelay: '2s' }}
      />
      <div className="relative z-10 w-full flex justify-center px-4">{children}</div>
    </div>
  )
}
