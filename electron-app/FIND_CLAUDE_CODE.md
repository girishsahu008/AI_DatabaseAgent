# Finding Your Claude Code Installation

## Question

What command do you use to run Claude Code in your terminal?

Please tell me:

1. **What command do you type?**
   - Is it `claude-code`?
   - Is it `claude`?
   - Is it something else?

2. **Where is it installed?**
   - Run this to find it:
     ```powershell
     Get-Command claude* | Select-Object Name, Source
     ```

3. **How did you install it?**
   - npm? `npm install -g @anthropic-ai/claude-code`
   - Binary download from website?
   - Other method?

## Common Names

Claude Code might be called:
- `claude-code`
- `claude`
- `anthropic-claude`
- Or installed via npm as `npx @anthropic-ai/claude-code`

## Once We Find It

Once you tell me the exact command, I'll update the Electron app to use it:

**In `claude-code-bridge.js`, line 42:**
```javascript
this.claudeProcess = spawn('YOUR_COMMAND_HERE', claudeArgs, {
```

**Please run this command and tell me the output:**

```powershell
Get-Command claude* | Select-Object Name, Source
```

Or tell me: **"What command do you type to run Claude Code in your terminal?"**

