/**
 * Curated YouTube videos, mostly by doctors. Every id was confirmed with YouTube oEmbed on
 * 2026-11-01 (official title and channel, embedding allowed). Some are deliberately skeptical:
 * the aim is balance, not hype.
 */
export type VideoTopic = "basics" | "weight" | "peptides" | "skin" | "ageing" | "history"

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
  { id: "l8BI_720Dfs", title: "NAD coenzymes, metabolic stress and new interventions", creator: "Charles Brenner", credential: "Charles Brenner, PhD, NAD researcher at City of Hope", summary: "A leading NAD scientist on what the molecule does and what boosting it might achieve.", topic: "ageing" },
  { id: "Gk1D4VgM8jY", title: "The discovery of insulin", creator: "Nature", credential: "The journal Nature", summary: "How a peptide hormone became the medicine that changed diabetes forever.", topic: "history" },
]

export const watchUrl = (id: string) => `https://www.youtube.com/watch?v=${id}`
export const thumbnailUrl = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`

export function getVideos(ids: string[] = []) {
  return ids.flatMap((id) => VIDEOS.filter((video) => video.id === id))
}
