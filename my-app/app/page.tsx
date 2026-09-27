"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

import type { Category as CategorySlug, Resource, ResourcesResponse, Source } from "@/lib/resources";

type Category = "First Week" | "Daily Life" | "Transport" | "Social" | "Health";

const categories: Category[] = ["First Week", "Daily Life", "Transport", "Social", "Health"];
const categorySlugs: Record<Category, CategorySlug> = {
  "First Week": "first-week", "Daily Life": "daily-life", Transport: "transport", Social: "social", Health: "health-insurance",
};
const categoryOf = (resource: Resource) => categories.find((category) => categorySlugs[category] === resource.category);

// Subcategory slugs from the database, in the order each category shows them.
// Any slug not listed here still appears, after these; "other" always goes last.
const subcategoryOrder: Record<Category, string[]> = {
  "First Week": ["phone-plans", "internet", "banking", "paperwork", "settlement"],
  "Daily Life": ["food", "grocery", "self-care"],
  Transport: ["fredericton-public-transit", "taxis-and-cabs", "ride-apps"],
  Social: ["clubs", "interests", "nightlife", "workshops-and-activities"],
  Health: ["coverage-plans", "hospitals", "pharmacies"],
};
const subcategoryLabels: Record<string, string> = {
  "phone-plans": "Phone plans", "self-care": "Self care", grocery: "Groceries",
  "fredericton-public-transit": "Fredericton public transit", "taxis-and-cabs": "Taxis & cabs", "ride-apps": "Ride apps",
  "workshops-and-activities": "Workshops & activities", "coverage-plans": "Coverage plans",
};
const subcategoryLabel = (slug: string) => {
  if (subcategoryLabels[slug]) return subcategoryLabels[slug];
  const words = slug.replace(/-/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
};
const subcategoriesFor = (category: Category, items: Resource[]) => {
  const present = [...new Set(items.map((resource) => resource.subcategory || "other"))];
  const rank = (slug: string) => slug === "other" ? Infinity : subcategoryOrder[category].indexOf(slug) === -1 ? subcategoryOrder[category].length : subcategoryOrder[category].indexOf(slug);
  return present.sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
};

async function fetchResources(url: string): Promise<ResourcesResponse> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return response.json() as Promise<ResourcesResponse>;
}

function Icon({ name, size = 18 }: { name: "heart" | "bookmark" | "home" | "bag" | "bus" | "people" | "health" | "arrow" | "chevron-left" | "chevron-right" | "search" | "menu" | "close"; size?: number }) {
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
  };
  return <svg {...common}>{paths[name]}</svg>;
}

const categoryIcons: Record<Category, "home" | "bag" | "bus" | "people" | "health"> = {
  "First Week": "home", "Daily Life": "bag", Transport: "bus", Social: "people", Health: "health",
};

function ResourceCard({ resource, saved, onToggle }: { resource: Resource; saved: boolean; onToggle: () => void }) {
  return (
    <article className="resource-card">
      <div className="card-title-row">
        <h3>{resource.name}</h3>
        <button className={`save-button${saved ? " is-saved" : ""}`} onClick={onToggle} aria-label={saved ? `Remove ${resource.name} from saved resources` : `Save ${resource.name}`} aria-pressed={saved}>
          <Icon name="heart" size={19} />
        </button>
      </div>
      <p className="card-description">{resource.description}</p>
      <div className="card-details">
        {resource.subcategory && <p>{subcategoryLabel(resource.subcategory)}</p>}
        <p>{resource.address}</p>
        <p>{resource.hours}</p>
        {resource.good_to_know && <p>{resource.good_to_know}</p>}
        {resource.last_verified && <p>Last verified {resource.last_verified}</p>}
      </div>
      <a className="website-link" href={resource.link} target="_blank" rel="noreferrer">Visit website <Icon name="arrow" size={14} /></a>
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
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [asked, setAsked] = useState(false);
  const [resources, setResources] = useState<Resource[]>([]);
  const [searchResults, setSearchResults] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [source, setSource] = useState<Source>("snowflake");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem("freddybuddy-saved");
    if (stored) {
      try { setSavedIds(JSON.parse(stored) as string[]); } catch { window.localStorage.removeItem("freddybuddy-saved"); }
    }
  }, []);

  // One request loads every resource; the saved and category views filter it.
  useEffect(() => {
    fetchResources("/api/resources")
      .then((data) => { setResources(data.resources); setSource(data.source); })
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  }, []);

  const toggleSaved = (id: string) => setSavedIds((current) => {
    const next = current.includes(id) ? current.filter((savedId) => savedId !== id) : [...current, id];
    window.localStorage.setItem("freddybuddy-saved", JSON.stringify(next));
    return next;
  });

  const shownResources = useMemo(() => {
    if (section === "Saved") return resources.filter((resource) => savedIds.includes(resource.id));
    if (categories.includes(section as Category)) return resources.filter((resource) => categoryOf(resource) === section);
    if (asked) return searchResults;
    return resources;
  }, [asked, resources, savedIds, searchResults, section]);

  const grouped = section === "Saved";
  const renderSubcategories = (category: Category, items: Resource[], inSaved = false) => (
    <div className={`saved-groups${inSaved ? " saved-subgroups" : ""}`}>
      {subcategoriesFor(category, items).map((subcategory) => {
        const subcategoryItems = items.filter((resource) => (resource.subcategory || "other") === subcategory);
        return (
          <section className="resource-section subcategory-section" key={subcategory}>
            <h3>{subcategoryLabel(subcategory)}</h3>
            <ResourceCarousel items={subcategoryItems} savedIds={savedIds} toggleSaved={toggleSaved} />
          </section>
        );
      })}
    </div>
  );
  const submitQuestion = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const question = query.trim();
    if (!question) return;
    setSection("Ask");
    setAsked(true);
    setMobileNavOpen(false);
    setSearching(true);
    setSearchResults([]);
    fetchResources(`/api/search?q=${encodeURIComponent(question)}`)
      .then((data) => { setSearchResults(data.resources); setSource(data.source); })
      .catch(() => setLoadError(true))
      .finally(() => setSearching(false));
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
        <button className="brand mobile-brand" onClick={() => selectSection("Saved")}><span className="brand-copy"><strong>FreddyBuddy</strong></span></button>
      </header>
      <aside className={`sidebar${mobileNavOpen ? " sidebar-open" : ""}`}>
        <button className="brand desktop-brand" onClick={() => selectSection("Saved")}><span className="brand-copy"><strong>FreddyBuddy</strong></span></button>
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
          <header className="page-header">
            <div className="page-heading"><h1>{title}</h1><p className="page-subtitle">{subtitle}</p></div>
            <form className="global-search" role="search" onSubmit={submitQuestion}>
              <Icon name="search" size={19} />
              <label className="visually-hidden" htmlFor="resource-search">Search local resources</label>
              <input id="resource-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search buses, groceries, Medicare..." />
              <button type="submit">Search</button>
            </form>
          </header>
          {source === "fallback" && <p className="empty-note">Running in offline mode — showing our saved copy of these resources.</p>}
          {loadError ? <p className="empty-note">We couldn’t load resources. Check your connection and try again.</p>
          : loading || searching ? <p className="empty-note">{searching ? "Searching…" : "Loading resources…"}</p>
          : <>
  {grouped ? <div className="saved-groups">
            {categories.map((category) => {
              const items = shownResources.filter((resource) => categoryOf(resource) === category);
              if (!items.length) return null;
              return <section className="resource-section" key={category}><h2>{category}</h2>{renderSubcategories(category, items, true)}</section>;
            })}
            {!shownResources.length && <div className="empty-state"><h2>No saved resources yet</h2><p>Browse a category and select the heart on a resource to keep it here.</p><button className="text-action" onClick={() => selectSection("First Week")}>Browse First Week <span>→</span></button></div>}
          </div> : categories.includes(section as Category) ? renderSubcategories(section as Category, shownResources) : shownResources.length ? <ResourceCarousel items={shownResources} savedIds={savedIds} toggleSaved={toggleSaved} /> : <p className="empty-note">We don’t cover that yet — try browsing a category.</p>}
          </>}
        </div>
      </main>
    </div>
  );
}
