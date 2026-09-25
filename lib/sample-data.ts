import type { Channel } from "@prisma/client";

export type SampleFeedback = {
  content: string;
  channel: Channel;
  customerLabel?: string;
};

const COMPANIES = [
  "Northwind Retail", "Brightside Health", "Vantage Logistics", "Cobalt Studios",
  "Fenwick & Co", "Lumen Analytics", "Pinegate Realty", "Sable Robotics",
  "Harborview Media", "Meridian Foods", "Quickstep Travel", "Atlas Manufacturing",
  "Ridgeline Capital", "Willowbrook Schools", "Zenith Sports", "Orchid Cosmetics",
  "Ironclad Security", "Bluepeak Telecom", "Silverline Clinics", "Maple & Co",
];

function label(i: number) {
  return COMPANIES[i % COMPANIES.length];
}

export const SIMULATED_FEEDBACK: SampleFeedback[] = [
  // ---- SUPPORT_TICKET (mix of negative/neutral, onboarding, billing, bugs) ----
  { content: "Onboarding took forever — I couldn't figure out how to invite my team to the workspace.", channel: "SUPPORT_TICKET" },
  { content: "Billing page keeps timing out when I try to download an invoice. Happens every month.", channel: "SUPPORT_TICKET" },
  { content: "We can't figure out how to set up SSO. The docs reference a page that returns a 404.", channel: "SUPPORT_TICKET" },
  { content: "Export to CSV silently fails for any report over 10,000 rows. No error message shown.", channel: "SUPPORT_TICKET" },
  { content: "Our admin got logged out mid-session three times today and lost unsaved changes each time.", channel: "SUPPORT_TICKET" },
  { content: "The mobile app crashes immediately after opening on our test Android devices.", channel: "SUPPORT_TICKET" },
  { content: "Search results are missing items we know exist in the account. Index seems stale.", channel: "SUPPORT_TICKET" },
  { content: "Password reset emails take over an hour to arrive, sometimes they never come at all.", channel: "SUPPORT_TICKET" },
  { content: "Support replied after four days on a P1 ticket. That response time is not acceptable for our plan.", channel: "SUPPORT_TICKET" },
  { content: "API rate limits are hit constantly even at low volume — the limit seems misconfigured for our tier.", channel: "SUPPORT_TICKET" },
  { content: "The new permissions model locked out three of our editors after the last update.", channel: "SUPPORT_TICKET" },
  { content: "Webhook deliveries are duplicated, we're getting the same event fired two or three times.", channel: "SUPPORT_TICKET" },
  { content: "Dashboard takes 20+ seconds to load once we have more than a few thousand records.", channel: "SUPPORT_TICKET" },
  { content: "Bulk delete only removed half the selected rows and gave no error explaining why.", channel: "SUPPORT_TICKET" },
  { content: "We were double-billed this cycle. Please refund the duplicate charge.", channel: "SUPPORT_TICKET" },
  { content: "The onboarding checklist doesn't mark steps complete even after we finish them.", channel: "SUPPORT_TICKET" },
  { content: "Two-factor auth codes never arrive via SMS, we've had to disable 2FA entirely.", channel: "SUPPORT_TICKET" },
  { content: "Thanks for the quick fix on the sync issue yesterday — appreciate the fast turnaround.", channel: "SUPPORT_TICKET" },
  { content: "Our integration with Salesforce stopped syncing contacts after the weekend maintenance window.", channel: "SUPPORT_TICKET" },
  { content: "Uploading a file larger than 25MB just spins forever with no progress bar or error.", channel: "SUPPORT_TICKET" },
  { content: "Can you clarify how seat-based billing counts deactivated users? Our invoice looks wrong.", channel: "SUPPORT_TICKET" },
  { content: "The audit log doesn't capture role changes, which we need for our compliance review.", channel: "SUPPORT_TICKET" },
  { content: "Great experience overall, just wanted to flag a typo on the invite-teammate email template.", channel: "SUPPORT_TICKET" },
  { content: "Keyboard shortcuts stopped working after the latest browser extension update conflicts.", channel: "SUPPORT_TICKET" },
  { content: "We need a way to bulk-reassign tickets when someone leaves the team — currently it's one by one.", channel: "SUPPORT_TICKET" },

  // ---- APP_STORE_REVIEW (mostly positive/neutral, mobile experience) ----
  { content: "The new dashboard is gorgeous and finally fast. Huge improvement over the old version.", channel: "APP_STORE_REVIEW" },
  { content: "Solid app but the mobile experience needs work — half the buttons are too small to tap.", channel: "APP_STORE_REVIEW" },
  { content: "Crashes every time I try to attach a photo to a ticket. Please fix, otherwise great product.", channel: "APP_STORE_REVIEW" },
  { content: "Love how fast the search is now. Used to be painfully slow, this update nailed it.", channel: "APP_STORE_REVIEW" },
  { content: "Dark mode finally! Thank you, this was the number one thing I wanted.", channel: "APP_STORE_REVIEW" },
  { content: "Notifications are way too aggressive, I get pinged for things I don't care about.", channel: "APP_STORE_REVIEW" },
  { content: "Best feedback tool we've used at three different companies now. Onboarding was smooth this time.", channel: "APP_STORE_REVIEW" },
  { content: "App drains battery like crazy when left open in the background overnight.", channel: "APP_STORE_REVIEW" },
  { content: "Offline mode doesn't actually save my drafts, I lost an hour of notes on a flight.", channel: "APP_STORE_REVIEW" },
  { content: "Clean UI, intuitive navigation, my whole team picked it up in a day. Five stars.", channel: "APP_STORE_REVIEW" },
  { content: "Login with Face ID stopped working after the last update, have to type my password every time.", channel: "APP_STORE_REVIEW" },
  { content: "Wish there was a tablet-optimized layout, right now it just stretches the phone UI awkwardly.", channel: "APP_STORE_REVIEW" },
  { content: "Charts on mobile are unreadable, text is way too small and doesn't zoom.", channel: "APP_STORE_REVIEW" },
  { content: "Fantastic update, the new theme trends view is exactly what our PM team needed.", channel: "APP_STORE_REVIEW" },
  { content: "Good app, but sync between web and mobile lags by several minutes sometimes.", channel: "APP_STORE_REVIEW" },
  { content: "The onboarding tutorial is too long, I skipped it after the third screen.", channel: "APP_STORE_REVIEW" },
  { content: "Push notifications for new negative feedback are a great feature, catches things early.", channel: "APP_STORE_REVIEW" },
  { content: "App froze completely when I tried to export a report to PDF from my phone.", channel: "APP_STORE_REVIEW" },
  { content: "Really appreciate how quickly the team ships fixes. Reported a bug and it was gone in a week.", channel: "APP_STORE_REVIEW" },
  { content: "Search filters reset every time I navigate away, quite annoying during a long review session.", channel: "APP_STORE_REVIEW" },
  { content: "The interface feels sluggish on older phones, might need a lighter mobile build.", channel: "APP_STORE_REVIEW" },
  { content: "Excellent value for the price, does everything our old spreadsheet-based process couldn't.", channel: "APP_STORE_REVIEW" },
  { content: "Would love a widget for the home screen showing today's negative feedback count.", channel: "APP_STORE_REVIEW" },
  { content: "Onboarding for new team members is still confusing — took our new hire 30 minutes to find the invite button.", channel: "APP_STORE_REVIEW" },

  // ---- NPS_SURVEY (short, mixed sentiment) ----
  { content: "It does the job, but the mobile experience needs work.", channel: "NPS_SURVEY" },
  { content: "Would recommend, but pricing feels steep for teams under 10 people.", channel: "NPS_SURVEY" },
  { content: "Great tool, wish the reporting export supported PowerPoint directly.", channel: "NPS_SURVEY" },
  { content: "Onboarding was confusing at first but support helped us get set up quickly.", channel: "NPS_SURVEY" },
  { content: "Dashboard load times have gotten noticeably worse this quarter.", channel: "NPS_SURVEY" },
  { content: "Ask LOOP is genuinely useful, saves our PM team hours every week.", channel: "NPS_SURVEY" },
  { content: "Neutral overall — does what we need but nothing stands out as exceptional.", channel: "NPS_SURVEY" },
  { content: "Would be a 9 or 10 if SSO setup was easier, currently it's a blocker for our security team.", channel: "NPS_SURVEY" },
  { content: "The theme clustering sometimes groups unrelated feedback together, accuracy could improve.", channel: "NPS_SURVEY" },
  { content: "Very happy, this replaced three separate tools for us.", channel: "NPS_SURVEY" },
  { content: "Support is responsive but the product itself has too many rough edges still.", channel: "NPS_SURVEY" },
  { content: "Billing and invoicing UX is clunky compared to everything else in the product.", channel: "NPS_SURVEY" },
  { content: "The Voice-of-Customer report is a game changer for our leadership updates.", channel: "NPS_SURVEY" },
  { content: "Mobile app needs serious work before I'd recommend it for on-the-go use.", channel: "NPS_SURVEY" },
  { content: "Fast, reliable, and the AI classification is surprisingly accurate.", channel: "NPS_SURVEY" },
  { content: "Would like more granular role permissions between Analyst and Admin.", channel: "NPS_SURVEY" },
  { content: "Onboarding checklist should be shorter, felt like busywork before we could start using it.", channel: "NPS_SURVEY" },
  { content: "Data export options are limited, we need a scheduled export to our data warehouse.", channel: "NPS_SURVEY" },
  { content: "Really solid product, minor complaint is the search could be faster.", channel: "NPS_SURVEY" },
  { content: "The trends view spike detection has flagged a few false positives for us.", channel: "NPS_SURVEY" },

  // ---- SALES_CALL_NOTE (feature requests, deal blockers) ----
  { content: "Prospect wants SSO before they'll sign — third time this month.", channel: "SALES_CALL_NOTE" },
  { content: "Customer asked again about a dedicated Slack integration for new feedback alerts.", channel: "SALES_CALL_NOTE" },
  { content: "Enterprise prospect needs SOC 2 report before procurement will approve the contract.", channel: "SALES_CALL_NOTE" },
  { content: "Mid-market lead loves the product but pricing per seat is a blocker at their headcount.", channel: "SALES_CALL_NOTE" },
  { content: "Prospect specifically asked for scheduled PDF exports of the Voice-of-Customer report to email automatically.", channel: "SALES_CALL_NOTE" },
  { content: "Renewal call — customer flagged that dashboard performance degraded as their data grew.", channel: "SALES_CALL_NOTE" },
  { content: "Upsell opportunity: customer wants more granular roles beyond Admin/Analyst/Viewer for their support team.", channel: "SALES_CALL_NOTE" },
  { content: "Lost deal — competitor offered native Zendesk integration out of the box, we only have CSV import.", channel: "SALES_CALL_NOTE" },
  { content: "Customer requested a way to tag feedback with custom internal ticket IDs for cross-referencing.", channel: "SALES_CALL_NOTE" },
  { content: "Prospect asked whether Ask LOOP can be embedded into their internal Notion workspace.", channel: "SALES_CALL_NOTE" },
  { content: "Existing customer very happy, referenced the AI classification accuracy as the main reason they renewed early.", channel: "SALES_CALL_NOTE" },
  { content: "Security review flagged that audit logs don't currently capture failed login attempts.", channel: "SALES_CALL_NOTE" },
  { content: "Customer wants bulk role assignment when onboarding a new department, currently it's one user at a time.", channel: "SALES_CALL_NOTE" },
  { content: "Prospect asked about mobile offline support before committing to a field-team rollout.", channel: "SALES_CALL_NOTE" },
  { content: "Champion at the account said the trends dashboard directly influenced their last roadmap decision.", channel: "SALES_CALL_NOTE" },
  { content: "Deal stalled — legal wants a data processing agreement covering the AI classification pipeline.", channel: "SALES_CALL_NOTE" },
  { content: "Customer requested CSV import support for JSON files too, since their data export tool only outputs JSON.", channel: "SALES_CALL_NOTE" },
  { content: "Renewal at risk — customer cited slow support response times as their main frustration.", channel: "SALES_CALL_NOTE" },

  // ---- SOCIAL_MENTION (short, public-facing tone) ----
  { content: "Love the new export feature, saved me an hour today.", channel: "SOCIAL_MENTION" },
  { content: "Anyone else finding the mobile app really laggy this week?", channel: "SOCIAL_MENTION" },
  { content: "Just set up @LOOP for our support inbox, onboarding was smoother than expected.", channel: "SOCIAL_MENTION" },
  { content: "Ask LOOP just answered a question in ten seconds that used to take our PM half a day to research.", channel: "SOCIAL_MENTION" },
  { content: "Billing dashboard could use a refresh, feels dated compared to the rest of the product.", channel: "SOCIAL_MENTION" },
  { content: "Support team got back to me in minutes, way better than our last tool.", channel: "SOCIAL_MENTION" },
  { content: "Dark mode update looks great on the new dashboard.", channel: "SOCIAL_MENTION" },
  { content: "Wish SSO setup was self-serve instead of needing a support ticket.", channel: "SOCIAL_MENTION" },
  { content: "The theme trends chart caught a spike in complaints before our team even noticed manually.", channel: "SOCIAL_MENTION" },
  { content: "Mobile notifications are way too noisy, muting half of them.", channel: "SOCIAL_MENTION" },
  { content: "Really impressed by how grounded the AI answers are, it actually cites the feedback it used.", channel: "SOCIAL_MENTION" },
  { content: "CSV import failed silently on a large file, had to split it into chunks to get it working.", channel: "SOCIAL_MENTION" },

  // ---- CSAT_SURVEY ----
  { content: "The support agent was extremely knowledgeable and resolved my billing question quickly.", channel: "CSAT_SURVEY" },
  { content: "Ticket took longer than expected to resolve, but the final fix worked well.", channel: "CSAT_SURVEY" },
  { content: "Frustrated that I had to explain the SSO issue three times to three different agents.", channel: "CSAT_SURVEY" },
  { content: "Quick, friendly, and actually fixed the dashboard loading issue permanently.", channel: "CSAT_SURVEY" },
  { content: "Average experience, the response was generic and didn't fully address my export question.", channel: "CSAT_SURVEY" },
  { content: "Excellent support on the mobile crash issue, they even followed up the next day to confirm it was fixed.", channel: "CSAT_SURVEY" },
  { content: "The onboarding specialist was great but the self-serve docs are out of date.", channel: "CSAT_SURVEY" },
  { content: "Billing discrepancy was resolved same day, very satisfied with the outcome.", channel: "CSAT_SURVEY" },
  { content: "Ticket got reassigned four times before anyone actually looked at the SSO error.", channel: "CSAT_SURVEY" },
  { content: "Agent walked me through the CSV import step by step, extremely patient and clear.", channel: "CSAT_SURVEY" },

  // ---- Additional variety to comfortably clear the 120-item minimum ----
  { content: "The re-classify button is a lifesaver when the AI mis-tags sentiment on sarcastic reviews.", channel: "SUPPORT_TICKET" },
  { content: "Inbox filters don't combine channel and date range correctly, results look wrong.", channel: "SUPPORT_TICKET" },
  { content: "Loving the workspace isolation — finally confident our data isn't visible to other tenants.", channel: "SUPPORT_TICKET" },
  { content: "Report export as PDF cuts off the recommended actions section on longer reports.", channel: "SUPPORT_TICKET" },
  { content: "Our analyst accidentally deleted a theme and there was no confirmation dialog.", channel: "SUPPORT_TICKET" },
  { content: "The status workflow (New -> Reviewed -> Actioned) matches our internal process perfectly.", channel: "APP_STORE_REVIEW" },
  { content: "Onboarding got much better after the last update, invite flow is obvious now.", channel: "APP_STORE_REVIEW" },
  { content: "Sentiment scores feel accurate even on sarcastic or mixed-tone reviews, impressive.", channel: "APP_STORE_REVIEW" },
  { content: "The app occasionally shows stale data until I force-refresh manually.", channel: "APP_STORE_REVIEW" },
  { content: "Tablet layout is still cramped, hoping for a proper responsive pass soon.", channel: "APP_STORE_REVIEW" },
  { content: "The AI-generated feature area labels are surprisingly specific and useful for triage.", channel: "NPS_SURVEY" },
  { content: "Billing surprised us with an unexpected seat overage charge, wish there was a warning first.", channel: "NPS_SURVEY" },
  { content: "Onboarding docs could use more screenshots, a lot of it is just text right now.", channel: "NPS_SURVEY" },
  { content: "The spike alert on the trends page caught a real issue before our customers even filed tickets.", channel: "NPS_SURVEY" },
  { content: "Overall a strong 8/10, mobile polish is the main thing holding it back from a 10.", channel: "NPS_SURVEY" },
  { content: "Prospect asked whether LOOP supports custom SLAs tied to feedback status changes.", channel: "SALES_CALL_NOTE" },
  { content: "Customer wants the Ask LOOP answers to support follow-up questions in the same thread.", channel: "SALES_CALL_NOTE" },
  { content: "Champion mentioned the workspace isolation was the deciding factor over a competitor during security review.", channel: "SALES_CALL_NOTE" },
  { content: "Ask LOOP citing its sources instead of just answering blind is what won over their skeptical CTO.", channel: "SOCIAL_MENTION" },
  { content: "Onboarding a new hire took ten minutes start to finish, night and day from our old tool.", channel: "SOCIAL_MENTION" },
];

export function seedContentCount() {
  return SIMULATED_FEEDBACK.length;
}

export { label as sampleCompanyLabel };
