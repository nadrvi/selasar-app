# SELASAR - System Architecture & Flow Diagrams

## 📐 System Architecture Diagram

```mermaid
graph TB
    subgraph Frontend["🎨 Frontend Layer (React 19)"]
        Landing["Landing Page"]
        Auth["Auth Pages<br/>(Login/Register)"]
        Beranda["Beranda<br/>(Dashboard)"]
        Search["Search Page"]
        Map["Map Page"]
        Profile["Profile Page"]
        Settings["Settings Page"]
    end

    subgraph State["🔄 State Management"]
        ThemeContext["Theme Context<br/>(Light/Dark)"]
        Hooks["React Hooks<br/>(useState/useEffect)"]
        LocalStorage["LocalStorage<br/>(Client Cache)"]
    end

    subgraph Backend["🔐 Backend Services"]
        Firebase["Firebase<br/>(Auth + DB)"]
        Auth_Service["Authentication<br/>Email/Social"]
        Activity_Store["Activity Store<br/>(Visit Logging)"]
    end

    subgraph Data["💾 Data Layer"]
        Places["Places Database<br/>(50+ locations)"]
        User_Prefs["User Preferences<br/>(4 categories)"]
        User_Profile["User Profiles<br/>(name, email, avatar)"]
        Favorites["Favorites List<br/>(bookmarks)"]
        Activity_Log["Activity Log<br/>(last 20 visits)"]
    end

    Frontend -->|interact| State
    State -->|manage| Hooks
    State -->|persist| LocalStorage
    Frontend -->|authenticate| Backend
    Backend -->|verify| Auth_Service
    Backend -->|query| Data
    Activity_Store -->|log| Activity_Log
    Search -->|filter| Places
    Map -->|display| Places
    Profile -->|manage| User_Prefs
    Beranda -->|show| Favorites

    style Frontend fill:#e1f5ff
    style State fill:#f3e5f5
    style Backend fill:#fff3e0
    style Data fill:#e8f5e9
```

---

## 🔄 User Authentication Flow

```mermaid
graph LR
    Start["👤 User Visits App"] --> Authenticated{Authenticated?}

    Authenticated -->|No| Landing["📱 Landing Page"]
    Authenticated -->|Yes| Beranda["🏠 Dashboard"]

    Landing --> AuthChoice["Choose Auth Method"]
    AuthChoice --> Email["📧 Email/Password"]
    AuthChoice --> Google["🔵 Google"]
    AuthChoice --> Facebook["📘 Facebook"]
    AuthChoice --> GitHub["⚫ GitHub"]

    Email --> Firebase["Firebase<br/>Authentication"]
    Google --> Firebase
    Facebook --> Firebase
    GitHub --> Firebase

    Firebase -->|Success| Store["💾 Store User Data<br/>in localStorage"]
    Firebase -->|Fail| Error["❌ Show Error"]
    Error --> AuthChoice

    Store --> Beranda

    Beranda --> UseApp["✅ User Logged In<br/>Full Access"]

    style Start fill:#fff3e0
    style Landing fill:#e1f5ff
    style Beranda fill:#e8f5e9
    style Firebase fill:#fff3e0
    style UseApp fill:#c8e6c9
```

---

## 🔎 Search & Discovery Flow

```mermaid
graph TD
    User["👤 User"] --> Search["🔎 Enter Search Query"]

    Search --> Input["<br/>Search Query<br/>(mood, needs)<br/><br/>"]

    Input --> Filter["🎯 Apply Filters"]

    Filter --> Filters["<br/>WiFi • Outlets • Crowd • Duration<br/>Price • Rating • Distance<br/><br/>"]

    Filters --> Algorithm["⚡ Matching Algorithm<br/><br/>Match Score =<br/>WiFi 25% + Outlets 25% +<br/>Crowd 25% + Duration 15% +<br/>Rating 10%<br/><br/>"]

    Algorithm --> Results["📋 Ranked Results<br/>(0-100 match score)"]

    Results --> Action{User Action}

    Action -->|View Details| Details["📍 Place Details Page"]
    Action -->|Save| Favorite["⭐ Add to Favorites"]
    Action -->|Navigation| Map["🗺️ Navigate"]
    Action -->|Visit| Log["📊 Log Activity"]

    Details --> Similar["🔄 See Similar Places"]

    style User fill:#fff3e0
    style Search fill:#e1f5ff
    style Filter fill:#f3e5f5
    style Algorithm fill:#fff9c4
    style Results fill:#c8e6c9
    style Log fill:#ffccbc
```

---

## 📍 Place Data Structure

```mermaid
graph LR
    Place["🏢 Place Object"]

    Place --> Basic["📝 Basic Info<br/>• ID<br/>• Name<br/>• City<br/>• Address<br/>• Type<br/>• Phone"]

    Place --> Ratings["⭐ Ratings<br/>• WiFi Status<br/>• Outlet Probability<br/>• Noise Level<br/>• Crowd Density<br/>• Star Rating"]

    Place --> Details["📋 Details<br/>• Description<br/>• Operating Hours<br/>• Price Range<br/>• Amenities"]

    Place --> Media["📸 Media<br/>• Main Image<br/>• Photo Gallery<br/>• Map Coords<br/>• Distance"]

    Place --> Reviews["💬 Reviews<br/>• User Reviews<br/>• Photos<br/>• Ratings<br/>• Timestamps"]

    Place --> Social["👥 Social<br/>• Current Visitors<br/>• Favorite Count<br/>• Visit History<br/>• Check-ins"]

    style Place fill:#fff9c4
    style Basic fill:#e1f5ff
    style Ratings fill:#f3e5f5
    style Details fill:#e8f5e9
    style Media fill:#ffe0b2
    style Reviews fill:#ffccbc
    style Social fill:#f8bbd0
```

---

## 🎯 User Preference System

```mermaid
graph LR
    User["👤 User"] --> SetPrefs["⚙️ Set Preferences"]

    SetPrefs --> Colokan["🔌 Power Outlets<br/>├─ Tersedia/Banyak<br/>├─ Sedikit<br/>└─ Tidak Perlu"]

    SetPrefs --> WiFi["📶 WiFi Quality<br/>├─ 30+ Mbps<br/>├─ 10-30 Mbps<br/>└─ Tidak Penting"]

    SetPrefs --> Keramaian["🔊 Crowd Level<br/>├─ Sepi<br/>├─ Sedang<br/>└─ Ramai"]

    SetPrefs --> Duration["⏱️ Duration<br/>├─ <1 Hour<br/>├─ 1-3 Hours<br/>└─ 3+ Hours"]

    Colokan --> Store["💾 Store in Profile"]
    WiFi --> Store
    Keramaian --> Store
    Duration --> Store

    Store --> UseFor["✨ Used For:<br/>1. Default filters<br/>2. Recommendations<br/>3. Match scoring<br/>4. Place suggestions"]

    style User fill:#fff3e0
    style SetPrefs fill:#e1f5ff
    style Colokan fill:#f3e5f5
    style WiFi fill:#f3e5f5
    style Keramaian fill:#f3e5f5
    style Duration fill:#f3e5f5
    style UseFor fill:#c8e6c9
```

---

## 📊 Activity & Analytics Flow

```mermaid
graph TB
    Action["🎬 User Action"]

    Action -->|Search| SearchEvent["🔎 Search logged<br/>Query term tracked"]
    Action -->|View| ViewEvent["👀 View logged<br/>Place details opened"]
    Action -->|Visit| VisitEvent["📍 Visit logged<br/>Timestamp recorded<br/>Match score saved"]
    Action -->|Favorite| FavEvent["⭐ Favorite toggled<br/>Added/Removed"]

    SearchEvent --> Store["💾 Store in localStorage<br/><br/>Key: selasar_activity_[email]<br/>Max: 20 entries<br/>Format: JSON array"]
    ViewEvent --> Store
    VisitEvent --> Store
    FavEvent --> Store

    Store --> Sync["🔄 Sync Events<br/>dispatch: selasar-activity-updated"]

    Sync --> Analytics["📊 Display Analytics<br/>Profile Page"]

    Analytics --> Stats["📈 Statistics<br/>• Total Visits<br/>• Visit Frequency<br/>• Favorite Count<br/>• Top Places<br/>• Visit Timeline"]

    Store --> Recommend["🎯 Feed Recommendations<br/>Based on visit history"]

    style Action fill:#fff3e0
    style SearchEvent fill:#e1f5ff
    style ViewEvent fill:#e1f5ff
    style VisitEvent fill:#e1f5ff
    style FavEvent fill:#f3e5f5
    style Store fill:#ffe0b2
    style Analytics fill:#c8e6c9
    style Stats fill:#a5d6a7
```

---

## 🎨 Theme Switching Flow

```mermaid
graph TB
    Start["🌍 App Starts"] --> Check["🔍 Check Theme Setting"]

    Check -->|Saved| UseSaved["💾 Use Saved Preference<br/>from localStorage"]
    Check -->|Not Saved| UseSystem["🖥️ Use System Preference<br/>prefers-color-scheme"]
    Check -->|Default| UseDefault["📱 Use Default<br/>Auto-detect or Light"]

    UseSaved --> SetTheme["🎨 Apply Theme"]
    UseSystem --> SetTheme
    UseDefault --> SetTheme

    SetTheme --> Provider["📦 Wrap with ThemeProvider<br/>Context.Provider"]

    Provider --> Render["🎨 Render with Theme<br/>Colors, Spacing, Effects"]

    Render --> ShowTheme["👁️ Display Themed UI<br/>Light Mode OR Dark Mode"]

    ShowTheme --> Toggle["🔄 User Can Toggle"]

    Toggle -->|Click| Switch["↔️ Switch Theme"]
    Switch --> SavePref["💾 Save Preference<br/>localStorage"]
    SavePref --> Transition["✨ Smooth Transition<br/>500ms CSS"]
    Transition --> ShowTheme

    style Start fill:#fff3e0
    style Check fill:#e1f5ff
    style UseSaved fill:#c8e6c9
    style UseSystem fill:#c8e6c9
    style ShowTheme fill:#a5d6a7
    style Toggle fill:#f3e5f5
    style Switch fill:#ffccbc
    style Transition fill:#ffd9b3
```

---

## 📱 Navigation Routes Map

```mermaid
graph TB
    App["<b>SELASAR APP</b>"]

    App --> Landing["<b>/</b><br/>Landing Page<br/>├─ Hero Section<br/>├─ Features<br/>├─ How it Works<br/>├─ Testimonials<br/>└─ CTA Buttons"]

    App --> Auth["<b>Authentication</b>"]
    Auth --> Login["/login<br/>Login Page<br/>├─ Email/Password<br/>├─ Social Logins<br/>└─ Register Link"]
    Auth --> Register["/register<br/>Register Page<br/>├─ Form Fields<br/>├─ Validation<br/>└─ Privacy"]

    App --> Protected["<b>Protected Routes</b><br/>(Requires Auth)"]

    Protected --> Beranda["/beranda<br/>Dashboard<br/>├─ Banner Carousel<br/>├─ Search Bar<br/>├─ Featured Places<br/>└─ Quick Access"]

    Protected --> Searching["/searching<br/>Search Page<br/>├─ Search Input<br/>├─ Filters<br/>├─ Results<br/>└─ Sorting"]

    Protected --> Map["/map<br/>Map Page<br/>├─ Interactive Map<br/>├─ Category Filter<br/>├─ Search<br/>└─ Place Details"]

    Protected --> Profile["/profile<br/>Profile Page<br/>├─ User Info<br/>├─ Avatar<br/>├─ Preferences<br/>├─ Activity Stats<br/>└─ Favorites List"]

    Protected --> Settings["/settings<br/>Settings Page<br/>├─ Theme Toggle<br/>├─ Privacy<br/>├─ Data Mgmt<br/>└─ Logout"]

    style App fill:#fff9c4
    style Landing fill:#e1f5ff
    style Auth fill:#f3e5f5
    style Protected fill:#fff3e0
    style Beranda fill:#c8e6c9
    style Searching fill:#c8e6c9
    style Map fill:#c8e6c9
    style Profile fill:#c8e6c9
    style Settings fill:#c8e6c9
```

---

## 💾 Data Persistence Strategy

```mermaid
graph LR
    subgraph Session["🌐 User Session"]
        User["👤 User Actions"]
    end

    subgraph Memory["💭 In-Memory<br/>(React State)"]
        State1["User Profile"]
        State2["Preferences"]
        State3["Current Search"]
        State4["UI State"]
    end

    subgraph Local["📱 LocalStorage<br/>(Browser)"]
        Local1["User Data<br/>selasarUser"]
        Local2["Activity History<br/>selasar_activity_[email]"]
        Local3["Favorites<br/>selasar_favorites_[email]"]
        Local4["Theme Pref<br/>selasar-dark-mode"]
        Local5["Avatars<br/>selasarAvatar_[email]"]
    end

    subgraph Cloud["☁️ Firebase"]
        Cloud1["Authentication<br/>Email/Social"]
        Cloud2["User Profiles<br/>(future)"]
        Cloud3["Place Data<br/>(future)"]
        Cloud4["Reviews<br/>(future)"]
    end

    User -->|type/click| Memory
    Memory -->|on change| Local
    Local -->|sync| Cloud
    Cloud -->|restore| Memory
    Memory -->|render| User

    style User fill:#fff3e0
    style Memory fill:#e1f5ff
    style Local fill:#ffe0b2
    style Cloud fill:#fff9c4
```

---

## 🚀 Deployment Architecture

```mermaid
graph TB
    Dev["👨‍💻 Development<br/>Local Machine"]

    Dev -->|git push| Repo["📦 GitHub Repository<br/>main/develop branches"]

    Repo -->|trigger| Build["🔨 Build Pipeline<br/>ESLint, Type Check,<br/>Vite Build"]

    Build -->|success| Test["✅ Automated Tests<br/>(Coming Soon)"]

    Test -->|pass| Deploy["🚀 Deploy<br/>Vercel/GitHub Pages"]

    Deploy --> CDN["📡 Global CDN<br/>Edge Caching"]

    CDN --> Users["👥 End Users<br/>Fast Load Times"]

    Deploy --> Monitor["📊 Monitoring<br/>Error tracking<br/>Performance<br/>Analytics"]

    Monitor -->|issues| Alert["🚨 Alert Team<br/>Sentry/Firebase"]

    style Dev fill:#e1f5ff
    style Repo fill:#fff3e0
    style Build fill:#f3e5f5
    style Test fill:#fff9c4
    style Deploy fill:#c8e6c9
    style CDN fill:#ffe0b2
    style Users fill:#a5d6a7
    style Monitor fill:#ffccbc
```

---

## 📈 Growth & Scaling Strategy

```mermaid
graph LR
    Phase0["<b>Phase 0<br/>MVP</b><br/>Aug 2026<br/>───────<br/>• Landing<br/>• Auth<br/>• Search<br/>• Profile"]

    Phase1["<b>Phase 1<br/>Soft Launch</b><br/>Sep 2026<br/>───────<br/>• Beta (200 users)<br/>• 5 Cities<br/>• Venue Outreach<br/>• Feedback Loop"]

    Phase2["<b>Phase 2<br/>Growth</b><br/>Oct-Nov 2026<br/>───────<br/>• 10K Users<br/>• 20 Venues<br/>• Premium Beta<br/>• Community"]

    Phase3["<b>Phase 3<br/>Expansion</b><br/>Dec 2026<br/>───────<br/>• 50K Users<br/>• 15 Cities<br/>• Premium Launch<br/>• Analytics"]

    Phase4["<b>Phase 4<br/>Scale</b><br/>2027<br/>───────<br/>• 100K+ Users<br/>• National<br/>• Mobile App<br/>• Series A"]

    Phase0 -->|week 4| Phase1
    Phase1 -->|month 3| Phase2
    Phase2 -->|month 6| Phase3
    Phase3 -->|month 12| Phase4

    Phase1 --> Metrics1["📊 5K Users<br/>25% Retention"]
    Phase2 --> Metrics2["📊 10K Users<br/>35% Retention"]
    Phase3 --> Metrics3["📊 50K Users<br/>40% Retention"]
    Phase4 --> Metrics4["📊 100K Users<br/>45% Retention"]

    style Phase0 fill:#e1f5ff
    style Phase1 fill:#fff3e0
    style Phase2 fill:#f3e5f5
    style Phase3 fill:#c8e6c9
    style Phase4 fill:#a5d6a7
    style Metrics1 fill:#ffccbc
    style Metrics2 fill:#ffccbc
    style Metrics3 fill:#ffccbc
    style Metrics4 fill:#ffccbc
```

---

## 🔒 Security & Privacy Flow

```mermaid
graph TB
    User["👤 User Data"]

    User -->|Auth| Firebase["🔐 Firebase Auth<br/>SSL/HTTPS<br/>Secure Tokens"]

    User -->|Store Locally| Local["📱 LocalStorage<br/>Browser Encryption<br/>User-scoped Keys"]

    User -->|Share| Privacy["📋 Privacy Policy<br/>GDPR Compliance<br/>Data Minimization"]

    Firebase -->|Verify| Token["🎫 JWT Tokens<br/>Session Mgmt<br/>Expiry: 1 hour"]

    Token -->|Valid| Access["✅ Grant Access<br/>Protected Routes"]
    Token -->|Invalid| Refresh["🔄 Refresh Token<br/>Re-authenticate"]

    Local -->|Scope| Scope["👤 User-scoped<br/>Email-based Keys<br/>No Cross-user Access"]

    Privacy -->|Opt-in| Analytics["📊 Anonymous Analytics<br/>No PII Tracking"]
    Privacy -->|Right| Delete["🗑️ Right to Delete<br/>Full Data Removal"]

    style User fill:#fff3e0
    style Firebase fill:#fff9c4
    style Local fill:#ffe0b2
    style Privacy fill:#f3e5f5
    style Token fill:#c8e6c9
    style Access fill:#a5d6a7
    style Analytics fill:#ffccbc
    style Delete fill:#ffccbc
```

---

## 🎯 Feature Dependency Map

```mermaid
graph TB
    Core["🔧 Core Foundation"]

    Core --> Auth["🔐 Authentication"]
    Core --> UI["🎨 UI Components"]
    Core --> Theme["🌓 Theme System"]

    Auth --> Profile["👤 User Profile"]
    Theme --> Layout["📐 Responsive Layout"]
    UI --> Pages["📄 Page Components"]

    Pages --> Landing["Landing"]
    Pages --> Dashboard["Beranda"]
    Pages --> Search["Search"]
    Pages --> Map["Map"]
    Pages --> ProfilePage["Profile"]
    Pages --> Settings["Settings"]

    Dashboard --> Activity["📊 Activity Tracking"]
    Search --> DB["💾 Place Database"]
    Map --> Geo["📍 Geolocation"]
    Profile --> Prefs["⚙️ Preferences"]
    ProfilePage --> Favorites["⭐ Favorites"]

    DB --> Filter["🎯 Filtering"]
    Filter --> Algorithm["⚡ Matching"]
    Prefs --> Algorithm
    Activity --> Stats["📈 Statistics"]
    Favorites --> History["📜 History"]

    Geo --> Nav["🗺️ Navigation"]

    style Core fill:#fff9c4
    style Auth fill:#f3e5f5
    style UI fill:#e1f5ff
    style Theme fill:#e8f5e9
    style Algorithm fill:#ffe0b2
    style Stats fill:#ffccbc
    style Nav fill:#c8e6c9
```

---

## 📞 API Request/Response Flow (Future)

```mermaid
graph LR
    Client["📱 React Client"]

    Client -->|HTTP Request| API["🌐 API Server<br/>Node.js/Express"]

    API -->|Query| DB["💾 Database<br/>Firebase Firestore"]

    DB -->|Data| API

    API -->|HTTP Response| Client

    Client -->|Parse JSON| State["🔄 Update State"]

    State -->|Re-render| UI["🎨 Render UI"]

    Client -->|Cache| Local["📱 LocalStorage<br/>Backup"]

    API -->|Async Jobs| Queue["📋 Job Queue<br/>Background Tasks"]

    Queue -->|Process| Cache["🔄 Cache Manager<br/>Redis"]

    Cache -->|Return| API

    API -->|Monitor| Logs["📊 Logging<br/>Error Tracking"]

    style Client fill:#e1f5ff
    style API fill:#fff3e0
    style DB fill:#f3e5f5
    style State fill:#c8e6c9
    style UI fill:#a5d6a7
    style Local fill:#ffe0b2
    style Queue fill:#ffccbc
    style Cache fill:#ffd9b3
```

---

## 🎭 Component Hierarchy

```
App.jsx (Root)
├── ThemeProvider
│   └── Router
│       └── Routes
│           ├── Landing.jsx
│           │   ├── Hero Section
│           │   ├── Features Cards
│           │   ├── How-to Section
│           │   ├── Testimonials
│           │   └── Footer
│           │
│           ├── Login.jsx
│           │   ├── Form
│           │   └── OAuth Buttons
│           │
│           ├── Register.jsx
│           │   ├── Form
│           │   └── OAuth Buttons
│           │
│           ├── Beranda.jsx
│           │   ├── Header/Logo
│           │   ├── Search Bar
│           │   ├── Banner Carousel
│           │   └── Place Grid
│           │
│           ├── Searching.jsx
│           │   ├── Search Input
│           │   ├── Filter Panel
│           │   ├── Sort Options
│           │   └── Results Grid
│           │
│           ├── Map.jsx
│           │   ├── Map Container
│           │   ├── Category Filter
│           │   ├── Place Markers
│           │   └── Info Window
│           │
│           ├── Profile.jsx
│           │   ├── User Header
│           │   ├── Stats Section
│           │   ├── Preferences Panel
│           │   ├── Activity History
│           │   └── Favorites List
│           │
│           └── Settings.jsx
│               ├── Theme Toggle
│               ├── Privacy Settings
│               ├── Data Management
│               └── Logout
```

---

## 📊 Database Schema (Planned)

```
USERS Collection
├── uid (string) - Firebase UID
├── email (string)
├── name (string)
├── avatar (string) - base64 or CDN URL
├── bio (string)
├── preferences (object)
│   ├── colokan (string)
│   ├── wifi (string)
│   ├── keramaian (string)
│   └── durasi (string)
├── createdAt (timestamp)
└── updatedAt (timestamp)

PLACES Collection
├── id (string) - UUID
├── name (string)
├── city (string)
├── address (string)
├── type (string)
├── image (array) - URLs
├── coordinates (geo) - lat, lng
├── wifiStatus (string)
├── colokanProbability (number)
├── noiseLevel (string)
├── rating (number)
├── price (number)
├── operatingHours (object)
├── amenities (array)
├── createdAt (timestamp)
└── updatedAt (timestamp)

REVIEWS Subcollection (under PLACES)
├── userId (string)
├── rating (number)
├── text (string)
├── photos (array)
├── helpful (number)
├── createdAt (timestamp)
└── updatedAt (timestamp)

ACTIVITY Collection (per user)
├── userId (string)
├── placeId (string)
├── action (string) - visit, search, favorite
├── metadata (object)
├── timestamp (number)
└── source (string) - search, map, profile

FAVORITES Collection (per user)
├── userId (string)
├── placeId (string)
├── addedAt (timestamp)
└── notes (string)
```

---

## 🎯 Success Metrics Dashboard

```
ACQUISITION METRICS          ENGAGEMENT METRICS          RETENTION METRICS
├─ New Users/Day             ├─ Searches/User            ├─ D1 Retention
├─ Signup Rate               ├─ Visit Frequency          ├─ D7 Retention
├─ Viral Coefficient         ├─ Favorites/User           ├─ D30 Retention
├─ Cost per Acquisition      ├─ Session Length           ├─ Churn Rate
└─ Organic %                 ├─ Pages/Session            └─ Repeat Usage %
                             └─ Time on Page

QUALITY METRICS              REVENUE METRICS             PARTNERSHIP METRICS
├─ Page Load Time            ├─ ARPU                     ├─ Partner Count
├─ Crash Rate                ├─ Premium Conversion       ├─ Revenue/Partner
├─ App Rating                ├─ Lifetime Value           ├─ Partner Churn
├─ User Satisfaction         ├─ Revenue Growth           ├─ Venue Traffic
└─ NPS Score                 └─ Unit Economics           └─ Partnership NPS
```

---

**Last Updated**: 2026-08-18  
**Version**: 1.0.0  
**Diagrams Format**: Mermaid

To view these diagrams in full detail, visit: [https://mermaid.live](https://mermaid.live)
