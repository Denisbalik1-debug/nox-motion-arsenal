#!/bin/bash
# Nachtlauf-Watchdog: startet Codex immer wieder neu, bis 07:00 oder alles fertig.
# Erkennt Stillstand (>15 Min ohne neuen Effekt) und startet dann neu.
# Idempotenter Prompt => Codex setzt genau dort fort, wo er aufgehört hat.
cd /c/Users/Denis/nox-motion-arsenal || exit 1
# Git für Codex' PowerShell-Shell verfügbar machen (Root-Cause des Hängens beim Commit)
export PATH="/c/Program Files/Git/cmd:/c/Program Files/Git/bin:/c/Program Files/Git/mingw64/bin:$PATH"
PROMPT_FILE="docs/codex-prompt-65-effekte.md"
LOG="/tmp/codex-nachtlauf.log"
END_EPOCH=$(date -d "07:00" +%s)

count_effects() {
  total=0
  for f in src/motion-arsenal/effects/*/catalog.ts; do
    [ -f "$f" ] || continue
    n=$(grep -c "Component: lazy" "$f" 2>/dev/null)
    total=$((total + n))
  done
  echo "$total"
}

echo "=== Watchdog gestartet um $(date +%H:%M) ===" >> "$LOG"
START_COUNT=$(count_effects)
echo "Start-Metrik (lazy-Imports in Kategorie-Decks): $START_COUNT" >> "$LOG"
# 35 Konzept-Effekte sind noch offen (65 gesamt - 30 bereits gebaut: Batches 1-3=18 + Batch 4=6 + Batch 5=6)
TARGET=$((START_COUNT + 35))

while true; do
  NOW=$(date +%s)
  if [ "$NOW" -ge "$END_EPOCH" ]; then
    echo "=== 07:00 erreicht - Stopp um $(date +%H:%M) ===" >> "$LOG"
    break
  fi
  COUNT=$(count_effects)
  if [ "$COUNT" -ge "$TARGET" ]; then
    echo "=== Alle 65 Konzept-Effekte fertig ($COUNT) ===" >> "$LOG"
    break
  fi

  echo "=== Start Codex-Lauf um $(date +%H:%M) (Effekte: $COUNT, seit Start +$((COUNT - START_COUNT))) ===" >> "$LOG"
  codex exec --sandbox danger-full-access -c 'approval_policy="never"' "$(cat "$PROMPT_FILE")" >> "$LOG" 2>&1 &
  CPID=$!

  LAST_CHANGE=$(date +%s)
  while kill -0 "$CPID" 2>/dev/null; do
    sleep 120
    NEW_COUNT=$(count_effects)
    if [ "$NEW_COUNT" -gt "$COUNT" ]; then
      LAST_CHANGE=$(date +%s)
      COUNT=$NEW_COUNT
      echo "Fortschritt: $COUNT Effekte ($(date +%H:%M))" >> "$LOG"
    fi
    NOW2=$(date +%s)
    if [ $((NOW2 - LAST_CHANGE)) -gt 900 ]; then
      echo "STILLSTAND seit 15 Min - Codex ($CPID) killen, Neustart" >> "$LOG"
      kill -9 "$CPID" 2>/dev/null
      sleep 3
      break
    fi
  done
  wait "$CPID" 2>/dev/null
  echo "Codex-Lauf beendet um $(date +%H:%M), Effekte: $(count_effects)" >> "$LOG"
  sleep 5
done
echo "=== WATCHDOG BEENDET um $(date +%H:%M) - Endstand: $(count_effects) Effekte ===" >> "$LOG"
