'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pause, Play, Radio, Settings2, Volume2, VolumeX } from 'lucide-react';
import type { AtisRecord } from '@/lib/types';

type Props = { records: AtisRecord[] };

const phonetic: Record<string, string> = {
  A: 'Alpha', B: 'Bravo', C: 'Charlie', D: 'Delta', E: 'Echo', F: 'Foxtrot', G: 'Golf', H: 'Hotel', I: 'India', J: 'Juliett', K: 'Kilo', L: 'Lima', M: 'Mike',
  N: 'November', O: 'Oscar', P: 'Papa', Q: 'Quebec', R: 'Romeo', S: 'Sierra', T: 'Tango', U: 'Uniform', V: 'Victor', W: 'Whiskey', X: 'X-ray', Y: 'Yankee', Z: 'Zulu',
};
const aviationWords: Record<string, string> = {
  ATIS: 'A T I S', RWY: 'runway', RWYS: 'runways', DEP: 'departure', ARR: 'arrival', INFO: 'information', KT: 'knots', KTS: 'knots', FT: 'feet', QNH: 'altimeter', QFE: 'Q F E', OVC: 'overcast', BKN: 'broken clouds', SCT: 'scattered clouds', FEW: 'few clouds', CLR: 'clear', SKC: 'sky clear', VIS: 'visibility', TEMPO: 'temporarily', FM: 'from', TL: 'until', NOSIG: 'no significant change', CAVOK: 'cav okay', ACK: 'acknowledge', AFCT: 'aircraft', WIND: 'wind', RVR: 'runway visual range', CB: 'cumulonimbus', TS: 'thunderstorms', DZ: 'drizzle', RA: 'rain', SN: 'snow', FG: 'fog', BR: 'mist', HZ: 'haze', M: 'minus', NIL: 'nil',
};

function makeSpeakable(record: AtisRecord) {
  const raw = (record.lines?.length ? record.lines.join('. ') : record.content || '').replace(/\r/g, ' ');
  const airport = (record.airport || '').toUpperCase().split('').map((letter) => phonetic[letter] ?? letter).join(' ');
  const letter = phonetic[(record.letter || '').toUpperCase()] ?? record.letter ?? '';
  const body = raw
    .replace(/\b(\d{3})\/(\d{1,2})\b/g, '$1 degrees at $2')
    .replace(/\b(\d{3,4})Z\b/g, '$1 Zulu')
    .replace(/\b(\d{3,4})\b/g, (value) => value.split('').join(' '))
    .replace(/\b([A-Z]{2,})\b/g, (word) => aviationWords[word] ?? word.split('').join(' '))
    .replace(/\b([A-Z])\b/g, (letterCode) => phonetic[letterCode] ?? letterCode)
    .replace(/[\n,;]+/g, '. ')
    .replace(/\s+/g, ' ')
    .trim();
  return `${airport} automatic terminal information ${letter}. ${body}`.replace(/\s+/g, ' ').trim();
}

export default function AtisVoice({ records }: Props) {
  const [selectedAirport, setSelectedAirport] = useState('');
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceName, setVoiceName] = useState('');
  const [rate, setRate] = useState(0.92);
  const [autoAnnounce, setAutoAnnounce] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [supported, setSupported] = useState(false);
  const previousText = useRef<Record<string, string>>({});
  const initialized = useRef(false);
  const selected = useMemo(() => records.find((item) => item.airport === selectedAirport) ?? records[0], [records, selectedAirport]);

  useEffect(() => {
    const available = typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
    setSupported(available);
    if (!available) return;
    const update = () => {
      const list = window.speechSynthesis.getVoices();
      setVoices(list);
      if (!voiceName && list.length) {
        const preferred = list.find((voice) => /en[-_]?(US|GB|AU)/i.test(voice.lang)) ?? list.find((voice) => voice.lang.toLowerCase().startsWith('en')) ?? list[0];
        setVoiceName(preferred.name);
      }
    };
    update();
    window.speechSynthesis.addEventListener('voiceschanged', update);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', update);
  }, [voiceName]);

  const speak = useCallback((record?: AtisRecord) => {
    if (!record || !supported) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(makeSpeakable(record));
    const voice = voices.find((item) => item.name === voiceName);
    if (voice) utterance.voice = voice;
    utterance.lang = voice?.lang ?? 'en-US';
    utterance.rate = rate;
    utterance.pitch = 1;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }, [rate, supported, voiceName, voices]);

  const stop = useCallback(() => {
    if (supported) window.speechSynthesis.cancel();
    setSpeaking(false);
  }, [supported]);

  useEffect(() => {
    if (!records.length) return;
    const changed: AtisRecord[] = [];
    for (const record of records) {
      const fingerprint = `${record.letter}|${record.content ?? record.lines?.join('\n') ?? ''}`;
      const prior = previousText.current[record.airport];
      if (prior !== undefined && prior !== fingerprint) changed.push(record);
      previousText.current[record.airport] = fingerprint;
    }
    if (!initialized.current) {
      initialized.current = true;
      return;
    }
    if (autoAnnounce && changed.length) {
      const current = changed.find((item) => item.airport === selectedAirport) ?? changed[0];
      speak(current);
    }
  }, [records, autoAnnounce, selectedAirport, speak]);

  useEffect(() => () => { if ('speechSynthesis' in window) window.speechSynthesis.cancel(); }, []);

  return <section className="voice-console">
    <div className="voice-console-head">
      <div><div className="section-kicker">ATLAS VOICE · TEXT TO SPEECH</div><h2>Talking ATIS</h2><p>Listen to current airport information using your device&apos;s speech voice.</p></div>
      <span className={speaking ? 'voice-status speaking' : 'voice-status'}><span className="voice-status-dot"/>{speaking ? 'ON AIR' : 'STANDBY'}</span>
    </div>
    {!supported ? <div className="voice-notice">Speech playback is not supported in this browser. Try a current version of Chrome, Edge, or Safari.</div> : <>
      <div className="voice-controls">
        <label className="voice-field"><span>AIRPORT</span><select value={selected?.airport ?? ''} onChange={(event) => setSelectedAirport(event.target.value)} disabled={!records.length}>{records.map((record) => <option key={record.airport} value={record.airport}>{record.airport} · INFO {record.letter}</option>)}</select></label>
        <label className="voice-field voice-voice-select"><span>VOICE</span><select value={voiceName} onChange={(event) => setVoiceName(event.target.value)}>{voices.map((voice) => <option key={`${voice.name}-${voice.lang}`} value={voice.name}>{voice.name} ({voice.lang})</option>)}</select></label>
        <label className="voice-field voice-rate"><span>SPEECH RATE <b>{rate.toFixed(2)}×</b></span><input type="range" min="0.75" max="1.15" step="0.05" value={rate} onChange={(event) => setRate(Number(event.target.value))}/></label>
      </div>
      <div className="voice-actions">
        <button className="voice-play" onClick={() => speak(selected)} disabled={!selected}>{speaking ? <Pause size={15}/> : <Play size={15}/>} {speaking ? 'REPLAY ANNOUNCEMENT' : 'PLAY ATIS'}</button>
        <button className="voice-stop" onClick={stop} disabled={!speaking}><VolumeX size={15}/> STOP</button>
        <label className="voice-auto"><input type="checkbox" checked={autoAnnounce} onChange={(event) => setAutoAnnounce(event.target.checked)}/><span><Radio size={14}/> AUTO-ANNOUNCE UPDATES</span></label>
      </div>
      <div className="voice-script"><div className="voice-script-label"><Volume2 size={14}/> ANNOUNCEMENT PREVIEW</div><p>{selected ? makeSpeakable(selected) : 'Waiting for ATIS data from 24data…'}</p></div>
      <div className="voice-footnote"><Settings2 size={13}/> Voice playback is generated locally by your browser. Available voices depend on the device and operating system.</div>
    </>}
  </section>;
}
