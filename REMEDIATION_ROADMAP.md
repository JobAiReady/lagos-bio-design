# Remediation Roadmap - Lagos Bio-Design Bootcamp Platform

**Status**: 🔴 Critical Issues Present - Not Production Ready  
**Target**: ✅ Production Ready in 2-3 Weeks  
**Last Updated**: November 26, 2025

---

## Quick Links

- 📊 [Progress Tracker](#progress-tracker)
- 🔴 [Phase 1: Critical Fixes (Week 1)](#phase-1-critical-fixes-week-1)
- 🟠 [Phase 2: High Priority (Week 2)](#phase-2-high-priority-week-2)
- 🟡 [Phase 3: Medium Priority (Week 3)](#phase-3-medium-priority-week-3)
- 🟢 [Phase 4: Technical Debt (Ongoing)](#phase-4-technical-debt-ongoing)

---

## Progress Tracker

### Overall Status: 0% Complete

| Phase | Priority | Items | Completed | Progress |
|-------|----------|-------|-----------|----------|
| Phase 1 | Critical | 8 | 0 | ⬜⬜⬜⬜⬜⬜⬜⬜ 0% |
| Phase 2 | High | 7 | 0 | ⬜⬜⬜⬜⬜⬜⬜ 0% |
| Phase 3 | Medium | 6 | 0 | ⬜⬜⬜⬜⬜⬜ 0% |
| Phase 4 | Low | 5 | 0 | ⬜⬜⬜⬜⬜ 0% |

**Total**: 0/26 tasks completed

---

## Phase 1: Critical Fixes (Week 1)

**Deadline**: Complete within 3-5 days  
**Blockers**: Deployment cannot proceed until all items complete

### ✅ Task Checklist

- [ ] **1.1** Remove `.env` from Git History
- [ ] **1.2** Regenerate Supabase Credentials
- [ ] **1.3** Add Missing Database Table
- [ ] **1.4** Implement Server-Side Validation
- [ ] **1.5** Secure Environment Variables
- [ ] **1.6** Verify SSH Keys Security
- [ ] **1.7** Add Input Sanitization
- [ ] **1.8** Configure RLS Policies

---

### 1.1 Remove `.env` from Git History 🔴

**Priority**: CRITICAL  
**Effort**: 30 minutes  
**Risk**: High - Credentials exposed publicly

#### Problem
```bash
# Currently exposed in repository
c:\dev\LBD\.env
VITE_SUPABASE_URL=https://hvxkrsxckbslotqopodz.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_bSsZ2LSGTrVvL0ZRYtuh6g_R9UqWVkW
VITE_ACCESS_CODE=your_cohort_code_here
```

#### Solution Steps

1. **Remove file from Git history**:
```bash
# Using git filter-branch (nuclear option)
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all

# Or using BFG Repo-Cleaner (recommended)
java -jar bfg.jar --delete-files .env
git reflog expire --expire=now --all && git gc --prune=now --aggressive
```

2. **Force push** (⚠️ WARNING: Coordinate with team first):
```bash
git push origin --force --all
git push origin --force --tags
```

3. **Verify removal**:
```bash
git log --all --full-history -- .env
```

#### Files to Update
- `.gitignore` - Ensure `.env` is listed
- Add `.env.example` for documentation

---

### 1.2 Regenerate Supabase Credentials 🔴

**Priority**: CRITICAL  
**Effort**: 15 minutes  
**Dependency**: Must complete after 1.1

#### Steps

1. **Login to Supabase Dashboard**:
   - Navigate to: https://app.supabase.com
   - Select your project

2. **Regenerate Anon Key**:
   - Go to Settings > API
   - Click "Regenerate" next to `anon` public key
   - Copy new key immediately

3. **Update Environment Variables**:
```bash
# Create new .env file (local only)
VITE_SUPABASE_URL=https://hvxkrsxckbslotqopodz.supabase.co
VITE_SUPABASE_ANON_KEY=[NEW_KEY_HERE]
VITE_ACCESS_CODE=[NEW_SECURE_CODE]
```

4. **Update Deployment Secrets**:
   - Netlify/Vercel: Update environment variables
   - Document the change in deployment logs

5. **Invalidate Old Keys**:
   - Confirm old anon key no longer works
   - Test application with new credentials

---

### 1.3 Add Missing Database Table 🔴

**Priority**: CRITICAL  
**Effort**: 1 hour  
**Impact**: Progress tracking currently broken

#### Problem
Code references `user_progress` table that doesn't exist:
```jsx
// src/pages/LagosBioBootcamp.jsx:142-145
const { data } = await supabase
  .from('user_progress') // ❌ Table not defined
  .select('module_id, completed_steps')
```

#### Solution

1. **Create migration file**:

```sql
-- File: supabase_migrations/001_add_user_progress.sql

-- User Progress Tracking
create table if not exists public.user_progress (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  module_id text not null,
  completed_steps integer[] default '{}',
  
  -- Metadata
  started_at timestamptz default now(),
  updated_at timestamptz default now(),
  
  -- Ensure one progress record per user per module
  unique(user_id, module_id)
);

-- Indexes for performance
create index idx_user_progress_user_id on public.user_progress(user_id);
create index idx_user_progress_module_id on public.user_progress(module_id);

-- Row Level Security
alter table public.user_progress enable row level security;

-- Policies
create policy "Users can view own progress"
  on public.user_progress
  for select
  using (auth.uid() = user_id);

create policy "Users can insert own progress"
  on public.user_progress
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update own progress"
  on public.user_progress
  for update
  using (auth.uid() = user_id);

-- Trigger to update updated_at
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_user_progress_updated_at
  before update on public.user_progress
  for each row
  execute function update_updated_at_column();
```

2. **Apply migration**:
   - Run in Supabase SQL Editor
   - Test with sample data
   - Verify RLS policies work

3. **Update code to handle migration**:
```jsx
// Add migration check in LagosBioBootcamp.jsx
useEffect(() => {
  const verifyProgressTable = async () => {
    try {
      await supabase.from('user_progress').select('count').limit(1);
    } catch (error) {
      console.error('user_progress table not found. Please run migrations.');
    }
  };
  verifyProgressTable();
}, []);
```

---

### 1.4 Implement Server-Side Validation 🔴

**Priority**: CRITICAL  
**Effort**: 2-3 hours  
**Security**: Access code currently client-side only

#### Current Vulnerability
```jsx
// src/components/AuthModal.jsx:25
if (accessCode !== import.meta.env.VITE_ACCESS_CODE) {
  throw new Error('Invalid Access Code');
}
// ⚠️ Easily bypassed via browser console
```

#### Solution: Supabase Edge Function

1. **Create Edge Function**:

```typescript
// supabase/functions/verify-access-code/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { accessCode } = await req.json()
    
    // Verify against server-side secret
    const validCode = Deno.env.get('ACCESS_CODE')
    
    if (accessCode !== validCode) {
      return new Response(
        JSON.stringify({ error: 'Invalid access code' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }
    
    return new Response(
      JSON.stringify({ valid: true }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
    
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
```

2. **Deploy Edge Function**:
```bash
supabase functions deploy verify-access-code --no-verify-jwt
```

3. **Update Frontend**:
```jsx
// src/components/AuthModal.jsx
const handleAuth = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError(null);

  try {
    if (isSignUp) {
      // Verify access code server-side
      const { data: verification, error: verifyError } = await supabase.functions
        .invoke('verify-access-code', {
          body: { accessCode }
        });
      
      if (verifyError || !verification.valid) {
        throw new Error('Invalid Access Code');
      }

      // Proceed with signup
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) throw error;
      setShowSuccess(true);
    } else {
      // ... rest of signin logic
    }
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};
```

---

### 1.5 Secure Environment Variables 🔴

**Priority**: CRITICAL  
**Effort**: 30 minutes

#### Create `.env.example`

```bash
# File: .env.example
# Copy this to .env and fill in your values
# NEVER commit .env to Git

# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# Application Configuration
VITE_ACCESS_CODE=your_secret_code_here

# Optional: Environment
VITE_ENV=development
```

#### Update `.gitignore`

```bash
# File: .gitignore (add these lines)

# Environment variables
.env
.env.local
.env.production
.env.development
.env.*.local

# SSH Keys (keep these)
deploy_key
deploy_key.pub
*.pem

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db
```

#### Create Setup Documentation

```markdown
# File: SETUP.md

## Environment Setup

1. Copy environment template:
   ```bash
   cp .env.example .env
   ```

2. Get your Supabase credentials:
   - Visit https://app.supabase.com
   - Select your project
   - Go to Settings > API
   - Copy `URL` and `anon` public key

3. Fill in `.env`:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key
   VITE_ACCESS_CODE=your_cohort_code_here
   ```

4. Install dependencies:
   ```bash
   npm install
   ```

5. Run development server:
   ```bash
   npm run dev
   ```
```

---

### 1.6 Verify SSH Keys Security 🔴

**Priority**: CRITICAL  
**Effort**: 15 minutes

#### Check Git History

```bash
# Search for deploy keys in history
git log --all --full-history -- deploy_key
git log --all --full-history -- deploy_key.pub

# If found in history, remove them
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch deploy_key deploy_key.pub" \
  --prune-empty --tag-name-filter cat -- --all
```

#### Regenerate if Compromised

```bash
# Generate new deploy key
ssh-keygen -t ed25519 -C "lagos-bio-deploy" -f deploy_key

# Update deployment service with new public key
cat deploy_key.pub
```

#### Update `.gitignore`

```bash
# Ensure these are ignored
deploy_key
deploy_key.pub
*.pem
*.key
```

---

### 1.7 Add Input Sanitization 🔴

**Priority**: CRITICAL  
**Effort**: 1 hour

#### Install Sanitization Library

```bash
npm install dompurify isomorphic-dompurify
npm install --save-dev @types/dompurify
```

#### Create Sanitization Utility

```javascript
// File: src/utils/sanitize.js

import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitize HTML content to prevent XSS attacks
 */
export const sanitizeHtml = (dirty) => {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href', 'target', 'rel']
  });
};

/**
 * Sanitize plain text (strip all HTML)
 */
export const sanitizeText = (text) => {
  return DOMPurify.sanitize(text, { ALLOWED_TAGS: [] });
};

/**
 * Validate and sanitize email
 */
export const sanitizeEmail = (email) => {
  const sanitized = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(sanitized) ? sanitized : null;
};

/**
 * Sanitize array of tags
 */
export const sanitizeTags = (tags) => {
  return tags
    .map(tag => sanitizeText(tag).trim())
    .filter(tag => tag.length > 0 && tag.length <= 50)
    .slice(0, 10); // Max 10 tags
};
```

#### Apply Sanitization

```jsx
// File: src/components/PublishModal.jsx

import { sanitizeText, sanitizeTags } from '../utils/sanitize';

const handlePublish = async (e) => {
  e.preventDefault();
  setIsPublishing(true);
  setError(null);

  try {
    // Sanitize all user inputs
    const sanitizedTitle = sanitizeText(title).slice(0, 200);
    const sanitizedDescription = sanitizeText(description).slice(0, 1000);
    const sanitizedTags = sanitizeTags(tags.split(','));

    if (!sanitizedTitle || !sanitizedDescription) {
      throw new Error('Title and description are required');
    }

    const design = {
      user_id: user.id,
      title: sanitizedTitle,
      description: sanitizedDescription,
      tags: sanitizedTags,
      run_id: runData?.id,
      metrics: runData?.metrics,
      thumbnail_url: 'https://placehold.co/600x400/0f172a/10b981?text=Protein+Structure',
      is_public: true
    };

    await publishDesign(design);
    onPublishSuccess();
    onClose();
  } catch (err) {
    console.error('Publish error:', err);
    setError('Failed to publish. Please try again.');
  } finally {
    setIsPublishing(false);
  }
};
```

---

### 1.8 Configure RLS Policies 🔴

**Priority**: CRITICAL  
**Effort**: 1 hour

#### Audit Current Policies

```sql
-- Check existing policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public';
```

#### Add Missing Policies

```sql
-- File: supabase_migrations/002_fix_rls_policies.sql

-- Lab Runs: Add delete policy
create policy "Users can delete own runs"
  on public.lab_runs
  for delete
  using (auth.uid() = user_id);

-- Protein Gallery: Separate read/write policies
drop policy if exists "Users manage own gallery items" on public.protein_gallery;

create policy "Users can insert own designs"
  on public.protein_gallery
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update own designs"
  on public.protein_gallery
  for update
  using (auth.uid() = user_id);

create policy "Users can delete own designs"
  on public.protein_gallery
  for delete
  using (auth.uid() = user_id);

-- Add rate limiting function
create or replace function check_rate_limit(user_id uuid, action_type text, max_per_minute int)
returns boolean as $$
declare
  recent_count int;
begin
  select count(*) into recent_count
  from public.lab_runs
  where user_id = $1
    and started_at > now() - interval '1 minute';
  
  return recent_count < max_per_minute;
end;
$$ language plpgsql security definer;
```

---

## Phase 2: High Priority (Week 2)

**Deadline**: Complete within 5-7 days  
**Goal**: Establish quality assurance foundation

### ✅ Task Checklist

- [ ] **2.1** Set Up Testing Framework
- [ ] **2.2** Write Critical Unit Tests
- [ ] **2.3** Add TypeScript Configuration
- [ ] **2.4** Create Comprehensive README
- [ ] **2.5** Implement Error Logging
- [ ] **2.6** Add Database Indexes
- [ ] **2.7** Set Up CI/CD Pipeline

---

### 2.1 Set Up Testing Framework 🟠

**Priority**: HIGH  
**Effort**: 2 hours

#### Install Dependencies

```bash
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

#### Create Vitest Configuration

```javascript
// File: vitest.config.js

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/tests/setup.js',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/tests/',
        '**/*.config.js',
        '**/dist/**'
      ]
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
```

#### Create Test Setup File

```javascript
// File: src/tests/setup.js

import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest matchers
expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock environment variables
vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co');
vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-key');
vi.stubEnv('VITE_ACCESS_CODE', 'TEST-CODE');
```

#### Update package.json

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint .",
    "preview": "vite preview",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

---

### 2.2 Write Critical Unit Tests 🟠

**Priority**: HIGH  
**Effort**: 4-6 hours  
**Target**: 50% coverage on critical paths

#### Test: Sanitization Utility

```javascript
// File: src/utils/sanitize.test.js

import { describe, it, expect } from 'vitest';
import { sanitizeText, sanitizeHtml, sanitizeEmail, sanitizeTags } from './sanitize';

describe('sanitizeText', () => {
  it('should remove HTML tags', () => {
    expect(sanitizeText('<script>alert("xss")</script>Hello'))
      .toBe('Hello');
  });

  it('should trim whitespace', () => {
    expect(sanitizeText('  Hello World  '))
      .toBe('Hello World');
  });

  it('should handle empty string', () => {
    expect(sanitizeText('')).toBe('');
  });
});

describe('sanitizeEmail', () => {
  it('should validate correct email', () => {
    expect(sanitizeEmail('user@example.com'))
      .toBe('user@example.com');
  });

  it('should reject invalid email', () => {
    expect(sanitizeEmail('not-an-email')).toBeNull();
  });

  it('should lowercase and trim', () => {
    expect(sanitizeEmail('  USER@EXAMPLE.COM  '))
      .toBe('user@example.com');
  });
});

describe('sanitizeTags', () => {
  it('should sanitize array of tags', () => {
    const result = sanitizeTags(['Tag1', '<script>xss</script>', '  Tag2  ']);
    expect(result).toEqual(['Tag1', '', 'Tag2']);
  });

  it('should limit to 10 tags', () => {
    const tags = Array(15).fill('tag');
    expect(sanitizeTags(tags)).toHaveLength(10);
  });

  it('should enforce max length of 50 chars', () => {
    const longTag = 'a'.repeat(100);
    expect(sanitizeTags([longTag])).toEqual([]);
  });
});
```

#### Test: useAiBrain Hook

```javascript
// File: src/hooks/useAiBrain.test.js

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAiBrain } from './useAiBrain';

describe('useAiBrain', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with welcome message', () => {
    const { result } = renderHook(() => useAiBrain());
    
    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].role).toBe('assistant');
    expect(result.current.isThinking).toBe(false);
  });

  it('should add user message and get AI response', async () => {
    const { result } = renderHook(() => useAiBrain());
    
    act(() => {
      result.current.sendMessage('Hello', { code: '', logs: [], activeFile: 'test.py' });
    });

    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[1].role).toBe('user');
    expect(result.current.isThinking).toBe(true);

    await waitFor(() => {
      expect(result.current.isThinking).toBe(false);
    }, { timeout: 2000 });

    expect(result.current.messages).toHaveLength(3);
    expect(result.current.messages[2].role).toBe('assistant');
  });

  it('should detect errors in logs', async () => {
    const { result } = renderHook(() => useAiBrain());
    
    const context = {
      code: 'print("test")',
      logs: ['Error: SyntaxError on line 5'],
      activeFile: 'script.py'
    };

    act(() => {
      result.current.sendMessage('What went wrong?', context);
    });

    await waitFor(() => {
      expect(result.current.isThinking).toBe(false);
    });

    const lastMessage = result.current.messages[result.current.messages.length - 1];
    expect(lastMessage.text).toContain('Syntax Error');
  });
});
```

#### Test: AuthModal Component

```javascript
// File: src/components/AuthModal.test.jsx

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AuthModal from './AuthModal';
import { supabase } from '../lib/supabase';

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
    },
    functions: {
      invoke: vi.fn(),
    }
  }
}));

describe('AuthModal', () => {
  it('should render when open', () => {
    render(<AuthModal isOpen={true} onClose={() => {}} />);
    expect(screen.getByText('Welcome Back')).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    const { container } = render(<AuthModal isOpen={false} onClose={() => {}} />);
    expect(container.firstChild).toBeNull();
  });

  it('should toggle between sign in and sign up', () => {
    render(<AuthModal isOpen={true} onClose={() => {}} />);
    
    expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    
    fireEvent.click(screen.getByText('Sign Up'));
    
    expect(screen.getByText('Create Account')).toBeInTheDocument();
    expect(screen.getByText('Access Code')).toBeInTheDocument();
  });

  it('should call signIn on form submit', async () => {
    supabase.auth.signInWithPassword.mockResolvedValue({ error: null });
    
    const onClose = vi.fn();
    render(<AuthModal isOpen={true} onClose={onClose} />);
    
    fireEvent.change(screen.getByPlaceholderText('name@example.com'), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'password123' }
    });
    
    fireEvent.submit(screen.getByRole('button', { name: /sign in/i }).closest('form'));
    
    await waitFor(() => {
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      });
    });
  });
});
```

---

### 2.3 Add TypeScript Configuration 🟠

**Priority**: HIGH  
**Effort**: 1 hour (initial setup)

#### Install TypeScript

```bash
npm install --save-dev typescript @types/react @types/react-dom @types/node
```

#### Create tsconfig.json

```json
// File: tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    
    /* Path aliases */
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

#### Create tsconfig.node.json

```json
// File: tsconfig.node.json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts", "vitest.config.ts"]
}
```

#### Enable Gradual Migration

```javascript
// File: jsconfig.json (for JS files during migration)
{
  "compilerOptions": {
    "checkJs": true,
    "jsx": "react-jsx",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

#### Rename First File

```bash
# Start with utilities
mv src/utils/sanitize.js src/utils/sanitize.ts

# Add type definitions
# Then gradually convert other files
```

---

### 2.4 Create Comprehensive README 🟠

**Priority**: HIGH  
**Effort**: 2 hours

#### Update README.md

```markdown
# Lagos Bio-Design Bootcamp Platform

> An interactive educational platform for learning generative protein design and computational biology

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-19.2.0-blue)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-7.2.4-purple)](https://vitejs.dev/)

## 🧬 About

The Lagos Bio-Design Bootcamp is an 8-week intensive program teaching cutting-edge protein engineering using AI-driven design tools. This platform provides:

- **Interactive Curriculum**: 5 comprehensive modules covering AlphaFold, RFDiffusion, and ProteinMPNN
- **Browser-Based Lab**: Python environment powered by Pyodide
- **AI Assistant**: Context-aware help for debugging and learning
- **Community Gallery**: Share and explore protein designs

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- Modern web browser

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-org/lagos-bio-design.git
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
   ```sql
   -- Run in Supabase SQL Editor
   -- Copy from supabase_migration.sql
   ```

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
│   │       └── HeuristicBrain.js
│   ├── utils/            # Utility functions
│   │   ├── pyodideManager.js
│   │   └── sanitize.js
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
- Pre-loaded bio-design libraries (mocked for demo)
- Real-time code execution
- Terminal output

### 3. AI Assistant
- Context-aware code help
- Error detection and explanation
- Extensible brain architecture

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

# Run with UI
npm run test:ui
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

Set these in your deployment platform:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_ACCESS_CODE`

## 🤝 Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details.

## 👥 Team

- **Project Lead**: [Your Name]
- **Contributors**: See [CONTRIBUTORS.md](CONTRIBUTORS.md)

## 📧 Contact

- Website: https://jobaiready.ai
- Email: info@jobaiready.ai
- Twitter: @JobAiReady

## 🙏 Acknowledgments

- Inspired by AlphaFold, RFDiffusion, and ProteinMPNN research
- Built for the Lagos tech ecosystem
- Powered by Supabase and modern web technologies

---

Made with ❤️ in Lagos, Nigeria 🇳🇬
```

---

### 2.5 Implement Error Logging 🟠

**Priority**: HIGH  
**Effort**: 1.5 hours

#### Install Sentry

```bash
npm install @sentry/react @sentry/vite-plugin
```

#### Configure Sentry

```javascript
// File: src/lib/monitoring.js

import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";

export const initMonitoring = () => {
  if (import.meta.env.PROD) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      integrations: [new BrowserTracing()],
      tracesSampleRate: 1.0,
      environment: import.meta.env.MODE,
    });
  }
};

export const logError = (error, context = {}) => {
  console.error(error);
  
  if (import.meta.env.PROD) {
    Sentry.captureException(error, {
      extra: context
    });
  }
};

export const setUser = (user) => {
  if (import.meta.env.PROD) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
    });
  }
};
```

#### Update main.jsx

```jsx
// File: src/main.jsx

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import * as Sentry from "@sentry/react";
import './index.css';
import App from './App.jsx';
import { initMonitoring } from './lib/monitoring';

// Initialize error monitoring
initMonitoring();

const SentryApp = Sentry.withProfiler(App);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SentryApp />
  </StrictMode>,
);
```

---

### 2.6 Add Database Indexes 🟠

**Priority**: HIGH  
**Effort**: 30 minutes

```sql
-- File: supabase_migrations/003_performance_indexes.sql

-- Protein Gallery indexes
create index if not exists idx_protein_gallery_user_id 
  on public.protein_gallery(user_id);

create index if not exists idx_protein_gallery_created_at 
  on public.protein_gallery(created_at desc);

create index if not exists idx_protein_gallery_is_public 
  on public.protein_gallery(is_public) 
  where is_public = true;

-- Full-text search on title and description
create index if not exists idx_protein_gallery_search 
  on public.protein_gallery 
  using gin(to_tsvector('english', title || ' ' || coalesce(description, '')));

-- Tags search
create index if not exists idx_protein_gallery_tags 
  on public.protein_gallery 
  using gin(tags);

-- Lab Runs indexes
create index if not exists idx_lab_runs_user_id 
  on public.lab_runs(user_id);

create index if not exists idx_lab_runs_status 
  on public.lab_runs(status);

create index if not exists idx_lab_runs_started_at 
  on public.lab_runs(started_at desc);

-- Composite index for common queries
create index if not exists idx_lab_runs_user_status 
  on public.lab_runs(user_id, status, started_at desc);
```

---

### 2.7 Set Up CI/CD Pipeline 🟠

**Priority**: HIGH  
**Effort**: 2 hours

```yaml
# File: .github/workflows/ci.yml

name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  lint:
    name: Lint Code
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run ESLint
        run: npm run lint
  
  test:
    name: Run Tests
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests with coverage
        run: npm run test:coverage
      
      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
  
  build:
    name: Build Application
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
      
      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: dist
          path: dist/
  
  deploy-staging:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/develop'
    steps:
      - uses: actions/checkout@v3
      
      - name: Download build artifacts
        uses: actions/download-artifact@v3
        with:
          name: dist
          path: dist/
      
      - name: Deploy to Netlify (Staging)
        uses: netlify/actions/cli@master
        with:
          args: deploy --dir=dist --prod=false
        env:
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_STAGING_SITE_ID }}
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
  
  deploy-production:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/main'
    environment:
      name: production
      url: https://lagos-bio-design.netlify.app
    steps:
      - uses: actions/checkout@v3
      
      - name: Download build artifacts
        uses: actions/download-artifact@v3
        with:
          name: dist
          path: dist/
      
      - name: Deploy to Netlify (Production)
        uses: netlify/actions/cli@master
        with:
          args: deploy --dir=dist --prod
        env:
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
```

---

## Phase 3: Medium Priority (Week 3)

**Deadline**: Complete within 7 days  
**Goal**: Improve code quality and user experience

### ✅ Task Checklist

- [ ] **3.1** Refactor Large Components
- [ ] **3.2** Implement Code Splitting
- [ ] **3.3** Add Pagination to Gallery
- [ ] **3.4** Implement Search Functionality
- [ ] **3.5** Add Loading Skeletons
- [ ] **3.6** Create Component Documentation

---

## Phase 4: Technical Debt (Ongoing)

**Timeline**: Next 1-3 months  
**Goal**: Long-term maintainability

### ✅ Task Checklist

- [ ] **4.1** Convert to TypeScript (Complete)
- [ ] **4.2** Add Storybook
- [ ] **4.3** Implement PWA Features
- [ ] **4.4** Add Internationalization (i18n)
- [ ] **4.5** Performance Optimization Audit

---

## Monitoring Progress

### Weekly Review Checklist

```markdown
## Week 1 Review
- [ ] All Phase 1 tasks completed
- [ ] Security audit passed
- [ ] Database schema verified
- [ ] Environment variables secured
- [ ] Team notified of changes

## Week 2 Review
- [ ] Test coverage > 50%
- [ ] CI/CD pipeline operational
- [ ] Documentation updated
- [ ] No critical bugs in staging

## Week 3 Review
- [ ] Performance benchmarks met
- [ ] Code quality improved
- [ ] User feedback incorporated
- [ ] Ready for production deployment
```

### Success Metrics

- **Security**: Zero exposed credentials, all RLS policies active
- **Testing**: >70% code coverage, all critical paths tested
- **Performance**: Lighthouse score >90, LCP <2.5s
- **Documentation**: Complete README, API docs, setup guide
- **CI/CD**: Automated deployment, zero manual steps

---

## Getting Help

- 📖 Review [CODEBASE_ASSESSMENT.md](CODEBASE_ASSESSMENT.md)
- 🔐 Check [SECURITY_CHECKLIST.md](SECURITY_CHECKLIST.md)
- 🧪 See [TEST_STRATEGY.md](TEST_STRATEGY.md)
- 💬 Open GitHub Discussion for questions

---

**Last Updated**: November 26, 2025  
**Next Review**: December 3, 2025
