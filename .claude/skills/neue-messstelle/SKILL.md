---
name: neue-messstelle
description: Schnell eine neue Messstelle über die API anlegen und den Research-Status verfolgen
argument-hint: "[titel] [GESCHWINDIGKEIT|ABSTAND|ROTLICHT]"
---

Der Nutzer möchte eine neue Messstelle anlegen.

Wenn $ARGUMENTS angegeben wurde, extrahiere daraus Titel und Verstoßart.
Sonst frage nach: Titel (z.B. "A1 bei Köln") und Verstoßart (GESCHWINDIGKEIT, ABSTAND oder ROTLICHT).

Dann:
1. Lies `src/app/api/messstellen/route.ts` um die aktuelle POST-Logik zu verstehen
2. Erkläre dem Nutzer kurz was beim Anlegen passiert (slug-Generierung, automatische Recherche)
3. Weise darauf hin, dass die Messstelle im Admin unter /admin/messstellen erscheint und der Status von PENDING auf RESEARCHING und dann COMPLETED wechselt
4. Wenn der Nutzer mehrere Messstellen hat, empfehle den XML-Import unter /admin/messstellen/import
