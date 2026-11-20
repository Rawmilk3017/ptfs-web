'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, Airplay, ArrowDownRight, ArrowUpRight, Bell, ChevronDown, CircleHelp, Crosshair, Filter, Gauge, Layers3, MapPin, Maximize2, Menu, Plane, Radio, Search, Settings2, ShieldAlert, Signal, SlidersHorizontal, X } from 'lucide-react';
import type { Aircraft, RadarResponse, ControllerPosition, AtisRecord } from '@/lib/types';
import AtisVoice from './atis-voice';

const demoAircraft: Aircraft[] = [
  { callsign: 'AAL240', playerName: 'SkyCaptain24', aircraftType: 'Boeing 737-800', heading: 42, altitude: 18200, speed: 286, groundSpeed: 241, position: { x: -12500, y: -8200 } },
  { callsign: 'UAL812', playerName: 'AeroPilot', aircraftType: 'Airbus A320', heading: 118, altitude: 27400, speed: 312, groundSpeed: 268, position: { x: 14300, y: -15000 } },
  { callsign: 'SWA517', playerName: 'CloudRunner', aircraftType: 'Boeing 737 MAX 8', heading: 225, altitude: 9600, speed: 244, groundSpeed: 219, position: { x: 5200, y: 11500 } },
  { callsign: 'FDX92', playerName: 'CargoAce', aircraftType: 'Boeing 767-300F', heading: 302, altitude: 33100, speed: 341, groundSpeed: 294, position: { x: -18400, y: 4200 } },
  { callsign: 'JBU118', playerName: 'JetBlueJay', aircraftType: 'Airbus A321', heading: 75, altitude: 12400, speed: 278, groundSpeed: 230, position: { x: 19200, y: 5600 } },
  { callsign: 'DAL601', playerName: 'DeltaDash', aircraftType: 'Airbus A330-300', heading: 168, altitude: 35800, speed: 398, groundSpeed: 322, position: { x: -3800, y: -22000 } },
  { callsign: 'NKS440', playerName: 'SpiritFlyer', aircraftType: 'Airbus A320neo', heading: 12, altitude: 6400, speed: 210, groundSpeed: 188, isOnGround: false, position: { x: 7800, y: -3500 } },
  { callsign: 'BAW27', playerName: 'BritishAvGeek', aircraftType: 'Boeing 777-300ER', heading: 258, altitude: 39000, speed: 421, groundSpeed: 350, position: { x: -22000, y: 16500 } },
  { callsign: 'EMR01', playerName: 'RescuePilot', aircraftType: 'Airbus H145', heading: 90, altitude: 1800, speed: 112, groundSpeed: 92, isEmergencyOccuring: true, position: { x: 2500, y: 2300 } },
];

function fmt(value?: number, suffix = '') { return typeof value === 'number' ? `${Math.round(value).toLocaleString()}${suffix}` : '—'; }
function planePoint(ac: Aircraft, index: number, total: number, range: string) {
  const x = ac.position?.x ?? Math.cos(index * 6.28 / total) * 18000;
  const y = ac.position?.y ?? Math.sin(index * 6.28 / total) * 18000;
  const radiusStuds = Number.parseInt(range, 10) * 3307.14286;
  const percentPerStud = 50 / radiusStuds;
  return { x: 50 + x * percentPerStud, y: 50 + y * percentPerStud };
}

export default function Home() {
  const [server, setServer] = useState<'main' | 'event'>('main');
  const [aircraft, setAircraft] = useState<Aircraft[]>(demoAircraft);
  const [source, setSource] = useState<'demo' | 'live' | 'offline'>('demo');
  const [selected, setSelected] = useState<string>('AAL240');
  const [query, setQuery] = useState('');
  const [emergencyOnly, setEmergencyOnly] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const [showPanel, setShowPanel] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [controllers, setControllers] = useState<ControllerPosition[]>([]);
  const [atis, setAtis] = useState<AtisRecord[]>([]);
  const [menu, setMenu] = useState('RADAR');
  const [range, setRange] = useState('40 NM');

  const refresh = useCallback(async () => {
    try {
      const response = await fetch(`/api/radar?server=${server}`, { cache: 'no-store' });
      const data = await response.json() as RadarResponse;
      if (data.source === 'live') {
        setAircraft(data.aircraft);
        setSource('live');
        setLastUpdate(new Date());
      } else if (data.source === 'offline') {
        setSource('demo');
      }
    } catch { setSource('demo'); }
  }, [server]);

  useEffect(() => { refresh(); const timer = setInterval(refresh, 3000); return () => clearInterval(timer); }, [refresh]);
  useEffect(() => {
    const loadSupportFeeds = async () => {
      try { const [c, a] = await Promise.all([fetch('/api/controllers', { cache: 'no-store' }), fetch('/api/atis', { cache: 'no-store' })]);
        const cd = await c.json(); const ad = await a.json(); setControllers(cd.controllers ?? []); setAtis(ad.atis ?? []);
      } catch { /* Keep the last successful support-feed snapshot. */ }
    };
    loadSupportFeeds(); const timer = setInterval(loadSupportFeeds, 6000); return () => clearInterval(timer);
  }, []);

  const filtered = useMemo(() => aircraft.filter(ac => {
    const text = `${ac.callsign} ${ac.playerName ?? ''} ${ac.aircraftType ?? ''}`.toLowerCase();
    return text.includes(query.toLowerCase()) && (!emergencyOnly || ac.isEmergencyOccuring);
  }), [aircraft, query, emergencyOnly]);
  const active = aircraft.find(ac => ac.callsign === selected) ?? filtered[0] ?? aircraft[0];
  const emergencyCount = aircraft.filter(a => a.isEmergencyOccuring).length;
  const avgAltitude = aircraft.length ? Math.round(aircraft.reduce((n, a) => n + (a.altitude ?? 0), 0) / aircraft.length) : 0;

  return <main className="app-shell">
    <header className="topbar">
      <div className="brand"><div className="brand-mark"><Crosshair size={21}/></div><div><div className="brand-name">ATLAS<span>RADAR</span></div><div className="brand-sub">PTFS FLIGHT OPERATIONS</div></div></div>
      <nav className="main-nav">{['RADAR', 'AIRCRAFT', 'CONTROLLERS', 'AIRPORTS', 'ATIS'].map(item => <button key={item} className={menu === item ? 'nav-item active' : 'nav-item'} onClick={() => setMenu(item)}>{item}</button>)}</nav>
      <div className="top-actions"><div className="live-pill"><span className="pulse-dot"/>{source === 'live' ? 'LIVE DATA' : 'DEMO MODE'}</div><button className="icon-btn" aria-label="Notifications"><Bell size={17}/></button><button className="avatar">AR</button></div>
    </header>

    <section className="page-heading"><div><div className="eyebrow"><span className="eyebrow-line"/> NETWORK OVERVIEW <span className="eyebrow-muted">/ {server === 'main' ? 'MAIN SERVER' : 'EVENT SERVER'}</span></div><h1>{menu === 'RADAR' ? 'Live radar' : menu.charAt(0) + menu.slice(1).toLowerCase()}<span className="heading-period">.</span></h1><p>Real-time situational awareness across the PTFS skies.</p></div><div className="heading-actions"><button className="outline-btn" onClick={() => setServer(server === 'main' ? 'event' : 'main')}><Layers3 size={15}/>{server === 'main' ? 'MAIN SERVER' : 'EVENT SERVER'}<ChevronDown size={14}/></button><button className="solid-btn" onClick={() => { setEmergencyOnly(!emergencyOnly); setMenu('RADAR'); }}><SlidersHorizontal size={15}/> {emergencyOnly ? 'ALL TRAFFIC' : 'FILTER TRAFFIC'}</button></div></section>

    <section className="stats-grid">
      <Stat icon={<Plane size={17}/>} label="AIRCRAFT TRACKED" value={String(aircraft.length).padStart(2, '0')} detail="Across selected server" accent="blue"/>
      <Stat icon={<Radio size={17}/>} label="ATC POSITIONS" value="—" detail="Controller feed ready" accent="cyan"/>
      <Stat icon={<ShieldAlert size={17}/>} label="EMERGENCIES" value={String(emergencyCount).padStart(2, '0')} detail={emergencyCount ? 'Requires attention' : 'No active alerts'} accent="orange"/>
      <Stat icon={<Gauge size={17}/>} label="AVG. ALTITUDE" value={`${Math.round(avgAltitude / 100) / 10}k`} detail="Feet above sea level" accent="violet"/>
    </section>

    {menu === 'RADAR' && <section className="workspace">
      <div className="radar-card">
        <div className="card-toolbar"><div className="toolbar-title"><span className="status-ring"/><div><strong>TACTICAL DISPLAY</strong><small>SECTOR 01 · PTFS WORLD</small></div></div><div className="toolbar-controls"><button className="tool-btn" onClick={() => setShowLabels(!showLabels)}><span className={showLabels ? 'toggle on' : 'toggle'}/><span>LABELS</span></button><button className="tool-btn" onClick={() => setRange(range === '40 NM' ? '80 NM' : range === '80 NM' ? '160 NM' : '40 NM')}><Crosshair size={14}/>{range}</button><button className="tool-btn" onClick={() => setShowPanel(!showPanel)}><Maximize2 size={14}/></button></div></div>
        <div className="radar-stage"><div className="radar-watermark">ATLAS / SURVEILLANCE</div><div className="radar-grid"/><div className="radar-rings"><div/><div/><div/><div/></div><div className="radar-crosshair horizontal"/><div className="radar-crosshair vertical"/><div className="radar-center"><span/></div>
          <div className="north-marker">N</div><div className="range-label top">{range}</div><div className="range-label right">{Number.parseInt(range, 10) / 2} NM</div><div className="range-label bottom">{range}</div><div className="range-label left">{Number.parseInt(range, 10) / 2} NM</div>
          {filtered.map((ac, index) => { const p = planePoint(ac, index, filtered.length || 1, range); return <button key={ac.callsign} className={`target ${selected === ac.callsign ? 'selected' : ''} ${ac.isEmergencyOccuring ? 'emergency' : ''}`} style={{ left: `${Math.max(5, Math.min(95, p.x))}%`, top: `${Math.max(5, Math.min(95, p.y))}%` }} onClick={() => setSelected(ac.callsign)} title={ac.callsign}><span className="target-icon" style={{ transform: `rotate(${ac.heading ?? 0}deg)` }}><Plane size={18} fill="currentColor"/></span>{showLabels && <span className="target-label"><b>{ac.callsign}</b><small>{fmt(ac.altitude)} FT</small></span>}</button>; })}
          <div className="map-legend"><span><i className="legend-dot blue"/> ACTIVE</span><span><i className="legend-dot orange"/> EMERGENCY</span><span><i className="legend-dot muted"/> SELECTED TRACK</span></div><div className="coordinates">X: 00000 / Y: 00000 <span>·</span> SCALE 1:{range === '40 NM' ? '1.0' : range === '80 NM' ? '2.0' : '4.0'}</div>
        </div>
        <div className="radar-footer"><div><span className="footer-key">FEED</span><span className="footer-value">{source === 'live' ? '24DATA / REST CACHE' : 'LOCAL PREVIEW'}</span></div><div><span className="footer-key">LAST UPDATE</span><span className="footer-value">{lastUpdate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span></div><div><span className="footer-key">REFRESH</span><span className="footer-value">3 SEC</span></div><div className="footer-right"><span className="pulse-dot"/> SYSTEM NOMINAL</div></div>
      </div>

      {showPanel && <aside className="detail-card"><div className="detail-head"><div><div className="section-kicker">TRACK INSPECTOR</div><h2>Aircraft details</h2></div><button className="icon-btn small"><Settings2 size={16}/></button></div>
        {active ? <><div className="selected-aircraft"><div className="aircraft-emblem"><Plane size={27}/></div><div><div className="callsign">{active.callsign}</div><div className="aircraft-type">{active.aircraftType ?? 'Unknown aircraft'}</div></div><span className={active.isEmergencyOccuring ? 'track-status alert' : 'track-status'}>{active.isEmergencyOccuring ? 'EMERGENCY' : 'TRACKED'}</span></div>
          <div className="detail-grid"><Metric label="ALTITUDE" value={fmt(active.altitude, ' FT')}/><Metric label="GROUND SPEED" value={fmt(active.groundSpeed ?? active.speed, ' KT')}/><Metric label="HEADING" value={`${fmt(active.heading, '°')} `}/><Metric label="VERTICAL / STATE" value={active.isOnGround ? 'ON GROUND' : 'AIRBORNE'}/></div>
          <div className="detail-section"><div className="section-label">PILOT INFORMATION</div><div className="info-row"><span>Roblox username</span><b>{active.playerName ?? 'Unavailable'}</b></div><div className="info-row"><span>Aircraft type</span><b>{active.aircraftType ?? 'Unknown'}</b></div><div className="info-row"><span>Wind</span><b>{active.wind ?? '—'}</b></div></div>
          <div className="detail-section"><div className="section-label">POSITION DATA</div><div className="position-box"><div><span>WORLD X</span><b>{fmt(active.position?.x)}</b></div><div><span>WORLD Y</span><b>{fmt(active.position?.y)}</b></div></div></div>
          <button className="track-button" onClick={() => setSelected(active.callsign)}><Crosshair size={15}/> TRACK SELECTED AIRCRAFT</button>
        </> : <div className="empty-state">Select an aircraft to inspect its track.</div>}
      </aside>}
    </section>}

    {(menu === 'RADAR' || menu === 'AIRCRAFT') && <section className="traffic-card"><div className="traffic-header"><div><div className="section-kicker">LIVE TRAFFIC FEED</div><h2>Aircraft directory <span>{filtered.length}</span></h2></div><div className="traffic-actions"><label className="search-box"><Search size={15}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search callsign or pilot..."/><kbd>/</kbd></label><button className={emergencyOnly ? 'filter-button active' : 'filter-button'} onClick={() => setEmergencyOnly(!emergencyOnly)}><Filter size={15}/> FILTER</button></div></div>
      <div className="table-wrap"><table><thead><tr><th>CALLSIGN</th><th>AIRCRAFT</th><th>PILOT</th><th>ALTITUDE</th><th>GROUND SPEED</th><th>HEADING</th><th>STATUS</th></tr></thead><tbody>{filtered.map(ac => <tr key={ac.callsign} className={selected === ac.callsign ? 'row-selected' : ''} onClick={() => setSelected(ac.callsign)}><td><span className="table-callsign"><span className="tiny-dot"/>{ac.callsign}</span></td><td>{ac.aircraftType ?? '—'}</td><td>{ac.playerName ?? '—'}</td><td className="mono">{fmt(ac.altitude, ' FT')}</td><td className="mono">{fmt(ac.groundSpeed ?? ac.speed, ' KT')}</td><td className="mono">{fmt(ac.heading, '°')}</td><td><span className={ac.isEmergencyOccuring ? 'table-status emergency-status' : 'table-status'}>{ac.isEmergencyOccuring ? 'EMERGENCY' : ac.isOnGround ? 'GROUND' : 'AIRBORNE'}</span></td></tr>)}</tbody></table>{filtered.length === 0 && <div className="empty-state">No aircraft match your search.</div>}</div>
    </section>}

    {menu === 'CONTROLLERS' && <section className="traffic-card directory-page"><div className="traffic-header"><div><div className="section-kicker">LIVE ATC NETWORK</div><h2>Controller positions <span>{controllers.length}</span></h2></div><div className="live-pill"><span className="pulse-dot"/> 24DATA FEED</div></div><div className="table-wrap"><table><thead><tr><th>AIRPORT / AREA</th><th>POSITION</th><th>CONTROLLER</th><th>STATUS</th><th>QUEUE</th></tr></thead><tbody>{controllers.map((c, i) => <tr key={`${c.airport}-${c.position}-${i}`}><td className="table-callsign">{c.airport}</td><td className="mono">{c.position}</td><td>{c.holder ?? 'Unclaimed'}</td><td><span className={c.claimable ? 'table-status' : 'table-status emergency-status'}>{c.claimable ? 'CLAIMABLE' : 'OCCUPIED'}</span></td><td className="mono">{c.queue?.length ?? 0} waiting</td></tr>)}</tbody></table>{controllers.length === 0 && <div className="empty-state">No controller data received yet. Configure Upstash Redis to enable the live feed.</div>}</div></section>}

    {menu === 'ATIS' && <><AtisVoice records={atis}/><section className="atis-grid atis-records-grid">{atis.length ? atis.map(a => <article className="atis-card" key={a.airport}><div className="atis-top"><div><div className="section-kicker">AUTOMATIC TERMINAL INFORMATION</div><h2>{a.airport}</h2></div><span className="atis-letter">{a.letter}</span></div><pre>{a.content}</pre><div className="atis-meta"><span>LAST EDITOR</span><b>{a.editor ?? 'Not reported'}</b></div></article>) : <div className="traffic-card empty-state">No ATIS data received yet. Configure Upstash Redis to enable the live feed.</div>}</section></>}
    {menu === 'AIRPORTS' && <section className="atis-grid">{atis.length ? atis.map(a => <article className="atis-card" key={a.airport}><div className="atis-top"><div><div className="section-kicker">AIRPORT INFORMATION</div><h2>{a.airport}</h2></div><span className="atis-letter">{a.letter}</span></div><pre>{a.content}</pre><div className="atis-meta"><span>LAST EDITOR</span><b>{a.editor ?? 'Not reported'}</b></div></article>) : <div className="traffic-card empty-state">No ATIS data received yet. Configure Upstash Redis to enable the live feed.</div>}</section>}
    <footer className="page-footer"><span>ATLAS RADAR <i>COMMUNITY FLIGHT OPERATIONS</i></span><span>INDEPENDENT COMMUNITY PROJECT · NOT AFFILIATED WITH ROBLOX OR ATC 24</span><span>BUILD 0.1.0 <b>●</b></span></footer>
  </main>;
}

function Stat({ icon, label, value, detail, accent }: { icon: React.ReactNode; label: string; value: string; detail: string; accent: string }) { return <div className="stat-card"><div className={`stat-icon ${accent}`}>{icon}</div><div className="stat-content"><span>{label}</span><strong>{value}</strong><small>{detail}</small></div><div className="stat-trend"><Activity size={15}/></div></div>; }
function Metric({ label, value }: { label: string; value: string }) { return <div className="metric"><span>{label}</span><b>{value}</b></div>; }
