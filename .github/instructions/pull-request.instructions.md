---
applyTo: "**"
---

# Pull Request Generation Guidelines

## PR Title Format

Follow conventional commit format:

```
<type>[scope]: <brief description>
```

## PR Description Template

### 🎯 Objective

Clear statement of what this PR accomplishes and why it's needed.

### 📋 Type of Change

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Refactoring (no functional changes)
- [ ] Performance improvement
- [ ] Configuration change

### ✨ Changes Made

#### Frontend (Next.js/React)

- [ ] Component: [ComponentName] - [Description]
- [ ] Page: [PageName] - [Description]
- [ ] Styling: [Description]
- [ ] Performance: [Description]

#### Backend (NestJS)

- [ ] Endpoint: [Method] [Route] - [Description]
- [ ] Service: [ServiceName] - [Description]
- [ ] Database: [Migration/Schema changes]
- [ ] Authentication: [Changes]

#### Infrastructure

- [ ] Docker: [Container changes]
- [ ] CI/CD: [Pipeline changes]
- [ ] Monitoring: [Observability changes]

### 🧪 Testing

- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] E2E tests added/updated
- [ ] Manual testing completed
- [ ] All tests passing

### 📊 Performance Impact

- Bundle size: [increased/decreased/neutral] by [amount]
- Database queries: [optimized/added/unchanged]
- Memory usage: [impact assessment]
- Loading time: [impact assessment]

### 🔒 Security Considerations

- [ ] Input validation implemented
- [ ] Authentication/authorization verified
- [ ] No sensitive data exposed
- [ ] Security best practices followed

### 📱 Mobile/Responsive

- [ ] Mobile-first design implemented
- [ ] Responsive breakpoints tested
- [ ] Touch interactions optimized
- [ ] Cross-browser compatibility verified

### 🚨 Breaking Changes

List any breaking changes and migration steps required.

### 📝 Environment Variables

List any new environment variables or configuration changes:

```
NEW_VAR=value # Description of what this does
```

### 🗃️ Database Changes

- [ ] Migration files included
- [ ] Backward compatibility maintained
- [ ] Data migration strategy documented

### 🔗 Related Issues

- Closes #[issue-number]
- Relates to #[issue-number]
- Fixes #[issue-number]

### 🖼️ Screenshots/Videos

Include screenshots for UI changes or videos for complex interactions.

### ✅ Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrations ready
- [ ] Dependencies updated
- [ ] Documentation updated
- [ ] Monitoring/logging configured

### 👀 Review Notes

Additional context, concerns, or specific areas for reviewers to focus on.

## Requirements for PR Generation

- Always link related issues
- Include comprehensive testing information
- Document all breaking changes
- Provide clear deployment instructions
- Include performance impact assessment
- Add screenshots for UI changes
- Describe security implications
- Document environment variable changes
