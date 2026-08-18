# SELASAR - Quick Reference Summary

## 🎯 Project Overview

```
NAME: Selasar (Indonesian: "the right way/path")
TYPE: Workspace/Study Spot Discovery Platform
PLATFORM: Web Application (React + Vite)
STATUS: MVP Complete, Scaling Phase
LAUNCH DATE: August 2026
```

---

## 🎨 Visual System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        SELASAR APP                           │
└─────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┼─────────────┐
                │             │             │
        ┌───────▼───────┐ ┌──▼──────┐ ┌───▼─────────┐
        │  Frontend UI  │ │ Context │ │   Routes    │
        │ (React 19)    │ │ (Theme) │ │ (Router)    │
        └───────┬───────┘ └────┬─┬──┘ └───┬─────────┘
                │              │ │        │
    ┌───────────┼──────────────┼─┼────────┼───────────┐
    │           │              │ │        │           │
    │    ┌──────▼──────────┐   │ │    ┌───▼───────┐   │
    │    │  8 Main Pages  │   │ │    │ 4 Theme   │   │
    │    ├────────────────┤   │ │    │ Palettes  │   │
    │    │• Landing       │   │ │    │ (Light    │   │
    │    │• Login/Register│   │ │    │  Dark)    │   │
    │    │• Beranda       │───┼─┤    └───────────┘   │
    │    │• Searching     │   │ │                     │
    │    │• Map           │   │ │    ┌───────────┐   │
    │    │• Profile       │   │ │    │  Utils    │   │
    │    │• Settings      │   │ │    │ Activity  │   │
    │    │• (Reserved)    │   │ │    │ Store     │   │
    │    └──────┬─────────┘   │ │    └───────────┘   │
    │           │              │ │                     │
    └───────────┼──────────────┼─┼─────────────────────┘
                │              │ │
    ┌───────────▼──────────────┼─┼─────────────────────┐
    │        STATE MANAGEMENT  │ │                     │
    │    ┌──────────────────┐  │ │                     │
    │    │ React Hooks      │  │ │                     │
    │    │ (useState,       │──┘ │                     │
    │    │  useEffect)      │    │                     │
    │    └──────────────────┘    │                     │
    └───────────┬────────────────┼─────────────────────┘
                │                │
    ┌───────────▼────────────────▼─────────────────────┐
    │          PERSISTENCE LAYER                        │
    │    ┌──────────────┐  ┌────────────────────────┐  │
    │    │ localStorage │  │ Firebase Authentication│  │
    │    │ - User data  │  │ - Email/Password       │  │
    │    │ - Prefs      │  │ - Google/FB/GitHub     │  │
    │    │ - Favorites  │  │ - Session mgmt         │  │
    │    │ - Activity   │  │ - User profiles        │  │
    │    └──────────────┘  └────────────────────────┘  │
    └─────────────────────────────────────────────────┘
```

---

## 📊 Feature Breakdown

### ✅ Core Features (MVP - Implemented)

| Feature           | Status  | Priority | Users |
| ----------------- | ------- | -------- | ----- |
| Authentication    | ✅ Done | CRITICAL | All   |
| User Profile      | ✅ Done | HIGH     | All   |
| Place Database    | ✅ Done | CRITICAL | All   |
| Search & Filter   | ✅ Done | CRITICAL | All   |
| Map View          | ✅ Done | HIGH     | All   |
| Favorites         | ✅ Done | HIGH     | All   |
| Theme Toggle      | ✅ Done | MEDIUM   | All   |
| Activity Tracking | ✅ Done | MEDIUM   | All   |
| Responsive Design | ✅ Done | CRITICAL | All   |

### 🔄 In Progress (Phase 1)

| Feature               | ETA      | Priority | Purpose             |
| --------------------- | -------- | -------- | ------------------- |
| Backend APIs          | Sep 2026 | CRITICAL | Real-time data sync |
| Firestore Integration | Sep 2026 | CRITICAL | Data persistence    |
| User Reviews          | Oct 2026 | HIGH     | Community feedback  |
| Photo Uploads         | Oct 2026 | HIGH     | Visual content      |
| Notifications         | Oct 2026 | MEDIUM   | User engagement     |

### 📋 Future Features (Phase 2-3)

- Social features (friend check-ins)
- AI recommendations
- Mobile app (iOS/Android)
- Advanced analytics
- Venue partnership dashboard
- Premium subscription
- In-app messaging
- Event system

---

## 👥 User Personas

### Persona 1: "Skripsi Sam" - University Student

```
Profile:
- Age: 19-25
- Occupation: University student
- Pain Point: Finding quiet, focused study spot
- Tech Savvy: High
- Motivation: Complete assignments/skripsi

Key Features Used:
- Search with quiet filter
- WiFi/outlet availability check
- Favorite spots
- Activity history

Expected Behavior:
- Uses app 3-5x per week
- Searches after classes
- Long study sessions (3+ hours)
- Prefers calm atmosphere
```

### Persona 2: "Work from Anywhere Wanda" - Remote Worker

```
Profile:
- Age: 25-35
- Occupation: Freelancer/Remote worker
- Pain Point: Consistent workspace, video call ready
- Tech Savvy: Very High
- Motivation: Professional workspace

Key Features Used:
- WiFi quality ratings
- Professional atmosphere filter
- Map for location scouting
- Venue partner deals

Expected Behavior:
- Uses app daily
- Schedules workspace in advance
- Values partnership discounts
- Shares reviews with community
```

### Persona 3: "Community Kopi" - Coffee Shop Owner

```
Profile:
- Age: 30-50
- Occupation: Cafe/Workspace owner
- Pain Point: Attracting study-focused customers
- Tech Savvy: Low-Medium
- Motivation: Increase foot traffic

Key Features Used:
- Venue profile creation
- Photo management
- Analytics dashboard
- Review response

Expected Behavior:
- Logs in 2-3x per week
- Monitors customer feedback
- Updates venue info regularly
- Values customer insights
```

---

## 🎯 Business Model

```
REVENUE STREAMS (Planned)

Phase 1: Freemium (Months 1-6)
├─ Free tier: Full search, favorites, basic filtering
└─ Premium tier: Advanced analytics, offline maps
   └─ Price: $2-3/month

Phase 2: B2B Partnerships (Months 4-12)
├─ Venue Partnership Program: $100-500/month
│  ├─ Premium listings
│  ├─ Analytics dashboard
│  └─ Promotional campaigns
│
└─ In-App Promotions
   ├─ Featured banners
   ├─ Sponsored recommendations
   └─ Partner discount integration

Phase 3: Enterprise (Year 2+)
├─ Corporate packages for companies
├─ University-branded versions
└─ Custom integration APIs
```

---

## 📈 Growth Projections

### User Growth Timeline

```
Month  │ Users   │ DAU    │ Retention
───────┼─────────┼────────┼──────────
1      │ 500     │ 150    │ 30%
2      │ 2,500   │ 750    │ 35%
3      │ 5,000   │ 2K     │ 40%
6      │ 25,000  │ 10K    │ 42%
12     │ 100K+   │ 40K+   │ 45%+
```

### Revenue Projections

```
Source              │ Month 3  │ Month 6  │ Month 12
───────────────────┼──────────┼──────────┼──────────
Premium Subs       │ $0       │ $2K      │ $15K
Venue Partnerships │ $0       │ $3K      │ $40K
In-App Ads         │ $0       │ $500     │ $5K
───────────────────┼──────────┼──────────┼──────────
Total Revenue      │ $0       │ $5.5K    │ $60K+
```

---

## 🔐 Tech Stack Details

### Frontend

```
Framework:    React 19.2.6
Build Tool:   Vite 8.0.12
CSS:          Tailwind CSS 4.3.0
Routing:      React Router 7.15.1
State:        Context API + Hooks
Icons:        Lucide React + React Icons
Icons:        Lucide React 1.21.0
              React Icons 5.6.0
```

### Backend (Current)

```
Authentication:  Firebase Authentication
Database:        localStorage (client-side)
Hosting Ready:   Vercel/GitHub Pages

Upcoming:
└─ Database:      Firebase Firestore
   Storage:       Firebase Cloud Storage
   Functions:     Firebase Cloud Functions
   Analytics:     Firebase Analytics
```

### Development

```
Linting:       ESLint 10.3.0
Dev Server:    Vite HMR
Package Mgr:   npm/yarn
```

---

## 📱 User Journey Map

```
LANDING PAGE
    │
    ├─► SIGN UP ──────┐
    │                 │
    ├─► LOGIN ────────┤
    │                 │
    └─► BROWSE ANONYMOUSLY (Limited)
                      │
                      ▼
            COMPLETE PROFILE
            - Name, Email
            - Upload Avatar
            - Set Preferences
                      │
                      ▼
            HOME/DASHBOARD (BERANDA)
            - See banners & promos
            - Recent favorites
            - Search bar
                      │
            ┌─────────┼─────────┐
            ▼         ▼         ▼
        SEARCH    MAP VIEW   PROFILE
        - Advanced  - Visual  - History
          filters   - Category - Stats
        - Results   - Details   - Prefs
            │         │         │
            └─────────┼─────────┘
                      ▼
            PLACE DETAILS PAGE
            - Full info
            - Amenities
            - Reviews
            - Save favorite
            - Get directions
                      │
                      ▼
            VISIT PLACE
            - Activity logged
            - Track stats
                      │
            ┌─────────┘
            │
            ▼
        RETURN TO APP
        - See updated history
        - Discover new places
        - Get recommendations
```

---

## 🎨 Design System

### Color Palette

#### Light Mode

```
┌──────────────────────────────────────────┐
│ Background:      #EBE7DF (Warm Beige)   │
│ Primary Text:    #594A42 (Brown)        │
│ Secondary Text:  #8B6B4F (Warm Brown)   │
│ Cards:           #FFFFFF (White)        │
│ Borders:         #E5DDD2 (Light Gray)   │
│ Accents:         #8B6B4F (Warm Tone)    │
│ Hover:           #F5F2EB (Light Beige)  │
└──────────────────────────────────────────┘
```

#### Dark Mode

```
┌──────────────────────────────────────────┐
│ Background:      #221D1A (Dark Brown)   │
│ Primary Text:    #F5F2EB (Light)        │
│ Secondary Text:  #C8A97E (Gold)         │
│ Cards:           #2D2723 (Card Brown)   │
│ Borders:         #403732 (Border Brown) │
│ Accents:         #C8A97E (Gold Tone)    │
│ Hover:           #3B322D (Hover Brown)  │
│ Glass:           #2D2723/80 + blur      │
└──────────────────────────────────────────┘
```

### Typography

```
Headlines:  Font-sans, Bold, 32-48px
Subheads:   Font-sans, Semibold, 20-32px
Body:       Font-sans, Regular, 14-16px
Small:      Font-sans, Regular, 12-14px
```

### Spacing

```
xs: 4px      sm: 8px      md: 16px
lg: 24px     xl: 32px     2xl: 48px
```

---

## 📊 Key Performance Indicators (KPIs)

### North Star Metric

```
"Places Visited per Active User per Month"
Target: 8+ visits/month by Month 6
```

### Acquisition Metrics

```
CAC (Cost per Acquisition):    Target <$2
Viral Coefficient:             Target >0.5
Organic Growth %:              Target 40%+
```

### Engagement Metrics

```
DAU/MAU:                       Target 40%+
Avg Session Length:            Target 5+ min
Searches per User:             Target 10+/week
Favorites per User:            Target 3+
```

### Retention Metrics

```
Day 1 Retention:               Target 50%+
Day 7 Retention:               Target 40%+
Day 30 Retention:              Target 25%+
Churn Rate:                    Target <3%/month
```

### Revenue Metrics

```
ARPU (Avg Revenue per User):   Target $2-5/month
LTV (Lifetime Value):          Target $20+
LTV/CAC Ratio:                 Target 10:1+
```

---

## ⏰ Development Timeline

### Timeline Overview

```
PHASE 1: SOFT LAUNCH (Week 1-4)
├─ Week 1-2: Infrastructure & Testing
├─ Week 3: Beta Testing (100-200 users)
└─ Week 4: Public Launch

PHASE 2: GROWTH (Month 2-3)
├─ Feature refinement
├─ Venue partnerships
└─ User acquisition campaigns

PHASE 3: EXPANSION (Month 4-6)
├─ New city launches
├─ Premium features
└─ Series A prep (if applicable)

PHASE 4: SCALE (Month 7-12)
├─ Mobile app development
├─ Advanced analytics
└─ Enterprise features
```

### Critical Milestones

```
✓ MVP Complete          - Week 1
- Backend Setup         - Sep 1
- Soft Launch           - Sep 15
- 5K Users             - Oct 15
- First Partners        - Oct 30
- 25K Users            - Nov 30
- Premium Launch        - Dec 15
- 50K Users            - Jan 2027
- 100K Users           - Mar 2027
```

---

## 🚀 Go-to-Market Strategy

### Channel Strategy

```
ORGANIC (60%)
├─ Word-of-mouth
├─ Content marketing
├─ SEO & SEM
└─ Social media

PARTNERSHIPS (25%)
├─ University ambassadors
├─ Venue partnerships
├─ Influencer marketing
└─ Student communities

PAID (15%)
├─ Social ads
├─ Google ads
└─ Influencer sponsorships
```

### Target Cities (Launch)

```
Phase 1 (Soft Launch):
├─ Jakarta (Metro)
├─ Bandung (College town)
├─ Bogor (Suburban)
├─ Surabaya (Metro)
└─ Medan (Metro)

Phase 2 (Expansion):
├─ Yogyakarta
├─ Semarang
├─ Makassar
├─ Palembang
└─ Hanoi, Bangkok (Regional)
```

---

## 📋 Implementation Checklist

### Before Launch ✓

- [x] Core features complete
- [x] Authentication working
- [x] Database structure ready
- [x] UI/UX responsive
- [ ] Backend APIs deployed
- [ ] Analytics integrated
- [ ] Security audit passed
- [ ] Load testing complete
- [ ] Marketing materials ready

### Launch Day

- [ ] Announce to beta users
- [ ] Media/PR outreach
- [ ] Social media blitz
- [ ] Email campaign
- [ ] Monitor metrics
- [ ] Quick bug fixes
- [ ] Customer support ready

### Post-Launch (Week 1)

- [ ] Gather user feedback
- [ ] Implement quick fixes
- [ ] Optimize based on data
- [ ] Feature iteration
- [ ] Community engagement
- [ ] First venue partnerships
- [ ] User growth acceleration

---

## 💡 Success Factors

### Product

1. **Accuracy** - Real-time, accurate place information
2. **Relevance** - Smart matching algorithm
3. **Performance** - Fast, responsive experience
4. **Design** - Intuitive, beautiful interface

### Market

1. **Community** - Active, engaged user base
2. **Partnerships** - Strong venue ecosystem
3. **Brand** - Clear, memorable positioning
4. **Distribution** - Multiple growth channels

### Team

1. **Leadership** - Clear vision
2. **Execution** - Fast iteration
3. **Culture** - User-focused
4. **Expertise** - Diverse skills

---

## ⚠️ Risk Mitigation

| Risk              | Likelihood | Impact | Mitigation                        |
| ----------------- | ---------- | ------ | --------------------------------- |
| Low user adoption | Medium     | High   | Community-driven acquisition      |
| Data accuracy     | Low        | High   | Community moderation              |
| Venue resistance  | Low        | Medium | Attractive partnership terms      |
| Competition       | Low        | Medium | Unique features & network effects |
| Technical debt    | Medium     | Medium | Regular refactoring               |
| Scaling issues    | Low        | High   | Cloud infrastructure planning     |

---

## 📞 Contact & Support

```
Project Lead:        [Name]
Technical Lead:      [Name]
Product Manager:     [Name]
Business Owner:      [Name]

Repository:          github.com/selasar/selasar-app
Documentation:       docs.selasar.app
Community Forum:     forum.selasar.app
Support Email:       support@selasar.app
```

---

## 📄 Related Documents

- [SYSTEM_DOCUMENTATION.md](./SYSTEM_DOCUMENTATION.md) - Full detailed PRD
- [ARCHITECTURE.md](./docs/ARCHITECTURE.md) - Technical architecture (Coming)
- [API_SPEC.md](./docs/API_SPEC.md) - API documentation (Coming)
- [DESIGN_SYSTEM.md](./docs/DESIGN_SYSTEM.md) - Design guidelines (Coming)

---

**Last Updated**: 2026-08-18  
**Version**: 1.0.0  
**Status**: ACTIVE
