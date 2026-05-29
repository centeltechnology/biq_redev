import React from "react";
import { Check, ArrowRight, CakeSlice, ShoppingBag, Sparkles, ChevronDown } from "lucide-react";

export function RichBerry() {
  const theme = {
    bgBase: "#1d0f1c", // Deep plum/burgundy base
    bgCard: "#2d1b2e", // Slightly lighter dark card
    bgCardLighter: "#3b243c", // Even lighter for subtle contrast
    textCream: "#F9F6F0",
    textMuted: "#d4c5d6",
    accentGold: "#D4AF37", // Amber/Gold accent
    btnCream: "#FDFBF7",
    btnCreamHover: "#F0EAE1",
    textDark: "#1a0d1c",
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center relative overflow-hidden font-sans"
      style={{ backgroundColor: theme.bgBase }}
    >
      {/* Background elegant accents */}
      <div 
        className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] opacity-20 pointer-events-none"
        style={{ backgroundColor: theme.accentGold }}
      />
      <div 
        className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] opacity-10 pointer-events-none"
        style={{ backgroundColor: theme.textCream }}
      />

      <div className="container mx-auto px-6 py-20 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          {/* Left Column: Copy */}
          <div className="max-w-xl">
            <div 
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium mb-6 border"
              style={{ backgroundColor: 'rgba(212, 175, 55, 0.1)', color: theme.accentGold, borderColor: 'rgba(212, 175, 55, 0.2)' }}
            >
              <Sparkles className="w-4 h-4" />
              <span>For Custom Cake Studios</span>
            </div>
            
            <h1 
              className="text-5xl lg:text-7xl font-light tracking-tight mb-6"
              style={{ color: theme.textCream, fontFamily: 'serif' }}
            >
              Stop pricing cakes in your DMs.
            </h1>
            
            <p 
              className="text-lg lg:text-xl mb-10 leading-relaxed font-light"
              style={{ color: theme.textMuted }}
            >
              Get a beautifully branded, professional order page that quotes every inquiry instantly. 
              Turn late-night haggling into paid deposits while you sleep.
            </p>
            
            <ul className="space-y-4 mb-10">
              {[
                "No more quoting back and forth in chat",
                "Every request comes in complete and clear",
                "Deposits collected automatically, upfront"
              ].map((bullet, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div 
                    className="mt-1 p-1 rounded-full"
                    style={{ backgroundColor: 'rgba(212, 175, 55, 0.15)', color: theme.accentGold }}
                  >
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span style={{ color: theme.textCream }} className="text-base">{bullet}</span>
                </li>
              ))}
            </ul>

            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                className="px-8 py-4 rounded-md font-medium text-base transition-all flex items-center justify-center gap-2"
                style={{ backgroundColor: theme.btnCream, color: theme.textDark }}
              >
                Start Free <ArrowRight className="w-4 h-4" />
              </button>
              <button 
                className="px-8 py-4 rounded-md font-medium text-base transition-all flex items-center justify-center gap-2 border"
                style={{ 
                  backgroundColor: 'transparent', 
                  color: theme.textCream,
                  borderColor: theme.bgCardLighter
                }}
              >
                See How It Works
              </button>
            </div>
          </div>

          {/* Right Column: Browser Mockup */}
          <div className="relative w-full max-w-[540px] mx-auto lg:ml-auto">
            {/* Outer premium card */}
            <div 
              className="p-4 sm:p-6 rounded-2xl shadow-2xl relative"
              style={{ 
                backgroundColor: theme.bgCard,
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
              }}
            >
              {/* Browser Frame */}
              <div 
                className="rounded-xl overflow-hidden shadow-inner border flex flex-col"
                style={{ backgroundColor: theme.btnCream, borderColor: theme.bgCardLighter }}
              >
                {/* Browser Header */}
                <div 
                  className="px-4 py-3 flex items-center gap-2 border-b"
                  style={{ backgroundColor: theme.bgCardLighter, borderColor: theme.bgCard }}
                >
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full opacity-50" style={{ backgroundColor: '#ff5f56' }} />
                    <div className="w-3 h-3 rounded-full opacity-50" style={{ backgroundColor: '#ffbd2e' }} />
                    <div className="w-3 h-3 rounded-full opacity-50" style={{ backgroundColor: '#27c93f' }} />
                  </div>
                  <div 
                    className="mx-auto px-4 py-1 rounded text-xs font-mono flex items-center gap-2"
                    style={{ backgroundColor: 'rgba(0,0,0,0.2)', color: theme.textMuted }}
                  >
                    <div className="w-2 h-2 rounded-full bg-green-400" />
                    yourbakery.bakeriq.com
                  </div>
                </div>

                {/* Mockup Content - The Form */}
                <div className="p-6 md:p-8 flex flex-col h-full bg-white relative">
                  {/* Decorative faint background element */}
                  <div className="absolute top-0 right-0 w-32 h-32 opacity-[0.03] pointer-events-none">
                     <CakeSlice className="w-full h-full" color={theme.textDark} />
                  </div>

                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-serif text-gray-900 mb-2">Custom Cake Quote</h3>
                    <p className="text-sm text-gray-500 font-sans">Design your dream cake and get an instant price estimate.</p>
                  </div>

                  <div className="space-y-6 flex-1 font-sans">
                    {/* Tiers */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Tiers</label>
                      <div className="grid grid-cols-3 gap-2">
                        {['Single', 'Two', 'Three'].map((tier, idx) => (
                          <div 
                            key={tier}
                            className={`py-2 px-3 text-sm text-center border rounded-md cursor-default transition-colors ${idx === 1 ? 'border-amber-600 bg-amber-50 text-amber-900 font-medium' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                          >
                            {tier}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Size */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Cake Size</label>
                      <div className="grid grid-cols-3 gap-2">
                        {['Small (6")', 'Med (8")', 'Large (10")'].map((size, idx) => (
                          <div 
                            key={size}
                            className={`py-2 px-3 text-sm text-center border rounded-md cursor-default transition-colors ${idx === 0 ? 'border-amber-600 bg-amber-50 text-amber-900 font-medium' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                          >
                            {size}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Flavor Selection */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Flavor Profile</label>
                      <div className="w-full border border-gray-200 rounded-md py-2.5 px-3 flex items-center justify-between text-sm text-gray-700">
                        <span>Madagascar Vanilla Bean</span>
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                  </div>

                  {/* Price & Submit */}
                  <div className="mt-8 pt-6 border-t border-gray-100 font-sans">
                    <div className="flex items-end justify-between mb-4">
                      <span className="text-gray-500 font-medium text-sm">Estimated Total</span>
                      <div className="text-right">
                        <span className="text-3xl font-serif text-gray-900 leading-none">$185.00</span>
                      </div>
                    </div>
                    <button 
                      className="w-full py-3.5 rounded-md font-medium text-white shadow-sm flex items-center justify-center gap-2"
                      style={{ backgroundColor: theme.bgBase }}
                    >
                      <ShoppingBag className="w-4 h-4" />
                      Request This Cake
                    </button>
                  </div>

                </div>
              </div>
            </div>
            
            {/* Floating element */}
            <div 
              className="absolute -bottom-6 -left-6 rounded-xl p-4 shadow-xl border flex items-center gap-4 animate-bounce"
              style={{ 
                backgroundColor: theme.bgCardLighter, 
                borderColor: theme.bgCard,
                animationDuration: '4s'
              }}
            >
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'rgba(212, 175, 55, 0.2)', color: theme.accentGold }}
              >
                <Check className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: theme.textCream }}>New Request Received!</p>
                <p className="text-xs" style={{ color: theme.textMuted }}>$185 quote sent instantly</p>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
