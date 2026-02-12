# Testing Guide - Phase 1.1 Result Types

This guide helps you test the Result types implementation to verify error handling works correctly.

---

## 🚀 Starting the Development Server

```bash
cd headlamp-sealed-secrets
npm start
```

This will:
- Build the plugin in development mode
- Start Headlamp with the plugin loaded
- Open http://localhost:4466 in your browser
- Enable hot-reload for code changes

**Expected Output:**
```
> headlamp-sealed-secrets@0.1.0 start
> headlamp-plugin start

Starting development server...
Plugin loaded: headlamp-sealed-secrets
Server running at http://localhost:4466
```

---

## 🧪 Test Scenarios

### Test 1: Normal Operation (Happy Path)

**Prerequisites:**
- Sealed Secrets controller running in cluster
- Valid kubeconfig configured

**Steps:**
1. Navigate to "Sealed Secrets" in sidebar
2. Click "Create Sealed Secret"
3. Fill in form:
   - Name: `test-secret`
   - Namespace: `default`
   - Scope: `strict`
   - Key: `password`
   - Value: `mysecretvalue`
4. Click "Create"

**Expected Result:**
- ✅ Success message: "SealedSecret created successfully"
- ✅ Secret appears in list
- ✅ No console errors

**What This Tests:**
- Certificate fetch works
- Certificate parsing works
- Encryption works
- Kubernetes API call works

---

### Test 2: Controller Unreachable

**Setup:**
- Ensure controller is NOT running, or
- Modify Settings to point to invalid controller

**Steps:**
1. Go to Settings (if available)
2. Set controller namespace to `nonexistent`
3. Try to create a sealed secret

**Expected Result:**
- ❌ Error message: "Failed to fetch certificate: [HTTP error details]"
- ✅ User-friendly error, not stack trace
- ✅ No uncaught exception in console

**What This Tests:**
- `fetchPublicCertificate` error handling
- AsyncResult error path
- User-facing error messages

---

### Test 3: Invalid Certificate

**Setup:**
- Requires modifying controller to return invalid cert (advanced)
- OR test with mock by temporarily modifying `fetchPublicCertificate`

**Mock Test (temporary code change):**
```typescript
// In src/lib/controller.ts (TEMPORARY)
export async function fetchPublicCertificate(
  config: PluginConfig
): AsyncResult<string, string> {
  // Return invalid cert for testing
  return Ok('INVALID CERTIFICATE DATA');
}
```

**Steps:**
1. Make the temporary code change above
2. Build: `npm run build`
3. Try to create a sealed secret

**Expected Result:**
- ❌ Error message: "Invalid certificate: [parse error details]"
- ✅ Specific error about certificate parsing
- ✅ No uncaught exception

**Cleanup:**
- Revert the temporary change
- Run `npm run build` again

**What This Tests:**
- `parsePublicKeyFromCert` error handling
- Result type error propagation
- Error message clarity

---

### Test 4: Encryption Failure

**Setup:**
- This is harder to trigger naturally
- Would require corrupting the crypto operation

**Skip for Now:**
- Covered by unit tests in future phases
- Error path is already type-safe

---

### Test 5: Certificate Download

**Steps:**
1. Navigate to "Sealing Keys" view
2. Click "Download Certificate" button

**Expected Results - Success:**
- ✅ File downloads: `sealed-secrets-cert.pem`
- ✅ Success message: "Certificate downloaded"
- ✅ File contains valid PEM certificate

**Expected Results - Failure (if controller down):**
- ❌ Error message: "Failed to download certificate: [error details]"
- ✅ No file downloaded
- ✅ Clear error message

**What This Tests:**
- Certificate fetch in different context
- File download error handling
- Result type in SealingKeysView

---

### Test 6: Browser Console Check

**Steps:**
1. Open Browser DevTools (F12)
2. Go to Console tab
3. Perform operations (create secret, download cert)

**Expected Results:**
- ✅ No uncaught exceptions
- ✅ No "Unhandled promise rejection" errors
- ℹ️ May see debug logs (acceptable)
- ⚠️ Any warnings should be from Headlamp framework, not our code

**What This Tests:**
- No exceptions escape Result type handling
- All async errors properly caught
- Promise rejection handling

---

## 📝 Manual Testing Checklist

### Before Testing
- [ ] Controller running in cluster (optional for error testing)
- [ ] kubectl configured
- [ ] Development server can start
- [ ] Browser DevTools open

### Happy Path
- [ ] Plugin loads without errors
- [ ] Sealed Secrets list view displays
- [ ] Create dialog opens
- [ ] Can create sealed secret successfully
- [ ] Success message appears
- [ ] Secret appears in list
- [ ] Certificate download works

### Error Paths
- [ ] Controller unreachable shows proper error
- [ ] Invalid certificate shows proper error
- [ ] Network errors handled gracefully
- [ ] No uncaught exceptions in console
- [ ] Error messages are user-friendly

### Code Quality
- [ ] No TypeScript errors in build
- [ ] No linting errors
- [ ] Bundle size acceptable
- [ ] Hot reload works during development

---

## 🐛 Known Issues to Look For

### Issue: Type Narrowing
**Symptom:** TypeScript errors about accessing `.error` or `.value`

**Cause:** Using `!result.ok` instead of `result.ok === false`

**Fix:** Use explicit comparison `result.ok === false`

### Issue: Promise Rejection
**Symptom:** "Unhandled promise rejection" in console

**Cause:** Async function not returning Result type

**Fix:** Ensure all async functions use `AsyncResult<T, E>`

### Issue: Generic Error Messages
**Symptom:** User sees "Error: [object Object]"

**Cause:** Not extracting error message from Result

**Fix:** Use `result.error` (if string) or `result.error.message` (if Error)

---

## 📊 What to Record

### For Each Test:

```markdown
**Test:** [Test name]
**Date:** [Date/time]
**Environment:** [Browser, OS]
**Status:** ✅ Pass / ❌ Fail

**Steps:**
1. [Step 1]
2. [Step 2]

**Actual Result:**
[What happened]

**Expected Result:**
[What should happen]

**Screenshots:**
[If applicable]

**Console Output:**
[Any relevant console messages]
```

### Example:

```markdown
**Test:** Create Sealed Secret - Happy Path
**Date:** 2026-02-11 21:00
**Environment:** Chrome 120, macOS
**Status:** ✅ Pass

**Steps:**
1. Opened Sealed Secrets page
2. Clicked "Create Sealed Secret"
3. Filled form with test data
4. Clicked "Create"

**Actual Result:**
- Green success message appeared: "SealedSecret created successfully"
- Secret "test-secret" appeared in list
- No console errors

**Expected Result:**
- Success message ✅
- Secret in list ✅
- No errors ✅

**Console Output:**
(No errors)
```

---

## 🔍 Debugging Tips

### Enable Verbose Logging

Add temporary console.logs to track Result flow:

```typescript
const certResult = await fetchPublicCertificate(config);
console.log('Certificate fetch result:', certResult);

if (certResult.ok === false) {
  console.error('Certificate fetch failed:', certResult.error);
  // ...
}
```

### Check Network Tab

1. Open DevTools → Network tab
2. Try creating a secret
3. Look for request to `/v1/cert.pem`
4. Check status code and response

### Inspect State

Use React DevTools to inspect component state:
1. Install React DevTools extension
2. Select `<EncryptDialog>` component
3. Check `encrypting` state
4. Verify no infinite loops

---

## ✅ Success Criteria

### Must Pass
- [ ] Plugin loads without errors
- [ ] Can create sealed secret with valid controller
- [ ] Error messages are clear and specific
- [ ] No uncaught exceptions in console
- [ ] No unhandled promise rejections

### Should Pass
- [ ] Certificate download works
- [ ] Sealing keys view displays
- [ ] Settings page loads (if exists)
- [ ] Hot reload works during development

### Nice to Have
- [ ] Error messages suggest solutions
- [ ] Loading states show during operations
- [ ] Success feedback is immediate
- [ ] UI remains responsive during errors

---

## 📋 Test Report Template

```markdown
# Phase 1.1 Test Report

**Date:** [Date]
**Tester:** [Name]
**Environment:** [Browser, OS, kubectl version]

## Test Results Summary

- Total Tests: 6
- Passed: X
- Failed: Y
- Skipped: Z

## Detailed Results

### Test 1: Normal Operation
Status: ✅ / ❌
Notes: [Details]

### Test 2: Controller Unreachable
Status: ✅ / ❌
Notes: [Details]

[Continue for all tests...]

## Issues Found

1. [Issue description]
   - Severity: Critical / High / Medium / Low
   - Steps to reproduce: [Steps]
   - Expected: [Expected behavior]
   - Actual: [Actual behavior]

## Recommendations

- [Recommendation 1]
- [Recommendation 2]

## Sign-off

- [ ] All critical tests pass
- [ ] No regressions found
- [ ] Ready for next phase

**Tester Signature:** [Name]
**Date:** [Date]
```

---

## 🎯 Next Steps After Testing

### If All Tests Pass
1. Document test results
2. Commit Phase 1.1 changes
3. Move to Phase 1.2 (Branded Types)

### If Tests Fail
1. Document failing scenarios
2. Debug and fix issues
3. Re-run failed tests
4. Verify fixes don't break passing tests

### If Blockers Found
1. Assess severity
2. Create GitHub issues if needed
3. Decide whether to continue or fix first

---

**Happy Testing!** 🧪

Generated with [Claude Code](https://claude.ai/code)
via [Happy](https://happy.engineering)

Co-Authored-By: Claude <noreply@anthropic.com>
Co-Authored-By: Happy <yesreply@happy.engineering>
