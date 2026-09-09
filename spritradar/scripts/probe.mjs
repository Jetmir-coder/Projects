/**
 * Echte Antwort von E-Control aufzeichnen und mit unseren Erwartungen abgleichen.
 *
 *   npm run probe                 -> Wien Innenstadt, Diesel
 *   npm run probe -- 48.21 16.37 SUP
 *
 * Warum das existiert: Die App wurde ohne Zugriff auf die echte Schnittstelle
 * gebaut. Dieses Skript holt eine echte Antwort, legt sie unter
 * src/fixtures/econtrol-echt.json ab und zeigt, welche Felder tatsächlich
 * geliefert werden. Weicht etwas ab, wird nur mapStation() in
 * src/api/econtrol.ts angepasst — sonst nichts.
 */

import { writeFileSync } from 'node:fs';

const [lat = '48.2082', lon = '16.3738', kraftstoff = 'DIE'] = process.argv.slice(2);

const url =
  'https://api.e-control.at/sprit/1.0/search/gas-stations/by-address' +
  `?latitude=${lat}&longitude=${lon}&fuelType=${kraftstoff}&includeClosed=false`;

console.log(`Frage ab: ${url}\n`);

let antwort;
try {
  antwort = await fetch(url, { headers: { Accept: 'application/json' } });
} catch (fehler) {
  console.error('Netzwerkfehler:', fehler.message);
  console.error('Bist du online? Blockt eine Firewall oder ein VPN?');
  process.exit(1);
}

if (!antwort.ok) {
  console.error(`E-Control antwortete mit HTTP ${antwort.status} ${antwort.statusText}`);
  process.exit(1);
}

const daten = await antwort.json();

if (!Array.isArray(daten)) {
  console.error('Unerwartet: die Antwort ist keine Liste. Rohantwort:');
  console.error(JSON.stringify(daten, null, 2).slice(0, 2000));
  process.exit(1);
}

const ziel = new URL('../src/fixtures/econtrol-echt.json', import.meta.url);
writeFileSync(ziel, JSON.stringify(daten, null, 2));

console.log(`${daten.length} Tankstellen erhalten.`);
console.log(`Rohantwort gespeichert: src/fixtures/econtrol-echt.json\n`);

if (daten.length === 0) {
  console.log('Leere Liste — an dieser Stelle gibt es keine Tankstellen.');
  process.exit(0);
}

const erste = daten[0];

console.log('Felder der obersten Ebene:');
console.log('  ' + Object.keys(erste).join(', ') + '\n');

if (erste.location) {
  console.log('Felder unter "location":');
  console.log('  ' + Object.keys(erste.location).join(', ') + '\n');
}

if (Array.isArray(erste.prices) && erste.prices.length > 0) {
  console.log('Felder eines Preis-Eintrags:');
  console.log('  ' + Object.keys(erste.prices[0]).join(', '));
  console.log('  Beispiel: ' + JSON.stringify(erste.prices[0]) + '\n');
}

// Prüfen, ob unsere Annahmen halten.
const erwartet = [
  ['id', erste.id !== undefined],
  ['name', erste.name !== undefined],
  ['location.latitude', erste.location?.latitude !== undefined || erste.lat !== undefined],
  ['location.longitude', erste.location?.longitude !== undefined || erste.lng !== undefined],
  ['location.address', erste.location?.address !== undefined],
  ['location.postalCode', erste.location?.postalCode !== undefined],
  ['location.city', erste.location?.city !== undefined],
  ['prices[].fuelType', erste.prices?.[0]?.fuelType !== undefined],
  ['prices[].amount', erste.prices?.[0]?.amount !== undefined],
];

console.log('Abgleich mit dem, was die App erwartet:');
let abweichungen = 0;
for (const [name, gefunden] of erwartet) {
  console.log(`  ${gefunden ? 'ok  ' : 'FEHLT'}  ${name}`);
  if (!gefunden) abweichungen++;
}

console.log();
if (abweichungen === 0) {
  console.log('Alles wie erwartet. Es ist nichts zu tun.');
} else {
  console.log(`${abweichungen} Abweichung(en). Zeig mir die Ausgabe oben —`);
  console.log('anzupassen ist nur mapStation() in src/api/econtrol.ts.');
}
