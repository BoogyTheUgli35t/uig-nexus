/**
 * Editorial content for News & Insights.
 *
 * This lived inside the route files: the post list was exported from
 * `routes/insights.tsx` and the article bodies from `routes/insights.$slug.tsx`,
 * so the detail route imported from a sibling route. That coupling is what
 * blocked the routing fix — `insights.tsx` had to become `insights.index.tsx`
 * so it would stop swallowing `/insights/$slug`, which would have broken the
 * import. Content belongs in lib either way; route files should export routes.
 */

export const insights = [
  {
    slug: "nigeria-agriculture-tech-opportunity",
    category: "AgriTech",
    title: "Why Nigeria's Agricultural Crisis Is Africa's Biggest Tech Opportunity",
    excerpt:
      "Nigeria has 84 million hectares of arable land, 70 million people working agriculture, and 40% post-harvest loss. The math is brutal — and that's exactly why this is the most under-built tech market on the continent.",
    date: "May 12, 2026",
  },
  {
    slug: "case-for-native-african-ai",
    category: "Intelligence",
    title:
      "The Case for Native African AI: Why Training Models on Local Languages Changes Everything",
    excerpt:
      "Mainstream LLMs treat Yoruba, Igbo and Hausa as afterthoughts. We're building from the ground up — and the early results in customer support, healthcare triage and education are remarkable.",
    date: "May 5, 2026",
  },
  {
    slug: "lagos-real-estate-2025",
    category: "Real Estate",
    title: "Lagos Real Estate in 2025: Where the Smart Money Is Moving",
    excerpt:
      "Yields are compressing in Ikoyi and Victoria Island. The smart money has already moved to Lekki Phase 2, Sangotedo and the emerging Epe corridor. Here's the data behind the shift.",
    date: "April 28, 2026",
  },
];

export const insightBodies: Record<string, string[]> = {
  "nigeria-agriculture-tech-opportunity": [
    "Nigeria has 84 million hectares of arable land. We farm only a fraction of it productively. We import billions of dollars of food we could grow at home. Smallholders — over 70% of our agricultural producers — operate without weather data, without market price visibility, and without access to the buyers who actually pay fair prices.",
    "Every one of those problems is a software problem wearing an agricultural costume. UIG AgriTech is built on that thesis. Crop monitoring is a computer vision problem. Yield prediction is a time-series problem. Weather guidance for a Yoruba-speaking farmer in Oyo is a localisation problem. Farm-to-market is a marketplace problem.",
    "What's missing isn't insight. It's execution: drones that fly Nigerian skies, sensors that survive Nigerian humidity, SMS alerts that work on Nigerian feature phones, and a marketplace that pays Nigerian farmers in Naira within 24 hours. That's what we're building.",
    "The opportunity is generational. Whoever solves this for Nigeria solves it for West Africa. Whoever solves it for West Africa solves it for the continent. We intend to be that team.",
  ],
  "case-for-native-african-ai": [
    "When a Yoruba-speaking trader asks GPT-4 a question in her language, the model often answers in English, in Pidgin, or in a stilted approximation of Yoruba that no actual speaker would write. That's not a bug — it's the math. Models are trained on the data they can find, and the open web is overwhelmingly Western, English, and contextually foreign to most of Africa.",
    "UIG Intelligence is building from the other direction. Native datasets, native idioms, native cultural context. Our Yoruba intent recognition rate has crossed 94% on the use cases that matter — customer support, banking enquiries, healthcare triage. Our Hausa corpus is past 500K training tokens and growing weekly.",
    "This isn't a research exercise. The applications are immediate and large. A Nigerian bank that can serve customers in Hausa via WhatsApp. A telco that can triage support in Igbo. A clinic that can assist patients in Yoruba. These are real businesses with real margins waiting on real models.",
    "The bigger point: AI built for Africa, by Africans, on African data is no longer optional. It's the only path to inclusion at the scale the next decade demands.",
  ],
  "lagos-real-estate-2025": [
    "The Ikoyi/VI compression is real. Yields that hit 8–10% in 2018 are now closer to 4–5%, and that's before you account for ground rent, service charges and the increasingly aggressive maintenance economics of luxury Lagos.",
    "The smart money has already moved. Lekki Phase 2, Sangotedo, the Epe corridor and parts of Ibeju are showing the kind of appreciation Lekki Phase 1 saw a decade ago — combined with a much better risk profile if your title work is clean.",
    "UIG Real Estate's quarterly index tracks 12 sub-markets across Lagos, Abuja and Port Harcourt. The two-year story is consistent: secondary corridors with infrastructure trajectories beat prime markets on total return, even after factoring in liquidity discounts.",
    "If you're a diaspora investor or a local HNI building a portfolio for the next ten years, the question isn't whether to enter Lagos real estate. It's where, with what title verification, and through what structure. We can help with all three.",
  ],
};
