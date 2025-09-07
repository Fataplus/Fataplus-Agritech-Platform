# Contributing to Fataplus

Thank you for your interest in contributing to Fataplus! 🌱

This document provides guidelines and information for contributors. By participating in this project, you agree to abide by our [Code of Conduct](./CODE_OF_CONDUCT.md).

## 📋 Table of Contents

- [Development Workflow](#development-workflow)
- [Getting Started](#getting-started)
- [Making Changes](#making-changes)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Code Review Process](#code-review-process)
- [Reporting Issues](#reporting-issues)

## 🚀 Development Workflow

### 1. Choose or Create an Issue
- Check existing [issues](../../issues) for work to be done
- Create a new issue if your work doesn't have an existing ticket
- Use issue templates for bug reports, feature requests, and tasks

### 2. Create a Feature Branch
```bash
# From main branch
git checkout main
git pull origin main

# Create feature branch
git checkout -b feature/auth/user-registration
```

### 3. Make Your Changes
- Follow the [coding standards](#coding-standards)
- Write tests for new functionality
- Update documentation as needed
- Ensure all tests pass

### 4. Submit a Pull Request
- Push your branch to GitHub
- Create a Pull Request with a clear description
- Request review from appropriate team members
- Address any feedback from reviewers

## 🏁 Getting Started

### Prerequisites
- Node.js 18+ (for web-frontend and mobile-app)
- Python 3.11+ (for web-backend and ai-services)
- Git
- Docker & Docker Compose (for local development)

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/fataplus.git
   cd fataplus
   ```

2. **Install dependencies**
   ```bash
   # Web Frontend
   cd web-frontend && npm install

   # Web Backend
   cd ../web-backend && pip install -r requirements.txt

   # AI Services
   cd ../ai-services && pip install -r requirements.txt

   # Mobile App
   cd ../mobile-app && npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your local configuration
   ```

4. **Start development servers**
   ```bash
   # Web Frontend (Terminal 1)
   cd web-frontend && npm run dev

   # Web Backend (Terminal 2)
   cd web-backend && python main.py

   # AI Services (Terminal 3)
   cd ai-services && python main.py
   ```

5. **Run tests**
   ```bash
   # Run all tests
   npm run test:all

   # Run specific service tests
   cd web-frontend && npm test
   cd ../web-backend && pytest
   ```

## 🔧 Making Changes

### Coding Standards

#### General Guidelines
- Follow the existing code style in the project
- Use meaningful variable and function names
- Write clear, concise comments
- Keep functions small and focused
- Handle errors gracefully

#### Language-Specific Standards

**TypeScript/JavaScript (Web Frontend, Mobile App)**
- Use TypeScript for all new code
- Follow ESLint configuration
- Use Prettier for code formatting
- Prefer functional programming patterns
- Use React hooks appropriately

**Python (Web Backend, AI Services)**
- Follow PEP 8 style guide
- Use type hints for all functions
- Write docstrings for modules, classes, and functions
- Use async/await for asynchronous operations
- Handle exceptions appropriately

**Infrastructure as Code**
- Use Terraform for cloud infrastructure
- Follow Kubernetes best practices
- Document all infrastructure changes
- Use environment-specific configurations

### File Organization
```
web-frontend/
├── src/
│   ├── components/     # Reusable UI components
│   ├── contexts/       # Context-specific business logic
│   ├── pages/         # Next.js page components
│   ├── hooks/         # Custom React hooks
│   ├── lib/           # Utility functions and configurations
│   └── types/         # TypeScript type definitions

web-backend/
├── src/
│   ├── routes/        # API route handlers
│   ├── services/      # Business logic services
│   ├── models/        # Database models
│   └── lib/           # Shared utilities

ai-services/
├── [service-name]/
│   ├── model/         # ML model files
│   ├── api/           # API endpoints
│   └── tests/         # Service-specific tests
```

### Commit Guidelines

#### Commit Message Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

#### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `perf`: Performance improvements

#### Examples
```bash
feat(auth): Add JWT-based user authentication

- Implement login endpoint with email/password
- Add token refresh mechanism
- Create user registration flow

Closes #123
```

```bash
fix(api): Resolve farms endpoint pagination bug

- Fix offset calculation in farms query
- Add proper error handling for invalid page numbers
- Update API documentation

Fixes #456
```

## 🧪 Testing

### Testing Strategy
- **Unit Tests**: Test individual functions and components
- **Integration Tests**: Test interactions between components
- **End-to-End Tests**: Test complete user workflows
- **Contract Tests**: Test API contracts between services

### Running Tests
```bash
# All tests
npm run test:all

# Specific test types
npm run test:unit
npm run test:integration
npm run test:e2e

# With coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### Testing Guidelines
- Write tests for all new functionality
- Maintain >80% code coverage
- Use descriptive test names
- Test both positive and negative scenarios
- Mock external dependencies
- Test error conditions and edge cases

## 📝 Submitting Changes

### Pull Request Process

1. **Create a Pull Request**
   - Use a clear, descriptive title
   - Fill out the PR template completely
   - Reference related issues
   - Add appropriate labels

2. **PR Title Format**
   ```
   [type]: Brief description of changes
   ```
   Examples:
   - `[feat] Add user authentication with JWT`
   - `[fix] Resolve mobile app crash on login`
   - `[docs] Update API documentation`

3. **PR Description Requirements**
   - **Summary**: What changes were made and why
   - **Testing**: How the changes were tested
   - **Breaking Changes**: Any breaking changes
   - **Screenshots**: UI changes with before/after
   - **Related Issues**: Links to issues or tasks

4. **PR Checklist**
   - [ ] Code follows project style guidelines
   - [ ] Tests have been added/updated
   - [ ] Documentation has been updated
   - [ ] All tests pass
   - [ ] Code has been reviewed
   - [ ] Changes have been tested in staging

### Branch Strategy
- `main`: Production-ready code
- `develop`: Integration branch for features
- `feature/*`: Feature development branches
- `hotfix/*`: Critical bug fixes
- `release/*`: Release preparation branches

## 👥 Code Review Process

### Review Checklist
- [ ] **Functionality**: Code works as intended
- [ ] **Code Quality**: Follows coding standards
- [ ] **Tests**: Adequate test coverage
- [ ] **Documentation**: Code is well-documented
- [ ] **Security**: No security vulnerabilities
- [ ] **Performance**: No performance regressions
- [ ] **Architecture**: Follows project architecture

### Review Guidelines
- **Be constructive**: Focus on improvement, not criticism
- **Explain reasoning**: Provide context for suggestions
- **Consider impact**: Think about broader implications
- **Be timely**: Review requests within 24-48 hours
- **Follow up**: Ensure changes are implemented

### Review Process
1. **Automated Checks**: CI/CD pipeline runs
2. **Peer Review**: At least 1 reviewer required
3. **Code Owner Review**: Required for protected paths
4. **Approval**: Minimum 1 approval required
5. **Merge**: Squash merge with descriptive commit message

## 🐛 Reporting Issues

### Bug Reports
Use the bug report template when creating issues:
- **Title**: Clear, descriptive title
- **Description**: Steps to reproduce, expected vs actual behavior
- **Environment**: Browser, OS, device information
- **Screenshots**: Visual evidence of the issue
- **Logs**: Relevant error messages or console output

### Feature Requests
Use the feature request template:
- **Title**: Clear description of the feature
- **Problem**: What problem does this solve?
- **Solution**: Proposed solution and alternatives
- **Use Cases**: Who would use this and how?

### Issue Labels
- `bug`: Something isn't working
- `enhancement`: New feature or improvement
- `documentation`: Documentation issues
- `question`: General questions
- `help wanted`: Community contribution opportunities
- `good first issue`: Suitable for new contributors

## 📚 Additional Resources

- [Project Documentation](../../docs/)
- [API Documentation](../../web-backend/docs/)
- [Architecture Overview](../../specs/)
- [Development Setup](../../docs/development.md)
- [Code of Conduct](./CODE_OF_CONDUCT.md)

## 🙏 Recognition

Contributors are recognized in our [CONTRIBUTORS.md](../../CONTRIBUTORS.md) file and mentioned in release notes.

---

Thank you for contributing to Fataplus! Your efforts help build the future of African agriculture. 🌱

*Contributing guidelines for Fataplus v1.0.0*
