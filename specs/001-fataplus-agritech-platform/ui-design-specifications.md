# UI Design Specifications
**Fataplus AgriTech Platform - Complete Interface Design**

**Date**: 2025-09-14
**Status**: Design Phase
**Priority**: HIGH - Foundation for all development

---

## 🎯 **Design System Overview**

### **Design Philosophy**
- **African-centric**: Culturally appropriate colors, imagery, and patterns
- **Accessibility-first**: WCAG 2.1 AA compliance, high contrast, screen reader support
- **Offline-friendly**: Clear status indicators, graceful degradation
- **Mobile-first**: Responsive design for all screen sizes
- **Context-aware**: Interface adapts to user role and agricultural context

### **Brand Colors & Theme**
```css
/* Primary Agricultural Green Palette */
--primary-50: #f0fdf4;   /* Light green background */
--primary-100: #dcfce7;  /* Hover states */
--primary-200: #bbf7d0;  /* Light accents */
--primary-500: #22c55e;  /* Primary green */
--primary-600: #16a34a;  /* Primary dark */
--primary-700: #15803d;  /* Active states */
--primary-900: #14532d;  /* Text on light backgrounds */

/* Earth Tone Accents */
--earth-brown: #8b5a2b;  /* Soil, livestock */
--earth-orange: #ea580c; /* Crops, harvest */
--earth-blue: #0284c7;   /* Weather, water */
--earth-yellow: #eab308; /* Sun, grains */

/* Status Colors */
--success: #22c55e;      /* Growth, profit */
--warning: #f59e0b;      /* Alerts, pending */
--error: #ef4444;        /* Issues, losses */
--info: #3b82f6;         /* Information, tips */

/* Neutral Colors */
--gray-50: #f9fafb;      /* Page backgrounds */
--gray-100: #f3f4f6;     /* Card backgrounds */
--gray-200: #e5e7eb;     /* Borders */
--gray-400: #9ca3af;     /* Placeholders */
--gray-600: #4b5563;     /* Secondary text */
--gray-900: #111827;     /* Primary text */
```

### **Typography Scale**
```css
/* Headings */
--font-display: 'Inter', 'SF Pro Display', system-ui;
--text-4xl: 2.25rem;     /* Page titles */
--text-3xl: 1.875rem;    /* Section headers */
--text-2xl: 1.5rem;      /* Card titles */
--text-xl: 1.25rem;      /* Subsection headers */

/* Body Text */
--font-body: 'Inter', 'SF Pro Text', system-ui;
--text-base: 1rem;       /* Body text */
--text-sm: 0.875rem;     /* Captions, labels */
--text-xs: 0.75rem;      /* Fine print */

/* Spacing */
--space-1: 0.25rem;      /* 4px */
--space-2: 0.5rem;       /* 8px */
--space-4: 1rem;         /* 16px */
--space-6: 1.5rem;       /* 24px */
--space-8: 2rem;         /* 32px */
--space-12: 3rem;        /* 48px */
```

---

## 🔐 **1. Authentication UI Design**

### **Login Interface**
```
┌─────────────────────────────────────────────────────────────┐
│                    FATAPLUS AGRITECH                        │
│                Building African Agriculture                  │
├─────────────────────────────────────────────────────────────┤
│  🌱 Logo                                                    │
│                                                             │
│  Welcome Back to Your Farm Dashboard                        │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 📧 Email or Phone Number                            │   │
│  │ [                                    ]              │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🔒 Password                                         │   │
│  │ [                              ] 👁️ Show           │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ☐ Remember me    [Forgot Password?]                       │
│                                                             │
│  [         Sign In to Dashboard         ] 🌱               │
│                                                             │
│  ─────────────── or ───────────────                        │
│                                                             │
│  [📱 SMS Login] [👆 Biometric] [🎤 Voice]                  │
│                                                             │
│  Don't have an account? [Sign up here]                     │
│                                                             │
│  🌍 Language: English ▼  📍 Madagascar                     │
└─────────────────────────────────────────────────────────────┘
```

### **Registration Interface**
```
┌─────────────────────────────────────────────────────────────┐
│              JOIN THE AGRICULTURAL REVOLUTION                │
├─────────────────────────────────────────────────────────────┤
│  Step 1 of 3: Basic Information                            │
│  ████████░░░░░░░░░░░░░░░░░░░░░░░░                          │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 👤 Full Name                                        │   │
│  │ [                                    ]              │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 📧 Email Address                                    │   │
│  │ [                                    ] ✓ Verified   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 📱 Phone Number (+261)                              │   │
│  │ [+261] [                          ] 📱 Verify SMS   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🔒 Create Password                                  │   │
│  │ [                              ] 💪 Strong         │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  I am a: ○ Individual Farmer ○ Cooperative ○ Business      │
│                                                             │
│  [← Back]                              [Continue →] 🌱      │
└─────────────────────────────────────────────────────────────┘
```

---

## 👑 **2. SuperAdmin Dashboard UI**

### **Main Dashboard Layout**
```
┌─────────────────────────────────────────────────────────────┐
│ 🌱 Fataplus | SuperAdmin Console           👤 Admin ▼  🔔 │
├─────────────────────────────────────────────────────────────┤
│ 📊 Overview │ 🏢 Organizations │ 👥 Users │ ⚙️ System │ 📈  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              PLATFORM HEALTH OVERVIEW               │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │  🟢 System Status: All Systems Operational          │   │
│  │  📊 API Response: 245ms avg    🔗 Uptime: 99.9%     │   │
│  │  🏢 Organizations: 1,247 (+23 today)               │   │
│  │  👥 Active Users: 12,543 (89% online)              │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │🚨 CRITICAL ALERTS│  │💰 REVENUE METRICS│  │📈 USAGE STATS│ │
│  ├─────────────────┤  ├─────────────────┤  ├─────────────┤ │
│  │🔴 Server Load High│  │📊 Monthly: $245k │  │API Calls/h  │ │
│  │  CPU: 89%       │  │📈 Growth: +15%   │  │  15,234     │ │
│  │🟡 DB Slow Query │  │💳 Subs: 1,189    │  │Storage Used │ │
│  │  Query: 2.3s    │  │🏆 MRR: $198k     │  │  2.1TB      │ │
│  │🟢 All APIs OK   │  │📊 Churn: 2.1%    │  │Bandwidth    │ │
│  │  Response: Good │  │💵 ARPU: $206     │  │  340GB/day  │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │            RECENT ORGANIZATION ACTIVITY              │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │🏢 Coopérative Antsirabe    │ 🆕 New Registration    │   │
│  │📊 156 users, 89 farms      │ ⏰ 2 hours ago        │   │
│  │─────────────────────────────┼───────────────────────│   │
│  │🏢 AgriTech Solutions Ltd    │ 💰 Upgraded to Pro    │   │
│  │📊 234 users, 45 farms      │ ⏰ 4 hours ago        │   │
│  │─────────────────────────────┼───────────────────────│   │
│  │🏢 Farmer Union Tanzania     │ 🚨 Support Ticket     │   │
│  │📊 89 users, 123 farms      │ ⏰ 6 hours ago        │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### **Organization Management Interface**
```
┌─────────────────────────────────────────────────────────────┐
│ 🌱 Fataplus | Organizations                👤 Admin ▼  🔔 │
├─────────────────────────────────────────────────────────────┤
│ 📊 Overview │🏢 Organizations│ 👥 Users │ ⚙️ System │ 📈   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ [🔍 Search organizations...] [📊 Export] [➕ New Org]      │
│                                                             │
│ Filters: [All Types ▼] [All Countries ▼] [All Plans ▼]     │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ORG NAME          │TYPE     │USERS │FARMS │PLAN   │STATUS│ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │🏢 Coopérative     │Co-op    │ 156  │ 89  │Pro    │🟢    │ │
│ │   Antsirabe       │         │      │     │$199/mo│Active│ │
│ │   📍 Madagascar   │🌱 Rice  │📈15% │🚜12 │💰$2.1k│      │ │
│ │                   │[Edit] [💰] [📊] [🚫]          │      │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │🏢 AgriTech        │Business │ 234  │ 45  │Enter. │🟢    │ │
│ │   Solutions Ltd   │         │      │     │$599/mo│Active│ │
│ │   📍 Kenya        │🌽 Maize │📈25% │🚜8  │💰$5.2k│      │ │
│ │                   │[Edit] [💰] [📊] [🚫]          │      │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │🏢 Farmer Union    │Co-op    │ 89   │123  │Basic  │🟡    │ │
│ │   Tanzania        │         │      │     │$49/mo │Trial │ │
│ │   📍 Tanzania     │🥬 Mixed │📉-5% │🚜23 │💰$1.8k│      │ │
│ │                   │[Edit] [💰] [📊] [⏰]          │      │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Showing 1-10 of 1,247 organizations                        │
│ [← Previous] [1] [2] [3] ... [125] [Next →]                │
└─────────────────────────────────────────────────────────────┘
```

---

## 🏢 **3. Organization Admin Dashboard UI**

### **Main Organization Dashboard**
```
┌─────────────────────────────────────────────────────────────┐
│ 🌱 Coopérative Antsirabe              👤 Jean Admin ▼  🔔 │
├─────────────────────────────────────────────────────────────┤
│ 📊 Overview │ 👥 Team │ 🚜 Operations │ 🧩 Contexts │ 📈    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Welcome back, Jean! Here's your organization overview      │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │            COOPÉRATIVE ANTSIRABE DASHBOARD           │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │👥 156 Members   📈 +12 this month   🎯 89% Active   │   │
│  │🚜 89 Active Farms   🌾 145 Crop Cycles   🐄 2,340   │   │
│  │💰 $8,200 Revenue   📊 +15% Growth   🎯 Target: 85%  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │👥 TEAM OVERVIEW │  │🚜 FARM ACTIVITY │  │💰 FINANCIALS│ │
│  ├─────────────────┤  ├─────────────────┤  ├─────────────┤ │
│  │🟢 Online: 142   │  │🌱 Planting: 23  │  │Revenue/Month│ │
│  │🟡 Away: 12      │  │🌾 Growing: 67   │  │ $8,200      │ │
│  │🔴 Offline: 2    │  │📦 Harvest: 8    │  │Profit Margin│ │
│  │📊 Roles: 8 types│  │🚨 Issues: 3     │  │ 24.5%       │ │
│  │──────────────── │  │──────────────── │  │─────────────│ │
│  │Recent Activity: │  │Top Performers:  │  │Top Products:│ │
│  │• 5 New Members  │  │• Farm Razafy    │  │• Rice: $3.2k│ │
│  │• 3 Promotions   │  │• Farm Hery      │  │• Beans: $2.1k│ │
│  │• 2 Trainings    │  │• Farm Lalao     │  │• Maize: $1.8k│ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                 RECENT ACTIVITIES                    │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │👤 Rabe joined Livestock Team        ⏰ 2 hours ago  │   │
│  │🌾 Farm Lalao completed rice harvest ⏰ 4 hours ago  │   │
│  │💰 Market sale: 500kg rice @ 2,000Ar ⏰ 6 hours ago  │   │
│  │📚 Training: 12 completed Pest Mgmt  ⏰ 1 day ago    │   │
│  │🚨 Alert: Weather warning issued     ⏰ 1 day ago    │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### **Team Management Interface**
```
┌─────────────────────────────────────────────────────────────┐
│ 🌱 Team Management                     👤 Jean Admin ▼  🔔 │
├─────────────────────────────────────────────────────────────┤
│ 📊 Overview │👥 Team │ 🚜 Operations │ 🧩 Contexts │ 📈    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ [🔍 Search members...] [📊 Export] [➕ Invite Members]      │
│                                                             │
│ Filters: [All Roles ▼] [All Departments ▼] [Status ▼]      │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │NAME           │ROLE      │DEPT     │STATUS │LAST ACTIVE │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │👤 Rabe Andriam│Manager   │Livestock│🟢     │🕐 2 min ago │ │
│ │📧 rabe@coop.mg│          │         │Active │📱 Mobile   │ │
│ │📱 +261 34 12  │🎯 5 farms│🐄 234   │       │[Edit][💬] │ │
│ │               │[Edit Role ▼]       │       │[🚫 Block] │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │👤 Hery Rakoto │Farmer    │Crops    │🟢     │🕐 5 min ago │ │
│ │📧 hery@coop.mg│          │         │Active │💻 Web      │ │
│ │📱 +261 33 45  │🎯 3 farms│🌾 12 ha │       │[Edit][💬] │ │
│ │               │[Edit Role ▼]       │       │[📊 Stats] │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │👤 Lalao Raz   │Team Lead │Market   │🟡     │🕐 1 hour   │ │
│ │📧 lalao@coop  │          │         │Away   │📱 Mobile   │ │
│ │📱 +261 32 78  │🎯 Sales  │💰 $1.2k │       │[Edit][💬] │ │
│ │               │[Edit Role ▼]       │       │[📈 Reports]│ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ 📊 Team Statistics:                                         │
│ • Total Members: 156  • Active: 142  • New (30d): +12     │
│ • Managers: 8  • Team Leads: 15  • Farmers: 133           │
│                                                             │
│ [← Previous] [1] [2] [3] ... [16] [Next →]                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 👨‍💼 **4. Manager Dashboard UI**

### **Department Manager Dashboard**
```
┌─────────────────────────────────────────────────────────────┐
│ 🌱 Livestock Department               👤 Rabe Manager ▼ 🔔 │
├─────────────────────────────────────────────────────────────┤
│ 📊 Overview │ 👥 My Team │ 📋 Tasks │ 🐄 Operations │ 📈    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Good morning, Rabe! Here's your department status         │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              LIVESTOCK DEPARTMENT OVERVIEW           │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │👥 Team: 12 members   🐄 Animals: 2,340   📊 92%     │   │
│  │🎯 Monthly Goal: 85%  📈 Current: 78%    📅 12 days  │   │
│  │🚨 Priority Tasks: 7   ⏰ Overdue: 2    ✅ Done: 15  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │👥 TEAM STATUS   │  │📋 TODAY'S TASKS │  │📊 PERFORMANCE│ │
│  ├─────────────────┤  ├─────────────────┤  ├─────────────┤ │
│  │🟢 Online: 8     │  │🔴 Cattle Vaccine│  │Productivity │ │
│  │🟡 Break: 2      │  │  Due: 234 heads │  │ ↗ +12%      │ │
│  │🔴 Offline: 2    │  │⚡ Feed Delivery │  │Health Score │ │
│  │📊 Performance   │  │  Expected: 10am │  │ 94/100      │ │
│  │ Team: 92%       │  │⏰ Health Check  │  │Efficiency   │ │
│  │ Individual Top: │  │  Overdue: 45min │  │ ↗ +8%       │ │
│  │ • Hery: 98%     │  │💰 Market Report │  │Team Goals   │ │
│  │ • Vola: 95%     │  │  Review needed  │  │ 78/85%      │ │
│  │ • Koto: 87%     │  │📚 Training Req  │  │Quality      │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                APPROVAL QUEUE                        │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │🔴 Feed Purchase Request - 2 tons    [✅ Approve][❌]│   │
│  │   Requested by: Hery  Amount: 800,000 Ar           │   │
│  │🟡 Sick Animal Treatment Authorization [✅ Approve]  │   │
│  │   Requested by: Vola  Vet fee: 150,000 Ar         │   │
│  │🟡 Equipment Repair - Milking Machine [✅ Approve]  │   │
│  │   Requested by: Koto  Cost: 300,000 Ar            │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 👤 **5. Regular User Context UI**

### **User Dashboard with Context Switching**
```
┌─────────────────────────────────────────────────────────────┐
│ 🌱 My Farm Dashboard                   👤 Hery Farmer ▼ 🔔 │
├─────────────────────────────────────────────────────────────┤
│ 🏠 Farm │ 🐄 Livestock │ 🌤️ Weather │ 🛒 Market │ 📚 Learn │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📍 Farm Razafy, Antsirabe   🌤️ 24°C Sunny   🕐 8:34 AM    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                  QUICK OVERVIEW                      │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │🌾 Crops: 3 active  🐄 Cattle: 12  🌧️ Rain: 60%     │   │
│  │💰 Income: 145,000 Ar  📦 Harvest: Rice ready       │   │
│  │🎯 Tasks: 5 pending   🚨 Alerts: Weather warning    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │🌾 CROP STATUS   │  │🐄 ANIMAL HEALTH │  │📊 THIS WEEK │ │
│  ├─────────────────┤  ├─────────────────┤  ├─────────────┤ │
│  │🟢 Rice Field A  │  │🟢 Healthy: 10   │  │Sales        │ │
│  │  Ready to harvest│  │🟡 Checkup: 2    │  │ 45,000 Ar   │ │
│  │🟡 Maize Field B │  │🔴 Sick: 0       │  │Expenses     │ │
│  │  70% mature     │  │💉 Vaccine due   │  │ 12,000 Ar   │ │
│  │🟢 Bean Field C  │  │  Next week: 5   │  │Profit       │ │
│  │  Growing well   │  │🥛 Milk today    │  │ 33,000 Ar   │ │
│  │[View All →]     │  │  25 liters      │  │[Full Report]│ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   TODAY'S TASKS                      │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │☐ Check rice field moisture levels   🕐 9:00 AM      │   │
│  │☐ Feed cattle morning portion        🕐 10:00 AM     │   │
│  │☐ Apply fertilizer to maize field    🕐 2:00 PM      │   │
│  │☐ Collect and record milk production 🕐 6:00 PM      │   │
│  │☑️ Check weather forecast (completed) ✅              │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### **Farm Management Context**
```
┌─────────────────────────────────────────────────────────────┐
│ 🌱 Farm Management                     👤 Hery Farmer ▼ 🔔 │
├─────────────────────────────────────────────────────────────┤
│🏠 Farm │ 🐄 Livestock │ 🌤️ Weather │ 🛒 Market │ 📚 Learn │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ [🗺️ Map View] [📊 Analytics] [📋 Tasks] [➕ Add Field]      │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │               FARM MAP VIEW                          │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │  📍 Farm Razafy - 5.2 hectares                      │   │
│  │                                                     │   │
│  │  🗺️ [Interactive Farm Map]                          │   │
│  │                                                     │   │
│  │  🟢 Field A (Rice) - 2.1 ha   Ready ✅              │   │
│  │  🟡 Field B (Maize) - 1.8 ha  Growing 70%          │   │
│  │  🟢 Field C (Beans) - 1.0 ha  Healthy              │   │
│  │  🏠 Farmhouse & Storage                             │   │
│  │  🐄 Cattle Enclosure - 12 head                     │   │
│  │  💧 Water Sources (2)                               │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │📊 FIELD DETAILS │  │📈 PRODUCTIVITY  │  │🌱 NEXT STEPS│ │
│  ├─────────────────┤  ├─────────────────┤  ├─────────────┤ │
│  │Selected: Field A│  │Yield Projection │  │Field A:     │ │
│  │🌾 Crop: Rice    │  │ Rice: 2.5 t/ha  │  │• Harvest    │ │
│  │📅 Planted: Jun  │  │Expected Revenue │  │• Dry & Store│ │
│  │📊 Stage: Mature │  │ 500,000 Ar      │  │Field B:     │ │
│  │🌡️ Soil: Good   │  │Cost Investment  │  │• Fertilizer │ │
│  │💧 Irrigation: ✅│  │ 150,000 Ar      │  │• Pest Check │ │
│  │🚨 Issues: None  │  │Profit Margin    │  │Field C:     │ │
│  │[📊 History]     │  │ 70% (Good)      │  │• Watering   │ │
│  │[📝 Add Note]    │  │[Full Analysis]  │  │• Weed Ctrl │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### **Livestock Management Context**
```
┌─────────────────────────────────────────────────────────────┐
│ 🐄 Livestock Management                👤 Hery Farmer ▼ 🔔 │
├─────────────────────────────────────────────────────────────┤
│🏠 Farm │🐄 Livestock│ 🌤️ Weather │ 🛒 Market │ 📚 Learn │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ [🐄 All Animals] [📊 Health Records] [🥛 Production] [➕]    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                LIVESTOCK OVERVIEW                    │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │🐄 Total Cattle: 12   🟢 Healthy: 10   🟡 Monitor: 2 │   │
│  │🥛 Daily Production: 25L   📊 Average: 2.1L/cow      │   │
│  │💰 Monthly Income: 75,000 Ar   📈 Growth: +5%        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                 INDIVIDUAL ANIMALS                   │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │🐄 COW-001 "Vola"    │Age: 3y  │Health: 🟢 Excellent│   │
│  │Production: 3.2L/day │Weight: 420kg │Last Check: 2d  │   │
│  │Breed: Holstein      │Status: Lactating │[📊 Details]│   │
│  │─────────────────────┼─────────┼───────────────────│   │
│  │🐄 COW-002 "Kely"    │Age: 5y  │Health: 🟡 Monitor │   │
│  │Production: 1.8L/day │Weight: 380kg │Last Check: 1d  │   │
│  │Breed: Zebu Cross    │Status: Pregnant │[📊 Details] │   │
│  │─────────────────────┼─────────┼───────────────────│   │
│  │🐄 COW-003 "Ravo"    │Age: 2y  │Health: 🟢 Good    │   │
│  │Production: 2.5L/day │Weight: 350kg │Last Check: 3d  │   │
│  │Breed: Local         │Status: Lactating │[📊 Details]│   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │📅 SCHEDULE      │  │🏥 HEALTH ALERTS │  │📊 PRODUCTION│ │
│  ├─────────────────┤  ├─────────────────┤  ├─────────────┤ │
│  │Today:           │  │🟡 COW-002 Kely  │  │Today: 25L   │ │
│  │• Feed: 6AM ✅   │  │  Pregnancy check│  │Week: 165L   │ │
│  │• Milk: 6AM ✅   │  │  Due in 5 days  │  │Month: 720L  │ │
│  │• Milk: 6PM ⏰   │  │💉 Vaccines Due  │  │Best: COW-001│ │
│  │Tomorrow:        │  │  5 cattle next  │  │ 3.2L/day    │ │
│  │• Vet Visit      │  │  week           │  │Revenue      │ │
│  │• Vaccination    │  │[📋 Full Report] │  │ 1,500Ar/L   │ │
│  │[📅 Full Plan]   │  │                 │  │[💰 Sales]   │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 📱 **6. Mobile UI Adaptations**

### **Mobile Navigation Design**
```
┌─────────────────────────┐
│ 🌱 My Farm        🔔 3  │
├─────────────────────────┤
│                         │
│  📊 Quick Overview      │
│  ┌─────────────────────┐ │
│  │🌾 Rice: Ready ✅    │ │
│  │🐄 Cattle: 10 🟢     │ │
│  │🌤️ Weather: Sunny    │ │
│  │💰 Today: +15,000Ar  │ │
│  └─────────────────────┘ │
│                         │
│  🚨 Priority Tasks      │
│  ┌─────────────────────┐ │
│  │☐ Harvest rice field │ │
│  │  🕐 Before 5PM      │ │
│  │☐ Check sick cow     │ │
│  │  🏥 Vet recommended │ │
│  │☐ Market visit       │ │
│  │  💰 Sell 500kg rice │ │
│  └─────────────────────┘ │
│                         │
│  📱 Quick Actions       │
│  ┌─────────┬─────────┐   │
│  │🌾 Crops │🐄 Animals│   │
│  ├─────────┼─────────┤   │
│  │🌤️Weather│🛒 Market │   │
│  ├─────────┼─────────┤   │
│  │📚 Learn │📊 Reports│   │
│  └─────────┴─────────┘   │
│                         │
├─────────────────────────┤
│🏠 🐄 🌤️ 🛒 📚 ➕ 👤  │ Bottom Nav
└─────────────────────────┘
```

### **Offline Mode Interface**
```
┌─────────────────────────┐
│ 🌱 Farm (Offline) 📶❌  │
├─────────────────────────┤
│ ⚠️ No internet connection│
│ Last sync: 2 hours ago   │
├─────────────────────────┤
│                         │
│  📱 Available Offline   │
│  ┌─────────────────────┐ │
│  │✅ View farm data     │ │
│  │✅ Record activities  │ │
│  │✅ Take photos       │ │
│  │✅ Add notes         │ │
│  │❌ Weather updates   │ │
│  │❌ Market prices     │ │
│  └─────────────────────┘ │
│                         │
│  📝 Pending Sync (5)    │
│  ┌─────────────────────┐ │
│  │• Milk record: 25L   │ │
│  │• Photo: Sick cow    │ │
│  │• Note: Field damage │ │
│  │• Task: Fertilizer   │ │
│  │• Expense: Feed 50kg │ │
│  └─────────────────────┘ │
│                         │
│  [🔄 Try Sync Now]      │
│  [📱 Continue Offline]  │
│                         │
└─────────────────────────┘
```

---

## 🎨 **Component Library Specifications**

### **Button System**
```css
/* Primary Agricultural Button */
.btn-primary {
  background: var(--primary-600);
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.2s;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.btn-primary:hover {
  background: var(--primary-700);
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

/* Context-Specific Buttons */
.btn-farm { background: var(--primary-600); }
.btn-livestock { background: var(--earth-brown); }
.btn-weather { background: var(--earth-blue); }
.btn-market { background: var(--earth-orange); }
.btn-learn { background: var(--primary-500); }
```

### **Card Components**
```css
.card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  border: 1px solid var(--gray-200);
}

.card-header {
  border-bottom: 1px solid var(--gray-200);
  padding-bottom: 16px;
  margin-bottom: 16px;
}

.card-metric {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
```

### **Form Elements**
```css
.form-input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid var(--gray-200);
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.2s;
}

.form-input:focus {
  border-color: var(--primary-500);
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
}

.form-label {
  display: block;
  font-weight: 600;
  color: var(--gray-700);
  margin-bottom: 8px;
}
```

---

This comprehensive UI design specification provides the foundation for all interfaces in the Fataplus AgriTech platform. Each interface is designed with African agricultural context in mind, ensuring accessibility, offline functionality, and role-appropriate features.

**Next Steps:**
1. Review and approve these UI designs
2. Create interactive prototypes
3. Begin component library development
4. Start with authentication interface implementation

Would you like me to expand on any specific interface or create additional design specifications?