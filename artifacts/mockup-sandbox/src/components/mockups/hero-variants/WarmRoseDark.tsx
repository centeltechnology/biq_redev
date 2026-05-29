import { ChevronRight, Calculator, CreditCard, CheckCircle2 } from "lucide-react";

export function WarmRoseDark() {
  const rose = "#d4606e";
  const roseGlow = "rgba(212, 96, 110, 0.18)";
  const bg = "#160d0e";
  const surface = "#1f1214";
  const surfaceCard = "#2a181a";
  const surfaceRaised = "#321e20";
  const textPrimary = "#f5ede8";
  const textMuted = "#a8968f";
  const textSubtle = "#6b504a";
  const border = "rgba(255,255,255,0.07)";
  const borderActive = rose;

  return (
    <div
      className="min-h-screen flex items-center justify-center font-sans overflow-hidden py-20 lg:py-0"
      style={{
        backgroundColor: bg,
        backgroundImage: `radial-gradient(ellipse 80% 60% at 60% 40%, rgba(212,96,110,0.08) 0%, transparent 70%), linear-gradient(to bottom right, ${bg}, #0e0809)`,
      }}
    >
      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* Left Column - Copy */}
          <div className="max-w-xl">
            <div
              className="inline-flex items-center gap-2 mb-6 px-3 py-1.5 rounded-full text-sm font-medium tracking-wide border"
              style={{ color: rose, backgroundColor: roseGlow, borderColor: "rgba(212,96,110,0.25)" }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: rose }}></span>
              Built for Custom Bakers
            </div>

            <h1
              className="text-5xl lg:text-6xl font-bold tracking-tight mb-6 leading-[1.1]"
              style={{ color: textPrimary }}
            >
              Stop pricing cakes{" "}
              <br className="hidden md:block" />
              <span className="italic font-serif" style={{ color: rose }}>
                in your DMs.
              </span>
            </h1>

            <p className="text-xl mb-8 leading-relaxed" style={{ color: textMuted }}>
              Get a professional order page that quotes every request instantly. Stop the back-and-forth and start booking orders while you sleep.
            </p>

            <div className="space-y-4 mb-10">
              {[
                "No more pricing in chat or text",
                "Every request comes in complete",
                "Deposits collected automatically",
              ].map((text) => (
                <div key={text} className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 shrink-0" style={{ color: rose }} />
                  <span className="font-medium" style={{ color: textPrimary }}>
                    {text}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                className="text-lg h-14 px-8 rounded-xl font-semibold shadow-lg transition-transform hover:-translate-y-1 flex items-center justify-center"
                style={{ backgroundColor: rose, color: "#fff", boxShadow: `0 4px 24px rgba(212,96,110,0.35)` }}
              >
                Start Free
              </button>
              <button
                className="text-lg h-14 px-8 rounded-xl font-medium flex items-center justify-center transition-colors"
                style={{ border: `1px solid ${border}`, color: textMuted, backgroundColor: "transparent" }}
              >
                See How It Works <ChevronRight className="ml-2 h-5 w-5" />
              </button>
            </div>

            <div className="mt-8 flex items-center gap-4 text-sm font-medium" style={{ color: textSubtle }}>
              <span>No credit card required</span>
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: textSubtle }}></span>
              <span>Cancel anytime</span>
            </div>
          </div>

          {/* Right Column - Mockup */}
          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            {/* Glow behind card */}
            <div
              className="absolute -inset-6 rounded-[48px] opacity-20 blur-3xl -z-10"
              style={{ background: `radial-gradient(ellipse, ${rose}, transparent 70%)` }}
            ></div>

            <div
              className="rounded-2xl overflow-hidden shadow-2xl"
              style={{ backgroundColor: surface, border: `1px solid ${border}` }}
            >
              {/* Browser bar */}
              <div
                className="flex items-center gap-3 px-4 py-3 border-b"
                style={{ backgroundColor: surfaceCard, borderColor: border }}
              >
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#4a2e30" }}></div>
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#3d3020" }}></div>
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#1f3020" }}></div>
                </div>
                <div
                  className="flex-1 text-center rounded-md px-4 py-1.5 text-xs font-mono truncate"
                  style={{ backgroundColor: surfaceRaised, color: textSubtle, border: `1px solid ${border}` }}
                >
                  orders.bakeriq.com/sarahs-sweets
                </div>
              </div>

              {/* Calculator Body */}
              <div className="p-8">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-serif mb-1" style={{ color: textPrimary }}>
                    Custom Cake Quote
                  </h3>
                  <p className="text-sm" style={{ color: textMuted }}>
                    Sarah's Sweets Bakery
                  </p>
                </div>

                <div className="space-y-6">
                  {/* Tiers */}
                  <div>
                    <label className="block text-sm font-semibold mb-3" style={{ color: textMuted }}>
                      How many tiers?
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {["Single", "Two", "Three"].map((tier) => (
                        <div
                          key={tier}
                          className="rounded-xl p-3 text-center border transition-colors"
                          style={
                            tier === "Two"
                              ? { borderColor: rose, backgroundColor: roseGlow, color: rose }
                              : { borderColor: border, color: textMuted }
                          }
                        >
                          <div className="text-sm font-medium">{tier}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Size */}
                  <div>
                    <label className="block text-sm font-semibold mb-3" style={{ color: textMuted }}>
                      Cake Size
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: "Small", sub: "Serves 10–15" },
                        { label: "Medium", sub: "Serves 20–30" },
                        { label: "Large", sub: "Serves 40–50" },
                      ].map((s) => (
                        <div
                          key={s.label}
                          className="rounded-xl p-3 text-center border"
                          style={
                            s.label === "Medium"
                              ? { borderColor: rose, backgroundColor: roseGlow }
                              : { borderColor: border }
                          }
                        >
                          <div
                            className="text-sm font-medium"
                            style={{ color: s.label === "Medium" ? rose : textPrimary }}
                          >
                            {s.label}
                          </div>
                          <div className="text-xs mt-1" style={{ color: s.label === "Medium" ? rose : textSubtle, opacity: s.label === "Medium" ? 0.8 : 1 }}>
                            {s.sub}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Flavor */}
                  <div>
                    <label className="block text-sm font-semibold mb-3" style={{ color: textMuted }}>
                      Flavor
                    </label>
                    <div className="relative">
                      <select
                        className="w-full rounded-xl p-3.5 appearance-none focus:outline-none text-sm"
                        style={{
                          backgroundColor: surfaceCard,
                          color: textPrimary,
                          border: `1px solid ${border}`,
                        }}
                      >
                        <option>Vanilla Bean with Raspberry Filling</option>
                        <option>Double Chocolate Fudge</option>
                        <option>Lemon Elderflower</option>
                        <option>Red Velvet</option>
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        <ChevronRight className="h-5 w-5 rotate-90" style={{ color: textSubtle }} />
                      </div>
                    </div>
                  </div>

                  <div className="h-px" style={{ backgroundColor: border }}></div>

                  {/* Price */}
                  <div
                    className="flex items-end justify-between p-4 rounded-xl"
                    style={{ backgroundColor: surfaceCard, border: `1px solid ${border}` }}
                  >
                    <div>
                      <div className="text-sm font-medium mb-1" style={{ color: textMuted }}>
                        Estimated Quote
                      </div>
                      <div className="text-xs" style={{ color: textSubtle }}>
                        Includes $50 base fee
                      </div>
                    </div>
                    <div className="text-3xl font-bold" style={{ color: textPrimary }}>
                      $185.00
                    </div>
                  </div>

                  {/* Submit */}
                  <button
                    className="w-full rounded-xl p-4 font-semibold text-lg flex items-center justify-center gap-2 transition-transform hover:-translate-y-0.5"
                    style={{
                      backgroundColor: rose,
                      color: "#fff",
                      boxShadow: `0 4px 20px rgba(212,96,110,0.3)`,
                    }}
                  >
                    Request to Book <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Floating badge — Instant Quote */}
            <div
              className="absolute -right-6 top-1/4 p-3 rounded-xl shadow-2xl"
              style={{ backgroundColor: surfaceRaised, border: `1px solid ${border}` }}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg" style={{ backgroundColor: "rgba(212,96,110,0.15)" }}>
                  <Calculator className="h-5 w-5" style={{ color: rose }} />
                </div>
                <div>
                  <div className="text-xs font-medium" style={{ color: textSubtle }}>
                    Instant Quote
                  </div>
                  <div className="text-sm font-bold" style={{ color: textPrimary }}>
                    Delivered
                  </div>
                </div>
              </div>
            </div>

            {/* Floating badge — Deposit */}
            <div
              className="absolute -left-8 bottom-1/4 p-3 rounded-xl shadow-2xl"
              style={{ backgroundColor: surfaceRaised, border: `1px solid ${border}` }}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg" style={{ backgroundColor: "rgba(96, 165, 250, 0.12)" }}>
                  <CreditCard className="h-5 w-5" style={{ color: "#60a5fa" }} />
                </div>
                <div>
                  <div className="text-xs font-medium" style={{ color: textSubtle }}>
                    Deposit Paid
                  </div>
                  <div className="text-sm font-bold" style={{ color: textPrimary }}>
                    +$92.50
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
