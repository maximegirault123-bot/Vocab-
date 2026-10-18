# Lexicon — mots rares

Application mobile (PWA) pour découvrir et maîtriser des mots français rares, savants ou peu communs.

## Modes

- **Découverte** : une carte par mot. On devine le sens, on touche pour révéler la définition, un exemple et l'étymologie, puis on indique si le mot était connu. Filtres : *Nouveaux*, *À consolider*, *Tous*.
- **Quiz** : 5, 10 ou 20 questions de trois types (trouver la définition, retrouver le mot, compléter une phrase). Une bonne réponse fait monter la maîtrise du mot (●●● = maîtrisé), une erreur la fait baisser. Les séries de bonnes réponses rapportent des points bonus. On peut interroger les mots découverts, tous les mots ou seulement ses erreurs.
- **Lexique** : liste des 80 mots avec recherche, filtres et niveau de maîtrise.

Également : un mot du jour, la prononciation (synthèse vocale), et une progression sauvegardée sur l'appareil.

## Lancer en local

```bash
python3 -m http.server 8000
# puis ouvrir http://localhost:8000 (ou http://<ip-de-votre-ordinateur>:8000 depuis le téléphone)
```

## Installer sur le téléphone

1. Héberger le dossier, par exemple avec GitHub Pages (*Settings → Pages → Deploy from a branch*, dossier racine).
2. Ouvrir l'URL sur le téléphone, puis *Partager → Sur l'écran d'accueil* (iOS) ou *Installer l'application* (Android).

L'application fonctionne ensuite hors ligne.

## Ajouter des mots

Ajouter une entrée dans `words.js`, en entourant le mot de `**` dans l'exemple (cela sert aux phrases à trous) :

```js
{ word: "Abscons", type: "adj.", level: 1, definition: "…", example: "Son exposé **abscons**…", etymology: "…" },
```

Puis vérifier le lexique avec `node tests/words.test.js`.
