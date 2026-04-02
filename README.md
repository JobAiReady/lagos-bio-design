# Lagos Bio-Design Bootcamp Platform 🧬

> An interactive educational platform for learning generative protein design and computational biology

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-19.2.0-blue)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-7.2.4-purple)](https://vitejs.dev/)

## 🌍 About

The Lagos Bio-Design Bootcamp is an 8-week intensive program teaching cutting-edge protein engineering using AI-driven design tools. This platform provides:

- **Interactive Curriculum**: 5 comprehensive modules covering AlphaFold, RFDiffusion, and ProteinMPNN
- **Browser-Based Lab**: Python environment powered by Pyodide
- **AI Assistant**: Context-aware help for debugging and learning
- **Community Gallery**: Share and explore protein designs

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- [Supabase](https://supabase.com/) account
- Modern web browser (Chrome, Firefox, Safari)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/JobAiReady/lagos-bio-design.git
   cd lagos-bio-design
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

4. **Run database migrations**:
   - Open Supabase SQL Editor
   - Copy and run SQL from `supabase_migration.sql`

5. **Start development server**:
   ```bash
   npm run dev
   ```

6. **Open browser**:
   Navigate to `http://localhost:5173`

## 📁 Project Structure

```
lagos-bio-design/
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── AuthModal.jsx
│   │   ├── AiAssistant.jsx
│   │   └── LabDetail.jsx
│   ├── pages/            # Route pages
│   │   ├── LagosBioBootcamp.jsx
│   │   ├── Workspace.jsx
│   │   └── Gallery.jsx
│   ├── hooks/            # Custom React hooks
│   │   └── useAiBrain.js
│   ├── lib/              # External integrations
│   │   ├── supabase.js
│   │   ├── gallery.js
│   │   └── ai/
│   ├── utils/            # Utility functions
│   │   └── pyodideManager.js
│   └── data/             # Static data
│       └── modules.jsx
├── public/               # Static assets
├── supabase_migration.sql
├── package.json
└── vite.config.js
```

## 🛠️ Tech Stack

- **Frontend**: React 19, React Router v7
- **Build Tool**: Vite 7
- **Styling**: TailwindCSS v4
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Icons**: Lucide React
- **Python Runtime**: Pyodide (WebAssembly)

## 📚 Key Features

### 1. Interactive Curriculum
Browse 5 modules covering:
- Nobel Prize-winning protein design paradigms
- AI-driven design toolkit (AlphaFold, RFDiffusion, ProteinMPNN)
- Generative AI and diffusion models
- African biotech challenges (Lassa fever, malaria)
- Ethics and biosecurity

### 2. Browser-Based Lab
- Python 3.11 runtime via Pyodide
- Pre-loaded bio-design libraries (simulated)
- Real-time code execution
- Terminal output with syntax highlighting

### 3. AI Assistant
- Context-aware code help
- Error detection and explanation
- Extensible architecture (LLM-ready)

### 4. Progress Tracking
- Per-module completion tracking
- Synced across devices (Supabase)
- Offline support (localStorage fallback)

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

## 🚢 Deployment

### Build for Production

```bash
npm run build
# Output in /dist folder
```

### Deploy to Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod
```

### Environment Variables

Configure these in your deployment platform:

- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anon key
- `VITE_ACCESS_CODE` - Registration access code

## 📖 Documentation

- [Codebase Assessment](docs/CODEBASE_ASSESSMENT.md) - Complete code review
- [Remediation Roadmap](docs/REMEDIATION_ROADMAP.md) - Improvement plan
- [Security Checklist](docs/SECURITY_CHECKLIST.md) - Security guidelines
- [Test Strategy](docs/TEST_STRATEGY.md) - Testing approach
- [Quick Start Guide](docs/QUICK_START_GUIDE.md) - Getting started

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure:
- All tests pass (`npm test`)
- Code follows ESLint rules (`npm run lint`)
- New features include tests
- Documentation is updated

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

For third-party tool attributions (AlphaFold, RFDiffusion, ProteinMPNN, ESM-2, PDB data), see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## 👥 Team

**Project Lead**: JobAiReady.ai  
**Contributors**: See [GitHub Contributors](https://github.com/JobAiReady/lagos-bio-design/graphs/contributors)

## 📧 Contact

- **Website**: [https://jobaiready.ai](https://jobaiready.ai)
- **Email**: info@jobaiready.ai
- **Issues**: [GitHub Issues](https://github.com/JobAiReady/lagos-bio-design/issues)

## 🙏 Acknowledgments

- **AlphaFold** (Google DeepMind / EMBL-EBI) — structure prediction and database (CC-BY-4.0)
- **RFDiffusion** (Baker Lab, UW) — backbone generation (BSD-3-Clause)
- **ProteinMPNN** (Dauparas et al.) — inverse folding (MIT)
- **ESM-2 & ESMFold** (Meta AI) — protein language model and structure prediction (MIT)
- **RCSB PDB** — protein structure data (public domain)
- Built for the Lagos tech ecosystem
- Powered by Supabase and modern web technologies
- Special thanks to the Nigerian biotech community

## 🔐 Security

Found a security vulnerability? Please email security@jobaiready.ai instead of using the issue tracker.

## 📊 Current Status

**Live at**: [bootcamp.jobaiready.ai](https://bootcamp.jobaiready.ai)

- [x] Security remediation (Phase 1)
- [x] 64/64 tests passing
- [x] Production deployment with SSL
- [x] 5 GPU-enabled Colab notebooks
- [x] Instructional lesson layer (Option D)

---

Made with ❤️ in Lagos, Nigeria 🇳🇬
