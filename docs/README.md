# 📚 Prompt Garden Documentation

Welcome to the Prompt Garden documentation. This guide will help you understand how the application works in an approachable way. Whether you're familiar with coding or not, you should find what you need here.

## 🏗️ Architecture Overview

Here's a simplified view of how Prompt Garden is built:

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

The application has three main parts:
- The **Frontend** is the user interface with components for interaction
- The **Service Layer** manages logic and processes data
- **Google Sheets** serves as the database where prompts and metadata are stored

## 📂 Documentation Structure

This docs folder contains:

- **architecture/** - System structure and organization
  - `codebase-architecture.md` - Component relationships and connections
  - `data-flow-documentation.md` - How data moves through the system

- **guides/** - Feature-specific documentation
  - `syntax-highlighting-documentation.md` - Implementation of syntax highlighting

- **design/** - Design decisions and processes
  - `design-process.md` - Design approach and methodology

- **testing/** - Testing documentation
  - `prompt-garden-testing-strategy.md` - Testing approach and philosophy
  - `README-testing.md` - Testing overview
  - `testing-execution-guide.md` - Testing procedures

## 🧭 Getting Started

If you're new to the project, start with [architecture-overview.md](./architecture-overview.md) which provides a comprehensive map of the documentation and will direct you to relevant resources.

## 📋 Future Documentation

Planned documentation additions include:

1. Testing methodologies and coverage
2. Deployment processes
3. Performance optimization techniques
4. Security and permissions model
5. Additional feature-specific guides

If you have questions about any part of the system, the documentation should provide guidance, but don't hesitate to reach out for clarification. 