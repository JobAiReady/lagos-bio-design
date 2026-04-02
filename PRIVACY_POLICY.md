# Privacy Policy

**Lagos Bio-Design Bootcamp**
**Effective Date: April 2026**
**Operated by: JobAiReady.ai**

---

## 1. What Data We Collect

### Account Data (via Supabase Auth)
When you create an account, we collect:
- **Email address** — used for authentication and password recovery
- **Password** — hashed and stored securely by Supabase (we never see or store plaintext passwords)
- **Access code submission** — verified server-side, not stored after validation

### Usage Data (automatically collected)
- **Lab progress** — which lab steps you have completed, stored per-module
- **Timestamps** — when you signed up and last updated your progress

### Local Storage Data (browser only)
- **Lab progress cache** — a copy of your progress is stored in your browser's `localStorage` for offline access
- This data never leaves your device unless you are signed in, in which case it syncs to Supabase

### Data We Do NOT Collect
- We do not use cookies for tracking or advertising
- We do not collect IP addresses, device fingerprints, or browsing history
- We do not use third-party analytics (no Google Analytics, no Facebook Pixel)
- We do not collect payment information (the bootcamp is currently free)

---

## 2. How We Use Your Data

| Data | Purpose | Legal Basis |
|------|---------|-------------|
| Email address | Account creation, authentication, password recovery | Consent (you provide it voluntarily) |
| Password (hashed) | Authentication | Consent |
| Lab progress | Track your learning journey across sessions and devices | Legitimate interest (core platform function) |

We do **not** use your data for marketing, advertising, profiling, or sale to third parties.

---

## 3. Where Your Data Is Stored

- **Supabase** (backend) — hosted on AWS infrastructure. Your data is stored in a PostgreSQL database with Row Level Security (RLS) enabled, meaning each user can only access their own data.
- **Supabase Auth** — handles authentication. Passwords are hashed using bcrypt before storage.
- **Your browser** — `localStorage` is used to cache progress data locally.

We do not transfer your data to any other third parties.

---

## 4. Data Retention

- **Account data** is retained as long as your account exists
- **Progress data** is retained as long as your account exists
- **Local storage data** persists until you clear your browser data or we update the storage keys

---

## 5. Your Rights

Under the **Nigeria Data Protection Regulation (NDPR 2019)** and applicable data protection laws, you have the right to:

- **Access** — request a copy of the personal data we hold about you
- **Rectification** — request correction of inaccurate data
- **Deletion** — request that we delete your account and all associated data
- **Portability** — request your data in a machine-readable format
- **Withdraw consent** — you can stop using the platform at any time

To exercise any of these rights, contact us at **info@jobaiready.ai**.

We will respond to data requests within **30 days**.

---

## 6. Data Security

We implement the following security measures:
- **Row Level Security (RLS)** on all database tables — users can only access their own data
- **Server-side access code verification** — registration codes are validated via a Supabase RPC function, not exposed to the client
- **bcrypt password hashing** — via Supabase Auth
- **HTTPS/SSL** — all data in transit is encrypted
- **No plaintext secrets in source code** — environment variables are used for all credentials
- **Git history has been purged** of any previously committed secrets

---

## 7. Children's Privacy

This platform is designed for adult learners (18+) enrolled in the Lagos Bio-Design Bootcamp. We do not knowingly collect data from children under 18. If you believe a minor has created an account, contact us at **info@jobaiready.ai** and we will delete the account.

---

## 8. Third-Party Services

| Service | Purpose | Their Privacy Policy |
|---------|---------|---------------------|
| **Supabase** | Authentication, database, storage | [supabase.com/privacy](https://supabase.com/privacy) |
| **Netlify** | Website hosting and CDN | [netlify.com/privacy](https://www.netlify.com/privacy/) |
| **Google Colab** | Notebook execution (user navigates there separately) | [policies.google.com/privacy](https://policies.google.com/privacy) |
| **Google Gemini API** | AI assistant responses (via Supabase Edge Function) | [ai.google.dev/terms](https://ai.google.dev/terms) |

When you use Google Colab, you are subject to Google's privacy policy. We do not control or have access to any data you enter in Colab notebooks.

When you use the AI Assistant, your code context and question are sent to Google's Gemini API via our Supabase Edge Function. We do not store these conversations.

---

## 9. Changes to This Policy

We may update this privacy policy from time to time. Changes will be reflected by updating the "Effective Date" at the top of this document. Continued use of the platform after changes constitutes acceptance of the updated policy.

---

## 10. Contact

For privacy-related questions or data requests:

- **Email**: info@jobaiready.ai
- **GitHub**: [github.com/JobAiReady/lagos-bio-design](https://github.com/JobAiReady/lagos-bio-design)

---

*This privacy policy complies with the Nigeria Data Protection Regulation (NDPR 2019) and follows GDPR best practices.*
