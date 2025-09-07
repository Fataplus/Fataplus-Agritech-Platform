# GitHub Branch Protection Rules

## Main Branch Protection

### Branch: `main`
**Status**: 🔒 Protected

#### Required Reviews
- **Required approvals**: 2
- **Dismiss stale reviews**: ✅ Enabled
- **Require review from code owners**: ✅ Enabled
- **Restrict push access**: ✅ Enabled
- **Allow force pushes**: ❌ Disabled
- **Allow deletions**: ❌ Disabled

#### Required Status Checks
- **Require branches to be up to date**: ✅ Enabled
- **Required status checks**:
  - `ci/web-frontend` (Web Frontend CI)
  - `ci/web-backend` (Web Backend CI)
  - `ci/mobile-app` (Mobile App CI)
  - `ci/ai-services` (AI Services CI)
  - `security/codeql` (Security Analysis)
  - `test/coverage` (Test Coverage)
  - `lint/all` (Code Quality)

#### Restrictions
- **Allow pushes**: Only repository administrators
- **Allow force pushes**: ❌ Disabled
- **Allow deletions**: ❌ Disabled

## Development Branch Protection

### Branch: `develop`
**Status**: 🔒 Protected

#### Required Reviews
- **Required approvals**: 1
- **Dismiss stale reviews**: ✅ Enabled
- **Require review from code owners**: ✅ Enabled
- **Restrict push access**: ✅ Enabled

#### Required Status Checks
- **Require branches to be up to date**: ✅ Enabled
- **Required status checks**:
  - `ci/web-frontend`
  - `ci/web-backend`
  - `ci/mobile-app`
  - `ci/ai-services`
  - `test/unit`
  - `lint/all`

## Staging Branch Protection

### Branch: `staging`
**Status**: 🔒 Protected

#### Required Reviews
- **Required approvals**: 1
- **Dismiss stale reviews**: ✅ Enabled
- **Require review from code owners**: ✅ Enabled

#### Required Status Checks
- **Require branches to be up to date**: ✅ Enabled
- **Required status checks**:
  - `ci/web-frontend`
  - `ci/web-backend`
  - `ci/mobile-app`
  - `ci/ai-services`
  - `test/integration`
  - `security/scan`

## Feature Branch Naming Convention

### Pattern: `feature/[type]/[description]`
**Examples**:
- `feature/auth/user-registration`
- `feature/weather/weather-api-integration`
- `feature/ui/farm-management-dashboard`
- `feature/api/farms-crud-endpoints`
- `feature/mobile/offline-sync`
- `feature/ai/livestock-health-prediction`

### Types Allowed:
- `auth` - Authentication & authorization
- `api` - API development
- `ui` - User interface
- `mobile` - Mobile application
- `ai` - AI/ML services
- `infra` - Infrastructure
- `security` - Security features
- `test` - Testing
- `docs` - Documentation
- `config` - Configuration
- `refactor` - Code refactoring
- `fix` - Bug fixes
- `perf` - Performance improvements

## Hotfix Branch Naming Convention

### Pattern: `hotfix/[issue-number]/[description]`
**Examples**:
- `hotfix/123/auth-token-expiry`
- `hotfix/456/mobile-crash-login`

## Release Branch Naming Convention

### Pattern: `release/v[major].[minor].[patch]`
**Examples**:
- `release/v1.0.0`
- `release/v1.1.0`
- `release/v2.0.0-beta`

## Pull Request Guidelines

### PR Title Format
```
[type]: Brief description of changes

Examples:
- feat: Add user authentication with JWT
- fix: Resolve mobile app crash on login
- docs: Update API documentation for farms endpoint
- refactor: Simplify weather prediction service
- test: Add integration tests for user registration
```

### PR Description Requirements
- **Summary**: What changes were made and why
- **Testing**: How the changes were tested
- **Breaking Changes**: Any breaking changes for API consumers
- **Screenshots**: UI changes with before/after screenshots
- **Related Issues**: Links to related issues or tasks
- **Checklist**: Standard checklist for review

### PR Size Guidelines
- **Small PRs** (< 200 lines): Preferred for quick review
- **Medium PRs** (200-500 lines): Acceptable with good documentation
- **Large PRs** (> 500 lines): Should be split into smaller PRs
- **Exception**: Major feature releases or architectural changes

## Commit Message Guidelines

### Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `perf`: Performance improvements
- `ci`: CI/CD changes
- `build`: Build system changes
- `revert`: Revert previous commit

### Examples
```
feat(auth): Add JWT-based user authentication

- Implement login endpoint with email/password
- Add token refresh mechanism
- Create user registration flow

Closes #123
```

```
fix(api): Resolve farms endpoint pagination bug

- Fix offset calculation in farms query
- Add proper error handling for invalid page numbers
- Update API documentation

Fixes #456
```

## Repository Settings

### General Settings
- **Repository name**: fataplus-agritech-platform
- **Description**: Multi-context SaaS platform for African agriculture
- **Visibility**: Private (until MVP is ready)
- **Features**:
  - ✅ Issues
  - ✅ Projects
  - ✅ Wiki
  - ✅ Discussions
  - ❌ Sponsorships

### Collaborators & Teams
- **Admin**: @fefe (Repository Owner)
- **Maintain**: Core development team
- **Write**: Contributors with commit access
- **Read**: Stakeholders and reviewers
- **Triage**: Community contributors

### Security
- **Dependabot**: ✅ Enabled for security updates
- **Code scanning**: ✅ Enabled with CodeQL
- **Secret scanning**: ✅ Enabled
- **Dependency review**: ✅ Enabled for PRs

### Branches
- **Default branch**: `main`
- **Protected branches**: `main`, `develop`, `staging`
- **Branch naming**: Enforced via branch protection rules

### Webhooks
- **CI/CD Integration**: GitHub Actions webhooks
- **Deployment**: Vercel, Railway deployment webhooks
- **Monitoring**: Sentry error tracking webhooks
- **Security**: Security scanning result webhooks

## Emergency Procedures

### Hotfix Process
1. Create hotfix branch from `main`
2. Implement and test fix
3. Create PR to `main` with hotfix label
4. After approval, merge and tag release
5. Deploy to production immediately

### Rollback Process
1. Identify problematic commit
2. Create revert commit on `main`
3. Tag as patch release
4. Deploy rollback immediately
5. Investigate root cause on separate branch

### Security Incident Response
1. Immediately notify security team
2. Create incident response branch
3. Implement security fix
4. Coordinate with legal/compliance
5. Deploy security patch
6. Post-mortem analysis

---

*Branch protection and workflow configuration for Fataplus v1.0.0*
