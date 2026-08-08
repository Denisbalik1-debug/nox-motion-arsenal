#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""NOX Arsenal Recovery-Audit: Vault-Kandidaten vs. Repo-Bestand."""
import json, os, re, sys, glob, datetime

VAULT = r"C:\Users\Denis\OneDrive\Dokumente\Obsidian Vault\Nox Gehirn\03_KNOWLEDGE\Playbooks\NOX Motion Arsenal"
REPO = r"C:\Users\Denis\nox-motion-arsenal"

def read_file(p):
    try:
        with open(p, encoding="utf-8") as f:
            return f.read()
    except Exception as e:
        return ""

# ---------- 1. Repo-Effekte aus allen Catalogs extrahieren ----------
repo_effects = {}  # id -> {displayName, description, category, name}
cat_files = []
for root, dirs, files in os.walk(os.path.join(REPO, "src", "motion-arsenal", "effects")):
    for fn in files:
        if fn.endswith("catalog.ts"):
            cat_files.append(os.path.join(root, fn))

for cf in cat_files:
    src = read_file(cf)
    # Effekt-Blöcke: meta: { id: '...', ... }, Component: lazy(...)
    # Finde alle id: '...' mit zugehörigem displayName/description/category davor
    for m in re.finditer(r"id:\s*'([^']+)'", src):
        eid = m.group(1)
        # Rückwärts bis zum Blockstart '{' suchen für displayName/category/description
        start = max(0, m.start() - 3000)
        chunk = src[start:m.start()]
        dname = re.findall(r"displayName:\s*'([^']*)'", chunk)
        cat = re.findall(r"category:\s*'([^']*)'", chunk)
        desc = re.findall(r"description:\s*'([^']*)'", chunk)
        name = re.findall(r"name:\s*'([^']*)'", chunk)
        mode = re.findall(r"mode:\s*'([^']*)'", chunk)
        prod = "productionSafe: true" in src[max(0, m.start() - 4000):m.end() + 2000]
        repo_effects[eid] = {
            "name": name[-1] if name else "",
            "displayName": dname[-1] if dname else "",
            "category": cat[-1] if cat else "",
            "description": desc[-1] if desc else "",
            "mode": mode[-1] if mode else "",
            "productionSafe": prod,
        }

print(f"Repo-Effekte extrahiert: {len(repo_effects)}")

# ---------- 2. Vault-Notizen ----------
eff_dir = os.path.join(VAULT, "Effekte")
vault_notes = []  # {file, title, nox_id, kategorie, produktionsreif, modus, mtime}
for fn in sorted(os.listdir(eff_dir)):
    if not fn.endswith(".md"):
        continue
    p = os.path.join(eff_dir, fn)
    src = read_file(p)
    fm = src.split("---")[1] if src.startswith("---") else ""
    def fmval(key):
        m = re.search(rf"^{key}:\s*(.+)$", fm, re.M)
        return m.group(1).strip().strip('"\'') if m else ""
    mtime = datetime.datetime.fromtimestamp(os.path.getmtime(p))
    vault_notes.append({
        "file": fn[:-3],
        "nox_id": fmval("nox-id"),
        "kategorie": fmval("kategorie"),
        "produktionsreif": fmval("produktionsreif"),
        "modus": fmval("modus"),
        "mtime": mtime.strftime("%Y-%m-%d"),
        "body": src,
    })

print(f"Vault-Notizen: {len(vault_notes)}")

# ---------- 3. Matching: Vault-Notiz vs Repo-Effekt ----------
def normalize(s):
    s = s.lower()
    s = re.sub(r"[^a-z0-9 ]", " ", s)
    return re.sub(r"\s+", " ", s).strip()

def token_overlap(a, b):
    ta, tb = set(normalize(a).split()), set(normalize(b).split())
    if not ta or not tb:
        return 0.0
    return len(ta & tb) / min(len(ta), len(tb))

audit = []
for note in vault_notes:
    title = note["file"]
    nox_id = note["nox_id"]
    # Kandidat im Repo suchen: exakte nox-id-Übereinstimmung oder Name-Overlap
    match = None
    match_score = 0.0
    if nox_id and nox_id in repo_effects:
        match = nox_id
        match_score = 1.0
    else:
        for eid, e in repo_effects.items():
            # Token-Overlap Titel vs displayName
            s1 = token_overlap(title, e["displayName"] or e["name"])
            s2 = token_overlap(title, eid)
            score = max(s1, s2)
            if score > match_score:
                match_score = score
                match = eid
    exists = match_score >= 0.5
    audit.append({
        "titel": title,
        "nox_id": nox_id,
        "kategorie": note["kategorie"],
        "produktionsreif": note["produktionsreif"],
        "mtime": note["mtime"],
        "exists_in_repo": exists,
        "repo_match": match if exists else None,
        "match_score": round(match_score, 2),
        "repo_display": repo_effects.get(match, {}).get("displayName", "") if exists else "",
    })

# ---------- 4. Ausgabe ----------
# Neueste zuerst
audit.sort(key=lambda a: (a["mtime"], a["titel"]), reverse=True)

out = {"repo_effects": len(repo_effects), "vault_notes": len(vault_notes), "audit": audit}
with open(r"C:\Users\Denis\nox-motion-arsenal\audit_recovery.json", "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False, indent=1)

# Zusammenfassung
n_prod = sum(1 for a in audit if a["produktionsreif"] == "true")
n_exists = sum(1 for a in audit if a["exists_in_repo"])
print(f"Production Safe: {n_prod}, bereits im Repo (Fuzzy): {n_exists}")

# Letzte ~60 Kandidaten (der letzte Batch)
recent = [a for a in audit if a["mtime"] >= "2026-08-02"]
print(f"\n=== LETZTER BATCH ({len(recent)} Kandidaten, ab 02.08.) ===")
for a in recent:
    repo = f"REPO: {a['repo_match']} ({a['repo_display']})" if a["exists_in_repo"] else "NICHT im Repo"
    print(f"{a['mtime']} | {a['titel'][:45]:47} | prod={a['produktionsreif'] or '-'} | {repo}")
