const ISTANBUL_OFFSET_MS=3*60*60*1000;
const pad=value=>String(value).padStart(2,"0");
const dateKey=date=>`${date.getUTCFullYear()}-${pad(date.getUTCMonth()+1)}-${pad(date.getUTCDate())}`;
const istanbulCalendar=date=>new Date(date.getTime()+ISTANBUL_OFFSET_MS);
const utcBoundary=calendar=>new Date(Date.UTC(calendar.getUTCFullYear(),calendar.getUTCMonth(),calendar.getUTCDate())-ISTANBUL_OFFSET_MS);

export function reportPeriod(type, now=new Date()) {
  const local=istanbulCalendar(now),start=new Date(Date.UTC(local.getUTCFullYear(),local.getUTCMonth(),local.getUTCDate()));
  if(type==="weekly")start.setUTCDate(start.getUTCDate()-((start.getUTCDay()+6)%7));
  else if(type==="monthly")start.setUTCDate(1);
  else throw new Error("Geçersiz rapor dönemi");
  const end=new Date(start);if(type==="weekly")end.setUTCDate(end.getUTCDate()+7);else end.setUTCMonth(end.getUTCMonth()+1);
  return {type,startDate:dateKey(start),start:utcBoundary(start).toISOString(),end:utcBoundary(end).toISOString()};
}

export function previousReportPeriod(type, now=new Date()) {
  const current=reportPeriod(type,now),anchor=new Date(current.start);anchor.setUTCSeconds(anchor.getUTCSeconds()-1);return reportPeriod(type,anchor);
}

export function formatReportRange(period,locale="tr-TR") {
  const format=new Intl.DateTimeFormat(locale,{dateStyle:"long",timeZone:"Europe/Istanbul"});
  return `${format.format(new Date(period.start))} – ${format.format(new Date(new Date(period.end).getTime()-1))}`;
}
