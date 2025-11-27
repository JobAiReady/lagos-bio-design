# Security Checklist - Lagos Bio-Design Bootcamp

**Last Updated**: November 26, 2025  
**Status**: 🔴 Critical Issues Present

---

## Immediate Actions Required 🚨

### 1. Credential Exposure (CRITICAL)

- [ ] **Remove .env from Git history**
  ```bash
  git filter-branch --force --index-filter \
    "git rm --cached --ignore-unmatch .env" \
    --prune-empty --tag-name-filter cat -- --all
  ```

- [ ] **Regenerate all Supabase keys**
  - Login to Supabase Dashboard
  - Navigate to Settings > API
  - Regenerate `anon` public key
  - Update all deployment environments

- [ ] **Verify no keys in Git history**
  ```bash
  git log --all --full-history -- .env
  git log --all --full-history -- deploy_key
  git log --all --full-history -- deploy_key.pub
  ```

- [ ] **Update .gitignore**
  ```
  .env
  .env.*
  !.env.example
  deploy_key
  deploy_key.pub
  *.pem
  ```

- [ ] **Create .env.example for documentation**

---

## Authentication & Authorization

### Access Control

- [ ] **Move access code validation to server-side**
  - Create Supabase Edge Function: `verify-access-code`
  - Store access code in Supabase secrets
  - Update AuthModal to call Edge Function

- [ ] **Implement rate limiting**
  - Add rate limiting to Edge Functions
  - Limit signup attempts: 5 per hour per IP
  - Limit login attempts: 10 per hour per user

- [ ] **Review Row Level Security policies**
  ```sql
  -- Verify all tables have RLS enabled
  SELECT tablename, rowsecurity 
  FROM pg_tables 
  WHERE schemaname = 'public';
  ```

- [ ] **Test RLS policies**
  - Create test users
  - Verify users can only access their own data
  - Test malicious queries

### Session Management

- [ ] **Configure session timeout**
  - Set reasonable JWT expiration (24 hours)
  - Implement refresh token rotation
  - Add "Remember Me" functionality

- [ ] **Implement logout on all devices**
  - Add endpoint to revoke all sessions
  - Clear localStorage on logout

---

## Input Validation & Sanitization

### User Input

- [ ] **Install sanitization library**
  ```bash
  npm install dompurify isomorphic-dompurify
  ```

- [ ] **Create sanitization utilities**
  - `sanitizeText()` - Remove all HTML
  - `sanitizeHtml()` - Allow safe HTML only
  - `sanitizeEmail()` - Validate email format
  - `sanitizeTags()` - Clean tag arrays

- [ ] **Apply sanitization to all user inputs**
  - AuthModal: email, password
  - PublishModal: title, description, tags
  - LabDetail: progress updates
  - Any search/filter inputs

### File Uploads

- [ ] **Validate file types**
  - Whitelist: `.pdb`, `.fasta`, `.pdb.gz`
  - Reject executables: `.exe`, `.sh`, `.bat`

- [ ] **Implement file size limits**
  - Max upload: 10MB per file
  - Max total: 100MB per user

- [ ] **Scan uploaded files**
  - Validate PDB file format
  - Check for malicious content
  - Generate safe thumbnails

---

## API Security

### Supabase Configuration

- [ ] **Enable RLS on all tables**
  ```sql
  ALTER TABLE public.protein_gallery ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.lab_runs ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
  ```

- [ ] **Review and update policies**
  - Separate policies for SELECT, INSERT, UPDATE, DELETE
  - Use `auth.uid()` for user identification
  - Test with different user roles

- [ ] **Configure CORS properly**
  - Whitelist production domain only
  - Remove wildcard `*` origins in production

- [ ] **Enable audit logging**
  - Track all database changes
  - Log authentication events
  - Monitor for suspicious activity

### Edge Functions Security

- [ ] **Validate all function inputs**
  ```typescript
  const { accessCode } = await req.json();
  if (!accessCode || typeof accessCode !== 'string') {
    throw new Error('Invalid input');
  }
  ```

- [ ] **Use environment secrets**
  - Never hardcode secrets in functions
  - Use `Deno.env.get()` for sensitive data

- [ ] **Implement function authentication**
  - Verify JWT tokens where needed
  - Use `--no-verify-jwt` only for public endpoints

---

## Data Protection

### Sensitive Data

- [ ] **Encrypt sensitive fields**
  - User email (hashed by Supabase)
  - API keys (if stored)
  - Personal information

- [ ] **Implement data retention policy**
  - Delete inactive accounts after 2 years
  - Archive old lab runs after 6 months
  - Provide data export for users

- [ ] **Add GDPR compliance**
  - Privacy policy page
  - Cookie consent banner
  - Data deletion request endpoint

### Database Security

- [ ] **Use parameterized queries**
  - All Supabase queries are safe by default
  - Avoid raw SQL concatenation

- [ ] **Regular backups**
  - Enable Supabase automatic backups
  - Test backup restoration
  - Document recovery procedure

- [ ] **Monitor database access**
  - Review connection logs
  - Alert on suspicious patterns
  - Limit concurrent connections

---

## Frontend Security

### XSS Prevention

- [ ] **Sanitize all rendered user content**
  ```jsx
  import DOMPurify from 'dompurify';
  
  <div dangerouslySetInnerHTML={{
    __html: DOMPurify.sanitize(userContent)
  }} />
  ```

- [ ] **Use Content Security Policy**
  ```html
  <meta http-equiv="Content-Security-Policy" 
        content="default-src 'self'; script-src 'self' 'unsafe-inline' cdn.jsdelivr.net;">
  ```

- [ ] **Escape user input in URLs**
  ```javascript
  const safeUrl = encodeURIComponent(userInput);
  ```

### CSRF Protection

- [ ] **Use SameSite cookies**
  - Supabase handles this automatically
  - Verify cookie settings in browser

- [ ] **Validate origin headers**
  - Check `Referer` header on sensitive operations
  - Implement CSRF tokens if needed

### Dependency Security

- [ ] **Audit dependencies**
  ```bash
  npm audit
  npm audit fix
  ```

- [ ] **Keep dependencies updated**
  ```bash
  npm outdated
  npm update
  ```

- [ ] **Remove unused dependencies**
  ```bash
  npx depcheck
  ```

- [ ] **Use lock files**
  - Commit `package-lock.json`
  - Use `npm ci` in production

---

## Infrastructure Security

### Environment Variables

- [ ] **Never commit secrets**
  - All `.env` files in `.gitignore`
  - Use `.env.example` for documentation

- [ ] **Use different keys per environment**
  - Development: Local Supabase
  - Staging: Staging Supabase project
  - Production: Production Supabase project

- [ ] **Rotate keys regularly**
  - Every 90 days for production
  - After any suspected breach
  - When team members leave

### Deployment Security

- [ ] **Use HTTPS only**
  - Enforce SSL/TLS on all connections
  - Redirect HTTP to HTTPS
  - Use HSTS headers

- [ ] **Implement security headers**
  ```nginx
  # nginx.conf
  add_header X-Frame-Options "SAMEORIGIN" always;
  add_header X-Content-Type-Options "nosniff" always;
  add_header X-XSS-Protection "1; mode=block" always;
  add_header Referrer-Policy "strict-origin-when-cross-origin" always;
  ```

- [ ] **Monitor SSL certificate expiration**
  - Set up renewal alerts
  - Use Let's Encrypt auto-renewal

- [ ] **Disable directory listing**
  ```nginx
  autoindex off;
  ```

---

## Logging & Monitoring

### Error Tracking

- [ ] **Set up Sentry or similar**
  ```bash
  npm install @sentry/react
  ```

- [ ] **Configure error boundaries**
  - Wrap all routes in ErrorBoundary
  - Log errors to monitoring service
  - Show user-friendly error messages

- [ ] **Sanitize error messages**
  - Don't expose stack traces to users
  - Remove sensitive data from logs
  - Use error codes instead of raw messages

### Security Monitoring

- [ ] **Set up alerts for**
  - Failed login attempts (>10/hour)
  - Repeated 403/401 errors
  - Unusual API usage patterns
  - Database connection spikes

- [ ] **Implement audit logging**
  ```sql
  CREATE TABLE audit_log (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID,
    action TEXT,
    table_name TEXT,
    record_id BIGINT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
  );
  ```

- [ ] **Review logs weekly**
  - Check for security incidents
  - Identify performance issues
  - Update security rules

---

## Code Security

### Secure Coding Practices

- [ ] **Avoid eval() and similar**
  - No `eval()`
  - No `Function()` constructor
  - No `innerHTML` without sanitization

- [ ] **Validate all user input**
  - Type checking
  - Range validation
  - Format validation

- [ ] **Use strict mode**
  ```javascript
  'use strict';
  ```

- [ ] **Avoid sensitive data in client**
  - No API keys in frontend code
  - No business logic in client
  - Server-side validation for critical operations

### Code Review

- [ ] **Security-focused code reviews**
  - Check for XSS vulnerabilities
  - Verify input sanitization
  - Review authentication logic
  - Test authorization rules

- [ ] **Use automated security scanning**
  ```bash
  # Add to CI/CD
  npm install --save-dev eslint-plugin-security
  ```

- [ ] **Regular penetration testing**
  - Test authentication bypass
  - SQL injection attempts
  - XSS attack vectors
  - CSRF vulnerabilities

---

## Third-Party Security

### Supabase

- [ ] **Review Supabase security settings**
  - Enable 2FA on account
  - Review organization members
  - Audit RLS policies
  - Check storage permissions

- [ ] **Configure storage bucket security**
  ```sql
  -- Only authenticated users can upload
  CREATE POLICY "Users can upload own files"
  ON storage.objects FOR INSERT
  WITH CHECK (auth.uid()::text = (storage.foldername(name))[1]);
  ```

- [ ] **Monitor Supabase usage**
  - Set up billing alerts
  - Monitor API usage
  - Track storage consumption

### CDN & External Services

- [ ] **Verify Pyodide integrity**
  ```html
  <script 
    src="https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js"
    integrity="sha384-..."
    crossorigin="anonymous">
  </script>
  ```

- [ ] **Use Subresource Integrity (SRI)**
  - For all CDN resources
  - Verify hash matches

- [ ] **Review third-party scripts**
  - Minimize external dependencies
  - Audit analytics scripts
  - Use privacy-focused alternatives

---

## Incident Response

### Preparation

- [ ] **Create incident response plan**
  - Define severity levels
  - List contact information
  - Document escalation procedures

- [ ] **Prepare communication templates**
  - User notification email
  - Status page updates
  - Media statements

- [ ] **Designate security team**
  - Primary contact: [Name]
  - Backup contact: [Name]
  - External security consultant: [Company]

### Response Procedures

- [ ] **In case of credential leak**
  1. Immediately rotate all keys
  2. Audit database for unauthorized access
  3. Notify affected users
  4. Update incident log

- [ ] **In case of data breach**
  1. Isolate affected systems
  2. Preserve evidence
  3. Assess scope of breach
  4. Notify authorities (GDPR requirement)
  5. Communicate with users

- [ ] **In case of DDoS attack**
  1. Enable DDoS protection
  2. Contact hosting provider
  3. Implement rate limiting
  4. Monitor traffic patterns

---

## Compliance

### Legal Requirements

- [ ] **Privacy Policy**
  - What data is collected
  - How data is used
  - How data is protected
  - User rights (GDPR)

- [ ] **Terms of Service**
  - Acceptable use policy
  - User responsibilities
  - Limitation of liability

- [ ] **Cookie Policy**
  - Types of cookies used
  - How to disable cookies
  - Third-party cookies

### Data Protection

- [ ] **GDPR Compliance (if EU users)**
  - Right to access
  - Right to deletion
  - Right to portability
  - Cookie consent

- [ ] **CCPA Compliance (if California users)**
  - Privacy notice
  - Opt-out mechanism
  - Data sale disclosure

---

## Security Testing

### Manual Testing

- [ ] **Test authentication**
  - Try weak passwords
  - Test password reset flow
  - Verify session expiration
  - Test "remember me" functionality

- [ ] **Test authorization**
  - Access other users' data
  - Modify other users' records
  - Delete other users' content
  - Bypass access controls

- [ ] **Test input validation**
  - SQL injection attempts
  - XSS payloads
  - Path traversal
  - File upload exploits

### Automated Testing

- [ ] **Run security scanners**
  ```bash
  # OWASP ZAP
  docker run -t owasp/zap2docker-stable zap-baseline.py \
    -t https://your-app.com
  
  # npm audit
  npm audit --production
  
  # Snyk
  npx snyk test
  ```

- [ ] **Integrate into CI/CD**
  - Security tests in every PR
  - Fail build on critical issues
  - Weekly full security scan

---

## Checklist Summary

### Critical (Must Complete Before Deployment)

- [ ] Remove .env from Git
- [ ] Regenerate all credentials
- [ ] Enable RLS on all tables
- [ ] Implement server-side validation
- [ ] Add input sanitization
- [ ] Configure HTTPS

### High Priority (Complete Within Week)

- [ ] Rate limiting
- [ ] Error monitoring
- [ ] Security headers
- [ ] Audit logging
- [ ] File upload validation

### Medium Priority (Complete Within Month)

- [ ] Penetration testing
- [ ] Privacy policy
- [ ] Incident response plan
- [ ] Regular security audits

---

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [React Security Best Practices](https://github.com/facebook/react/blob/main/SECURITY.md)
- [Web Security Checklist](https://github.com/virajkulkarni14/WebDeveloperSecurityChecklist)

---

**Next Review**: December 3, 2025  
**Responsible**: Security Team
