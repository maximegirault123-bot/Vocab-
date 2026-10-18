// Vérifie la cohérence du lexique : node tests/words.test.js
const assert = require("assert");
const fs = require("fs");
const path = require("path");

const window = {};
new Function("window", fs.readFileSync(path.join(__dirname, "..", "words.js"), "utf8"))(window);
const words = window.WORDS;

assert(words.length >= 20, "le lexique doit contenir au moins 20 mots");
const seen = new Set();
for (const w of words) {
  for (const k of ["word", "type", "definition", "example"]) assert(w[k], `${w.word}: champ « ${k} » manquant`);
  assert([1, 2, 3].includes(w.level), `${w.word}: niveau invalide`);
  assert(/\*\*.+?\*\*/.test(w.example), `${w.word}: l'exemple doit marquer le mot avec **`);
  assert(!seen.has(w.word.toLowerCase()), `${w.word}: doublon`);
  seen.add(w.word.toLowerCase());
}
console.log(`OK — ${words.length} mots valides`);
