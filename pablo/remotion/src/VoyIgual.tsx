import React from 'react';
import {AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig, interpolate, spring, Easing} from 'remotion';

const GOLD = '#D9A441';
const fontCss = `
@font-face{font-family:'Cinzel';src:url('${staticFile('Cinzel-900.ttf')}');font-weight:900}
@font-face{font-family:'Poppins';src:url('${staticFile('Poppins-Medium.ttf')}');font-weight:500}
@font-face{font-family:'Poppins';src:url('${staticFile('Poppins-Bold.ttf')}');font-weight:700}`;

type Line = {start: number; end: number; words: string[]; gold: number[]; speech: number};
// start = inicio de la voz (s); end = fin de visibilidad (s); speech = duración aprox. de la frase
const LINES: Line[] = [
  {start: 0.4, end: 2.75, words: ['Nunca', 'se', 'trató', 'de', 'tener', 'ganas.'], gold: [5], speech: 1.9},
  {start: 2.9, end: 6.85, words: ['Trabajo.', 'Emprendimiento.', 'Familia.'], gold: [0, 1, 2], speech: 2.8},
  {start: 7.0, end: 10.65, words: ['Siempre', 'hay', 'una', 'buena', 'excusa', 'para', 'no', 'ir.'], gold: [4], speech: 2.4},
  {start: 10.8, end: 13.45, words: ['Hoy', 'tampoco', 'tenía', 'ganas.'], gold: [3], speech: 1.6},
  {start: 13.6, end: 18.9, words: ['Fui', 'igual.'], gold: [0, 1], speech: 0.9},
  {start: 19.3, end: 24.6, words: ['Cada', 'vez', 'que', 'vas', 'igual,', 'votas', 'por', 'la', 'persona', 'que', 'quieres', 'ser.'], gold: [8], speech: 3.6},
  {start: 24.9, end: 28.4, words: ['Las', 'manos', 'cuentan', 'lo', 'que', 'las', 'fotos', 'no', 'muestran.'], gold: [1], speech: 2.8},
];

const Word: React.FC<{text: string; at: number; gold: boolean; big: boolean}> = ({text, at, gold, big}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame: frame - at, fps, config: {damping: 14, stiffness: 180, mass: 0.6}});
  const blur = interpolate(frame - at, [0, 6], [8, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const glow = gold ? interpolate(frame - at, [0, 8, 30], [0, 1, 0.55], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) : 0;
  return (
    <span style={{
      display: 'inline-block', margin: '0 12px', opacity: s,
      transform: `translateY(${(1 - s) * 40}px) scale(${0.85 + s * 0.15})`, filter: `blur(${blur}px)`,
      fontFamily: gold ? 'Cinzel' : 'Poppins', fontWeight: gold ? 900 : 700,
      fontSize: big ? 104 : gold ? 74 : 64, letterSpacing: gold ? 2 : 0,
      color: gold ? GOLD : '#F5F1E8', textTransform: gold ? 'uppercase' : 'none',
      textShadow: `0 4px 18px rgba(0,0,0,.85)${gold ? `, 0 0 ${28 * glow}px rgba(217,164,65,${0.8 * glow})` : ''}`,
    }}>{text}</span>
  );
};

const Caption: React.FC<{l: Line}> = ({l}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  if (t < l.start - 0.1 || t > l.end) return null;
  const out = interpolate(t, [l.end - 0.35, l.end], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const lens = l.words.map((w) => w.length + 2);
  const total = lens.reduce((a, b) => a + b, 0);
  let acc = 0;
  const big = l.words.length <= 2;
  return (
    <div style={{position: 'absolute', left: 70, right: 70, top: big ? 1180 : 1240, textAlign: 'center', lineHeight: 1.25, opacity: out}}>
      {l.words.map((w, i) => {
        const at = Math.round((l.start + (acc / total) * l.speech) * fps);
        acc += lens[i];
        return <Word key={i} text={w} at={at} gold={l.gold.includes(i)} big={big} />;
      })}
    </div>
  );
};

const Flash: React.FC<{at: number}> = ({at}) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [at - 6, at, at + 10], [0, 0.35, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const x = interpolate(frame, [at - 6, at + 10], [-30, 130], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return <AbsoluteFill style={{opacity: o, background: `linear-gradient(105deg, transparent ${x - 30}%, rgba(255,200,110,.9) ${x}%, transparent ${x + 30}%)`, mixBlendMode: 'screen'}} />;
};

const Final: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const at = Math.round(29.2 * fps);
  const s = spring({frame: frame - at, fps, config: {damping: 18, stiffness: 120}});
  const spacing = interpolate(frame, [at, at + 60], [40, 10], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const line = interpolate(frame, [at + 8, at + 30], [0, 520], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const tag = interpolate(frame, [at + 25, at + 40], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  if (frame < at - 2) return null;
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', flexDirection: 'column'}}>
      <div style={{fontFamily: 'Cinzel', fontWeight: 900, fontSize: 150, color: GOLD, letterSpacing: spacing, opacity: s,
        transform: `scale(${1.25 - 0.25 * s})`, textShadow: '0 0 40px rgba(217,164,65,.55), 0 6px 20px rgba(0,0,0,.9)'}}>VOY IGUAL.</div>
      <div style={{width: line, height: 3, background: GOLD, marginTop: 26, boxShadow: '0 0 14px rgba(217,164,65,.8)'}} />
      <div style={{fontFamily: 'Poppins', fontWeight: 500, fontSize: 36, color: '#F5F1E8', marginTop: 30, letterSpacing: 6, opacity: tag}}>@pablofrisardi</div>
    </AbsoluteFill>
  );
};

export const VoyIgual: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const progress = frame / durationInFrames;
  const gradOpacity = interpolate(frame, [28 * fps, 28.6 * fps], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{backgroundColor: 'black'}}>
      <style>{fontCss}</style>
      <OffthreadVideo src={staticFile('base_clean.mp4')} muted />
      <AbsoluteFill style={{opacity: gradOpacity, background: 'linear-gradient(to bottom, transparent 52%, rgba(0,0,0,.75) 78%, rgba(0,0,0,.9) 100%)'}} />
      {[2.8, 5.4, 19.0, 24.6].map((s) => <Flash key={s} at={Math.round(s * fps)} />)}
      {LINES.map((l, i) => <Caption key={i} l={l} />)}
      <Final />
      <div style={{position: 'absolute', top: 0, left: 0, height: 6, width: `${progress * 100}%`, background: GOLD, boxShadow: '0 0 10px rgba(217,164,65,.9)'}} />
    </AbsoluteFill>
  );
};
