/**
 * Curated YouTube videos, mostly by doctors. Every id was confirmed with YouTube oEmbed on
 * 2026-11-02 (official title and channel, embedding allowed). Some are deliberately skeptical:
 * the aim is balance, not hype.
 */
export type VideoTopic = "basics" | "weight" | "peptides" | "skin" | "ageing" | "history" | "regulation" | "hormones" | "brain" | "reproductive" | "immunity" | "research"

export type VideoConnection = { label: string; explanation: string }

export type LearnVideo = {
  id: string
  title: string
  creator: string
  credential: string
  summary: string
  topic: VideoTopic
}

export const VIDEO_TOPICS: { id: VideoTopic; name: string }[] = [
  { id: "basics", name: "Start here" },
  { id: "weight", name: "Weight-loss medicines" },
  { id: "peptides", name: "Popular peptides: the evidence" },
  { id: "skin", name: "Skin & tanning" },
  { id: "ageing", name: "Ageing & energy" },
  { id: "history", name: "History" },
  { id: "regulation", name: "Official FDA meetings" },
  { id: "hormones", name: "Hormones & prescription medicines" },
  { id: "brain", name: "Brain signalling" },
  { id: "reproductive", name: "Sexual health & fertility research" },
  { id: "immunity", name: "Immune-system biology" },
  { id: "research", name: "Understanding clinical research" },
]

export const VIDEOS: LearnVideo[] = [
  { id: "78QUeXVKiJ4", title: "Introduction to proteins and amino acids", creator: "Khan Academy", credential: "Free science education", summary: "The building blocks every peptide is made from, explained from scratch.", topic: "basics" },
  { id: "nv2kfBFkv4s", title: "Peptide bond formation", creator: "Khan Academy", credential: "Free science education", summary: "How amino acids link up into chains, which is all a peptide really is.", topic: "basics" },
  { id: "xpdLs-_nl4g", title: "Exposing the truth about peptides", creator: "Doctor Mike", credential: "Mikhail Varshavski, DO, family medicine physician", summary: "A practicing doctor looks at the peptide trend and separates the evidence from the hype.", topic: "basics" },
  { id: "iM3TACEG-cQ", title: "Are peptides even legal?", creator: "Doctor Mike", credential: "Mikhail Varshavski, DO, family medicine physician", summary: "The legal gray zone many popular peptides are sold in.", topic: "basics" },
  { id: "o8YMLTfNYtc", title: "The science behind Ozempic and other GLP-1 medications", creator: "Nick Norwitz", credential: "Nick Norwitz, MD, PhD", summary: "How GLP-1 medicines work in the gut and brain, in clear language.", topic: "weight" },
  { id: "QGIFdakceHM", title: "Pros and cons of GLP-1 weight-loss drugs", creator: "Peter Attia MD", credential: "Peter Attia, MD, with diabetes researcher Ralph DeFronzo, MD", summary: "Two doctors weigh the benefits against the downsides, including muscle loss and cost.", topic: "weight" },
  { id: "mm5zPW5offA", title: "Does everyone need Ozempic?", creator: "Doctor Mike", credential: "Mikhail Varshavski, DO, family medicine physician", summary: "Who these medicines are really for, and who they aren’t.", topic: "weight" },
  { id: "w0A_VRT3rIE", title: "Retatrutide weight-loss truth", creator: "Dr Brad Stanfield", credential: "Brad Stanfield, MBChB, general practitioner", summary: "A GP reads the retatrutide trial data and what it does and doesn’t show.", topic: "weight" },
  { id: "Y6smr1o-f9o", title: "Should you take BPC-157 peptides?", creator: "Dr Brad Stanfield", credential: "Brad Stanfield, MBChB, general practitioner", summary: "What the research on BPC-157 actually contains, study by study.", topic: "peptides" },
  { id: "8DVatJ9de90", title: "Did the FDA just approve BPC-157?", creator: "Dr Brad Stanfield", credential: "Brad Stanfield, MBChB, general practitioner", summary: "Why the 2026 FDA news is not an approval.", topic: "peptides" },
  { id: "wRsX_ZkzxvQ", title: "Peptide and hormone therapies for health, performance and longevity", creator: "Andrew Huberman", credential: "Andrew Huberman, PhD, with physician Craig Koniver, MD", summary: "A long-form conversation about the peptides doctors are being asked about, from GLP-1s to BPC-157.", topic: "peptides" },
  { id: "DWL46HWhmgQ", title: "Melanotan II: the truth about the viral “Barbie drug”", creator: "Dr Dray", credential: "Andrea Suarez, MD, dermatologist", summary: "A dermatologist on why tanning injections worry skin doctors.", topic: "skin" },
  { id: "TH_ZDyMzhqM", title: "Dermatologist rates copper peptide serums", creator: "Dr. Aleksandra Brown", credential: "Aleksandra Brown, DO, FAAD, dermatologist", summary: "What copper peptides (GHK-Cu) can and can’t do in skin care.", topic: "skin" },
  { id: "l8BI_720Dfs", title: "NAD coenzymes, metabolic stress and new interventions", creator: "Progress, Potential, and Possibilities", credential: "Interview with Charles Brenner, PhD, NAD researcher at City of Hope", summary: "A leading NAD scientist on what the molecule does and what boosting it might achieve.", topic: "ageing" },
  { id: "Gk1D4VgM8jY", title: "The discovery of insulin", creator: "Nature", credential: "The journal Nature", summary: "How a peptide hormone became the medicine that changed diabetes forever.", topic: "history" },
  { id: "DhDC0DAYdBI", title: "FDA peptide compounding meeting: July 23, 2026", creator: "U.S. Food and Drug Administration", credential: "Official FDA advisory committee recording", summary: "Full meeting covering BPC-157, KPV, TB-500 and MOTS-c. Advisory discussion is not drug approval.", topic: "regulation" },
  { id: "xXM5ecHxlMU", title: "FDA peptide compounding meeting: July 24, 2026", creator: "U.S. Food and Drug Administration", credential: "Official FDA advisory committee recording", summary: "Full meeting covering DSIP (emideltide), Semax and Epitalon. Advisory discussion is not drug approval.", topic: "regulation" },
  { id: "KeqMSzFbSos", title: "What is a GLP-1 agonist, and how does it work?", creator: "Ohio State Wexner Medical Center", credential: "Allison L. Rhodes, MD · obesity medicine", summary: "A hospital explainer of GLP-1 signalling, appetite and blood-sugar regulation.", topic: "weight" },
  { id: "pUWAgJKkOlg", title: "Avoiding weight regain after GLP-1 medication", creator: "Ohio State Wexner Medical Center", credential: "University hospital patient education", summary: "Clinical context for weight maintenance after GLP-1 treatment. It does not test CBL-514 or other experimental add-ons.", topic: "weight" },
  { id: "IRS2xnO-y28", title: "Ozempic, Mounjaro, Wegovy and Zepbound: which is which?", creator: "Ohio State Wexner Medical Center", credential: "Allison L. Rhodes, MD · obesity medicine", summary: "How the brand names relate to semaglutide and tirzepatide and their prescribed uses. Older recordings may not cover later indications or formulations.", topic: "weight" },
  { id: "ku8izA1Nh6o", title: "Retatrutide: interpreting the newer trial results", creator: "Dr Brad Stanfield", credential: "Brad Stanfield, MBChB · general practitioner", summary: "A physician reviews retatrutide results. Read the linked trial reports for the population, follow-up and analysis used.", topic: "weight" },
  { id: "wbqcnfjETc4", title: "CagriSema: semaglutide plus cagrilintide", creator: "Dr Kidd", credential: "Dr Kidd · medical education channel", summary: "An explanation of the combination and earlier study findings. Later head-to-head results are linked in our article.", topic: "weight" },
  { id: "wDqrmuOOdBI", title: "FDA compounding meeting: ipamorelin and kisspeptin-10", creator: "U.S. Food and Drug Administration", credential: "Official FDA recording · October 29, 2024", summary: "Full advisory meeting covering ipamorelin and kisspeptin-10 among other substances. This is a historical regulatory discussion, not an approval.", topic: "regulation" },
  { id: "E7MlK4p7O7c", title: "FDA compounding meeting: CJC-1295, AOD-9604 and thymosin alpha-1", creator: "U.S. Food and Drug Administration", credential: "Official FDA recording · December 4, 2024", summary: "The original discussion of these substances and proposed uses. Committee advice is separate from a final regulatory decision.", topic: "regulation" },
  { id: "D58NZXJ3UeE", title: "Bremelanotide (PT-141) and sexual desire", creator: "Rena Malik, M.D.", credential: "Rena Malik, MD · urologist", summary: "A clinician explains bremelanotide and sexual-health research. Approved indications and investigational uses should be distinguished.", topic: "reproductive" },
  { id: "nMtSSCV1yvY", title: "Kisspeptin and sexual and emotional brain processing", creator: "Imperial College London", credential: "University research team · Professor Waljit Dhillo", summary: "Researchers describe an exploratory kisspeptin study. Brain responses in a study are different from an established treatment benefit.", topic: "reproductive" },
  { id: "S933fvQGK1I", title: "Knowledge Shot: Oxytocin", creator: "Osmosis from Elsevier", credential: "Medical science education publisher", summary: "An introduction to oxytocin signalling, childbirth, breastfeeding and social biology.", topic: "hormones" },
  { id: "fYK29VEpMQw", title: "Treating hyperinsulinism with medicine", creator: "The Children's Hospital of Philadelphia", credential: "Specialist hospital education", summary: "Clinicians discuss diazoxide and octreotide in childhood hyperinsulinism. This is a specific clinical setting, not every use of octreotide.", topic: "hormones" },
  { id: "zTW_R-OqpZI", title: "Teriparatide: patient questions and nurse education", creator: "Royal Osteoporosis Society", credential: "Osteoporosis charity · Bone Matters series", summary: "A patient and nurse discuss prescribed teriparatide. The information concerns licensed medicines, not laboratory research materials.", topic: "hormones" },
  { id: "Frck4v4YGV8", title: "Patient guide to growth hormone deficiency", creator: "American Association of Clinical Endocrinology", credential: "Professional endocrinology association", summary: "An overview of growth hormone deficiency and specialist care. It does not establish anti-ageing benefits or benefits of growth-hormone-releasing research peptides.", topic: "hormones" },
  { id: "_LKdNhF2WhI", title: "Endocrinology: growth hormone", creator: "Ninja Nerd", credential: "Medical physiology education", summary: "A detailed lesson on growth hormone physiology and its signalling pathways.", topic: "hormones" },
  { id: "9dS7bc_2bUE", title: "The hypothalamus and pituitary gland", creator: "khanacademymedicine", credential: "Khan Academy · endocrine physiology", summary: "How the hypothalamus and pituitary coordinate hormone release, including growth and reproductive hormones.", topic: "hormones" },
  { id: "FXYX_ksRwIk", title: "Types of neurotransmitters", creator: "khanacademymedicine", credential: "Khan Academy · nervous-system physiology", summary: "The roles of signalling molecules such as GABA, glutamate and peptide neurotransmitters.", topic: "brain" },
  { id: "i1dAnpSFbyI", title: "Mitochondria: structure and cellular energy", creator: "Khan Academy", credential: "Biology education", summary: "A foundation for reading mitochondrial research. It does not demonstrate a benefit from any experimental compound.", topic: "ageing" },
  { id: "gNFDONSjB7Q", title: "Apoptosis: programmed cell death", creator: "Khan Academy", credential: "Cell-biology education", summary: "What programmed cell death means, how it differs from injury, and why it matters in biology.", topic: "basics" },
  { id: "2wseM6wWd74", title: "The science of cells that never get old", creator: "TED", credential: "Elizabeth Blackburn, PhD · Nobel laureate in telomere research", summary: "The discovery and biology of telomeres. This is not a trial of epitalon or any anti-ageing product.", topic: "ageing" },
  { id: "8diYLhl8bWU", title: "Why do some people go bald?", creator: "TED-Ed", credential: "Lesson by Sarthak Sinha · hair-follicle biology", summary: "An animated explanation of hair growth and hair loss, providing context for reading hair-research claims.", topic: "skin" },
  { id: "O1N2rENXq_Y", title: "Phagocytes and innate immunity", creator: "Khan Academy", credential: "Immune-system biology education", summary: "How part of the immune system responds to threats and contributes to inflammation.", topic: "immunity" },
  { id: "lJOQB_G15Jc", title: "What is clinical research?", creator: "National Institute of Mental Health", credential: "NIMH · US National Institutes of Health", summary: "Why studies in people are needed and what clinical research is designed to establish.", topic: "research" },
  { id: "ixCGzGOlnGo", title: "Clinical research: risks and benefits", creator: "National Institute of Mental Health", credential: "NIMH · US National Institutes of Health", summary: "Why an experimental treatment can involve uncertainty even when its scientific rationale sounds promising.", topic: "research" },
  { id: "BBTqkHQjUzg", title: "Different types of clinical research", creator: "National Institute of Mental Health", credential: "NIMH · US National Institutes of Health", summary: "An introduction to the different questions and designs used in studies involving people.", topic: "research" },
  { id: "y7BCOolGVcM", title: "What is informed consent?", creator: "National Institute of Mental Health", credential: "NIMH · US National Institutes of Health", summary: "How research participants receive information about a study before deciding whether to take part.", topic: "research" },
]

export const watchUrl = (id: string) => `https://www.youtube.com/watch?v=${id}`
export const thumbnailUrl = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`

export function getVideos(ids: string[] = []) {
  return ids.flatMap((id) => VIDEOS.filter((video) => video.id === id))
}
