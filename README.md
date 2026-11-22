# Czerwona Planeta

RTS w pikselowym stylu dla Artura: osadnicy na steampunkowym Marsie kontra stwory z kart.

- Projekt gry: [DESIGN.md](DESIGN.md)
- Zasady pracy: [CLAUDE.md](CLAUDE.md)
- Karty stworów (wzór dla sprite'ów): `reference/karty/`

## Uruchomienie

Otwórz `index.html` w Chrome albo Safari. Bez serwera i instalacji.

Skróty: lewy klik i ramka zaznaczają, podwójny klik zaznacza wszystkich tego typu na ekranie, prawy klik (albo Ctrl + klik) wysyła, spacja to pauza, strzałki i krawędź ekranu przewijają, Ctrl + cyfra zapamiętuje grupę, cyfra ją wybiera, dwa razy cyfra pokazuje grupę.

Dla taty: `index.html?debug` pokazuje klatki na sekundę, `index.html?seed=5` losuje inną mapę testową.

## Testy

`node tests/run.js` sprawdza symulację bez przeglądarki: szukanie drogi, wąskie przejście, pauzę i mgłę.
