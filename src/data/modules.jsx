import React from 'react';
import { Award, Zap, Cpu, Globe2, ShieldAlert } from 'lucide-react';

export const modules = [
    {
        title: "Module 1: The New Paradigm – From Yaba to Stockholm",
        duration: "Week 1",
        level: "Foundational",
        icon: <Award size={20} />,
        color: "bg-yellow-600",
        description: "Understand the Nobel Prize-winning shift from 'discovering' proteins to 'creating' them. We map the global 'Generative Leap' to the Lagos tech ecosystem, explaining why Yaba is positioned to lead the next wave of bio-innovation.",
        topics: [
            "The 2024 Nobel Prize: Baker, Hassabis, & Jumper explained.",
            "Old Paradigm (Directed Evolution) vs. New Paradigm (De Novo Design).",
            "The 'Integration Bottleneck': Why tools like AlphaFold were disconnected and how the 2025 Roadmap fixes it.",
            "The Protein Functional Universe: Exploring beyond nature's saturation point."
        ],
        caseStudy: "The 'Yaba Manifesto' for Biotech: Leapfrogging legacy systems.",
        lab: "Setup: Python, py3Dmol, and ColabFold environments.",
        requiresGpu: false,
        colabUrl: "https://colab.research.google.com/github/JobAiReady/lagos-bio-design/blob/main/notebooks/Module1_Setup.ipynb",
        lessonContent: {
            summary: `In October 2024, the Nobel Prize in Chemistry was split between two teams: David Baker (University of Washington) for computational protein design, and Demis Hassabis & John Jumper (Google DeepMind) for AlphaFold — an AI system that predicted the 3D structure of virtually every known protein. This marked a paradigm shift: biology moved from *discovering* proteins in nature to *creating* them from scratch.

For decades, scientists relied on **Directed Evolution** — mutating natural proteins randomly and selecting the best variants. It worked (Frances Arnold won the 2018 Nobel for it), but it was slow and limited to proteins nature had already explored. The new paradigm, **De Novo Design**, uses AI to generate proteins that have never existed in nature — designed atom-by-atom for specific functions.

**Why does this matter for Lagos?** Africa's disease burden (Lassa fever, Malaria, Tuberculosis) demands novel protein-based diagnostics and therapeutics. The tools to design these — AlphaFold, RFDiffusion, ProteinMPNN — are open-source and run on cloud GPUs. A laptop in Yaba now has the same design capability as a lab at MIT. This bootcamp teaches you to wield that power.`,
            keyTerms: [
                { term: "Protein", definition: "A molecular machine made of amino acids that folds into a specific 3D shape to perform a biological function. Enzymes, antibodies, and structural proteins are all examples." },
                { term: "De Novo Design", definition: "Creating entirely new proteins from scratch using computational methods, rather than modifying existing natural proteins." },
                { term: "AlphaFold", definition: "Google DeepMind's AI system that predicts the 3D structure of a protein from its amino acid sequence with near-experimental accuracy." },
                { term: "pLDDT", definition: "Predicted Local Distance Difference Test — AlphaFold's per-residue confidence score (0–100). Scores above 90 indicate high confidence; below 50 suggests disorder or uncertainty." },
                { term: "Directed Evolution", definition: "The older paradigm: iteratively mutating natural proteins and selecting improved variants. Effective but limited to nature's existing protein space." },
                { term: "PDB (Protein Data Bank)", definition: "The global repository of experimentally determined 3D protein structures. Each structure has a unique 4-character ID (e.g., 5VK2)." }
            ],
            readingLinks: [
                { title: "Nobel Prize 2024: Chemistry — Computational Protein Design", url: "https://www.nobelprize.org/prizes/chemistry/2024/summary/" },
                { title: "AlphaFold Protein Structure Database", url: "https://alphafold.ebi.ac.uk/" },
                { title: "David Baker Lab — Institute for Protein Design", url: "https://www.bakerlab.org/" }
            ],
            preLabQuestions: [
                "What is the difference between Directed Evolution and De Novo Design?",
                "If AlphaFold gives a pLDDT score of 45 for a region, what does that tell you?",
                "Why might open-source protein design tools be especially impactful in West Africa?"
            ]
        },
        labContent: {
            objective: "Initialize your cloud-based bio-design environment and visualize your first protein structure.",
            prerequisites: [
                "Google Account (for Colab)",
                "Basic Python knowledge"
            ],
            steps: [
                {
                    title: "Environment Setup",
                    description: "Clone the 'LagosBioBootcamp' repository and install dependencies in a fresh Google Colab environment.",
                    code: "!git clone https://github.com/JobAiReady/lagos-bio-design.git\n%cd lagos-bio-design\n!pip install -r requirements.txt"
                },
                {
                    title: "AlphaFold 3 Inference",
                    description: "Run a prediction on a test sequence (Insulin) to verify the installation.",
                    code: "from colabfold.batch import run_batch\nrun_batch(input_sequences='insulin.fasta', output_dir='./results')"
                },
                {
                    title: "Visualization",
                    description: "Render the structure in interactive 3D with py3Dmol, colored by pLDDT confidence.",
                    code: "import py3Dmol\nview = py3Dmol.view(width=800, height=500)\nview.addModel(pdb_data, 'pdb')\nview.setStyle({'cartoon': {'colorscheme': {'prop': 'b', 'gradient': 'rwb', 'min': 50, 'max': 90}}})\nview.show()"
                }
            ],
            deliverable: "A screenshot of your interactive 3D visualization showing the insulin structure colored by confidence."
        }
    },
    {
        title: "Module 2: The Engineer's Toolkit (T1-T7)",
        duration: "Weeks 2-3",
        level: "Technical",
        icon: <Zap size={20} />,
        color: "bg-blue-600",
        description: "Master the 7-part 'AI-Driven Protein Design Roadmap'. We break down the systematic engineering workflow that turns biology into code, utilizing the unified framework proposed in the 2025 Nature Reviews Bioengineering report.",
        topics: [
            "T1-T3: Search & Prediction (AlphaFold 3, ESM).",
            "T4: Sequence Generation (The 'Inverse Folding' Problem & ProteinMPNN).",
            "T5: Structure Generation (RFDiffusion & The 'Artist' role).",
            "T6-T7: Screening & Synthesis: Preparing for the wet lab."
        ],
        caseStudy: "Designing a heat-stable industrial lipase (2025 breakthrough).",
        lab: "Pipeline Construction: Linking RFDiffusion output to ProteinMPNN.",
        requiresGpu: true,
        colabUrl: "https://colab.research.google.com/github/JobAiReady/lagos-bio-design/blob/main/notebooks/Module2_Pipeline.ipynb",
        lessonContent: {
            summary: `Modern protein engineering follows a systematic 7-step roadmap, published in the 2025 Nature Reviews Bioengineering framework. The three tools at the core of this bootcamp — **RFDiffusion**, **ProteinMPNN**, and **AlphaFold** — map directly onto this roadmap as the Structure Generator, Sequence Designer, and Validator respectively.

**RFDiffusion** is a diffusion model for protein structures. Just like image generators (Stable Diffusion, DALL·E) start from random noise and iteratively refine it into a picture, RFDiffusion starts from random 3D coordinates and denoises them into a valid protein backbone. You specify constraints — "make it 100 residues long" or "make it bind to this target" — and the model hallucinates a novel fold that satisfies those constraints.

**ProteinMPNN** solves the *inverse folding* problem: given a 3D backbone, what amino acid sequence will fold into that exact shape? It's the bridge between structure (what you designed) and sequence (what you can actually synthesize as DNA). The **self-consistency check** closes the loop: you fold the designed sequence with AlphaFold/ESMFold and measure how closely it matches the original backbone. An RMSD below 2.0 Å means your design is likely to fold correctly in reality.`,
            keyTerms: [
                { term: "RFDiffusion", definition: "A generative AI model that creates novel protein backbones by reversing a diffusion (noising) process. Developed at the Baker Lab, University of Washington." },
                { term: "ProteinMPNN", definition: "A neural network that solves inverse folding — designing amino acid sequences that will fold into a given 3D backbone structure." },
                { term: "Inverse Folding", definition: "The reverse of structure prediction: given a target 3D structure, find a sequence that folds into it. The key step between computational design and DNA synthesis." },
                { term: "RMSD", definition: "Root Mean Square Deviation — measures how far two protein structures deviate in 3D space (in Ångströms). Lower = more similar. Below 2.0 Å is considered a successful design." },
                { term: "Self-Consistency Score", definition: "A validation metric: design a sequence for a backbone, fold it, and compare. If the predicted fold matches the intended backbone (RMSD < 2 Å), the design is self-consistent." },
                { term: "Backbone", definition: "The repeating N-Cα-C chain that forms the structural skeleton of a protein. Side chains (which determine function) branch off from each Cα atom." }
            ],
            readingLinks: [
                { title: "RFDiffusion: De novo protein design by deep network hallucination (Nature, 2023)", url: "https://www.nature.com/articles/s41586-023-06415-8" },
                { title: "ProteinMPNN paper (Science, 2022)", url: "https://www.science.org/doi/10.1126/science.add2187" },
                { title: "AI-Driven Protein Design Roadmap (Nature Reviews Bioengineering, 2025)", url: "https://www.nature.com/articles/s44222-024-00282-6" }
            ],
            preLabQuestions: [
                "Why can't we just use AlphaFold alone to design new proteins? What role does RFDiffusion fill?",
                "What does an RMSD of 0.8 Å tell you compared to an RMSD of 3.5 Å?",
                "In what order do the three tools (AlphaFold, RFDiffusion, ProteinMPNN) execute in the design pipeline?"
            ]
        },
        labContent: {
            objective: "Create a de novo protein backbone using RFDiffusion and generate a sequence for it using ProteinMPNN.",
            prerequisites: [
                "Completed Module 1",
                "GPU Runtime enabled"
            ],
            steps: [
                {
                    title: "Backbone Generation",
                    description: "Use RFDiffusion to generate a 100-residue backbone with a specific fold topology.",
                    code: "./scripts/run_inference.py inference.output_prefix=test_backbone inference.model_directory_path=models/ 'contigmap.contigs=[100-100]'"
                },
                {
                    title: "Sequence Design",
                    description: "Feed the generated backbone (.pdb) into ProteinMPNN to find an amino acid sequence that folds into this shape.",
                    code: "python protein_mpnn_run.py --pdb_path_chains test_backbone.pdb --out_folder ./mpnn_results --num_seq_per_target 5"
                },
                {
                    title: "Validation",
                    description: "Fold the new sequence with AlphaFold to see if it matches the original RFDiffusion backbone (Self-Consistency Score).",
                    code: "python validation/sc_score.py --backbone test_backbone.pdb --prediction folded_sequence.pdb"
                }
            ],
            deliverable: "The SC (Self-Consistency) score plot showing < 2.0 RMSD."
        }
    },
    {
        title: "Module 3: Generative AI – Hallucination as a Feature",
        duration: "Weeks 4-5",
        level: "Advanced AI",
        icon: <Cpu size={20} />,
        color: "bg-purple-600",
        description: "Deep dive into the 'Building Blocks' of Protein Language Models (PLMs). Learn how models treat amino acids as 'tokens' and how the new 'AlphaDesign' and 'APM' frameworks allow for controllable hallucination.",
        topics: [
            "1D vs. 3D Tokens: Understanding SaProt and StructTokenBench.",
            "Diffusion Models: How 'denoising' creates new protein backbones.",
            "Sequence-Structure Co-Design: The APM 'All-Atom' breakthrough.",
            "Controllable Hallucination: Designing for specific oligomeric states."
        ],
        caseStudy: "AlphaDesign: Creating inhibitors for bacterial defense systems.",
        lab: "In-silico Design: Generating a binder for a generic target.",
        requiresGpu: true,
        colabUrl: "https://colab.research.google.com/github/JobAiReady/lagos-bio-design/blob/main/notebooks/Module3_Binder.ipynb",
        lessonContent: {
            summary: `Protein Language Models (PLMs) are the biological equivalent of GPT — trained on millions of protein sequences to learn the "grammar" of biology. Just as GPT predicts the next word in a sentence, ESM-2 and similar models predict the next amino acid in a sequence, building deep representations of protein structure and function.

**Binder design** is the killer application of generative protein engineering. A binder is a protein designed to physically attach to a specific target — like a custom-made lock for a particular key. In medicine, binders are the basis of antibody drugs, diagnostic reagents, and biosensors. RFDiffusion can generate binder backbones by conditioning the diffusion process on a target structure: you specify which surface ("hotspot") you want to bind, and the model hallucinates a complementary protein that grips that surface.

The concept of **"hallucination as a feature"** distinguishes generative biology from traditional AI concerns. In language models, hallucination means generating false information — a bug. In protein design, hallucination means generating structures that have never existed in nature — a feature. The key is *controllable* hallucination: specifying constraints (bind here, fold like this, be this size) while letting the model freely explore the vast space of possible protein structures.`,
            keyTerms: [
                { term: "Protein Language Model (PLM)", definition: "A neural network trained on millions of protein sequences to learn the statistical patterns of amino acid usage. ESM-2, ProtGPT2, and ProGen are examples." },
                { term: "Binder", definition: "A protein designed to physically attach to a specific target surface. The basis for antibody drugs, diagnostics, and biosensors." },
                { term: "Hotspot Residues", definition: "The specific amino acid positions on a target protein's surface that contribute most to binding energy. These are the 'anchors' a binder grips onto." },
                { term: "Interface Energy", definition: "The calculated strength of interaction between a binder and its target. More negative values indicate stronger binding." },
                { term: "Diffusion Model", definition: "A generative AI technique that creates new data by learning to reverse a gradual noising process. Applied to 3D coordinates for protein backbone generation." },
                { term: "pAE (Predicted Aligned Error)", definition: "AlphaFold's metric for how confident it is about the relative positions of different parts of the structure. Low pAE at an interface suggests a real interaction." }
            ],
            readingLinks: [
                { title: "De novo design of protein structure and function with RFdiffusion (Nature, 2023)", url: "https://www.nature.com/articles/s41586-023-06415-8" },
                { title: "ESM-2: Language models of protein sequences at the scale of evolution (Science, 2023)", url: "https://www.science.org/doi/10.1126/science.ade2574" },
                { title: "Protein design with guided discrete diffusion (NeurIPS, 2023)", url: "https://arxiv.org/abs/2305.20009" }
            ],
            preLabQuestions: [
                "How is 'hallucination' in protein design different from hallucination in ChatGPT?",
                "What information does a PLM learn from millions of protein sequences without any 3D structure labels?",
                "Why is binder design considered the most commercially valuable application of generative protein engineering?"
            ]
        },
        labContent: {
            objective: "Design a protein binder that attaches to a specific target surface (e.g., Spike Protein).",
            prerequisites: [
                "Target PDB file (provided)"
            ],
            steps: [
                {
                    title: "Target Prep",
                    description: "Isolate the binding site on the target protein using PyMOL selection tools.",
                    code: "select binding_site, (chain A and resi 400-500)\nsave target_site.pdb, binding_site"
                },
                {
                    title: "Binder Hallucination",
                    description: "Run RFDiffusion in 'binder' mode, specifying the target hotspot.",
                    code: "./scripts/run_inference.py inference.input_pdb=target_site.pdb 'contigmap.contigs=[A1-100/0 50-50]'"
                },
                {
                    title: "Interface Optimization",
                    description: "Use Rosetta or AF3 to optimize the side-chains at the interface for maximum affinity.",
                    code: "python optimize_interface.py --pdb binder_candidate.pdb --iterations 100"
                }
            ],
            deliverable: "A PDB file of the complex showing the binder attached to the target."
        }
    },
    {
        title: "Module 4: Solving African Challenges (Local Context)",
        duration: "Weeks 6-7",
        level: "Applied Project",
        icon: <Globe2 size={20} />,
        color: "bg-green-600",
        description: "Applying the 'Generative-Predictive Loop' to local infectious diseases. We partner conceptually with findings from ACEGID and NIMR to target pathogens relevant to West Africa.",
        topics: [
            "Lassa Fever & Malaria: Structural targets for de novo design.",
            "The 'Validation Gap': Why 19% success rate is revolutionary.",
            "Closed-Loop Systems: Design-Build-Test-Learn cycles.",
            "Validation Strategy: Moving from 'in silico' confidence to 'in vivo' reality."
        ],
        caseStudy: "ACEGID's Lassa Fever rapid test & PfCTMAG Malaria vaccine candidates.",
        lab: "Capstone: Design a novel antigen binder for a Lassa virus glycoprotein.",
        requiresGpu: true,
        colabUrl: "https://colab.research.google.com/github/JobAiReady/lagos-bio-design/blob/main/notebooks/Module4_Capstone.ipynb",
        lessonContent: {
            summary: `Lassa fever kills an estimated 5,000 people annually in West Africa, with Nigeria bearing the heaviest burden. The Lassa virus enters human cells by binding its surface **glycoprotein complex (GPC)** to host receptors. This GPC is the primary target for diagnostic binders and therapeutic antibodies — and it's the target you will design against in this capstone.

The **design-build-test-learn (DBTL) loop** is the engine of modern bioengineering. In the "design" phase, you use RFDiffusion + ProteinMPNN to generate candidate binders. In "build," you would order synthetic DNA encoding your designs (companies like Twist Bioscience can synthesize any sequence for ~$0.07/base). In "test," you express the protein and measure binding affinity. In "learn," you feed the results back into the next design round. Current state-of-the-art achieves a **19% experimental success rate** for computationally designed binders — a number that sounds low but is revolutionary compared to the <0.1% hit rate of traditional screening.

**Epitope mapping** is the critical first step: identifying which region of the GPC surface is conserved across Lassa virus lineages (so your binder works against all strains) and accessible (not buried inside the protein). You'll use sequence conservation analysis and structural visualization to select the optimal binding site before generating candidates.`,
            keyTerms: [
                { term: "GPC (Glycoprotein Complex)", definition: "The surface protein of Lassa virus that mediates entry into human cells. The primary target for diagnostic and therapeutic protein design." },
                { term: "Epitope", definition: "The specific region on a target protein's surface that a binder recognizes and attaches to. A good epitope is conserved, accessible, and functionally important." },
                { term: "DBTL Loop", definition: "Design-Build-Test-Learn — the iterative engineering cycle used in synthetic biology. Each round improves designs based on experimental feedback." },
                { term: "Affinity", definition: "How strongly a binder attaches to its target, measured as a dissociation constant (Kd). Lower Kd = tighter binding. Nanomolar (nM) affinity is typical for good binders." },
                { term: "Conservation", definition: "How unchanged an amino acid position remains across different strains or species. Highly conserved positions are functionally important and make better drug targets." },
                { term: "pAE (inter-chain)", definition: "When AlphaFold predicts a complex, low pAE between chains suggests the model is confident the two proteins truly interact. Used to filter binder candidates." }
            ],
            readingLinks: [
                { title: "ACEGID — African Centre of Excellence for Genomics of Infectious Diseases", url: "https://acegid.org/" },
                { title: "Lassa virus GPC structure (PDB: 5VK2)", url: "https://www.rcsb.org/structure/5VK2" },
                { title: "De novo protein design for diagnostics (Nature Biotechnology, 2024)", url: "https://www.nature.com/articles/s41587-024-02127-2" }
            ],
            preLabQuestions: [
                "Why is it important to target a conserved region of the Lassa GPC rather than any exposed surface?",
                "What does a 19% experimental success rate mean in practical terms — how many candidates should you generate?",
                "How would you validate that your designed binder actually works, beyond computational metrics?"
            ]
        },
        labContent: {
            objective: "Apply your skills to design a potential diagnostic binder for Lassa Virus Glycoprotein (GPC).",
            prerequisites: [
                "Lassa GPC Structure (PDB ID: 5VK2)"
            ],
            steps: [
                {
                    title: "Epitope Mapping",
                    description: "Identify conserved regions on the Lassa GPC that are suitable for binding.",
                    code: "# Analysis of sequence conservation across lineages\npython conservation_analysis.py --alignment lassa_lineages.aln"
                },
                {
                    title: "Mass Generation",
                    description: "Generate 1,000 candidate binders targeting the conserved epitope.",
                    code: "run_batch_generation.sh --target 5VK2_epitope.pdb --count 1000"
                },
                {
                    title: "In-Silico Screening",
                    description: "Filter candidates by pLDDT (>90) and pAE (<5) to find the top 5 designs.",
                    code: "python filter_results.py --dir ./results --min_plddt 90 --max_pae 5"
                }
            ],
            deliverable: "The top 3 candidate sequences ready for DNA synthesis ordering."
        }
    },
    {
        title: "Module 5: Biosecurity, Ethics, & The Future",
        duration: "Week 8",
        level: "Policy & Ethics",
        icon: <ShieldAlert size={20} />,
        color: "bg-red-600",
        description: "Addressing the 'FoldMark' warning. As we gain the power to design life, we must understand the responsibility, especially regarding 'dual-use' research in the Nigerian context.",
        topics: [
            "The 'FoldMark' Paper: Tracking and auditing AI bio-design.",
            "Bioweapons vs. Therapeutics: The dual-use dilemma.",
            "Open vs. Closed Models: The Google DeepMind API restriction debate.",
            "Intellectual Property: Who owns a hallucinated protein?"
        ],
        caseStudy: "Regulatory frameworks for biotech startups in Lagos.",
        lab: "Final Presentation: The 'Pitch' to Lagos Angel Network.",
        requiresGpu: true,
        colabUrl: "https://colab.research.google.com/github/JobAiReady/lagos-bio-design/blob/main/notebooks/Module5_Ethics.ipynb",
        lessonContent: {
            summary: `The power to design novel proteins carries inherent **dual-use risk**. The same tools that create life-saving diagnostics could, in principle, be used to engineer harmful biological agents. The biosecurity community calls this the "dual-use dilemma," and it is the defining ethical challenge of generative biology.

**FoldMark** is a watermarking framework that embeds detectable signatures into AI-designed protein structures — analogous to watermarks in AI-generated images. By analyzing structural features that are statistically unlikely in natural proteins, researchers can determine whether a protein was computationally designed. This is a first step toward auditing and accountability in the era of generative biology.

**Embedding-based screening** is the computational approach you'll use in this lab. Rather than comparing sequences letter-by-letter (like BLAST), you encode proteins as high-dimensional vectors using ESM-2 and measure similarity in embedding space. This catches functional analogs that share no sequence similarity — a critical capability since dangerous proteins can be redesigned to evade traditional sequence-based screening. The Nigerian regulatory landscape for biotech is still evolving, making it essential for the next generation of bio-engineers to understand and advocate for responsible frameworks.`,
            keyTerms: [
                { term: "Dual-Use Research", definition: "Research that could be used for both beneficial and harmful purposes. In biotech, the same protein design tools that create medicines could theoretically create toxins." },
                { term: "FoldMark", definition: "A proposed framework for watermarking AI-designed proteins by embedding detectable structural signatures that distinguish them from natural proteins." },
                { term: "Embedding Space", definition: "A high-dimensional mathematical space where proteins are represented as vectors. Similar proteins cluster together, enabling similarity detection beyond sequence matching." },
                { term: "BLAST", definition: "Basic Local Alignment Search Tool — the traditional method for comparing protein sequences. Fast but misses functional analogs with low sequence similarity." },
                { term: "Biosecurity Screening", definition: "The process of checking designed proteins against databases of known dangerous agents to prevent accidental or intentional creation of harmful biologics." },
                { term: "Responsible Innovation", definition: "The principle that scientists and engineers should anticipate and address the societal implications of their work proactively, not reactively." }
            ],
            readingLinks: [
                { title: "FoldMark: A framework for auditing AI-designed proteins (arXiv, 2024)", url: "https://arxiv.org/abs/2410.05744" },
                { title: "Dual-use concerns in AI-driven protein design (Nature Machine Intelligence, 2024)", url: "https://www.nature.com/articles/s42256-024-00825-3" },
                { title: "Nigeria National Biosafety Management Agency (NBMA)", url: "https://nbma.gov.ng/" }
            ],
            preLabQuestions: [
                "Why might sequence-based screening (BLAST) miss a redesigned dangerous protein?",
                "What are the arguments for and against making protein design tools fully open-source?",
                "How should Nigeria's regulatory framework adapt to the rise of computational protein design?"
            ]
        },
        labContent: {
            objective: "Present your Capstone project as a viable biotech startup pitch.",
            prerequisites: [
                "Completed Capstone Design"
            ],
            steps: [
                {
                    title: "Technical Validation",
                    description: "Compile your in-silico metrics (pLDDT, RMSD, affinity) into a clear data slide.",
                    code: "N/A"
                },
                {
                    title: "Market Analysis",
                    description: "Define the impact of your Lassa diagnostic in the West African context.",
                    code: "N/A"
                },
                {
                    title: "Pitch Deck",
                    description: "Create a 5-slide deck: Problem, Solution (Your Protein), Science, Team, Ask.",
                    code: "N/A"
                }
            ],
            deliverable: "A 5-minute video presentation or PDF slide deck."
        }
    }
];
