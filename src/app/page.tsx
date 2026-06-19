import Link from "next/link";
import { auth } from "@/auth";

export default async function Home() {
  const session = await auth();
  const isLoggedIn = !!session?.user;
  const logoHref = isLoggedIn ? "/dashboard" : "/";
  const actionText = isLoggedIn ? "Dashboard" : "Log In";
  const actionHref = isLoggedIn ? "/dashboard" : "/login";

  return (
    <div className="antialiased min-h-screen flex flex-col font-body-md text-body-md text-on-surface">
      {/* Improvised Simple Header */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-margin-mobile md:px-margin-desktop py-4 bg-surface-cream/70 backdrop-blur-xl border-b border-glass-border shadow-sm">
        <Link className="font-headline-sm text-headline-sm font-bold text-primary" href={logoHref}>
          ApexOA
        </Link>
        <Link 
          href={actionHref} 
          className="font-label-md text-label-md bg-primary-container text-on-primary rounded-full px-6 py-2 btn-primary-glow transition-all duration-300 flex items-center justify-center font-semibold"
        >
          {actionText}
        </Link>
      </header>
      <main className="flex-grow pt-24 md:pt-32">
        {/* Hero Section */}
        <section className="relative px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto flex flex-col items-center text-center py-section-gap hero-pattern">
          <div className="inline-flex items-center gap-2 bg-surface-white px-4 py-2 rounded-full mb-8 shadow-sm border border-outline-variant/30">
            <span className="w-2 h-2 rounded-full bg-primary-container animate-pulse"></span>
            <span className="font-label-md text-label-md text-on-surface-variant">New: Behavioral Interview Mode</span>
          </div>
          <h1 className="font-headline-lg-mobile md:font-display-lg text-headline-lg-mobile md:text-display-lg text-on-surface max-w-4xl mb-6">
            Master Your Technical Interviews
          </h1>
          <p className="font-body-lg text-body-lg text-secondary max-w-2xl mb-10">
            Simulate real-world coding interviews with an interactive assessment engine. Get deep, actionable feedback on your algorithmic thinking, system design, and communication skills before the real thing.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mb-16 w-full sm:w-auto">
            <Link href="/login" className="font-label-md text-label-md bg-primary-container text-on-primary rounded-full px-8 py-4 btn-primary-glow transition-all duration-300 w-full sm:w-auto flex items-center justify-center gap-2 text-lg">
              Start Practicing <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
            </Link>
            <Link href="#feedback" className="font-label-md text-label-md border border-tertiary text-tertiary bg-transparent rounded-full px-8 py-4 hover:bg-surface-variant transition-colors w-full sm:w-auto flex items-center justify-center">
              View Sample Feedback
            </Link>
          </div>
          {/* Social Proof */}
          <div className="flex flex-col items-center gap-6 opacity-80 mt-12">
            <p className="font-label-md text-label-md text-secondary uppercase tracking-widest">Trusted by candidates who landed offers at</p>
            <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
              {/* Faux Logos using typography for minimalism */}
              <span className="font-headline-sm text-headline-sm font-bold text-on-surface">Google</span>
              <span className="font-headline-sm text-headline-sm font-bold text-on-surface">Meta</span>
              <span className="font-headline-sm text-headline-sm font-bold text-on-surface">Amazon</span>
              <span className="font-headline-sm text-headline-sm font-bold text-on-surface">Netflix</span>
            </div>
          </div>
        </section>
        {/* Product Interface Mockup */}
        <section className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto -mt-16 md:-mt-24 mb-section-gap relative z-10">
          <div className="w-full bg-surface-white rounded-xl card-ambient-shadow border border-outline-variant/20 overflow-hidden flex flex-col md:flex-row min-h-[500px]">
            {/* Mockup Sidebar */}
            <div className="w-full md:w-64 bg-surface-cream border-r border-outline-variant/30 p-6 flex flex-col gap-6 hidden md:flex">
              <div className="flex items-center gap-3 bg-primary-container/10 text-primary-container rounded-lg px-4 py-3 font-bold font-label-md text-label-md">
                <span className="material-symbols-outlined">video_chat</span> Active Session
              </div>
              <div className="flex items-center gap-3 text-on-surface-variant px-4 py-3 font-label-md text-label-md">
                <span className="material-symbols-outlined">history</span> History
              </div>
            </div>
            {/* Mockup Main Area */}
            <div className="flex-1 p-6 flex flex-col bg-surface-container-lowest relative">
              {/* Header */}
              <div className="flex justify-between items-center mb-6 border-b border-outline-variant/20 pb-4">
                <div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface">System Design: URL Shortener</h3>
                  <p className="font-body-sm text-body-sm text-secondary">Interviewer: Senior Engineer Persona</p>
                </div>
                <span className="font-label-md text-label-md bg-error-container text-on-error-container px-3 py-1 rounded-full animate-pulse flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-error"></div> Recording
                </span>
              </div>
              {/* IDE/Chat Area Split */}
              <div className="flex flex-col md:flex-row gap-6 flex-1">
                {/* Chat/Transcript */}
                <div className="flex-1 flex flex-col gap-4">
                  <div className="bg-surface-container-low p-4 rounded-lg rounded-tl-none self-start max-w-[85%] border border-outline-variant/20">
                    <p className="font-body-sm text-body-sm text-on-surface">"Let's start by discussing the key requirements for our URL shortener. What do you think are the most critical functional requirements we need to handle?"</p>
                  </div>
                  <div className="bg-primary-container/10 p-4 rounded-lg rounded-tr-none self-end max-w-[85%]">
                    <p className="font-body-sm text-body-sm text-on-surface-variant">"Sure. Functionally, we need an endpoint to take a long URL and generate a short alias. We also need an endpoint that takes the short alias and redirects the user to the original long URL. We should probably also consider custom aliases."</p>
                  </div>
                </div>
                {/* Mini IDE Visual */}
                <div className="flex-1 bg-on-background rounded-lg p-4 font-mono text-sm text-surface-cream overflow-hidden shadow-inner hidden md:block text-left">
                  <div className="flex gap-2 mb-4 border-b border-tertiary pb-2">
                    <div className="w-3 h-3 rounded-full bg-error"></div>
                    <div className="w-3 h-3 rounded-full bg-tertiary-container"></div>
                    <div className="w-3 h-3 rounded-full bg-primary-container"></div>
                  </div>
                  <pre className="opacity-80 text-left font-mono text-sm leading-relaxed">
                    <code>
                      <div>
                        <span className="text-inverse-primary">class</span> <span className="text-primary-fixed-dim">URLShortener</span>:
                      </div>
                      <div>
                        &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-inverse-primary">def</span> <span className="text-surface-white">__init__</span>(<span className="text-surface-variant">self</span>):
                      </div>
                      <div>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-surface-variant">self</span>.url_map = {"{}"}
                      </div>
                      <div>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-surface-variant">self</span>.base_url = <span className="text-surface-tint">"http://tiny.url/"</span>
                      </div>
                      <div className="h-4"></div>
                      <div>
                        &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-inverse-primary">def</span> <span className="text-surface-white">shorten</span>(<span className="text-surface-variant">self</span>, long_url):
                      </div>
                      <div>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-tertiary-fixed-dim"># Generate hash here</span>
                      </div>
                      <div>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-inverse-primary">pass</span>
                      </div>
                    </code>
                  </pre>
                </div>
              </div>
              {/* Input Area */}
              <div className="mt-6 flex items-center gap-4 bg-surface-cream rounded-full p-2 border border-outline-variant/50">
                <input className="flex-1 bg-transparent border-none focus:ring-0 font-body-md text-body-md text-on-surface placeholder-secondary px-4" disabled placeholder="Type your response..." type="text"/>
                <button className="material-symbols-outlined text-primary-container bg-primary-fixed/30 p-2 rounded-full">send</button>
              </div>
            </div>
          </div>
        </section>
        {/* How It Works Section */}
        <section className="bg-surface-white py-section-gap border-t border-outline-variant/20">
          <div className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
            <div className="text-center mb-16">
              <h2 className="font-headline-md md:font-headline-lg text-headline-md md:text-headline-lg text-on-surface mb-4">How it works</h2>
              <p className="font-body-lg text-body-lg text-secondary max-w-2xl mx-auto">A seamless, focused workflow designed to identify your weak points and drill them until you're ready.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
              {/* Step 1 */}
              <div className="bg-surface-cream rounded-xl p-8 card-ambient-shadow transition-all duration-300 flex flex-col items-start group">
                <div className="w-12 h-12 rounded-full bg-primary-fixed text-primary-container flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined font-bold">settings_suggest</span>
                </div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface mb-3">1. Custom Setup</h3>
                <p className="font-body-md text-body-md text-secondary">
                  Select your target company, role level, and interview type (Algorithms, System Design, or Behavioral). The system tailors the difficulty and persona to match.
                </p>
              </div>
              {/* Step 2 */}
              <div className="bg-surface-cream rounded-xl p-8 card-ambient-shadow transition-all duration-300 flex flex-col items-start group">
                <div className="w-12 h-12 rounded-full bg-primary-fixed text-primary-container flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined font-bold">assignment</span>
                </div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface mb-3">2. Mock Assessment</h3>
                <p className="font-body-md text-body-md text-secondary">
                  Engage in a live interactive text or code session. The system evaluates your responses, prompts you with follow-ups, and tests your edge cases.
                </p>
              </div>
              {/* Step 3 */}
              <div className="bg-surface-cream rounded-xl p-8 card-ambient-shadow transition-all duration-300 flex flex-col items-start group">
                <div className="w-12 h-12 rounded-full bg-primary-fixed text-primary-container flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined font-bold">analytics</span>
                </div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface mb-3">3. Deep Feedback</h3>
                <p className="font-body-md text-body-md text-secondary">
                  Receive an instant, granular breakdown of your performance. Review communication clarity, code efficiency, and alternative solutions you missed.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      {/* Improvised Footer */}
      <footer className="w-full py-12 px-margin-mobile md:px-margin-desktop bg-surface-container-low border-t border-outline-variant flex flex-col items-center justify-center text-center gap-2 mt-auto">
        <span className="font-headline-sm text-headline-sm font-bold text-primary">ApexOA</span>
        <span className="font-body-sm text-body-sm text-secondary">© 2026 ApexOA. Made with love by Aryan Gautam 🖤</span>
      </footer>
    </div>
  );
}
