"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

type Category = "First Week" | "Daily Life" | "Transport" | "Social" | "Health";
type Resource = {
  id: string;
  name: string;
  category: Category;
  subcategory: string;
  description: string;
  address: string;
  hours: string;
  url: string;
  keywords: string;
  placeholder?: boolean;
};

const categories: Category[] = ["First Week", "Daily Life", "Transport", "Social", "Health"];
const subcategories: Record<Category, string[]> = {
  "First Week": ["Phone plans", "Internet", "Banking", "Settlement & paperwork"],
  "Daily Life": ["Food", "Groceries", "Self care"],
  Transport: ["Fredericton public transit", "Taxis & cabs", "Ride apps"],
  Social: ["Interest clubs", "Nightlife", "Workshops & activities"],
  Health: ["Coverage plans", "Hospitals", "Pharmacies"],
};
const resources: Resource[] = [
  { id: "bell-mobile", name: "Bell Aliant mobile plans", category: "First Week", subcategory: "Phone plans", description: "Compare current mobile plans and device options at Bell Aliant’s Fredericton store.", address: "1381 Regent St, Fredericton, NB", hours: "Confirm current store hours before visiting", url: "https://storelocator.bell.ca/bellca/en/NB/Fredericton/Bell-Aliant-Regent-Mall/BA297", keywords: "phone plan mobile cell data sim newcomer" },
  { id: "rogers-mobile", name: "Rogers mobile plans", category: "First Week", subcategory: "Phone plans", description: "Explore wireless plans and devices at the Regent Mall store.", address: "1381 Regent St, Unit 209, Fredericton, NB", hours: "Confirm current store hours before visiting", url: "https://www.rogers.com/stores/fredericton/regent-mall", keywords: "phone plan mobile cell data sim newcomer" },
  { id: "bell-internet", name: "Bell Fibe internet", category: "First Week", subcategory: "Internet", description: "Check which home internet plans are available at your Fredericton address.", address: "Availability varies by street address", hours: "Check current plans and pricing online", url: "https://storelocator.bell.ca/bellca/en/NB/Fredericton.html", keywords: "internet wifi home broadband bell aliant" },
  { id: "rogers-internet", name: "Rogers home internet", category: "First Week", subcategory: "Internet", description: "Check Rogers internet coverage and current plans for your address.", address: "Availability varies by street address", hours: "Check current plans and pricing online", url: "https://www.rogers.com/internet/new-brunswick", keywords: "internet wifi home broadband rogers" },
  { id: "rbc", name: "RBC Royal Bank", category: "First Week", subcategory: "Banking", description: "Find branch services, newcomer banking information, and appointment options.", address: "504 Queen St, Fredericton, NB", hours: "Confirm current branch hours online", url: "https://maps.rbcroyalbank.com/NB-FREDERICTON-branch-884/", keywords: "bank banking account newcomer money debit credit" },
  { id: "bmo", name: "BMO Bank of Montreal", category: "First Week", subcategory: "Banking", description: "Compare personal banking options and locate Fredericton branches.", address: "Fredericton branch locator", hours: "Check current hours for your branch", url: "https://branches.bmo.com/nb/fredericton/", keywords: "bank banking account newcomer money debit credit" },
  { id: "cibc", name: "CIBC Banking Centres", category: "First Week", subcategory: "Banking", description: "Search CIBC branches and ATMs near Fredericton.", address: "Fredericton branch locator", hours: "Check current hours for your branch", url: "https://locations.cibc.com/search/nb/fredericton", keywords: "bank banking account newcomer money debit credit" },
  { id: "service-nb", name: "Service New Brunswick", category: "First Week", subcategory: "Settlement & paperwork", description: "Get your driver’s licence and health card in one place.", address: "435 Brookside Dr, Fredericton, NB", hours: "Mon–Fri, 8:30 am–5:00 pm", url: "https://www2.snb.ca/", keywords: "licence license health card government id first week" },
  { id: "settlement", name: "MCAF — Multicultural Association of Fredericton", category: "First Week", subcategory: "Settlement & paperwork", description: "Settlement help, language classes, and community connections.", address: "28 Saunders St, Fredericton, NB", hours: "Mon–Fri, 8:30 am–4:30 pm", url: "https://mcaf.nb.ca/", keywords: "newcomer settlement immigration language first week" },

  { id: "fredericton-food", name: "Fredericton restaurants & cafés", category: "Daily Life", subcategory: "Food", description: "Browse local dining spots, cafés, and food experiences around the city.", address: "Fredericton Capital Region", hours: "Check each business for current hours", url: "https://www.frederictoncapitalregion.ca/capital-region/fredericton", keywords: "restaurants cafe coffee bakery eat food dining" },
  { id: "sobeys", name: "Sobeys Fredericton", category: "Daily Life", subcategory: "Groceries", description: "Grocery shopping with a wide range of everyday essentials.", address: "1180 Prospect St, Fredericton, NB", hours: "Check current store hours online", url: "https://www.sobeys.com/store-locator", keywords: "groceries food shopping supermarket" },
  { id: "atlantic-superstore", name: "Atlantic Superstore", category: "Daily Life", subcategory: "Groceries", description: "Find a local grocery store and check current services and hours.", address: "Fredericton store locator", hours: "Check current store hours online", url: "https://www.atlanticsuperstore.ca/", keywords: "groceries food shopping supermarket" },
  { id: "hair-salons", name: "Hair salons & barbers", category: "Daily Life", subcategory: "Self care", description: "Browse Fredericton hair and barber businesses, then contact a provider to book.", address: "Fredericton business directory", hours: "Appointments and hours vary by provider", url: "https://businessfrednorth.com/beauty/", keywords: "self care hair salon barber haircut appointment" },
  { id: "nails-spas", name: "Nails, skincare & spas", category: "Daily Life", subcategory: "Self care", description: "Explore local nail, esthetics, and spa listings for services and appointments.", address: "Fredericton business directory", hours: "Appointments and hours vary by provider", url: "https://businessfrednorth.com/beauty/", keywords: "self care nails manicure pedicure esthetics spa appointment" },

  { id: "transit", name: "Fredericton Transit", category: "Transport", subcategory: "Fredericton public transit", description: "Find local bus routes, fares, and schedules.", address: "470 Smythe St, Fredericton, NB", hours: "Routes run daily; check current schedules", url: "https://www.fredericton.ca/resident-services/fredericton-transit", keywords: "bus public transit route schedule transport" },
  { id: "checker-cab", name: "Checker Cab", category: "Transport", subcategory: "Taxis & cabs", description: "Call or book a local cab. The company lists 24/7 service on its contact page.", address: "3 Homestead Dr, Fredericton, NB", hours: "24 hours a day, 7 days a week", url: "https://www.checkercab.ca/contact-us", keywords: "taxi cab taxi phone ride airport transport" },
  { id: "uride", name: "Uride", category: "Transport", subcategory: "Ride apps", description: "Request an on-demand ride through the Uride app in Fredericton.", address: "App-based service in Fredericton", hours: "Check the app for availability", url: "https://www.uride.co/", keywords: "uber ride taxi rideshare get around app" },

  { id: "mcaf-social", name: "Multicultural Association of Fredericton", category: "Social", subcategory: "Interest clubs", description: "Meet people through local events and community programs.", address: "28 Saunders St, Fredericton, NB", hours: "Check current program listings", url: "https://mcaf.nb.ca/", keywords: "community events social meet people language support" },
  { id: "community-groups", name: "Clubs & community groups", category: "Social", subcategory: "Interest clubs", description: "Explore city-listed sports, recreation, and culture groups to find a shared interest.", address: "Fredericton community directory", hours: "Contact groups for meeting times", url: "https://www.fredericton.ca/recreation-leisure/programs-activities/community-group-directory", keywords: "clubs groups hobbies sports recreation join meet people" },
  { id: "nightlife", name: "Drinks & nightlife", category: "Social", subcategory: "Nightlife", description: "Browse local pubs, lounges, live music venues, and nightlife listings.", address: "Fredericton Capital Region", hours: "Check each venue for current hours and events", url: "https://www.frederictoncapitalregion.ca/eat-drink/drinks-nightlife", keywords: "nightlife bars pubs clubs dancing live music" },
  { id: "city-events", name: "Workshops & events around town", category: "Social", subcategory: "Workshops & activities", description: "Browse the City of Fredericton event calendar for current activities and workshops.", address: "Fredericton", hours: "Event times vary; check each listing", url: "https://www.fredericton.ca/community-culture/calendar-events", keywords: "workshops activities events calendar around town" },
  { id: "fredrec", name: "Recreation programs & activities", category: "Social", subcategory: "Workshops & activities", description: "Search city programs, seasonal activities, and community recreation options.", address: "Fredericton recreation listings", hours: "Program times vary by activity", url: "https://www.fredericton.ca/recreation-leisure/programs-activities", keywords: "workshops classes activities recreation programs" },

  { id: "medicare", name: "New Brunswick Medicare", category: "Health", subcategory: "Coverage plans", description: "Review provincial Medicare eligibility and application steps on the official site.", address: "New Brunswick coverage information", hours: "Application processing times can change", url: "https://www2.gnb.ca/content/gnb/en/departments/health/Medicare.html", keywords: "health insurance medicare health card coverage eligibility" },
  { id: "guardme-unb", name: "UNB international student insurance (guard.me)", category: "Health", subcategory: "Coverage plans", description: "UNB explains its guard.me plan, enrolment, eligibility, and how it relates to Medicare. Check your own school’s plan rules.", address: "UNB Fredericton student information", hours: "Plan dates and fees vary by term", url: "https://www.unb.ca/finance/financial-services/health-insurance.html", keywords: "health insurance guard.me guardme international student university" },
  { id: "horizon", name: "Horizon Health Network", category: "Health", subcategory: "Hospitals", description: "Find health services, clinics, and hospital information for the Fredericton region.", address: "Fredericton region, New Brunswick", hours: "Check the facility page for service hours", url: "https://horizonnb.ca/", keywords: "doctor health urgent care hospital clinic medical" },
  { id: "dech", name: "Dr. Everett Chalmers Regional Hospital", category: "Health", subcategory: "Hospitals", description: "Fredericton’s regional hospital. Its emergency department is listed as open 24/7 by Horizon.", address: "700 Priestman St, Fredericton, NB", hours: "Hospital and Emergency Department: 24/7", url: "https://horizonnb.ca/facilities/dr-everett-chalmers-regional-hospital/", keywords: "hospital emergency emergency room health Fredericton" },
  { id: "oromocto-hospital", name: "Oromocto Public Hospital", category: "Health", subcategory: "Hospitals", description: "A nearby community hospital serving Oromocto and surrounding communities.", address: "103 Winnebago St, Oromocto, NB", hours: "Emergency Department: 8 am–4 pm daily; confirm current details", url: "https://horizonnb.ca/facilities/oromocto-public-hospital/", keywords: "hospital emergency health Oromocto Fredericton" },
  { id: "hospital-placeholder-1", name: "", category: "Health", subcategory: "Hospitals", description: "", address: "", hours: "", url: "", keywords: "", placeholder: true },
  { id: "hospital-placeholder-2", name: "", category: "Health", subcategory: "Hospitals", description: "", address: "", hours: "", url: "", keywords: "", placeholder: true },
  { id: "pharmacy-directory", name: "Find a pharmacy", category: "Health", subcategory: "Pharmacies", description: "Search the New Brunswick College of Pharmacists’ public register for active pharmacies.", address: "Fredericton and New Brunswick", hours: "Contact a pharmacy to confirm hours and services", url: "https://nbcp-opnb.alinityapp.com/client/corporationdirectory", keywords: "pharmacy pharmacies prescription drug medicine" },
  { id: "lawtons-brookside", name: "Lawtons Drugs at Brookside Mall", category: "Health", subcategory: "Pharmacies", description: "Local pharmacy, prescriptions, and store services at Brookside Mall.", address: "435 Brookside Dr, Unit 5, Fredericton, NB", hours: "Check the store page for current hours", url: "https://lawtons.ca/stores/brookside-mall/", keywords: "pharmacy prescriptions drug medicine Brookside" },
];

const starterSaved = ["service-nb", "sobeys", "transit", "mcaf-social", "horizon"];

function Icon({ name, size = 18 }: { name: "heart" | "bookmark" | "home" | "bag" | "bus" | "people" | "health" | "arrow" | "chevron-left" | "chevron-right" | "search" | "menu" | "close" | "chat"; size?: number }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true as const };
  const paths: Record<string, React.ReactNode> = {
    heart: <path d="M20.8 4.6a5.4 5.4 0 0 0-7.6 0L12 5.8l-1.2-1.2a5.4 5.4 0 0 0-7.6 7.6l1.2 1.2L12 21l7.6-7.6 1.2-1.2a5.4 5.4 0 0 0 0-7.6Z" />,
    bookmark: <path d="M6 4.8A1.8 1.8 0 0 1 7.8 3h8.4A1.8 1.8 0 0 1 18 4.8V21l-6-3.8L6 21V4.8Z" />,
    home: <><path d="m3 10 9-7 9 7"/><path d="M5 9v11h14V9M9 20v-6h6v6"/></>,
    bag: <><rect x="4" y="7" width="16" height="14" rx="2"/><path d="M9 7V5a3 3 0 0 1 6 0v2M9 12v2h6v-2"/></>,
    bus: <><rect x="3" y="4" width="18" height="14" rx="3"/><path d="M3 11h18M7 18v2m10-2v2M7 8h.01M17 8h.01"/><circle cx="7" cy="17" r="1"/><circle cx="17" cy="17" r="1"/></>,
    people: <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/><path d="M20 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/></>,
    health: <><path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6z" /></>,
    arrow: <><path d="M7 17 17 7M7 7h10v10"/></>,
    "chevron-left": <path d="m15 18-6-6 6-6" />,
    "chevron-right": <path d="m9 18 6-6-6-6" />,
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
    menu: <><path d="M4 6h16M4 12h16M4 18h16"/></>,
    close: <><path d="m18 6-12 12M6 6l12 12"/></>,
    chat: <><path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H6l-3 2v-5.2A7.5 7.5 0 1 1 20 11.5Z"/><path d="M8 11.5h.01M12 11.5h.01M16 11.5h.01"/></>,
  };
  return <svg {...common}>{paths[name]}</svg>;
}

const categoryIcons: Record<Category, "home" | "bag" | "bus" | "people" | "health"> = {
  "First Week": "home", "Daily Life": "bag", Transport: "bus", Social: "people", Health: "health",
};

function ResourceCard({ resource, saved, onToggle }: { resource: Resource; saved: boolean; onToggle: () => void }) {
  if (resource.placeholder) {
    return <article className="resource-card resource-card-placeholder" aria-label="Empty hospital placeholder card" />;
  }
  return (
    <article className="resource-card">
      <div className="card-title-row">
        <h3>{resource.name}</h3>
        <button className={`save-button${saved ? " is-saved" : ""}`} onClick={onToggle} aria-label={saved ? `Remove ${resource.name} from saved resources` : `Save ${resource.name}`} aria-pressed={saved}>
          <Icon name="heart" size={19} />
        </button>
      </div>
      <p className="card-description">{resource.description}</p>
      <div className="card-details"><p>{resource.address}</p><p>{resource.hours}</p></div>
      <a className="website-link" href={resource.url} target="_blank" rel="noreferrer">Visit website <Icon name="arrow" size={14} /></a>
    </article>
  );
}

function ResourceCarousel({ items, savedIds, toggleSaved }: { items: Resource[]; savedIds: string[]; toggleSaved: (id: string) => void }) {
  const railRef = useRef<HTMLDivElement>(null);
  const [canScroll, setCanScroll] = useState(false);
  const [canScrollBack, setCanScrollBack] = useState(false);
  const [canScrollForward, setCanScrollForward] = useState(false);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    const updateControls = () => {
      const overflow = rail.scrollWidth > rail.clientWidth + 1;
      setCanScroll(overflow);
      setCanScrollBack(rail.scrollLeft > 1);
      setCanScrollForward(rail.scrollLeft + rail.clientWidth < rail.scrollWidth - 1);
    };
    updateControls();
    const observer = new ResizeObserver(updateControls);
    observer.observe(rail);
    rail.addEventListener("scroll", updateControls, { passive: true });
    return () => {
      observer.disconnect();
      rail.removeEventListener("scroll", updateControls);
    };
  }, [items.length]);

  const scroll = (direction: -1 | 1) => {
    const rail = railRef.current;
    if (!rail) return;
    const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
    rail.scrollBy({ left: direction * rail.clientWidth, behavior });
  };

  return (
    <>
      {canScroll && <div className="carousel-toolbar">
        <span className="carousel-count">{items.length} resources</span>
        <div className="carousel-controls">
          <button type="button" onClick={() => scroll(-1)} disabled={!canScrollBack} aria-label="Scroll to previous resources"><Icon name="chevron-left" size={18} /></button>
          <button type="button" onClick={() => scroll(1)} disabled={!canScrollForward} aria-label="Scroll to more resources"><Icon name="chevron-right" size={18} /></button>
        </div>
      </div>}
      <div className="resource-grid resource-rail" ref={railRef}>
        {items.map((resource) => <ResourceCard key={resource.id} resource={resource} saved={savedIds.includes(resource.id)} onToggle={() => toggleSaved(resource.id)} />)}
      </div>
    </>
  );
}

export default function Home() {
  const [section, setSection] = useState<string>("Saved");
  const [savedIds, setSavedIds] = useState<string[]>(starterSaved);
  const [query, setQuery] = useState("");
  const [asked, setAsked] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const chatDialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = chatDialogRef.current;
    if (chatOpen && dialog && !dialog.open) {
      dialog.showModal();
      dialog.querySelector<HTMLInputElement>("input")?.focus();
    }
  }, [chatOpen]);

  useEffect(() => {
    const stored = window.localStorage.getItem("freddybuddy-saved");
    if (stored) {
      try { setSavedIds(JSON.parse(stored) as string[]); } catch { window.localStorage.removeItem("freddybuddy-saved"); }
    }
  }, []);

  const toggleSaved = (id: string) => setSavedIds((current) => {
    const next = current.includes(id) ? current.filter((savedId) => savedId !== id) : [...current, id];
    window.localStorage.setItem("freddybuddy-saved", JSON.stringify(next));
    return next;
  });

  const shownResources = useMemo(() => {
    if (section === "Saved") return resources.filter((resource) => savedIds.includes(resource.id));
    if (categories.includes(section as Category)) return resources.filter((resource) => resource.category === section);
    if (asked && query.trim()) {
      const words = query.toLowerCase().split(/\s+/).filter((word) => word.length > 2);
      const matches = resources.filter((resource) => words.some((word) => `${resource.name} ${resource.description} ${resource.category} ${resource.keywords}`.toLowerCase().includes(word)));
      return matches.length ? matches : resources.filter((resource) => resource.category === "First Week");
    }
    return resources;
  }, [asked, query, savedIds, section]);

  const grouped = section === "Saved";
  const renderSubcategories = (category: Category, items: Resource[], inSaved = false) => (
    <div className={`saved-groups${inSaved ? " saved-subgroups" : ""}`}>
      {subcategories[category].map((subcategory) => {
        const subcategoryItems = items.filter((resource) => resource.subcategory === subcategory);
        if (!subcategoryItems.length) return null;
        return (
          <section className="resource-section subcategory-section" key={subcategory}>
            <h3>{subcategory}</h3>
            <ResourceCarousel items={subcategoryItems} savedIds={savedIds} toggleSaved={toggleSaved} />
          </section>
        );
      })}
    </div>
  );
  const submitQuestion = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!query.trim()) return;
    setSection("Ask");
    setAsked(true);
    setMobileNavOpen(false);
    setChatOpen(false);
  };

  const closeChat = () => {
    chatDialogRef.current?.close();
    setChatOpen(false);
  };

  const selectSection = (next: string) => {
    setSection(next); setAsked(false); setQuery(""); setMobileNavOpen(false);
  };

  const title = section === "Ask" ? "A good place to start" : section === "Saved" ? "Saved resources" : section;
  const subtitle = section === "Ask" ? `Resources related to “${query.trim()}”` : section === "Saved" ? "The local services you’ve kept close." : `Helpful local services for ${section.toLowerCase()}.`;

  return (
    <div className="app-shell">
      <header className="mobile-header">
        <button className="menu-button" onClick={() => setMobileNavOpen(!mobileNavOpen)} aria-label={mobileNavOpen ? "Close navigation" : "Open navigation"}><Icon name={mobileNavOpen ? "close" : "menu"} /></button>
        <button className="brand mobile-brand" onClick={() => selectSection("Saved")}><span className="brand-mark">F</span><span className="brand-copy"><strong>FreddyBuddy</strong><small>Fredericton</small></span></button>
      </header>
      <aside className={`sidebar${mobileNavOpen ? " sidebar-open" : ""}`}>
        <button className="brand desktop-brand" onClick={() => selectSection("Saved")}><span className="brand-mark">F</span><span className="brand-copy"><strong>FreddyBuddy</strong><small>Fredericton</small></span></button>
        <nav className="primary-nav" aria-label="Main navigation">
          <button className={`nav-item${section === "Saved" ? " active" : ""}`} onClick={() => selectSection("Saved")}><Icon name="bookmark" /><span>Saved</span></button>
          <span className="nav-divider" />
          {categories.map((category) => <button key={category} className={`nav-item${section === category ? " active" : ""}`} onClick={() => selectSection(category)}><Icon name={categoryIcons[category]} /><span>{category}</span></button>)}
        </nav>
        <div className="sidebar-footer"><span className="eyebrow">Need a hand?</span><a href="https://mcaf.nb.ca/">Contact settlement services <Icon name="arrow" size={13} /></a><span className="language-label">Language</span><span>English (Canada)</span></div>
      </aside>
      {mobileNavOpen && <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setMobileNavOpen(false)} />}

      <main className="main-content">
        <div className="content-inner">
          <header className="page-header"><div><p className="location-label">Fredericton, New Brunswick</p><h1>{title}</h1><p className="page-subtitle">{subtitle}</p></div></header>
          {grouped ? <div className="saved-groups">
            {categories.map((category) => {
              const items = shownResources.filter((resource) => resource.category === category);
              if (!items.length) return null;
              return <section className="resource-section" key={category}><h2>{category}</h2>{renderSubcategories(category, items, true)}</section>;
            })}
            {!shownResources.length && <div className="empty-state"><h2>No saved resources yet</h2><p>Browse a category and select the heart on a resource to keep it here.</p><button className="text-action" onClick={() => selectSection("First Week")}>Browse First Week <span>→</span></button></div>}
          </div> : categories.includes(section as Category) ? renderSubcategories(section as Category, shownResources) : shownResources.length ? <ResourceCarousel items={shownResources} savedIds={savedIds} toggleSaved={toggleSaved} /> : <p className="empty-note">No matching services found. Try a broader question.</p>}
        </div>
        <button
          className={`chat-launcher${chatOpen ? " is-open" : ""}`}
          type="button"
          aria-label={chatOpen ? "Close FreddyBuddy help" : "Ask FreddyBuddy a question"}
          aria-haspopup="dialog"
          aria-expanded={chatOpen}
          aria-controls="help-dialog"
          onClick={() => setChatOpen(true)}
        >
          <Icon name={chatOpen ? "close" : "chat"} size={23} />
        </button>
        <dialog
          id="help-dialog"
          ref={chatDialogRef}
          className="chat-dialog"
          aria-labelledby="chat-title"
          onClose={() => setChatOpen(false)}
          onClick={(event) => {
            if (event.target === event.currentTarget) closeChat();
          }}
        >
          <div className="chat-panel">
            <header className="chat-header">
              <span className="chat-avatar"><Icon name="chat" size={19} /></span>
              <div className="chat-heading-copy">
                <h2 id="chat-title">Ask FreddyBuddy</h2>
                <p>Local services, easier to find.</p>
              </div>
              <button className="chat-close" type="button" onClick={closeChat} aria-label="Close chat">
                <Icon name="close" size={19} />
              </button>
            </header>
            <div className="chat-content">
              <p className="chat-welcome">What are you looking for?</p>
              <p className="chat-examples">Try “bus routes”, “groceries”, or “health card”.</p>
              <form className="chat-form" onSubmit={submitQuestion}>
                <label htmlFor="chat-question">Your question</label>
                <div className="chat-input-row">
                  <input
                    id="chat-question"
                    aria-label="Ask a question"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="e.g. getting around by bus"
                  />
                  <button className="chat-submit" type="submit" aria-label="Find resources">
                    <Icon name="arrow" size={18} />
                  </button>
                </div>
                <p className="chat-footnote">We’ll show local resources related to your question.</p>
              </form>
            </div>
          </div>
        </dialog>
      </main>
    </div>
  );
}
