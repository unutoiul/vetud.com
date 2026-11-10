import { CBL_514_SOURCES, PTT_A_SOURCES } from "./emerging-weight-research"
import { PEPTIDE_ARTICLES } from "./peptide-articles"

/**
 * News & articles, written as plain-language study summaries. Each number comes from the linked
 * source. New articles arrive as drafts from the weekly news job and go live only once approved.
 * Articles never suggest personal use. Related catalog links distinguish research materials.
 */
export type ArticleArtVariant = "cells" | "triple" | "bars" | "pill" | "vials" | "documents" | "duo" | "skin"

export type Article = {
  slug: string
  /** YYYY-MM-DD, or YYYY-MM when only the month is known. */
  date: string
  kind: "Study" | "News" | "Regulation" | "Guide"
  topic: string
  /** Rendered with the middle part highlighted, like a magazine cover line. */
  headline: [before: string, highlight: string, after?: string]
  dek: string
  art: ArticleArtVariant
  glance: { label: string; value: string }[]
  /** body, means and unknowns may hold inline links: [label](/learn/slug) or [label](shop:slug); see RichText. */
  body: string[]
  means: string
  unknowns: string
  peptides: string[]
  sources: { label: string; detail: string; url: string }[]
}

export const LEARNING_GUIDES: Article[] = [
  {
    slug: "from-cells-to-human-trials", date: "2026-11-02", kind: "Guide", topic: "Reading the evidence",
    headline: ["From cells to people: ", "understand the research stages"],
    dek: "A promising mechanism, an animal experiment and a human trial answer different questions. Here is how to tell which kind of evidence you are reading.",
    art: "documents",
    glance: [
      { label: "Cell experiments", value: "Can explore a mechanism under controlled laboratory conditions" },
      { label: "Animal research", value: "Can investigate effects and safety in a model; it is not a human result" },
      { label: "Human trials", value: "Study people using a defined formulation, protocol and follow-up period" },
      { label: "First question", value: "What was studied, in whom, and what was actually measured?" },
    ],
    body: [
      "Begin with the study model. A compound changing a signal in a dish tells us something about that experiment. It does not show how much weight a person will lose, how an injury will heal, or which side effects a person might experience.",
      "Preclinical research includes work before testing in people, using laboratory systems and animal models. Researchers examine biological activity and potential toxicity. A promising preclinical finding is a reason for further investigation, rather than a demonstrated human benefit.",
      "Human clinical research follows a protocol: who can join, what treatment is studied, how comparisons are made and what outcomes will be measured. Early trials often focus on safety and how a drug behaves in the body. Later trials can investigate effectiveness and compare outcomes in larger groups.",
      "Next, check the comparison. Was there a placebo, another treatment, or no comparison group? Then look at the number of participants, the length of follow-up, and whether everyone who entered the study was included in the analysis.",
      "A conference abstract or company announcement may report early findings with limited detail. Look for a full study report and its methods before treating a headline as a complete account. A video can explain the story, but the original source lets you check the actual experiment.",
      "Finally, keep uncertainty visible. The absence of a reported serious event in a small study does not settle uncommon or long-term risks. The study’s formulation and patient group also matter when interpreting what its result applies to.",
    ],
    means: "Read the model, comparison, outcome and follow-up before the headline. Use the videos below to build the vocabulary, then return to the original research linked on each profile.",
    unknowns: "No single study answers every question. Findings may change with a different population, formulation, exposure or duration, and later research may revise an early conclusion.",
    peptides: ["ptt-a", "bpc-157", "retatrutide"],
    sources: [
      { label: "Step 2: Preclinical Research", detail: "US Food and Drug Administration · drug-development education", url: "https://www.fda.gov/patients/drug-development-process/step-2-preclinical-research" },
      { label: "Step 3: Clinical Research", detail: "US Food and Drug Administration · human trials and research phases", url: "https://www.fda.gov/patients/drug-development-process/step-3-clinical-research" },
      { label: "Clinical Trials: Information for Participants", detail: "National Institute of Mental Health · NIH videos and explanations", url: "https://www.nimh.nih.gov/health/trials" },
    ],
  },
  {
    slug: "body-weight-fat-and-muscle-results", date: "2026-11-02", kind: "Guide", topic: "Reading the evidence",
    headline: ["Body weight, fat and muscle: ", "read the right result"],
    dek: "A percentage means little without its denominator. Learn why changes in body weight, a fat deposit and a measurement in rats belong in different comparisons.",
    art: "bars",
    glance: [
      { label: "Body weight", value: "The change in total weight, usually relative to starting weight" },
      { label: "Fat volume", value: "A measured fat compartment, reported in units such as mL or as its own percentage change" },
      { label: "Muscle outcomes", value: "Check whether the study measured mass, size, strength or function" },
      { label: "Control comparison", value: "A difference versus a control group is not automatically the change from baseline" },
    ],
    body: [
      "Start by naming the outcome. Total body weight, visceral-fat volume and muscle strength are different measurements. Giving each a percentage sign does not make them interchangeable.",
      "Here is an illustrative calculation, not a trial result: a change from 100 kg to 90 kg is a 10% reduction in body weight. A scan showing a fat compartment changing from 1,000 mL to 900 mL is a 10% reduction in that compartment. The second calculation does not tell us that the person lost 10 kg.",
      "Also ask what the percentage is relative to. A change from a participant’s own starting value differs from a difference between treated and control groups. If control animals gain weight, a lower weight versus those animals need not represent the same percentage lost from the treated animals’ starting weight.",
      "Muscle claims need their own outcome. Look for what was measured and how it was measured, whether strength or function was assessed, and how long any difference lasted. Do not assume that a reduction in total weight identifies the tissue that changed.",
      "The examples in our library make this distinction concrete. Retatrutide trials report average human body-weight change. The cited CBL-514 work examines fat deposits, while the PTT-A findings discussed here come from animal experiments. Their numbers answer different questions.",
      "Even human weight-loss trials can differ in participants, treatment duration, accompanying care and analysis. Use the chart to explore reported results, then open each source before deciding how closely two studies can be compared.",
    ],
    means: "Ask: percentage of what, compared with what, in which population and over how long? Those four questions prevent many misleading comparisons.",
    unknowns: "A single percentage cannot establish long-term benefit, tissue-specific change or safety. An average also does not predict the result for an individual.",
    peptides: ["retatrutide", "cbl-514", "ptt-a", "tesamorelin"],
    sources: [
      { label: "Retatrutide phase 2 obesity trial", detail: "Jastreboff et al. · New England Journal of Medicine · human body-weight outcome", url: "https://pubmed.ncbi.nlm.nih.gov/37366315/" },
      ...CBL_514_SOURCES.map(({ title, ...source }) => ({ label: title, ...source })),
      ...PTT_A_SOURCES.slice(0, 1).map(({ title, ...source }) => ({ label: title, ...source })),
    ],
  },
]

export const ARTICLES: Article[] = [
  ...LEARNING_GUIDES,
  {
    slug: "ptt-a-four-receptors-animal-evidence",
    date: "2026-11-02",
    kind: "Study",
    topic: "Weight management",
    headline: ["PTT-A targets four receptors. ", "The evidence is still in animals"],
    dek: "The experimental peptide combines GLP-1, GIP, amylin and calcitonin activity. Here is what the original research can tell us about weight loss.",
    art: "triple",
    glance: [
      { label: "Compound", value: "PTT-A, an experimental peptide tetra-agonist from Pep2Tango" },
      { label: "Evidence reviewed", value: "ADA 2024 and 2025 conference abstracts, plus the developer’s launch announcement" },
      { label: "Study model", value: "Cells and rodents; the 2025 comparison used diet-induced obese rats for 21 days" },
      { label: "Human weight loss", value: "Not established in the cited research" },
      { label: "Versus retatrutide", value: "No human head-to-head result in these sources" },
    ],
    body: [
      "PTT-A is designed to combine four receptor activities in one peptide. The discovery work tested the molecule in laboratory systems and animal models. Pep2Tango’s 2024 launch announcement described preparations for clinical development; an announced development plan is not a clinical result.",
      "The ADA 2025 abstract compared PTT-A with tirzepatide in obese rats. Researchers reported body-weight and fat-mass reductions with preservation of measured muscle outcomes in the PTT-A groups. Those findings are a reason to investigate further, not proof of the same benefit in people.",
      "The weight result is expressed relative to the vehicle-control animals. It should not be read as the percentage of starting weight lost by a person. Our comparison shows this animal result separately from the human trials.",
      "Receptor counts also cannot rank medicines: four targets do not automatically outperform three. A claim that PTT-A beats retatrutide in people would require suitable human evidence that these sources do not provide.",
    ],
    means: "PTT-A is an early research approach worth following. It does not yet have a comparable human average weight-loss percentage in the sources reviewed here.",
    unknowns: "Human effectiveness, muscle preservation, tolerability and long-term safety remain unresolved by these preclinical sources. Conference abstracts provide less detail than full study reports.",
    peptides: ["ptt-a", "retatrutide", "tirzepatide"],
    sources: PTT_A_SOURCES.map(({ title, ...source }) => ({ label: title, ...source })),
  },
  ...PEPTIDE_ARTICLES,
  {
    slug: "rlx-201-skin-serum-12-weeks",
    date: "2026-10",
    kind: "Study",
    topic: "Skin",
    headline: ["A cream that targets an “aging switch” ", "firmed skin in 12 weeks"],
    dek: "In a controlled trial, a serum containing RLX-201 improved firmness, elasticity and sagging compared with the same cream without it.",
    art: "skin",
    glance: [
      { label: "Who took part", value: "47 women with moderate to severe sun-damaged facial skin; 31 received RLX-201 and 16 received vehicle" },
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
    unknowns: "This is a single-center, 12-week trial with 47 participants. Some authors are affiliated with the developer. Longer, independent studies are needed. RLX-201 is not a peptide, and this trial did not test GHK-Cu.",
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
    dek: "A small MRI analysis found a 12% reduction in visceral-fat volume, not body weight. A possible effect on weight regain after GLP-1 medicines is still an animal finding.",
    art: "cells",
    glance: [
      { label: "Who took part", value: "MRI subgroup from two phase 2 trials; 41 at baseline, 40 with later follow-up data; BMI 22 to 30" },
      { label: "How it was tested", value: "Injections into the lower belly every 3 weeks for up to 12 weeks, against a placebo" },
      { label: "What was measured", value: "Visceral-fat volume on MRI, not average whole-body weight loss" },
      { label: "Result", value: "−12.01% on CBL-514 vs +5.68% on placebo, 4 weeks after the last injection" },
      { label: "Status", value: "The visceral-fat analysis is a preliminary EASD 2026 report; a separate subcutaneous-fat trial is published" },
    ],
    body: [
      "Most weight-loss medicines shrink fat cells. An experimental drug called CBL-514 does something different: it makes fat cells self-destruct.",
      "CBL-514 is a small molecule, not a peptide. It is designed to trigger apoptosis, the body’s cell-removal process, in targeted fat tissue.",
      "Researchers from the University of Alabama at Birmingham and the drug’s developer, Caliway Biopharmaceuticals, presented new results at the European Association for the Study of Diabetes meeting in Milan.",
      "The developer’s account identifies 41 participants at baseline and 40 with later MRI follow-up data. Four weeks after final treatment, visceral-fat volume had fallen by 12.01% in the CBL-514 group and risen by 5.68% on placebo. This does not mean participants lost 12.01% of their body weight.",
      "Earlier phase 2 results showed that 69.6% of treated people lost at least 150 ml of the fat just under the skin by the 8-week follow-up. Nobody on placebo did.",
      "Animal tests added an interesting twist. Rats given CBL-514 together with the GLP-1 medicine tirzepatide lost more weight than rats on tirzepatide alone, and regained less when tirzepatide was stopped. The idea: with fewer fat cells left, there’s less room for fat to come back.",
      "Side effects were mostly mild, short-lived reactions where the injections were given, such as pain, swelling and redness. No serious side effects were reported.",
    ],
    means: "The studies address local fat deposits and an early hypothesis about weight regain. The fat-volume result cannot be ranked alongside average human body-weight loss with semaglutide, tirzepatide or retatrutide.",
    unknowns: "The MRI subgroup was small and the visceral-fat report is preliminary. Reduced weight regain after stopping a GLP-1 medicine has not been established in people. Long-term safety and whole-body weight outcomes need further study.",
    peptides: ["cbl-514", "tirzepatide", "semaglutide"],
    sources: CBL_514_SOURCES.map(({ title, ...source }) => ({ label: title, ...source })),
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
      { label: "Purpose", value: "Consideration for the Section 503A compounding ingredients list" },
      { label: "Is it approval?", value: "No. Advisory recommendations are non-binding; FDA makes the decision" },
    ],
    body: [
      "Compounding pharmacies make medicines for individual patients from raw ingredients, for example when someone needs a strength or form that isn’t sold. In the US they can only use raw ingredients that meet certain rules, such as being part of an approved medicine or being on an FDA list. While the FDA reviews newly nominated ingredients, it keeps interim lists, and “Category 1” ingredients can be used in the meantime.",
      "In July 2026 the FDA asked its expert advisers about seven peptides that people had nominated for that list. On July 23 the panel looked at BPC-157 (for ulcerative colitis, a bowel disease), KPV (for wound healing and inflammation), TB-500 (for wound healing) and MOTS-c (for obesity and osteoporosis). On July 24 it looked at DSIP (for opioid withdrawal, insomnia and narcolepsy), Semax (for stroke-related conditions, migraine and facial nerve pain) and Epitalon (for insomnia).",
      "The official agenda and meeting recordings document the substances and proposed uses under discussion. This summary does not infer a final regulatory decision from an advisory meeting.",
      "Advisory committee recommendations are non-binding. Inclusion on the compounding list and approval of a finished medicine are separate regulatory decisions.",
      "For what is actually known about these peptides in people, read [BPC-157’s human evidence](/news/bpc-157-human-evidence), [Semax and Selank](/news/semax-selank-russian-nasal-peptides), [Epitalon](/news/epitalon-telomeres-cell-study) and [DSIP](/news/dsip-sleep-peptide-riddle).",
    ],
    means: "If the FDA follows the panel, licensed pharmacies could one day prepare BPC-157 for individual patients with a prescription. That would bring some quality control to a peptide that is mostly sold online today without any oversight.",
    unknowns: "Permission to compound is not the same as approval as a medicine. Even then, there would still be no large human trials showing that BPC-157 works or is safe.",
    peptides: ["bpc-157", "kpv", "tb-500", "mots-c", "dsip", "semax", "epitalon"],
    sources: [
      { label: "July 23–24, 2026: Meeting of the Pharmacy Compounding Advisory Committee", detail: "US Food and Drug Administration", url: "https://www.fda.gov/advisory-committees/advisory-committee-calendar/july-23-24-2026-meeting-pharmacy-compounding-advisory-committee-07232026" },
      { label: "Bulk drug substances nominated for compounding under Section 503A", detail: "US Food and Drug Administration · updated May 14, 2026 (PDF)", url: "https://www.fda.gov/media/94155/download" },
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
      "The [retatrutide profile](/learn/retatrutide) covers the earlier trials. Retatrutide research material is listed [in the research shop](shop:retatrutide); it is not Lilly’s investigational medicine.",
    ],
    means: "If approved, retatrutide would give doctors a third generation of hormone-based weight-loss medicines, with results that may suit people who don’t lose enough weight on today’s options.",
    unknowns: "These are company-reported results that haven’t yet been published in full. Long-term safety, and how much weight comes back after stopping, are still unknown.",
    peptides: ["retatrutide", "tirzepatide", "semaglutide"],
    sources: [
      { label: "TRIUMPH-2 and TRIUMPH-3: phase 3 retatrutide topline results", detail: "Eli Lilly and Company · original sponsor announcement · July 23, 2026", url: "https://investor.lilly.com/news-releases/news-release-details/lillys-triple-agonist-retatrutide-successful-two-additional" },
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
      "Two more phase 3 trials followed in July ([read our report](/news/retatrutide-triumph-2-and-3)). Retatrutide research material is listed [in the research shop](shop:retatrutide); it is not Lilly’s investigational medicine.",
    ],
    means: "If these numbers hold up in the full publication, retatrutide could set a new benchmark for weight-loss medicines.",
    unknowns: "These are company-reported topline results, not yet peer-reviewed. Long-term safety, and how much weight comes back after stopping, are still open questions. Retatrutide is not approved anywhere.",
    peptides: ["retatrutide", "tirzepatide", "semaglutide"],
    sources: [
      { label: "TRIUMPH-1: phase 3 retatrutide topline results", detail: "Eli Lilly and Company · original sponsor announcement · May 21, 2026", url: "https://investor.lilly.com/news-releases/news-release-details/lillys-triple-agonist-retatrutide-delivered-powerful-weight-loss" },
    ],
  },
  {
    slug: "fda-category-2-twelve-peptides",
    date: "2026-04-22",
    kind: "Regulation",
    topic: "Regulation",
    headline: ["12 popular peptides come off the FDA’s ", "“do not compound” list", ". Here’s what that means"],
    dek: "BPC-157, TB-500, GHK-Cu and nine others are no longer on the FDA’s list of risky compounding ingredients. That isn’t the same as approval.",
    art: "documents",
    glance: [
      { label: "Official record", value: "FDA list updated April 22, 2026" },
      { label: "Peptides", value: "BPC-157, LL-37, Dihexa, DSIP, Epitalon, injectable GHK-Cu, KPV, PEG-MGF, Melanotan II, MOTS-c, Semax and TB-500" },
      { label: "Why", value: "The people who nominated them withdrew their nominations" },
      { label: "Approved now?", value: "No. A change to an interim list is not drug approval" },
      { label: "Next", value: "Expert reviews in July 2026, and for the rest by February 2027" },
    ],
    body: [
      "The FDA keeps interim lists of raw ingredients that compounding pharmacies want to use. Category 1 ingredients can be used while the FDA reviews them. Category 2 is for ingredients the FDA believes may pose significant safety risks; pharmacies shouldn’t use those.",
      "The FDA’s 2026 records describe the removal of substances from Category 2 after nominators withdrew their nominations. They include BPC-157, TB-500, Melanotan II, MOTS-c, Semax, Epitalon and injectable GHK-Cu.",
      "Removal after a withdrawn nomination does not demonstrate safety or effectiveness and does not amount to approval of a medicine. Compounding eligibility remains subject to the applicable legal requirements.",
      "The FDA scheduled expert reviews for seven of them in July 2026, and for the other five before the end of February 2027.",
      "A later FDA update, dated May 14, distinguishes non-injectable GHK-Cu: that nomination was restored to Category 1 after the nominator clarified that only the injectable nomination was being withdrawn. Route of administration matters.",
    ],
    means: "The change opened the door to a formal review of these peptides, which is how they could eventually be made by licensed pharmacies.",
    unknowns: "None of these peptides has been approved as a medicine, and most have very little human research. Whether any will end up on the allowed list is still undecided.",
    peptides: ["bpc-157", "tb-500", "ghk-cu", "melanotan", "mots-c", "semax", "epitalon", "kpv"],
    sources: [
      { label: "Bulk drug substances nominated for compounding under Section 503A", detail: "US Food and Drug Administration · updated May 14, 2026 (PDF)", url: "https://www.fda.gov/media/94155/download" },
      { label: "Safety risks and withdrawn compounding nominations", detail: "US Food and Drug Administration · primary safety information", url: "https://www.fda.gov/drugs/human-drug-compounding/certain-bulk-drug-substances-use-compounding-may-present-significant-safety-risks" },
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
      "Read the profiles of [tirzepatide](/learn/tirzepatide), [semaglutide](/learn/semaglutide) and [cagrilintide](/learn/cagrilintide). Research materials for [tirzepatide](shop:tirzepatide) and [semaglutide](shop:semaglutide) are listed in the research shop, separate from the approved medicines.",
    ],
    means: "Both medicines produced large weight losses. The trial shows how fast the field is moving, and how high the bar has become for new medicines.",
    unknowns: "Full trial details, side-effect comparisons and the FDA’s decision are still to come.",
    peptides: ["semaglutide", "tirzepatide", "cagrilintide"],
    sources: [
      { label: "REDEFINE 4: CagriSema and tirzepatide head-to-head results", detail: "Novo Nordisk · original sponsor announcement · February 23, 2026", url: "https://www.novonordisk.com/content/nncorp/global/en/news-and-media/news-and-ir-materials/news-details.html?id=916501" },
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
      "Semaglutide research material is listed [in the research shop](shop:semaglutide); it is not the approved tablet or injection.",
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
export function formatArticleDate(date: string, locale = "en-US") {
  const [year, month, day] = date.split("-").map(Number)
  return new Intl.DateTimeFormat(locale, day ? { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" } : { month: "long", year: "numeric", timeZone: "UTC" })
    .format(new Date(Date.UTC(year, month - 1, day || 1)))
}
