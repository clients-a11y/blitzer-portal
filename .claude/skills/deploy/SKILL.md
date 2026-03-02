---
name: deploy
description: Änderungen committen und auf den Entwicklungsbranch pushen
argument-hint: [commit-nachricht]
---

Führe folgende Schritte aus, um die aktuellen Änderungen zu deployen:

1. Zeige `git status` und `git diff --stat` um zu sehen was geändert wurde
2. Wenn $ARGUMENTS angegeben wurde, nutze das als Commit-Message, sonst leite eine passende Commit-Message aus den Änderungen ab
3. Stage alle relevanten geänderten Dateien (keine .env, keine Secrets)
4. Erstelle einen Commit auf dem Branch `claude/speed-camera-website-Xxdn5` mit der Message, die mit folgendem Link endet:
   https://claude.ai/code/session_01AMmViqPFodZzX36aZhrGVF
5. Push mit: `git push -u origin claude/speed-camera-website-Xxdn5`
6. Bestätige den erfolgreichen Push

Wenn der Push fehlschlägt, warte 2 Sekunden und versuche es bis zu 4 Mal erneut.
