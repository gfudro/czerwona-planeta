# Czerwona Planeta — dokument projektowy RTS-a dla Artura

Źródło prawdy: ten plik. Zmiany wprowadza Claude Code po rozmowie z Gregiem. Pierwotny eksport z dokumentu Claude Docs z 22.11.2026 (https://claude.ai/artifact/LUy8K3DYyDk9btBZjkvHMc), który nie jest już aktualizowany.

## Wizja i ustalenia

RTS w pikselowym stylu Warcrafta 2 dla Artura: osadnicy na steampunkowym Marsie odkrywają planetę i bronią się przed stworami z kart RPG. Gramy na laptopie w przeglądarce, myszą.

Ustalone:

- **Gatunek:** RTS jak Warcraft 2. Małe armie, po kilka jednostek, nie masówka jak w Red Alercie.
- **Świat:** Mars. Po naszej stronie ludzie, osadnicy Marsa. Przeciwnicy to stwory z kart.
- **Charakter:** na początek eksploracja. Bez drugiej wrogiej cywilizacji, która buduje bazy.
- **Platforma:** laptop, przeglądarka, mysz i klawiatura.
- **Aktywna pauza:** w pauzie zaznaczasz jednostki i wydajesz rozkazy.
- **Grafika:** pixel art rysowany kodem przez Claude Code, jak w Grodzie.

Robocze założenia, do skreślenia, jeśli coś nie pasuje: misje zamiast otwartego świata, dwa surowce, jeden bohater, statystyki prosto z kart, automatyczna pauza na widok wroga.

## Świat

Steampunkowy Mars z kart: rdzawe pustynie, dwa księżyce na niebie, szklane kopuły z zielenią, mosiężne rury i koła zębate. Ludzie dopiero zakładają tu osadę.

- **Osadnicy** to nasza strona: lądownik, kopuły-szklarnie, warsztaty parowe. Cel: przetrwać i poznać planetę.
- **Stwory Marsa** to rdzenni mieszkańcy. Nie budują baz. Jedne są przyjazne (Mabmia), inne pilnują swojego terenu (Strażnik), inne atakują (robaki, MAibawu).
- **Imapia Wielka**, królowa Marsa, jest celem całej kampanii.

Propozycja wątku: na kartach leżą rozbite łaziki, więc była tu już wcześniejsza wyprawa. Jej wraki to źródło złomu i zagadka na kampanię: co się z nimi stało?

## Bestiariusz

Liczby z kart przechodzą do gry bez zmian, żeby Artur rozpoznawał stwory z kart. Nowe jest tylko zachowanie na mapie. Karty: `reference/karty/`.

| Stwór | Serca | Atak | Obrona | Zachowanie w grze |
| --- | --- | --- | --- | --- |
| Mabmia, Przyjaciel z Czerwonej Planety | 7 | 1 | 0 | Neutralna, wędruje i szuka towarzystwa. Osadnik może ją oswoić, wtedy chodzi za nim. Nasze jednostki same jej nie atakują. |
| Robak Pustynny mały | 5 | 1k2 | 2 | Najczęstszy wróg. Szybki, wyłazi ze szczelin przy kopułach i z cienia budynków. |
| Robak Pustynny duży | 15 | 1k2 | 2 | Wolniejszy i wytrzymały. Pojawia się przy gniazdach w późniejszych misjach. |
| MAibawu, Wojownik z Czerwonej Planety | 9 | 2 | 2 | Patroluje ruiny po 1–3. Atakuje pierwszy, goni do granicy swojego terenu i wraca. |
| Strażnik krystalicznego biomu | 12 | 1k2−1 | 4 | Stoi na złożu kryształów, bardzo powolny. Atakuje dopiero, gdy ktoś podejdzie blisko. Zwykłe jednostki zadają mu po 1. |
| Władca Kryształów | 25 | 2k4 | 3 | Boss jaskiń kryształowych. |
| Imapia Wielka, Królowa z Czerwonej Planety | 20 | 1k4 | 2 | Boss finałowy. |

Dwie rzeczy do poprawy na kartach:

- Władca Kryształów ma więcej serc i mocniejszy atak niż Imapia, a to Imapia ma być bossem finałowym (decyzja w Otwartych decyzjach).
- Na karcie Władcy podtytuł i opis są skopiowane ze Strażnika („Krystaliczny Czołg z Głębi”, „relikt pustyni”).

## Nasza strona

Cztery typy jednostek, jeden bohater i cztery budynki, czyli tyle, ile Artur ogarnie bez instrukcji. Liczby są startowe, do strojenia na prototypie.

| Jednostka | Serca | Atak | Obrona | Zasięg | Rola |
| --- | --- | --- | --- | --- | --- |
| Osadnik | 5 | 1 | 0 | wręcz | Zbiera kryształy i złom, buduje, zasypuje gniazda robaków |
| Piechur w zbroi parowej | 12 | 4 | 2 | wręcz | Trzyma linię i osłania osadników |
| Strzelec z karabinem parowym | 7 | 3 | 0 | daleki | Bije z dystansu, słaby w zwarciu |
| Działo parowe | 10 | 5 | 1 | bardzo daleki | Wolne. Przebija pancerz, więc jest odpowiedzią na Strażnika i Władcę |
| Bohater | 15 | 1k6+2 | 2 | wręcz | Postać Artura, zdobywa poziomy |

**Bohater:**

- Imię i wygląd wymyśla Artur. Dostaje własną kartę w tym samym szablonie co stwory.
- Atak 1k6 bierze się z RPG. +2 sprawia, że jest najsilniejszy na polu.
- Poziomy zdobywa za pokonane stwory: każdy poziom daje +2 serca i +1 do ataku, maksymalnie 5 poziomów. Poziom przechodzi do kolejnych misji.
- Gdy straci wszystkie serca, nie ginie. Pada i po 20 sekundach wstaje przy lądowniku, a misja trwa dalej.

| Budynek | Odpowiednik w Warcrafcie 2 | Co daje |
| --- | --- | --- |
| Lądownik | ratusz | Baza od startu misji: tworzy osadników, przyjmuje surowce |
| Kopuła-szklarnia | farma | +4 do limitu jednostek |
| Warsztat zbrojny | koszary | Piechur i strzelec |
| Kuźnia parowa | kuźnia | Działo parowe |

## Ekonomia

Dwa surowce i limit jednostek. To mniej niż w Grodzie, bo tu sercem jest eksploracja i walka, nie łańcuchy produkcji.

- **Kryształy** (jak złoto w Warcrafcie 2): kopane ze złóż. Osadnik wchodzi do złoża i wraca z ładunkiem do lądownika. Duże złoża pilnuje Strażnik.
- **Złom** (jak drewno): z rozbieranych wraków łazików i rakiet wcześniejszej wyprawy. Wrak się wyczerpuje.
- **Limit jednostek:** lądownik daje 4 miejsca, każda kopuła +4. Twardy sufit to 12 jednostek na misję, żeby armie zostały małe.

Odległość ma znaczenie: osadnik chodzi pieszo, więc bliższe złoże daje więcej. Koszty są w Parametrach startowych, w okrągłych dziesiątkach, żeby Artur mógł liczyć.

## Walka

Każdy cios zadaje atak minus obrona celu, ale zawsze co najmniej 1. Ataki z kośćmi działają jak na kartach: gra rzuca kością przy każdym ciosie, a nad celem wyskakuje liczba obrażeń.

- **Bez rzutu na trafienie.** Rzut 50/50 z RPG odpada, każdy cios trafia. W czasie rzeczywistym pudła tylko spowalniają i mylą.
- **Tempo:** jeden cios co 1–1,5 sekundy, działo co 3 sekundy. Walka z grupką robaków ma trwać od kilku do kilkunastu sekund.
- **Serca** widać jako pasek nad jednostką i jako liczbę po najechaniu myszą.

Kontry, czyli powody, żeby mieć różne jednostki:

| Wróg | Problem | Odpowiedź |
| --- | --- | --- |
| Strażnik, Władca Kryształów | Pancerz 3–4, zwykłe ciosy zadają po 1 | Działo parowe, które przebija pancerz |
| Robaki | Szybkie, wyłażą znienacka | Strzelcy trafiają je, zanim dobiegną |
| MAibawu | Mocno bije wręcz | Piechur go zatrzymuje, strzelcy dobijają |

## Kampania

Sześć krótkich misji, każda na 10–20 minut, z jednym celem pokazanym ikoną i liczbą. Najpierw robimy misje 1 i 2, testujemy je na Arturze, dopiero potem resztę.

1. **Lądowanie.** Postaw kopułę, zrób 3 osadników, zbierz 100 kryształów. Spotkanie z Mabmią pokazuje, że nie każdy stwór to wróg. Bez walki, nauka sterowania.
2. **Robaki w kopułach.** Robaki wyłażą ze szczelin. Znajdź i zasyp 3 gniazda. Pierwsza walka, wchodzą piechur i strzelec.
3. **Wraki.** Dotrzyj do wraku wcześniejszej wyprawy przez ruiny patrolowane przez MAibawu. Eksploracja we mgle.
4. **Krystaliczne złoże.** Przejmij duże złoże pilnowane przez Strażnika. Wchodzi działo parowe.
5. **Jaskinie.** Zejście pod ziemię i walka z Władcą Kryształów.
6. **Królowa.** Finał z Imapią Wielką.

Przegrana zdarza się, gdy nie zostanie żadna jednostka ani lądownik. Wtedy misja zaczyna się od nowa, bez kar. Postęp zapisuje się po każdej wygranej misji.

## Sterowanie i interfejs

Mysz działa jak w Warcrafcie 2, a aktywna pauza jest pod spacją.

| Akcja | Sterowanie |
| --- | --- |
| Zaznacz jednostkę | lewy klik |
| Zaznacz grupę | przeciągnięcie ramki |
| Idź, atakuj, zbieraj | prawy klik, gra sama wie, co zrobić |
| Aktywna pauza | spacja |
| Kamera | strzałki, krawędź ekranu, klik w minimapę |
| Grupy jednostek | Ctrl + cyfra, opcjonalnie dla taty |
| Pełny ekran | sam się włącza po wybraniu misji; przycisk „Ekran” albo klawisz F |

**Aktywna pauza:** świat stoi, a zaznaczanie, rozkazy i budowanie działają. Gra sama pauzuje, gdy wróg pojawi się w zasięgu wzroku. Ta opcja jest domyślnie włączona i da się ją wyłączyć. Prędkości: wolno, normalnie, szybko.

Czytelność dla Artura:

- Napisy pojedynczymi słowami, dużą wyraźną czcionką. Cel misji to ikona i liczba, np. gniazdo 2/3.
- Liczby zamiast słów, gdzie się da: serca, surowce, limit jednostek.
- Zaznaczona jednostka ma wyraźną obwódkę, a rozkaz potwierdza znacznik na ziemi.
- Przyciski budowy z kosztem jak w Grodzie: nazwa i kolorowe liczby surowców.

## Grafika

Pixel art rysuje Claude Code w kodzie, jak w Grodzie. Każdy sprite to paleta i siatka pikseli zapisana w kodzie, więc wszystkie są spójne z definicji.

- **Widok:** z góry pod lekkim kątem, jak w Warcrafcie 2. Kafel 32 px, szczegóły w Parametrach startowych.
- **Animacje skromne:** chód na 2–4 klatki, atak jako wypad z błyskiem, śmierć jako obłoczek pyłu. Lewo i prawo przez odbicie lustrzane.
- **Paleta z kart:** rdza i ochra pustyni, mosiądz i miedź maszyn, turkus szkła kopuł, fiolet kryształów, granatowe niebo z dwoma księżycami.
- **Kolor drużyny:** nasi mają jeden wyraźny kolor na stroju, np. pomarańczowy, żeby od razu odróżniać ich od stworów. Nie turkus, bo to kolor MAibawu.

Stwory mają być rozpoznawalne z kart. Karty leżą w repozytorium w folderze `reference/karty` i są wzorem do sprite'ów:

| Stwór | Znaki rozpoznawcze w pikselach | Karta |
| --- | --- | --- |
| Mabmia | Czerwona kula z uśmiechem, niebieski i czerwony pompon, drewniane nogi, kamienie zamiast stóp | `mabmia.jpg` |
| Robak mały i duży | Piaskowy, segmentowany, wielkie oczy. Duży dwa razy większy | `robak-maly.jpg`, `robak-duzy.jpg` |
| MAibawu | Smukły cyborg w turkusie i miedzi, czerwone oko w hełmie, pazury | `maibawu.jpg` |
| Strażnik | Żółw w mosiężnym pancerzu z fioletowymi kryształami i manometrem | `straznik-krystalicznego-biomu.jpg` |
| Władca Kryształów | Fioletowy kryształowy olbrzym z koroną i mechanicznym sercem | `wladca-krysztalow.jpg` |
| Imapia Wielka | Karmazynowy pancerz, turkusowy hełm z czerwonym okiem, poszarpane skrzydła | `imapia-wielka.jpg` |

## Technika i plan prac

Gra to jedna strona HTML5 z canvasem w JavaScripcie, bez serwera, rozwijana w Claude Code jak Gród. Postęp kampanii zapisuje się w przeglądarce.

- **Mapa** z kafli, szukanie drogi algorytmem A*. Przy małych armiach wystarczy prosta zasada omijania się jednostek.
- **Mgła wojny** w trzech stanach: nieodkryte (czarne), odkryte (przyciemnione), widoczne.
- **Stwory** działają na prostych zachowaniach: stoją, patrolują, pilnują terenu, atakują w zasięgu, wracają. Nie ma przeciwnika, który buduje bazę.
- **Kod Grodu (rozstrzygnięte 22.11.2026):** start od zera. Z Grodu przeniesione do JavaScriptu: `PixelCanvas` z pomocnikami `hash` i `mix` (rysowanie pixel artu), losowanie z ziarnem (mulberry32) i zasady architektury: symulacja oddzielona od rysowania, stały krok symulacji, liczby w jednym pliku danych, polskie napisy w jednym pliku. Bez PixiJS, Vite i TypeScriptu, bo gra ma się otwierać z pliku bez budowania.
- **Pliki:** `index.html` i zwykłe skrypty `.js` dołączone po kolei, bez modułów ES (Chrome blokuje je przy otwieraniu z pliku).

Kolejność prac:

1. ✅ Szkielet: mapa, kamera, zaznaczanie, ruch, aktywna pauza, mgła wojny. Grafika zastępcza.
2. ✅ Ekonomia: osadnik, kryształy, złom, lądownik, kopuła.
3. ✅ Walka: piechur, strzelec, robaki i ich gniazda.
4. ✅ Misje 1 i 2 z docelową grafiką, potem test na Arturze. ← tu jesteśmy: czeka test
5. Poprawki po teście. Potem bohater, MAibawu, Strażnik, działo i misje 3–6.

## Parametry startowe

Od tych liczb Claude Code zaczyna, żeby nie musiał ich zgadywać. Wszystkie są do strojenia po teście z Arturem. Odległości podane w kaflach, czas w sekundach.

- **Ekran:** kafel 32 px rysowany w skali ×2 z ostrymi pikselami. Mapa misji 1 i 2 ma 48×48 kafli.
- **Język i tekst:** cały interfejs po polsku. Tekst czytelną czcionką bezszeryfową, nie pikselową, minimum 18 px. Artur czyta wolno, a pikselowe litery utrudniają czytanie.
- **Zbieranie:** osadnik niesie 10 kryształów albo 10 złomu, kopanie trwa 3 s. Małe złoże ma 400 kryształów, duże 1500, wrak 200 złomu.

| Jednostka | Prędkość (kafle/s) | Zasięg ataku | Cios co (s) | Wzrok | Koszt (kryształy / złom) | Produkcja (s) |
| --- | --- | --- | --- | --- | --- | --- |
| Osadnik | 2 | 1 | 1,5 | 5 | 50 / 0 | 10 |
| Piechur | 1,8 | 1 | 1,2 | 5 | 60 / 20 | 15 |
| Strzelec | 2 | 5 | 1,5 | 7 | 50 / 30 | 15 |
| Działo parowe | 1 | 7 | 3 | 8 | 80 / 80 | 25 |
| Bohater | 2,2 | 1 | 1 | 7 | — | — |

| Stwór | Prędkość (kafle/s) | Wykrywa wroga z (kafle) | Cios co (s) |
| --- | --- | --- | --- |
| Mabmia | 1 | — | — |
| Robak mały | 3 | 5 | 1 |
| Robak duży | 1,5 | 5 | 1,5 |
| MAibawu | 2 | 6, goni do 10 kafli od trasy patrolu | 1,2 |
| Strażnik | 0,5 | 2 | 2 |

| Budynek | Koszt (kryształy / złom) | Budowa (s) | Rozmiar (kafle) |
| --- | --- | --- | --- |
| Lądownik | — | — | 3×3 |
| Kopuła-szklarnia | 0 / 60 | 20 | 2×2 |
| Warsztat zbrojny | 100 / 80 | 30 | 3×3 |
| Kuźnia parowa | 120 / 120 | 40 | 3×3 |

## Misje 1 i 2: specyfikacja

Obie misje są rozpisane do budowy. Pozostałe rozpiszemy po teście z Arturem.

**Misja 1: Lądowanie**

- **Start:** lądownik w lewym dolnym rogu, 2 osadników, 50 kryształów, 0 złomu.
- **Mapa:** małe złoże 6 kafli od lądownika, 2 wraki 8–10 kafli od niego. Mabmia wędruje po środku mapy.
- **Cele po kolei,** każdy jako ikona z licznikiem: zbierz 60 złomu i postaw kopułę, miej 3 osadników, zbierz łącznie 100 kryształów.
- **Wrogowie:** brak.

**Misja 2: Robaki w kopułach**

- **Start:** lądownik, kopuła i warsztat zbrojny już stoją. 3 osadników, 2 piechurów, 1 strzelec, 150 kryształów, 100 złomu.
- **Mapa:** małe złoże i 1 wrak blisko bazy. 3 gniazda robaków 12–25 kafli od lądownika, schowane we mgle.
- **Robaki:** pierwszy wychodzi po 60 s, żeby Artur zdążył się rozejrzeć. Potem każde gniazdo wypuszcza małego robaka co 30 s, najwyżej 3 żywe na gniazdo. Najdalsze gniazdo raz wypuszcza dużego robaka.
- **Zasypywanie:** osadnik stoi przy gnieździe 5 s, widać pasek postępu. Cios w osadnika przerywa zasypywanie.
- **Cel:** zasyp 3 gniazda, licznik 0/3.

## Stan prac i ustalenia z budowy

Etapy 1–4 są zrobione (wersja 0.4.0). Misje 1 i 2 czekają na test z Arturem. Przy budowie trzeba było rozstrzygnąć kilka drobiazgów, których dokument nie opisywał. To robocze wybory do sprawdzenia na teście:

- **Budynki są niezniszczalne.** Robaki atakują tylko jednostki. Dzięki temu lądownik zawsze zostaje, a Artur nie traci bazy.
- **Przegrana:** nie zostaje żadna jednostka i nie da się zrobić osadnika (brak lądownika albo mniej niż 50 kryształów). Sam lądownik bez kryształów to przegrana, bo inaczej gra by stanęła.
- **Robaki** krążą przy swoim gnieździe i atakują to, co podejdzie na 5 kafli. Gonią najdalej 14 kafli od gniazda. Uderzony z daleka robak rusza na tego, kto go trafił.
- **Nasi wojownicy** (piechur, strzelec) sami atakują stwory, które widzą, gdy stoją bez rozkazu. Osadnicy sami nie walczą.
- **Gniazda wypuszczają robaki po kolei:** pierwsze po 60 s, każde następne 10 s później, potem co 30 s. Duży robak wychodzi z najdalszego gniazda jako jego trzeci robak.
- **Zasypywanie:** cios w zasypującego osadnika zeruje pasek gniazda, ale osadnik dalej zasypuje. Kilku osadników zasypuje szybciej.
- **Mabmia** w tej wersji tylko chodzi za oswojonym osadnikiem, bez bonusu (otwarta decyzja nadal czeka na Grega).
- **Autopauza** włącza się, gdy robak pierwszy raz pojawi się w zasięgu wzroku. Na minimapie widać wtedy czerwony sygnał.
- **Cel misji 1** pokazuje się w czterech krokach: złom 0/60, kopuła 0/1, osadnicy 2/3, kryształy 0/100.
- **Kolejka szkolenia:** najwyżej 5 jednostek w budynku. Koszt pobiera się przy dodaniu do kolejki, a kliknięcie w kolejkę oddaje surowce.
- **Mapy misji 1 i 2** są stałe (to samo ziarno losowania), żeby każdy test wyglądał tak samo.

## Gotowość etapu 1

Szkielet jest gotowy, gdy wszystkie punkty działają na grafice zastępczej:

- [x] Mapa przewija się strzałkami, krawędzią ekranu i klikiem w minimapę.
- [x] Lewy klik i ramka zaznaczają jednostki, a zaznaczone mają obwódkę.
- [x] Prawy klik wysyła jednostki. Omijają przeszkody i nie zakleszczają się w przejściu szerokim na 1 kafel.
- [x] Spacja pauzuje, a rozkazy wydane w pauzie wykonują się po wznowieniu.
- [x] Mgła wojny odkrywa się wokół jednostek w trzech stanach.
- [ ] 12 jednostek w ruchu bez przycinania w Chrome i Safari na laptopie. Chrome: klatka liczy się w 0,5 ms. Safari czeka na sprawdzenie przez Grega.

## Otwarte decyzje

- [ ] Nazwa gry. Robocza: Czerwona Planeta.
- [ ] Bohater: imię i wygląd. Propozycja: wymyśla Artur.
- [ ] Kolejność bossów: Władca Kryształów (25 serc, 2k4) jest silniejszy od Imapii (20 serc, 1k4). Zamienić kolejność czy dać Imapii specjalne zdolności?
- [ ] Mabmia: tylko towarzysz czy daje bonus, np. odkrywa mgłę wokół siebie?
- [x] Kod Grodu jako baza czy start od zera. Start od zera z przeniesionymi narzędziami, szczegóły w „Technika i plan prac”.
- [ ] Karty dla naszych jednostek i bohatera w tym samym szablonie co stwory: robimy?
