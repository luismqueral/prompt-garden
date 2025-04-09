# 🏗️ Prompt Garden Architecture Overview

This document serves as a map to the different documentation resources for Prompt Garden. Use it to find your way around the codebase structure and understand how everything fits together.

## 📑 Documentation Resources

| Document | Description |
|----------|-------------|
| [Codebase Architecture](./architecture/codebase-architecture.md) | Visual representation showing how components connect and work together |
| [Data Flow Documentation](./architecture/data-flow-documentation.md) | How information moves through the application |
| [Syntax Highlighting Documentation](./guides/syntax-highlighting-documentation.md) | Guide to the custom syntax highlighting implementation |

## 🧩 Key Application Modules

These core modules have detailed comments to help you understand how they work:

- **app/page.tsx** - Main homepage where prompts are displayed and filtered
- **lib/googleSheets/prompts.ts** - How the app creates, reads, updates, and deletes prompts
- **lib/googleSheets/auth.ts** - Authentication with Google Sheets API
- **lib/googleSheets/tags.ts** - Management of tags and categories

## 🧭 Finding Your Way Around

### If You're New to the Project

When you're just getting started:

1. Begin with the [Codebase Architecture](./architecture/codebase-architecture.md) to get a bird's-eye view
2. Look at the [Data Flow Documentation](./architecture/data-flow-documentation.md) to understand how information moves
3. Check out the comments in the core modules mentioned above
4. For specific features, refer to the specialized guides

### Understanding Feature Development

When you want to understand how features are built:

1. Identify which parts of the application the feature uses
2. Review the documentation for those areas
3. Look at similar existing features for patterns
4. Notice the layered approach:
   - UI components handle what you see and interact with
   - Service methods manage communication with the backend
   - API routes process requests on the server side
   - Google Sheets integration stores the data

### Tracking Down Bugs

When investigating issues:

1. Use the architecture diagrams to identify relevant components
2. Review the data flow to see where things might go wrong
3. Check the comments in related modules
4. Consider how changes might affect the entire system

## 📝 Code Contribution Tips

When working with the codebase:

1. Follow the established patterns and architecture
2. Use a similar commenting style to what you see in core modules
3. Keep documentation in sync with code changes
4. Add documentation for significant new features
5. Update architecture diagrams when structure changes

## 🔮 Future Documentation Plans

We're planning to add more documentation about:

1. Testing approaches and coverage
2. Deployment processes
3. Performance optimization
4. Security and permissions
5. Detailed guides for complex features

## 🎯 Summary

This documentation will help you navigate and understand Prompt Garden. By following the existing patterns and referring to these resources, you can work effectively with the codebase while maintaining quality and consistency. 