export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] relative overflow-hidden">
      {/* Decorative background elements matching the red aesthetic */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-20 w-[600px] h-[600px] bg-red-600/20 rounded-full blur-[120px]" />
        <div className="absolute -bottom-40 -left-20 w-[600px] h-[600px] bg-rose-600/20 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border-[1px] border-red-500/10 rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] border-[1px] border-red-500/5 rounded-full" />
      </div>

      <div className="relative w-full max-w-[420px] mx-auto px-4 z-10">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-black tracking-tighter">
            <span className="text-white">three</span>
            <span className="text-red-500">red</span>
          </h1>
        </div>

        {/* Card */}
        <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] rounded-[24px] p-8 shadow-2xl">
          {children}
        </div>
      </div>
    </div>
  )
}
