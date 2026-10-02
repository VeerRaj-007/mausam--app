'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Activity, AirVent, Bell, CarFront, ChevronRight, CloudRain,
  Droplets, Factory, HeartPulse, Home as HomeIcon, Info, Leaf,
  Clock, Menu, Moon, Mountain, Package, Plane, Plus, Settings, Ship,
  Sparkles, Sun, Sunrise, Thermometer, Umbrella, Users, Wind, X,
} from 'lucide-react';
import {
  City, ForecastDay, getAqi, getAgricultureData, getCurrentWeather,
  getFamilyData, getForecast, getHighwayAdvisory, getMarineData,
  getTravelWarning, getUvIndex, WeatherSnapshot,
} from '../lib/mockData';

type Persona =
  | 'Fitness' | 'Beach & Marine' | 'Travel' | 'Agriculture'
  | 'Commute' | 'Health' | 'Parents & Families' | 'Event Planners';
type Factor = 'Rain' | 'Temperature' | 'UV' | 'Wind' | 'Humidity' | 'Air Quality';
type TimePhase = 'dawn' | 'midday' | 'dusk' | 'night';
type ModalData = { title: string; reason: string; values: string[]; recommendation: string };

type PhasePalette = {
  c1: string; c2: string; c3: string;
  ambient1: string; ambient2: string; ambient3: string;
  glass: string; border: string; shadow: string; highlight: string;
  stars: number;
  textGlow: string;
};

const phasePalettes: Record<TimePhase, PhasePalette> = {
  dawn: {
    c1: '#a99591', c2: '#80737a', c3: '#564f5c',
    ambient1: 'rgba(220, 175, 150, .12)', ambient2: 'rgba(160, 135, 160, .08)', ambient3: 'rgba(120, 100, 130, .06)',
    glass: 'rgba(35, 35, 50, .28)', border: 'rgba(245, 232, 225, .25)', shadow: 'rgba(39, 26, 38, .28)', highlight: 'rgba(255, 235, 225, .12)',
    stars: 0, textGlow: 'rgba(30, 25, 32, .34)',
  },
  midday: {
    c1: '#6f96ad', c2: '#527b96', c3: '#385b77',
    ambient1: 'rgba(190, 220, 235, .14)', ambient2: 'rgba(100, 170, 200, .08)', ambient3: 'rgba(60, 120, 160, .06)',
    glass: 'rgba(18, 46, 67, .30)', border: 'rgba(220, 240, 248, .27)', shadow: 'rgba(12, 40, 63, .30)', highlight: 'rgba(225, 245, 255, .13)',
    stars: 0, textGlow: 'rgba(12, 35, 54, .34)',
  },
  dusk: {
    c1: '#9c7469', c2: '#70565c', c3: '#473d4e',
    ambient1: 'rgba(220, 150, 105, .13)', ambient2: 'rgba(160, 90, 100, .08)', ambient3: 'rgba(100, 65, 85, .06)',
    glass: 'rgba(47, 31, 39, .30)', border: 'rgba(250, 220, 205, .24)', shadow: 'rgba(52, 25, 30, .32)', highlight: 'rgba(255, 225, 205, .11)',
    stars: 0.08, textGlow: 'rgba(35, 22, 30, .38)',
  },
  night: {
    c1: '#303b5d', c2: '#202c4b', c3: '#10182c',
    ambient1: 'rgba(120, 145, 205, .16)', ambient2: 'rgba(75, 105, 170, .10)', ambient3: 'rgba(40, 65, 120, .07)',
    glass: 'rgba(9, 20, 40, .38)', border: 'rgba(185, 210, 245, .24)', shadow: 'rgba(4, 10, 25, .42)', highlight: 'rgba(210, 230, 255, .10)',
    stars: 1, textGlow: 'rgba(120, 150, 210, .32)',
  },
};

function lerpHex(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ar = (pa >> 16) & 0xff, ag = (pa >> 8) & 0xff, ab = pa & 0xff;
  const br = (pb >> 16) & 0xff, bg = (pb >> 8) & 0xff, bb = pb & 0xff;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return `#${((r << 16) | (g << 8) | bl).toString(16).padStart(6, '0')}`;
}

function lerpRgba(a: string, b: string, t: number): string {
  const pa = a.match(/[\d.]+/g)!.map(Number);
  const pb = b.match(/[\d.]+/g)!.map(Number);
  return `rgba(${Math.round(pa[0] + (pb[0] - pa[0]) * t)},${Math.round(pa[1] + (pb[1] - pa[1]) * t)},${Math.round(pa[2] + (pb[2] - pa[2]) * t)},${(pa[3] + (pb[3] - pa[3]) * t).toFixed(3)})`;
}

const phaseOrder: TimePhase[] = ['dawn', 'midday', 'dusk', 'night'];

function interpolatePalette(hour: number): PhasePalette {
  const phase = getPhase(hour);
  const idx = phaseOrder.indexOf(phase);
  const nextIdx = (idx + 1) % phaseOrder.length;
  const next = phaseOrder[nextIdx];
  const phaseStarts: Record<TimePhase, number> = { dawn: 5, midday: 11, dusk: 17, night: 20 };
  const start = phaseStarts[phase];
  let end = phaseStarts[next];
  if (end < start) end += 24;
  const t = Math.max(0, Math.min(1, (hour - start) / (end - start)));
  const easing = t * t * (3 - 2 * t);
  const a = phasePalettes[phase];
  const b = phasePalettes[next];
  return {
    c1: lerpHex(a.c1, b.c1, easing),
    c2: lerpHex(a.c2, b.c2, easing),
    c3: lerpHex(a.c3, b.c3, easing),
    ambient1: lerpRgba(a.ambient1, b.ambient1, easing),
    ambient2: lerpRgba(a.ambient2, b.ambient2, easing),
    ambient3: lerpRgba(a.ambient3, b.ambient3, easing),
    glass: lerpRgba(a.glass, b.glass, easing),
    border: lerpRgba(a.border, b.border, easing),
    shadow: lerpRgba(a.shadow, b.shadow, easing),
    highlight: lerpRgba(a.highlight, b.highlight, easing),
    stars: a.stars + (b.stars - a.stars) * easing,
    textGlow: lerpRgba(a.textGlow, b.textGlow, easing),
  };
}

function paletteForPhase(phase: TimePhase): PhasePalette {
  return phasePalettes[phase];
}

const personas: Persona[] = [
  'Fitness', 'Beach & Marine', 'Travel', 'Agriculture',
  'Commute', 'Health', 'Parents & Families', 'Event Planners',
];
const factors: Factor[] = ['Rain', 'Temperature', 'UV', 'Wind', 'Humidity', 'Air Quality'];
const personaMeta: Record<Persona, { icon: typeof Activity; color: string; soft: string }> = {
  Fitness: { icon: Activity, color: '#e85a2a', soft: 'rgba(232,90,42,.46)' },
  'Beach & Marine': { icon: Ship, color: '#159db4', soft: 'rgba(21,157,180,.48)' },
  Travel: { icon: Plane, color: '#7358a8', soft: 'rgba(115,88,168,.48)' },
  Agriculture: { icon: Leaf, color: '#587e55', soft: 'rgba(88,126,85,.48)' },
  Commute: { icon: CarFront, color: '#c88327', soft: 'rgba(200,131,39,.48)' },
  Health: { icon: HeartPulse, color: '#cf5d73', soft: 'rgba(207,93,115,.48)' },
  'Parents & Families': { icon: Users, color: '#b99432', soft: 'rgba(185,148,50,.48)' },
  'Event Planners': { icon: Sparkles, color: '#438fc1', soft: 'rgba(67,143,193,.48)' },
};
const cities: City[] = ['New Delhi', 'Mumbai', 'Jaipur', 'Bengaluru', 'Chennai'];

function getPhase(hour: number): TimePhase {
  if (hour >= 5 && hour < 11) return 'dawn';
  if (hour >= 11 && hour < 17) return 'midday';
  if (hour >= 17 && hour < 20) return 'dusk';
  return 'night';
}

function greeting(phase: TimePhase): string {
  if (phase === 'dawn') return 'Good morning,';
  if (phase === 'midday') return 'Good afternoon,';
  if (phase === 'dusk') return 'Good evening,';
  return 'Good night,';
}

function scorePersona(
  persona: Persona, weather: WeatherSnapshot,
  selected: Persona[], behavior: Record<string, number>,
): number {
  const preference = selected.includes(persona) ? 1 : 0.3;
  let relevance = 0.55;
  if (persona === 'Fitness') relevance = weather.rainProbability < 45 && weather.temperature < 33 ? 0.95 : 0.4;
  if (persona === 'Beach & Marine') relevance = weather.temperature > 28 ? 0.92 : 0.55;
  if (persona === 'Travel') relevance = weather.rainProbability < 55 ? 0.85 : 0.45;
  if (persona === 'Agriculture') relevance = weather.rainProbability > 45 ? 0.92 : 0.5;
  if (persona === 'Commute') relevance = weather.visibility > 7 && weather.rainProbability < 55 ? 0.9 : 0.48;
  if (persona === 'Health') relevance = weather.aqi < 80 ? 0.88 : 0.45;
  if (persona === 'Parents & Families') relevance = weather.rainProbability < 50 ? 0.82 : 0.48;
  if (persona === 'Event Planners') relevance = weather.rainProbability < 45 && weather.humidity < 70 ? 0.9 : 0.42;
  const counts = Object.values(behavior);
  const max = Math.max(...counts, 1);
  const normalized = behavior[persona] ? behavior[persona] / max : 0.5;
  return 0.35 * preference + 0.25 * 1 + 0.2 * relevance + 0.2 * normalized;
}

export default function Home() {
  const [onboarded, setOnboarded] = useState<boolean | null>(null);
  const [selectedPersonas, setSelectedPersonas] = useState<Persona[]>(['Fitness', 'Travel']);
  const [selectedFactors, setSelectedFactors] = useState<Factor[]>(['Rain', 'Temperature']);
  const [city, setCity] = useState<City>('New Delhi');
  const [selectedPersona, setSelectedPersona] = useState<Persona>('Fitness');
  const [behavior, setBehavior] = useState<Record<string, number>>({});
  const [phase, setPhase] = useState<TimePhase>(getPhase(new Date().getHours()));
  const [override, setOverride] = useState('auto');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [modal, setModal] = useState<ModalData | null>(null);
  const [activeTab, setActiveTab] = useState('Home');
  const [destinations, setDestinations] = useState<City[]>([]);
  const [setupMode, setSetupMode] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('mausam-preferences');
    const activity = localStorage.getItem('mausam-behavior');
    const savedDestinations = localStorage.getItem('mausam-destinations');
    if (saved) {
      const data = JSON.parse(saved);
      setSelectedPersonas(data.personas);
      setSelectedFactors(data.factors);
      setCity(data.city);
      setOnboarded(true);
    } else {
      setOnboarded(false);
    }
    if (activity) setBehavior(JSON.parse(activity));
    if (savedDestinations) setDestinations(JSON.parse(savedDestinations));
  }, []);

  useEffect(() => {
    if (onboarded) {
      localStorage.setItem('mausam-preferences', JSON.stringify({
        personas: selectedPersonas, factors: selectedFactors, city,
      }));
    }
  }, [onboarded, selectedPersonas, selectedFactors, city]);

  useEffect(() => { localStorage.setItem('mausam-behavior', JSON.stringify(behavior)); }, [behavior]);
  useEffect(() => { localStorage.setItem('mausam-destinations', JSON.stringify(destinations)); }, [destinations]);

  const weather = getCurrentWeather(city);
  const forecast = getForecast(city);
  const activePhase = override === 'auto' ? phase : (override as TimePhase);
  const palette = override === 'auto'
    ? interpolatePalette(new Date().getHours())
    : paletteForPhase(activePhase);

  useEffect(() => {
    if (override !== 'auto') return;
    const interval = setInterval(() => {
      setPhase(getPhase(new Date().getHours()));
    }, 60000);
    return () => clearInterval(interval);
  }, [override]);

  useEffect(() => {
    document.documentElement.style.setProperty('--bg-c1', palette.c1);
    document.documentElement.style.setProperty('--bg-c2', palette.c2);
    document.documentElement.style.setProperty('--bg-c3', palette.c3);
    document.documentElement.style.setProperty('--ambient-1', palette.ambient1);
    document.documentElement.style.setProperty('--ambient-2', palette.ambient2);
    document.documentElement.style.setProperty('--ambient-3', palette.ambient3);
    document.documentElement.style.setProperty('--glass-fill', palette.glass);
    document.documentElement.style.setProperty('--glass-border', palette.border);
    document.documentElement.style.setProperty('--glass-shadow', palette.shadow);
    document.documentElement.style.setProperty('--glass-highlight', palette.highlight);
    document.documentElement.style.setProperty('--star-opacity', String(palette.stars));
    document.documentElement.style.setProperty('--text-glow', palette.textGlow);
  }, [palette]);
  const orderedPersonas = useMemo(
    () => [...personas].sort((a, b) =>
      scorePersona(b, weather, selectedPersonas, behavior) - scorePersona(a, weather, selectedPersonas, behavior)),
    [weather, selectedPersonas, behavior],
  );

  const setPersona = (persona: Persona) => {
    setSelectedPersona(persona);
    setBehavior((current) => ({ ...current, [persona]: (current[persona] || 0) + 1 }));
  };

  const saveSetup = () => {
    if (!selectedPersonas.length) setSelectedPersonas(['Fitness', 'Travel']);
    setOnboarded(true);
    setSetupMode(false);
  };

  if (onboarded === null) return null;

  if (!onboarded || setupMode) {
    return (
      <Onboarding
        city={city}
        setCity={setCity}
        selectedPersonas={selectedPersonas}
        setSelectedPersonas={setSelectedPersonas}
        selectedFactors={selectedFactors}
        setSelectedFactors={setSelectedFactors}
        onContinue={saveSetup}
        skip={() => {
          setSelectedPersonas(['Fitness', 'Travel']);
          setCity('New Delhi');
          setOnboarded(true);
          setSetupMode(false);
        }}
      />
    );
  }

  return (
    <main className="mausam-shell">
      <div className="mausam-stars" />
      <div className="relative z-10 min-h-screen px-4 pb-32 pt-5 sm:px-6">
        <div className="content-width">
          <header className="mb-5 flex items-start justify-between">
            <div>
              <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[.22em] text-white/70">
                <span className="h-2 w-2 rounded-full bg-white shadow-[0_0_14px_white]" /> IMD · MAUSAM
              </div>
              <p className="font-display text-xl font-bold">{greeting(activePhase)}</p>
            </div>
            <div className="flex items-center gap-2">
              <label className="glass flex items-center gap-1.5 rounded-full px-3 py-2 text-[10px] font-semibold text-white/80">
                <Clock size={13} className="shrink-0 opacity-70" />
                <select value={override} onChange={(e) => setOverride(e.target.value)} className="bg-transparent text-white outline-none">
                  <option value="auto" className="text-slate-800">Auto</option>
                  <option value="dawn" className="text-slate-800">Dawn</option>
                  <option value="midday" className="text-slate-800">Midday</option>
                  <option value="dusk" className="text-slate-800">Dusk</option>
                  <option value="night" className="text-slate-800">Night</option>
                </select>
              </label>
              <button aria-label="Open settings" onClick={() => setDrawerOpen(true)} className="glass relative z-10 rounded-full p-3 transition hover:scale-105">
                <Menu size={19} />
              </button>
            </div>
          </header>

          {activeTab === 'Home' && (
            <>
              <Hero weather={weather} phase={activePhase} />
              <Forecast forecast={forecast} />
              <PersonaRow ordered={orderedPersonas} selected={selectedPersona} favorites={selectedPersonas} onSelect={setPersona} />
              <section className="animate-rise" key={selectedPersona}>
                <PersonaView
                  persona={selectedPersona}
                  weather={weather}
                  forecast={forecast}
                  destinations={destinations}
                  setDestinations={setDestinations}
                  setModal={setModal}
                />
              </section>
            </>
          )}
          {activeTab === 'Forecast' && <ForecastPage forecast={forecast} city={city} />}
          {activeTab === 'Alerts' && <AlertsPage city={city} weather={weather} />}
          {activeTab === 'Settings' && <SettingsPage city={city} setCity={setCity} onEdit={() => setSetupMode(true)} />}
        </div>
      </div>
      <BottomNav active={activeTab} setActive={setActiveTab} />
      {drawerOpen && (
        <Drawer city={city} setCity={setCity} close={() => setDrawerOpen(false)} onEdit={() => { setDrawerOpen(false); setSetupMode(true); }} />
      )}
      {modal && <WhyModal modal={modal} close={() => setModal(null)} />}
    </main>
  );
}

/* ---------- Onboarding ---------- */

function Onboarding({
  city, setCity, selectedPersonas, setSelectedPersonas,
  selectedFactors, setSelectedFactors, onContinue, skip,
}: {
  city: City;
  setCity: (city: City) => void;
  selectedPersonas: Persona[];
  setSelectedPersonas: (value: Persona[]) => void;
  selectedFactors: Factor[];
  setSelectedFactors: (value: Factor[]) => void;
  onContinue: () => void;
  skip: () => void;
}) {
  const toggle = <T,>(value: T, values: T[], setValues: (next: T[]) => void) =>
    setValues(values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);

  return (
    <main className="mausam-shell min-h-screen px-5 py-8">
      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] max-w-xl flex-col justify-center">
        <div className="mb-10">
          <div className="mb-5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[.22em] text-white/70">
            <span className="h-2 w-2 rounded-full bg-white shadow-[0_0_14px_white]" /> IMD · MAUSAM
          </div>
          <p className="mb-3 text-sm font-medium text-white/75">Personal weather, made clear.</p>
          <h1 className="font-display text-4xl font-bold leading-tight text-shadow sm:text-5xl">
            Welcome to<br />Personalized Mausam
          </h1>
          <p className="mt-5 max-w-sm text-base leading-7 text-white/80">
            A clear view of your day, shaped around what matters to you.
          </p>
        </div>
        <div className="glass relative rounded-[28px] p-5 sm:p-7">
          <Picker title="I want weather for" items={personas} values={selectedPersonas} onToggle={(item) => toggle(item, selectedPersonas, setSelectedPersonas)} />
          <Picker title="What matters most to you?" items={factors} values={selectedFactors} onToggle={(item) => toggle(item, selectedFactors, setSelectedFactors)} />
          <label className="mb-6 block text-sm font-semibold">
            Your usual city
            <select value={city} onChange={(e) => setCity(e.target.value as City)} className="mt-3 w-full rounded-2xl border border-white/35 bg-white/15 px-4 py-3 text-white outline-none backdrop-blur-xl">
              {cities.map((item) => <option key={item} className="text-slate-800">{item}</option>)}
            </select>
          </label>
          <button onClick={onContinue} className="w-full rounded-2xl bg-white px-5 py-4 font-display text-sm font-bold text-slate-700 shadow-xl transition hover:-translate-y-0.5">
            Shape my Mausam <ChevronRight className="ml-2 inline" size={16} />
          </button>
          <button onClick={skip} className="mt-4 block w-full text-center text-sm font-medium text-white/70 hover:text-white">
            Skip for now
          </button>
        </div>
      </div>
    </main>
  );
}

function Picker<T extends string>({ title, items, values, onToggle }: {
  title: string; items: T[]; values: T[]; onToggle: (item: T) => void;
}) {
  return (
    <div className="mb-7">
      <p className="mb-3 text-sm font-semibold">{title}</p>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <button
            key={item}
            onClick={() => onToggle(item)}
            className={`rounded-full border px-3.5 py-2 text-xs font-semibold transition ${
              values.includes(item)
                ? 'border-white/70 bg-gradient-to-r from-white/50 to-white/20 text-white shadow-lg'
                : 'border-white/25 bg-white/10 text-white/75 hover:bg-white/20'
            }`}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------- Hero ---------- */

function Hero({ weather, phase }: { weather: WeatherSnapshot; phase: TimePhase }) {
  return (
    <section className="mb-6 flex items-end justify-between">
      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-[.2em] text-white/65">{weather.region}</p>
        <h1 className="font-display text-3xl font-bold">{weather.city}</h1>
        <div className="mt-3 flex items-center gap-3">
          <span className="font-display text-[72px] font-bold leading-none text-shadow">{weather.temperature}°</span>
          <div>
            <p className="font-display text-base font-bold">{weather.condition}</p>
            <p className="text-sm text-white/65">Feels like {weather.feelsLike}°</p>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <span className="glass rounded-full px-3 py-2 text-xs font-semibold">
            <Sunrise size={13} className="mr-1 inline" /> {weather.sunrise}
          </span>
          <span className="glass rounded-full px-3 py-2 text-xs font-semibold">
            <Sun size={13} className="mr-1 inline" /> {weather.sunset}
          </span>
        </div>
      </div>
      <div className="glass mb-16 hidden rounded-full p-4 sm:block">
        {phase === 'night' ? <Moon size={26} /> : <Sun size={26} />}
      </div>
    </section>
  );
}

/* ---------- 7-day Forecast ---------- */

function Forecast({ forecast }: { forecast: ForecastDay[] }) {
  return (
    <section className="glass relative mb-6 rounded-[24px] p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-sm font-bold">7-day forecast</h2>
        <span className="rounded-full bg-white/15 px-2 py-1 text-[10px] text-white/70">Swipe to explore</span>
      </div>
      <div className="scrollbar-hidden flex gap-2 overflow-x-auto pb-1">
        {forecast.map((day, index) => (
          <div key={day.day} className={`min-w-[64px] flex-1 rounded-2xl border p-3 text-center ${
            index === 0 ? 'border-white/60 bg-white/25' : 'border-white/20 bg-white/10'
          }`}>
            <p className="text-[11px] font-semibold text-white/75">{day.day}</p>
            <span className="my-2 block text-xl">{day.icon}</span>
            <p className="font-display text-sm font-bold">{day.high}°</p>
            <p className="text-[11px] text-white/60">{day.low}°</p>
            <p className="mt-2 text-[10px] font-semibold text-white/70">{day.rain}% rain</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------- Persona Row ---------- */

function PersonaRow({ ordered, selected, favorites, onSelect }: {
  ordered: Persona[]; selected: Persona; favorites: Persona[]; onSelect: (persona: Persona) => void;
}) {
  return (
    <div className="scrollbar-hidden mb-6 flex gap-2 overflow-x-auto pb-1">
      {ordered.map((persona) => {
        const meta = personaMeta[persona];
        const Icon = meta.icon;
        const isActive = selected === persona;
        return (
          <button
            key={persona}
            onClick={() => onSelect(persona)}
            className="flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-semibold transition hover:-translate-y-0.5"
            style={{
              borderColor: isActive ? meta.color : 'rgba(255,255,255,.32)',
              background: isActive
                ? `linear-gradient(100deg, ${meta.soft}, rgba(255,255,255,.15))`
                : 'rgba(255,255,255,.12)',
            }}
          >
            <Icon size={14} style={{ color: isActive ? meta.color : 'rgba(255,255,255,.8)' }} />
            {persona}
            {favorites.includes(persona) && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
          </button>
        );
      })}
    </div>
  );
}

/* ---------- Shared card primitives ---------- */

function Card({ title, icon: Icon, children, persona, onInfo }: {
  title: string; icon: typeof Activity; children: React.ReactNode; persona: Persona; onInfo: () => void;
}) {
  const meta = personaMeta[persona];
  return (
    <article className="glass relative mb-4 overflow-hidden rounded-[24px] p-5">
      <div className="relative z-10">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="rounded-xl p-2.5" style={{ color: meta.color, background: meta.soft }}>
              <Icon size={18} />
            </span>
            <h3 className="font-display text-sm font-bold">{title}</h3>
          </div>
          <button aria-label={`Why am I seeing ${title}`} onClick={onInfo} className="rounded-full p-1.5 text-white/55 transition hover:bg-white/20 hover:text-white">
            <Info size={16} />
          </button>
        </div>
        {children}
      </div>
    </article>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="font-display text-3xl font-bold">{value}</p>
      <p className="mt-1 text-xs text-white/65">{label}</p>
    </div>
  );
}

function Badge({ children, tone = 'light' }: { children: React.ReactNode; tone?: 'light' | 'good' | 'warn' | 'bad' }) {
  const styles: Record<string, string> = {
    light: 'bg-white/15 text-white/80',
    good: 'bg-emerald-300/30 text-emerald-50',
    warn: 'bg-amber-200/35 text-amber-50',
    bad: 'bg-rose-300/35 text-rose-50',
  };
  return <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${styles[tone]}`}>{children}</span>;
}

function InfoRow({ label, value, icon: Icon }: { label: string; value: string; icon: typeof Wind }) {
  return (
    <div className="flex items-center justify-between border-b border-white/15 py-3 last:border-0">
      <span className="flex items-center gap-2 text-sm text-white/70"><Icon size={15} />{label}</span>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  );
}

function Gauge({ value, label, max = 12 }: { value: number; label: string; max?: number }) {
  const percent = Math.min(100, (value / max) * 100);
  return (
    <div className="flex items-center gap-4">
      <div className="relative grid h-20 w-20 place-items-center rounded-full" style={{ background: `conic-gradient(#fff ${percent}%, rgba(255,255,255,.16) 0)` }}>
        <div className="grid h-14 w-14 place-items-center rounded-full bg-[#7fb8df]/80">
          <span className="font-display text-xl font-bold">{value}</span>
        </div>
      </div>
      <span className="text-sm text-white/70">{label}</span>
    </div>
  );
}

/* ---------- Persona view dispatcher ---------- */

function PersonaView({ persona, weather, forecast, destinations, setDestinations, setModal }: {
  persona: Persona;
  weather: WeatherSnapshot;
  forecast: ForecastDay[];
  destinations: City[];
  setDestinations: (value: City[]) => void;
  setModal: (data: ModalData) => void;
}) {
  const info = (data: ModalData) => () => setModal(data);
  const travel = getTravelWarning(weather.city);
  const aqi = getAqi(weather.city);
  const uv = getUvIndex(weather.city);
  const agri = getAgricultureData(weather.city);
  const commute = getHighwayAdvisory(weather.city);
  const family = getFamilyData(weather.city);
  const marine = getMarineData(weather.city);
  const score = Math.round(Math.max(38, Math.min(96, 100 - weather.rainProbability * 0.35 - Math.abs(weather.temperature - 23) * 1.3 - weather.humidity * 0.08 - weather.wind * 0.3)));
  const comfort = Math.max(1, Math.min(10, Math.round(10 - Math.abs(weather.temperature - 24) * 0.18 - Math.abs(weather.humidity - 50) * 0.04 - weather.wind * 0.025)));

  const common = (title: string, icon: typeof Activity, children: React.ReactNode, values: string[], recommendation: string) => (
    <Card title={title} icon={icon} persona={persona} onInfo={info({ title, reason: `You selected ${persona}`, values, recommendation })}>
      {children}
    </Card>
  );

  if (persona === 'Fitness') {
    return (
      <>
        <div className="grid gap-4 sm:grid-cols-2">
          {common('Best running hours', Activity,
            <>
              <p className="mb-4 text-sm leading-6 text-white/75">Cooler, calmer windows based on today's conditions.</p>
              <div className="flex gap-2">
                <Badge tone="good">6:30–8:00 am</Badge>
                <Badge>7:30–9:00 pm</Badge>
              </div>
            </>,
            [`Rain probability: ${weather.rainProbability}%`, `Wind speed: ${weather.wind} km/h`, `Feels like: ${weather.feelsLike}°`],
            'Aim for the morning window while the air is cooler.')}

          {common('Running score', Wind,
            <div className="flex items-center justify-between">
              <Stat value={`${score}`} label="out of 100" />
              <div className="text-right">
                <Badge tone={score > 72 ? 'good' : 'warn'}>{score > 72 ? 'Excellent conditions' : 'Moderate'}</Badge>
                <p className="mt-2 text-xs text-white/65">Wind {weather.wind} km/h</p>
              </div>
            </div>,
            [`Temperature: ${weather.temperature}°`, `Humidity: ${weather.humidity}%`, `UV index: ${weather.uv}`],
            'Choose a shaded route and keep the effort comfortable.')}
        </div>
        {weather.temperature > 33 && (
          <Card title="Heat alert" icon={Thermometer} persona={persona}
            onInfo={info({ title: 'Heat alert', reason: 'Weather conditions', values: [`Feels like: ${weather.feelsLike}°`, `Temperature: ${weather.temperature}°`], recommendation: 'Move intense exercise to the cooler morning window.' })}>
            <Badge tone="warn">Stay hydrated</Badge>
          </Card>
        )}
      </>
    );
  }

  if (persona === 'Beach & Marine') {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {common('Sea conditions', Ship,
          <>
            <p className="font-display text-xl font-bold">{marine.seaState}</p>
            <p className="mt-2 text-sm leading-6 text-white/70">{marine.advisory}</p>
          </>,
          [`Wind: ${weather.wind} km/h`, `Rain probability: ${weather.rainProbability}%`],
          'Stay close to shore if the wind picks up.')}

        {common('Coastal watch', Umbrella,
          <>
            <Badge tone={marine.warning === 'No active warning' ? 'good' : 'warn'}>{marine.warning}</Badge>
            <p className="mt-4 text-sm text-white/70">Follow local harbour and beach safety notices before heading out.</p>
          </>,
          [`Wind: ${weather.wind} km/h`, `Condition: ${weather.condition}`],
          'Check the local flag system at the beach.')}
      </div>
    );
  }

  if (persona === 'Travel') {
    return (
      <>
        <div className="grid gap-4 sm:grid-cols-2">
          {common('Weather warnings', Bell,
            <>
              <Badge tone={travel.severity === 'Orange' ? 'bad' : travel.severity === 'Yellow' ? 'warn' : 'good'}>
                {travel.severity === 'Clear' ? 'No active warning' : `${travel.severity} alert`}
              </Badge>
              <p className="mt-4 text-sm leading-6 text-white/70">{travel.description}</p>
            </>,
            [`Rain probability: ${weather.rainProbability}%`, `Condition: ${weather.condition}`],
            'Keep plans flexible around the evening weather window.')}

          {common('What to pack', Package,
            <p className="text-sm leading-7 text-white/75">{travel.packing}</p>,
            [`Temperature: ${weather.temperature}°`, `Rain probability: ${weather.rainProbability}%`],
            'Pack for the warmest part of the day and one changeable hour.')}
        </div>
        <Card title="Saved destinations" icon={Mountain} persona={persona}
          onInfo={info({ title: 'Saved destinations', reason: 'Based on your travel planning', values: [`Current city: ${weather.city}`, `Temperature: ${weather.temperature}°`], recommendation: 'Save cities you are comparing for an easy weather glance.' })}>
          <div className="flex gap-2">
            <button
              onClick={() => { if (!destinations.includes(weather.city)) setDestinations([...destinations, weather.city]); }}
              className="rounded-xl bg-white/20 px-3 py-2 text-xs font-bold transition hover:bg-white/30"
            >
              <Plus size={14} className="mr-1 inline" /> Save this destination
            </button>
          </div>
          <div className="mt-4 space-y-2">
            {destinations.length ? (
              destinations.map((item) => (
                <div key={item} className="flex items-center justify-between rounded-xl bg-white/10 px-3 py-2 text-xs">
                  <span>{item} · {getCurrentWeather(item).temperature}°</span>
                  <button aria-label={`Remove ${item}`} onClick={() => setDestinations(destinations.filter((d) => d !== item))}>
                    <X size={14} />
                  </button>
                </div>
              ))
            ) : (
              <p className="text-xs text-white/55">Your saved cities will appear here.</p>
            )}
          </div>
        </Card>
      </>
    );
  }

  if (persona === 'Agriculture') {
    return (
      <>
        <Card title="Agromet advisory" icon={Leaf} persona={persona}
          onInfo={info({ title: 'Agromet advisory', reason: 'Weather relevance for your region', values: [`Rain probability: ${weather.rainProbability}%`, `Temperature: ${weather.temperature}°`, `Humidity: ${weather.humidity}%`], recommendation: agri.advisory })}>
          <p className="text-sm leading-7 text-white/75">{agri.advisory}</p>
          <p className="mt-3 text-xs text-white/50">Issued for {weather.region} district</p>
        </Card>
        <div className="grid gap-4 sm:grid-cols-2">
          {common('Rainfall outlook', CloudRain,
            <>
              <Stat value={`${agri.rainfall} mm`} label="expected over the next 5 days" />
              <div className="mt-4 flex gap-2">
                {forecast.slice(0, 4).map((day) => (
                  <span key={day.day} className="rounded-xl bg-white/10 px-2 py-2 text-center text-[10px]">
                    <b className="block">{day.day}</b>{Math.round(day.rain / 4)}mm
                  </span>
                ))}
              </div>
            </>,
            [`Rain probability: ${weather.rainProbability}%`, `Condition: ${weather.condition}`],
            'Plan field work around the drier windows.')}

          {common('Crop watch', Factory,
            <div className="flex gap-2">
              <Badge tone={agri.heatAlert === 'No alert' ? 'good' : 'warn'}>Heat · {agri.heatAlert}</Badge>
              <Badge tone="good">Frost · {agri.frostAlert}</Badge>
            </div>,
            [`Temperature: ${weather.temperature}°`, `Rain probability: ${weather.rainProbability}%`],
            'Monitor young plants during the warmest hours.')}
        </div>
      </>
    );
  }

  if (persona === 'Commute') {
    return (
      <>
        <Card title={commute.route} icon={CarFront} persona={persona}
          onInfo={info({ title: commute.route, reason: 'Your commute outlook', values: [`Visibility: ${weather.visibility} km`, `Rain probability: ${weather.rainProbability}%`, `Wind: ${weather.wind} km/h`], recommendation: commute.description })}>
          <div className="flex items-center justify-between">
            <Badge tone={commute.status === 'Clear' ? 'good' : 'warn'}>{commute.status}</Badge>
            <Badge tone={commute.delayRisk === 'High' ? 'bad' : commute.delayRisk === 'Medium' ? 'warn' : 'good'}>{commute.delayRisk} delay risk</Badge>
          </div>
          <p className="mt-4 text-sm leading-6 text-white/70">{commute.description}</p>
        </Card>
        <div className="grid gap-4 sm:grid-cols-2">
          {common('Visibility', AirVent,
            <Stat value={`${weather.visibility} km`} label={weather.visibility < 7 ? 'Haze may slow you down' : 'Good visibility'} />,
            [`Visibility: ${weather.visibility} km`, `Condition: ${weather.condition}`],
            'Leave a little earlier if haze increases.')}

          {common('Nowcast', CloudRain,
            <p className="text-sm leading-7 text-white/75">{commute.nowcast}</p>,
            [`Rain probability: ${weather.rainProbability}%`, `Wind: ${weather.wind} km/h`],
            'Keep your route flexible for the next two hours.')}
        </div>
      </>
    );
  }

  if (persona === 'Health') {
    return (
      <>
        <div className="grid gap-4 sm:grid-cols-2">
          {common('Air quality', AirVent,
            <div className="flex items-end justify-between">
              <Stat value={`${aqi.aqi}`} label="AQI" />
              <Badge tone={aqi.status === 'Good' ? 'good' : aqi.status === 'Moderate' ? 'warn' : 'bad'}>{aqi.status}</Badge>
            </div>,
            [`AQI: ${aqi.aqi}`, `Visibility: ${weather.visibility} km`],
            aqi.status === 'Good' ? 'A comfortable day for outdoor plans.' : 'Choose quieter roads for a walk and keep windows closed near heavy traffic.')}

          {common('UV index', Sun,
            <Gauge value={uv.uv} label={uv.label} />,
            [`UV index: ${uv.uv}`, `Sunset: ${weather.sunset}`],
            'Use sun protection during the midday window.')}
        </div>
        {common('Humidity', Droplets,
          <Stat value={`${weather.humidity}%`} label="relative humidity" />,
          [`Humidity: ${weather.humidity}%`, `Feels like: ${weather.feelsLike}°`],
          'Sip water regularly and choose breathable layers.')}
      </>
    );
  }

  if (persona === 'Parents & Families') {
    return (
      <>
        <Card title="School commute" icon={Users} persona={persona}
          onInfo={info({ title: 'School commute', reason: 'Your family weather view', values: [`Rain probability: ${family.probability}%`, `Condition: ${weather.condition}`], recommendation: family.schoolText })}>
          <Badge tone={family.schoolStatus === 'Clear' ? 'good' : family.schoolStatus === 'Caution' ? 'warn' : 'bad'}>{family.schoolStatus}</Badge>
          <p className="mt-4 text-sm leading-6 text-white/70">{family.schoolText}</p>
        </Card>
        <div className="grid gap-4 sm:grid-cols-2">
          {common('Rain alert', CloudRain,
            <>
              <Stat value={`${family.probability}%`} label="rain probability" />
              <p className="mt-3 text-sm text-white/70">{family.alert}</p>
            </>,
            [`Rain probability: ${family.probability}%`, `Expected: ${weather.condition}`],
            'Keep a compact rain layer ready if plans continue into the evening.')}

          {common('Family outlook', HeartPulse,
            <>
              <Badge tone="good">Family friendly</Badge>
              <p className="mt-3 text-sm leading-6 text-white/70">The best outdoor window is before the late afternoon change.</p>
            </>,
            [`Temperature: ${weather.temperature}°`, `AQI: ${weather.aqi}`],
            'Plan outdoor time earlier while conditions are more comfortable.')}
        </div>
      </>
    );
  }

  // Event Planners
  return (
    <>
      <Card title="Extended outlook" icon={Sparkles} persona={persona}
        onInfo={info({ title: 'Extended outlook', reason: 'Your event planning view', values: [`Rain probability: ${weather.rainProbability}%`, `Temperature: ${weather.temperature}°`, `Humidity: ${weather.humidity}%`], recommendation: 'Keep a flexible backup plan for changing conditions.' })}>
        <div className="scrollbar-hidden flex gap-2 overflow-x-auto">
          {forecast.map((day) => (
            <div key={day.day} className="min-w-[70px] rounded-xl bg-white/10 p-3 text-center">
              <p className="text-[10px] text-white/70">{day.day}</p>
              <p className="my-2 text-lg">{day.icon}</p>
              <p className="text-sm font-bold">{day.high}°</p>
              <p className="text-[10px] text-white/60">{day.rain}% rain</p>
            </div>
          ))}
        </div>
      </Card>
      <div className="grid gap-4 sm:grid-cols-2">
        {common('Rain probability', CloudRain,
          <Stat value={`${weather.rainProbability}%`} label="chance today" />,
          [`Rain probability: ${weather.rainProbability}%`, `Condition: ${weather.condition}`],
          'Keep a covered option ready for the peak hours.')}

        {common('Comfort index', Sparkles,
          <Gauge value={comfort} label="out of 10" max={10} />,
          [`Temperature: ${weather.temperature}°`, `Humidity: ${weather.humidity}%`, `Wind: ${weather.wind} km/h`],
          'A shaded, ventilated setup will feel best for guests.')}
      </div>
    </>
  );
}

/* ---------- Other pages ---------- */

function ForecastPage({ forecast, city }: { forecast: ForecastDay[]; city: City }) {
  return (
    <section>
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[.2em] text-white/60">{city}</p>
        <h1 className="font-display text-3xl font-bold">Extended forecast</h1>
      </div>
      <div className="space-y-3">
        {forecast.map((day) => (
          <div key={day.day} className="glass relative flex items-center justify-between rounded-2xl p-4">
            <div className="flex items-center gap-4">
              <span className="text-2xl">{day.icon}</span>
              <div>
                <p className="font-display text-sm font-bold">{day.day}</p>
                <p className="text-xs text-white/60">{day.rain}% chance of rain</p>
              </div>
            </div>
            <p className="font-display text-lg font-bold">
              {day.high}° <span className="text-sm text-white/55">/ {day.low}°</span>
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function AlertsPage({ city, weather }: { city: City; weather: WeatherSnapshot }) {
  const alert = getTravelWarning(city);
  return (
    <section>
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[.2em] text-white/60">{city}</p>
        <h1 className="font-display text-3xl font-bold">Weather alerts</h1>
      </div>
      <div className="glass relative rounded-[24px] p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-amber-300/30 p-2.5 text-amber-50"><Bell size={18} /></span>
            <h2 className="font-display text-sm font-bold">Today's advisory</h2>
          </div>
          <Badge tone={alert.severity === 'Orange' ? 'bad' : alert.severity === 'Yellow' ? 'warn' : 'good'}>{alert.severity}</Badge>
        </div>
        <p className="text-sm leading-7 text-white/75">{alert.description}</p>
        <div className="mt-5 border-t border-white/15 pt-4">
          <InfoRow label="Current condition" value={weather.condition} icon={Sun} />
          <InfoRow label="Rain probability" value={`${weather.rainProbability}%`} icon={CloudRain} />
        </div>
      </div>
    </section>
  );
}

function SettingsPage({ city, setCity, onEdit }: { city: City; setCity: (city: City) => void; onEdit: () => void }) {
  return (
    <section>
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[.2em] text-white/60">Personalize</p>
        <h1 className="font-display text-3xl font-bold">Settings</h1>
      </div>
      <div className="glass relative rounded-[24px] p-5">
        <label className="block text-sm font-semibold">
          Home city
          <select value={city} onChange={(e) => setCity(e.target.value as City)} className="mt-3 w-full rounded-2xl border border-white/30 bg-white/15 px-4 py-3 text-white outline-none">
            {cities.map((item) => <option key={item} className="text-slate-800">{item}</option>)}
          </select>
        </label>
        <button onClick={onEdit} className="mt-5 flex w-full items-center justify-between rounded-2xl bg-white/15 p-4 text-left text-sm font-semibold transition hover:bg-white/25">
          Update your weather interests <ChevronRight size={17} />
        </button>
      </div>
    </section>
  );
}

/* ---------- Drawer & Nav & Modal ---------- */

function Drawer({ city, setCity, close, onEdit }: { city: City; setCity: (city: City) => void; close: () => void; onEdit: () => void }) {
  return (
    <div className="fixed inset-0 z-50">
      <button aria-label="Close settings" onClick={close} className="absolute inset-0 h-full w-full bg-slate-950/55" />
      <aside className="glass absolute right-0 top-0 h-full w-[min(88vw,360px)] overflow-y-auto rounded-l-[28px] border-r-0 p-6 shadow-2xl">
        <div className="relative z-10">
          <div className="mb-10 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[.2em] text-white/55">Your view</p>
              <h2 className="font-display text-2xl font-bold">Settings</h2>
            </div>
            <button aria-label="Close" onClick={close} className="rounded-full bg-white/15 p-2"><X size={18} /></button>
          </div>
          <label className="block text-sm font-semibold">
            Home city
            <select value={city} onChange={(e) => setCity(e.target.value as City)} className="mt-3 w-full rounded-2xl border border-white/30 bg-white/15 px-4 py-3 text-white outline-none">
              {cities.map((item) => <option key={item} className="text-slate-800">{item}</option>)}
            </select>
          </label>
          <button onClick={onEdit} className="mt-8 flex w-full items-center justify-between rounded-2xl bg-white/15 p-4 text-left text-sm font-semibold">
            Edit interests <ChevronRight size={17} />
          </button>
          <div className="mt-10 border-t border-white/15 pt-6">
            <p className="text-sm leading-6 text-white/65">
              Mausam is a personalization layer on India's existing weather data — ranked by what matters to you, then explained in plain language.
            </p>
            <button onClick={close} className="mt-6 w-full rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-700">
              Close settings
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}

function BottomNav({ active, setActive }: { active: string; setActive: (value: string) => void }) {
  const items = [
    { label: 'Home', icon: HomeIcon },
    { label: 'Forecast', icon: CloudRain },
    { label: 'Alerts', icon: Bell },
    { label: 'Settings', icon: Settings },
  ];
  return (
    <nav className="glass fixed bottom-4 left-1/2 z-40 flex w-[calc(100%-32px)] max-w-[420px] -translate-x-1/2 justify-around rounded-[22px] bg-slate-700/65 p-2 shadow-2xl">
      <div className="flex w-full justify-around">
        {items.map(({ label, icon: Icon }) => (
          <button
            key={label}
            onClick={() => setActive(label)}
            className={`flex min-w-[70px] flex-col items-center gap-1 rounded-2xl px-3 py-2 text-[10px] font-semibold transition ${
              active === label ? 'bg-white/25 text-white shadow-inner' : 'text-white/60 hover:text-white'
            }`}
          >
            <Icon size={17} />{label}
          </button>
        ))}
      </div>
    </nav>
  );
}

function WhyModal({ modal, close }: { modal: ModalData; close: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/55 p-5">
      <div className="glass relative w-full max-w-md rounded-[26px] p-6">
        <div className="relative z-10">
          <div className="mb-6 flex items-start justify-between">
            <div>
              <p className="mb-1 text-xs uppercase tracking-[.2em] text-white/60">Personalized insight</p>
              <h2 className="font-display text-xl font-bold">Why you're seeing this</h2>
            </div>
            <button aria-label="Close insight" onClick={close} className="rounded-full bg-white/15 p-2"><X size={17} /></button>
          </div>
          <p className="mb-4 text-sm font-semibold">{modal.reason}</p>
          <div className="mb-5 space-y-2">
            {modal.values.map((value) => (
              <div key={value} className="rounded-xl bg-white/10 px-3 py-2 text-sm text-white/75">{value}</div>
            ))}
          </div>
          <div className="rounded-2xl border border-white/20 bg-white/10 p-4">
            <p className="text-sm leading-6 text-white/80">{modal.recommendation}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
