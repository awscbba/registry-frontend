# Architecture Decisions

## Component Architecture Cleanup (2025-06-25)

### Current State
The project has evolved from a simple people management system to a project-focused platform with subscription capabilities. This evolution has left some components unused.

### Active Components (✅ Keep)
- **ProjectShowcase** - Main landing page showing active projects
- **AdminDashboard** - Admin panel with dashboard metrics and people management
- **ProjectSubscriptionForm** - Handles project subscriptions with person creation
- **PersonList** - Used by AdminDashboard for people management

### Legacy Components (❓ Decision Needed)
- **PeopleManager** - Complex component with people/project management (unused)
- **PersonForm** - Person creation/editing form (only used by PeopleManager)
- **ProjectManager** - Project management interface (only used by PeopleManager)
- **ProjectForm** - Project creation/editing form (only used by ProjectManager)
- **ProjectList** - Project listing component (only used by ProjectManager)

### Decision: Keep Legacy Components
**Rationale**: These components provide valuable functionality that may be needed:
1. **Future Admin Features**: ProjectManager could be integrated into AdminDashboard
2. **Standalone Forms**: PersonForm and ProjectForm could be used independently
3. **Modular Architecture**: Keeping components allows for flexible future development
4. **Code Reuse**: Components are well-built and tested

### Recommendations
1. **Document unused components** clearly
2. **Consider integration** of ProjectManager into AdminDashboard
3. **Maintain components** but mark as legacy in documentation
4. **Future cleanup** can remove them if truly unnecessary

### API Consistency
- Standardized all API base URLs to production endpoint
- Fixed address field naming (postalCode vs zipCode)
- Consistent error handling patterns

### Type Safety
- All components use proper TypeScript interfaces
- Consistent type imports across the application
- No 'any' types used (verified in static analysis)
