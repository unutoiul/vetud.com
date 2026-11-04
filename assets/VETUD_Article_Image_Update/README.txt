VETUD ARTICLE IMAGE UPDATE

42 uniquely named, full-resolution WebP illustrations are in:
storefront/public/images/learn/illustrations

The website changes map them to all 41 compound guides and 24 related news/evidence articles.
Four general research/regulatory articles keep their existing editorial vector artwork.
Conceptual images are labelled as illustrations; PubChem structure links remain available.

LOCAL CLEANUP AND SOURCE SYNCHRONIZATION
The supplied script targets C:\projects\vetud-peptides only.
Extract this entire ZIP, open PowerShell in the extracted directory, and run:
  .\apply-update.ps1

The script will:
- Rename the 41 existing unique PNG downloads to vetud-learn-<article-slug>.png.
- Remove 18 byte-identical duplicate PNGs only after verifying their retained copy by SHA-256.
- Add the missing AHK-Cu PNG.
- Copy the 42 optimized WebP illustrations and six source files into the storefront.
- Back up the replaced source files in before-update beside the script.

It checks expected source hashes and original image hashes before changing anything.
It stops if files have changed or target names already exist. Do not force an overwrite.
The script does not deploy or change products, orders, prices, medical text, or Medusa settings.
Local source synchronization is necessary to preserve these image changes in future deployments.

VALIDATION
All six changed TypeScript/TSX files passed lint and full-project type checking.
Every image was validated against its article mapping. PNGs remain at original resolution;
WebP copies preserve their dimensions while reducing page download size.
