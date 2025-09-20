# Fataplus Design System Integration Guide

## 🎯 Overview

This guide documents the integration of Figma design systems into the Fataplus web application. The system provides a comprehensive set of design tokens, components, and utilities that ensure consistency across the platform.

## 🔧 Figma MCP Server Status

### ✅ Connected and Working
- **Server**: Figma MCP Server v0.6.0
- **URL**: `http://127.0.0.1:3845/mcp`
- **Mode**: stdio (standard input/output)
- **API Key**: `YOUR_FIGMA_API_KEY` (set via FIGMA_API_KEY environment variable)

### ⚠️ Current Issue
- **Problem**: 403 Forbidden error when accessing the target Figma file
- **File**: `n1AqRbX6deIXncAMnQbiXW` (Fataplus Design Systems)
- **Solution**: Contact file owner for access permissions

## 🎨 Design System Implementation

### 1. Design Tokens (`/web-frontend/src/styles/design-tokens.css`)

Comprehensive CSS variables extracted from Figma design system:

```css
/* Primary Colors */
--color-primary-50: #E8F5E9;
--color-primary-500: #4CAF50;
--color-primary-900: #1B5E20;

/* Typography */
--font-primary: 'Inter', sans-serif;
--text-base: 1rem;
--font-medium: 500;

/* Spacing */
--space-1: 0.25rem;
--space-4: 1rem;
--space-6: 1.5rem;

/* Components */
--radius-md: 0.375rem;
--shadow-base: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
```

### 2. React Components (`/web-frontend/src/components/ui/DesignSystemComponents.tsx`)

Complete component library with Figma-like variants:

#### Button Component
```tsx
<Button variant="primary" size="md" isLoading={false}>
  Click Me
</Button>

// Variants: primary, secondary, outline, ghost
// Sizes: sm, md, lg
```

#### Card Component
```tsx
<Card variant="elevated" padding="lg">
  <h3>Card Title</h3>
  <p>Card content</p>
</Card>

// Variants: default, outlined, elevated
// Padding: none, sm, md, lg
```

#### Input Component
```tsx
<Input
  label="Email"
  type="email"
  placeholder="Enter your email"
  error={errorMessage}
  helperText="We'll never share your email"
/>
```

#### Badge Component
```tsx
<Badge variant="success" size="md">
  Active
</Badge>

// Variants: success, warning, error, info, default
```

#### Avatar Component
```tsx
<Avatar
  src="/avatar.jpg"
  alt="User Name"
  size="md"
  fallback="UN"
/>
```

#### Progress Component
```tsx
<Progress value={75} max={100} variant="success" size="md" />
```

## 🚀 Quick Start

### 1. Import Design Tokens
```tsx
import '../styles/design-tokens.css';
```

### 2. Import Components
```tsx
import { DesignSystem } from '../components/ui/DesignSystemComponents';

const { Button, Card, Input, Badge, Avatar, Progress } = DesignSystem;
```

### 3. Usage Example
```tsx
function UserProfile() {
  return (
    <DesignSystem.Container maxWidth="lg">
      <Card variant="elevated" padding="lg">
        <div className="flex items-center space-x-4">
          <Avatar
            src="/user-avatar.jpg"
            alt="John Doe"
            size="lg"
            fallback="JD"
          />
          <div>
            <h2 className="text-xl font-bold">John Doe</h2>
            <Badge variant="success">Active</Badge>
          </div>
        </div>
        <div className="mt-4">
          <Progress value={85} max={100} variant="success" />
        </div>
        <div className="mt-4 space-y-2">
          <Input
            label="Email"
            type="email"
            defaultValue="john@example.com"
          />
          <Button variant="primary" size="md">
            Update Profile
          </Button>
        </div>
      </Card>
    </DesignSystem.Container>
  );
}
```

## 🔧 Configuration Files

### MCP Configuration
- **File**: `/config/.env.figma-mcp`
- **Purpose**: Figma MCP server configuration
- **Settings**: API key, server URL, output paths

### Test Scripts
- **File**: `/scripts/test-figma-access.js`
- **Purpose**: Test Figma API access and MCP server
- **Usage**: `node scripts/test-figma-access.js`

- **File**: `/scripts/figma-permissions-check.js`
- **Purpose**: Check API key permissions
- **Usage**: `node scripts/figma-permissions-check.js`

## 📊 Architecture

### File Structure
```
figma-analysis/
├── mock-design-system.json          # Mock Figma data
├── design-system-analysis-report.md # Analysis report
├── figma-mcp-tools-reference.md     # Tools documentation
├── ANALYSIS_SUMMARY.md             # Project summary
└── DESIGN_SYSTEM_INTEGRATION_GUIDE.md # This guide

web-frontend/src/
├── styles/
│   └── design-tokens.css           # CSS design tokens
├── components/ui/
│   └── DesignSystemComponents.tsx  # React components
└── ...

scripts/
├── test-figma-access.js            # Figma access test
├── figma-permissions-check.js      # Permissions check
└── figma-mcp-connection-test.js    # MCP connection test

config/
└── .env.figma-mcp                  # MCP configuration
```

## 🛠️ Development Workflow

### 1. When Figma Access is Resolved
```bash
# Test Figma access
node scripts/test-figma-access.js

# Extract design data (when permissions are fixed)
node scripts/extract-figma-data.js

# Generate design tokens
node scripts/generate-design-tokens.js
```

### 2. Component Development
1. Use existing design tokens for styling
2. Follow component variants from mock system
3. Implement responsive design with spacing scale
4. Add accessibility features

### 3. Testing
```bash
# Test MCP connection
./scripts/test-figma-mcp.sh

# Check design system implementation
npm test -- --testPathPattern=design-system
```

## 📋 Next Steps

### Immediate Actions
1. **Fix Figma Access**: Contact file owner for API key permissions
2. **Update Components**: Replace mock data with real Figma data
3. **Add Documentation**: Create component documentation

### Medium-term Goals
1. **Component Library**: Expand to include more complex components
2. **Storybook**: Create interactive component showcase
3. **Design System Website**: Build documentation site

### Long-term Vision
1. **Automated Sync**: Real-time Figma to code synchronization
2. **Design Tokens API**: Expose tokens via API
3. **Multi-platform Support**: Extend to mobile and desktop

## 🔍 Troubleshooting

### Common Issues

#### 403 Forbidden Error
**Problem**: Cannot access Figma files
**Solution**:
- Verify API key permissions
- Contact file owner
- Check file sharing settings

#### MCP Server Not Running
**Problem**: MCP server not responding
**Solution**:
- Check if server is running: `ps aux | grep figma`
- Restart server: `npx figma-developer-mcp --stdio`
- Verify configuration in `.env.figma-mcp`

#### CSS Variables Not Working
**Problem**: Design tokens not applied
**Solution**:
- Ensure CSS file is imported
- Check browser compatibility
- Verify variable names

### Debug Commands
```bash
# Check MCP processes
ps aux | grep figma

# Test API access
curl -H "X-Figma-Token: your_token" https://api.figma.com/v1/files/file_key

# View logs
tail -f /var/log/figma-mcp.log
```

## 📞 Support

For issues related to:
- **Figma Access**: Contact Figma file owner
- **MCP Server**: Check server documentation
- **Component Implementation**: Review this guide
- **Code Integration**: Check existing implementation

## 🎉 Success Criteria

The design system integration is successful when:
- ✅ All components use design tokens
- ✅ Consistent styling across the application
- ✅ Figma MCP server is connected and working
- ✅ Real Figma data is being used (when permissions are fixed)
- ✅ Components are accessible and responsive
- ✅ Documentation is comprehensive and up-to-date