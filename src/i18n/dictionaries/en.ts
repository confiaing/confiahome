import type { Dictionary } from "./types.ts";

// English dictionary. Must match es.ts key for key: `typecheck` fails otherwise.
export const en: Dictionary = {
  meta: {
    homeTitle: "Confia.ing · AI transformation for small and mid-sized businesses",
  },
  skipLink: "Skip to content",
  nav: {
    label: "Main",
    home: "Confia.ing, home",
    whereWeStart: "Where we start",
    how: "How we make it real",
    menu: "Menu",
  },
  language: {
    label: "Language",
  },
  agenda: {
    cta: "Book 30 minutes",
    newTab: "opens in a new tab",
  },
  footer: {
    legalLabel: "Legal",
    privacy: "Privacy",
    terms: "Terms",
    emailLabel: "Email us",
  },
  legal: {
    privacyTitle: "Privacy policy",
    termsTitle: "Terms and conditions",
    draft: "This text is a draft pending legal review. It is not yet the final version.",
    contact: "If you have questions, write to us at",
  },
  notFound: {
    title: "We couldn't find this page",
    body: "The link may be broken, or the page may no longer exist.",
    cta: "Back to home",
  },
  home: {
    actions: {
      schedule: "Book a 30-minute conversation",
      inquire: "Tell us where you want to apply AI",
      note: "An exploratory conversation, at no cost and with no commitment.",
    },
    hero: {
      eyebrow: "AI transformation for companies that already rely on technology",
      title: "Find where AI can deliver *results* in your company.",
      lede: "We identify real opportunities, define how to measure their impact, and work alongside your team from the assessment through to solutions they can run and scale.",
      pillarsLabel: "Pillars",
      pillars: ["Strategy", "Training", "Automation"],
    },
    start: {
      eyebrow: "Where we start",
      title: "We start with the work, not the technology.",
      lede: "Before we talk about models or tools, we learn how your company works: which tasks repeat, where time is lost, and what you want to achieve.",
      frictions: [
        {
          title: "Repetitive tasks that cost hours.",
          text: "Operational, verifiable work your team does by hand every week: reviewing, copying, sorting, replying.",
        },
        {
          title: "Systems and data that don't talk to each other.",
          text: "Information scattered across tools, with people acting as the bridge.",
        },
        {
          title: "AI without a strategy.",
          text: "Licenses bought and teams improvising, without knowing whether any of it improves productivity.",
        },
        {
          title: "Software teams that don't know where to begin.",
          text: "They want to bring AI into their development lifecycle, but lack a method for doing it at each phase.",
        },
      ],
      questionsTitle: "Questions we answer with you",
      questions: [
        "Which process is AI actually right for?",
        "What data, tools, and people do I need?",
        "How do I justify the cost and measure the impact?",
        "How do I avoid data leaks and solutions that are hard to maintain?",
      ],
    },
    journey: {
      eyebrow: "How we make it real",
      title: "A journey we take *together*.",
      lede: "Five stages. At each one you know what we do, what you get, and what you decide before moving on.",
      labels: { does: "What we do", gets: "What you get", next: "Next step" },
      stages: [
        {
          name: "Initial conversation",
          tag: "Stage 1 · 30 minutes",
          does: "We explore your processes and where AI could apply. It's a conversation, not an assessment or a commitment.",
          gets: "A first read on the opportunities and a clear sense of whether we can help.",
          next: "You decide whether we move on to an assessment.",
        },
        {
          name: "Assessment",
          tag: "Stage 2",
          does: "We evaluate opportunities, friction points, and how ready your company is: data, tools, and people.",
          gets: "Prioritized opportunities and what needs to be prepared. We agree the scope with you.",
          next: "Together we choose where to start.",
        },
        {
          name: "Roadmap",
          tag: "Stage 3",
          does: "We draw up a high-level plan: stages, people involved, costs, and expected results.",
          gets: "Where you are today versus where you want to be over the coming months.",
          next: "We agree on the first pilot.",
        },
        {
          name: "Pilot",
          tag: "Stage 4",
          does: "We implement with demos, reviews, and feedback cycles.",
          gets: "A working solution, with metrics and OKRs for the project and for its impact on the business.",
          next: "If it proves its value, we scale it.",
        },
        {
          name: "Scale and handover",
          tag: "Stage 5",
          does: "We design the solution to grow, with continuous monitoring.",
          gets: "Training and documentation so your team can run it. Ongoing support is optional.",
          next: "Your team takes over.",
        },
      ],
    },
    offer: {
      title: "What we offer",
      main: {
        title: "AI *transformation*",
        text: "Strategy, training, and automation, integrated to take AI from idea to result.",
      },
      rest: [
        {
          title: "AI training.",
          text: "For leaders and non-technical roles: using AI with good judgment in real workflows.",
        },
        {
          title: "AI-SDLC.",
          text: "We help software teams bring AI into every phase of the development lifecycle.",
        },
        { title: "Custom software.", text: "For when the solution needs to be built." },
        {
          title: "Generative and agentic solutions.",
          text: "Consulting on, and building, agents and systems based on generative AI.",
        },
      ],
    },
    trust: {
      eyebrow: "Why trust us",
      title: "Our team's experience",
      items: [
        "More than five years at US SaaS companies with customers around the world.",
        "Healthcare: an agentic RAG system for managing medical treatment documents, using local and cloud models.",
        "Efficient use of LLMs: costs, local models, and model routing.",
        "AI-SDLC: advising teams across every phase of the software development lifecycle.",
      ],
      note: "Experience our team members gained in previous roles.",
      principlesTitle: "Three principles",
      principles: ["Maintainable", "Secure", "Measurable"],
      securityLabel: "Security:",
      security:
        "we consider risks such as data leaks and prompt injection, and the personal-data and regulatory requirements that apply to your context.",
    },
    closing: {
      title: "Your team already works hard. Let's make AI work *with them*.",
      inquiryText: "Email us and tell us which process you have in mind:",
    },
  },
};
