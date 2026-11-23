# Czerwona Planeta — RTS dla Artura

RTS w pikselowym stylu Warcrafta 2 dla sześcioletniego Artura: osadnicy na steampunkowym Marsie kontra stwory z kart. Cały projekt jest w `DESIGN.md`. Przeczytaj go przed każdym większym krokiem.

## Zasady

- Interfejs po polsku. Tekst bezszeryfową czcionką, minimum 18 px, napisy pojedynczymi słowami. Artur czyta wolno. Wyjątek: przy liczniku celu stoi opis z 2–3 krótkich słów (np. „Kop duże złoże”), Greg 23.11.2026.
- Jedna strona HTML5 z canvasem, JavaScript, bez serwera. Postęp kampanii w localStorage. Gra ma działać po otwarciu w Chrome na laptopie (Safari Grega nie interesuje, 23.11.2026).
- Pixel art tworzysz sam w kodzie. Wzorem dla stworów są karty w `reference/karty/`: obejrzyj właściwą kartę, zanim narysujesz stwora.
- Serca, atak i obrona stworów są z kart i się nie zmieniają. Pozostałe liczby bierz z sekcji „Parametry startowe” w `DESIGN.md`; jeśli zmieniasz którąś przy strojeniu, zapisz zmianę w `DESIGN.md`.
- Pracujemy etapami z sekcji „Technika i plan prac”. Etap 1 jest skończony, gdy działa cała lista „Gotowość etapu 1”. Nie zaczynaj kolejnego etapu bez potwierdzenia.
- Kod Grodu leży w `~/Desktop/Projects/slowianie/grod`. Decyzja, co z niego wzięliśmy, jest w `DESIGN.md` w sekcji „Technika i plan prac”.
- Greg nie edytuje plików. Zmiany w `DESIGN.md` i `CLAUDE.md` wprowadzasz Ty na podstawie rozmowy.
- Kod, nazwy i komentarze po angielsku, interfejs i dokumenty po polsku.
- Punkty z sekcji „Otwarte decyzje” rozstrzyga Greg. Nie wybieraj za niego, tylko zapytaj, gdy któryś zablokuje pracę.
