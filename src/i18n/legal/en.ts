import type { LegalDocument } from "./types.ts";

// English version of the drafts in es.ts. Same sections, paragraphs and lists.

export const privacy: LegalDocument = {
  title: "Privacy policy",
  version: "2026-11-borrador",
  updated: "Draft of November 2026",
  intro: ["This policy explains what data we process when you visit this site or write to us, what we use it for and what you can ask of us."],
  sections: [
    {
      id: "controller",
      heading: "Who processes your data",
      blocks: [
        { p: "The data controller is {entity:name}, identified as {entity:id} and domiciled at {entity:address}. On this site it operates under the Confia.ing brand." },
        { p: "For any matter related to your data, write to us at {email}." },
      ],
    },
    {
      id: "data",
      heading: "What data we process",
      blocks: [
        {
          list: [
            "What you write in the inquiry form: name, company, email address, phone number and message. Your name and one way to reach you are required; the rest is optional.",
            "The date you accepted this policy, the version you accepted and the language you wrote to us in.",
            "Where your visit came from: the referring site and the campaign tags in the link, if there were any. They are stored together with your inquiry.",
            "Anonymous records of how the page is used: which page was viewed, which button was pressed, in which language and on which type of device. They do not include your IP address or any identifier that could recognize you.",
            "Your IP address and browser type, which our providers use momentarily to serve the page and stop automated submissions. We do not store them in our databases.",
          ],
        },
        { p: "We do not ask for sensitive data or data about minors, and we ask you not to include them in your message." },
        { p: "If you book a conversation, the details you enter in the calendar are received by Calendly, which notifies us of the booking. This site does not store them." },
      ],
    },
    {
      id: "purposes",
      heading: "What we use it for",
      blocks: [
        {
          list: [
            "To answer your inquiry and contact you through the means you gave us.",
            "To coordinate the initial conversation, if you book it.",
            "To understand, in aggregate and anonymous form, how the page is used so we can improve it.",
            "To protect the form against automated submissions.",
          ],
        },
        { p: "We do not use your data to send you commercial communications, and we do not sell it or transfer it for that purpose." },
      ],
    },
    {
      id: "authorization",
      heading: "On what authorization",
      blocks: [
        { p: "We process the form data on the authorization you give by ticking the box before sending it, under Colombian Law 1581 of 2012 and its regulations. You can withdraw it at any time." },
        { p: "The anonymous usage records cannot identify you, so they do not depend on that authorization." },
      ],
    },
    {
      id: "retention",
      heading: "How long we keep it",
      blocks: [
        {
          list: [
            "Form inquiries, including the copy that reaches our mailbox: up to 24 months from the day we receive them, or until you ask us to delete them.",
            "Anonymous usage records: up to 13 months.",
          ],
        },
      ],
    },
    {
      id: "providers",
      heading: "Who helps us provide it",
      blocks: [
        {
          list: [
            "Cloudflare: hosts the site, protects it against automated submissions, delivers the notice of each inquiry to our mailbox and counts visits without cookies.",
            "Supabase: stores the form inquiries and the anonymous usage records.",
            "Google: hosts the mailbox where we receive the notice of each inquiry, with the details you wrote.",
            "Calendly: provides the booking calendar. It only loads when you ask to see the available slots.",
          ],
        },
        { p: "Cloudflare, Supabase and Google process the data on our behalf. Calendly does so under its own terms and its own privacy policy." },
      ],
    },
    {
      id: "transfers",
      heading: "International transfers",
      blocks: [
        { p: "These providers may store and process the data on servers located outside Colombia. By sending the form you authorize that transmission for the purposes described here." },
      ],
    },
    {
      id: "rights",
      heading: "Your rights",
      blocks: [
        {
          list: [
            "To know, update and correct your data.",
            "To request proof of the authorization you gave us.",
            "To be informed of the use we have made of your data.",
            "To withdraw the authorization and request the deletion of your data.",
            "To access, free of charge, the data we process about you.",
            "To file a complaint with the Colombian Superintendence of Industry and Commerce, once the procedure with us has been exhausted.",
          ],
        },
        { p: "To exercise them, write to us at {email} stating what you are requesting and a way to reply to you. We handle queries and claims within the time limits set by law." },
      ],
    },
    {
      id: "contact",
      heading: "Contact channel",
      blocks: [{ p: "The channel for queries, claims and requests about your data is {email}." }],
    },
    {
      id: "cookies",
      heading: "Cookies and similar technologies",
      blocks: [
        { p: "This site does not use advertising or tracking cookies. The only things it stores in your browser are two functional preferences:" },
        {
          list: [
            "The \"locale\" cookie, which remembers for one year the language you chose. It is only created if you switch language manually.",
            "Your choice between the full version and the light version of the page, in the browser's local storage. It stays until you change it or clear the site's data.",
          ],
        },
        { p: "Calendly and Cloudflare's anti-spam service may use their own cookies when they load." },
        { p: "If your browser sends the Global Privacy Control or Do Not Track signal, we do not record your use of the page nor load the visit counter." },
      ],
    },
    {
      id: "changes",
      heading: "Changes to this policy",
      blocks: [{ p: "If we change the way we process your data, we will update this text and its date. The version you accepted is recorded together with your inquiry." }],
    },
  ],
};

export const terms: LegalDocument = {
  title: "Terms and conditions",
  version: "2026-11-borrador",
  updated: "Draft of November 2026",
  intro: ["These terms govern the use of this site. By browsing it or writing to us from it, you accept them."],
  sections: [
    {
      id: "purpose",
      heading: "What this site is",
      blocks: [{ p: "This site presents the services of Confia.ing, an AI transformation consultancy, and offers two ways to get in touch: booking an initial conversation or sending an inquiry." }],
    },
    {
      id: "content",
      heading: "Informational content",
      blocks: [
        { p: "What you read here is general information. It is not a binding offer, nor legal, technical or financial advice for your case." },
        { p: "The scope, conditions and price of any service are agreed in writing with each client." },
      ],
    },
    {
      id: "conversation",
      heading: "The initial conversation",
      blocks: [{ p: "The 30-minute conversation is exploratory, at no cost and with no commitment for either party. It is not an assessment and includes no deliverables." }],
    },
    {
      id: "intellectual-property",
      heading: "Intellectual property",
      blocks: [
        { p: "The brand, the logo, the texts and the design of this site belong to Confia.ing or are used under license. The typefaces are distributed under open licenses." },
        { p: "You may quote the content as long as you state its source. Reproducing it for commercial purposes requires our prior authorization." },
      ],
    },
    {
      id: "third-parties",
      heading: "Third-party services",
      blocks: [{ p: "The booking calendar belongs to Calendly and the hosting to Cloudflare. Use of those services is governed by their own terms. We are not responsible for the content of the external sites we link to." }],
    },
    {
      id: "use",
      heading: "Use of the site",
      blocks: [{ p: "We ask you to use the site in good faith: do not send automated or misleading content through the form, and do not try to access systems or data that are not yours." }],
    },
    {
      id: "liability",
      heading: "Limitation of liability",
      blocks: [
        { p: "We strive to keep the information correct and the site available, but it may contain errors or be unavailable now and then. To the extent the law allows, we are not liable for damages arising from the use of the information published here." },
        { p: "Nothing above limits the rights the law grants you as a consumer." },
      ],
    },
    {
      id: "law",
      heading: "Governing law",
      blocks: [{ p: "These terms are governed by the laws of the Republic of Colombia." }],
    },
    {
      id: "contact",
      heading: "Contact",
      blocks: [{ p: "If you have questions about these terms, write to us at {email}." }],
    },
  ],
};
