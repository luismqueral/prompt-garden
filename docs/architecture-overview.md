# Prompt Garden Architecture and Documentation Overview

This document serves as an index to the various architecture and documentation resources for the Prompt Garden application. These resources aim to provide a comprehensive understanding of the codebase structure, functionality, and development patterns.

## Documentation Resources

| Document | Description |
|----------|-------------|
| [Codebase Architecture](./architecture/codebase-architecture.md) | Visual representation of the application architecture with component relationships and data flow |
| [Data Flow Documentation](./architecture/data-flow-documentation.md) | Detailed explanation of how data moves through the application |
| [Syntax Highlighting Documentation](./guides/syntax-highlighting-documentation.md) | In-depth guide to the custom syntax highlighting implementation |

## Core Modules with Comprehensive Comments

The following core modules have been extensively documented with comments explaining their functionality:

- **app/page.tsx** - Main homepage component with prompt display and filtering
- **lib/googleSheets/prompts.ts** - Google Sheets integration for prompt CRUD operations
- **lib/googleSheets/auth.ts** - Authentication with Google Sheets API
- **lib/googleSheets/tags.ts** - Tags and categories management

## How to Use This Documentation

### For New Developers

If you're new to the codebase:

1. Start with the [Codebase Architecture](./architecture/codebase-architecture.md) document to understand the overall structure
2. Read the [Data Flow Documentation](./architecture/data-flow-documentation.md) to understand how data moves through the system
3. Explore the core module files with their comprehensive comments
4. For specific features, refer to the specialized documentation (e.g., [Syntax Highlighting](./guides/syntax-highlighting-documentation.md))

### For Feature Development

When developing new features:

1. Identify which layer(s) of the application your feature will touch
2. Review the relevant documentation for those layers
3. Look at the existing patterns in similar features
4. Follow the layered architecture approach:
   - Add UI components for user interaction
   - Update or create service methods for API communication
   - Implement API routes for server-side logic if needed
   - Add Google Sheets integration for data persistence if required

### For Bug Fixing

When fixing bugs:

1. Use the architecture diagram to identify which components might be involved
2. Read the data flow documentation to understand how data might be affected
3. Check the comprehensive comments in relevant modules for insight into their operation
4. Test changes across the entire flow to ensure compatibility

## Contribution Guidelines

When contributing to the codebase:

1. Maintain the existing architectural patterns
2. Follow the commenting style used in the core modules
3. Update documentation when making significant changes
4. Add new documentation for new major features
5. Keep the architecture diagram up to date with structural changes

## Next Steps for Documentation

Consider adding the following documentation in the future:

1. Test coverage and testing strategies
2. Deployment and infrastructure documentation
3. Performance optimization guidelines
4. User permission and security model
5. Feature-specific guides for complex functionality

## Conclusion

This documentation aims to provide a comprehensive understanding of the Prompt Garden application. By following the existing patterns and referring to these resources, developers can efficiently work with the codebase and maintain its quality and consistency. 