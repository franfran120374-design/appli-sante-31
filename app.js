/* ============================================================
   Santé 31 — orientation santé pour personnes allophones
   Aucun stockage : ni cookie, ni localStorage, ni serveur.
   L'état vit dans la variable ETAT et meurt avec l'onglet.
   ============================================================ */

"use strict";

var ETAT = { langue: null, dir: "ltr", age: null, ville: null, zone: null, besoin: null };
var T = {};        // traductions de la langue choisie
var FR = {};       // traductions françaises, toujours chargées (affichage double)
var LANGUES = [], VILLES = [], DATA = { structures: [], maj: "" };
var PILE = [];     // historique des écrans

var app = document.getElementById("app");
var crumb = document.getElementById("crumb");
var btnBack = document.getElementById("btn-back");

/* ---------- pictogrammes ---------- */
var PICTO = {
  droits:   '<path d="M4 6h16v12H4zM4 10h16"/><path d="M7 14h5"/>',
  medecin:  '<path d="M12 3v18M3 12h18"/>',
  femme:    '<circle cx="12" cy="8" r="5"/><path d="M12 13v8M9 18h6"/>',
  enfant:   '<circle cx="12" cy="7" r="4"/><path d="M5 21c0-4 3-7 7-7s7 3 7 7"/>',
  psy:      '<path d="M12 20s-7-4.5-7-9a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 4.5-7 9-7 9z"/>',
  depistage:'<path d="M4 20l7-7M9 4l11 11M14 4l6 6-4 4-6-6z"/>',
  dents:    '<path d="M6 4c3-1.5 9-1.5 12 0 1.5 4-1 7-1.5 11-.5 3-2.5 3-3-1-.3-2.5-1.7-2.5-2 0-.5 4-2.5 4-3 1C8 11 4.5 8 6 4z"/>',
  pharmacie:'<rect x="3" y="8" width="18" height="12" rx="3"/><path d="M12 11v6M9 14h6M9 8V5h6v3"/>',
  interprete:'<path d="M4 5h9v8H8l-4 3V5z"/><path d="M11 10h9v8h-4l-3 3v-3h-2z"/>'
};
var BESOINS = ["droits", "medecin", "femme", "enfant", "psy", "depistage", "dents", "pharmacie", "interprete"];
var AGES = ["a", "b", "c", "d"];

/* ---------- utilitaires ---------- */
function t(k) { return (T && T[k]) || FR[k] || k; }
function fr(k) { return FR[k] || k; }
function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}
function icone(d) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + d + "</svg>"; }
function bilingue(k) {
  var trad = t(k), base = fr(k);
  return esc(trad) + (ETAT.langue !== "fr" ? '<span class="fr-echo">' + esc(base) + "</span>" : "");
}
function ligneEcho(k) {
  return ETAT.langue !== "fr" ? '<span class="echo">' + esc(fr(k)) + "</span>" : "";
}
function json(url) {
  return fetch(url, { cache: "no-cache" }).then(function (r) {
    if (!r.ok) throw new Error(url + " : " + r.status);
    return r.json();
  });
}
function telLien(n) { return "tel:" + String(n).replace(/\s/g, ""); }
function carteLien(adr) {
  return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(adr);
}

/* ---------- lecture à voix haute (si la voix existe sur l'appareil) ---------- */
function parler(texte) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  var u = new SpeechSynthesisUtterance(texte);
  u.lang = ETAT.langue === "fa" ? "fa-IR" : ETAT.langue;
  u.rate = 0.9;
  window.speechSynthesis.speak(u);
}
function boutonEcoute(texte) {
  if (!("speechSynthesis" in window)) return "";
  return '<button class="btn ghost" data-parler="' + esc(texte) + '">' +
    icone('<path d="M11 5 6 9H3v6h3l5 4V5z"/><path d="M16 9a4 4 0 0 1 0 6"/>') +
    "</button>";
}

/* ---------- navigation ---------- */
function aller(ecran, options) {
  PILE.push({ ecran: ecran, etat: JSON.parse(JSON.stringify(ETAT)), options: options || {} });
  rendre(ecran, options);
}
function retour() {
  PILE.pop();
  var p = PILE.length ? PILE[PILE.length - 1] : null;
  if (!p) { return demarrer(); }
  ETAT = p.etat;
  appliquerLangue();
  rendre(p.ecran, p.options, true);
}
btnBack.addEventListener("click", retour);

function rendre(ecran, options, sansPush) {
  if (!sansPush) { /* la pile est gérée par aller() */ }
  btnBack.style.display = PILE.length <= 1 ? "none" : "grid";
  var vues = {
    langue: vueLangue, age: vueAge, ville: vueVille,
    besoin: vueBesoin, liste: vueListe, fiche: vueFiche
  };
  app.innerHTML = vues[ecran](options || {});
  app.scrollTop = 0;
  window.scrollTo(0, 0);
  app.focus();
}

/* ---------- écrans ---------- */
function vueLangue() {
  crumb.textContent = "Santé 31";
  var h = "<h1>Choisissez votre langue</h1><p class='sub'>Choose your language &middot; اختر لغتك</p><div class='grid'>";
  LANGUES.forEach(function (l) {
    h += '<button class="choice langue-btn" data-langue="' + l.code + '"' + (l.pret ? "" : " disabled") + '>' +
      '<span><span class="nom">' + esc(l.nom) + '</span><span class="lat">' + esc(l.latin) +
      (l.pret ? "" : " — bientôt") + "</span></span>" +
      icone('<path d="M9 5l7 7-7 7"/>') + "</button>";
  });
  h += "</div><p class='note'>Cette application n'enregistre rien.<br>This application saves nothing.</p>";
  return h;
}

function vueAge() {
  crumb.textContent = t("app.nom");
  var h = "<h1>" + bilingue("age.titre") + "</h1><p class='sub'>" + esc(t("age.sous")) + "</p>" +
    "<div class='grid grid-2'>";
  AGES.forEach(function (a) {
    h += '<button class="choice tall" data-age="' + a + '"><span class="lead">' +
      esc(t("age." + a)) + "</span>" + ligneEcho("age." + a) + "</button>";
  });
  return h + "</div>";
}

function vueVille() {
  var h = "<h1>" + bilingue("ville.titre") + "</h1><p class='sub'>" + esc(t("ville.sous")) + "</p><div class='grid'>";
  VILLES.forEach(function (v) {
    h += '<button class="choice" data-ville="' + esc(v.nom) + '" data-zone="' + v.zone + '">' +
      '<span class="lead">' + esc(v.nom) + "</span></button>";
  });
  h += '<button class="choice" data-ville="—" data-zone="toulouse"><span class="lead">' +
    esc(t("ville.autre")) + "</span>" + ligneEcho("ville.autre") + "</button>";
  return h + "</div>";
}

function vueBesoin() {
  crumb.textContent = ETAT.ville + " · " + t("age." + ETAT.age);
  var h = "<h1>" + bilingue("besoin.titre") + "</h1><p class='sub'>" + esc(t("besoin.sous")) + "</p>" +
    "<div class='grid'>";
  BESOINS.forEach(function (b) {
    h += '<button class="choice" data-besoin="' + b + '">' +
      '<span class="pic">' + icone(PICTO[b]) + "</span>" +
      '<span><span class="lead">' + esc(t("b." + b)) + "</span>" + ligneEcho("b." + b) + "</span></button>";
  });
  h += "</div><p class='note'>" + esc(t("prive.note")) + "</p>";
  return h;
}

function filtrer() {
  return DATA.structures.filter(function (s) {
    return s.besoins.indexOf(ETAT.besoin) !== -1 &&
      s.ages.indexOf(ETAT.age) !== -1 &&
      s.zones.indexOf(ETAT.zone) !== -1;
  });
}

function vueListe() {
  var liste = filtrer();
  var h = "<h1>" + bilingue("b." + ETAT.besoin) + "</h1><p class='sub'>" + esc(t("liste.sous")) + "</p>";
  if (!liste.length) return h + "<div class='carte'><p>" + esc(t("liste.vide")) + "</p></div>";
  liste.forEach(function (s) {
    h += "<div class='carte'><h3>" + esc(s.nom) + "</h3><p class='adr'>" + esc(s.adresse) + "</p>" +
      "<div class='tags'>" + s.attributs.map(function (a) {
        return "<span class='tag " + (a === "rdv" ? "attention" : "oui") + "'>" + esc(t("attr." + a)) + "</span>";
      }).join("") + "</div>" +
      "<div class='actions'><button class='btn' data-fiche='" + s.id + "'>" +
      icone('<path d="M9 5l7 7-7 7"/>') + esc(t("suite")) + "</button></div></div>";
  });
  h += "<p class='maj'>" + esc(t("maj.label")) + " " + esc(DATA.maj) + "</p>";
  return h;
}

function vueFiche(opt) {
  var s = DATA.structures.filter(function (x) { return x.id === opt.id; })[0];
  if (!s) return "<p>—</p>";
  var h = "<div class='carte'><h3>" + esc(s.nom) + "</h3><p class='adr'>" + esc(s.adresse) +
    (s.transport ? "<br>" + esc(s.transport) : "") + "</p>" +
    "<div class='tags'>" + s.attributs.map(function (a) {
      return "<span class='tag " + (a === "rdv" ? "attention" : "oui") + "'>" + esc(t("attr." + a)) + "</span>";
    }).join("") + "</div><div class='actions'>" +
    (s.tel ? "<a class='btn' href='" + telLien(s.tel) + "'>" +
      icone('<path d="M5 4h4l2 5-3 2a12 12 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>') +
      esc(t("fiche.appeler")) + "</a>" : "") +
    "<a class='btn ghost' target='_blank' rel='noopener' href='" + carteLien(s.adresse) + "'>" +
    icone('<path d="M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>') +
    esc(t("fiche.itineraire")) + "</a></div></div>";

  h += "<h2>" + esc(t("apporter.titre")) + "</h2><div class='grid'>";
  s.docs.forEach(function (d) {
    h += "<div class='choice'><span class='pic'>" +
      icone('<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/>') + "</span><span>" +
      "<span class='lead'>" + esc(t("doc." + d)) + "</span>" + ligneEcho("doc." + d) + "</span></div>";
  });
  h += "</div>";

  h += "<h2>" + esc(t("fiche.montrer")) + "</h2><div class='carte'><p class='sub' style='margin:0 0 10px'>" +
    esc(t("fiche.montrer.aide")) + "</p><p class='pf' style='color:var(--brique);font-weight:700;direction:ltr'>" +
    esc(s.note) + "</p></div>";

  h += "<p class='maj'>" + esc(t("maj.label")) + " " + esc(DATA.maj) +
    (s.verifie ? "" : " — fiche à vérifier") + "</p>";
  return h;
}

/* ---------- panneaux ---------- */
var sheet = document.getElementById("sheet");
var sheetBody = document.getElementById("sheet-body");
document.getElementById("sheet-close").addEventListener("click", fermerSheet);
sheet.addEventListener("click", function (e) { if (e.target === sheet) fermerSheet(); });
function fermerSheet() { sheet.classList.remove("ouvert"); sheetBody.innerHTML = ""; }
function ouvrirSheet(html) { sheetBody.innerHTML = html; sheet.classList.add("ouvert"); }

var URGENCES = [
  ["u.15", "u.15b", "15"], ["u.112", "u.112b", "112"], ["u.114", "u.114b", "114"],
  ["u.116", "u.116b", "116117"], ["u.3114", "u.3114b", "3114"], ["u.3919", "u.3919b", "3919"]
];
function panneauUrgence() {
  var h = "<h1>" + bilingue("urgence.titre") + "</h1><p class='sub'>" + esc(t("urgence.sous")) + "</p>";
  URGENCES.forEach(function (u) {
    h += "<a class='urgence-ligne' href='" + telLien(u[2]) + "'><span class='num'>" + esc(t(u[0])) +
      "</span><span class='quoi'>" + esc(t(u[1])) +
      (ETAT.langue !== "fr" ? "<small>" + esc(fr(u[1])) + "</small>" : "") + "</span></a>";
  });
  return h;
}
function panneauPhrases() {
  var h = "<h1>" + bilingue("phrases.titre") + "</h1><p class='sub'>" + esc(t("phrases.sous")) + "</p>";
  for (var i = 1; i <= 12; i++) {
    var k = "p" + i;
    h += "<div class='phrase'><div class='pt'>" + esc(t(k)) + "</div><div class='pf'>" + esc(fr(k)) + "</div></div>";
  }
  return h;
}
function panneauLangue() {
  var h = "<h1>Langue</h1><div class='grid'>";
  LANGUES.forEach(function (l) {
    h += '<button class="choice langue-btn" data-langue="' + l.code + '"' + (l.pret ? "" : " disabled") +
      '><span class="nom">' + esc(l.nom) + "</span></button>";
  });
  return h + "</div>";
}

/* ---------- délégation de clics ---------- */
document.addEventListener("click", function (e) {
  var el = e.target.closest("[data-langue],[data-age],[data-ville],[data-besoin],[data-fiche],[data-open],[data-parler]");
  if (!el) return;

  if (el.hasAttribute("data-parler")) { parler(el.getAttribute("data-parler")); return; }

  if (el.hasAttribute("data-open")) {
    var q = el.getAttribute("data-open");
    ouvrirSheet(q === "urgence" ? panneauUrgence() : q === "phrases" ? panneauPhrases() : panneauLangue());
    return;
  }
  if (el.hasAttribute("data-langue")) {
    var code = el.getAttribute("data-langue");
    chargerLangue(code).then(function () {
      if (sheet.classList.contains("ouvert")) { var p = PILE[PILE.length - 1]; fermerSheet(); rendre(p.ecran, p.options, true); }
      else { aller("age"); }
    });
    return;
  }
  if (el.hasAttribute("data-age")) { ETAT.age = el.getAttribute("data-age"); aller("ville"); return; }
  if (el.hasAttribute("data-ville")) {
    ETAT.ville = el.getAttribute("data-ville");
    ETAT.zone = el.getAttribute("data-zone");
    aller("besoin"); return;
  }
  if (el.hasAttribute("data-besoin")) { ETAT.besoin = el.getAttribute("data-besoin"); aller("liste"); return; }
  if (el.hasAttribute("data-fiche")) { aller("fiche", { id: el.getAttribute("data-fiche") }); return; }
});

document.getElementById("btn-reset").addEventListener("click", function () {
  if (window.confirm(t("reset.titre"))) demarrer();
});

/* ---------- langue ---------- */
function appliquerLangue() {
  document.documentElement.lang = ETAT.langue || "fr";
  document.body.setAttribute("dir", ETAT.dir || "ltr");
}
function chargerLangue(code) {
  var meta = LANGUES.filter(function (l) { return l.code === code; })[0] || { code: "fr", dir: "ltr" };
  return json("i18n/" + code + ".json").then(function (pack) {
    T = pack; ETAT.langue = code; ETAT.dir = meta.dir;
    appliquerLangue();
    document.querySelectorAll("[data-i18n]").forEach(function (n) {
      n.textContent = t(n.getAttribute("data-i18n"));
    });
  });
}

/* ---------- démarrage ---------- */
function demarrer() {
  ETAT = { langue: "fr", dir: "ltr", age: null, ville: null, zone: null, besoin: null };
  T = FR; PILE = [];
  appliquerLangue();
  aller("langue");
}

Promise.all([
  json("i18n/fr.json"),
  json("data/langues.json"),
  json("data/villes.json"),
  json("data/structures-31.json")
]).then(function (r) {
  FR = r[0]; LANGUES = r[1]; VILLES = r[2]; DATA = r[3];
  demarrer();
}).catch(function (err) {
  app.innerHTML = "<h1>Les données n'ont pas pu être chargées</h1><p class='sub'>" + esc(err.message) +
    "</p><p class='note'>Ouvrez l'application via un serveur (voir le README), pas en double-cliquant sur index.html.</p>";
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", function () {
    navigator.serviceWorker.register("sw.js").catch(function () { });
  });
}
