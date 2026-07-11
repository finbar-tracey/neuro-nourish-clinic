/** Approved NeuroNourish brain health quiz — 18 questions from production Netlify assessment. */

export type QuizCategory =
  | "context"
  | "cognition"
  | "nutrition"
  | "sleep_stress"
  | "lifestyle"
  | "risk";

export type QuizQuestion = {
  id: string;
  section: string;
  category: QuizCategory;
  prompt: string;
  note?: string;
  options: { value: number; label: string; flag?: string }[];
};

export type QuizArchetypeKey =
  | "architect"
  | "forager"
  | "owl"
  | "engine"
  | "scholar"
  | "builder";

export type QuizArchetype = {
  key: QuizArchetypeKey;
  name: string;
  color: string;
  bg: string;
  eyebrow: string;
  tagline: string;
  strengths: string[];
  pattern: string;
  goodNews: string;
  sharedWith: string;
  masterclassPromise: string;
};

export type QuizSegment = {
  name: string;
  headline: string;
  body: string;
};

export type QuizCategoryPercents = Record<QuizCategory, number>;

export type QuizResult = {
  score: number;
  catPercents: QuizCategoryPercents;
  segment: QuizSegment;
  archetype: QuizArchetype;
  insight: { tag: string; text: string } | null;
};

export const NN_QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: "age",
    section: "Quick context",
    category: "context",
    prompt: "Which age band best describes you?",
    options: [
      { value: 0, label: "Under 35", flag: "under_target" },
      { value: 1, label: "35–44", flag: "edge_target" },
      { value: 2, label: "45–54" },
      { value: 2, label: "55–64" },
      { value: 2, label: "65 or older" },
    ],
  },
  {
    id: "general_health",
    section: "Quick context",
    category: "context",
    prompt: "How would you describe your general health right now?",
    options: [
      { value: 4, label: "Excellent — energetic, sharp, sleeping well" },
      { value: 3, label: "Good — a few niggles but mostly fine" },
      { value: 2, label: "Mixed — some good days, some foggy ones" },
      { value: 1, label: "Honestly, not great" },
    ],
  },
  {
    id: "room_forget",
    section: "How your brain is performing",
    category: "cognition",
    prompt: "How often do you walk into a room and forget why you went in?",
    options: [
      { value: 5, label: "Almost never" },
      { value: 4, label: "Once or twice a month" },
      { value: 2, label: "About once a week" },
      { value: 1, label: "Several times a week" },
      { value: 0, label: "Most days" },
    ],
  },
  {
    id: "tip_of_tongue",
    section: "How your brain is performing",
    category: "cognition",
    prompt: "How often does a word feel just out of reach — on the tip of your tongue?",
    options: [
      { value: 5, label: "Rarely" },
      { value: 4, label: "A few times a month" },
      { value: 2, label: "Weekly" },
      { value: 1, label: "Most days" },
      { value: 0, label: "Several times a day" },
    ],
  },
  {
    id: "new_info",
    section: "How your brain is performing",
    category: "cognition",
    prompt:
      "Compared with five years ago, how easily do you pick up new information (a new app, a new name, a new process)?",
    options: [
      { value: 5, label: "Just as easily, or better" },
      { value: 3, label: "Slightly slower but no real issue" },
      { value: 1, label: "Noticeably slower — I have to work at it" },
      { value: 0, label: "Much harder — I often give up" },
    ],
  },
  {
    id: "afternoon_fatigue",
    section: "How your brain is performing",
    category: "cognition",
    prompt: "By mid-afternoon, how mentally tired do you usually feel?",
    options: [
      { value: 5, label: "Still sharp — second wind kicks in" },
      { value: 3, label: "A bit flat but functional" },
      { value: 1, label: "Foggy — coffee or a sugar hit feels essential" },
      { value: 0, label: "Wiped out — concentration is a struggle" },
    ],
  },
  {
    id: "name_recall",
    section: "How your brain is performing",
    category: "cognition",
    prompt: "When you meet a new person, how well do you remember their name an hour later?",
    options: [
      { value: 5, label: "Almost always" },
      { value: 3, label: "Usually, with a little effort" },
      { value: 1, label: "Hit and miss" },
      { value: 0, label: "Rarely — names slip immediately" },
    ],
  },
  {
    id: "leafy_greens",
    section: "What you eat",
    category: "nutrition",
    prompt: "How often do you eat leafy green vegetables (spinach, kale, rocket, cabbage)?",
    options: [
      { value: 5, label: "Daily" },
      { value: 4, label: "4–6 days a week" },
      { value: 2, label: "2–3 days a week" },
      { value: 0, label: "Once a week or less" },
    ],
  },
  {
    id: "berries",
    section: "What you eat",
    category: "nutrition",
    prompt: "How often do you eat berries (blueberries, strawberries, raspberries, blackberries)?",
    options: [
      { value: 5, label: "Several times a week" },
      { value: 3, label: "About once a week" },
      { value: 1, label: "A few times a month" },
      { value: 0, label: "Rarely or never" },
    ],
  },
  {
    id: "oily_fish",
    section: "What you eat",
    category: "nutrition",
    prompt: "How often do you eat oily fish — salmon, mackerel, sardines, herring?",
    options: [
      { value: 5, label: "Twice a week or more" },
      { value: 3, label: "Once a week" },
      { value: 1, label: "A few times a month" },
      { value: 0, label: "Rarely or never" },
    ],
  },
  {
    id: "ultra_processed",
    section: "What you eat",
    category: "nutrition",
    prompt:
      "How often do ultra-processed foods (ready meals, crisps, biscuits, sugary cereals) feature in your day?",
    options: [
      { value: 5, label: "Rarely — I mostly cook from whole foods" },
      { value: 3, label: "Once or twice a week" },
      { value: 1, label: "Most days" },
      { value: 0, label: "Multiple times a day" },
    ],
  },
  {
    id: "alcohol",
    section: "What you eat",
    category: "nutrition",
    prompt:
      "How many standard drinks do you typically have in a week? (One standard drink = a half pint of beer, a small 100ml glass of wine, or a pub measure of spirits.)",
    note: "The HSE low-risk weekly threshold is 11 standard drinks for women and 17 for men. HIQA is currently reviewing these guidelines (2026).",
    options: [
      { value: 5, label: "None or under 5" },
      { value: 3, label: "5–10" },
      { value: 1, label: "11–16" },
      { value: 0, label: "17 or more" },
    ],
  },
  {
    id: "sleep_hours",
    section: "Rest and pressure",
    category: "sleep_stress",
    prompt: "How many hours of sleep do you average on a weeknight?",
    options: [
      { value: 5, label: "7–8 hours, fairly consistently" },
      { value: 3, label: "6–7 hours" },
      { value: 1, label: "Less than 6, or wildly variable" },
      { value: 1, label: "9+ hours but I still wake tired" },
    ],
  },
  {
    id: "sleep_quality",
    section: "Rest and pressure",
    category: "sleep_stress",
    prompt: "How would you describe the quality of your sleep?",
    options: [
      { value: 5, label: "Deep and restorative most nights" },
      { value: 3, label: "Decent — occasional broken nights" },
      { value: 1, label: "Often disturbed — I wake during the night" },
      { value: 0, label: "Poor — I rarely wake feeling rested" },
    ],
  },
  {
    id: "stress",
    section: "Rest and pressure",
    category: "sleep_stress",
    prompt: "On a typical week, how stressed do you feel?",
    options: [
      { value: 5, label: "Calm and balanced" },
      { value: 3, label: "Some pressure but manageable" },
      { value: 1, label: "Often overwhelmed" },
      { value: 0, label: "Chronically stretched and burned out" },
    ],
  },
  {
    id: "activity",
    section: "Body and connection",
    category: "lifestyle",
    prompt:
      "How often do you do moderate physical activity (brisk walking, swimming, gym, cycling)?",
    options: [
      { value: 5, label: "5+ times a week" },
      { value: 4, label: "3–4 times a week" },
      { value: 2, label: "1–2 times a week" },
      { value: 0, label: "Rarely or never" },
    ],
  },
  {
    id: "social",
    section: "Body and connection",
    category: "lifestyle",
    prompt:
      "How many people do you have a real conversation with in a typical week (not work calls or texts)?",
    options: [
      { value: 5, label: "Five or more" },
      { value: 3, label: "Three or four" },
      { value: 1, label: "One or two" },
      { value: 0, label: "Hardly anyone — I'm largely on my own" },
    ],
  },
  {
    id: "family_history",
    section: "Family picture",
    category: "risk",
    prompt:
      "Does anyone in your immediate family have, or has had, dementia, Alzheimer's, or significant cognitive decline?",
    options: [
      { value: 5, label: "No, not that I know of" },
      { value: 3, label: "A grandparent or aunt/uncle" },
      { value: 1, label: "A parent or sibling" },
      { value: 0, label: "Multiple close relatives" },
    ],
  },
];

/** Canonical question count — use everywhere (homepage preview, progress, copy). */
export const NN_QUIZ_QUESTION_COUNT = NN_QUIZ_QUESTIONS.length;

/** Homepage live preview: first N real questions so marketing never drifts from the quiz. */
export function getQuizPreviewSteps(count = 5) {
  return NN_QUIZ_QUESTIONS.slice(0, count).map((question, index) => {
    const questionNumber = index + 1;
    return {
      id: question.id,
      section: question.section,
      questionNumber,
      progress: Math.round((questionNumber / NN_QUIZ_QUESTION_COUNT) * 100),
      question: question.prompt,
      options: question.options.map((option) => option.label),
    };
  });
}

export const NN_QUIZ_CATEGORY_MAX: Record<QuizCategory, number> = {
  context: 6,
  cognition: 25,
  nutrition: 25,
  sleep_stress: 15,
  lifestyle: 10,
  risk: 5,
};

export const NN_QUIZ_CATEGORY_LABELS: Partial<Record<QuizCategory, string>> = {
  cognition: "Cognitive performance",
  nutrition: "Daily nutrition",
  sleep_stress: "Sleep & stress",
  lifestyle: "Movement & social",
};

/** Capture contact after all questions (end of quiz). Kept for any legacy references. */
export const NN_QUIZ_CAPTURE_AFTER = NN_QUIZ_QUESTIONS.length;

export const NN_QUIZ_RESULT_STORAGE_KEY = "nn-quiz-result";

export const NN_QUIZ_ARCHETYPES: Record<QuizArchetypeKey, QuizArchetype> = {
  architect: {
    key: "architect",
    name: "The Overdrawn Architect",
    color: "#0E4E80",
    bg: "#EAF2F8",
    eyebrow: "Stress-load pattern",
    tagline:
      "You're the one who holds the diary, replies to the email at 11pm, and remembers everyone's appointments. Your brain hasn't slowed down — it's been quietly running the tab for everyone else.",
    strengths: [
      "Pattern recognition under load",
      "Strong working memory across many open threads",
      "Decision stamina that holds when others fade",
    ],
    pattern:
      "Years of 'always-on' demand have kept your stress response elevated longer than it was built for. That shows up as tip-of-the-tongue moments, walking into rooms, and afternoon fog. This isn't decline. This is load.",
    goodNews:
      "When stress-load is the leading driver, nutritional and circadian rebalancing are typically the highest-yield first changes. The FINGER trial (Lancet, 2015) showed that combining diet, exercise, cognitive training and vascular-risk management slowed cognitive decline in at-risk adults over two years.",
    sharedWith:
      "GPs, solicitors, senior managers, primary carers, school principals, founders.",
    masterclassPromise: "the 4-week protocol for clearing cortisol fog and rebuilding focus",
  },
  forager: {
    key: "forager",
    name: "The Foggy Forager",
    color: "#C28A2C",
    bg: "#FAF6EB",
    eyebrow: "Nutrition-led pattern",
    tagline:
      "You eat when you can, fuel on what's convenient, and feel it by 3pm. Your brain isn't ageing — it's running on inputs that were never designed for the demands you put on it.",
    strengths: [
      "Adaptability under irregular routines",
      "High tolerance for long focus stretches",
      "Easy-going, low-fuss energy",
    ],
    pattern:
      "Skipped meals, sugar-led recoveries, and low intake of brain-essential nutrients keep your blood sugar swinging through the day. Each crash is a small drag on memory, mood and focus.",
    goodNews:
      "When nutrition is the leading driver, dietary change is the most direct lever. The MIND diet research at Rush University (Morris et al., 2015) found that even moderate adherence to a brain-supportive eating pattern was associated with cognitive ageing roughly 7.5 years slower than the lowest-adherence group.",
    sharedWith:
      "Shift workers, parents of young children, busy professionals, anyone who eats at their desk.",
    masterclassPromise:
      "the 4-week protocol for stabilising energy and clearing the afternoon fog",
  },
  owl: {
    key: "owl",
    name: "The Restless Owl",
    color: "#4B3B7A",
    bg: "#EFEBF5",
    eyebrow: "Sleep-recovery pattern",
    tagline:
      "You go to bed tired, find yourself awake at 3am, and wake before the alarm anyway. Your brain isn't declining — it's working with sleep architecture that's been quietly fragmented for years.",
    strengths: [
      "Quiet early-hour productivity",
      "Resilience on less-than-perfect sleep",
      "Comfort working alone, undistracted",
    ],
    pattern:
      "Broken or shallow sleep limits the deep stages where the brain clears waste, consolidates memory and rebuilds focus. That deficit accumulates invisibly — you feel it as foggy mornings and word-finding lapses.",
    goodNews:
      "When sleep is the leading driver, evening nutrition and circadian timing are typically the highest-yield first changes. Persistent sleep duration of 6 hours or less in midlife is associated with around 30% higher dementia risk versus 7 hours (Whitehall II, Nature Communications, 2021).",
    sharedWith:
      "Perimenopausal and post-menopausal women, light sleepers, evening thinkers, anyone whose sleep changed in their forties.",
    masterclassPromise: "the 4-week protocol for rebuilding deep sleep and morning clarity",
  },
  engine: {
    key: "engine",
    name: "The Stalled Engine",
    color: "#B0492E",
    bg: "#F5E1DA",
    eyebrow: "Circulation-led pattern",
    tagline:
      "You've spent more of the last few years sitting than moving, and your brain noticed before your body did. Your brain isn't ageing — it's under-circulated.",
    strengths: [
      "Strong mental endurance",
      "Comfort with sustained desk work",
      "Capacity for stillness and deep focus",
    ],
    pattern:
      "Long sedentary stretches reduce cerebral blood flow and lower the growth signals the brain needs to stay sharp. The result is slower processing, lower mood and that 'foggy from inside' feeling.",
    goodNews:
      "When movement is the leading driver, the change does not require a gym — it requires consistency. Ireland's Every Move Counts guidelines (HSE / Department of Health, 2024) recommend 2 hours 30 minutes to 5 hours of moderate-intensity activity weekly. Fewer than half of Irish adults currently meet this.",
    sharedWith:
      "Knowledge workers, remote workers, recent retirees, anyone whose job has become noticeably more sedentary.",
    masterclassPromise:
      "the 4-week protocol for restoring cognitive energy and processing speed",
  },
  scholar: {
    key: "scholar",
    name: "The Quiet Scholar",
    color: "#6E8E6A",
    bg: "#E5EFE3",
    eyebrow: "Stimulation-led pattern",
    tagline:
      "Your days have grown quieter than they used to be — fewer real conversations, more screens, less novelty. Your brain isn't ageing — it's under-stimulated.",
    strengths: [
      "Depth of thought",
      "High capacity for solitude and reflection",
      "Strong observational memory",
    ],
    pattern:
      "Without regular doses of novelty and social engagement, the brain narrows. Vocabulary, recall and processing speed soften in ways that feel like ageing but are actually deconditioning.",
    goodNews:
      "When social engagement is the leading driver, small, consistent doses of new input and human contact are the highest-yield first changes. Social isolation is one of 14 modifiable risk factors named in the 2024 Lancet Commission on dementia prevention.",
    sharedWith:
      "Recent retirees, work-from-home professionals, anyone who's quietly become more isolated in the last few years.",
    masterclassPromise:
      "the 4-week protocol for rebuilding cognitive engagement and vitality",
  },
  builder: {
    key: "builder",
    name: "The Steady Builder",
    color: "#3D5A3A",
    bg: "#E5EFE3",
    eyebrow: "Optimisation pattern",
    tagline:
      "You've been doing the work — eating well, moving, sleeping, staying engaged. Your brain isn't declining — it's ready for the next layer.",
    strengths: [
      "Consistent daily habits",
      "Strong self-awareness",
      "Long-term thinking about health",
    ],
    pattern:
      "Your foundation is solid. The opportunity isn't damage control — it's targeted optimisation in the one or two areas that quietly cap how much further your brain health can compound.",
    goodNews:
      "When the foundation is solid, the next 1% is where most of the long-term protection lives. The 2024 Lancet Commission estimates that addressing modifiable risk factors could prevent or delay around 45% of global dementia cases.",
    sharedWith:
      "Long-term healthy eaters, regular exercisers, people already invested in their cognitive longevity.",
    masterclassPromise:
      "the optimisation protocol for already-healthy brains compounding results for the next decade",
  },
};

/** Answers map question id → selected option index (0-based). */
function optionValue(questionId: string, optionIndex: number): number {
  const q = NN_QUIZ_QUESTIONS.find((item) => item.id === questionId);
  const opt = q?.options[optionIndex];
  return opt?.value ?? 0;
}

export function getQuizSegment(score: number): QuizSegment {
  if (score >= 80) {
    return {
      name: "Sharp & Steady",
      headline: "Your brain is in strong shape — now is the moment to lock that in.",
      body: "You're doing the heavy lifting already. The opportunity from here isn't damage control; it's compounding the protective factors so the next 10–20 years look like the last decade. Most people in this band still have one or two quiet leaks worth closing.",
    };
  }
  if (score >= 60) {
    return {
      name: "Steady but Strained",
      headline: "A solid foundation with a few clear weak points pulling you down.",
      body: "You have real strengths — but the score is being held back by specific, fixable gaps. The good news: the changes that would move this score 10 to 15 points are not dramatic. They are deliberate.",
    };
  }
  if (score >= 40) {
    return {
      name: "Quiet Cognitive Leak",
      headline: "Several early signals are stacking — and most of them are reversible.",
      body: "What you're feeling — the tip-of-the-tongue moments, the afternoon fog, the over-reliance on lists — is not 'just age'. It is the predictable result of three or four habits that have drifted. This is the band where targeted intervention shows the fastest visible change.",
    };
  }
  return {
    name: "Multiple Risk Factors",
    headline: "Your answers suggest several brain-health patterns are compounding.",
    body: "This is not a diagnosis — but it is a clear signal. The mix of cognitive symptoms, nutritional gaps, and lifestyle pressure you've described is exactly the pattern our clinical team works with most. The path forward is structured, evidence-based and personal.",
  };
}

function getCognitiveInsight(
  catPercents: QuizCategoryPercents,
): { tag: string; text: string } | null {
  const cog = catPercents.cognition;
  if (cog >= 80) return null;
  if (cog >= 60) {
    return {
      tag: "What we noticed",
      text: "Your cognitive performance answers showed a couple of subtle drops — likely in word recall or sustained attention. These are the first signs most people dismiss as 'just age'. They are also the ones most responsive to nutritional and lifestyle support.",
    };
  }
  if (cog >= 40) {
    return {
      tag: "Worth knowing",
      text: "Several of your answers point to what we call a 'quiet cognitive leak' — small drops in recall, attention or processing speed that you may not be consciously tracking. These signals show up 5–10 years before any clinical concern, which makes this the window where action matters most.",
    };
  }
  return {
    tag: "Worth knowing",
    text: "Your cognitive answers suggest your brain is working harder than it should to keep up with daily life. This is not normal ageing — it is your brain telling you it needs different inputs. The good news: this pattern is one of the most modifiable in the literature.",
  };
}

function determineArchetype(
  score: number,
  catPercents: QuizCategoryPercents,
  answers: Record<string, number>,
): QuizArchetypeKey {
  if (score >= 75) return "builder";

  const getVal = (questionId: string) => {
    const idx = answers[questionId];
    if (idx == null) return 5;
    return optionValue(questionId, idx);
  };

  const sleepValue = (getVal("sleep_hours") + getVal("sleep_quality")) / 2;
  const stressValue = getVal("stress");
  const movementValue = getVal("activity");
  const socialValue = getVal("social");

  const deficits: { key: QuizArchetypeKey; value: number }[] = [
    { key: "architect", value: ((5 - stressValue) / 5) * 100 },
    { key: "owl", value: ((5 - sleepValue) / 5) * 100 },
    { key: "forager", value: 100 - catPercents.nutrition },
    { key: "engine", value: ((5 - movementValue) / 5) * 100 },
    { key: "scholar", value: ((5 - socialValue) / 5) * 100 },
  ];

  deficits.sort((a, b) => b.value - a.value);
  return deficits[0]!.key;
}

/**
 * Compute full quiz result.
 * `answers` maps question id → selected option index (0-based).
 */
export function computeQuizResult(answers: Record<string, number>): QuizResult {
  const catRaw: Record<QuizCategory, number> = {
    context: 0,
    cognition: 0,
    nutrition: 0,
    sleep_stress: 0,
    lifestyle: 0,
    risk: 0,
  };

  for (const q of NN_QUIZ_QUESTIONS) {
    const optionIndex = answers[q.id];
    if (optionIndex == null) continue;
    const opt = q.options[optionIndex];
    if (!opt) continue;
    catRaw[q.category] += opt.value;
  }

  const catPercents = {} as QuizCategoryPercents;
  for (const category of Object.keys(NN_QUIZ_CATEGORY_MAX) as QuizCategory[]) {
    const max = NN_QUIZ_CATEGORY_MAX[category];
    catPercents[category] = Math.round((catRaw[category] / max) * 100);
  }

  const totalRaw = Object.values(catRaw).reduce((a, b) => a + b, 0);
  const totalMax = Object.values(NN_QUIZ_CATEGORY_MAX).reduce((a, b) => a + b, 0);
  const score = Math.round((totalRaw / totalMax) * 100);
  const archetypeKey = determineArchetype(score, catPercents, answers);

  return {
    score,
    catPercents,
    segment: getQuizSegment(score),
    archetype: NN_QUIZ_ARCHETYPES[archetypeKey],
    insight: getCognitiveInsight(catPercents),
  };
}

/** Score only — used by lead submit / CRM. */
export function computeQuizScore(answers: Record<string, number>): number {
  return computeQuizResult(answers).score;
}

export type StoredQuizResult = {
  score: number;
  catPercents: QuizCategoryPercents;
  segmentName: string;
  segmentHeadline: string;
  segmentBody: string;
  archetypeKey: QuizArchetypeKey;
  insight: { tag: string; text: string } | null;
};

export function toStoredQuizResult(result: QuizResult): StoredQuizResult {
  return {
    score: result.score,
    catPercents: result.catPercents,
    segmentName: result.segment.name,
    segmentHeadline: result.segment.headline,
    segmentBody: result.segment.body,
    archetypeKey: result.archetype.key,
    insight: result.insight,
  };
}

export function fromStoredQuizResult(stored: StoredQuizResult): QuizResult {
  return {
    score: stored.score,
    catPercents: stored.catPercents,
    segment: {
      name: stored.segmentName,
      headline: stored.segmentHeadline,
      body: stored.segmentBody,
    },
    archetype: NN_QUIZ_ARCHETYPES[stored.archetypeKey] ?? NN_QUIZ_ARCHETYPES.builder,
    insight: stored.insight,
  };
}
