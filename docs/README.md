# 🗒️ Prompt Garden Documentation

Hey there! 👋 Welcome to the Prompt Garden docs. This is your friendly guide to understanding how everything works around here. Don't worry if you're not a coding expert - we've tried to make this as approachable as possible!

## 📐 High-Level Architecture

Here's a simple view of how Prompt Garden is built:

```
┌─────────────────────────────────┐
│                                 │
│       Next.js Frontend          │
│  (What you see in the browser)  │
│                                 │
└───────────────┬─────────────────┘
                │
                ▼
┌─────────────────────────────────┐
│                                 │
│      API & Service Layer        │
│  (Handles data and logic)       │
│                                 │
└───────────────┬─────────────────┘
                │
                ▼
┌─────────────────────────────────┐
│                                 │
│      Google Sheets Storage      │
│  (Where all the data lives)     │
│                                 │
└─────────────────────────────────┘
```

It's pretty straightforward:
- The **Frontend** is what you interact with - all the buttons, forms, and displays
- The **Service Layer** does the behind-the-scenes work like processing data
- **Google Sheets** is where we store all the prompts and other information

## 📂 Where to Find Things

Here's what's in this docs folder:

- **architecture/** - How all the pieces fit together
  - `codebase-architecture.md` - Shows how different parts connect
  - `data-flow-documentation.md` - Explains how information moves around

- **guides/** - How-tos for specific features
  - `syntax-highlighting-documentation.md` - How we make text look pretty with colors

- **design/** - Design decisions and processes
  - `design-process.md` - Our approach to building features

- **testing/** - How we make sure everything works
  - `prompt-garden-testing-strategy.md` - Our testing approach
  - `README-testing.md` - Quick guide to testing
  - `testing-execution-guide.md` - Step-by-step testing instructions

## 🏁 Starting Point

New to the project? Start with [architecture-overview.md](./architecture-overview.md) - it's like a map of everything in these docs and will point you in the right direction!

## ✏️ Adding to These Docs

When you're working on the code:

1. Update docs when you change how things work
2. Add new docs if you create something major
3. Try to match the style of what's already here
4. Keep diagrams up to date
5. Put new files in folders that make sense

## 🔮 Coming Soon

We're planning to add more docs about:

1. How we test things
2. How to deploy the app
3. Making things run faster
4. Security and permissions
5. Guides for specific features

Remember, no one expects you to know everything! These docs are here to help, and so is the team. If something's confusing, just ask! 😊 