/**
 * News & articles, written as plain-language study summaries. Each number comes from the linked
 * source. New articles arrive as drafts from the weekly news job and go live only once approved.
 * Articles never link to the shop and never suggest personal use.
 */
export type ArticleArtVariant = "cells" | "triple" | "bars" | "pill" | "vials" | "documents" | "duo" | "skin"

export type Article = {
  slug: string
  /** YYYY-MM-DD, or YYYY-MM when only the month is known. */
  date: string
  kind: "Study" | "News" | "Regulation"
  topic: string
  /** Rendered with the middle part highlighted, like a magazine cover line. */
  headline: [before: string, highlight: string, after?: string]
  dek: string
  art: ArticleArtVariant
  glance: { label: string; value: string }[]
  body: string[]
  means: string
  unknowns: string
  peptides: string[]
  sources: { label: string; detail: string; url: string }[]
}

export const ARTICLES: Article[] = [
  {
    slug: "rlx-201-skin-serum-12-weeks",
    date: "2026-10",
    kind: "Study",
    topic: "Skin",
    headline: ["A cream that targets an “aging switch” ", "firmed skin in 12 weeks"],
    dek: "In a controlled trial, a serum containing RLX-201 improved firmness, elasticity and sagging compared with the same cream without it.",
    art: "skin",
    glance: [
      { label: "Who took part", value: "Women with moderate to severe sun-damaged facial skin" },
      { label: "How it was tested", value: "Applied twice a day for 12 weeks; randomized and double-blind, against the same cream without RLX-201" },
      { label: "What improved", value: "Firmness, elasticity, sagging and overall skin quality, starting from week 2" },
      { label: "What people said", value: "More than 85% reported better radiance, texture and hydration" },
      { label: "Published in", value: "Journal of Cosmetic Dermatology, October 2026" },
    ],
    body: [
      "Most anti-aging creams work on the surface: they moisturize, exfoliate or add collagen-boosting ingredients. A new study tested a different idea: switching down one of the body’s main aging controls, right in the skin.",
      "That control is called TORC1. It’s a sensor inside our cells that responds to nutrients and tells cells when to grow. Scientists link it to many of the processes of aging, and dialing it down is one of the most studied ideas in aging research. It’s how the drug rapamycin works.",
      "Researchers gave women with sun-damaged facial skin either a serum containing RLX-201, a TORC1 blocker, or the same serum without it. Neither the women nor the investigators knew who had which. Skin was checked at the start and after 2, 4, 8 and 12 weeks.",
      "The RLX-201 group had significantly firmer, more elastic and less saggy skin than the comparison group, and the difference showed up as early as week 2. Measurements with a device that tests how skin stretches and springs back agreed. More than 85% of the women using it said their skin looked more radiant, smoother and more hydrated.",
      "In lab-grown human skin, the formula cut a marker of TORC1 activity by about 91%, a sign it was doing what it was designed to do.",
    ],
    means: "It’s an early sign that skin care aimed at the biology of aging, not just moisture or collagen, can make a visible difference.",
    unknowns: "This is a single 12-week trial, and the published summary doesn’t give the group size or exact percentages. Longer and independent studies would tell us more. RLX-201 is not a peptide.",
    peptides: ["ghk-cu"],
    sources: [
      { label: "A novel TORC1 inhibitor, RLX-201, improves skin health, biomechanics, and extracellular matrix integrity in a double-blind clinical study", detail: "Draelos et al. · Journal of Cosmetic Dermatology · 2026", url: "https://doi.org/10.1111/jocd.71219" },
    ],
  },
  {
    slug: "cbl-514-fat-cells-self-destruct",
    date: "2026-10-01",
    kind: "Study",
    topic: "Weight management",
    headline: ["A new injection makes ", "fat cells self-destruct", ", and might help stop weight coming back"],
    dek: "In a small trial, CBL-514 cut deep belly fat by 12% while fat grew in the placebo group. Animal tests hint it could slow weight regain after GLP-1 medicines.",
    art: "cells",
    glance: [
      { label: "Who took part", value: "40 adults with a BMI of 22 to 30, from two phase 2 trials" },
      { label: "How it was tested", value: "Injections into the lower belly every 3 weeks for up to 12 weeks, against a placebo" },
      { label: "What was measured", value: "Deep (visceral) belly fat, on MRI scans" },
      { label: "Result", value: "−12.01% on CBL-514 vs +5.68% on placebo, 4 weeks after the last injection" },
      { label: "Status", value: "Presented at a medical conference (EASD 2026); not yet published in a journal" },
    ],
    body: [
      "Most weight-loss medicines shrink fat cells. An experimental drug called CBL-514 does something different: it makes fat cells self-destruct.",
      "It triggers apoptosis, the body’s built-in way of removing cells it no longer needs, in fat cells only, leaving other cells alone. It is injected directly into the fat of the belly.",
      "Researchers from the University of Alabama at Birmingham and the drug’s developer, Caliway Biopharmaceuticals, presented new results at the European Association for the Study of Diabetes meeting in Milan.",
      "They looked at 40 people from two phase 2 trials who had MRI scans. Four weeks after the last injection, deep belly fat (the kind wrapped around the organs) had fallen by 12.01% on average in the CBL-514 group, but grown by 5.68% in the placebo group. At a later check, 8 to 12 weeks after treatment ended, the drug group was still 10.45% below where they started.",
      "Earlier phase 2 results showed that 69.6% of treated people lost at least 150 ml of the fat just under the skin by the 8-week follow-up. Nobody on placebo did.",
      "Animal tests added an interesting twist. Rats given CBL-514 together with the GLP-1 medicine tirzepatide lost more weight than rats on tirzepatide alone, and regained less when tirzepatide was stopped. The idea: with fewer fat cells left, there’s less room for fat to come back.",
      "Side effects were mostly mild, short-lived reactions where the injections were given, such as pain, swelling and redness. No serious side effects were reported.",
    ],
    means: "Weight coming back after stopping GLP-1 medicines is one of the biggest open problems in obesity care. Reducing the number of fat cells, not just their size, is a new way to tackle it.",
    unknowns: "The human group was small, the results haven’t been published in a journal yet, and the benefit for weight regain has only been seen in rats. CBL-514 is not a peptide and is not approved anywhere.",
    peptides: ["tirzepatide", "semaglutide"],
    sources: [
      { label: "New weight-loss injection targets fat cells", detail: "EurekAlert! news release, European Association for the Study of Diabetes · October 1, 2026", url: "https://www.eurekalert.org/news-releases/1146063" },
      { label: "New injection makes fat cells self-destruct", detail: "ScienceDaily · October 8, 2026", url: "https://www.sciencedaily.com/releases/2026/10/261008102713.htm" },
    ],
  },
  {
    slug: "fda-advisers-review-bpc-157-and-six-peptides",
    date: "2026-07-24",
    kind: "Regulation",
    topic: "Regulation",
    headline: ["FDA advisers weigh in on ", "BPC-157 and six other peptides"],
    dek: "A federal advisory panel looked at whether pharmacies should be allowed to make seven popular peptides. Here’s what happened, and what it does and doesn’t mean.",
    art: "vials",
    glance: [
      { label: "When", value: "July 23–24, 2026" },
      { label: "Who", value: "The FDA’s Pharmacy Compounding Advisory Committee" },
      { label: "Peptides reviewed", value: "BPC-157, KPV, TB-500, MOTS-c, DSIP (emideltide), Semax and Epitalon" },
      { label: "Reported vote", value: "8 to 6 in favor for BPC-157, for ulcerative colitis" },
      { label: "Is it final?", value: "No. The vote is advice; the FDA makes the decision" },
    ],
    body: [
      "Compounding pharmacies make medicines for individual patients from raw ingredients, for example when someone needs a strength or form that isn’t sold. In the US they can only use raw ingredients that meet certain rules, such as being part of an approved medicine or being on an FDA list. While the FDA reviews newly nominated ingredients, it keeps interim lists, and “Category 1” ingredients can be used in the meantime.",
      "In July 2026 the FDA asked its expert advisers about seven peptides that people had nominated for that list. On July 23 the panel looked at BPC-157 (for ulcerative colitis, a bowel disease), KPV (for wound healing and inflammation), TB-500 (for wound healing) and MOTS-c (for obesity and osteoporosis). On July 24 it looked at DSIP (for opioid withdrawal, insomnia and narcolepsy), Semax (for stroke-related conditions, migraine and facial nerve pain) and Epitalon (for insomnia).",
      "According to reports, the panel voted 8 to 6 to recommend adding BPC-157 to the list, even though FDA staff had raised concerns, including that one form of the ingredient was not well characterized.",
      "The FDA now decides whether to follow the advice. Any change to the list would go through a formal rule-making process, which can take many months.",
    ],
    means: "If the FDA follows the panel, licensed pharmacies could one day prepare BPC-157 for individual patients with a prescription. That would bring some quality control to a peptide that is mostly sold online today without any oversight.",
    unknowns: "Permission to compound is not the same as approval as a medicine. Even then, there would still be no large human trials showing that BPC-157 works or is safe.",
    peptides: ["bpc-157", "kpv", "tb-500", "mots-c", "semax", "epitalon"],
    sources: [
      { label: "July 23–24, 2026: Meeting of the Pharmacy Compounding Advisory Committee", detail: "US Food and Drug Administration", url: "https://www.fda.gov/advisory-committees/advisory-committee-calendar/july-23-24-2026-meeting-pharmacy-compounding-advisory-committee-07232026" },
      { label: "FDA advisory committee’s vote may open a drug-compounding back door for unapproved peptides", detail: "Health Affairs Forefront · 2026", url: "https://www.healthaffairs.org/content/forefront/fda-advisory-committee-s-vote-may-open-drug-compounding-back-door-unapproved-peptides" },
    ],
  },
  {
    slug: "retatrutide-triumph-2-and-3",
    date: "2026-07-23",
    kind: "Study",
    topic: "Weight management",
    headline: ["Two more wins for retatrutide, in people with ", "diabetes and heart disease"],
    dek: "New phase 3 results show strong weight loss in people with type 2 diabetes or heart disease. Lilly plans to apply for US approval by early 2027.",
    art: "bars",
    glance: [
      { label: "TRIUMPH-2", value: "1,152 adults with type 2 diabetes: up to 20.8% weight loss vs 4.0% on placebo" },
      { label: "TRIUMPH-3", value: "1,949 adults with heart disease and a BMI of 35 or more: up to 22.6% vs 3.2%" },
      { label: "How long", value: "80 weeks, once-weekly injections" },
      { label: "Blood sugar", value: "HbA1c (average blood sugar) down by up to 1.6 points, from 7.7%" },
      { label: "Next step", value: "US application planned by early 2027" },
    ],
    body: [
      "Retatrutide is Eli Lilly’s experimental “triple” hormone medicine. Two months after its first big phase 3 trial, the company reported results from two more.",
      "TRIUMPH-2 included 1,152 adults with type 2 diabetes and overweight. After 80 weeks, they lost 12.7%, 19.1% and 20.8% of their body weight on the 4, 9 and 12 mg doses, compared with 4.0% on placebo. HbA1c, a measure of average blood sugar, fell by up to 1.6 points from a starting level of 7.7%.",
      "TRIUMPH-3 included 1,949 adults with a BMI of 35 or more and heart disease. They lost 21.6% on 9 mg and 22.6% on 12 mg, compared with 3.2% on placebo.",
      "People with type 2 diabetes usually lose less weight on these medicines than people without it, so these results stand out.",
      "With these results, Lilly says it has the data it needs to apply for approval around the world.",
    ],
    means: "If approved, retatrutide would give doctors a third generation of hormone-based weight-loss medicines, with results that may suit people who don’t lose enough weight on today’s options.",
    unknowns: "These are company-reported results that haven’t yet been published in full. Long-term safety, and how much weight comes back after stopping, are still unknown.",
    peptides: ["retatrutide", "tirzepatide", "semaglutide"],
    sources: [
      { label: "Retatrutide delivers up to 22.6% weight loss in two new phase III trials", detail: "Pharmaceutical Executive · July 2026", url: "https://www.pharmexec.com/view/retatrutide-delivers-22-weight-loss-two-phase-iii-trials" },
    ],
  },
  {
    slug: "retatrutide-triumph-1-28-percent",
    date: "2026-05-21",
    kind: "Study",
    topic: "Weight management",
    headline: ["Retatrutide’s first big trial: ", "28% weight loss", " in 80 weeks"],
    dek: "Eli Lilly’s experimental “triple” hormone medicine helped people lose more than a quarter of their body weight on the top dose.",
    art: "triple",
    glance: [
      { label: "Who took part", value: "2,339 adults with obesity, or overweight plus a related health problem, without diabetes" },
      { label: "How long", value: "80 weeks of once-weekly injections" },
      { label: "Result", value: "19.0%, 25.9% and 28.3% average weight loss on 4, 9 and 12 mg" },
      { label: "Longest follow-up", value: "30.3% at 104 weeks on 12 mg, in people with a BMI of 35 or more" },
      { label: "Status", value: "Company (topline) results; full data still to be published" },
    ],
    body: [
      "Retatrutide is an experimental weekly injection that works on three hormone targets at once: GLP-1, GIP and glucagon. Today’s approved weight-loss medicines work on one (semaglutide) or two (tirzepatide).",
      "On May 21, 2026, Lilly announced the first results from TRIUMPH-1, its first large phase 3 trial. After 80 weeks, people on the 12 mg dose had lost 28.3% of their body weight on average, about 70 lb (32 kg). On 9 mg they lost 25.9%, and on 4 mg, 19.0%.",
      "A smaller group with a BMI of 35 or more kept going to 104 weeks. Those on 12 mg had lost 30.3% of their weight by then.",
      "Side effects were mostly stomach-related and rose with the dose. On 12 mg, 42% of people had nausea (15% on placebo) and a quarter had vomiting (5% on placebo). 11.3% stopped the top dose because of side effects, compared with 4.9% on placebo.",
    ],
    means: "If these numbers hold up in the full publication, retatrutide could set a new benchmark for weight-loss medicines.",
    unknowns: "These are company-reported topline results, not yet peer-reviewed. Long-term safety, and how much weight comes back after stopping, are still open questions. Retatrutide is not approved anywhere.",
    peptides: ["retatrutide", "tirzepatide", "semaglutide"],
    sources: [
      { label: "Retatrutide achieves up to 30.3% average weight loss in phase 3 TRIUMPH-1 trial", detail: "AJMC · May 2026", url: "https://www.ajmc.com/view/retatrutide-achieves-up-to-30-3-average-weight-loss-in-phase-3-triumph-1-trial" },
    ],
  },
  {
    slug: "fda-category-2-twelve-peptides",
    date: "2026-04-15",
    kind: "Regulation",
    topic: "Regulation",
    headline: ["12 popular peptides come off the FDA’s ", "“do not compound” list", ". Here’s what that means"],
    dek: "BPC-157, TB-500, GHK-Cu and nine others are no longer on the FDA’s list of risky compounding ingredients. That isn’t the same as approval.",
    art: "documents",
    glance: [
      { label: "When", value: "Announced April 15, 2026" },
      { label: "Peptides", value: "BPC-157, LL-37, Dihexa, DSIP, Epitalon, injectable GHK-Cu, KPV, PEG-MGF, Melanotan II, MOTS-c, Semax and TB-500" },
      { label: "Why", value: "The people who nominated them withdrew their nominations" },
      { label: "Approved now?", value: "No. They are not on the list pharmacies are allowed to use either" },
      { label: "Next", value: "Expert reviews in July 2026, and for the rest by February 2027" },
    ],
    body: [
      "The FDA keeps interim lists of raw ingredients that compounding pharmacies want to use. Category 1 ingredients can be used while the FDA reviews them. Category 2 is for ingredients the FDA believes may pose significant safety risks; pharmacies shouldn’t use those.",
      "On April 15, 2026, the FDA said it would remove 12 peptides from Category 2, because their nominations had been withdrawn. They included some of the best-known names in the peptide world: BPC-157, TB-500, Melanotan II, MOTS-c, Semax, Epitalon and injectable GHK-Cu.",
      "Coming off the “do not compound” list does not put them on the “allowed” list. The FDA was clear that removal does not make them eligible for compounding. Legal experts describe them as being “in limbo”.",
      "The FDA scheduled expert reviews for seven of them in July 2026, and for the other five before the end of February 2027.",
    ],
    means: "The change opened the door to a formal review of these peptides, which is how they could eventually be made by licensed pharmacies.",
    unknowns: "None of these peptides has been approved as a medicine, and most have very little human research. Whether any will end up on the allowed list is still undecided.",
    peptides: ["bpc-157", "tb-500", "ghk-cu", "melanotan", "mots-c", "semax", "epitalon", "kpv"],
    sources: [
      { label: "FDA to remove 12 popular peptides from the Category 2 “do not compound” list", detail: "Frier Levitt (healthcare law firm) · April 16, 2026", url: "https://www.frierlevitt.com/articles/fda-peptides-do-not-compound-list-update-2026/" },
    ],
  },
  {
    slug: "cagrisema-vs-zepbound",
    date: "2026-02-24",
    kind: "Study",
    topic: "Weight management",
    headline: ["In a head-to-head trial, ", "Zepbound beat CagriSema"],
    dek: "Novo Nordisk’s next-generation combination led to 23% weight loss, but Lilly’s tirzepatide reached about 25%.",
    art: "duo",
    glance: [
      { label: "CagriSema is", value: "Semaglutide combined with cagrilintide, a copy of the hormone amylin" },
      { label: "Compared with", value: "Zepbound (tirzepatide)" },
      { label: "How long", value: "84 weeks" },
      { label: "Result", value: "About 23% vs about 25% average weight loss" },
      { label: "Status", value: "Filed for FDA approval; decision expected in late 2026" },
    ],
    body: [
      "CagriSema is Novo Nordisk’s next weight-loss medicine. It combines semaglutide, the active ingredient in Wegovy, with cagrilintide, a copy of amylin. Amylin is a hormone released with insulin after meals that also tells the brain you’re full.",
      "In a phase 3 trial that pitted it directly against Eli Lilly’s Zepbound (tirzepatide), people on CagriSema lost about 23% of their body weight over 84 weeks. People on Zepbound lost about 25%.",
      "Novo had already applied for FDA approval before the result came out. A decision is expected in late 2026.",
    ],
    means: "Both medicines produced large weight losses. The trial shows how fast the field is moving, and how high the bar has become for new medicines.",
    unknowns: "Full trial details, side-effect comparisons and the FDA’s decision are still to come.",
    peptides: ["semaglutide", "tirzepatide"],
    sources: [
      { label: "Healthy Returns: What’s next for Novo Nordisk’s next-generation obesity drug CagriSema after trial miss", detail: "CNBC · February 24, 2026", url: "https://www.cnbc.com/2026/02/24/healthy-returns-whats-next-for-novo-nordisks-obesity-drug-cagrisema.html" },
    ],
  },
  {
    slug: "wegovy-pill-approved",
    date: "2025-12-22",
    kind: "News",
    topic: "Weight management",
    headline: ["The first ", "GLP-1 weight-loss pill", " is approved in the US"],
    dek: "Wegovy now comes as a once-a-day tablet. In its main trial, people lost 13.6% of their body weight on average.",
    art: "pill",
    glance: [
      { label: "Medicine", value: "Semaglutide 25 mg tablet, once a day" },
      { label: "Approved for", value: "Weight management in adults with obesity, or overweight plus a weight-related health problem. It also lowers the risk of heart attack and stroke in people with heart disease" },
      { label: "Main trial", value: "OASIS 4: 307 adults over 64 weeks" },
      { label: "Result", value: "13.6% average weight loss vs 2.2% on placebo" },
      { label: "Where", value: "US (at the time of approval)" },
    ],
    body: [
      "On December 22, 2025, the FDA approved the Wegovy pill: the same medicine as the Wegovy injection, semaglutide, as a tablet taken once a day. It is the first GLP-1 pill approved for weight management.",
      "The approval was based on the OASIS 4 trial, in which 307 adults with obesity or overweight took the pill or a placebo for 64 weeks, along with diet and exercise advice. People on the pill lost 13.6% of their body weight on average, compared with 2.2% on placebo.",
      "Side effects were similar to the injection and mostly affected the stomach: 74.0% of people on the pill had stomach-related side effects, compared with 42.2% on placebo.",
      "Novo Nordisk planned a full US launch for early January 2026.",
    ],
    means: "For people who don’t want injections, a pill could make treatment easier to start and stick with.",
    unknowns: "How results hold up over years, and when the pill will be available outside the US, remain to be seen.",
    peptides: ["semaglutide"],
    sources: [
      { label: "FDA approves Novo Nordisk’s Wegovy pill, the first and only oral GLP-1 for weight loss in adults", detail: "Novo Nordisk press release · December 22, 2025", url: "https://www.prnewswire.com/news-releases/fda-approves-novo-nordisks-wegovy-pill-the-first-and-only-oral-glp-1-for-weight-loss-in-adults-302648344.html" },
      { label: "Oral Semaglutide at a Dose of 25 mg in Adults with Overweight or Obesity (OASIS 4)", detail: "Wharton et al. · New England Journal of Medicine · 2025", url: "https://pubmed.ncbi.nlm.nih.gov/40934115/" },
    ],
  },
]

export function getArticle(slug: string) {
  return ARTICLES.find((article) => article.slug === slug)
}

/** "October 2026" or "July 24, 2026". */
export function formatArticleDate(date: string) {
  const [year, month, day] = date.split("-").map(Number)
  return new Intl.DateTimeFormat("en-US", day ? { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" } : { month: "long", year: "numeric", timeZone: "UTC" })
    .format(new Date(Date.UTC(year, month - 1, day || 1)))
}
