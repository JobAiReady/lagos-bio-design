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
        lab: "Setup: Python, PyMOL, and ColabFold environments.",
        requiresGpu: false,
        colabUrl: "https://colab.research.google.com/github/JobAiReady/lagos-bio-design/blob/main/notebooks/Module1_Setup.ipynb",
        labContent: {
            objective: "Initialize your cloud-based bio-design environment and visualize your first protein structure.",
            prerequisites: [
                "Google Account (for Colab)",
                "PyMOL 2.5+ installed locally",
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
                    description: "Download the .pdb file and open it in PyMOL. Color by pLDDT (confidence).",
                    code: "# In PyMOL command line:\nload results/insulin_rank1.pdb\nspectrum b, rainbow_rev, minimum=50, maximum=90"
                }
            ],
            deliverable: "A screenshot of your PyMOL workspace showing the insulin structure colored by confidence."
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
