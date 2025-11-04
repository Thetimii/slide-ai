import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Premium gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0B1220] via-[#0B0D0F] to-[#1C2028]">
        </div>
        
        {/* Animated gradient blobs */}
        <div className="absolute top-20 left-20 w-96 h-96 bg-primary/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent/20 rounded-full blur-[120px] animate-pulse delay-1000"></div>
        
        {/* Content */}
        <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
          <h1 className="font-heading text-6xl md:text-7xl lg:text-8xl font-bold mb-6 bg-gradient-to-br from-fg via-fg to-muted bg-clip-text text-transparent leading-tight">
            Beautiful Worship &<br />Teaching Slides — Instantly
          </h1>
          
          <p className="text-xl md:text-2xl text-muted mb-8 max-w-3xl mx-auto">
            Paste notes. Pick a style. Get a polished deck you can tweak and export.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Link href="/dashboard" className="btn-primary text-lg px-8 py-4">
              Start Free in the Editor
            </Link>
            <button className="btn-secondary text-lg px-8 py-4">
              See Live Demo
            </button>
          </div>
          
          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-16">
            <div className="glass rounded-2xl p-6">
              <div className="text-primary text-4xl mb-3">✨</div>
              <h3 className="font-heading font-semibold text-lg mb-2">Auto-layout from sermon notes</h3>
              <p className="text-muted text-sm">AI structures your content into beautiful slides</p>
            </div>
            
            <div className="glass rounded-2xl p-6">
              <div className="text-primary text-4xl mb-3">🎨</div>
              <h3 className="font-heading font-semibold text-lg mb-2">Editable fonts, colors, gradients</h3>
              <p className="text-muted text-sm">Full control over every design element</p>
            </div>
            
            <div className="glass rounded-2xl p-6">
              <div className="text-primary text-4xl mb-3">📤</div>
              <h3 className="font-heading font-semibold text-lg mb-2">Exports to PNG • PDF • PPTX</h3>
              <p className="text-muted text-sm">Use anywhere, from ProPresenter to PowerPoint</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Trust Section */}
      <section className="py-20 bg-surface-1">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-heading font-bold text-primary mb-2">⛪</div>
              <h3 className="font-heading font-semibold mb-2">Built for churches & ministries</h3>
              <p className="text-muted text-sm">Designed with worship leaders in mind</p>
            </div>
            
            <div>
              <div className="text-3xl font-heading font-bold text-primary mb-2">⚡</div>
              <h3 className="font-heading font-semibold mb-2">No learning curve</h3>
              <p className="text-muted text-sm">Start creating slides in seconds</p>
            </div>
            
            <div>
              <div className="text-3xl font-heading font-bold text-primary mb-2">💻</div>
              <h3 className="font-heading font-semibold mb-2">Works on any modern laptop</h3>
              <p className="text-muted text-sm">No installation required, just open and create</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-12 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-muted text-sm">
              © 2025 AI Church Slide Builder. Made with ❤️ for churches.
            </div>
            
            <div className="flex gap-6 text-sm">
              <a href="#" className="text-muted hover:text-fg transition-colors">Privacy</a>
              <a href="#" className="text-muted hover:text-fg transition-colors">Terms</a>
              <a href="#" className="text-muted hover:text-fg transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
