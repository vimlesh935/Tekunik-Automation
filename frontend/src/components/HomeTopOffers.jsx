import React from "react";

const topPromos = [
  // { text: "Daily Offers Available", icon: "🎉" },
  // { text: "50% OFF on Smart Devices", icon: "🔥" },
  // { text: "Free Installation on Selected Products", icon: "🔧" },
  // { text: "Buy 1 Get 1 Offer", icon: "🎁" },
  // { text: "Smart Home Deals Live Now", icon: "⚡" },
  // { text: "Premium Automation Products", icon: "⭐" },
  // { text: "Limited Time Discounts", icon: "⏳" },
  // { text: "Free Delivery Available", icon: "🚚" },
];

const premiumOffers = [
  // { text: "25% OFF", icon: "💥" },
  // { text: "50% OFF", icon: "⚡" },
  // { text: "Buy 1 Get 1 Free", icon: "🎁" },
  // { text: "Flash Sale", icon: "🔥" },
  // { text: "Smart Home Mega Deal", icon: "🏠" },
  // { text: "Limited Time Offer", icon: "⏳" },
  // { text: "Free Smart Installation", icon: "🛠️" },
  // { text: "Weekend Sale", icon: "🌙" },
  // { text: "Premium Automation Discounts", icon: "💎" },
  // { text: "Extra Cashback", icon: "💸" },
];

export default function HomeTopOffers() {
  return (
    <div className="">
      {/* <div className="relative overflow-hidden border-y border-cyan-500/10">
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
        <div className="absolute -top-6 left-1/4 w-3/4 h-12 bg-gradient-to-r from-transparent via-cyan-500/8 to-transparent blur-3xl rounded-full pointer-events-none" />
        <div className="absolute -bottom-6 left-1/4 w-3/4 h-12 bg-gradient-to-r from-transparent via-cyan-500/8 to-transparent blur-3xl rounded-full pointer-events-none" />

        <div className="relative mx-auto max-w-full py-4 sm:py-5 overflow-hidden">
          <div className="marquee-track flex items-center gap-0">
            {[...Array(2)].map((_, idx) => (
              <div key={idx} className="marquee-content flex items-center gap-0">
                {topPromos.map((offer, i) => (
                  <React.Fragment key={`${idx}-${i}`}>
                    <span className="inline-flex items-center gap-2.5 mx-8 sm:mx-10 text-sm sm:text-base font-medium text-gray-200 whitespace-nowrap transition-transform duration-300 hover:scale-[1.03]">
                      <span>{offer.icon}</span>
                      <span>{offer.text}</span>
                    </span>
                    <span className="inline-block w-1.5 h-1.5" />
                  </React.Fragment>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div> */}

      {/* <div className="relative overflow-hidden border-b border-cyan-500/15 bg-gradient-to-r from-slate-950 via-cyan-950 to-violet-950 shadow-[0_8px_40px_rgba(6,182,212,0.05)]">
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent" />
        <div className="absolute -top-6 left-1/3 w-1/2 h-12 bg-gradient-to-r from-transparent via-cyan-500/8 to-transparent blur-3xl rounded-full pointer-events-none" />
        <div className="absolute -bottom-6 left-1/3 w-1/2 h-12 bg-gradient-to-r from-transparent via-violet-500/8 to-transparent blur-3xl rounded-full pointer-events-none" />

      </div> */}
    </div>
  );
}

{/* <div className="relative mx-auto max-w-full py-5 sm:py-6 overflow-hidden">
  <div className="marquee-track-reverse flex items-center gap-10 sm:gap-14">
    {[...Array(2)].map((_, idx) => (
      <div key={idx} className="flex items-center gap-8 sm:gap-10 shrink-0">
        {premiumOffers.map((offer, i) => (
          <React.Fragment key={`${idx}-${i}`}>
            <span className="inline-flex items-center gap-3 rounded-full border border-white/[0.06] bg-white/5 px-4 sm:px-5 py-3 sm:py-3.5 text-sm sm:text-base font-semibold text-white shadow-[0_0_40px_rgba(56,189,248,0.12)] backdrop-blur-xl transition duration-300 hover:scale-[1.02] hover:border-cyan-400/30 hover:bg-cyan-500/10 whitespace-nowrap">
              <span className="text-lg sm:text-xl">{offer.icon}</span>
              {offer.text}
            </span>
          </React.Fragment>
        ))}
      </div>
    ))}
  </div>
</div> */}