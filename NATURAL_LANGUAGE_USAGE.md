# Natural Language Usage Guide

## 🎯 Overview

You can now interact with context features using **natural language** in Claude Desktop! No need to remember exact tool names or parameters.

---

## 💾 Saving Context

### ✅ What You Can Say

Just ask Claude naturally:

- **"Save this chat context"**
- **"Save the current session"**
- **"Save this conversation"**
- **"Save what we've been working on"**
- **"Save this analysis"**

### How It Works

1. **Claude automatically:**
   - Collects all queries executed in this conversation
   - Gathers any findings you've added
   - Saves everything to a context file

2. **Claude will ask you:**
   - For a session name (or suggest one based on your conversation)
   - For a summary (or create one from your queries)
   - For any additional notes (optional)

### Example Conversation

**You:** "I've been analyzing sales data. Save this chat context."

**Claude:** "I'll save this session for you. Based on our conversation, I suggest the name 'sales_analysis'. Would you like to use that, or do you have a different name in mind?"

**You:** "That's perfect"

**Claude:** "Great! I've saved your context as 'sales_analysis'. It includes 5 queries and 3 findings. The context has been saved successfully!"

---

## 📚 Loading History

### ✅ What You Can Say

- **"Load history"**
- **"Show me previous sessions"**
- **"Load the latest context"**
- **"Continue from the last session"**
- **"Load context 1"** (by number)
- **"Load sales_analysis"** (by name)

### Interactive Selection

When you ask to "load history" or "show previous sessions":

1. **Claude will show you a numbered list:**
   ```
   📚 Saved Contexts (3 total):

   1. sales_analysis (2024-11-06_14-30-45)
      Created: 11/6/2024, 2:30:45 PM
      Summary: Analyzed Q3 sales data
      Queries: 5, Findings: 3
      💡 You can load this by number: 1, name: "sales_analysis", or ID: "2024-11-06_14-30-45"

   2. customer_review (2024-11-05_10-15-20)
      Created: 11/5/2024, 10:15:20 AM
      Summary: Reviewed customer segments
      Queries: 8, Findings: 5
      💡 You can load this by number: 2, name: "customer_review", or ID: "2024-11-05_10-15-20"
   ```

2. **Then you can say:**
   - **"Load 1"** or **"Load the first one"**
   - **"Load sales_analysis"**
   - **"Load the latest"** (loads #1 automatically)

### Example Conversation

**You:** "Load history"

**Claude:** *[Shows numbered list of contexts]*

**You:** "Load 1"

**Claude:** *[Loads and displays the context with all queries and findings]*

---

## 🔍 Three Ways to Load Contexts

### 1. By Number (Easiest)
After seeing the list, just say the number:
- **"Load 1"**
- **"Load context 2"**
- **"Load the first one"**

### 2. By Name
Use the session name:
- **"Load sales_analysis"**
- **"Load customer_review"**

### 3. By ID
Use the session ID:
- **"Load 2024-11-06_14-30-45"**

---

## 📋 Listing Contexts

### ✅ What You Can Say

- **"Show history"**
- **"List saved sessions"**
- **"What contexts are saved?"**
- **"Show previous contexts"**
- **"What sessions do I have?"**

### What You'll See

A numbered list showing:
- Session name
- Creation date
- Summary
- Number of queries
- Number of findings
- How to load each one

---

## 🎯 Common Use Cases

### Use Case 1: Save After Analysis

**You:** "I've finished analyzing the Q3 sales. Save this context."

**Claude:** *[Saves context with all queries and findings]*

### Use Case 2: Continue Previous Work

**You:** "Load the latest session"

**Claude:** *[Loads most recent context]*

**You:** "Continue from where we left off"

**Claude:** *[Uses loaded context to continue analysis]*

### Use Case 3: Browse History

**You:** "Show me all saved sessions"

**Claude:** *[Shows numbered list]*

**You:** "Load the sales analysis one"

**Claude:** *[Loads that context]*

### Use Case 4: Quick Reference

**You:** "What was the last analysis about?"

**Claude:** *[Automatically loads latest context and summarizes]*

---

## 💡 Tips

### 1. Automatic Query Tracking
- **All queries are automatically tracked** - you don't need to do anything special
- Just execute queries normally, and they'll be included when you save

### 2. Adding Findings
You can add findings anytime:
- **"Add this finding: Revenue increased 23%"**
- **"Remember that customer retention improved"**

### 3. Smart Defaults
- If you don't provide a session name, Claude will suggest one
- If you don't provide a summary, Claude will create one from your queries
- "Latest" or "most recent" automatically loads context #1

### 4. Error Messages Are Helpful
If you try to load a context that doesn't exist, Claude will:
- Show you available contexts
- Suggest how to load them
- Guide you to use `list_saved_contexts` if needed

---

## 🔄 Complete Workflow Example

### Step 1: Work on Analysis
```
You: "Execute a query to get Q3 orders"
Claude: [Executes query, automatically tracks it]

You: "Now get customer segments"
Claude: [Executes query, automatically tracks it]

You: "Add finding: Revenue increased 23%"
Claude: [Adds finding to context]
```

### Step 2: Save Context
```
You: "Save this chat context"
Claude: "What would you like to name this session?"
You: "q3_sales_analysis"
Claude: [Saves context with all queries and findings]
```

### Step 3: Later, Load Context
```
You: "Load history"
Claude: [Shows list of saved contexts]
You: "Load 1"
Claude: [Loads q3_sales_analysis with all previous work]
```

### Step 4: Continue Work
```
You: "Continue analyzing from where we left off"
Claude: [Uses loaded context to continue analysis]
```

---

## 🎨 Natural Language Examples

### Saving
- ✅ "Save this chat"
- ✅ "Save the current session"
- ✅ "Save this conversation as 'sales_analysis'"
- ✅ "Save what we've been working on"
- ✅ "Save this analysis with summary 'Q3 review'"

### Loading
- ✅ "Load history"
- ✅ "Show me previous sessions"
- ✅ "Load the latest context"
- ✅ "Load context 1"
- ✅ "Load sales_analysis"
- ✅ "Continue from the last session"
- ✅ "Show me what we did yesterday"

### Listing
- ✅ "What contexts are saved?"
- ✅ "Show all saved sessions"
- ✅ "List my previous analyses"
- ✅ "What sessions do I have?"

---

## 🚀 Quick Reference

| What You Want | What to Say |
|--------------|-------------|
| Save current work | "Save this chat context" |
| See all saved sessions | "Show history" or "List saved sessions" |
| Load most recent | "Load latest" or "Load 1" |
| Load specific session | "Load [name]" or "Load [number]" |
| Add a finding | "Add finding: [your finding]" |

---

## ✨ Key Features

1. **Natural Language** - Just talk to Claude normally
2. **Automatic Tracking** - Queries are tracked automatically
3. **Interactive Selection** - Numbered lists make it easy to choose
4. **Smart Defaults** - Claude suggests names and summaries
5. **Helpful Errors** - Clear messages when something goes wrong
6. **Multiple Ways to Load** - By number, name, or ID

---

## 🎯 Summary

**You don't need to remember tool names!** Just ask Claude naturally:

- **To save:** "Save this chat context"
- **To load:** "Load history" then "Load 1"
- **To list:** "Show saved sessions"

Claude handles all the technical details for you! 🎉

