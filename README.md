# Santé 31 — orientation santé pour personnes allophones

Application web installable (PWA) qui aide une personne allophone à trouver le bon lieu de soin en Haute-Garonne.
**Aucune donnée n'est enregistrée** : ni cookie, ni `localStorage`, ni base de données, ni serveur. Tout vit en mémoire et disparaît à la fermeture de l'onglet.

Parcours : **langue → tranche d'âge → ville → besoin → liste de lieux → fiche pratique.**
Trois outils sont accessibles en permanence depuis la barre du bas : **Urgence**, **Phrases utiles**, **Langue**.

---

## 1. Tester sur ton PC (Windows / PowerShell)

⚠️ Ne double-clique pas sur `index.html` : le navigateur bloque le chargement des fichiers JSON en local. Il faut un mini-serveur.

```powershell
cd "$env:USERPROFILE\Documents\appli-sante-31"
python -m http.server 8080
```

Puis ouvre <http://localhost:8080> dans Chrome.

Si Python n'est pas installé :

```powershell
npx --yes serve -l 8080 .
```

---

## 2. Publier sur GitHub Pages

**Chemin d'installation conseillé :** `C:\Users\<toi>\Documents\appli-sante-31`

```powershell
cd "$env:USERPROFILE\Documents\appli-sante-31"

git init
git add .
git commit -m "Santé 31 — v1"
git branch -M main
git remote add origin https://github.com/<ton-compte>/appli-sante-31.git
git push -u origin main
```

Ensuite, sur github.com : **Settings → Pages → Source : `Deploy from a branch` → Branch : `main` / `(root)` → Save.**

Deux minutes plus tard l'appli est en ligne sur :
`https://<ton-compte>.github.io/appli-sante-31/`

Sur ce lien, le téléphone du patient propose « Ajouter à l'écran d'accueil » : l'appli s'installe et fonctionne **hors connexion** ensuite. Génère un QR code de cette adresse et affiche-le dans ton bureau.

Pour publier une mise à jour :

```powershell
git add .
git commit -m "Mise à jour des structures"
git push
```

---

## 3. Corriger les adresses et les horaires — le fichier le plus important

`data/structures-31.json`

**Toutes les fiches sont actuellement marquées `"verifie": false`.** Les coordonnées viennent de sources publiques et **n'ont pas été confirmées**. Avant toute diffusion à des patients : appelle chaque structure, corrige, puis passe le champ à `"verifie": true`.

Une fiche se lit ainsi :

| Champ | Rôle |
|---|---|
| `nom`, `adresse`, `tel`, `transport` | Affichés tels quels, en français (c'est ce qu'on montre au guichet ou qu'on tape dans le GPS) |
| `zones` | Où la fiche apparaît : `toulouse`, `agglo`, `muret`, `comminges`, `lauragais` |
| `besoins` | `droits`, `medecin`, `femme`, `enfant`, `psy`, `depistage`, `dents`, `pharmacie`, `interprete` |
| `ages` | `a` = 0-6 ans, `b` = 7-17, `c` = 18-59, `d` = 60+ |
| `attributs` | `gratuit`, `rdv`, `sansrdv`, `sansdroits`, `interprete`, `enfants`, `femmes` — traduits automatiquement |
| `docs` | `identite`, `attestation`, `vitale`, `domicile`, `ordonnance`, `aucun` — traduits automatiquement |
| `note` | Phrase en français, affichée en rouge, à montrer à un francophone |

C'est le point clé de l'architecture : **seul le vocabulaire est traduit, pas les fiches.** Ajouter une structure ne demande donc aucun travail de traduction.

Pense à mettre à jour le champ `maj` en haut du fichier, il s'affiche dans l'appli.

**Après chaque modification de données, incrémente `VERSION` dans `sw.js`** (`sante31-v1` → `sante31-v2`), sinon les téléphones qui ont déjà installé l'appli garderont l'ancienne version en cache.

---

## 4. Ajouter une langue

Six langues sont livrées : français, arabe, dari/persan, ukrainien, russe, anglais.
Huit autres sont listées mais grisées : pachto, tigrinya, somali, kurmandji, albanais, géorgien, bengali, turc.

Pour en activer une, par exemple le pachto :

1. Copie `i18n/_gabarit.json` en `i18n/ps.json`.
2. Donne `i18n/_reference-fr.txt` à un interprète (ISM ou les interprètes du Pôle Santé) — c'est un simple fichier `clé → phrase française`, il remplit la colonne de droite.
3. Reporte les traductions dans `i18n/ps.json`.
4. Dans `data/langues.json`, passe `"pret": false` à `true` pour la ligne `ps`.
5. Ajoute `"./i18n/ps.json"` à la liste `FICHIERS` de `sw.js` et incrémente `VERSION`.

**Les six traductions livrées n'ont pas été relues par un interprète professionnel.** Elles couvrent uniquement du vocabulaire de navigation, pas du contenu clinique, mais fais-les valider avant diffusion large.

---

## 5. Ce que l'appli ne fait pas — volontairement

- **Aucun triage clinique.** Elle n'interroge pas les symptômes et ne dit jamais « allez aux urgences ou non ». Dès qu'un outil oriente sur des symptômes, il devient un dispositif médical au sens réglementaire. Ici : orientation dans le parcours (qui fait quoi, où, avec quels papiers) et un écran d'urgence factuel.
- **Aucun compte, aucun identifiant, aucune statistique d'usage.**
- **Aucune géolocalisation.** La ville est choisie à la main.

---

## 6. Pistes pour la v2

- **Audio** : les libellés sont lus par la synthèse vocale du téléphone quand la voix existe, ce qui est inégal en dari et inexistant en tigrinya. La vraie solution est un mp3 par écran, enregistré par un interprète — c'est aussi ce qui rend l'appli utilisable par les personnes non lettrées.
- **Schéma corporel tactile** : la personne touche l'endroit qui fait mal, l'appli génère la phrase française correspondante.
- **Horaires d'ouverture** par structure, avec un indicateur ouvert/fermé.
- **Version soignant** : le même arbre en français, pour l'entretien d'orientation.

---

## Arborescence

```
appli-sante-31/
├── index.html
├── styles.css
├── app.js
├── manifest.webmanifest
├── sw.js                    ← cache hors-ligne (incrémenter VERSION à chaque MAJ)
├── icons/
│   ├── icon-192.png
│   └── icon-512.png
├── data/
│   ├── langues.json         ← langues affichées / activées
│   ├── villes.json          ← communes et zones
│   └── structures-31.json   ← ANNUAIRE — le fichier à maintenir
└── i18n/
    ├── fr.json  en.json  ar.json  fa.json  uk.json  ru.json
    ├── _gabarit.json        ← à copier pour une nouvelle langue
    └── _reference-fr.txt    ← à donner à l'interprète
```
