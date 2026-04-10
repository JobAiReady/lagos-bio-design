# Third-Party Notices & Attributions

This project references, links to, or uses at runtime the following third-party tools, data, and libraries. None of these are redistributed within this repository — they are installed or downloaded at runtime in Google Colab notebooks.

---

## Computational Biology Tools (Notebook Runtime Dependencies)

### AlphaFold & AlphaFold Protein Structure Database
- **Authors**: Jumper, J., Evans, R., Pritzel, A., et al. (Google DeepMind)
- **Paper**: "Highly accurate protein structure prediction with AlphaFold" — *Nature* 596, 583–589 (2021)
- **Database**: https://alphafold.ebi.ac.uk/
- **Database License**: CC-BY-4.0 (Creative Commons Attribution 4.0 International)
- **Usage**: Pre-computed protein structures downloaded from AlphaFold DB in Module 1
- **Attribution**: AlphaFold Protein Structure Database is developed by DeepMind and EMBL-EBI. Structures are provided under CC-BY-4.0 license.

### RFDiffusion
- **Authors**: Watson, J.L., Juergens, D., Bennett, N.R., et al. (Baker Lab, University of Washington)
- **Paper**: "De novo design of protein structure and function with RFdiffusion" — *Nature* 620, 1089–1100 (2023)
- **Repository**: https://github.com/RosettaCommons/RFdiffusion
- **License**: BSD-3-Clause
- **Usage**: Cloned and executed at runtime in Colab for backbone generation (Modules 2–4)

### ProteinMPNN
- **Authors**: Dauparas, J., Anishchenko, I., Bennett, N., et al.
- **Paper**: "Robust deep learning-based protein sequence design using ProteinMPNN" — *Science* 378, 49–56 (2022)
- **Repository**: https://github.com/dauparas/ProteinMPNN
- **License**: MIT
- **Usage**: Cloned and executed at runtime in Colab for inverse folding / sequence design (Modules 2–4)

### ESM-2 & ESMFold (Meta AI)
- **Authors**: Lin, Z., Akin, H., Rao, R., et al. (Meta Fundamental AI Research)
- **Paper**: "Evolutionary-scale prediction of atomic-level protein structure with a language model" — *Science* 379, 1123–1130 (2023)
- **Repository**: https://github.com/facebookresearch/esm
- **Package**: `fair-esm` (PyPI)
- **License**: MIT
- **Usage**: Installed via pip at runtime in Colab for sequence embeddings and structure prediction (Modules 2, 4, 5)

### ColabFold
- **Authors**: Mirdita, M., Schütze, K., Moriwaki, Y., et al.
- **Paper**: "ColabFold: making protein folding accessible to all" — *Nature Methods* 19, 679–682 (2022)
- **Repository**: https://github.com/sokrypton/ColabFold
- **License**: MIT
- **Usage**: Optional installation in Module 1 for AlphaFold inference

### VibeGen (ModeShapeDiffusionDesign)
- **Authors**: Ni, B. & Buehler, M.J. (Laboratory for Atomistic and Molecular Mechanics, MIT)
- **Paper**: "VibeGen: Agentic end-to-end de novo protein design for tailored dynamics using a language diffusion model" — *Matter* (2026)
- **Repository**: https://github.com/lamm-mit/ModeShapeDiffusionDesign
- **Model Weights**: https://huggingface.co/lamm-mit/VibeGen
- **License**: Apache-2.0
- **Usage**: Cloned and executed at runtime in Colab for dynamics-first protein design (Module 3 Bonus Lab)

### OmegaFold
- **Authors**: Wu, R., Ding, F., Wang, R., et al. (HelixonProtein)
- **Paper**: "High-resolution de novo structure prediction from primary sequence" — *bioRxiv* (2022)
- **Repository**: https://github.com/HeliXonProtein/OmegaFold
- **License**: Apache-2.0
- **Usage**: Installed at runtime in Colab for single-sequence structure prediction in VibeGen demo (Module 3 Bonus Lab)

---

## Protein Structure Data

### RCSB Protein Data Bank (PDB)
- **URL**: https://www.rcsb.org/
- **License**: Public domain (wwPDB agreement)
- **Structures used**:
  - **5VK2** — Lassa virus glycoprotein complex (GPC) prefusion structure (Modules 4–5)
  - **6M0J** — SARS-CoV-2 Spike RBD bound to ACE2 (Module 3)
- **Attribution**: H.M. Berman, J. Westbrook, Z. Feng, et al. "The Protein Data Bank" — *Nucleic Acids Research* 28, 235–242 (2000)

### UniProt
- **URL**: https://www.uniprot.org/
- **License**: CC-BY-4.0
- **Usage**: Reference protein sequences (e.g., P01308 — Human Insulin) used in Module 1
- **Attribution**: The UniProt Consortium. "UniProt: the Universal Protein Knowledgebase in 2023" — *Nucleic Acids Research* 51, D523–D531 (2023)

---

## Frontend Dependencies (npm)

All frontend dependencies are permissively licensed (MIT, ISC, or BSD). Key packages:

| Package | License | Usage |
|---------|---------|-------|
| React 19 | MIT | UI framework |
| React Router v7 | MIT | Client-side routing |
| Vite 7 | MIT | Build tool |
| TailwindCSS v4 | MIT | Styling |
| CodeMirror 6 | MIT | Code editor |
| Lucide React | ISC | Icon library |
| Supabase JS | MIT | Backend client |

No GPL or copyleft dependencies are used.

---

## Academic Papers Referenced in Lesson Content

Lesson content references the following published works via hyperlinks. No paper content is reproduced — only original summaries and definitions are provided.

1. Jumper et al. (2021). "Highly accurate protein structure prediction with AlphaFold." *Nature* 596, 583–589.
2. Watson et al. (2023). "De novo design of protein structure and function with RFdiffusion." *Nature* 620, 1089–1100.
3. Dauparas et al. (2022). "Robust deep learning-based protein sequence design using ProteinMPNN." *Science* 378, 49–56.
4. Lin et al. (2023). "Evolutionary-scale prediction of atomic-level protein structure with a language model." *Science* 379, 1123–1130.
5. Nobel Prize in Chemistry 2024. https://www.nobelprize.org/prizes/chemistry/2024/summary/
6. Ni, B. & Buehler, M.J. (2026). "VibeGen: Agentic end-to-end de novo protein design for tailored dynamics using a language diffusion model." *Matter*.

---

## Trademarks

- **AlphaFold** is a trademark of Google DeepMind
- **Google Colab** is a trademark of Google LLC

All trademarks are used nominatively for educational identification purposes only and do not imply endorsement.

---

*Last updated: April 10, 2026*
