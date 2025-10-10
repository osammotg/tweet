// srt.ts - Generate SRT subtitles from script lines

export function srtFromLines(lines: string[], wps: number): string {
  let t = 0;
  const pad = (n: number) => String(n).padStart(2, '0');
  
  const fmt = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    const ms = Math.floor((sec - Math.floor(sec)) * 1000);
    const i = Math.floor(sec);
    return `${pad(h)}:${pad(m)}:${pad(i)},${String(ms).padStart(3, '0')}`;
  };
  
  const blocks: string[] = [];
  
  lines.forEach((line, idx) => {
    const words = line.split(/\s+/).length;
    const dur = Math.max(0.8, Math.ceil((words / wps) * 10) / 10);
    const start = t;
    const end = t + dur;
    t = end + 0.05;
    blocks.push(`${idx + 1}\n${fmt(start)} --> ${fmt(end)}\n${line}\n`);
  });
  
  return blocks.join("\n");
}

