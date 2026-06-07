import { SubtitleItem } from '../types';

/**
 * Parses time string (e.g. 00:01:20,450 or 00:01.20.450) to seconds.
 */
function parseTimeToSeconds(timeStr: string): number {
  const cleaned = timeStr.trim().replace(',', '.');
  const parts = cleaned.split(':');
  
  let seconds = 0;
  if (parts.length === 3) {
    // HH:MM:SS.mmm
    const hours = parseFloat(parts[0]) || 0;
    const minutes = parseFloat(parts[1]) || 0;
    const secs = parseFloat(parts[2]) || 0;
    seconds = hours * 3600 + minutes * 60 + secs;
  } else if (parts.length === 2) {
    // MM:SS.mmm
    const minutes = parseFloat(parts[0]) || 0;
    const secs = parseFloat(parts[1]) || 0;
    seconds = minutes * 60 + secs;
  } else {
    seconds = parseFloat(cleaned) || 0;
  }
  return seconds;
}

export function parseSubtitles(rawText: string): SubtitleItem[] {
  const subs: SubtitleItem[] = [];
  
  // Standardize newlines and split by empty lines or double returns
  const normalized = rawText.replace(/\r\n/g, '\n').trim();
  
  // SRT style splits
  const blocks = normalized.split(/\n\s*\n/);
  
  blocks.forEach((block, index) => {
    const lines = block.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length < 2) return;
    
    let timeIndex = 0;
    // Usually line 0 is the index (number), but let's check if line 0 is a timestamp line
    if (!lines[0].includes('-->') && lines.length >= 3) {
      timeIndex = 1;
    }
    
    const timeLine = lines[timeIndex];
    if (!timeLine || !timeLine.includes('-->')) return;
    
    const timeParts = timeLine.split('-->');
    if (timeParts.length !== 2) return;
    
    const startTime = parseTimeToSeconds(timeParts[0]);
    const endTime = parseTimeToSeconds(timeParts[1]);
    
    // Remaining lines are text
    const textLines = lines.slice(timeIndex + 1);
    const text = textLines.join('\n');
    
    subs.push({
      id: `sub_${index}_${Date.now()}`,
      startTime,
      endTime,
      text
    });
  });
  
  return subs;
}

export const SAMPLE_SUBTITLES_PT = `1
00:00:19,500 --> 00:00:23,800
Legendas em tempo real sincronizadas perfeitamente com controle de atraso.

2
00:00:24,200 --> 00:00:29,000
Tech Radium: O ápice do desempenho minimalista em qualquer dispositivo.
`;
