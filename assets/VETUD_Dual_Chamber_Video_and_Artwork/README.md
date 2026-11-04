# VETUD dual-chamber concept

The package includes a 40-second Full HD video, the revised square PNG, and editable HyperFrames source.

## Deliverables

- `VETUD_Dual_Chamber_Explainer_1080p.mp4` — 1920 x 1080, 30 fps, with an original ambient score and on-screen explanations.
- `VETUD_Dual_Chamber_Pen_Refined.png` — revised pen concept artwork with the labels “Lyophilized Peptides (Dry Powder)” and “BAC water”, and the VETUD mountain footer.
- `source/` — HTML compositions, paused GSAP timelines, original music generator, and assets.

## Edit or render

Use Node.js, HyperFrames 0.8.138, FFmpeg and FFprobe. Install the dependencies in `source/package.json`, then run `npm run preview` or `npm run render`. The artwork, timing and text are editable in the four files in `source/compositions/`; colors and typography are in `source/assets/style.css`.

Font binaries are not redistributed. Run `prepare-fonts.ps1` on a Windows computer with Century Gothic and Segoe UI installed, or provide your own licensed fonts at the paths in the CSS. The included VETUD molecular mark comes from the supplied brand assets.

The original music is in `assets/ambient.wav`. `make_audio.py` regenerates it using Python and NumPy. The video has no voiceover; its on-screen text carries the explanation.

## Concept scope

The animation illustrates a generic dual-chamber bypass mechanism. It is a packaging visualization, not a validated engineering drawing, compatibility claim, formulation recommendation, or injection guide. “BAC water” is the requested concept label. No drug name or dose is specified.

Mechanism references:

- https://www.schott-pharma.com/en/products/pharmaceutical-cartridges/cartridges-double-chamber
- https://www.vetter-pharma.com/en/services/drug-product-development/primary-packaging-evaluation/

