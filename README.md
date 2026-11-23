# Czerwona Planeta

RTS w pikselowym stylu dla Artura: osadnicy na steampunkowym Marsie kontra stwory z kart.

- Projekt gry: [DESIGN.md](DESIGN.md)
- Zasady pracy: [CLAUDE.md](CLAUDE.md)
- Karty stworów (wzór dla sprite'ów): `reference/karty/`

## Uruchomienie

Gra w sieci: https://gfudro.github.io/czerwona-planeta/ (aktualizuje się sama po każdym pushu na `main`).

Lokalnie: otwórz `index.html` w Chrome albo Safari. Bez serwera i instalacji.

Skróty: lewy klik i ramka zaznaczają, podwójny klik zaznacza wszystkich tego typu na ekranie, prawy klik (albo Ctrl + klik) robi to, co trzeba: idź, zbieraj, buduj, atakuj, zasyp gniazdo, oswój Mabmię. Prawy klik przy zaznaczonym budynku ustawia flagę zbiórki. Spacja to pauza, F albo przycisk „Ekran” włącza i wyłącza pełny ekran (włącza się też sam po wybraniu misji), Esc anuluje, strzałki i krawędź ekranu przewijają, Ctrl + cyfra zapamiętuje grupę, cyfra ją wybiera, dwa razy cyfra pokazuje grupę.

Dla taty: `?debug` pokazuje klatki na sekundę, `?mission=2` od razu włącza misję, `?sandbox` otwiera mapę testową z 12 jednostkami. Postęp kampanii jest w localStorage przeglądarki.

## Testy

`node tests/run.js` sprawdza symulację bez przeglądarki: szukanie drogi, wąskie przejście, pauzę, mgłę, zbieranie, budowę, szkolenie, walkę, Mabmię i rozgrywa obie misje do wygranej.
