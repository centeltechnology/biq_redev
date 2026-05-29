import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ChevronRight, Calculator, Cake, CreditCard } from "lucide-react";

export function WarmRose() {
  const brandColor = "#b5404e";
  const bgIvory = "#fbf8f6";
  const bgSurface = "#fdfcfb";

  return (
    <div 
      className="min-h-screen flex items-center justify-center font-sans overflow-hidden py-20 lg:py-0"
      style={{ backgroundColor: bgIvory, backgroundImage: "linear-gradient(to bottom right, #fbf8f6, #f3ebe7)" }}
    >
      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          {/* Left Column - Copy */}
          <div className="max-w-xl">
            <Badge 
              variant="outline" 
              className="mb-6 px-3 py-1 text-sm font-medium tracking-wide border-[#b5404e]/20"
              style={{ color: brandColor, backgroundColor: "rgba(181, 64, 78, 0.05)" }}
            >
              Built for Custom Bakers
            </Badge>
            
            <h1 className="text-5xl lg:text-6xl font-bold tracking-tight mb-6 text-gray-900 leading-[1.1]">
              Stop pricing cakes <br className="hidden md:block" />
              <span className="italic font-serif" style={{ color: brandColor }}>in your DMs.</span>
            </h1>
            
            <p className="text-xl text-gray-700 mb-8 leading-relaxed">
              Get a professional order page that quotes every request instantly. Stop the back-and-forth and start booking orders while you sleep.
            </p>
            
            <div className="space-y-4 mb-10">
              <div className="flex items-center gap-3">
                <CheckCircle2 style={{ color: brandColor }} className="h-6 w-6 shrink-0" />
                <span className="text-gray-700 font-medium">No more pricing in chat or text</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 style={{ color: brandColor }} className="h-6 w-6 shrink-0" />
                <span className="text-gray-700 font-medium">Every request comes in complete</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 style={{ color: brandColor }} className="h-6 w-6 shrink-0" />
                <span className="text-gray-700 font-medium">Deposits collected automatically</span>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                className="text-lg h-14 px-8 shadow-lg transition-transform hover:-translate-y-1"
                style={{ backgroundColor: brandColor, color: "white" }}
              >
                Start Free
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="text-lg h-14 px-8 border-gray-300 hover:bg-gray-50 text-gray-800"
              >
                See How It Works <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
            
            <div className="mt-8 flex items-center gap-4 text-sm text-gray-500 font-medium">
              <span>No credit card required</span>
              <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
              <span>Cancel anytime</span>
            </div>
          </div>
          
          {/* Right Column - Mockup */}
          <div className="relative mx-auto w-full max-w-md lg:max-w-none perspective-1000">
            {/* Decorative background blob */}
            <div 
              className="absolute -inset-4 rounded-[40px] opacity-30 blur-2xl -z-10"
              style={{ background: `linear-gradient(135deg, ${brandColor}, #e8a2a8)` }}
            ></div>
            
            <div 
              className="rounded-2xl shadow-2xl border border-gray-200 overflow-hidden transform rotate-y-[-5deg] rotate-x-[2deg] hover:rotate-y-0 hover:rotate-x-0 transition-transform duration-700 ease-out"
              style={{ backgroundColor: bgSurface }}
            >
              {/* Browser Header */}
              <div className="bg-gray-50/80 backdrop-blur border-b border-gray-100 p-4 flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
                <div className="mx-auto bg-white rounded-md px-4 py-1.5 text-xs text-gray-400 font-mono shadow-sm border border-gray-100 flex-1 text-center truncate">
                  orders.bakeriq.com/sarahs-sweets
                </div>
              </div>
              
              {/* Browser Content - The Calculator */}
              <div className="p-8">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-serif text-gray-900 mb-2">Custom Cake Quote</h3>
                  <p className="text-sm text-gray-500">Sarah's Sweets Bakery</p>
                </div>
                
                <div className="space-y-6">
                  {/* Tiers */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">How many tiers?</label>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="border-2 rounded-xl p-3 text-center cursor-pointer transition-colors border-gray-100 hover:border-gray-200">
                        <div className="text-sm font-medium text-gray-700">Single</div>
                      </div>
                      <div className="border-2 rounded-xl p-3 text-center cursor-pointer transition-colors" style={{ borderColor: brandColor, backgroundColor: "rgba(181, 64, 78, 0.05)" }}>
                        <div className="text-sm font-medium" style={{ color: brandColor }}>Two</div>
                      </div>
                      <div className="border-2 rounded-xl p-3 text-center cursor-pointer transition-colors border-gray-100 hover:border-gray-200">
                        <div className="text-sm font-medium text-gray-700">Three</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Size */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Cake Size</label>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="border-2 rounded-xl p-3 text-center cursor-pointer transition-colors border-gray-100 hover:border-gray-200">
                        <div className="text-sm font-medium text-gray-700">Small</div>
                        <div className="text-xs text-gray-400 mt-1">Serves 10-15</div>
                      </div>
                      <div className="border-2 rounded-xl p-3 text-center cursor-pointer transition-colors" style={{ borderColor: brandColor, backgroundColor: "rgba(181, 64, 78, 0.05)" }}>
                        <div className="text-sm font-medium" style={{ color: brandColor }}>Medium</div>
                        <div className="text-xs mt-1" style={{ color: brandColor, opacity: 0.8 }}>Serves 20-30</div>
                      </div>
                      <div className="border-2 rounded-xl p-3 text-center cursor-pointer transition-colors border-gray-100 hover:border-gray-200">
                        <div className="text-sm font-medium text-gray-700">Large</div>
                        <div className="text-xs text-gray-400 mt-1">Serves 40-50</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Flavors */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Flavor</label>
                    <div className="relative">
                      <select className="w-full border-2 border-gray-200 rounded-xl p-3.5 text-gray-700 appearance-none bg-white focus:outline-none focus:border-[#b5404e] transition-colors">
                        <option>Vanilla Bean with Raspberry Filling</option>
                        <option>Double Chocolate Fudge</option>
                        <option>Lemon Elderflower</option>
                        <option>Red Velvet</option>
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        <ChevronRight className="h-5 w-5 text-gray-400 rotate-90" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="h-px bg-gray-100 my-6"></div>
                  
                  {/* Price Display */}
                  <div className="flex items-end justify-between mb-8 p-4 rounded-xl bg-gray-50 border border-gray-100">
                    <div>
                      <div className="text-sm font-medium text-gray-500 mb-1">Estimated Quote</div>
                      <div className="text-xs text-gray-400">Includes $50 base fee</div>
                    </div>
                    <div className="text-3xl font-bold text-gray-900">$185.00</div>
                  </div>
                  
                  {/* Submit Button */}
                  <button 
                    className="w-full rounded-xl p-4 text-white font-semibold text-lg shadow-md transition-transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                    style={{ backgroundColor: brandColor }}
                  >
                    Request to Book <ChevronRight className="h-5 w-5" />
                  </button>
                  
                </div>
              </div>
            </div>
            
            {/* Floating Badges */}
            <div className="absolute -right-6 top-1/4 bg-white p-3 rounded-xl shadow-xl border border-gray-100 animate-bounce" style={{ animationDuration: '3s' }}>
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-2 rounded-lg">
                  <Calculator className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <div className="text-xs text-gray-500 font-medium">Instant Quote</div>
                  <div className="text-sm font-bold text-gray-900">Delivered</div>
                </div>
              </div>
            </div>
            
            <div className="absolute -left-8 bottom-1/4 bg-white p-3 rounded-xl shadow-xl border border-gray-100 animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }}>
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-xs text-gray-500 font-medium">Deposit Paid</div>
                  <div className="text-sm font-bold text-gray-900">+$92.50</div>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}
