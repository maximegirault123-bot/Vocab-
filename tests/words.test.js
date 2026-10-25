// Vérifie la cohérence du lexique : node tests/words.test.js
import assert from "node:assert";
import fs from "node:fs";

const window = {};
new Function("window", fs.readFileSync(new URL("../words.js", import.meta.url), "utf8"))(window);
const words = window.WORDS;

assert(words.length >= 20, "le lexique doit contenir au moins 20 mots");
const seen = new Set();
for (const w of words) {
  for (const k of ["word", "type", "definition"]) assert(w[k], `${w.word}: champ « ${k} » manquant`);
  assert([1, 2, 3].includes(w.level), `${w.word}: niveau invalide`);
  assert(Array.isArray(w.examples) && w.examples.length >= 1 && w.examples.length <= 2, `${w.word}: une ou deux phrases attendues`);
  for (const e of w.examples) assert(/\*\*.+?\*\*/.test(e), `${w.word}: chaque phrase doit marquer le mot avec **`);
  assert(!seen.has(w.word.toLowerCase()), `${w.word}: doublon`);
  seen.add(w.word.toLowerCase());
}
console.log(`OK — ${words.length} mots valides`);
