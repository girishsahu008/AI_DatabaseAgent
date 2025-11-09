# Requirements for Claude Code Integration

## What You Need

### 1. Claude Code Installed

**Check if installed:**
```bash
claude-code --version
```

**If not installed:**
- Visit: https://code.claude.com/
- Download and install Claude Code
- Follow installation instructions

### 2. Anthropic API Key

**Get an API key:**
1. Visit: https://console.anthropic.com/
2. Sign up or log in
3. Go to API Keys section
4. Create a new API key
5. Copy the key

**Configure Claude Code with API key:**
```bash
claude-code config set apiKey YOUR_API_KEY_HERE
```

**Example:**
```bash
claude-code config set apiKey sk-ant-api03-xxxxxxxxxxxxx
```

### 3. Claude Code in PATH

Claude Code must be accessible from command line:

**Test:**
```bash
claude-code --version
```

**If not found:**
- Add Claude Code installation directory to system PATH
- Or reinstall Claude Code

### 4. Node.js 18+

```bash
node --version
```

Should show v18.0.0 or higher.

### 5. Database Configuration

File: `electron-app/config.env`

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=your_database
DB_USER=your_username
DB_PASSWORD=your_password
```

### 6. Dependencies Installed

```bash
cd electron-app
npm install
```

## ✅ Verification Checklist

Run these commands to verify everything is ready:

```bash
# 1. Check Claude Code
claude-code --version

# 2. Check API key is configured
claude-code config list

# 3. Check Node.js
node --version

# 4. Check dependencies
cd electron-app
npm list

# 5. Check database config
Test-Path config.env

# 6. Test database connection
cd ..
node test-connection.js
```

## 🚀 Once Everything is Ready

```bash
cd electron-app
npm start
```

You should see:
- ✅ Electron window opens
- ✅ Status: "🤖 Claude AI Ready (Powered by Claude Code)"
- ✅ Chat interface ready for questions

## 💰 Cost Considerations

Claude Code uses the Anthropic API, which has costs:
- **Free tier:** Limited requests
- **Paid tier:** Pay per token used

**Approximate costs:**
- Simple queries: ~$0.01 - $0.02 each
- Complex queries: ~$0.05 - $0.10 each

Monitor your usage at: https://console.anthropic.com/

## 🔒 Privacy Notes

- **Your queries:** Sent to Claude API (Anthropic)
- **Your database data:** Stays on your machine
- **MCP server:** Runs locally
- **Results:** Processed locally

Claude API sees:
- ✅ Your questions
- ✅ Database schema (table/column names)
- ❌ Not your actual data (unless in query results)

## 🎯 Alternative: Fallback Mode

If you don't want to use Claude API:
- App still works in fallback mode
- Uses pattern matching instead of AI
- No API costs
- More limited query understanding

## 📝 Summary

**Required:**
- ✅ Claude Code installed
- ✅ API key configured
- ✅ Node.js 18+
- ✅ Database configured

**Optional (but recommended):**
- Anthropic API credits
- Fast internet connection

**Once ready:**
```bash
npm start
```

Then ask: "Find the sales for last month" 🚀

