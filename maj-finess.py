"""
Extrait de FINESS (open data, Licence Ouverte) les structures utiles a
l'orientation, pour le departement 31, et produit data/structures-finess-31.json.

Source : https://opendata.koumoul.com/datasets/etablissements-finess-france
Relancer ce script quand on veut rafraichir l'annuaire automatique.
"""
import json, math, os, urllib.request, unicodedata

DEP = "31"
DEST = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "structures-finess-31.json")
API = ("https://koumoul.com/data-fair/api/v1/datasets/etablissements-finess-france/lines"
       "?size=10000&select=NumET,Rs,Rsl,lcatet,adresse,lach,tel,lat,lon"
       "&qs=dep%3A%22" + DEP + "%22")

# categorie FINESS -> besoins de l'appli + tranches d'age + attributs
CATS = {
 "Centre Médico-Psychologique (C.M.P.)":            (["psy"], "abcd", ["gratuit", "rdv"]),
 "Centre Médico-Psycho-Pédagogique (C.M.P.P.)":     (["psy"], "ab",   ["gratuit", "rdv", "enfants"]),
 "Centre de Santé":                                 (["medecin"], "abcd", ["rdv"]),
 "Maison de santé (L.6223-3)":                      (["medecin"], "abcd", ["rdv"]),
 "Maison médicale de garde (MMG)":                  (["medecin"], "abcd", ["sansrdv"]),
 "Pharmacie d'Officine":                            (["pharmacie"], "abcd", ["sansrdv"]),
 "Centre Hospitalier (C.H.)":                       (["medecin", "femme"], "abcd", ["sansdroits"]),
 "Centre hospitalier, ex Hôpital local":            (["medecin"], "abcd", ["sansdroits"]),
 "Centre Hospitalier Régional (C.H.R.)":            (["medecin", "femme"], "abcd", ["sansdroits"]),
 "Centre Hospitalier Spécialisé lutte Maladies Mentales": (["psy"], "abcd", ["gratuit"]),
 "Centre gratuit d'information de dépistage et de diagnostic": (["depistage", "femme"], "bcd", ["gratuit", "sansdroits"]),
 "Centre de vaccination":                           (["depistage"], "abcd", ["gratuit", "sansdroits"]),
 "Centre de vaccination internationale":            (["depistage"], "abcd", ["rdv"]),
 "Centre soins accompagnement prévention addictologie (CSAPA)": (["psy"], "bcd", ["gratuit", "sansdroits"]),
 "Protection Maternelle et Infantile (P.M.I.)":     (["enfant", "femme"], "ab", ["gratuit", "sansdroits", "enfants"]),
}

# communes de reference et zone associee (doit rester coherent avec data/villes.json)
ZONES = {
 "TOULOUSE": "toulouse", "BLAGNAC": "agglo", "COLOMIERS": "agglo", "TOURNEFEUILLE": "agglo",
 "CUGNAUX": "agglo", "BALMA": "agglo", "L UNION": "agglo", "RAMONVILLE SAINT AGNE": "agglo",
 "SAINT ORENS DE GAMEVILLE": "agglo", "PORTET SUR GARONNE": "agglo",
 "MURET": "muret", "AUTERIVE": "muret", "SAINT GAUDENS": "comminges",
 "REVEL": "lauragais", "VILLEFRANCHE DE LAURAGAIS": "lauragais",
}


def simplifie(s):
    s = unicodedata.normalize("NFD", (s or "").upper())
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    for c in "-'’.,":
        s = s.replace(c, " ")
    return " ".join(s.split())


def commune_de(ligne):
    lach = ligne.get("lach") or ""          # ex : "31300 TOULOUSE"
    return simplifie(lach[5:] if lach[:5].isdigit() else lach)


def charge():
    print("Telechargement FINESS departement", DEP, "...")
    with urllib.request.urlopen(API, timeout=180) as r:
        return json.loads(r.read().decode("utf-8"))["results"]


def main():
    lignes = charge()
    print("recus :", len(lignes))

    # barycentre de chaque commune de reference, pour rattacher les autres communes
    ancres = {}
    for l in lignes:
        z = ZONES.get(commune_de(l))
        if z and l.get("lat"):
            ancres.setdefault(z, []).append((l["lat"], l["lon"]))
    ancres = {z: (sum(p[0] for p in v) / len(v), sum(p[1] for p in v) / len(v))
              for z, v in ancres.items()}

    def zone_de(l):
        z = ZONES.get(commune_de(l))
        if z:
            return z
        if not l.get("lat"):
            return "toulouse"
        return min(ancres, key=lambda k: math.hypot(l["lat"] - ancres[k][0],
                                                    l["lon"] - ancres[k][1]))

    sorties, vus = [], set()
    for l in lignes:
        conf = CATS.get(l.get("lcatet"))
        if not conf:
            continue
        besoins, ages, attrs = conf
        nom = (l.get("Rs") or l.get("Rsl") or "").strip()
        if not nom or l.get("NumET") in vus:
            continue
        vus.add(l.get("NumET"))
        sorties.append({
            "id": "f" + str(l.get("NumET")),
            "nom": nom,
            "adresse": ((l.get("adresse") or "") + " " + (l.get("lach") or "")).strip(),
            "tel": (l.get("tel") or "").replace(" ", ""),
            "commune": commune_de(l).title(),
            "zones": [zone_de(l)],
            "besoins": besoins,
            "ages": list(ages),
            "attributs": attrs,
            "docs": ["identite", "vitale"],
            "cat": l.get("lcatet", ""),
            "lat": l.get("lat"), "lon": l.get("lon"),
            "source": "FINESS",
            "verifie": False,
        })

    sorties.sort(key=lambda s: (s["zones"][0], s["nom"]))
    with open(DEST, "w", encoding="utf-8") as f:
        json.dump({"maj": "2026-08-10",
                   "source": "FINESS / Agence du Numerique en Sante — Licence Ouverte 2.0",
                   "structures": sorties}, f, ensure_ascii=False, separators=(",", ":"))

    par_besoin = {}
    for s in sorties:
        for b in s["besoins"]:
            par_besoin[b] = par_besoin.get(b, 0) + 1
    print("ecrit :", len(sorties), "structures ->", DEST)
    print("par besoin :", par_besoin)
    print("poids :", round(os.path.getsize(DEST) / 1024), "Ko")


if __name__ == "__main__":
    main()
