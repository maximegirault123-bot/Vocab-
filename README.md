# Lexicon — mots rares

Application mobile (PWA) pour découvrir et maîtriser des mots français rares, savants ou peu communs.

## Modes

- **Découverte** : une carte par mot. On devine le sens, on touche pour révéler la définition, un exemple et l'étymologie, puis on indique si le mot était connu. Filtres : *Nouveaux*, *À consolider*, *Tous*.
- **Quiz** : 5, 10 ou 20 questions de trois types (trouver la définition, retrouver le mot, compléter une phrase). Une bonne réponse fait monter la maîtrise du mot (●●● = maîtrisé), une erreur la fait baisser. Les séries de bonnes réponses rapportent des points bonus. On peut interroger les mots découverts, tous les mots ou seulement ses erreurs.
- **Écrire** : l'utilisateur écrit sa propre phrase avec un mot, et Claude (l'IA d'Anthropic) lui dit si le mot est bien employé, explique pourquoi et propose une correction. Une phrase réussie fait progresser la maîtrise du mot et s'affiche ensuite sur sa fiche (« Tes phrases »).
- **Lexique** : liste des 80 mots avec recherche, filtres et niveau de maîtrise.

Également : un mot du jour, la prononciation (synthèse vocale), et une progression sauvegardée sur l'appareil.

## Lancer en local

Il faut Node.js 20 ou plus récent et une clé API Anthropic (https://console.anthropic.com) pour la correction des phrases.

```bash
npm install
ANTHROPIC_API_KEY=sk-ant-... npm start
# puis ouvrir http://localhost:8000 (ou http://<ip-de-votre-ordinateur>:8000 depuis le téléphone)
```

La clé reste sur le serveur (`api/check.js`) : elle n'est jamais envoyée au téléphone.

## Mettre en ligne et installer sur le téléphone

La correction par l'IA a besoin d'un petit serveur, donc d'un hébergeur qui exécute des fonctions, par exemple **Vercel** (gratuit pour un usage personnel) :

1. Sur vercel.com, importer ce dépôt GitHub (aucune configuration : `api/check.js` devient automatiquement la route `/api/check`).
2. Dans *Settings → Environment Variables*, ajouter `ANTHROPIC_API_KEY`.
3. Ouvrir l'URL obtenue sur le téléphone, puis *Partager → Sur l'écran d'accueil* (iOS) ou *Installer l'application* (Android).

Sans serveur (GitHub Pages, par exemple), tout fonctionne sauf la correction des phrases. Hors connexion, seuls la découverte, le quiz et le lexique restent disponibles.

## Coût de la correction

Chaque correction est un appel à l'API Claude (modèle `claude-opus-5-5`), facturé à l'usage sur le compte Anthropic qui fournit la clé. Pour un usage ouvert au public, prévoir une limite de dépense dans la console Anthropic et, idéalement, une limite de requêtes par utilisateur.

## Ajouter des mots

Ajouter une entrée dans `words.js`, avec une ou deux phrases tirées de situations courantes, en y entourant le mot de `**` (cela sert aux phrases à trous) :

```js
{ word: "Abscons", type: "adj.", level: 1, definition: "…", examples: ["Le mail de la direction était **abscons**…", "Évite le jargon **abscons**…"], etymology: "…" },
```

Puis lancer les tests avec `npm test` (cohérence du lexique et route de correction).
