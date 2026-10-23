"use strict";
function parseCSV(text){var rows=[];var row=[];var cur="";var q=false;var s=String(text||"");
for(var i=0;i<s.length;i++){var c=s[i];
if(q){if(c==='"'){if(s[i+1]==='"'){cur+='"';i++;}else q=false;}else cur+=c;}
else if(c==='"')q=true;else if(c===","){row.push(cur);cur="";}else if(c==="\n"){row.push(cur);rows.push(row);row=[];cur="";}else if(c!=="\r")cur+=c;}
row.push(cur);rows.push(row);return rows.filter(function(r){return r.some(function(c){return String(c).trim()!=="";});});}
function rowsToObjects(rows){if(!rows.length)return[];var h=rows[0].map(function(x){return String(x).trim();});return rows.slice(1).map(function(r){var o={};h.forEach(function(k,i){o[k]=r[i]||"";});return o;});}
function escapeICS(v){return String(v==null?"":v).replace(/\\/g,"\\\\").replace(/;/g,"\\;").replace(/,/g,"\\,").replace(/\r?\n/g,"\\n");}
function foldLine(line){var out=[];var cur="";var bytes=0;for(var i=0;i<line.length;i++){var ch=line[i];var b=Buffer.byteLength(ch,"utf8");if(bytes+b>75){out.push(cur);cur=" "+ch;bytes=1+b;}else{cur+=ch;bytes+=b;}}out.push(cur);return out.join("\r\n");}
function pad(n){return String(n).padStart(2,"0");}
function formatUTC(d){return d.getUTCFullYear()+pad(d.getUTCMonth()+1)+pad(d.getUTCDate())+"T"+pad(d.getUTCHours())+pad(d.getUTCMinutes())+pad(d.getUTCSeconds())+"Z";}
function formatLocal(d){return d.getFullYear()+pad(d.getMonth()+1)+pad(d.getDate())+"T"+pad(d.getHours())+pad(d.getMinutes())+pad(d.getSeconds());}
function formatDT(value,opts){opts=opts||{};var d=value instanceof Date?value:new Date(value);
if(opts.allDay)return{prop:"DTSTART;VALUE=DATE",value:d.getUTCFullYear()+pad(d.getUTCMonth()+1)+pad(d.getUTCDate())};
if(opts.tzid)return{prop:"DTSTART;TZID="+opts.tzid,value:formatLocal(d)};
return{prop:"DTSTART",value:formatUTC(d)};}
function buildRRULE(r){if(!r||!r.freq)return"";var f=String(r.freq).toUpperCase();if(!["DAILY","WEEKLY","MONTHLY","YEARLY"].includes(f))throw new Error("Invalid frequency: "+r.freq);
var parts=["FREQ="+f];var iv=Number(r.interval)||1;if(iv<1)throw new Error("Interval must be at least 1");if(iv!==1)parts.push("INTERVAL="+iv);
if(r.count){if(Number(r.count)<1)throw new Error("Count must be at least 1");parts.push("COUNT="+Number(r.count));}
else if(r.until){var d=r.until instanceof Date?r.until:new Date(r.until);parts.push("UNTIL="+formatUTC(d));}
if(r.byDay&&r.byDay.length)parts.push("BYDAY="+r.byDay.map(function(x){return String(x).toUpperCase().slice(0,2);}).join(","));return parts.join(";");}
function validateRRULE(str){var errs=[];if(!str)return errs;var m={};String(str).split(";").forEach(function(p){var kv=p.split("=");m[kv[0]]=kv[1];});
if(!["DAILY","WEEKLY","MONTHLY","YEARLY"].includes(m.FREQ))errs.push("FREQ must be DAILY, WEEKLY, MONTHLY or YEARLY");
if(m.COUNT&&m.UNTIL)errs.push("COUNT and UNTIL must not both be present");
if(m.INTERVAL&&Number(m.INTERVAL)<1)errs.push("INTERVAL must be at least 1");return errs;}
function alarmTrigger(minutes){var m=Math.abs(Number(minutes)||0);if(m===0)return"PT0S";if(m%1440===0)return"-P"+(m/1440)+"D";if(m%60===0)return"-PT"+(m/60)+"H";return"-PT"+m+"M";}
function detectAmbiguousDate(str){var m=String(str||"").trim().match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);if(!m)return{ambiguous:false};
var a=Number(m[1]),b=Number(m[2]);if(a<=12&&b<=12&&a!==b)return{ambiguous:true,reason:"Both "+a+" and "+b+" could be the month (DD/MM vs MM/DD)"};return{ambiguous:false};}
function uidFor(ev,i){var base=String(ev.title||"event").toLowerCase().replace(/[^a-z0-9]+/g,"-").slice(0,30);return base+"-"+i+"@csv-to-ics-shiftmaker";}
function buildICS(events,opts){opts=opts||{};var now=opts.now||new Date();var lines=["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//AamirTechs//CSV to ICS Shiftmaker//EN","CALSCALE:GREGORIAN"];
(events||[]).forEach(function(ev,i){lines.push("BEGIN:VEVENT");lines.push("UID:"+uidFor(ev,i));lines.push("DTSTAMP:"+formatUTC(now));
var s=formatDT(new Date(ev.start),opts);lines.push(s.prop+":"+s.value);
if(ev.end){var e=formatDT(new Date(ev.end),Object.assign({},opts,{allDay:opts.allDay}));lines.push(e.prop.replace("DTSTART","DTEND")+":"+e.value);}
if(ev.title)lines.push("SUMMARY:"+escapeICS(ev.title));if(ev.location)lines.push("LOCATION:"+escapeICS(ev.location));if(ev.notes)lines.push("DESCRIPTION:"+escapeICS(ev.notes));
if(ev.rrule){var rr=typeof ev.rrule==="string"?ev.rrule:buildRRULE(ev.rrule);var ve=validateRRULE(rr);if(ve.length)throw new Error(ve.join("; "));lines.push("RRULE:"+rr);}
if(ev.reminderMinutes!=null&&ev.reminderMinutes!==""){lines.push("BEGIN:VALARM");lines.push("ACTION:DISPLAY");lines.push("TRIGGER:"+alarmTrigger(ev.reminderMinutes));lines.push("DESCRIPTION:Reminder");lines.push("END:VALARM");}
lines.push("END:VEVENT");});
lines.push("END:VCALENDAR");return lines.map(foldLine).join("\r\n")+"\r\n";}
const api={parseCSV:parseCSV,rowsToObjects:rowsToObjects,escapeICS:escapeICS,foldLine:foldLine,formatUTC:formatUTC,formatDT:formatDT,buildRRULE:buildRRULE,validateRRULE:validateRRULE,alarmTrigger:alarmTrigger,detectAmbiguousDate:detectAmbiguousDate,buildICS:buildICS,uidFor:uidFor};
if(typeof module!=="undefined"&&module.exports){module.exports=api;}
if(typeof window!=="undefined"){window.CsvToIcsShiftmaker=api;}
