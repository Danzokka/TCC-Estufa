## 🎯 Objective

<!-- Clear statement of what this PR accomplishes and why it's needed -->

**Related Issue:** Closes #XXX

## 📋 Type of Change

- [ ] 🐛 Bug fix (non-breaking change which fixes an issue)
- [ ] ✨ New feature (non-breaking change which adds functionality)
- [ ] 💥 Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] 📚 Documentation update
- [ ] 🔧 Refactoring (no functional changes)
- [ ] ⚡ Performance improvement
- [ ] ⚙️ Configuration change
- [ ] 🏗️ Build system / CI/CD changes

## ✨ Changes Made

### 🌐 Frontend (Next.js/React)

<!-- Check all that apply -->

- [ ] **Component:** [ComponentName] - [Description]
- [ ] **Page:** [PageName] - [Description]
- [ ] **Hook:** [HookName] - [Description]
- [ ] **Styling:** [Description]
- [ ] **Performance:** [Description]
- [ ] **PWA:** [Description]

### 🔧 Backend (NestJS)

<!-- Check all that apply -->

- [ ] **Endpoint:** [Method] [Route] - [Description]
- [ ] **Service:** [ServiceName] - [Description]
- [ ] **Controller:** [ControllerName] - [Description]
- [ ] **Module:** [ModuleName] - [Description]
- [ ] **Database:** [Migration/Schema changes]
- [ ] **Authentication:** [Changes]
- [ ] **Guards:** [GuardName] - [Description]

### 🤖 AI Service (Python/PyTorch)

<!-- Check all that apply -->

- [ ] **Model:** [ModelName] - [Description]
- [ ] **Data Processing:** [ProcessorName] - [Description]
- [ ] **API:** [Endpoint] - [Description]
- [ ] **Training:** [TrainingScript] - [Description]
- [ ] **Analysis:** [AnalysisType] - [Description]

### 🔌 ESP32 Firmware

<!-- Check all that apply -->

- [ ] **Sensor:** [SensorType] - [Description]
- [ ] **Communication:** [Protocol] - [Description]
- [ ] **Power Management:** [Description]
- [ ] **Library:** [LibraryName] - [Description]
- [ ] **Configuration:** [ConfigType] - [Description]

### 🏗️ Infrastructure

<!-- Check all that apply -->

- [ ] **Docker:** [Container changes]
- [ ] **CI/CD:** [Pipeline changes]
- [ ] **Database:** [Schema/Migration changes]
- [ ] **Monitoring:** [Observability changes]
- [ ] **Security:** [Security improvements]

## 🧪 Testing

- [ ] **Unit tests** added/updated
- [ ] **Integration tests** added/updated
- [ ] **E2E tests** added/updated
- [ ] **Manual testing** completed
- [ ] **All tests passing** locally
- [ ] **Test coverage** maintained/improved

**Test Commands Executed:**

```bash
# Add the commands you ran to test your changes
npm run test
npm run test:e2e
```

## 📊 Performance Impact

- **Bundle size:** [increased/decreased/neutral] by [amount]
- **Database queries:** [optimized/added/unchanged]
- **Memory usage:** [impact assessment]
- **Loading time:** [impact assessment]
- **ESP32 memory:** [usage/impact] (if applicable)
- **AI inference time:** [impact] (if applicable)

## 🔒 Security Considerations

- [ ] **Input validation** implemented
- [ ] **Authentication/authorization** verified
- [ ] **No sensitive data** exposed
- [ ] **Security best practices** followed
- [ ] **Dependency vulnerabilities** checked
- [ ] **ESP32 security** considerations (if applicable)

## 📱 Mobile/Responsive & PWA

- [ ] **Mobile-first design** implemented
- [ ] **Responsive breakpoints** tested
- [ ] **Touch interactions** optimized
- [ ] **Cross-browser compatibility** verified
- [ ] **PWA functionality** maintained/improved
- [ ] **Offline capabilities** working (if applicable)

## 🚨 Breaking Changes

<!-- List any breaking changes and migration steps required -->

**Migration Steps:**

```bash
# Add any commands needed to migrate existing installations
```

## 📝 Environment Variables

<!-- List any new environment variables or configuration changes -->

```env
# New environment variables (add to .env files)
NEW_VAR=value # Description of what this does
```

## 🗃️ Database Changes

- [ ] **Migration files** included
- [ ] **Backward compatibility** maintained
- [ ] **Data migration strategy** documented
- [ ] **Rollback strategy** considered

**Migration Commands:**

```bash
npx prisma migrate dev
# or other relevant commands
```

## 🔌 Hardware Changes (ESP32)

<!-- If applicable -->

- [ ] **Pin configuration** changes documented
- [ ] **Sensor wiring** diagrams updated
- [ ] **Power requirements** considered
- [ ] **Firmware update** process documented

## 🤖 AI/ML Changes

<!-- If applicable -->

- [ ] **Model performance** validated
- [ ] **Training data** requirements documented
- [ ] **Inference accuracy** maintained/improved
- [ ] **Resource usage** optimized

## 🖼️ Screenshots/Videos

<!-- Include screenshots for UI changes or videos for complex interactions -->

### Before

<!-- Screenshot/description of before state -->

### After

<!-- Screenshot/description of after state -->

## ✅ Deployment Checklist

- [ ] **Environment variables** configured
- [ ] **Database migrations** ready
- [ ] **Dependencies** updated
- [ ] **Documentation** updated
- [ ] **Monitoring/logging** configured
- [ ] **Health checks** implemented
- [ ] **Rollback plan** prepared

## 🔗 Related Issues/PRs

<!-- Link related issues and PRs -->

- Closes #[issue-number]
- Relates to #[issue-number]
- Fixes #[issue-number]
- Depends on #[pr-number]

## 👀 Review Notes

<!-- Additional context, concerns, or specific areas for reviewers to focus on -->

### Focus Areas for Review

- [ ] **Code quality** and best practices
- [ ] **Security** implications
- [ ] **Performance** impact
- [ ] **Test coverage** adequacy
- [ ] **Documentation** completeness

### Known Issues/Limitations

<!-- Any known issues or limitations that will be addressed in future PRs -->

## 📚 Documentation Updates

- [ ] **README** updated
- [ ] **API documentation** updated
- [ ] **Architecture documentation** updated
- [ ] **Setup instructions** updated
- [ ] **Troubleshooting guide** updated

---

## 🏃‍♂️ Quick Start for Reviewers

<!-- Commands to quickly test this PR -->

```bash
# Clone and checkout this PR
git checkout [branch-name]

# Install dependencies
npm install

# Set up environment
cp .env.example .env

# Run the application
npm run dev

# Run tests
npm run test
```

**Test URLs/Paths:**

- [ ] `http://localhost:3000/[specific-path]`
- [ ] API endpoint: `GET /api/[endpoint]`

---

**Summary:** <!-- One sentence summary of the changes -->

**Impact:** <!-- Who is affected by these changes and how -->
