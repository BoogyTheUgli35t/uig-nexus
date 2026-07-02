# 🚀 UIG Nexus — Phase 1 Copilot Task
## Build Foundation & Shared Infrastructure for Multi-Division App

**Status:** Starting  
**Branch:** `feature/phase-1-foundation`  
**Timeline:** 1–2 weeks  
**Goal:** Complete global signup flow, shared UI shell, sample data, and production-ready navigation.

---

## 📋 Task Overview

This Copilot Task builds the **complete foundation** that all 6 divisions depend on:

1. ✅ **Signup Division Selection Flow** — After email verification, user selects divisions
2. ✅ **Shared UI Component Library** — Reusable components for all divisions
3. ✅ **Sample Data Seeding** — Real demo data for all 6 divisions
4. ✅ **Portal Navigation & Sidebar** — Division-aware, role-based access
5. ✅ **Image Integration** — Hero banners + galleries across app
6. ✅ **Error Handling & Notifications** — Toast system + error boundaries
7. ✅ **Testing Foundation** — Playwright E2E + unit test scaffolds

---

## 🎯 Acceptance Criteria

- [ ] User completes signup → verifies email → lands on division selection UI
- [ ] User selects 1+ divisions → receives correct `user_divisions` rows + welcome notification
- [ ] Redirect to `/portal/<first-division>` shows seeded dashboard
- [ ] Sidebar shows only divisions user has access to (collapsible by division)
- [ ] Admin sees all divisions + admin controls
- [ ] All shared UI components render without errors
- [ ] Sample data: 100+ rows per division (Real Estate, AgriTech, Tech, Logistics, Intelligence, Innovation Lab)
- [ ] Images load in hero banners + galleries
- [ ] Error handling works: invalid operations show toast + log to console
- [ ] Playwright test: signup → select division → land on tech dashboard ✅
- [ ] Mobile responsive (375px–1920px)
- [ ] Build passes: `bun run build` with no warnings
- [ ] No console errors or warnings

---

## 📂 Directory Structure (to Create)

```
src/
├── routes/
│   ├── portal.signup-divisions.tsx           (NEW)
│   └── _apex.portal.divisions.$slug.tsx      (UPDATE existing)
│
├── components/
│   ├── shared/                                (NEW FOLDER)
│   │   ├── HeroBanner.tsx
│   │   ├── ImageGallery.tsx
│   │   ├── KpiStat.tsx
│   │   ├── DataPanel.tsx
│   │   ├── EmptyState.tsx
│   │   ├── StatusBadge.tsx
│   │   ├── NotificationBell.tsx
│   │   ├── MessagePanel.tsx
│   │   ├── DocumentsCenter.tsx
│   │   └── index.ts
│   │
│   └── layout/
│       ├── PortalLayout.tsx                  (UPDATE existing)
│       ├── DivisionSidebar.tsx               (NEW)
│       └── TopBar.tsx                        (UPDATE existing)
│
├── lib/
│   ├── signup.functions.ts                   (NEW)
│   ├── shared.functions.ts                   (NEW)
│   └── seed-utils.ts                         (NEW)
│
├── integrations/
│   └── supabase/
│       └── hooks/
│           ├── useDivisions.ts               (NEW)
│           ├── useNotifications.ts           (NEW)
│           └── useMessages.ts                (NEW)
│
└── assets/
    ├── divisions/                            (NEW FOLDER)
    │   ├── hero-technology.jpg
    │   ├── hero-agritech.jpg
    │   ├── hero-real-estate.jpg
    │   ├── hero-logistics.jpg
    │   ├── hero-intelligence.jpg
    │   ├── hero-innovation-lab.jpg
    │   └── gallery/
    │       ├── tech-*.jpg (4 images)
    │       ├── agritech-*.jpg (4 images)
    │       └── ... (per division)

supabase/
├── migrations/
│   └── 20260701000000_seed_sample_data.sql   (NEW)
└── seed.sql                                   (NEW - full seed script)

tests/
├── e2e/                                       (NEW FOLDER)
│   ├── signup-division-select.spec.ts
│   ├── portal-navigation.spec.ts
│   └── shared-components.spec.ts
│
└── unit/                                      (NEW FOLDER)
    ├── components/shared/*.spec.tsx
    └── lib/*.spec.ts
```

---

## 🔧 Step-by-Step Execution Plan

### **Step 1: Create Signup Division Selection Route & Server Functions**

#### **1.1 Create `src/lib/signup.functions.ts`**
```typescript
// Server functions for signup flow
// - getAvailableDivisions()
// - createSignupChooseDivision(divisionSlugs: string[])
// - Returns { user_divisions created, welcome notifications sent }
// Include Zod validation + RLS checks
```

**Acceptance:**
- Function validates division slugs exist
- Creates `user_divisions` rows atomically
- Inserts welcome notification per division
- Returns success/error

---

#### **1.2 Create `src/routes/portal.signup-divisions.tsx`**
```typescript
// Page at GET /portal/signup/choose-division
// Shows 6 division cards (hero, tagline, description, checkbox)
// Multi-select + "Primary workspace" selector
// POST form calls createSignupChooseDivision
// On success: redirect to /portal/<primary-division>

// UI Elements:
// - Division grid (responsive: 1 col mobile, 2 col tablet, 3 col desktop)
// - Each card: hero image, name, tagline, description, checkbox
// - Selected count badge
// - Primary workspace selector dropdown
// - Submit button (disabled if no divisions selected)
// - Back button
```

**Acceptance:**
- Renders 6 division cards
- Multi-select works
- Form submission works
- Redirect to `/portal/<first-division>` on success
- Shows error toast on failure
- Mobile responsive

---

### **Step 2: Build Shared UI Component Library**

#### **2.1 Create `src/components/shared/HeroBanner.tsx`**
```typescript
// Props: { image: string; title?: string; subtitle?: string; overlay?: boolean }
// Renders: responsive image with optional dark overlay + text
// Tailwind: aspect-video or custom height
// Lazy load: use loading="lazy"
```

---

#### **2.2 Create `src/components/shared/ImageGallery.tsx`**
```typescript
// Props: { images: { url: string; alt?: string }[]; title?: string }
// Features:
//  - Thumbnail carousel (horizontal scroll on mobile)
//  - Main image display
//  - Lightbox on click (modal with prev/next/close)
//  - Lazy loading
//  - Keyboard nav (arrow keys)
```

---

#### **2.3 Create `src/components/shared/KpiStat.tsx`**
```typescript
// Props: { label: string; value: string|number; trend?: { value: number; direction: 'up'|'down' }; icon?: React.ReactNode }
// Renders: stat card with icon, value, label, optional trend badge
// Tailwind: accent color per division
```

---

#### **2.4 Create `src/components/shared/DataPanel.tsx`**
```typescript
// Props: { title: string; subtitle?: string; children: React.ReactNode; action?: { label: string; onClick: () => void } }
// Renders: card with header (title + optional action button) + content
// Tailwind: consistent padding, border, shadow
```

---

#### **2.5 Create `src/components/shared/EmptyState.tsx`**
```typescript
// Props: { icon?: React.ReactNode; title: string; description?: string; action?: { label: string; onClick: () => void } }
// Renders: centered message with optional CTA
```

---

#### **2.6 Create `src/components/shared/StatusBadge.tsx`**
```typescript
// Props: { status: string; colorMap?: Record<string, string> }
// Renders: small badge with status text + color
// Default colors: success (green), pending (yellow), error (red), info (blue)
```

---

#### **2.7 Create `src/components/shared/NotificationBell.tsx`**
```typescript
// Props: { notifications: Notification[] }
// Renders:
//  - Bell icon with unread count
//  - Dropdown on click showing last 5 notifications
//  - "Mark as read" button per notification
//  - "View all" link to notifications page
// Real-time: subscribe to notifications table
```

---

#### **2.8 Create `src/components/shared/MessagePanel.tsx`**
```typescript
// Props: { division: string; threadKey: string }
// Renders:
//  - Message list (scrollable)
//  - Input field + send button
//  - Real-time updates (subscribe to messages table)
//  - Sender avatars + timestamps
```

---

#### **2.9 Create `src/components/shared/DocumentsCenter.tsx`**
```typescript
// Props: { division: string; projectId?: string }
// Renders:
//  - File list with icons (PDF, DOC, IMG)
//  - Upload button (drag-drop + click)
//  - File metadata (size, date, uploader)
//  - Download + delete actions (role-based)
```

---

#### **2.10 Create `src/components/shared/index.ts`**
```typescript
// Export all shared components for easy imports
export { HeroBanner, ImageGallery, KpiStat, DataPanel, EmptyState, StatusBadge, NotificationBell, MessagePanel, DocumentsCenter };
```

**Acceptance for all components:**
- Zero TypeScript errors
- All props typed with JSDoc
- Accessible: proper ARIA labels, semantic HTML
- Responsive: mobile + desktop views
- Dark mode compatible (use tailwind dark: prefix)
- Can be used in Storybook (optional)

---

### **Step 3: Update Portal Layout & Navigation**

#### **3.1 Update `src/components/layout/PortalLayout.tsx`**
```typescript
// Current: global layout for portal
// Add:
//  - Fetch user_divisions on mount
//  - Pass divisions to sidebar
//  - Show division context in topbar (current division name + icon)
//  - Highlight current division in sidebar
```

---

#### **3.2 Create `src/components/layout/DivisionSidebar.tsx`**
```typescript
// Props: { divisions: Division[]; userDivisions: { division_slug: string }[]; currentDivision: string; userRole: 'admin'|'staff'|'client' }
// Renders:
//  - Sidebar (collapsible on mobile)
//  - Section per division (collapsible)
//  - Show only divisions in userDivisions
//  - Within each division: show only accessible modules based on role
//  - Active state on current route
//  - Admin sees "Settings" + "Manage Divisions" link
//  - Collapse/expand state persisted to localStorage
```

**Module visibility:**
- Admin/Staff: all modules
- Client: only client-facing modules (tenant portal, investor dashboard, etc.)

---

#### **3.3 Update `src/components/layout/TopBar.tsx`**
```typescript
// Current: global topbar
// Add:
//  - Current division name + icon (right side)
//  - Click to show division switcher dropdown
//  - Notification bell (uses NotificationBell component)
//  - User menu (existing)
```

---

### **Step 4: Create Shared Server Functions**

#### **4.1 Create `src/lib/shared.functions.ts`**
```typescript
// - getPortalContext(userId): Returns { user, userDivisions, userRole, org }
// - getUserNotifications(userId, limit = 20): Returns notifications
// - createNotification(userId, division, title, body)
// - sendMessage(division, threadKey, message)
// - getMessages(division, threadKey, limit = 50)
// All with proper RLS checks + error handling
```

---

### **Step 5: Create Custom Hooks for Divisions, Notifications, Messages**

#### **5.1 Create `src/integrations/supabase/hooks/useDivisions.ts`**
```typescript
// const { divisions, loading, error } = useDivisions()
// Real-time subscription to user_divisions table
```

---

#### **5.2 Create `src/integrations/supabase/hooks/useNotifications.ts`**
```typescript
// const { notifications, unreadCount, markAsRead, subscribe } = useNotifications()
// Real-time subscription to notifications table filtered by user_id
```

---

#### **5.3 Create `src/integrations/supabase/hooks/useMessages.ts`**
```typescript
// const { messages, loading, sendMessage } = useMessages(division, threadKey)
// Real-time subscription + send capability
```

---

### **Step 6: Generate & Place Hero & Gallery Images**

#### **6.1 Create `src/assets/divisions/` Folder Structure**
```
src/assets/divisions/
├── hero-technology.jpg              (Futuristic servers, blue lighting)
├── hero-agritech.jpg                (Drone over farmland, green tones)
├── hero-real-estate.jpg             (Smart buildings in Lagos, modern architecture)
├── hero-logistics.jpg               (Trucks + GPS map overlay, orange/red)
├── hero-intelligence.jpg            (AI brain graphics + data streams, purple)
├── hero-innovation-lab.jpg          (Startup teams collaborating, teal)
└── gallery/
    ├── tech-dashboard.jpg
    ├── tech-code.jpg
    ├── tech-integration.jpg
    ├── tech-mobile.jpg
    ├── agritech-tractor.jpg
    ├── agritech-irrigation.jpg
    ├── agritech-drone.jpg
    ├── agritech-harvest.jpg
    ├── realestate-interior.jpg
    ├── realestate-exterior.jpg
    ├── realestate-floorplan.jpg
    ├── realestate-pool.jpg
    ├── logistics-vehicle.jpg
    ├── logistics-hub.jpg
    ├── logistics-dock.jpg
    ├── logistics-map.jpg
    ├── intelligence-charts.jpg
    ├── intelligence-model.jpg
    ├── intelligence-prediction.jpg
    ├── intelligence-dashboard.jpg
    ├── innovation-team.jpg
    ├── innovation-prototype.jpg
    ├── innovation-hack.jpg
    └── innovation-pitch.jpg
```

**Generation:**
- Use Lovable AI Image Generator or public stock (Unsplash, Pexels)
- Optimize: compress to <200KB per hero, <100KB per gallery image
- Format: JPG for photos, PNG for graphics (if needed)

---

### **Step 7: Create Sample Data Seed Scripts**

#### **7.1 Create `supabase/seed.sql`**
```sql
-- Comprehensive seed data for all 6 divisions + shared tables

-- ===== ORGANIZATIONS =====
INSERT INTO public.organizations (name) VALUES ('UIG Operations');

-- ===== TECH DIVISION =====
-- 8 projects, 40 tasks, 5 integrations (see detailed spec below)

-- ===== REAL ESTATE DIVISION =====
-- 10 properties (Lagos, Abuja, PH), 20 leads, 8 tenants, 3 investors

-- ===== AGRITECH DIVISION =====
-- 15 farmers, 30 fields, 100+ sensor readings, 10 yield predictions

-- ===== LOGISTICS DIVISION =====
-- 5 vehicles, 8 drivers, 12 shipments, 6 routes

-- ===== INTELLIGENCE DIVISION =====
-- 3 datasets, 2 models, 5 predictions

-- ===== INNOVATION LAB DIVISION =====
-- 5 ideas, 2 prototypes, 1 experiment

-- Full SQL provided in SEED_DATA.md (see step 7.2)
```

---

#### **7.2 Create `.lovable/SEED_DATA.md`**
Detailed SQL inserts for all divisions (see separate file in this task)

---

#### **7.3 Create `src/lib/seed-utils.ts`**
```typescript
// Helper functions for seeding
// - generateRealisticNigerianAddress()
// - generatePropertyImages()
// - generateFarmerData()
// - generateShipmentData()
// etc.
```

**To Run Seeds:**
```bash
cd supabase
supabase db push
supabase migration up
psql "postgresql://..." < seed.sql
```

---

### **Step 8: Error Handling & Toast Notifications**

#### **8.1 Create Toast System**
```typescript
// src/lib/toast.ts
// - showToast(message, type: 'success'|'error'|'info'|'warning')
// - Auto-dismiss after 5s
// - Stack multiple toasts
// Use: sonner library (already in package.json)
```

---

#### **8.2 Create Error Boundary Component**
```typescript
// src/components/ErrorBoundary.tsx
// Wraps routes + logs to console
// Shows user-friendly error message
// Optional: send to Sentry (stub for now)
```

---

### **Step 9: Create Playwright E2E Tests**

#### **9.1 Create `tests/e2e/signup-division-select.spec.ts`**
```typescript
// Test: User signs up → verifies email → selects divisions → lands on tech dashboard
// Steps:
//  1. Navigate to /signup
//  2. Fill form (name, email, password, country)
//  3. Submit → verify email sent (mock or stub)
//  4. Click verify link / navigate to choose-division
//  5. See 6 division cards
//  6. Select "Technology" + "Real Estate"
//  7. Choose "Technology" as primary
//  8. Submit → redirect to /portal/technology
//  9. Verify tech dashboard loads + seeded projects visible
```

---

#### **9.2 Create `tests/e2e/portal-navigation.spec.ts`**
```typescript
// Test: Admin navigates portal, sees all divisions
// Test: Client sees only assigned divisions
// Test: Sidebar collapses/expands
// Test: Division switcher works
```

---

#### **9.3 Create `tests/e2e/shared-components.spec.ts`**
```typescript
// Test each shared component renders + is interactive
// - HeroBanner loads image
// - ImageGallery shows thumbnails + lightbox
// - KpiStat displays value + trend
// - StatusBadge colors correct
// - NotificationBell updates unread count
```

---

### **Step 10: Build & Smoke Test**

#### **10.1 Run Build**
```bash
bun run build
```
**Acceptance:** Zero errors, no warnings (or only acceptable peer dependency warnings)

---

#### **10.2 Manual Smoke Test (3–5 min)**
```
- Visit /portal/signup/choose-division → see 6 cards
- Select 3 divisions → submit
- Land on /portal/technology → see dashboard (KPIs, seeded projects)
- Click division in sidebar → navigate to /portal/real-estate
- Navigate back → /portal/agritech
- Open notification bell → see welcome notifications
- Test mobile (iPhone 375px) → sidebar collapses, cards responsive
- No console errors
```

---

## 🎨 Design Tokens & Styling

### **Accent Colors (Tailwind CSS)**
```css
/* Add to tailwind.config.js */
--acc-tech: #0066FF (Electric Blue)
--acc-agritech: #22C55E (Green)
--acc-realestate: #E8E8E8 (Silver)
--acc-logistics: #FF6B35 (Orange)
--acc-intelligence: #A855F7 (Purple)
--acc-innovation: #14B8A6 (Teal)
--acc-gold: #FBBF24 (Gold, primary brand)
```

### **Component Classes**
```typescript
// Example usage in components
<div className={`acc-${division.accent} border-l-4 border-current`}>
  // Content uses current accent color
</div>
```

---

## 📦 Dependencies (Already Installed)

- `@supabase/supabase-js` — Database + auth
- `@tanstack/react-router` — Routing
- `@tanstack/react-start` — SSR
- `recharts` — Charts for KPIs
- `sonner` — Toast notifications
- `lucide-react` — Icons
- `@radix-ui/*` — Accessible components
- `tailwindcss` — Styling
- `zod` — Validation
- `react-hook-form` — Forms

**To Install (if needed):**
```bash
bun add @playwright/test --dev
bun add sentry-cli --dev  # (optional, for Sentry setup)
```

---

## 🧪 Testing Strategy

### **Unit Tests**
- Shared component rendering
- Server function validation
- Hook behavior

### **E2E Tests (Playwright)**
- Critical user flows (signup, division select, navigation)
- Role-based access
- Image loading
- Mobile responsiveness

### **Manual QA**
- Image load times
- Performance (Lighthouse)
- Accessibility (axe)
- Mobile UX (iOS + Android browsers)

---

## 🚀 Deployment Checklist

Before merging to `main`:
- [ ] All acceptance criteria met
- [ ] Build passes: `bun run build`
- [ ] Lint passes: `bun run lint`
- [ ] Tests pass: `bun run test:e2e`
- [ ] Playwright tests recorded (optional)
- [ ] Images optimized + loaded
- [ ] No console errors
- [ ] Mobile responsive (tested on real device or emulator)
- [ ] Accessibility check: axe DevTools + keyboard navigation
- [ ] PR reviewed by team lead
- [ ] Merge to `main` → triggers deployment to staging

---

## 📞 Support & Questions

If blocked:
1. Check `.lovable/SEED_DATA.md` for detailed sample data spec
2. Review `.lovable/plan.md` for broader vision
3. Check `BUILD_CHECKLIST.md` for verification steps
4. Ask in PR comments for clarification

---

## ✅ Success Metrics

- ✅ Phase 1 complete: foundation + shared infra ready
- ✅ Signup division selection flow working end-to-end
- ✅ All 6 division dashboards can be built on top of this (Phases 2–7)
- ✅ Sample data populated + visible
- ✅ Sidebar navigation responsive + role-aware
- ✅ E2E tests passing
- ✅ Ready for hand-off to Phase 2 (Technology division deep build)

---

**Next Phase:** Phase 2 — UIG Technology (project boards, client portal, automation)

🎯 **Start with Step 1:** Create signup server functions & route.
