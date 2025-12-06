# Accessibility Testing - Quick Start Guide

## 🚀 Quick Start (5 minutes)

### Option 1: Manual Checklist (Recommended)

1. **Open the testing tool**:
   ```bash
   # Open this file in your browser:
   registry-frontend/scripts/test-accessibility-simple.html
   ```

2. **Start your dev server**:
   ```bash
   cd registry-frontend
   npm run dev
   ```

3. **Follow the checklist** in the HTML tool while testing your app

4. **Export results** when done

---

### Option 2: Browser DevTools (Fastest)

1. **Start dev server**:
   ```bash
   cd registry-frontend
   npm run dev
   ```

2. **Open app** at http://localhost:4321

3. **Run Lighthouse**:
   - Press F12 (DevTools)
   - Go to "Lighthouse" tab
   - Select "Accessibility"
   - Click "Analyze page load"
   - Target: 90+ score

---

### Option 3: Automated Script (Most Comprehensive)

1. **Install dependencies** (one-time):
   ```bash
   cd registry-frontend
   npm install --save-dev playwright @axe-core/playwright @playwright/test
   npx playwright install chromium
   ```

2. **Start dev server**:
   ```bash
   npm run dev
   ```

3. **Run tests** (in another terminal):
   ```bash
   node scripts/test-accessibility.js
   ```

4. **Review reports** in `accessibility-reports/` directory

---

## 📋 What to Test

### Must Test (Critical)

- [ ] Color contrast (4.5:1 for text, 3:1 for UI)
- [ ] Keyboard navigation (Tab, Enter, Escape)
- [ ] Focus indicators visible
- [ ] ARIA labels on buttons/modals
- [ ] Form labels present

### Should Test (Important)

- [ ] Focus management in modals
- [ ] Toast notifications announced
- [ ] Screen reader compatibility
- [ ] Component-specific tests

---

## 🎯 Quick Keyboard Test

**Without using your mouse**:

1. Press Tab → Can you reach all buttons/links?
2. Press Enter → Do buttons activate?
3. Press Escape → Do modals close?
4. Tab through form → Are all fields accessible?

If yes to all → ✅ Basic keyboard accessibility passed!

---

## 🔍 Quick Visual Test

1. Tab through page → Do you see focus indicators?
2. Check text → Is it easy to read?
3. Check buttons → Can you see them clearly?
4. Check errors → Are they visible?

If yes to all → ✅ Basic visual accessibility passed!

---

## 📊 Tools Available

| Tool | Location | Best For |
|------|----------|----------|
| Manual Checklist | `scripts/test-accessibility-simple.html` | Quick checks |
| Automated Script | `scripts/test-accessibility.js` | CI/CD |
| Chrome Lighthouse | Browser DevTools | Fast scan |
| axe DevTools | Browser Extension | Detailed scan |

---

## 📚 Full Documentation

See `registry-documentation/frontend/accessibility-testing-guide.md` for:
- Detailed testing instructions
- WCAG 2.1 AA requirements
- Screen reader testing guide
- Common issues and solutions
- Resources and links

---

## ✅ Success Criteria

- Chrome Lighthouse: 90+ score
- axe DevTools: No critical/serious violations
- All keyboard navigation works
- All focus indicators visible
- All ARIA attributes present

---

## 🆘 Need Help?

1. Check the full guide: `registry-documentation/frontend/accessibility-testing-guide.md`
2. Review WCAG 2.1: https://www.w3.org/WAI/WCAG21/quickref/
3. Ask the team

---

**Estimated Time**: 30-60 minutes for basic testing  
**Last Updated**: 2025-12-04
