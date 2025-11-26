INSTRUCTIONS:

I’d like you to provide a comprehensive evaluation of this teaching course:
I've designed a comprehensive course curriculum packaged as a modern, interactive web application. This "Lagos Bio-Design Bootcamp" portal integrates the cutting-edge scientific updates (like AlphaDesign, APM, and the 7-part toolkit) with the specific ecosystem of Lagos (Yaba, NIMR, ACEGID).

It features an interactive syllabus, local case studies (Lassa fever, Malaria), and a "Lab" section that connects the Generative AI concepts directly to African health challenges.

This course is designed to be the foundational pillar for my JobAiReady.ai project, which will serve as the intelligent, AI-driven layer that powers and extends our main platform at JobAiReady.com. JobAiReady.ai will sit over JobAiReady.com—the LMS for the AI Literacy Bootcamp and other AI-related courses—as the umbrella ecosystem that delivers personalized, AI-enhanced learning experiences, insights, and tools across all our programs.


import React, { useState } from 'react';
import { 
  Dna, 
  Microscope, 
  Cpu, 
  BookOpen, 
  MapPin, 
  Calendar, 
  ChevronDown, 
  ChevronUp, 
  FlaskConical, 
  ShieldAlert, 
  Globe2,
  Award,
  Zap,
  CheckCircle2
} from 'lucide-react';

const CourseModule = ({ module, isOpen, toggle }) => {
  return (
    <div className="border border-green-100 rounded-lg mb-4 overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-white">
      <button 
        onClick={toggle}
        className="w-full flex items-center justify-between p-5 bg-white hover:bg-green-50/50 transition-colors text-left"
      >
        <div className="flex items-center gap-4">
          <div className={`p-2 rounded-full ${module.color} text-white`}>
            {module.icon}
          </div>
          <div>
            <h3 className="font-bold text-lg text-gray-900">{module.title}</h3>
            <p className="text-sm text-gray-500">{module.duration} • {module.level}</p>
          </div>
        </div>
        {isOpen ? <ChevronUp className="text-gray-400" /> : <ChevronDown className="text-gray-400" />}
      </button>
      
      {isOpen && (
        <div className="p-5 border-t border-green-100 bg-gray-50">
          <p className="mb-4 text-gray-700 leading-relaxed">{module.description}</p>
          
          <div className="bg-white p-4 rounded-md border border-gray-200 mb-4">
            <h4 className="font-semibold text-sm uppercase tracking-wide text-gray-500 mb-2">Core Competencies</h4>
            <ul className="space-y-2">
              {module.topics.map((topic, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                  <CheckCircle2 size={16} className="text-green-600 mt-0.5 shrink-0" />
                  <span>{topic}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-center justify-between mt-4 text-sm">
            <div className="flex items-center gap-2 text-blue-700 font-medium">
              <span className="bg-blue-100 px-2 py-1 rounded">Case Study</span>
              {module.caseStudy}
            </div>
            {module.lab && (
              <span className="flex items-center gap-1 text-orange-600 font-medium">
                <FlaskConical size={16} />
                {module.lab}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default function LagosBioBootcamp() {
  const [openModule, setOpenModule] = useState(0);
  const [activeTab, setActiveTab] = useState('curriculum');

  const modules = [
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
      lab: "Setup: Python, PyMOL, and ColabFold environments."
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
      lab: "Pipeline Construction: Linking RFDiffusion output to ProteinMPNN."
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
      lab: "In-silico Design: Generating a binder for a generic target."
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
      lab: "Capstone: Design a novel antigen binder for a Lassa virus glycoprotein."
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
      lab: "Final Presentation: The 'Pitch' to Lagos Angel Network."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-gray-800">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-2">
              <Dna className="text-green-600" size={32} />
              <span className="font-bold text-xl tracking-tight text-gray-900">
                Lagos<span className="text-green-600">Bio</span>Design
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm font-medium">
              <button 
                onClick={() => setActiveTab('curriculum')}
                className={`${activeTab === 'curriculum' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-500 hover:text-gray-900'} h-16 px-2`}
              >
                Curriculum
              </button>
              <button 
                onClick={() => setActiveTab('mission')}
                className={`${activeTab === 'mission' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-500 hover:text-gray-900'} h-16 px-2`}
              >
                Mission
              </button>
              <button className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors shadow-sm">
                Apply for Batch '26
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-16 sm:px-6 lg:px-8 text-center sm:text-left flex flex-col sm:flex-row items-center gap-12">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-800 text-xs font-semibold uppercase tracking-wider mb-6">
              <MapPin size={14} /> Yaba Tech Cluster, Lagos
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight mb-6">
              Engineering Life, <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-teal-500">
                From Code to Cure.
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl leading-relaxed">
              Master the Nobel Prize-winning science of <strong>Generative Protein Design</strong>. 
              Join the first bootcamp in West Africa teaching AlphaFold, RFDiffusion, and the creation of novel medicines for local challenges.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button className="flex items-center justify-center gap-2 bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 transition-all shadow-lg hover:shadow-green-500/20">
                <BookOpen size={20} /> View Syllabus
              </button>
              <button className="flex items-center justify-center gap-2 bg-white text-gray-700 border border-gray-300 px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-all">
                Download Brochure
              </button>
            </div>
          </div>
          
          <div className="flex-1 w-full max-w-md">
            <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-2xl p-6 border border-green-100 shadow-inner relative overflow-hidden">
               {/* Abstract decorative elements representing protein folding */}
               <div className="absolute top-0 right-0 w-32 h-32 bg-green-200/30 rounded-full blur-2xl -mr-10 -mt-10"></div>
               <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-200/30 rounded-full blur-2xl -ml-10 -mb-10"></div>
               
               <h3 className="font-bold text-gray-900 mb-4 relative z-10">Why This Course?</h3>
               <ul className="space-y-4 relative z-10">
                 <li className="flex gap-3 text-sm text-gray-700 bg-white/60 p-3 rounded-lg backdrop-blur-sm">
                   <Microscope className="text-blue-600 shrink-0" size={20} />
                   <span><strong>Nobel Science:</strong> Based on the 2024 breakthroughs by Baker, Hassabis, & Jumper.</span>
                 </li>
                 <li className="flex gap-3 text-sm text-gray-700 bg-white/60 p-3 rounded-lg backdrop-blur-sm">
                   <Cpu className="text-purple-600 shrink-0" size={20} />
                   <span><strong>Generative AI:</strong> Move beyond ChatGPT to models that "hallucinate" new cures.</span>
                 </li>
                 <li className="flex gap-3 text-sm text-gray-700 bg-white/60 p-3 rounded-lg backdrop-blur-sm">
                   <Globe2 className="text-green-600 shrink-0" size={20} />
                   <span><strong>Local Focus:</strong> Design solutions for Lassa Fever, Malaria, and local agriculture.</span>
                 </li>
               </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {activeTab === 'curriculum' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            
            {/* Left: Syllabus */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Course Syllabus</h2>
                  <p className="text-gray-500 mt-1">8 Weeks • Hybrid (Yaba & Online)</p>
                </div>
                <div className="text-right hidden sm:block">
                  <span className="block text-sm font-semibold text-green-600">Next Cohort</span>
                  <span className="block text-gray-900">Feb 15, 2026</span>
                </div>
              </div>

              {modules.map((mod, index) => (
                <CourseModule 
                  key={index} 
                  module={mod} 
                  isOpen={openModule === index} 
                  toggle={() => setOpenModule(index === openModule ? -1 : index)} 
                />
              ))}
            </div>

            {/* Right: Sidebar Info */}
            <div className="lg:col-span-1 space-y-8">
              
              {/* Stats Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-bold text-gray-900 mb-4">Course Outcomes</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Python & PyMOL</span>
                      <span className="font-semibold text-green-600">Advanced</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{width: "90%"}}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">AlphaFold / RFDiffusion</span>
                      <span className="font-semibold text-blue-600">Proficient</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{width: "85%"}}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Wet Lab Validation</span>
                      <span className="font-semibold text-purple-600">Conceptual</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="bg-purple-500 h-2 rounded-full" style={{width: "70%"}}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Partners Card */}
              <div className="bg-slate-900 text-white rounded-xl shadow-lg p-6 relative overflow-hidden">
                <div className="relative z-10">
                  <h3 className="font-bold text-lg mb-2">Industry Partners</h3>
                  <p className="text-slate-300 text-sm mb-4">
                    Curriculum developed with insights from researchers connected to:
                  </p>
                  <ul className="space-y-2 text-sm text-slate-300">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                      ACEGID (Infectious Diseases)
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                      NIMR (Medical Research)
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                      CcHub (Innovation Support)
                    </li>
                  </ul>
                </div>
                {/* Decorative background circle */}
                <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-green-600 rounded-full opacity-20 blur-2xl"></div>
              </div>

              {/* Application CTA */}
              <div className="bg-green-50 border border-green-100 rounded-xl p-6">
                 <h3 className="font-bold text-green-900 mb-2">Ready to Build?</h3>
                 <p className="text-sm text-green-700 mb-4">
                   Ideal for Computer Science grads, Pharmacists, and Bio-engineers in Lagos.
                 </p>
                 <button className="w-full bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 transition-colors">
                   Start Application
                 </button>
              </div>

            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                The bottleneck in protein engineering is no longer design—it is <strong>validation</strong>. 
                Africa bears a disproportionate burden of infectious diseases, yet historically has had limited capacity for de novo drug discovery.
              </p>
              <p className="text-lg text-gray-700 mb-8 leading-relaxed">
                This bootcamp aims to democratize the "God-like" power of protein design. By training 
                Lagosian engineers in the "Design-Build-Test-Learn" loop, we aim to move from 
                importing solutions to <strong>generating</strong> them locally.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
                <div className="p-6 bg-blue-50 rounded-lg border border-blue-100">
                  <h3 className="font-bold text-blue-900 mb-2">The "Hallucination" Gap</h3>
                  <p className="text-sm text-blue-800">
                    We teach you how to use AI to "hallucinate" novel proteins that don't exist in nature, 
                    aiming for the revolutionary 19% success rate seen in recent global studies.
                  </p>
                </div>
                <div className="p-6 bg-purple-50 rounded-lg border border-purple-100">
                  <h3 className="font-bold text-purple-900 mb-2">Structure-Aware Tokens</h3>
                  <p className="text-sm text-purple-800">
                    Move beyond simple sequence analysis. Learn to use 3D "tokens" (SaProt) that bake 
                    structural information directly into the generative process.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="bg-gray-900 text-gray-400 py-12 border-t border-gray-800">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <div className="flex justify-center items-center gap-2 mb-6">
            <Dna className="text-green-600" size={24} />
            <span className="font-bold text-lg text-white">LagosBioDesign</span>
          </div>
          <p className="text-sm mb-6">
            © 2026 Lagos Bio-Design Bootcamp. Empowering the Yaba Ecosystem.
          </p>
          <div className="flex justify-center gap-6 text-sm">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Contact Faculty</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
