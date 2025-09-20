# Figma API Setup Guide

## 🚨 Issue Identified
Your API key `figd_feqBOA7QYsosHDsYj4ZXLVxvyJNwUKjtYtlQjG_2` is returning "Invalid token" error.

## 🔧 Solution: Generate New API Key

### Step 1: Go to Figma Developer Portal
1. Visit: https://www.figma.com/developers/api#access-tokens
2. Click "Log in" (if not already logged in)
3. You'll be redirected to your Figma account

### Step 2: Create New Personal Access Token
1. Scroll down to "Personal Access Tokens" section
2. Click "Generate new token"
3. Enter a description: "Fataplus Design System Integration"
4. Click "Generate token"

### Step 3: Copy Your New Token
- **Important**: Copy the token immediately - you won't see it again
- Token format: `figd_` followed by random characters
- Example: `figd_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### Step 4: Update Configuration
Edit `/config/.env.figma-mcp`:

```bash
# Replace this line:
FIGMA_API_KEY=figd_feqBOA7QYsosHDsYj4ZXLVxvyJNwUKjtYtlQjG_2

# With your new token:
FIGMA_API_KEY=figd_YOUR_NEW_TOKEN_HERE
```

### Step 5: Test the New Token
```bash
# Update the token in scripts too
sed -i '' 's/figd_feqBOA7QYsosHDsYj4ZXLVxvyJNwUKjtYtlQjG_2/figd_YOUR_NEW_TOKEN_HERE/g' scripts/*.js

# Test the connection
node scripts/test-figma-access.js
```

## 🔍 Verify Token Permissions
After generating the token:

1. **File Access**: Ensure your Fataplus Design Systems file is accessible
2. **Team Access**: If file is in a team, ensure token has team access
3. **File Sharing**: Consider making the file public for testing

## 📝 Additional Tips

### Team API Keys (Advanced)
If you need team-level access:
1. Go to: https://www.figma.com/developers/teams
2. Create team-specific API key
3. Update configuration accordingly

### File URL Structure
Your file URL: `https://www.figma.com/design/n1AqRbX6deIXncAMnQbiXW/Fataplus-Design-Systems`
- File Key: `n1AqRbX6deIXncAMnQbiXW`
- Node ID: `2368-52`

### Testing Commands
```bash
# Test API access
curl -H "X-Figma-Token: YOUR_NEW_TOKEN" "https://api.figma.com/v1/files/n1AqRbX6deIXncAMnQbiXW"

# Test specific node
curl -H "X-Figma-Token: YOUR_NEW_TOKEN" "https://api.figma.com/v1/files/n1AqRbX6deIXncAMnQbiXW/nodes?ids=2368-52"
```

## 🚀 Next Steps After Fix

Once you have a valid API key:
1. Test with our scripts
2. Extract real design system data
3. Replace mock implementation with actual Figma data
4. Set up automated synchronization

## 📞 Support
If you continue to have issues:
- Figma API docs: https://www.figma.com/developers/api
- API troubleshooting: https://help.figma.com/hc/en-us/articles/360039838533-Using-the-Figma-API