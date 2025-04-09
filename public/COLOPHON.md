## Technical Architecture

### Core Framework & Languages
- **Next.js (v13.5+)**: React framework providing server-side rendering, routing, and API functionality
- **TypeScript**: For type safety and enhanced developer experience
- **React (v18.2+)**: UI component library

### Styling & UI
- **TailwindCSS (v3.4+)**: Utility-first CSS framework for responsive design
- **Tailwind Typography Plugin**: Enhanced typography styling
- **Radix UI**: Accessible component primitives (dropdown menus, slots)
- **Lucide React & Heroicons**: Icon libraries
- **Next-themes**: Theme management (supporting light/dark modes)
- **Class Variance Authority & CLSX**: Utility libraries for conditional class composition
- **Sonner**: Toast notification system

### Code Editing
- **CodeMirror (@uiw/react-codemirror)**: Rich text editor with syntax highlighting
- **@codemirror/lang-markdown**: Markdown support for CodeMirror
- **@codemirror/theme-one-dark**: Dark theme for CodeMirror

### Data Storage & Integration
- **Google Sheets API**: Used as the database backend
- **Googleapis & Google-auth-library**: Authentication and interaction with Google services
- **UUID**: For generating unique identifiers

### Project Structure
- **/app**: Next.js application routes and pages
  - `/api`: Backend API endpoints
  - `/prompt`, `/tips`, `/admin`: Various app sections
- **/components**: Reusable UI components
  - `/ui`: Shadcn UI components
  - `/theme-provider`: Theme management
- **/lib**: Utility functions and service integrations
  - `/googleSheets`: Google Sheets API integration
  - `/api`: API utilities

## Design Philosophy

### User Experience
The application follows a minimalist, content-focused design approach with two primary views:
1. **Browse View**: Card-based layout for viewing and filtering prompts
2. **Create View**: Clean editing interface for composing new prompts

### Typography & Visual Design
- **Monospace Font**: Used for prompt content to improve readability
- **Sans-serif Font**: For UI elements and navigation
- **Light Gray Background**: Non-distracting canvas
- **Card-Based Layout**: Clear visual separation of content
- **Subtle Accents**: Blue highlights for interactive elements

### Interaction Design
- **Tag Filtering**: Simple yet powerful categorization system
- **Remix Functionality**: Building upon existing prompts
- **Rich Editing**: Special syntax for variables, notes, and follow-ups
- **Keyboard Shortcuts**: Cmd+Enter (Ctrl+Enter) to submit

## Data Architecture

### Google Sheets Integration
The application uses Google Sheets as a lightweight database with the following structure:

1. **Prompts Sheet**:
   - Columns: ID, Title, Content, Tags, Category, Created At, Updated At
   - Each prompt stored as a single row

2. **Tags Sheet**:
   - Columns: Name, Count, Is Category
   - Tracks usage count and categorization

### Authentication & Security
- **Service Account**: Google Cloud service account for API access
- **Environment Variables**: Secure storage of API credentials
- Private deployment with organizational access controls

## Development Workflow

### Local Development
- **npm run dev**: Starts the development server
- **npm run build**: Creates production build
- **npm run start**: Runs the production build locally

### Environment Configuration
- **.env.local**: Contains Google Sheets API credentials
- **Google Cloud Console**: Service account management and API enablement

## Future Extensibility

The architecture allows for:
1. **Additional Data Sources**: Beyond Google Sheets
2. **Enhanced Collaboration**: Sharing and multi-user editing
3. **Advanced Filtering**: More robust search and organization
4. **Customization Options**: User-defined categories and styles
5. **Analytics Integration**: Usage tracking and prompt effectiveness metrics 