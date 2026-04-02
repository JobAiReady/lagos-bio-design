# Test Strategy - Lagos Bio-Design Bootcamp

**Version**: 1.0  
**Last Updated**: November 26, 2025  
**Current Coverage**: 0% → Target: 70%+

---

## Testing Philosophy

> "Untested code is broken code. We test to ship with confidence."

### Core Principles

1. **Test behavior, not implementation** - Focus on what the code does, not how
2. **Write tests first for bugs** - Every bug gets a regression test
3. **Keep tests simple** - Tests should be easier to understand than the code
4. **Fast feedback** - Unit tests run in <5s, full suite in <30s
5. **Maintain tests** - Broken tests get fixed immediately

---

## Testing Pyramid

```
        /\
       /  \  E2E Tests (10%)
      /----\  Integration Tests (20%)
     /------\  Component Tests (30%)
    /--------\  Unit Tests (40%)
```

### Coverage Targets

| Layer | Target | Current | Tools |
|-------|--------|---------|-------|
| Unit Tests | 80% | 0% | Vitest |
| Component Tests | 70% | 0% | Testing Library |
| Integration Tests | 50% | 0% | Vitest + MSW |
| E2E Tests | Critical paths | 0% | Playwright |

---

## 1. Unit Tests (40% of tests)

**Purpose**: Test individual functions and utilities in isolation  
**Speed**: <1ms per test  
**Tools**: Vitest

### What to Test

#### Utilities (`src/utils/`)

**Priority: CRITICAL**

```javascript
// src/utils/sanitize.test.js

import { describe, it, expect } from 'vitest';
import { sanitizeText, sanitizeEmail, sanitizeTags } from './sanitize';

describe('sanitizeText', () => {
  it('should remove HTML tags', () => {
    const input = '<script>alert("xss")</script>Hello';
    expect(sanitizeText(input)).toBe('Hello');
  });

  it('should handle empty strings', () => {
    expect(sanitizeText('')).toBe('');
  });

  it('should trim whitespace', () => {
    expect(sanitizeText('  Hello World  ')).toBe('Hello World');
  });

  it('should preserve safe characters', () => {
    expect(sanitizeText('Hello-World_123')).toBe('Hello-World_123');
  });
});

describe('sanitizeEmail', () => {
  it('should validate correct emails', () => {
    expect(sanitizeEmail('user@example.com')).toBe('user@example.com');
  });

  it('should reject invalid emails', () => {
    expect(sanitizeEmail('not-an-email')).toBeNull();
    expect(sanitizeEmail('missing@domain')).toBeNull();
  });

  it('should lowercase and trim', () => {
    expect(sanitizeEmail('  USER@EXAMPLE.COM  ')).toBe('user@example.com');
  });
});

describe('sanitizeTags', () => {
  const validTags = ['React', 'TypeScript', 'Vite'];
  
  it('should return clean tag array', () => {
    expect(sanitizeTags(validTags)).toEqual(validTags);
  });

  it('should remove empty tags', () => {
    expect(sanitizeTags(['React', '', 'Vite'])).toEqual(['React', 'Vite']);
  });

  it('should limit to 10 tags', () => {
    const manyTags = Array(15).fill('tag');
    expect(sanitizeTags(manyTags)).toHaveLength(10);
  });

  it('should enforce max length', () => {
    const longTag = 'a'.repeat(100);
    expect(sanitizeTags([longTag])).toEqual([]);
  });

  it('should strip HTML from tags', () => {
    expect(sanitizeTags(['<script>xss</script>'])).toEqual(['']);
  });
});
```

#### Pyodide Manager (`src/utils/pyodideManager.test.js`)

```javascript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadPyodide, runPythonScript } from './pyodideManager';

// Mock Pyodide
global.loadPyodide = vi.fn();

describe('loadPyodide', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should load Pyodide only once', async () => {
    global.loadPyodide.mockResolvedValue({
      loadPackage: vi.fn(),
      runPythonAsync: vi.fn(),
    });

    await loadPyodide();
    await loadPyodide(); // Second call

    expect(global.loadPyodide).toHaveBeenCalledTimes(1);
  });

  it('should load micropip package', async () => {
    const mockPyodide = {
      loadPackage: vi.fn().mockResolvedValue({}),
      runPythonAsync: vi.fn().mockResolvedValue({}),
    };
    global.loadPyodide.mockResolvedValue(mockPyodide);

    await loadPyodide();

    expect(mockPyodide.loadPackage).toHaveBeenCalledWith('micropip');
  });

  it('should apply mock shims', async () => {
    const mockPyodide = {
      loadPackage: vi.fn().mockResolvedValue({}),
      runPythonAsync: vi.fn().mockResolvedValue({}),
    };
    global.loadPyodide.mockResolvedValue(mockPyodide);

    await loadPyodide();

    expect(mockPyodide.runPythonAsync).toHaveBeenCalled();
  });
});
```

#### Library Functions (`src/lib/gallery.test.js`)

```javascript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { uploadPDB, publishDesign, fetchGallery } from './gallery';
import { supabase } from './supabase';

vi.mock('./supabase', () => ({
  supabase: {
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(),
        getPublicUrl: vi.fn(),
      })),
    },
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(),
      })),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(),
        })),
      })),
    })),
  },
}));

describe('uploadPDB', () => {
  it('should upload file and return public URL', async () => {
    const mockFile = new File(['content'], 'protein.pdb');
    const userId = 'user-123';
    
    supabase.storage.from().upload.mockResolvedValue({
      data: { path: 'user-123/123_protein.pdb' },
      error: null,
    });
    
    supabase.storage.from().getPublicUrl.mockReturnValue({
      data: { publicUrl: 'https://example.com/protein.pdb' },
    });

    const url = await uploadPDB(mockFile, userId);
    
    expect(url).toBe('https://example.com/protein.pdb');
  });

  it('should throw on upload error', async () => {
    const mockFile = new File(['content'], 'protein.pdb');
    
    supabase.storage.from().upload.mockResolvedValue({
      data: null,
      error: new Error('Upload failed'),
    });

    await expect(uploadPDB(mockFile, 'user-123')).rejects.toThrow('Upload failed');
  });
});
```

---

## 2. Component Tests (30% of tests)

**Purpose**: Test React components in isolation  
**Speed**: <100ms per test  
**Tools**: Vitest + Testing Library

### Testing Approach

- Render components with realistic props
- Simulate user interactions
- Assert on visible output, not internals
- Mock external dependencies (Supabase, router)

### Critical Components

#### AuthModal (`src/components/AuthModal.test.jsx`)

```jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AuthModal from './AuthModal';
import { supabase } from '../lib/supabase';

vi.mock('../lib/supabase');

describe('AuthModal', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should not render when closed', () => {
      const { container } = render(
        <AuthModal isOpen={false} onClose={mockOnClose} />
      );
      expect(container.firstChild).toBeNull();
    });

    it('should render sign in form when open', () => {
      render(<AuthModal isOpen={true} onClose={mockOnClose} />);
      
      expect(screen.getByText('Welcome Back')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('name@example.com')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    });

    it('should not show access code field for sign in', () => {
      render(<AuthModal isOpen={true} onClose={mockOnClose} />);
      
      expect(screen.queryByText('Access Code')).not.toBeInTheDocument();
    });
  });

  describe('Sign In Flow', () => {
    it('should call supabase signIn on submit', async () => {
      supabase.auth.signInWithPassword.mockResolvedValue({ error: null });
      
      render(<AuthModal isOpen={true} onClose={mockOnClose} />);
      
      await userEvent.type(
        screen.getByPlaceholderText('name@example.com'),
        'test@example.com'
      );
      await userEvent.type(
        screen.getByPlaceholderText('••••••••'),
        'password123'
      );
      
      await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
      
      await waitFor(() => {
        expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        });
      });
    });

    it('should close modal on successful sign in', async () => {
      supabase.auth.signInWithPassword.mockResolvedValue({ error: null });
      
      render(<AuthModal isOpen={true} onClose={mockOnClose} />);
      
      await userEvent.type(screen.getByPlaceholderText('name@example.com'), 'test@example.com');
      await userEvent.type(screen.getByPlaceholderText('••••••••'), 'password123');
      await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
      
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('should show error on failed sign in', async () => {
      supabase.auth.signInWithPassword.mockResolvedValue({
        error: new Error('Invalid credentials'),
      });
      
      render(<AuthModal isOpen={true} onClose={mockOnClose} />);
      
      await userEvent.type(screen.getByPlaceholderText('name@example.com'), 'test@example.com');
      await userEvent.type(screen.getByPlaceholderText('••••••••'), 'wrong');
      await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
      });
    });
  });

  describe('Sign Up Flow', () => {
    it('should toggle to sign up mode', async () => {
      render(<AuthModal isOpen={true} onClose={mockOnClose} />);
      
      await userEvent.click(screen.getByText('Sign Up'));
      
      expect(screen.getByText('Create Account')).toBeInTheDocument();
      expect(screen.getByText('Access Code')).toBeInTheDocument();
    });

    it('should require access code for sign up', async () => {
      render(<AuthModal isOpen={true} onClose={mockOnClose} />);
      
      await userEvent.click(screen.getByText('Sign Up'));
      
      const accessCodeInput = screen.getByPlaceholderText('Enter cohort code');
      expect(accessCodeInput).toBeRequired();
    });

    it('should show success message after sign up', async () => {
      supabase.auth.signUp.mockResolvedValue({ error: null });
      supabase.functions.invoke.mockResolvedValue({
        data: { valid: true },
        error: null,
      });
      
      render(<AuthModal isOpen={true} onClose={mockOnClose} />);
      
      await userEvent.click(screen.getByText('Sign Up'));
      await userEvent.type(screen.getByPlaceholderText('name@example.com'), 'new@example.com');
      await userEvent.type(screen.getByPlaceholderText('••••••••'), 'password123');
      await userEvent.type(screen.getByPlaceholderText('Enter cohort code'), 'TEST-ACCESS-CODE');
      await userEvent.click(screen.getByRole('button', { name: /sign up/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/check your email/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<AuthModal isOpen={true} onClose={mockOnClose} />);
      
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
    });

    it('should be keyboard navigable', async () => {
      render(<AuthModal isOpen={true} onClose={mockOnClose} />);
      
      const emailInput = screen.getByPlaceholderText('name@example.com');
      emailInput.focus();
      
      expect(document.activeElement).toBe(emailInput);
    });
  });
});
```

#### AiAssistant (`src/components/AiAssistant.test.jsx`)

```jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AiAssistant from './AiAssistant';

// Mock the hook
vi.mock('../hooks/useAiBrain', () => ({
  useAiBrain: () => ({
    messages: [
      { id: '1', role: 'assistant', text: 'Hello! How can I help?' }
    ],
    sendMessage: vi.fn(),
    isThinking: false,
    brainName: 'Lab Assistant (Basic)',
  }),
}));

describe('AiAssistant', () => {
  const mockContext = {
    activeFile: 'script.py',
    code: 'print("Hello")',
    logs: ['> Running script.py'],
  };

  it('should not render when closed', () => {
    const { container } = render(
      <AiAssistant isOpen={false} onClose={() => {}} context={mockContext} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('should show context information', () => {
    render(
      <AiAssistant isOpen={true} onClose={() => {}} context={mockContext} />
    );
    
    expect(screen.getByText('script.py')).toBeInTheDocument();
    expect(screen.getByText('1 logs')).toBeInTheDocument();
  });

  it('should display messages', () => {
    render(
      <AiAssistant isOpen={true} onClose={() => {}} context={mockContext} />
    );
    
    expect(screen.getByText('Hello! How can I help?')).toBeInTheDocument();
  });

  it('should allow sending messages', async () => {
    const { useAiBrain } = await import('../hooks/useAiBrain');
    const mockSendMessage = vi.fn();
    vi.mocked(useAiBrain).mockReturnValue({
      messages: [],
      sendMessage: mockSendMessage,
      isThinking: false,
      brainName: 'Lab Assistant',
    });

    render(
      <AiAssistant isOpen={true} onClose={() => {}} context={mockContext} />
    );
    
    const input = screen.getByPlaceholderText('Ask about your code...');
    await userEvent.type(input, 'Help me debug this');
    await userEvent.click(screen.getByRole('button', { type: 'submit' }));
    
    expect(mockSendMessage).toHaveBeenCalledWith('Help me debug this', mockContext);
  });
});
```

#### ProteinCard (`src/components/ProteinCard.test.jsx`)

```jsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProteinCard from './ProteinCard';

describe('ProteinCard', () => {
  const mockDesign = {
    id: 1,
    title: 'Stable 4-Helix Bundle',
    description: 'A de novo designed protein',
    tags: ['RFDiffusion', 'Stable'],
    profiles: {
      full_name: 'John Doe',
      avatar_url: null,
    },
    thumbnail_url: 'https://example.com/protein.png',
    created_at: '2025-01-01T00:00:00Z',
  };

  it('should render design title', () => {
    render(<ProteinCard design={mockDesign} />);
    expect(screen.getByText('Stable 4-Helix Bundle')).toBeInTheDocument();
  });

  it('should render author name', () => {
    render(<ProteinCard design={mockDesign} />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('should render tags', () => {
    render(<ProteinCard design={mockDesign} />);
    expect(screen.getByText('RFDiffusion')).toBeInTheDocument();
    expect(screen.getByText('Stable')).toBeInTheDocument();
  });

  it('should show fallback for missing avatar', () => {
    render(<ProteinCard design={mockDesign} />);
    // Check for fallback user icon
    expect(screen.getByText('John Doe').previousSibling).toBeInTheDocument();
  });

  it('should format date correctly', () => {
    render(<ProteinCard design={mockDesign} />);
    expect(screen.getByText(/1\/1\/2025/)).toBeInTheDocument();
  });
});
```

---

## 3. Integration Tests (20% of tests)

**Purpose**: Test multiple components/systems working together  
**Speed**: <500ms per test  
**Tools**: Vitest + MSW (Mock Service Worker)

### Setup MSW for API Mocking

```javascript
// src/tests/mocks/handlers.js

import { http, HttpResponse } from 'msw';

export const handlers = [
  // Mock Supabase auth endpoints
  http.post('https://*/auth/v1/token', () => {
    return HttpResponse.json({
      access_token: 'mock-token',
      user: { id: 'user-123', email: 'test@example.com' },
    });
  }),

  // Mock gallery fetch
  http.get('https://*/rest/v1/protein_gallery', () => {
    return HttpResponse.json([
      {
        id: 1,
        title: 'Test Protein',
        tags: ['test'],
        created_at: new Date().toISOString(),
      },
    ]);
  }),

  // Mock progress tracking
  http.get('https://*/rest/v1/user_progress', () => {
    return HttpResponse.json([
      {
        module_id: 'Module 1',
        completed_steps: [0, 1],
      },
    ]);
  }),
];
```

```javascript
// src/tests/mocks/server.js

import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
```

```javascript
// src/tests/setup.js (update)

import { beforeAll, afterEach, afterAll } from 'vitest';
import { server } from './mocks/server';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### Integration Test Examples

#### Authentication Flow

```jsx
// src/tests/integration/auth-flow.test.jsx

import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import App from '../../App';

describe('Authentication Flow', () => {
  it('should allow user to sign in and access workspace', async () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );

    // Click sign in button
    await userEvent.click(screen.getByText(/sign in/i));

    // Fill in credentials
    await userEvent.type(
      screen.getByPlaceholderText('name@example.com'),
      'test@example.com'
    );
    await userEvent.type(
      screen.getByPlaceholderText('••••••••'),
      'password123'
    );

    // Submit form
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    // Modal should close
    await waitFor(() => {
      expect(screen.queryByText('Welcome Back')).not.toBeInTheDocument();
    });

    // User email should appear in header
    expect(await screen.findByText('test@example.com')).toBeInTheDocument();
  });

  it('should redirect to home if accessing workspace without auth', async () => {
    render(
      <BrowserRouter initialEntries={['/workspace']}>
        <App />
      </BrowserRouter>
    );

    // Should redirect to home
    await waitFor(() => {
      expect(screen.getByText(/lagos bio-design bootcamp/i)).toBeInTheDocument();
    });
  });
});
```

#### Progress Tracking

```jsx
// src/tests/integration/progress-tracking.test.jsx

import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LagosBioBootcamp from '../../pages/LagosBioBootcamp';

describe('Progress Tracking', () => {
  it('should save progress to Supabase when user completes step', async () => {
    // Mock authenticated user
    vi.mock('../../lib/supabase', () => ({
      supabase: {
        auth: {
          getSession: () => Promise.resolve({
            data: { session: { user: { id: 'user-123' } } }
          }),
          onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        },
        from: (table) => ({
          select: () => ({
            eq: () => Promise.resolve({ data: [] }),
          }),
          upsert: vi.fn(() => Promise.resolve({ data: {}, error: null })),
        }),
      },
    }));

    render(<LagosBioBootcamp />);

    // Open first module
    await userEvent.click(screen.getAllByRole('button')[0]);

    // Click "Enter Lab"
    await userEvent.click(screen.getByText(/enter lab/i));

    // Complete first step
    await userEvent.click(screen.getByText(/environment setup/i));

    // Verify progress was saved
    await waitFor(() => {
      expect(screen.getByText(/1 of 3 steps complete/i)).toBeInTheDocument();
    });
  });
});
```

---

## 4. End-to-End Tests (10% of tests)

**Purpose**: Test complete user journeys  
**Speed**: <5s per test  
**Tools**: Playwright

### Installation

```bash
npm install --save-dev @playwright/test
npx playwright install
```

### Configuration

```javascript
// playwright.config.js

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

### E2E Test Examples

```javascript
// e2e/complete-module.spec.js

import { test, expect } from '@playwright/test';

test.describe('Complete Module Flow', () => {
  test('user can sign up, enter lab, and complete steps', async ({ page }) => {
    await page.goto('/');

    // Sign up
    await page.click('text=Sign In');
    await page.click('text=Sign Up');
    await page.fill('input[type="email"]', 'newuser@example.com');
    await page.fill('input[type="password"]', 'SecurePass123!');
    await page.fill('input[placeholder*="cohort"]', 'TEST-ACCESS-CODE');
    await page.click('button:has-text("Sign Up")');

    // Check email confirmation message
    await expect(page.locator('text=Check Your Email')).toBeVisible();
    
    // (In real test, we'd verify email and activate account)
    // For now, close modal and sign in instead
    await page.click('text=Close');
    
    // Sign in with existing test account
    await page.click('text=Sign In');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button:has-text("Sign In")');

    // Navigate to first module
    await expect(page.locator('text=Module 1')).toBeVisible();
    
    // Open module
    await page.click('text=Module 1');
    
    // Enter lab
    await page.click('text=Enter Lab');

    // Lab detail modal should open
    await expect(page.locator('text=Mission Objective')).toBeVisible();

    // Complete first step
    await page.click('text=Environment Setup');
    
    // Verify step is marked complete
    const completedStep = page.locator('.line-through').first();
    await expect(completedStep).toBeVisible();

    // Progress bar should update
    await expect(page.locator('text=33% Complete')).toBeVisible();

    // Launch workspace
    await page.click('text=Launch Workspace');
    
    // Verify workspace loaded
    await expect(page.locator('text=script.py')).toBeVisible();
    await expect(page.locator('text=Python 3.11 Ready')).toBeVisible();
  });
});
```

```javascript
// e2e/publish-design.spec.js

import { test, expect } from '@playwright/test';

test.describe('Publish Design', () => {
  test.beforeEach(async ({ page }) => {
    // Sign in
    await page.goto('/');
    await page.click('text=Sign In');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button:has-text("Sign In")');
  });

  test('user can publish design from workspace', async ({ page }) => {
    // Navigate to workspace
    await page.goto('/workspace');

    // Run script
    await page.click('text=RUN SCRIPT');
    
    // Wait for execution
    await expect(page.locator('text=Ready for inference')).toBeVisible({ timeout: 10000 });

    // Click publish
    await page.click('text=PUBLISH');

    // Fill in publish form
    await page.fill('input[placeholder*="Stable 4-Helix"]', 'My Test Protein');
    await page.fill('textarea', 'A test protein design for E2E testing');
    await page.fill('input[placeholder*="RFDiffusion"]', 'test, automation');

    // Submit
    await page.click('button:has-text("Publish Design")');

    // Verify success
    await expect(page.locator('text=published to Gallery successfully')).toBeVisible();

    // Navigate to gallery
    await page.goto('/gallery');

    // Verify design appears
    await expect(page.locator('text=My Test Protein')).toBeVisible();
  });
});
```

---

## Test Organization

### Directory Structure

```
src/
├── components/
│   ├── AuthModal.jsx
│   └── AuthModal.test.jsx          # Component test
├── hooks/
│   ├── useAiBrain.js
│   └── useAiBrain.test.js          # Hook test
├── utils/
│   ├── sanitize.js
│   └── sanitize.test.js            # Unit test
├── tests/
│   ├── setup.js                    # Test configuration
│   ├── mocks/
│   │   ├── handlers.js             # MSW handlers
│   │   └── server.js               # MSW server
│   └── integration/
│       ├── auth-flow.test.jsx
│       └── progress-tracking.test.jsx
e2e/
├── complete-module.spec.js         # E2E test
└── publish-design.spec.js          # E2E test
```

---

## Running Tests

### Package.json Scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:all": "npm run test:coverage && npm run test:e2e"
  }
}
```

### Command Reference

```bash
# Run all unit/component tests
npm test

# Run tests in watch mode (development)
npm test -- --watch

# Run specific test file
npm test -- AuthModal

# Run with coverage report
npm run test:coverage

# Open coverage in browser
open coverage/index.html

# Run E2E tests
npm run test:e2e

# Run E2E in headed mode (see browser)
npm run test:e2e -- --headed

# Run E2E for specific browser
npm run test:e2e -- --project=firefox

# Debug E2E tests
npm run test:e2e:ui
```

---

## Continuous Integration

### GitHub Actions

```yaml
# .github/workflows/test.yml

name: Test Suite

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'npm'
      - run: npm ci
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'npm'
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## Coverage Goals

### Phase 1 (Week 1)
- [ ] 30% overall coverage
- [ ] All utilities tested
- [ ] Critical paths covered

### Phase 2 (Week 2)
- [ ] 50% overall coverage
- [ ] All components tested
- [ ] Integration tests for auth

### Phase 3 (Week 3)
- [ ] 70% overall coverage
- [ ] E2E tests for happy paths
- [ ] Performance benchmarks

---

## Best Practices

### DO ✅

- Test user-facing behavior
- Use descriptive test names
- Keep tests independent
- Mock external dependencies
- Test error states
- Use semantic queries (`getByRole`, `getByLabelText`)

### DON'T ❌

- Test implementation details
- Share state between tests
- Use brittle selectors (`.class-name`)
- Make tests dependent on each other
- Ignore failing tests
- Skip edge cases

---

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Guide](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

**Next Steps**: Begin with Phase 1 - Unit tests for `sanitize.js` and `pyodideManager.js`
