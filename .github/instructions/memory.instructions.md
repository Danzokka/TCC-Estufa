---
applyTo: "**"
---

# GitHub Copilot Memory Instructions - Portfolio CMS Platform

Your documentation is on [memory_mcp](https://github.com/modelcontextprotocol/servers/tree/main/src/memory)

## System Overview

This is a modern Portfolio CMS platform built with NestJS and Next.js, designed for personal portfolio management with integrated blogging, project showcase, and review system. The system uses a Turborepo monorepo architecture with comprehensive CI/CD pipelines, automated testing, and Docker containerization.

**Key Quality Standards:**
- 🔒 **Security First**: Branch protection, security scanning, dependency auditing
- 🧪 **Test-Driven**: Unit tests (≥85% coverage), E2E tests, integration tests
- 🚀 **CI/CD Excellence**: Automated quality gates, multi-stage deployments
- 📊 **Monitoring**: Performance tracking, error monitoring, audit trails
- 🏗️ **Architecture**: Monorepo with workspace isolation and smart caching

Follow these steps for each prompt called:

## 1. Memory Initialization

If this is the first interaction, initialize your memory with these core entities:

### Core System Entities

- **Portfolio_CMS_System**: Main portfolio management platform
- **Portfolio_CMS_CI_CD_System**: Comprehensive CI/CD infrastructure with quality gates
- **User_Developer**: The developer working on this system
- **Conversation_Context**: Current session context
- **Knowledge_Graph**: Technical knowledge repository

### Portfolio Domain Entities

- **User_Entity**: Portfolio users with rich profiles, specialties, and social links
- **Project_Entity**: Portfolio projects with technologies, types, status, and timelines
- **Post_Entity**: Blog posts with content, tags, comments, and likes
- **Review_Entity**: Reviews for projects or general portfolio feedback

### Technical Architecture Entities

- **Monorepo_Structure**: Turborepo with apps/web (Next.js) and apps/api (NestJS)
- **Docker_Infrastructure**: Multi-stage containerization for dev, staging, and production
- **Database_Layer**: Prisma ORM with PostgreSQL and rich relational models
- **Authentication_System**: JWT + NextAuth integration with role-based access
- **Testing_Infrastructure**: Comprehensive test suites with coverage enforcement
- **Security_System**: CodeQL scanning, dependency auditing, container security

### Content Management Entities

- **Blog_System**: Full-featured blogging with tags, comments, and likes
- **Media_Management**: File upload system for project images and assets
- **Admin_System**: Administrative controls with role-based permissions

### CI/CD & Quality Entities

- **Quality_Gates**: PR analysis, complexity scoring, automated code review
- **Test_Automation**: Unit tests (≥85% coverage), E2E tests, integration tests
- **Security_Scanning**: Automated vulnerability detection and compliance
- **Performance_Monitoring**: Build optimization, caching strategies, metrics tracking

## 2. Memory Retrieval

- Always begin by saying "Remembering..." and retrieve relevant system context
- Reference your technical knowledge as "memory" about the portfolio CMS architecture
- Prioritize recent system changes and ongoing development patterns

## 3. Technical Memory Categories

Monitor and store information about:

### a) System Architecture

- Turborepo monorepo structure with apps/web and apps/api
- Next.js 15+ App Router patterns with Server Components
- NestJS modular architecture with domain-driven design and event emitters
- Prisma ORM for database interactions with PostgreSQL
- NextAuth for authentication with JWT and role-based access control
- Docker multi-stage builds with development, staging, and production environments

### b) CI/CD & Quality Infrastructure

- **GitHub Actions Workflows**: portfolio-ci.yml, pr-quality-gate.yml, deploy.yml, cleanup.yml
- **Quality Gates**: PR size analysis, complexity scoring, code review automation
- **Testing Strategy**: Unit tests (Jest), E2E tests (Playwright), integration tests
- **Security Scanning**: CodeQL analysis, dependency auditing, container scanning
- **Branch Protection**: Required status checks, review requirements, merge restrictions
- **Performance Optimization**: Turborepo caching, Docker layer optimization
- **Automated Deployments**: Staging and production with health checks and rollback

### c) Testing & Quality Assurance

- **Unit Testing**: Jest with ≥85% coverage requirement across all workspaces
- **E2E Testing**: Playwright for critical user flows and UI interactions
- **Integration Testing**: API endpoint testing and database interaction validation
- **Code Quality**: ESLint, Prettier, TypeScript strict mode enforcement
- **Security Testing**: Automated vulnerability scanning and compliance checks
- **Performance Testing**: Build time optimization and runtime performance monitoring

### d) Data Models & Relationships

- Core entities: User, Project, Post, Review, Technology, Tag, Comment, Like
- Rich user profiles with specialties, technologies, and social links
- Project management with technologies, types, status tracking, and timelines
- Blog system with tagging, commenting, and liking functionality

### e) API Patterns

- RESTful endpoints with NestJS controllers and services
- JWT authentication with AuthGuard and AdminGuard
- Request/response patterns with DTOs and validation
- File upload system for project images and media
- Error handling and logging strategies

### f) Development Patterns

- Service-Controller-Module organization in NestJS
- Server actions and API routes in Next.js
- Prisma ORM patterns with relations and transactions
- Component composition with Shadcn UI and Tailwind CSS
- Test-driven development with comprehensive coverage

### g) Business Logic

- Role-based access control (regular users vs admins)
- Project lifecycle management with status tracking
- Content publishing workflow for posts (draft → published)
- Review system supporting both project-specific and general portfolio reviews

## 4. Memory Update Strategy

When new information is encountered:

### a) Technical Entities

- Create entities for new modules, services, or components
- Document new API endpoints and their purposes
- Record new integration patterns or external services
- Store performance optimization techniques
- Track CI/CD pipeline improvements and workflow updates

### b) Quality & Testing Entities

- Document new test patterns and coverage improvements
- Record quality gate configurations and thresholds
- Store security scanning results and remediation strategies
- Track performance benchmarks and optimization outcomes
- Monitor deployment success rates and rollback procedures

### c) Business Rules

- Document project categorization and technology tagging
- Record user profile management and authentication flows
- Store content publishing and moderation workflows
- Track review and feedback management patterns
- Monitor admin dashboard usage and feature adoption

### d) System Relationships

- Connect new components to existing architecture
- Map data flow between frontend and backend services
- Document dependency relationships between modules
- Record configuration dependencies and environment variables
- Track CI/CD workflow dependencies and trigger conditions

### e) Development Context

- Store recent code changes and their motivations
- Record debugging sessions and solutions found
- Document refactoring decisions and architectural evolution
- Track testing strategies and coverage improvements
- Monitor performance impacts of code changes

## 5. Contextual Observations

Always maintain observations about:

### System State

- Current development focus areas
- Recent bug fixes and their root causes
- Performance optimization opportunities
- UI/UX improvements and user feedback
- CI/CD pipeline health and execution times

### Code Quality

- Consistent error handling patterns across modules
- Proper validation strategies for forms and APIs
- Authentication and authorization implementation
- Testing coverage and quality patterns
- Security compliance and vulnerability management

### Development Operations

- Build performance and optimization opportunities
- Test execution times and reliability
- Deployment success rates and rollback frequency
- Resource utilization and scaling needs
- Monitoring and alerting effectiveness

### Business Requirements

- Portfolio presentation and showcase needs
- Content management and publishing workflows
- User engagement features (comments, likes, reviews)
- Admin dashboard and moderation capabilities
- Analytics and reporting requirements

## 6. CI/CD Workflow Patterns

Document and maintain knowledge about:

### Workflow Architecture

- **portfolio-ci.yml**: Main CI pipeline with lint, test, build, and security checks
- **pr-quality-gate.yml**: PR analysis with size limits, complexity scoring, and impact analysis
- **deploy.yml**: Automated deployment to staging and production with health checks
- **cleanup.yml**: Maintenance workflow for cache cleanup and resource optimization

### Quality Standards

- **Code Quality**: ESLint, Prettier, TypeScript strict mode with error blocking
- **Test Coverage**: Minimum 85% coverage requirement across all workspaces
- **Security**: CodeQL analysis, dependency audit, container vulnerability scanning
- **Performance**: Build time monitoring, cache hit rates, bundle size tracking

### Branch Protection

- **Required Status Checks**: All CI jobs must pass before merge
- **Review Requirements**: Code review mandatory for main and develop branches
- **Merge Restrictions**: Squash merging preferred, linear history maintained
- **Protection Rules**: Dismiss stale reviews, require up-to-date branches

### Testing Strategy

- **Unit Tests**: Jest with mocking strategies for isolated component testing
- **Integration Tests**: API endpoint testing with database interactions
- **E2E Tests**: Playwright for critical user journeys and UI workflows
- **Security Tests**: Automated vulnerability scanning and compliance validation

### Deployment Pipeline

- **Staging Environment**: Auto-deploy on develop branch with smoke tests
- **Production Deployment**: Manual approval gate with comprehensive health checks
- **Rollback Strategy**: Automated rollback on health check failures
- **Blue-Green Deployment**: Zero-downtime deployments with traffic switching

### Monitoring & Observability

- **Build Metrics**: Execution time, success rates, resource utilization
- **Test Metrics**: Coverage trends, flaky test detection, execution performance
- **Deployment Metrics**: Success rates, rollback frequency, deployment duration
- **Security Metrics**: Vulnerability detection, dependency freshness, compliance status

## 7. Relationship Patterns

Maintain these key relationships in memory:

- **User** `has_profile` **UserProfile** (with specialties, technologies, social links)
- **User** `creates` **Project** (portfolio project ownership)
- **User** `writes` **Post** (blog content authorship)
- **User** `submits` **Review** (feedback on projects or portfolio)
- **Project** `uses` **Technology** (many-to-many project technologies)
- **Project** `belongs_to` **ProjectType** (categorization of projects)
- **Project** `has` **Review** (project-specific feedback)
- **Post** `tagged_with` **Tag** (content categorization)
- **Post** `receives` **Comment** (user engagement)
- **Post** `receives` **Like** (user appreciation)
- **User** `specializes_in` **Especiality** (areas of expertise)
- **User** `knows` **Technology** (skill associations)
- **System** `supports` **AdminAccess** (role-based permissions)
- **Database** `stores` **MediaFiles** (project images and assets)

This memory framework ensures comprehensive understanding of the portfolio CMS platform's technical architecture, business logic, and development patterns, enabling more effective code assistance and architectural guidance.

## Additional Memory Context

### Quality Assurance Excellence

- **Test-Driven Development**: All new features require tests before implementation
- **Coverage Enforcement**: Automated blocking of PRs below 85% test coverage
- **Quality Gates**: Multi-dimensional PR analysis including size, complexity, and impact
- **Security First**: Proactive vulnerability scanning and dependency auditing

### CI/CD Best Practices

- **Workspace Isolation**: Turborepo enables efficient testing of only affected packages
- **Smart Caching**: Aggressive caching strategies for faster build and test execution
- **Progressive Deployment**: Staging → production pipeline with comprehensive validation
- **Automated Rollback**: Health check failures trigger automatic rollback procedures

### Development Workflow Integration

- **Branch Protection**: Enforced quality standards prevent broken code in main branches
- **Code Review**: Mandatory peer review with automated quality assistance
- **Performance Monitoring**: Continuous tracking of build times, test execution, and deployment success
- **Documentation**: Automated generation of coverage reports, security scan results, and deployment status
