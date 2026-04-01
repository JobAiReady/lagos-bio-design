# Phase 2: Testing & Quality Assurance - PLAN 📋

**Start Date**: November 27, 2025  
**Estimated Duration**: 5-7 days  
**Priority**: HIGH  
**Status**: 🟡 Ready to Begin

---

## 🎯 Phase 2 Objectives

Build a **robust, tested, and production-ready** platform with:
- ✅ Automated testing (50%+ coverage)
- ✅ Rate limiting (prevent abuse)
- ✅ Error monitoring
- ✅ Performance optimization
- ✅ Complete documentation

---

## 📊 Task Overview

| # | Task | Priority | Effort | Status |
|---|------|----------|--------|--------|
| 2.1 | Set Up Testing Framework | HIGH | 2 hours | 🔄 Next |
| 2.2 | Write Critical Unit Tests | HIGH | 4-6 hours | ⏳ Pending |
| 2.3 | Add Rate Limiting | HIGH | 3 hours | ⏳ Pending |
| 2.4 | Set Up Error Monitoring | HIGH | 2 hours | ⏳ Pending |
| 2.5 | E2E Testing Setup | HIGH | 3-4 hours | ⏳ Pending |
| 2.6 | Performance Optimization | MEDIUM | 2-3 hours | ⏳ Pending |
| 2.7 | Complete Documentation | MEDIUM | 2 hours | ⏳ Pending |

**Total Estimated Time**: 18-22 hours (3-4 working days)

---

## 🔧 Task 2.1: Set Up Testing Framework

### Goal
Install and configure Vitest for unit and integration testing.

### Steps

#### 1. Install Dependencies
```bash
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @vitest/ui
```

#### 2. Create Vitest Config
**File**: `vitest.config.js`
```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

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
      ],
      thresholds: {
        lines: 50,
        functions: 50,
        branches: 50,
        statements: 50
      }
    }
  }
});
```

#### 3. Create Test Setup
**File**: `src/tests/setup.js`
```javascript
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

#### 4. Update package.json Scripts
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:watch": "vitest --watch"
  }
}
```

### Acceptance Criteria
- ✅ Vitest runs without errors
- ✅ Test UI accessible at `localhost:51204`
- ✅ Coverage reports generate correctly

### Time: 2 hours

---

## 🧪 Task 2.2: Write Critical Unit Tests

### Goal
Achieve 50% test coverage on critical functions.

### Priority Tests

#### A. Sanitization Utilities ⭐ CRITICAL
**File**: `src/utils/sanitize.test.js`

Test cases:
- ✅ `sanitizeEmail()` - validates correct emails
- ✅ `sanitizeEmail()` - rejects invalid emails
- ✅ `sanitizeText()` - strips HTML tags
- ✅ `sanitizeText()` - handles XSS attempts
- ✅ `sanitizeTags()` - limits tag count to 10
- ✅ `sanitizeTags()` - enforces 50-char limit

#### B. AuthModal Component ⭐ CRITICAL
**File**: `src/components/AuthModal.test.jsx`

Test cases:
- ✅ Renders when `isOpen={true}`
- ✅ Doesn't render when `isOpen={false}`
- ✅ Toggles between Sign In / Sign Up
- ✅ Validates email before submit
- ✅ Shows access code field on signup
- ✅ Calls `supabase.rpc('verify_cohort_code')`
- ✅ Displays success modal on confirmation
- ✅ Shows error message on invalid code

#### C. useAiBrain Hook
**File**: `src/hooks/useAiBrain.test.js`

Test cases:
- ✅ Initializes with welcome message
- ✅ Adds user message to history
- ✅ Gets AI response asynchronously
- ✅ Detects errors in logs
- ✅ Provides code suggestions

#### D. LagosBioBootcamp Component
**File**: `src/pages/LagosBioBootcamp.test.jsx`

Test cases:
- ✅ Fetches user progress on mount
- ✅ Renders module list correctly
- ✅ Handles missing `user_progress` gracefully
- ✅ Updates progress when step completed

### Coverage Target
- **Minimum**: 50% overall
- **Critical paths**: 80%+ (auth, sanitization, progress)

### Time: 4-6 hours

---

## 🛡️ Task 2.3: Add Rate Limiting

### Goal
Prevent abuse of authentication and API endpoints.

### Implementation

#### 1. Create Rate Limit Function (Supabase)
**File**: `rate_limit_function.sql`

```sql
-- Track API calls per user/IP
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id bigserial PRIMARY KEY,
  identifier text NOT NULL, -- user_id or IP address
  action_type text NOT NULL, -- 'signup', 'signin', 'rpc_call'
  call_count integer DEFAULT 1,
  window_start timestamptz DEFAULT now(),
  UNIQUE(identifier, action_type)
);

-- Rate limit check function
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_identifier text,
  p_action_type text,
  p_max_calls integer,
  p_window_minutes integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_count integer;
  v_window_start timestamptz;
BEGIN
  -- Get current rate limit record
  SELECT call_count, window_start INTO v_current_count, v_window_start
  FROM public.rate_limits
  WHERE identifier = p_identifier AND action_type = p_action_type;

  -- If no record exists or window expired, create/reset
  IF v_current_count IS NULL OR v_window_start < (now() - (p_window_minutes || ' minutes')::interval) THEN
    INSERT INTO public.rate_limits (identifier, action_type, call_count, window_start)
    VALUES (p_identifier, p_action_type, 1, now())
    ON CONFLICT (identifier, action_type)
    DO UPDATE SET call_count = 1, window_start = now();
    RETURN TRUE;
  END IF;

  -- Check if limit exceeded
  IF v_current_count >= p_max_calls THEN
    RETURN FALSE;
  END IF;

  -- Increment counter
  UPDATE public.rate_limits
  SET call_count = call_count + 1
  WHERE identifier = p_identifier AND action_type = p_action_type;

  RETURN TRUE;
END;
$$;

-- Grant access
GRANT EXECUTE ON FUNCTION check_rate_limit(text, text, integer, integer) TO authenticated, anon;
```

#### 2. Update AuthModal to Use Rate Limiting
**File**: `src/components/AuthModal.jsx`

```javascript
const handleAuth = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError(null);

  try {
    // Check rate limit before proceeding
    const { data: allowed, error: rateLimitError } = await supabase.rpc('check_rate_limit', {
      p_identifier: email, // Or use IP address
      p_action_type: isSignUp ? 'signup' : 'signin',
      p_max_calls: 5, // 5 attempts
      p_window_minutes: 15 // per 15 minutes
    });

    if (rateLimitError) {
      throw new Error('Rate limit check failed');
    }

    if (!allowed) {
      throw new Error('Too many attempts. Please wait 15 minutes before trying again.');
    }

    // Rest of authentication logic...
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};
```

#### 3. Rate Limits to Implement

| Action | Max Calls | Window | Identifier |
|--------|-----------|--------|------------|
| Sign Up | 3 | 1 hour | Email |
| Sign In | 5 | 15 min | Email |
| RPC Calls | 60 | 1 min | user_id |
| Password Reset | 3 | 1 hour | Email |

### Acceptance Criteria
- ✅ Rate limit function deployed
- ✅ Auth endpoints protected
- ✅ Clear error messages shown
- ✅ No impact on legitimate users

### Time: 3 hours

---

## 📊 Task 2.4: Set Up Error Monitoring

### Goal
Track errors in production with Sentry or similar.

### Options

#### Option A: Sentry (Recommended)
**Pros**: Best-in-class error tracking, React integration, free tier  
**Setup Time**: 30 minutes

#### Option B: LogRocket
**Pros**: Session replay, user tracking  
**Setup Time**: 45 minutes

#### Option C: Custom Logging (Budget)
**Pros**: Free, full control  
**Setup Time**: 2 hours

### Implementation (Sentry)

#### 1. Install Sentry
```bash
npm install --save @sentry/react @sentry/vite-plugin
```

#### 2. Configure Sentry
**File**: `src/lib/sentry.js`
```javascript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay(),
  ],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  environment: import.meta.env.MODE,
});
```

#### 3. Wrap App
**File**: `src/main.jsx`
```javascript
import * as Sentry from "@sentry/react";
import './lib/sentry';

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <Sentry.ErrorBoundary fallback={<ErrorFallback />}>
    <App />
  </Sentry.ErrorBoundary>
);
```

### Time: 2 hours

---

## 🎭 Task 2.5: E2E Testing Setup

### Goal
Test critical user flows end-to-end with Playwright.

### Installation
```bash
npm install --save-dev @playwright/test
npx playwright install
```

### Critical Test Flows

#### Test 1: User Registration
```javascript
// tests/e2e/auth.spec.js
import { test, expect } from '@playwright/test';

test('user can sign up with valid code', async ({ page }) => {
  await page.goto('http://localhost:5173');
  
  // Click Apply Now
  await page.click('text=Apply Now');
  
  // Fill sign up form
  await page.fill('input[type="email"]', 'test@example.com');
  await page.fill('input[type="password"]', 'SecurePass123');
  await page.fill('input[placeholder*="cohort"]', 'YABA-2025');
  
  // Submit
  await page.click('button:has-text("Sign Up")');
  
  // Check for success modal
  await expect(page.locator('text=Check Your Email')).toBeVisible();
});
```

#### Test 2: Module Navigation
```javascript
test('user can navigate modules', async ({ page }) => {
  // Login first
  await loginAsUser(page);
  
  // Click first module
  await page.click('text=Module 1');
  
  // Verify content loaded
  await expect(page.locator('text=AlphaFold')).toBeVisible();
});
```

### Time: 3-4 hours

---

## ⚡ Task 2.6: Performance Optimization

### Goal
Improve load time and runtime performance.

### Actions

1. **Code Splitting**
   - Lazy load routes
   - Split vendor bundles
   - Dynamic imports for heavy components

2. **Asset Optimization**
   - Compress images
   - Use WebP format
   - Implement lazy loading for images

3. **Database Queries**
   - Add missing indexes
   - Optimize RLS policies
   - Use select() with specific columns

4. **Caching**
   - Cache static data (modules, content)
   - Use React Query for server state
   - Implement service worker

### Time: 2-3 hours

---

## 📚 Task 2.7: Complete Documentation

### Goal
Comprehensive README and deployment guide.

### Documents to Create/Update

1. **README.md** - Project overview, setup, usage
2. **DEPLOYMENT.md** - Step-by-step deployment guide
3. **API.md** - Supabase RPC functions, schema
4. **CONTRIBUTING.md** - Guidelines for contributors
5. **CHANGELOG.md** - Version history

### Time: 2 hours

---

## 📈 Success Metrics

Phase 2 is complete when:

- ✅ Test coverage ≥ 50%
- ✅ All critical paths tested
- ✅ Rate limiting active on auth
- ✅ Error monitoring live
- ✅ E2E tests passing
- ✅ Load time < 2 seconds
- ✅ Documentation complete

---

## 🚀 Getting Started

**Ready to begin Phase 2?**

Start with Task 2.1: Set Up Testing Framework

Would you like me to:
1. Install testing dependencies and create config?
2. Show you the first test to write?
3. Something else?

Let's build a production-ready platform! 💪
