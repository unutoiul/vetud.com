import type { CategoryId, Evidence, StatusId } from "./categories"
import { CBL_514_SOURCES, PTT_A_SOURCES } from "./emerging-weight-research"

/**
 * The peptide library: plain-language profiles for readers without a science background.
 * Every number comes from the linked source (PubMed abstracts checked 2026-11-01).
 * Profiles describe published research and approval status only. They never give doses,
 * never suggest personal use. Related catalog links show live research-product availability.
 */
export type Source = { title: string; detail: string; url: string }
export type KeyResult = { value: string; label: string; detail: string }

/**
 * One published result, shown as bars (the compound first, then what it was compared with), a
 * single number, or a sentence when there is nothing to chart. Never mention doses.
 */
export type StudyResult = {
  /** What was measured, in plain words: "Average body weight lost after 68 weeks". */
  title: string
  who: "people" | "animals" | "cells" | "review"
  /** The study in plain words: name, how many, who, how long. */
  study: string
  bars?: { label: string; value: number; display?: string }[]
  /** Appended to each value: "%", " studies". */
  unit?: string
  /** For results where a smaller number is the better outcome, such as heart attacks. */
  lowerIsBetter?: boolean
  /** The result in words, when it can't be charted or needs a sentence of context. */
  finding?: string
  /** Index into the profile's sources. */
  source: number
}

export type PeptideProfile = {
  slug: string
  name: string
  aka?: string
  category: CategoryId
  status: StatusId
  statusNote: string
  oneLiner: string
  whatItIs: string
  howItWorks: string
  findings: string[]
  keyResult?: KeyResult
  /** How strong the evidence is, shown as the evidence ladder. */
  evidence?: Evidence
  /** Published results, charted on the product page and the profile. */
  results?: StudyResult[]
  /** "What we don't know yet". */
  unknowns?: string[]
  risks: string[]
  sources: Source[]
  /** YouTube ids from content/learn/videos.ts */
  videos?: string[]
  /** PubChem compound id; the drawing lives at /images/learn/structures/<slug>.webp */
  pubchem?: number
  notAPeptide?: boolean
}

const pubmed = (id: number) => `https://pubmed.ncbi.nlm.nih.gov/${id}/`
const FDA_ADVISERS_2026 = { title: "FDA Pharmacy Compounding Advisory Committee, July 23–24, 2026", detail: "US Food and Drug Administration · meeting page", url: "https://www.fda.gov/advisory-committees/advisory-committee-calendar/july-23-24-2026-meeting-pharmacy-compounding-advisory-committee-07232026" }
const FDA_CATEGORY_2_2026 = { title: "Bulk drug substances nominated for compounding under Section 503A", detail: "US Food and Drug Administration · updated May 14, 2026 (PDF)", url: "https://www.fda.gov/media/94155/download" }
const GLP1_RISKS = [
  "Stomach side effects are common: nausea, diarrhea, vomiting and constipation, especially while the dose is being raised.",
  "Less common but serious problems include inflammation of the pancreas (pancreatitis) and gallbladder problems.",
  "In the US the label warns about a type of thyroid tumor seen in rodents, so people with a family history of medullary thyroid cancer are told not to use it.",
  "Weight usually comes back after the medicine is stopped.",
]

export const PEPTIDES: PeptideProfile[] = [
  {
    slug: "ptt-a",
    name: "PTT-A",
    aka: "Experimental peptide tetra-agonist",
    category: "weight",
    status: "early",
    statusNote: "An investigational peptide, not an approved medicine. The cited efficacy findings are from cell and rodent experiments, not human weight-loss trials.",
    oneLiner: "An experimental peptide targeting four hormone receptors. Its weight and muscle findings are from animals so far.",
    whatItIs: "PTT-A is a research name for a long-acting peptide developed by Pep2Tango. It is designed to activate GLP-1, GIP, amylin and calcitonin receptors in one molecule. The company’s launch announcement described work preparing candidates for clinical development.",
    howItWorks: "The proposed approach combines several hormone signals rather than using a single receptor. Early studies tested receptor activity in cells and metabolic effects in rodents. Four targets alone do not establish how effective or tolerable a medicine will be in people.",
    findings: [
      "An ADA 2025 conference abstract reported a 21-day experiment in diet-induced obese rats, comparing PTT-A with tirzepatide and a vehicle control.",
      "Researchers reported fat-mass reduction with preserved muscle measures in the PTT-A groups. This is an animal finding, not proof of muscle preservation in people.",
      "The cited sources do not provide an average human body-weight-loss percentage or a human comparison with retatrutide.",
    ],
    keyResult: { value: "Animal data", label: "Human body-weight loss is not established", detail: "21-day rat experiment · conference abstract · not a human trial" },
    risks: ["Human effectiveness, adverse effects and long-term safety cannot be established from these animal experiments.", "Products sold under a research name cannot be assumed to match the developer’s investigational material."],
    sources: PTT_A_SOURCES,
  },
  {
    slug: "cbl-514",
    name: "CBL-514",
    category: "weight",
    status: "trials",
    notAPeptide: true,
    statusNote: "An experimental small-molecule drug in human studies, not an approved peptide medicine. Its fat-volume results are different from whole-body weight loss.",
    oneLiner: "A small molecule, not a peptide, studied for reducing local fat deposits by triggering fat-cell death.",
    whatItIs: "CBL-514 is an investigational injectable drug developed by Caliway. Studies examine abdominal fat under the skin and, in a smaller subgroup, visceral fat around the organs.",
    howItWorks: "It is designed to trigger apoptosis, a process that removes cells, in targeted fat tissue. Clinical research measures whether local fat deposits shrink; this is a different endpoint from a change in total body weight.",
    findings: [
      "A published randomized phase 2 study enrolled 76 participants. At eight-week follow-up, 69.6% of assessed CBL-514 participants had lost at least 150 mL of subcutaneous fat, compared with none on placebo.",
      "An EASD 2026 conference report described a small MRI subgroup: visceral-fat volume fell 12.01% four weeks after final treatment, while placebo rose 5.68%. That is not a body-weight-loss percentage.",
      "A possible reduction in weight regain after stopping tirzepatide has been reported in rats. It has not been established in people by the cited studies.",
    ],
    keyResult: { value: "−12.01%", label: "visceral-fat volume, not body weight", detail: "Preliminary MRI subgroup · four weeks after final treatment · placebo: +5.68%" },
    risks: ["Reported reactions include pain, swelling and redness at injection sites.", "Small, short studies cannot establish uncommon or long-term risks. Local fat reduction does not establish a treatment benefit for obesity or weight regain."],
    sources: CBL_514_SOURCES,
  },
  {
    slug: "semaglutide",
    name: "Semaglutide",
    aka: "Ozempic, Wegovy, Rybelsus",
    category: "weight",
    status: "approved",
    statusNote: "Approved in the US, EU and many other countries. Ozempic and Rybelsus treat type 2 diabetes; Wegovy is for weight management. A daily Wegovy pill was approved in the US in December 2025.",
    oneLiner: "A copy of a gut hormone that makes you feel full. One of the most studied weight-loss medicines in the world.",
    whatItIs: "Semaglutide is a man-made version of GLP-1, a hormone your gut releases after you eat. The natural hormone is broken down within minutes. Semaglutide was changed slightly so it lasts about a week, which is why the injection is given once a week.",
    howItWorks: "GLP-1 tells your brain you’re full, slows down how fast your stomach empties, and helps your body release insulin when blood sugar rises. Semaglutide does the same, for much longer.",
    findings: [
      "In the STEP 1 trial, 1,961 adults with obesity took weekly semaglutide for 68 weeks. They lost 14.9% of their body weight on average, compared with 2.4% on a placebo (a dummy injection).",
      "About half of the people on semaglutide lost 15% or more of their body weight. On placebo, fewer than 1 in 20 did.",
      "In the SELECT trial of 17,604 people with heart disease and overweight, semaglutide lowered the risk of a heart attack, stroke or heart-related death by 20%. Over about three years, 6.5% had one of these events, compared with 8.0% on placebo.",
      "A once-a-day pill version led to 13.6% weight loss over 64 weeks in the OASIS 4 trial, compared with 2.2% on placebo.",
    ],
    keyResult: { value: "14.9%", label: "average weight lost in 68 weeks", detail: "STEP 1 trial, 1,961 adults · placebo: 2.4%" },
    evidence: "approved",
    results: [
      { title: "Average body weight lost after 68 weeks", who: "people", study: "STEP 1 trial · 1,961 adults with obesity or overweight, compared with a placebo (a dummy injection)", bars: [{ label: "Semaglutide", value: 14.9 }, { label: "Placebo", value: 2.4 }], unit: "%", source: 0 },
      { title: "Heart attack, stroke or heart-related death over about 3 years", who: "people", study: "SELECT trial · 17,604 adults with heart disease and overweight", bars: [{ label: "Semaglutide", value: 6.5 }, { label: "Placebo", value: 8.0 }], unit: "%", lowerIsBetter: true, finding: "A 20% lower risk of these events than on placebo.", source: 1 },
      { title: "Average body weight lost after 64 weeks, as a daily pill", who: "people", study: "OASIS 4 trial · 307 adults with obesity or overweight", bars: [{ label: "Semaglutide pill", value: 13.6 }, { label: "Placebo", value: 2.2 }], unit: "%", source: 2 },
    ],
    unknowns: [
      "Why some people lose a lot of weight on it and others very little.",
      "How to keep the weight off after stopping: most people regain much of it.",
      "Effects over decades. The largest trials followed people for a few years.",
    ],
    risks: GLP1_RISKS,
    sources: [
      { title: "Once-Weekly Semaglutide in Adults with Overweight or Obesity (STEP 1)", detail: "Wilding et al. · New England Journal of Medicine · 2021", url: pubmed(33567185) },
      { title: "Semaglutide and Cardiovascular Outcomes in Obesity without Diabetes (SELECT)", detail: "Lincoff et al. · New England Journal of Medicine · 2023", url: pubmed(37952131) },
      { title: "Oral Semaglutide at a Dose of 25 mg in Adults with Overweight or Obesity (OASIS 4)", detail: "Wharton et al. · New England Journal of Medicine · 2025", url: pubmed(40934115) },
      { title: "Discovery of the Once-Weekly GLP-1 Analogue Semaglutide", detail: "Lau et al. · Journal of Medicinal Chemistry · 2015", url: pubmed(26308095) },
    ],
    videos: ["o8YMLTfNYtc", "QGIFdakceHM", "mm5zPW5offA"],
    pubchem: 56843331,
  },
  {
    slug: "tirzepatide",
    name: "Tirzepatide",
    aka: "Mounjaro, Zepbound",
    category: "weight",
    status: "approved",
    statusNote: "Approved in the US, EU and other countries. Mounjaro treats type 2 diabetes (and, in the EU, is also used for weight management). Zepbound is approved in the US for weight management and for sleep apnea in adults with obesity.",
    oneLiner: "Works on two gut hormones at once, GLP-1 and GIP. In trials it led to some of the biggest weight losses seen with an approved medicine.",
    whatItIs: "Tirzepatide is a single molecule that acts like two hormones your gut releases after meals: GLP-1 and GIP. Both help control appetite and blood sugar.",
    howItWorks: "Like semaglutide, it tells your brain you’re full, slows your stomach and helps insulin release when blood sugar is high. Adding the GIP signal appears to strengthen these effects.",
    findings: [
      "In the SURMOUNT-1 trial, 2,539 adults with obesity took tirzepatide for 72 weeks. On average they lost 15.0%, 19.5% and 20.9% of their body weight on the 5, 10 and 15 mg doses, compared with 3.1% on placebo.",
      "On the two higher doses, about half or more lost at least 20% of their body weight (50% and 57%), compared with 3% on placebo.",
      "In February 2026 a head-to-head trial reported that tirzepatide (Zepbound) led to more weight loss than Novo Nordisk’s experimental CagriSema: about 25% versus 23% over 84 weeks.",
    ],
    keyResult: { value: "20.9%", label: "average weight lost in 72 weeks (15 mg)", detail: "SURMOUNT-1 trial, 2,539 adults · placebo: 3.1%" },
    risks: GLP1_RISKS,
    sources: [
      { title: "Tirzepatide Once Weekly for the Treatment of Obesity (SURMOUNT-1)", detail: "Jastreboff et al. · New England Journal of Medicine · 2022", url: pubmed(35658024) },
      { title: "LY3298176, a novel dual GIP and GLP-1 receptor agonist: from discovery to clinical proof of concept", detail: "Coskun et al. · Molecular Metabolism · 2018", url: pubmed(30473097) },
      { title: "REDEFINE 4: CagriSema and tirzepatide head-to-head results", detail: "Novo Nordisk · original sponsor announcement · February 23, 2026", url: "https://www.novonordisk.com/content/nncorp/global/en/news-and-media/news-and-ir-materials/news-details.html?id=916501" },
    ],
    videos: ["QGIFdakceHM", "o8YMLTfNYtc"],
    pubchem: 166567236,
  },
  {
    slug: "retatrutide",
    name: "Retatrutide",
    aka: "LY3437943, often called “triple G”",
    category: "weight",
    status: "trials",
    statusNote: "Not approved anywhere yet. Eli Lilly has reported positive results from its large phase 3 trials and plans to apply for US approval by early 2027.",
    oneLiner: "An experimental “triple” hormone medicine that has produced some of the largest weight losses ever seen in a drug trial.",
    whatItIs: "Retatrutide is an experimental medicine made by Eli Lilly. It acts on three hormone targets at once: GLP-1, GIP and glucagon.",
    howItWorks: "GLP-1 and GIP reduce appetite and help control blood sugar. Glucagon is thought to make the body burn more energy, including fat stored in the liver. Together they work on appetite and on energy use at the same time.",
    findings: [
      "In a 2023 phase 2 trial, 338 adults with obesity took retatrutide for 48 weeks. People on the highest dose (12 mg) lost 24.2% of their body weight on average, compared with 2.1% on placebo.",
      "In May 2026 Lilly reported early results from the first big phase 3 trial, TRIUMPH-1, with 2,339 adults: 28.3% average weight loss after 80 weeks on 12 mg. These are company results and have not yet been published in a medical journal.",
      "Two more phase 3 trials (July 2026) showed average weight loss of up to 20.8% in people with type 2 diabetes and up to 22.6% in people with heart disease, compared with 4.0% and 3.2% on placebo.",
    ],
    keyResult: { value: "24.2%", label: "average weight lost in 48 weeks (12 mg)", detail: "Phase 2 trial, 338 adults · placebo: 2.1%" },
    risks: [
      "Stomach side effects are common and increase with the dose. In TRIUMPH-1, 42% of people on the top dose had nausea, compared with 15% on placebo.",
      "More people stopped the top dose because of side effects: 11.3%, compared with 4.9% on placebo.",
      "The phase 2 trial also saw a dose-related rise in heart rate.",
      "Long-term safety is still being studied, and it is not an approved medicine.",
    ],
    sources: [
      { title: "Triple-Hormone-Receptor Agonist Retatrutide for Obesity — A Phase 2 Trial", detail: "Jastreboff et al. · New England Journal of Medicine · 2023", url: pubmed(37366315) },
      { title: "TRIUMPH-1: phase 3 retatrutide topline results", detail: "Eli Lilly and Company · original sponsor announcement · May 21, 2026", url: "https://investor.lilly.com/news-releases/news-release-details/lillys-triple-agonist-retatrutide-delivered-powerful-weight-loss" },
      { title: "TRIUMPH-2 and TRIUMPH-3: phase 3 retatrutide topline results", detail: "Eli Lilly and Company · original sponsor announcement · July 23, 2026", url: "https://investor.lilly.com/news-releases/news-release-details/lillys-triple-agonist-retatrutide-successful-two-additional" },
    ],
    videos: ["w0A_VRT3rIE"],
  },
  {
    slug: "liraglutide",
    name: "Liraglutide",
    aka: "Victoza, Saxenda",
    category: "weight",
    status: "approved",
    statusNote: "Approved for type 2 diabetes (Victoza, US 2010) and for weight management (Saxenda, US 2014).",
    oneLiner: "The older, once-a-day cousin of semaglutide, and the first GLP-1 medicine approved for weight management.",
    whatItIs: "Liraglutide is an earlier copy of the gut hormone GLP-1. It lasts about a day in the body, so it is injected once daily.",
    howItWorks: "Like other GLP-1 medicines, it makes you feel full sooner, slows your stomach and helps control blood sugar.",
    findings: [
      "In the SCALE trial, 3,731 adults without diabetes took liraglutide or a placebo for 56 weeks, alongside diet and exercise advice. People on liraglutide lost 8.4 kg on average, compared with 2.8 kg on placebo.",
      "63% of people on liraglutide lost at least 5% of their body weight, compared with 27% on placebo.",
      "In the LEADER trial in people with type 2 diabetes, liraglutide lowered the risk of heart attack, stroke or heart-related death.",
    ],
    keyResult: { value: "8.4 kg", label: "average weight lost in 56 weeks", detail: "SCALE trial, 3,731 adults · placebo: 2.8 kg" },
    risks: GLP1_RISKS,
    sources: [
      { title: "A Randomized, Controlled Trial of 3.0 mg of Liraglutide in Weight Management (SCALE)", detail: "Pi-Sunyer et al. · New England Journal of Medicine · 2015", url: pubmed(26132939) },
      { title: "Liraglutide and Cardiovascular Outcomes in Type 2 Diabetes (LEADER)", detail: "Marso et al. · New England Journal of Medicine · 2016", url: pubmed(27295427) },
    ],
    videos: ["o8YMLTfNYtc"],
    pubchem: 16134956,
  },
  {
    slug: "bpc-157",
    name: "BPC-157",
    aka: "Body Protection Compound-157",
    category: "recovery",
    status: "early",
    statusNote: "Not approved anywhere, and banned in sport by the World Anti-Doping Agency (WADA). In 2026 the FDA took it off a list of risky compounding ingredients, but that is not an approval.",
    oneLiner: "A popular “healing” peptide with lots of animal research behind it, and almost no proper studies in people.",
    whatItIs: "BPC-157 is a lab-made chain of 15 amino acids, based on a protein found in stomach juice. It became famous in sports and “biohacking” circles as a healing aid.",
    howItWorks: "Animal studies suggest it may help new blood vessels grow and help tissues repair. How, or whether, it works in people is not known.",
    findings: [
      "Dozens of studies in rats and mice report faster healing of tendons, muscles, ligaments, bones and the gut.",
      "A 2025 review for sports medicine found the animal results encouraging, but very little evidence in humans.",
      "The FDA’s July 2026 meeting agenda covered BPC-157 for the bowel disease ulcerative colitis as a possible compounding ingredient. Advisory committee recommendations are non-binding and are not drug approval.",
    ],
    evidence: "animals",
    results: [
      { title: "What the research is based on", who: "review", study: "2025 systematic review of BPC-157 research on muscle, tendon, ligament and bone injuries, covering studies from 1993 to 2024", bars: [{ label: "Studies in animals", value: 35, display: "35 studies" }, { label: "Studies in people", value: 1, display: "1 study" }], finding: "In the animal studies, injured muscles, tendons, ligaments and bones healed better. The review found no safety data from people.", source: 0 },
      { title: "People reporting knee-pain relief for more than 6 months", who: "people", study: "One small look-back study · 12 people with long-term knee pain · no comparison group", bars: [{ label: "BPC-157", value: 7, display: "7 of 12" }], finding: "Without a comparison group, it can’t show whether BPC-157 caused the relief.", source: 0 },
    ],
    unknowns: [
      "Whether the healing seen in animals happens in people. There are no controlled trials in people.",
      "Its side effects and long-term safety in people.",
      "How it works. Animal studies point to new blood-vessel growth and less inflammation.",
    ],
    risks: [
      "Because it hasn’t been properly tested in people, its side effects and long-term safety are unknown.",
      "Products sold online are not regulated, so what’s in the vial and how pure it is can vary.",
      "Some doctors raise a theoretical worry: if it encourages new blood vessels, it might also help existing tumors grow. This hasn’t been studied in people.",
    ],
    sources: [
      { title: "Emerging Use of BPC-157 in Orthopaedic Sports Medicine: A Systematic Review", detail: "Vasireddi et al. · HSS Journal · 2025", url: pubmed(40756949) },
      FDA_ADVISERS_2026,
      FDA_CATEGORY_2_2026,
    ],
    videos: ["Y6smr1o-f9o", "8DVatJ9de90", "iM3TACEG-cQ"],
    pubchem: 9941957,
  },
  {
    slug: "tb-500",
    name: "TB-500",
    aka: "Thymosin beta-4 fragment",
    category: "recovery",
    status: "early",
    statusNote: "Not approved, and banned in sport by WADA. In 2026 the FDA took it off its “do not compound” list, but that is not an approval.",
    oneLiner: "A small piece of a natural repair protein. Popular for recovery, but barely tested in people.",
    evidence: "animals",
    whatItIs: "TB-500 is a short, lab-made piece of thymosin beta-4, a protein found in almost every cell. Thymosin beta-4 helps cells move and build their inner “scaffolding”.",
    howItWorks: "In lab and animal studies, thymosin beta-4 helps cells travel to wounds and supports new blood-vessel growth. Whether the small TB-500 fragment does the same in people hasn’t been shown.",
    findings: [
      "The full-length protein, thymosin beta-4, has been tested in small human trials, for example as eye drops for dry eye and as a gel for slow-healing leg ulcers, with early or mixed results.",
      "There are no good human trials of the TB-500 fragment itself.",
      "FDA advisers reviewed TB-500 for wound healing in July 2026 as a possible compounding ingredient.",
    ],
    risks: [
      "Safety in people is unknown.",
      "Products sold online are unregulated, so quality varies.",
    ],
    sources: [
      { title: "Thymosin β4: a multi-functional regenerative peptide", detail: "Goldstein et al. · Expert Opinion on Biological Therapy · 2012", url: pubmed(22074294) },
      { title: "Thymosin beta 4 ophthalmic solution for dry eye: a randomized, placebo-controlled, phase II clinical trial", detail: "Sosne et al. · Clinical Ophthalmology · 2015", url: pubmed(26056426) },
      FDA_ADVISERS_2026,
    ],
    pubchem: 62707662,
  },
  {
    slug: "kpv",
    name: "KPV",
    aka: "Lys-Pro-Val",
    category: "recovery",
    status: "early",
    statusNote: "Not approved. Studied mainly in cells and mice.",
    oneLiner: "A tiny peptide of three amino acids, studied for calming inflammation in the gut.",
    whatItIs: "KPV is made of the last three building blocks (lysine, proline and valine) of a natural hormone called alpha-MSH, which helps control inflammation.",
    howItWorks: "In lab studies, KPV gets into gut cells through a doorway called PepT1 and quiets the inflammation signals inside them.",
    findings: [
      "In a 2008 study, mice with colitis (inflamed bowels) that were given KPV by mouth had less inflammation.",
      "It hasn’t been tested in proper human trials.",
      "FDA advisers reviewed it in July 2026 as a possible compounding ingredient for wound healing and inflammation.",
    ],
    risks: ["Its effects and safety in people are unknown."],
    sources: [
      { title: "PepT1-mediated tripeptide KPV uptake reduces intestinal inflammation", detail: "Dalmasso et al. · Gastroenterology · 2008", url: pubmed(18061177) },
      FDA_ADVISERS_2026,
    ],
    pubchem: 125672,
  },
  {
    slug: "ipamorelin",
    name: "Ipamorelin",
    category: "growth",
    status: "trials",
    statusNote: "Tested in small human trials but not approved. Banned in sport by WADA, along with other growth-hormone-releasing peptides.",
    oneLiner: "A peptide that nudges the body to release its own growth hormone.",
    whatItIs: "Ipamorelin is a lab-made peptide that copies one job of ghrelin, the “hunger hormone”: telling the pituitary gland at the base of the brain to release growth hormone.",
    howItWorks: "It switches on the ghrelin receptor. In early studies it caused bursts of growth hormone without also raising stress hormones such as cortisol, which earlier drugs of this type did.",
    findings: [
      "A 1998 study described it as the first “selective” growth-hormone releaser, based on lab and animal tests.",
      "In a 2014 trial of 114 people recovering from bowel surgery, it did not clearly speed up recovery. The first meal they could keep down came at 25.3 hours on ipamorelin versus 32.6 hours on placebo, a difference that could have been down to chance.",
    ],
    risks: [
      "The long-term effects of raising growth hormone this way haven’t been studied.",
      "Products sold online are unregulated.",
    ],
    sources: [
      { title: "Ipamorelin, the first selective growth hormone secretagogue", detail: "Raun et al. · European Journal of Endocrinology · 1998", url: pubmed(9849822) },
      { title: "Prospective, randomized, controlled, proof-of-concept study of the ghrelin mimetic ipamorelin for postoperative ileus", detail: "Beck et al. · International Journal of Colorectal Disease · 2014", url: pubmed(25331030) },
    ],
    videos: ["xpdLs-_nl4g"],
    pubchem: 9831659,
  },
  {
    slug: "cjc-1295",
    name: "CJC-1295",
    category: "growth",
    status: "trials",
    statusNote: "Tested in small studies in healthy adults in 2006. Never approved.",
    oneLiner: "A long-lasting version of the brain signal that triggers growth hormone.",
    whatItIs: "CJC-1295 is a modified copy of growth-hormone-releasing hormone (GHRH), the signal your brain uses to tell the pituitary gland to release growth hormone. A chemical “hook” lets it cling to a protein in the blood, so it lasts for days.",
    howItWorks: "Because it stays in the blood for about a week, it keeps prompting the pituitary to release more growth hormone.",
    findings: [
      "In healthy adults, a single injection raised growth hormone levels 2 to 10 times for 6 days or more, and IGF-1 (a marker of growth hormone activity) for 9 to 11 days.",
      "It lasted 5.8 to 8.1 days in the body. No serious side effects were reported in these short studies.",
    ],
    risks: [
      "It has only been studied briefly, in small groups. Long-term effects are unknown.",
      "Banned in sport by WADA. Products sold online are unregulated.",
    ],
    sources: [
      { title: "Prolonged stimulation of growth hormone and IGF-I secretion by CJC-1295, a long-acting analog of GHRH, in healthy adults", detail: "Teichman et al. · Journal of Clinical Endocrinology & Metabolism · 2006", url: pubmed(16352683) },
    ],
    pubchem: 91971820,
  },
  {
    slug: "sermorelin",
    name: "Sermorelin",
    aka: "Geref",
    category: "growth",
    status: "former",
    statusNote: "Once approved in the US (as Geref) for children with growth hormone deficiency. It is no longer sold there as an approved medicine.",
    oneLiner: "A short copy of the brain’s growth-hormone signal that was once a prescription medicine for children.",
    whatItIs: "Sermorelin is the first 29 building blocks of growth-hormone-releasing hormone (GHRH), the part of the hormone that does the work.",
    howItWorks: "It tells the pituitary gland to release growth hormone in natural pulses, rather than replacing growth hormone directly.",
    findings: [
      "It was used to test for, and treat, growth hormone deficiency in some children (1999 review).",
    ],
    risks: [
      "Outside an approved product, quality and strength can vary.",
      "Common side effects in studies included reactions at the injection site.",
    ],
    sources: [
      { title: "Sermorelin: a review of its use in the diagnosis and treatment of children with idiopathic growth hormone deficiency", detail: "Prakash & Goa · BioDrugs · 1999", url: pubmed(18031173) },
    ],
    pubchem: 16132413,
  },
  {
    slug: "tesamorelin",
    name: "Tesamorelin",
    aka: "Egrifta",
    category: "growth",
    status: "approved",
    statusNote: "Egrifta is approved in the US for a narrowly defined prescription indication involving excess abdominal fat. It is not approved for general weight-loss management.",
    oneLiner: "A growth-hormone-releasing medicine studied for changes in visceral fat, the deep fat around the organs.",
    whatItIs: "Tesamorelin is a stabilized copy of growth-hormone-releasing hormone (GHRH).",
    howItWorks: "It raises the body’s own growth hormone, which helps break down visceral fat, the deep fat packed around the organs.",
    findings: [
      "In a 26-week trial of 412 adults with lipodystrophy and excess abdominal fat, visceral fat fell by 15.2% on tesamorelin and rose by 5.0% on placebo.",
      "Triglycerides, a type of fat in the blood, also improved.",
      "These results apply to the specific patient group studied and do not establish effectiveness for weight loss in the general population.",
    ],
    keyResult: { value: "−15.2%", label: "deep belly fat in 26 weeks", detail: "26-week lipodystrophy trial · 412 adults · placebo: +5.0%" },
    risks: [
      "More people on tesamorelin stopped because of side effects than on placebo.",
      "Growth hormone can affect blood sugar, so this is monitored.",
    ],
    sources: [
      { title: "Tesamorelin: 26-week randomized clinical trial", detail: "Falutz et al. · New England Journal of Medicine · 2007", url: pubmed(18057338) },
      { title: "Egrifta SV prescribing information", detail: "FDA-approved labeling · DailyMed", url: "https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=3d783378-b02d-4f19-99dd-0fc91a042224" },
    ],
    pubchem: 16137828,
  },
  {
    slug: "selank",
    name: "Selank",
    category: "calm",
    status: "approved-elsewhere",
    statusNote: "Registered as a medicine in Russia, where it is used for anxiety. Not approved in the US, UK or EU.",
    oneLiner: "A nasal-spray peptide developed in Russia and studied for anxiety.",
    whatItIs: "Selank is a lab-made version of tuftsin, a tiny natural peptide involved in the immune system, with three extra building blocks added so it lasts longer.",
    howItWorks: "Researchers think it affects brain chemicals involved in anxiety, such as GABA and serotonin, but this isn’t fully understood.",
    findings: [
      "Most studies come from Russia and are small.",
      "Small Russian clinical studies in people with anxiety report benefits, but there are no large international trials.",
    ],
    evidence: "small-human",
    results: [
      { title: "Anxiety treatment in people", who: "people", study: "Russian study, 2015 · 70 adults with anxiety disorders: 40 took Selank with phenazepam (a prescription anti-anxiety medicine), 30 took phenazepam alone", finding: "With Selank added, phenazepam worked sooner and caused fewer side effects, such as poor memory, drowsiness and tiredness, the authors report.", source: 1 },
      { title: "Anxiety in rats under long-term stress", who: "animals", study: "Rats under long-term, unpredictable mild stress, 2017", finding: "Selank given with diazepam (Valium) brought the rats’ anxiety measures back to where they were before the stress.", source: 0 },
    ],
    unknowns: [
      "Whether it helps anxiety in large, well-controlled trials. The human studies so far are small and from Russia.",
      "How it works in the brain.",
      "Its long-term safety.",
    ],
    risks: ["It has not been well studied outside Russia, so side effects and long-term safety are unclear."],
    sources: [
      { title: "Peptide Selank Enhances the Effect of Diazepam in Reducing Anxiety in Unpredictable Chronic Mild Stress Conditions in Rats", detail: "Kasian et al. · Behavioural Neurology · 2017", url: pubmed(28280289) },
      { title: "Optimization of the treatment of anxiety disorders with Selank (in Russian)", detail: "Medvedev et al. · Zhurnal Nevrologii i Psikhiatrii · 2015", url: pubmed(26356395) },
    ],
    pubchem: 11765600,
  },
  {
    slug: "semax",
    name: "Semax",
    category: "focus",
    status: "approved-elsewhere",
    statusNote: "Registered as a medicine in Russia, where it is used after strokes and for some other brain conditions. Not approved in the US, UK or EU.",
    oneLiner: "A Russian nasal-spray peptide used after strokes and studied as a “brain booster”.",
    whatItIs: "Semax is a lab-made fragment of ACTH, a hormone from the pituitary gland, with a short tail added so it lasts longer. It doesn’t have ACTH’s hormone effects.",
    howItWorks: "It is thought to raise levels of BDNF, a protein that helps brain cells survive and form new connections.",
    findings: [
      "Russian studies in stroke patients report better recovery when Semax is added to standard care, for example a 2018 study.",
      "FDA advisers reviewed it in July 2026 as a possible compounding ingredient for stroke-related conditions and migraine.",
    ],
    risks: ["Most evidence comes from small studies in one country. Long-term safety and benefit are not established."],
    sources: [
      { title: "The efficacy of Semax in the treatment of patients at different stages of ischemic stroke (in Russian)", detail: "Gusev et al. · Zhurnal Nevrologii i Psikhiatrii · 2018", url: pubmed(29798983) },
      FDA_ADVISERS_2026,
    ],
    pubchem: 9811102,
  },
  {
    slug: "ghk-cu",
    name: "GHK-Cu",
    aka: "Copper peptide",
    category: "skin",
    status: "early",
    statusNote: "Used in many skin creams and serums as a cosmetic ingredient. Not approved as a medicine; injected use is unregulated.",
    oneLiner: "A copper-carrying peptide found in skin care for its anti-aging effects.",
    whatItIs: "GHK is a tiny peptide made of three amino acids (glycine, histidine and lysine) that occurs naturally in blood and saliva. It grabs copper, and this copper-bound form is called GHK-Cu. Levels in the body fall as we age.",
    howItWorks: "In lab studies it encourages skin cells to make collagen and other “scaffolding” proteins, and it affects many genes involved in repair.",
    findings: [
      "Lab studies and small cosmetic trials suggest creams with GHK-Cu can improve skin firmness and fine lines.",
      "Much of the evidence comes from lab work and small studies, so the size of the benefit is uncertain.",
    ],
    risks: [
      "Skin products are generally well tolerated, though some people get irritation.",
      "Injected GHK-Cu hasn’t been properly studied in people.",
    ],
    sources: [
      { title: "Regenerative and Protective Actions of the GHK-Cu Peptide in the Light of the New Gene Data", detail: "Pickart & Margolina · International Journal of Molecular Sciences · 2018", url: pubmed(29986520) },
      { title: "Topically applied GHK as an anti-wrinkle peptide: advantages, problems and prospective", detail: "Mortazavi et al. · BioImpacts · 2025", url: pubmed(39963574) },
    ],
    videos: ["TH_ZDyMzhqM"],
    pubchem: 71587328,
  },
  {
    slug: "melanotan",
    name: "Melanotan I & II",
    aka: "Afamelanotide (Melanotan I)",
    category: "pigmentation",
    status: "early",
    statusNote: "Melanotan I (afamelanotide) is approved as Scenesse for a rare light-sensitivity disease. Melanotan II is not approved anywhere, and health agencies warn against tanning injections.",
    oneLiner: "The “tanning peptides”. One is an approved medicine for a rare disease; the other is an unapproved tanning injection that doctors warn about.",
    whatItIs: "Both are lab-made versions of alpha-MSH, the hormone that tells skin to make melanin, the pigment that darkens skin.",
    howItWorks: "They switch on receptors in the skin’s pigment cells, darkening skin without sunlight. Melanotan II also acts on receptors in the brain, which is why it can affect appetite and sexual arousal.",
    findings: [
      "Afamelanotide (Melanotan I) helps people with erythropoietic protoporphyria, a rare condition that makes sunlight painful. In a US trial they spent a median of 69 hours pain-free in daylight over 6 months, compared with 41 hours on placebo.",
      "Melanotan II was only tested in tiny early studies in the 1990s, for example a safety study in three men.",
    ],
    keyResult: { value: "69 h", label: "pain-free time in daylight over 6 months (Melanotan I)", detail: "US trial in a rare light-sensitivity disease · placebo: 41 h" },
    risks: [
      "In the first small human study of Melanotan II, men reported nausea, tiredness, and spontaneous erections lasting up to five hours.",
      "Doctors have reported serious problems in people using it, including melanoma (skin cancer) and kidney damage.",
      "Tanning injections bought online are unregulated.",
    ],
    sources: [
      { title: "Afamelanotide for Erythropoietic Protoporphyria", detail: "Langendonk et al. · New England Journal of Medicine · 2015", url: pubmed(26132941) },
      { title: "Evaluation of melanotan-II in a pilot phase-I clinical study", detail: "Dorr et al. · Life Sciences · 1996", url: pubmed(8637402) },
      { title: "Melanoma associated with the use of melanotan-II", detail: "Hjuler & Lorentzen · Dermatology · 2014", url: pubmed(24355990) },
      { title: "Melanotan II: a possible cause of renal infarction", detail: "Peters et al. · CEN Case Reports · 2020", url: pubmed(31953620) },
    ],
    videos: ["DWL46HWhmgQ"],
    pubchem: 92432,
  },
  {
    slug: "epitalon",
    name: "Epitalon",
    aka: "Epithalon",
    category: "longevity",
    status: "early",
    statusNote: "Not approved. Most research is lab and animal work.",
    oneLiner: "A four-amino-acid peptide studied for aging and telomeres, mostly in cells and animals.",
    whatItIs: "Epitalon is a lab-made peptide of four building blocks (alanine, glutamic acid, aspartic acid and glycine), based on an extract from the pineal gland. It was developed by Russian researchers.",
    howItWorks: "Lab studies suggest it may switch on telomerase, an enzyme that rebuilds telomeres. Telomeres are the protective caps on the ends of our chromosomes, and they get shorter as we age.",
    findings: [
      "A 2025 study found it lengthened telomeres in human cells grown in the lab.",
      "Much of the earlier research comes from one Russian group, and good human trials are lacking.",
      "FDA advisers reviewed it for insomnia in July 2026 as a possible compounding ingredient.",
    ],
    risks: ["Its effects and safety in people are unknown."],
    sources: [
      { title: "Overview of Epitalon, a highly bioactive pineal tetrapeptide", detail: "Araj et al. · International Journal of Molecular Sciences · 2025", url: pubmed(40141333) },
      { title: "Epitalon increases telomere length in human cell lines through telomerase upregulation or ALT activity", detail: "Al-Dulaimi et al. · Biogerontology · 2025", url: pubmed(40908429) },
      FDA_ADVISERS_2026,
    ],
    pubchem: 219042,
  },
  {
    slug: "mots-c",
    name: "MOTS-c",
    category: "energy",
    status: "early",
    statusNote: "Not approved. Studied mainly in mice.",
    oneLiner: "A peptide made inside mitochondria, the cell’s power plants, and studied for metabolism.",
    whatItIs: "MOTS-c is a 16-amino-acid peptide made from the DNA inside mitochondria, the tiny power plants in our cells. It was discovered in 2015.",
    howItWorks: "In mice it helps muscles use sugar for energy, and it seems to act as a signal of exercise and energy balance.",
    findings: [
      "In the 2015 discovery study, MOTS-c protected mice on a high-fat diet from weight gain and insulin resistance.",
      "Human trials are lacking. FDA advisers reviewed it in July 2026 (for obesity and osteoporosis) as a possible compounding ingredient.",
    ],
    risks: ["Its effects and safety in people are unknown."],
    sources: [
      { title: "The mitochondrial-derived peptide MOTS-c promotes metabolic homeostasis and reduces obesity and insulin resistance", detail: "Lee et al. · Cell Metabolism · 2015", url: pubmed(25738459) },
      FDA_ADVISERS_2026,
    ],
    pubchem: 146675088,
  },
  {
    slug: "nad",
    name: "NAD+",
    aka: "Nicotinamide adenine dinucleotide",
    category: "energy",
    status: "early",
    statusNote: "NAD+ itself is not an approved medicine. Related vitamin B3 compounds, such as nicotinamide riboside, are sold as supplements.",
    oneLiner: "Not a peptide, but often mentioned alongside them: a molecule every cell needs to make energy.",
    whatItIs: "NAD+ is a coenzyme, a helper molecule found in every living cell. Your body makes it from vitamin B3.",
    howItWorks: "Cells use NAD+ to turn food into energy and to run repair enzymes. Levels tend to fall with age, which is why researchers are interested in raising them.",
    findings: [
      "A 2024 review explains how NAD+ levels fall with age and in some diseases, and the ways researchers are trying to raise them.",
      "Studies of NAD+ boosters in people are mostly small, with mixed results.",
    ],
    risks: ["NAD+ injections and drips are not approved, and their benefits and safety are not well studied."],
    sources: [
      { title: "Roles of NAD+ in Health and Aging", detail: "Lautrup et al. · Cold Spring Harbor Perspectives in Medicine · 2024", url: pubmed(37848251) },
    ],
    videos: ["l8BI_720Dfs"],
    pubchem: 5892,
    notAPeptide: true,
  },
  {
    slug: "pt-141",
    name: "PT-141",
    aka: "Bremelanotide, Vyleesi",
    category: "intimacy",
    status: "approved",
    statusNote: "Approved in the US (Vyleesi, 2019) for low sexual desire in premenopausal women.",
    oneLiner: "An approved medicine that works in the brain to increase sexual desire.",
    whatItIs: "Bremelanotide (PT-141) is a peptide closely related to Melanotan II. It was developed after researchers noticed effects on arousal in tanning studies.",
    howItWorks: "It switches on melanocortin receptors in the brain that are involved in desire. It doesn’t work on blood flow the way Viagra does.",
    findings: [
      "In two trials of 1,267 women, bremelanotide modestly increased desire scores and reduced distress about low desire, compared with placebo.",
    ],
    risks: [
      "Nausea, flushing and headache were common (10% or more of women in both trials).",
      "It can cause a temporary rise in blood pressure after each dose.",
    ],
    sources: [
      { title: "Bremelanotide for the Treatment of Hypoactive Sexual Desire Disorder: Two Randomized Phase 3 Trials", detail: "Kingsberg et al. · Obstetrics & Gynecology · 2019", url: pubmed(31599840) },
    ],
    pubchem: 9941379,
  },
  {
    slug: "thymosin-alpha-1",
    name: "Thymosin alpha-1",
    aka: "Thymalfasin, Zadaxin",
    category: "immune",
    status: "approved-elsewhere",
    statusNote: "Approved as a medicine (Zadaxin) in a number of countries, mainly for hepatitis B. Not approved in the US or EU.",
    oneLiner: "A natural immune-signaling peptide from the thymus gland, used as a medicine in some countries.",
    whatItIs: "Thymosin alpha-1 is a 28-amino-acid peptide first found in the thymus, the gland behind the breastbone where some immune cells mature.",
    howItWorks: "It helps switch on T cells and other parts of the immune response.",
    findings: [
      "Reviews describe its use for hepatitis B and C, as an add-on to vaccines and cancer treatment, and in severe infections. The quality of the evidence varies.",
    ],
    risks: [
      "Reviews of the human trials describe it as generally well tolerated.",
      "Outside an approved product, quality and strength can vary.",
    ],
    sources: [
      { title: "Thymosin alpha 1: a comprehensive review of the literature", detail: "Dominari et al. · World Journal of Virology · 2020", url: pubmed(33362999) },
      { title: "Comprehensive Review of the Safety and Efficacy of Thymosin Alpha 1 in Human Clinical Trials", detail: "Dinetz et al. · Alternative Therapies in Health and Medicine · 2024", url: pubmed(38308608) },
    ],
    pubchem: 16130571,
  },
  {
    slug: "insulin",
    name: "Insulin",
    category: "medicines",
    status: "approved",
    statusNote: "An approved, essential medicine used by millions of people with diabetes.",
    oneLiner: "The most famous peptide medicine of all. It turned type 1 diabetes from a fatal disease into a manageable one.",
    whatItIs: "Insulin is a hormone made by the pancreas. It is a small protein made of two chains, 51 amino acids in total.",
    howItWorks: "After you eat, insulin lets your cells take sugar out of the blood to use for energy. People with type 1 diabetes can’t make it, so they inject it.",
    findings: [
      "It was first given to a patient in 1922 in Toronto: a 14-year-old boy named Leonard Thompson.",
      "In 1982 human insulin made by bacteria became the first medicine produced through genetic engineering.",
    ],
    risks: ["Too much insulin causes low blood sugar (hypoglycemia), which can be dangerous."],
    sources: [
      { title: "Insulin’s centenary: the birth of an idea", detail: "Hegele & Maltman · Lancet Diabetes & Endocrinology · 2020", url: pubmed(33129375) },
      { title: "100 years of insulin: celebrating the past, present and future of diabetes therapy", detail: "Sims et al. · Nature Medicine · 2021", url: pubmed(34267380) },
    ],
    videos: ["Gk1D4VgM8jY"],
    pubchem: 118984375,
  },
  {
    slug: "oxytocin",
    name: "Oxytocin",
    aka: "Pitocin, Syntocinon",
    category: "medicines",
    status: "approved",
    statusNote: "Approved worldwide to start or strengthen labor and to reduce bleeding after birth.",
    oneLiner: "The “bonding hormone”, and one of the most used medicines in childbirth.",
    whatItIs: "Oxytocin is a hormone of nine amino acids, made in the brain and released by the pituitary gland.",
    howItWorks: "It makes the womb contract during labor and helps milk flow during breastfeeding. It also plays a part in social bonding.",
    findings: [
      "Given through a drip, synthetic oxytocin is a standard way to start or speed up labor and to prevent heavy bleeding after delivery (2024 review).",
    ],
    risks: ["Too much can make contractions too strong, which can harm mother or baby, so it is only given under close medical supervision."],
    sources: [
      { title: "Oxytocin: physiology, pharmacology, and clinical application for labor management", detail: "Hermesch et al. · American Journal of Obstetrics & Gynecology · 2024", url: pubmed(37460365) },
    ],
    pubchem: 439302,
  },
  {
    slug: "octreotide",
    name: "Octreotide",
    aka: "Sandostatin, Mycapssa",
    category: "medicines",
    status: "approved",
    statusNote: "Approved for acromegaly (a growth hormone disorder) and for symptoms of some hormone-producing tumors. A capsule form, Mycapssa, is approved in the US for acromegaly.",
    oneLiner: "A long-lasting copy of a natural “brake” hormone, used to control some hormone disorders and tumors.",
    whatItIs: "Octreotide is an eight-amino-acid version of somatostatin, a hormone that switches off the release of many other hormones.",
    howItWorks: "It blocks excess growth hormone in acromegaly and calms the floods of hormones from some gut tumors, easing symptoms such as severe diarrhea and flushing.",
    findings: [
      "Natural somatostatin lasts only minutes in the blood. Octreotide lasts hours, and long-acting injections last a month.",
      "A capsule form now allows some people with acromegaly to take it by mouth (2022 review).",
    ],
    risks: ["Stomach upset and gallstones are among the common side effects."],
    sources: [
      { title: "Pharmacology of Octreotide: Clinical Implications for Anesthesiologists and Associated Risks", detail: "Borna et al. · Anesthesiology Clinics · 2017", url: pubmed(28526153) },
      { title: "Oral Octreotide: A Review of Recent Clinical Trials and Practical Recommendations", detail: "Yuen et al. · Endocrine Practice · 2022", url: pubmed(35452815) },
    ],
    pubchem: 448601,
  },
  {
    slug: "teriparatide",
    name: "Teriparatide",
    aka: "Forteo, Forsteo",
    category: "medicines",
    status: "approved",
    statusNote: "Approved for osteoporosis in people at high risk of fractures.",
    oneLiner: "A bone-building peptide that cuts the risk of spine fractures in osteoporosis.",
    whatItIs: "Teriparatide is the active first part (34 amino acids) of parathyroid hormone, which controls calcium and how bone is renewed.",
    howItWorks: "Given as a small daily injection, it switches on bone-building cells more than bone-removing cells, so bones become denser and stronger.",
    findings: [
      "In a trial of 1,637 women with osteoporosis who had already had a spine fracture, new spine fractures fell from 14% on placebo to 5% on the 20 µg dose: about 65% fewer.",
      "Bone density in the spine rose by 9 percentage points more than on placebo.",
    ],
    keyResult: { value: "65%", label: "fewer new spine fractures", detail: "Trial of 1,637 women · 5% vs 14% on placebo" },
    risks: [
      "Dizziness, leg cramps and nausea are reported, and it can raise calcium levels.",
      "High doses caused bone tumors in rats; this has not been clearly seen in people.",
    ],
    sources: [
      { title: "Effect of parathyroid hormone (1-34) on fractures and bone mineral density in postmenopausal women with osteoporosis", detail: "Neer et al. · New England Journal of Medicine · 2001", url: pubmed(11346808) },
    ],
    pubchem: 16133850,
  },
  {
    slug: "cagrilintide",
    name: "Cagrilintide",
    aka: "Half of CagriSema",
    category: "weight",
    status: "trials",
    statusNote: "Not approved yet. Combined with semaglutide as CagriSema, it has been submitted to the FDA, with a decision expected in late 2026.",
    oneLiner: "A copy of amylin, a fullness hormone, being developed alongside semaglutide.",
    whatItIs: "Cagrilintide is a long-acting copy of amylin, a hormone your pancreas releases together with insulin after you eat.",
    howItWorks: "Amylin tells the brain you’ve had enough to eat and slows down how fast the stomach empties. It works through different receptors from GLP-1, which is why it is being combined with semaglutide.",
    findings: [
      "In a phase 2 trial, 706 adults took different doses of cagrilintide alone. They lost 6.0% to 10.8% of their body weight on average, depending on the dose, compared with 3.0% on placebo.",
      "In the REDEFINE 1 trial of 3,417 adults, cagrilintide combined with semaglutide (CagriSema) led to 20.4% average weight loss over 68 weeks, compared with 3.0% on placebo.",
      "In a head-to-head trial reported in February 2026, CagriSema led to about 23% weight loss, compared with about 25% on tirzepatide (Zepbound).",
    ],
    keyResult: { value: "20.4%", label: "average weight lost in 68 weeks, combined with semaglutide", detail: "REDEFINE 1 trial, 3,417 adults · placebo: 3.0%" },
    risks: [
      "Like GLP-1 medicines, it mainly causes stomach side effects such as nausea, constipation and diarrhea.",
      "It is not approved, and long-term safety is still being studied.",
    ],
    sources: [
      { title: "Once-weekly cagrilintide for weight management in people with overweight and obesity: a phase 2 trial", detail: "Lau et al. · The Lancet · 2021", url: pubmed(34798060) },
      { title: "Coadministered Cagrilintide and Semaglutide in Adults with Overweight or Obesity (REDEFINE 1)", detail: "Garvey et al. · New England Journal of Medicine · 2025", url: pubmed(40544433) },
      { title: "REDEFINE 4: CagriSema and tirzepatide head-to-head results", detail: "Novo Nordisk · original sponsor announcement · February 23, 2026", url: "https://www.novonordisk.com/content/nncorp/global/en/news-and-media/news-and-ir-materials/news-details.html?id=916501" },
    ],
    pubchem: 171397054,
  },
  {
    slug: "aod-9604",
    name: "AOD-9604",
    aka: "HGH fragment 176-191",
    category: "weight",
    status: "trials",
    statusNote: "Tested in people in the 2000s but never approved as a medicine.",
    oneLiner: "A small piece of growth hormone that was developed as a fat-loss drug, but never made it to approval.",
    whatItIs: "AOD-9604 is a modified copy of the last part of human growth hormone (the stretch around building blocks 177 to 191). HGH fragment 176-191 is a closely related version.",
    howItWorks: "Researchers hoped this piece would keep growth hormone’s fat-burning effect without its effects on growth and blood sugar.",
    findings: [
      "It was developed in Australia as an obesity treatment, and early trials did not show clear enough weight loss for it to be approved.",
      "A 2026 review of popular “gray market” peptides lists it among unapproved peptides sold directly to the public, outside of regulatory oversight.",
    ],
    risks: [
      "Products sold online are unregulated, so content and purity vary.",
      "Its long-term safety hasn’t been established.",
    ],
    sources: [
      { title: "AOD-9604 (Metabolic)", detail: "Wilding · Current Opinion in Investigational Drugs · 2004", url: pubmed(15134286) },
      { title: "Safety and Efficacy of Approved and Unapproved Peptide Therapies for Musculoskeletal Injuries and Athletic Performance", detail: "Mendias et al. · Sports Medicine · 2026", url: pubmed(41966639) },
    ],
    pubchem: 71300630,
  },
  {
    slug: "argireline",
    name: "Argireline & Snap-8",
    aka: "Acetyl hexapeptide-8 and acetyl octapeptide-3",
    category: "skin",
    status: "early",
    statusNote: "Cosmetic ingredients used in anti-wrinkle creams and serums. Not medicines.",
    oneLiner: "The “Botox in a jar” peptides: skin-care ingredients designed to soften expression lines.",
    whatItIs: "Argireline is a lab-made peptide of six building blocks, designed to copy a small part of the machinery that Botox blocks. Snap-8 is a slightly longer version made for the same purpose.",
    howItWorks: "Muscles contract when nerves release a chemical messenger. Argireline is designed to interfere gently with that release, so the small facial muscles behind expression lines relax a little. It is far weaker than Botox and isn’t injected.",
    findings: [
      "In a 2002 study, healthy women who applied a cream with 10% Argireline saw wrinkle depth fall by up to 30% after 30 days.",
      "Snap-8 has very little published research of its own.",
    ],
    keyResult: { value: "Up to 30%", label: "less wrinkle depth after 30 days (Argireline cream)", detail: "Small 2002 study in healthy women" },
    risks: ["Creams are generally well tolerated; some people get skin irritation."],
    sources: [
      { title: "A synthetic hexapeptide (Argireline) with antiwrinkle activity", detail: "Blanes-Mira et al. · International Journal of Cosmetic Science · 2002", url: pubmed(18498523) },
    ],
    pubchem: 71587772,
  },
  {
    slug: "ahk-cu",
    name: "AHK-Cu",
    aka: "Copper tripeptide-1",
    category: "hair",
    status: "early",
    statusNote: "Used in some hair and skin products as a cosmetic ingredient. Not a medicine.",
    oneLiner: "A copper-carrying peptide, cousin of GHK-Cu, studied for hair growth.",
    whatItIs: "AHK-Cu is a tiny peptide of three building blocks (alanine, histidine and lysine) holding a copper atom. It is closely related to GHK-Cu.",
    howItWorks: "In lab studies, it encouraged hair follicles to lengthen and the cells at their base, which drive hair growth, to multiply.",
    findings: [
      "In a 2007 lab study, AHK-Cu made human hair follicles grown in a dish lengthen faster.",
      "There are no good clinical trials of AHK-Cu on people’s hair.",
    ],
    risks: ["Its effects in people are not well studied."],
    sources: [
      { title: "The effect of tripeptide-copper complex on human hair growth in vitro", detail: "Pyo et al. · Archives of Pharmacal Research · 2007", url: pubmed(17703734) },
    ],
  },
  {
    slug: "ara-290",
    name: "ARA-290",
    aka: "Cibinetide",
    category: "recovery",
    status: "trials",
    statusNote: "Tested in small human trials for nerve pain. Not approved.",
    oneLiner: "A small peptide made from a part of EPO that protects tissues, studied for nerve damage.",
    whatItIs: "ARA-290 is an 11-amino-acid peptide based on a part of erythropoietin (EPO), the hormone that tells the body to make red blood cells. This part protects tissue but doesn’t raise red blood cells.",
    howItWorks: "It switches on a “repair receptor” that calms inflammation and protects nerve fibers in lab and animal studies.",
    findings: [
      "In a 28-day trial in people with sarcoidosis, an inflammatory disease that can damage small nerves, the 4 mg dose increased the amount of small nerve fibers seen in the eye’s cornea, compared with placebo.",
      "Pain improved in all dose groups.",
    ],
    risks: ["Only small, short trials have been done, so longer-term safety and benefit are unknown."],
    sources: [
      { title: "Cibinetide Improves Corneal Nerve Fiber Abundance in Patients With Sarcoidosis-Associated Small Nerve Fiber Loss and Neuropathic Pain", detail: "Culver et al. · Investigative Ophthalmology & Visual Science · 2017", url: pubmed(28475703) },
      { title: "ARA 290 for treatment of small fiber neuropathy in sarcoidosis", detail: "van Velzen et al. · Expert Opinion on Investigational Drugs · 2014", url: pubmed(24555851) },
    ],
    pubchem: 91810664,
  },
  {
    slug: "ss-31",
    name: "SS-31",
    aka: "Elamipretide, Forzinity",
    category: "energy",
    status: "approved",
    statusNote: "Approved in the US in September 2025 (as Forzinity) for Barth syndrome, a rare inherited disease. It is an accelerated approval, which means a further trial must confirm the benefit.",
    oneLiner: "The first approved medicine that targets the mitochondria, the cell’s power plants.",
    whatItIs: "SS-31 is a small four-building-block peptide that travels into mitochondria, the parts of our cells that make energy.",
    howItWorks: "It binds to the inner membrane of mitochondria and helps them keep their structure and work properly.",
    findings: [
      "The FDA approved it for Barth syndrome, a rare disease that weakens the heart and muscles, based on improved leg (knee) strength in a placebo-controlled trial.",
      "In a long-term follow-up of 10 people with Barth syndrome, the distance they could walk in 6 minutes improved by 96 meters after 168 weeks.",
    ],
    keyResult: { value: "+96 m", label: "longer 6-minute walk after 168 weeks", detail: "Long-term follow-up of 10 people with Barth syndrome" },
    risks: [
      "Reactions where it is injected were the most common side effect.",
      "It is approved only for Barth syndrome; use for anything else hasn’t been proven.",
    ],
    sources: [
      { title: "FDA grants accelerated approval for first treatment for Barth syndrome", detail: "US Food and Drug Administration · September 2025", url: "https://www.fda.gov/news-events/press-announcements/fda-grants-accelerated-approval-first-treatment-barth-syndrome" },
      { title: "Long-term efficacy and safety of elamipretide in patients with Barth syndrome: 168-week open-label extension results", detail: "Thompson et al. · Genetics in Medicine · 2024", url: pubmed(38602181) },
    ],
    pubchem: 11764719,
  },
  {
    slug: "slu-pp-332",
    name: "SLU-PP-332",
    aka: "Often called an “exercise pill”",
    category: "energy",
    status: "early",
    statusNote: "Not approved. Studied only in mice.",
    oneLiner: "Not a peptide: a lab compound that makes mice’s muscles behave as if they had exercised.",
    whatItIs: "SLU-PP-332 is a small chemical, not a peptide. It switches on ERR receptors, which help control how muscles burn energy.",
    howItWorks: "In mice it turns on part of the body’s natural response to aerobic exercise, without the exercise.",
    findings: [
      "In obese mice, it mimicked effects of exercise and reduced fat mass (2024 study).",
      "It has not been tested in people.",
    ],
    risks: ["Its effects and safety in people are completely unknown."],
    sources: [
      { title: "A Synthetic ERR Agonist Alleviates Metabolic Syndrome", detail: "Billon et al. · Journal of Pharmacology and Experimental Therapeutics · 2024", url: pubmed(37739806) },
    ],
    pubchem: 5338394,
    notAPeptide: true,
  },
  {
    slug: "5-amino-1mq",
    name: "5-Amino-1MQ",
    category: "energy",
    status: "early",
    statusNote: "Not approved. Studied in cells and mice.",
    oneLiner: "Not a peptide: a small compound that blocks an enzyme linked to fat storage, studied in mice.",
    whatItIs: "5-Amino-1MQ is a small chemical, not a peptide. It blocks NNMT, an enzyme that is especially active in fat tissue.",
    howItWorks: "Blocking NNMT changes how fat cells use energy. In lab studies it reduced the making of new fat in fat cells.",
    findings: [
      "In mice made obese by a high-fat diet, it reduced body weight and fat (2018 study).",
      "It has not been tested in people.",
    ],
    risks: ["Its effects and safety in people are unknown."],
    sources: [
      { title: "Selective and membrane-permeable small molecule inhibitors of nicotinamide N-methyltransferase reverse high fat diet-induced obesity in mice", detail: "Neelakantan et al. · Biochemical Pharmacology · 2018", url: pubmed(29155147) },
      { title: "Nicotinamide N-methyltransferase inhibition mitigates obesity-related metabolic dysfunction", detail: "Babula et al. · Diabetes, Obesity and Metabolism · 2024", url: pubmed(39161060) },
    ],
    pubchem: 950107,
    notAPeptide: true,
  },
  {
    slug: "hgh",
    name: "Growth hormone (HGH)",
    aka: "Somatropin",
    category: "growth",
    status: "approved",
    statusNote: "An approved prescription medicine for children with certain growth problems and adults with proven growth hormone deficiency.",
    oneLiner: "The body’s own growth hormone, made in the lab: a proven medicine for real deficiency, and widely misused.",
    whatItIs: "Growth hormone is a small protein (191 amino acids) made by the pituitary gland at the base of the brain. The medicine, somatropin, is made by bacteria and is identical to the human hormone.",
    howItWorks: "It helps children grow and, in adults, affects muscle, bone and fat. Much of its effect works through another hormone, IGF-1, made in the liver.",
    findings: [
      "Expert guidelines support treatment for adults with confirmed growth hormone deficiency, after proper testing, with doses adjusted to blood levels of IGF-1.",
    ],
    risks: [
      "Side effects include fluid retention and swelling, joint pain, carpal tunnel symptoms and higher blood sugar.",
      "It is banned in sport, and using it without a proven deficiency is not supported by evidence.",
    ],
    sources: [
      { title: "Evaluation and treatment of adult growth hormone deficiency: an Endocrine Society clinical practice guideline", detail: "Molitch et al. · Journal of Clinical Endocrinology & Metabolism · 2011", url: pubmed(21602453) },
    ],
  },
  {
    slug: "igf-1-lr3",
    name: "IGF-1 LR3",
    aka: "Long R3 IGF-1",
    category: "growth",
    status: "early",
    statusNote: "Not approved. A lab version of IGF-1 used mainly in cell culture. A different form of IGF-1, mecasermin, is approved for a rare growth disorder.",
    oneLiner: "A long-lasting lab version of IGF-1, the hormone growth hormone works through.",
    whatItIs: "IGF-1 is the hormone that carries out much of growth hormone’s work. IGF-1 LR3 is a modified version with extra building blocks that make it last much longer. It was developed for growing cells in laboratories.",
    howItWorks: "It acts on the same receptor as natural IGF-1, but blood proteins that normally hold IGF-1 in check barely bind it, so it stays active longer.",
    findings: [
      "In a 2025 study in growth-restricted unborn lambs, IGF-1 LR3 did not improve growth.",
      "The approved medicine mecasermin (natural IGF-1) is used for children with severe primary IGF-1 deficiency.",
    ],
    risks: [
      "IGF-1 can cause low blood sugar.",
      "IGF-1 LR3 has not been tested for safety in people, and it is banned in sport.",
    ],
    sources: [
      { title: "IGF-1 LR3 does not promote growth in late-gestation growth-restricted fetal sheep", detail: "White et al. · American Journal of Physiology: Endocrinology and Metabolism · 2025", url: pubmed(39679943) },
      { title: "Profile of mecasermin for the long-term treatment of growth failure in children and adolescents with severe primary IGF-1 deficiency", detail: "Fintini et al. · Therapeutics and Clinical Risk Management · 2009", url: pubmed(19707272) },
    ],
  },
  {
    slug: "dsip",
    name: "DSIP",
    aka: "Delta sleep-inducing peptide, emideltide",
    category: "sleep",
    status: "early",
    statusNote: "Not approved. FDA advisers reviewed it in July 2026 as a possible compounding ingredient for opioid withdrawal, insomnia and narcolepsy.",
    oneLiner: "A small brain peptide named for deep sleep, whose effect still isn’t clear after 50 years.",
    whatItIs: "DSIP is a peptide of nine building blocks. It was found in 1977 in the blood of rabbits in deep sleep, which is how it got its name.",
    howItWorks: "No one has pinned down how it works. Despite the name, scientists haven’t found a dedicated receptor or a reliable sleep effect.",
    findings: [
      "Reviews describe decades of mixed results: some small studies reported better sleep, others found no effect.",
      "A 2006 review called it “a still unresolved riddle”.",
    ],
    risks: ["Its effects and safety are not well established."],
    sources: [
      { title: "Delta sleep-inducing peptide (DSIP): a still unresolved riddle", detail: "Kovalzon & Strekalova · Journal of Neurochemistry · 2006", url: pubmed(16539679) },
      { title: "Delta-sleep-inducing peptide (DSIP): a review", detail: "Graf & Kastin · Neuroscience & Biobehavioral Reviews · 1984", url: pubmed(6145137) },
      FDA_ADVISERS_2026,
    ],
    pubchem: 68816,
  },
  {
    slug: "vip",
    name: "VIP",
    aka: "Vasoactive intestinal peptide, aviptadil",
    category: "immune",
    status: "trials",
    statusNote: "Tested in human trials (as aviptadil), but not approved in the US.",
    oneLiner: "A natural messenger peptide that relaxes blood vessels and calms inflammation, studied in lung disease.",
    whatItIs: "VIP is a peptide of 28 building blocks found in the gut, lungs, brain and nerves. Aviptadil is the lab-made version.",
    howItWorks: "It relaxes smooth muscle, widens blood vessels and dampens inflammation, especially in the lungs.",
    findings: [
      "Aviptadil was tested in people with severe breathing failure, including from COVID-19. A 2025 review asks whether it is “promise or mirage”: results so far are mixed.",
      "Injected together with another medicine, phentolamine, it has been used for erectile problems that didn’t respond to other treatments.",
    ],
    risks: ["Flushing and low blood pressure can occur, because it widens blood vessels."],
    sources: [
      { title: "Aviptadil in Acute Respiratory Distress Syndrome: Promise or Mirage?", detail: "Chanchalani et al. · Indian Journal of Critical Care Medicine · 2025", url: pubmed(41368453) },
      { title: "Intracavernosal injection of aviptadil and phentolamine for refractory erectile dysfunction", detail: "Al-Mitwalli et al. · Journal of Sexual Medicine · 2025", url: pubmed(40192471) },
    ],
  },
  {
    slug: "kisspeptin",
    name: "Kisspeptin",
    category: "fertility",
    status: "trials",
    statusNote: "Tested in human fertility studies. Not approved.",
    oneLiner: "The hormone that switches on the reproductive system, being tested as a gentler way to trigger egg maturation in IVF.",
    whatItIs: "Kisspeptin is a natural hormone made in the brain. It was named after the Hershey’s Kisses chocolates made in the town where it was discovered. Kisspeptin-54 and kisspeptin-10 are two of its forms.",
    howItWorks: "It tells the brain to release the hormones that control the ovaries and testes, which is how puberty starts.",
    findings: [
      "In a 2014 study, a single injection of kisspeptin-54 triggered egg maturation in 53 women having IVF. Embryos were transferred for 92% of them, and 23% (12 of 53) had a clinical pregnancy.",
    ],
    keyResult: { value: "92%", label: "of women had embryos transferred after one kisspeptin injection", detail: "2014 IVF study of 53 women · 12 clinical pregnancies" },
    risks: ["Its long-term safety and best use are still being studied."],
    sources: [
      { title: "Kisspeptin-54 triggers egg maturation in women undergoing in vitro fertilization", detail: "Jayasena et al. · Journal of Clinical Investigation · 2014", url: pubmed(25036713) },
      { title: "Kisspeptin as a promising oocyte maturation trigger for in vitro fertilisation in humans", detail: "Kasum et al. · Gynecological Endocrinology · 2017", url: pubmed(28393578) },
    ],
    pubchem: 25240297,
  },
  {
    slug: "hcg",
    name: "hCG",
    aka: "Human chorionic gonadotropin, Pregnyl, Ovidrel",
    category: "fertility",
    status: "approved",
    statusNote: "Approved as a prescription medicine for female infertility and some other conditions. It is not approved for weight loss, and the FDA warns against “hCG diet” products.",
    oneLiner: "The pregnancy hormone: an approved fertility medicine, and the center of a long-running weight-loss myth.",
    whatItIs: "hCG is the hormone made during pregnancy, the one pregnancy tests detect. It is a protein hormone, larger than most peptides.",
    howItWorks: "It acts like LH, the hormone that triggers ovulation in women and tells the testes to make testosterone in men.",
    findings: [
      "Doctors use it to trigger ovulation in fertility treatment, and in some men whose low testosterone comes from a pituitary problem, including after anabolic steroid use.",
      "The FDA says hCG does not cause weight loss: any loss on “hCG diets” comes from extreme calorie cutting.",
    ],
    risks: ["In fertility treatment it can over-stimulate the ovaries (ovarian hyperstimulation syndrome), so it is used under close medical supervision."],
    sources: [
      { title: "Avoid dangerous hCG diet products", detail: "US Food and Drug Administration · consumer update", url: "https://www.fda.gov/consumers/consumer-updates/avoid-dangerous-hcg-diet-products" },
      { title: "Anabolic steroid-induced hypogonadism: diagnosis and treatment", detail: "Rahnema et al. · Fertility and Sterility · 2014", url: pubmed(24636400) },
    ],
  },
  {
    slug: "fsh",
    name: "FSH",
    aka: "Follicle-stimulating hormone, follitropin",
    category: "fertility",
    status: "approved",
    statusNote: "Approved as a prescription fertility medicine (for example Gonal-f) to help the ovaries develop eggs.",
    oneLiner: "An approved fertility hormone that helps eggs develop during IVF.",
    whatItIs: "FSH is a hormone made by the pituitary gland. The medicine version (follitropin) is made in the lab and is identical, or very close, to the natural hormone.",
    howItWorks: "It tells the ovaries to grow follicles, the small sacs where eggs mature. In men it helps sperm production.",
    findings: [
      "It is a standard part of ovarian stimulation in IVF. A 2025 review found that lower-cost copies (biosimilars) of follitropin alfa performed similarly to the original.",
    ],
    risks: ["It can over-stimulate the ovaries (ovarian hyperstimulation syndrome) and raises the chance of twins or more, so dosing is closely monitored."],
    sources: [
      { title: "Biosimilars versus the originator of follitropin alfa for ovarian stimulation in ART: a systematic review and meta-analysis", detail: "Kiose et al. · Human Reproduction · 2025", url: pubmed(39719046) },
    ],
  },
]

export function getPeptide(slug: string) {
  return PEPTIDES.find((peptide) => peptide.slug === slug)
}
