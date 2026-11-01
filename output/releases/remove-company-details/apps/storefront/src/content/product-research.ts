/** Original editorial profiles. Product specifications remain sourced from Medusa. */
export type ProductResearch = {
  name: string
  classification: string
  summary: string
  background: string
  topics: { title: string; text: string }[]
  limitation: string
  source: { title: string; journal: string; url: string }
}

const profiles: Record<string, ProductResearch> = {
  retatrutide: {
    name: "Retatrutide", classification: "GIP / GLP-1 / glucagon receptor agonist",
    summary: "A synthetic peptide studied for its activity at three metabolic receptors: GIP, GLP-1 and glucagon.",
    background: "Retatrutide, also identified as LY3437943, brings three receptor pathways into one research molecule. This profile makes it relevant to investigations of metabolic signaling and the relationships between glucose regulation, body composition and energy balance.",
    topics: [
      { title: "Triple receptor signaling", text: "Research examines how combined GIP, GLP-1 and glucagon activity differs from activity at a single receptor." },
      { title: "Metabolic endpoints", text: "Published clinical research measures changes in body weight and other metabolic outcomes under controlled study conditions." },
      { title: "Evidence in context", text: "Trial results depend on the study population, exposure and follow-up period. They do not establish the performance of this VETUD material." },
    ],
    limitation: "The cited phase 2 trial reported gastrointestinal adverse events and changes in heart rate. Its findings concern the clinical investigational formulation, not this research product.",
    source: { title: "Triple-Hormone-Receptor Agonist Retatrutide for Obesity — A Phase 2 Trial", journal: "Jastreboff et al. · New England Journal of Medicine · 2023", url: "https://pubmed.ncbi.nlm.nih.gov/37366315/" },
  },
  tirzepatide: {
    name: "Tirzepatide", classification: "GIP / GLP-1 receptor agonist",
    summary: "A synthetic peptide with dual activity at GIP and GLP-1 receptors, studied in incretin and metabolic research.",
    background: "Tirzepatide, originally described as LY3298176, combines two incretin receptor activities in a single molecule. Discovery research used cell-based systems, animal models and early clinical investigation to characterize its pharmacology.",
    topics: [
      { title: "Dual incretin activity", text: "Receptor assays examine GIP and GLP-1 activity and the contribution of each pathway to the overall signaling profile." },
      { title: "Metabolic investigation", text: "Research considers glucose regulation and body-weight endpoints in defined experimental and clinical settings." },
      { title: "Comparative pharmacology", text: "A dual agonist allows investigators to compare combined receptor activity with selective GLP-1 activity." },
    ],
    limitation: "Published findings describe specific study materials and protocols. They do not establish equivalence, clinical efficacy or safety for this VETUD research product.",
    source: { title: "LY3298176, a novel dual GIP and GLP-1 receptor agonist: from discovery to clinical proof of concept", journal: "Coskun et al. · Molecular Metabolism · 2018", url: "https://pubmed.ncbi.nlm.nih.gov/30473097/" },
  },
  semaglutide: {
    name: "Semaglutide", classification: "GLP-1 receptor agonist",
    summary: "A modified GLP-1 analogue studied for receptor activity and the relationship between peptide structure and duration of action.",
    background: "Semaglutide was developed through changes to the GLP-1 peptide backbone and a fatty-acid side chain. Its discovery paper describes molecular design intended to improve resistance to enzymatic degradation and increase albumin binding while retaining receptor activity.",
    topics: [
      { title: "GLP-1 signaling", text: "Receptor activity provides a starting point for studying this incretin pathway in appropriate experimental systems." },
      { title: "Peptide design", text: "Structural modifications illustrate how peptide chemistry can influence enzymatic stability and molecular interactions." },
      { title: "Albumin interaction", text: "The discovery work evaluates albumin binding as a contributor to the molecule’s prolonged exposure profile." },
    ],
    limitation: "The publication characterizes the molecule and its development. It does not validate the composition, stability or biological performance of an individual VETUD batch.",
    source: { title: "Discovery of the Once-Weekly Glucagon-Like Peptide-1 (GLP-1) Analogue Semaglutide", journal: "Lau et al. · Journal of Medicinal Chemistry · 2015", url: "https://pubmed.ncbi.nlm.nih.gov/26308095/" },
  },
  selank: {
    name: "Selank", classification: "Peptide signaling research",
    summary: "A synthetic peptide investigated in preclinical studies of gene expression associated with GABAergic neurotransmission.",
    background: "Selank research includes experiments examining how exposure to the peptide affects the expression of genes involved in neuronal communication. The cited study explores GABA-related pathways in a rat model and compares gene-expression responses with those associated with GABA.",
    topics: [
      { title: "GABA-related pathways", text: "The study investigates genes connected with inhibitory neurotransmission rather than establishing a single definitive receptor target." },
      { title: "Gene-expression analysis", text: "Measured expression changes provide molecular observations for further investigation." },
      { title: "Preclinical evidence", text: "Animal findings are specific to the model, experimental conditions and time points studied." },
    ],
    limitation: "These preclinical observations do not demonstrate benefits or safety in people. The listed 10 ml bottle volume does not establish peptide concentration or total peptide content.",
    source: { title: "Selank Administration Affects the Expression of Some Genes Involved in GABAergic Neurotransmission", journal: "Volkova et al. · Frontiers in Pharmacology · 2016", url: "https://pubmed.ncbi.nlm.nih.gov/26924987/" },
  },
  semax: {
    name: "Semax", classification: "Neurotrophin signaling research",
    summary: "A synthetic heptapeptide studied in preclinical models of neurotrophin-related gene expression.",
    background: "Semax is described in the cited publication as an analogue of an adrenocorticotropic hormone fragment. Researchers measured expression of nerve growth factor (NGF) and brain-derived neurotrophic factor (BDNF) genes in the rat hippocampus, frontal cortex and retina.",
    topics: [
      { title: "NGF & BDNF expression", text: "The study uses gene-expression measurements to examine pathways associated with neuronal maintenance." },
      { title: "Time-dependent responses", text: "Expression patterns varied across tissues and time points, emphasizing the importance of experimental design." },
      { title: "Model-specific findings", text: "The reported responses come from a rat model and cannot be assumed to apply to people or other preparations." },
    ],
    limitation: "Preclinical gene-expression findings do not establish clinical benefit. The listed 10 ml bottle volume does not establish peptide concentration or total peptide content.",
    source: { title: "Comparison of the temporary dynamics of NGF and BDNF gene expression in rat hippocampus, frontal cortex, and retina under Semax action", journal: "Shadrina et al. · Journal of Molecular Neuroscience · 2010", url: "https://pubmed.ncbi.nlm.nih.gov/19662538/" },
  },
}

export function getProductResearch(handle?: string | null) {
  return handle && Object.hasOwn(profiles, handle) ? profiles[handle] : undefined
}
