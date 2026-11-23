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
| Imapia Wielka, Królowa z Czerwonej Planety | 20 | 1k4 | 2 | Boss misji 5. Siedzi w ruinach pałacu z eskortą MAibawu. |
| Władca Kryształów | 25 | 2k4 | 3 | Boss finałowy w jaskiniach kryształowych (misja 6). |

Dwie rzeczy do poprawy na kartach:

- Władca Kryształów ma więcej serc i mocniejszy atak niż Imapia. Rozstrzygnięte 23.11.2026: zamieniamy kolejność, Imapia jest w misji 5, a finałem jest Władca w jaskiniach (misja 6).
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
- Poziomy zdobywa za pokonane stwory: każdy poziom daje +2 serca i +1 do ataku, maksymalnie 5 poziomów. Poziom przechodzi do kolejnych misji. Przy awansie dostaje tylko te 2 nowe serca, bez pełnego leczenia (Greg 23.11.2026, bo bohater sam wygrywał walki).
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
5. **Królowa.** Ruiny pałacu i walka z Imapią Wielką.
6. **Jaskinie.** Finał: zejście pod ziemię i walka z Władcą Kryształów.

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
- **Styl budynków i obiektów (od 0.5.0, po uwagach Grega):** cieniowanie światłem z lewej góry, 5–7 odcieni na materiał z ditheringiem, obrys w ciemniejszym odcieniu sąsiedniego koloru zamiast czarnej kreski, tekstury (cegły, nity, rdza, odbicia na szkle). Para, dym i blask rysowane bez obrysu. Narzędzia w `src/shading.js`.
- **Teren bez kratki (od 0.5.2):** logika mapy zostaje na kaflach, ale obraz nie. Skały, wydmy i szczeliny mają zaokrąglone, poszarpane szumem brzegi. Skały to płaskowyże z głazami i ścianą urwiska od dołu, rzucające cień na piasek. Szczeliny to ciągłe, poszarpane rozpadliny przez środki kafli. Kod w `src/terrain.js`.
- **Jednostki (od 0.6.0):** w stylu cieniowanym, każda z innym kształtem: osadnik ma szklany hełm-bańkę, butlę i kilof, piechur szeroką mosiężną zbroję z kominem i pięścią, strzelec długi płaszcz, kapelusz i długi karabin, bohater pomarańczową pelerynę, hełm z czerwonym pióropuszem i miecz, działo dwa duże koła i kocioł. Kod w `src/units.js`.
- **Bossowie (od 0.7.0):** Imapia jest wyższa od MAibawu (karmazynowa zbroja, turkusowy szpiczasty hełm z czerwonym okiem, poszarpane skrzydła, mechaniczne nogi ze szponami). Władca to największy sprite w grze: fioletowy kryształowy olbrzym w mosiężnej zbroi, korona z kryształów, czaszka z kłami, okrągły napierśnik z różowym sercem.
- **Jaskinie (misja 6):** ciemne fioletowo-szare dno z miękkimi ciemniejszymi plamami (szum, nie kafle), fioletowa skała, kryształy wyrastające ze ścian, jeziorka lawy (pomarańczowe z brązową skorupą, poświata na dnie). Kamyczki w kolorze skały.
- **Pałac Imapii (misja 5):** zbudowany ręcznie, nie losowo: zewnętrzny mur z trzema bramami, dwa rzędy kolumn, wewnętrzna sala tronowa.
- **Ruiny (od 0.6.0):** mury to poszarpane pasy kamienia między środkami kafli, o zmiennej wysokości (całe odcinki, wyszczerbione, zwalone kikuty), z gruzem dookoła. Logika nadal blokuje cały kafel.
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

## Dźwięk

Od 0.8.0, na prośbę Grega z 23.11.2026. Wszystko syntetyzowane w kodzie (Web Audio), bez plików, tak jak grafika. Kod w `src/audio.js`.

- **Efekty:** kliknięcie przycisku, wybór naszych jednostek, rozkaz ruchu i ataku, cios, strzał karabinu, działo (para, huk i uderzenie kuli), śmierć stwora i naszej jednostki, kryształy i złom przy lądowniku, budynek gotowy, nowa jednostka, robak wychodzi z gniazda, stwór zauważony (gwizd parowy), awans i upadek bohatera, pilnowane złoże, oswojenie Mabmii, zasypane gniazdo, cel zaliczony, wygrana i przegrana.
- **Gdzie słychać:** pełna głośność na ekranie, ciszej tuż za nim, z daleka nic. Lewo-prawo zgodnie z miejscem na ekranie. Ten sam dźwięk nie powtarza się częściej niż co kilkadziesiąt milisekund, żeby bitwa nie była hałasem.
- **Muzyka:** spokojna pętla (bas, pozytywka, cichy podkład, tykanie zegara). Na powierzchni a-moll, w jaskiniach niżej i ciemniej. Dużo ciszej niż efekty (zmierzone szczyty: efekty 0,06–0,36, muzyka 0,03).
- **Przełączniki** „Dźwięk” i „Muzyka” są w menu (na górnym pasku zabrakło miejsca na laptopie). Ustawienie zostaje w localStorage.
- Dźwięk startuje dopiero po pierwszym kliknięciu albo klawiszu, bo tak działają przeglądarki.

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
4. ✅ Misje 1 i 2 z docelową grafiką. Test na Arturze przesunięty po etapie 5.
5. ✅ Bohater, MAibawu, Strażnik, działo i misje 3–6. Greg 23.11.2026: robimy przed testem z Arturem.
   1. ✅ Bohater, działo z kuźnią, MAibawu i Strażnik, nowa grafika naszych jednostek w stylu cieniowanym (0.6.0).
   2. ✅ Misje 3 i 4 (0.6.0). Sprawdzone w Chrome.
   3. ✅ Misje 5 i 6 z Imapią i Władcą, ekran końca kampanii, menu na 6 misji (0.7.0). Sprawdzone w Chrome.
   4. ✅ Intro gry i odprawa przed każdą misją (0.10.0). Greg 23.11.2026: „zrób intro do samej gry i do każdej misji”.
6. Poprawki po teście z Arturem. ← tu jesteśmy (czekamy na test)

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
- **Cele po kolei,** każdy jako ikona z licznikiem i krótkim opisem obok (od 0.7.1, np. „Zbierz złom”; wszystkie opisy w `src/strings.js`, `goalText`): zbierz 60 złomu i postaw kopułę, miej 3 osadników, zbierz łącznie 100 kryształów.
- **Wrogowie:** brak.

**Misja 2: Robaki w kopułach**

- **Start:** lądownik, kopuła i warsztat zbrojny już stoją. 3 osadników, 2 piechurów, 1 strzelec, 150 kryształów, 100 złomu.
- **Mapa:** małe złoże i 1 wrak blisko bazy. 3 gniazda robaków 12–25 kafli od lądownika, schowane we mgle.
- **Robaki:** pierwszy wychodzi po 60 s, żeby Artur zdążył się rozejrzeć. Potem każde gniazdo wypuszcza małego robaka co 30 s, najwyżej 3 żywe na gniazdo. Najdalsze gniazdo raz wypuszcza dużego robaka.
- **Zasypywanie:** osadnik stoi przy gnieździe 5 s, widać pasek postępu. Cios w osadnika przerywa zasypywanie.
- **Cel:** zasyp 3 gniazda, licznik 0/3.

## Etap 5: specyfikacja

Rozpisane przez Claude Code 23.11.2026, robocze do sprawdzenia na teście.

**Bohater**

- Dołącza od misji 3 (przylatuje drugim lądownikiem). Misje 1 i 2 zostają bez zmian.
- Punkty doświadczenia za stwora, którego bohater dobije: robak mały 1, robak duży 2, MAibawu 2, Strażnik 3, boss 5.
- Poziomy: 2. poziom przy 3 punktach, 3. przy 7, 4. przy 12, 5. przy 18. Każdy poziom: +2 serca i +1 do ataku. Nad bohaterem widać gwiazdki poziomu.
- Poziom i punkty zapisują się w przeglądarce razem z postępem kampanii, także gdy misja jest przegrana.
- Gdy straci serca, pada (stwory go zostawiają), a po 20 s wstaje przy lądowniku z pełnymi sercami.

**Działo parowe i kuźnia**

- Działo przebija pancerz: zadaje pełny atak, obrona celu się nie liczy. Strzela kulą, która leci łukiem.
- Kuźnię osadnik może budować od misji 4.

**MAibawu**

- Patroluje trasę w ruinach w grupkach po 1–3. Wypatruje wroga z 6 kafli i atakuje pierwszy.
- Goni najdalej 10 kafli od swojej trasy, potem wraca na trasę.

**Strażnik**

- Stoi przy złożu, wypatruje wroga z 2 kafli i goni najdalej 3 kafle od swojego miejsca.
- Dopóki Strażnik stoi, osadnicy nie kopią z jego złoża (gra pokazuje, że złoże jest pilnowane).

Wersja 0.9.0, przebudowa po uwadze Grega z 23.11.2026: „zdecydowanie za łatwo”, „czemu bossowie nie mają obstawy”, „nie trzeba decyzji strategicznych”. Greg wybrał: ulepszenia w budynkach z wyborem, słabszy start, obstawę bossów. Liczby z kart bez zmian.

**Ulepszenia w budynkach (od misji 3)**

W każdym budynku dwa ulepszenia do wyboru. Wybór jednego zamyka drugie do końca misji. Ulepszenie kosztuje i trwa (badanie idzie obok szkolenia). Panel pokazuje dwa przyciski ze słowem „albo” między nimi, na każdym nazwa i pod nią krótki opis w jednej linii (np. „Miecze / Piechur bije mocniej”, od 0.9.1, opisy w `src/strings.js`, `upgradeText`), po wyborze zostaje tylko wybrane z procentem, potem z ptaszkiem.

| Budynek | Wybór | Działanie | Koszt (kryształy/złom), czas |
|---|---|---|---|
| Lądownik | Kilofy | osadnik niesie 15 zamiast 10 | 60/30, 20 s |
| | Buty | osadnicy szybsi o 0,7 | 40/40, 20 s |
| Kopuła | Zapasy | każda kopuła +2 miejsca (limit rośnie razem z nimi) | 0/80, 25 s |
| | Lecznica | nasze jednostki do 4 kafli od kopuły odzyskują 1 serce co 3 s | 60/60, 25 s |
| Warsztat | Miecze | piechur +2 do ataku | 100/60, 30 s |
| | Tarcze | piechur i strzelec +1 do obrony | 80/80, 30 s |
| Kuźnia | Lufy | strzelec i działo +2 do ataku | 100/100, 35 s |
| | Celowniki | strzelec i działo +1 do zasięgu | 80/100, 35 s |

Liczby w `CP.UPGRADES` w `src/data.js`.

**Tarcza bossa**

Boss nie odnosi ran, dopóki w promieniu 12 kafli stoi ktoś z jego straży (ta sama grupa). Widać to jako niebieską, migoczącą bańkę, a ciosy pokazują „0” i niski dźwięk. Ta sama zasada co przy Strażniku pilnującym złoża: najpierw trzeba rozbić straż. Bez tego bohater na 5. poziomie zabijał Władcę w 4 sekundy.

**Misja 3: Wraki**

- **Start:** lądownik, kopuła, warsztat. 3 osadników, 1 piechur, 1 strzelec, bohater. 250 kryształów, 200 złomu.
- **Mapa:** 64×48 kafli. Ruiny dawnej osady stworów: kamienne mury z przejściami. Za ruinami, w prawym górnym rogu, wrak rakiety wcześniejszej wyprawy.
- **Wrogowie:** 3 patrole MAibawu (2, 3 i 4 wojowników) i 3 MAibawu pilnujących rakiety. Bez gniazd robaków.
- **Cel:** rozbierz rakietę, czyli przywieź z niej 100 złomu (licznik 0/100). Osadnicy muszą tam dojść i wrócić, więc najpierw trzeba oczyścić drogę. Wcześniej wystarczyło dojść, a nieśmiertelny bohater przebiegał sam.

**Misja 4: Krystaliczne złoże**

- **Start:** lądownik, kopuła, warsztat. 3 osadników, 1 piechur, bohater. 300 kryształów, 280 złomu.
- **Mapa:** 48×48. Małe złoże i wrak przy bazie, duże złoże (1500) z Strażnikiem 20 kafli od bazy. Jedno gniazdo robaków po drodze (wypuszcza robaki co 45 s, nie trzeba go zasypywać).
- **Cele po kolei:** postaw kuźnię, pokonaj Strażnika, zbierz 200 kryształów z dużego złoża.

**Misja 5: Królowa**

- **Start:** lądownik, dwie kopuły, warsztat, kuźnia. 3 osadników, 1 piechur, 1 strzelec, bohater. 400 kryształów, 350 złomu, żeby od razu szkolić i ulepszać.
- **Mapa:** 64×48. Pałac w prawym górnym rogu: mur z bramami, kolumny, sala tronowa. Po drodze 2 patrole po 3 MAibawu.
- **Królowa i straż:** Imapia z 4 MAibawu przy boku, przy bramie pałacu 3 kolejnych. Wszyscy walczą razem i trzymają jej tarczę. Przy pierwszym ciosie Imapia przywołuje z sali tronowej jeszcze 4 MAibawu.
- **Napady:** od 120 s co 100 s z pałacu na bazę idzie 3 MAibawu, razem 4 napady.
- **Cel:** pokonaj Imapię, licznik 0/1. Imapia wypatruje wroga z 6 kafli i nie opuszcza pałacu dalej niż na 8 kafli.

**Misja 6: Jaskinie (finał)**

- **Start:** lądownik, dwie kopuły, warsztat, kuźnia. 3 osadników, 1 piechur, 1 strzelec, bohater. 450 kryształów, 400 złomu.
- **Mapa:** 64×48, pod ziemią: ciemna skała, kryształowe ściany i jeziorka lawy (nieprzechodnie). Dwa Strażniki przy złożach i gniazdo robaków w połowie drogi.
- **Władca Kryształów** w najgłębszej grocie, z 2 Strażnikami po bokach i 3 MAibawu. Przy pierwszym ciosie z głębi wychodzą 2 duże robaki i 2 MAibawu. Wypatruje wroga z 5 kafli i nie opuszcza groty dalej niż na 6 kafli.
- **Cel:** pokonaj Władcę, licznik 0/1. Po wygranej ekran końca kampanii.

**Sprawdzone w symulacji (bot w `tests/run.js`, bohater na 3. poziomie)**

- Misje 3, 5 i 6: sama startowa armia nie wygrywa (sprawdzone też z bohaterem na 1. i 5. poziomie).
- Bot, który zbiera, szkoli, kupuje ulepszenia (Miecze, Lufy, Lecznica, Kilofy) i atakuje po 4–5 minutach, wygrywa. W misjach 5 i 6 ostatkiem sił, bo bot walczy głupio: bez leczenia w Lecznicy, bez wyciągania stworów po kilka. Człowiek powinien wygrać pewniej. Jeśli będzie za trudno, najprościej zmniejszyć posiłki bossów.

## Intro i odprawy (0.10.0)

- **Historia gry:** przy pierwszym wejściu ekran z nazwą gry i przyciskiem „Start”. Potem 6 ujęć: rakieta w kosmosie, zbliżenie do Marsa, lądownik, stare wraki („Kto tu był przed nami?”), Mabmia, a na koniec groźne stwory w rzędzie. Po historii jest menu. Można ją obejrzeć jeszcze raz przyciskiem „Historia” w menu.
- **Odprawa przed misją:** 3–4 ujęcia po kliknięciu misji w menu. Kamera przelatuje nad prawdziwą mapą misji bez mgły i pokazuje bazę, wroga i cel. Po przegranej przycisk „Jeszcze” zaczyna misję od razu, bez odprawy.
- **Tekst i lektor:** każde ujęcie ma jedno krótkie zdanie (najwyżej 9 słów). Czyta je polski głos przeglądarki, w Chrome na Macu „Zosia”. Lektora wyłącza się przełącznikiem „Lektor” w menu. Bez lektora ujęcie trwa tyle, żeby dało się przeczytać zdanie.
- **Sterowanie:** klik w obraz, „Dalej”, spacja albo Enter przechodzą do następnego ujęcia. „Pomiń” albo Esc kończą intro.
- Zdania i ujęcia są w `CP.INTROS` w `src/intro.js`. Gdy Artur wymyśli imię bohatera, trzeba je wpisać w zdanie misji 3.

## Stan prac i ustalenia z budowy

Etapy 1–5 są zrobione (wersja 0.7.0), cała kampania 1–6 czeka na test z Arturem. Przy budowie trzeba było rozstrzygnąć kilka drobiazgów, których dokument nie opisywał. To robocze wybory do sprawdzenia na teście:

- **Opis celu (0.7.1):** obok licznika zawsze stoi 2–3 słowa, co teraz zrobić. W misji 4 ostatni cel ma ikonę dużego złoża zamiast zwykłego kryształu, bo myliła się z kryształami.
- **Nowa wersja:** przy podbiciu `CP.VERSION` w `src/data.js` trzeba też zmienić `?v=` przy skryptach w `index.html`, żeby przeglądarka nie zmieszała starych plików z nowymi.
- **Trudność misji 3–6** przebudowana w 0.9.0 (patrz „Etap 5: specyfikacja”).
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
- [x] 12 jednostek w ruchu bez przycinania w Chrome na laptopie. Klatka liczy się w 0,5 ms. Safari odpada (Greg 23.11.2026).

## Otwarte decyzje

- [ ] Nazwa gry. Robocza: Czerwona Planeta.
- [ ] Bohater: imię i wygląd wymyśla Artur. Do tego czasu tymczasowy „Bohater”: kapitan w mosiężnym hełmie z pióropuszem i pomarańczowej pelerynie.
- [x] Kolejność bossów: zamieniona. Misja 5 to Imapia, misja 6 (finał) to Władca Kryształów.
- [ ] Mabmia: tylko towarzysz czy daje bonus, np. odkrywa mgłę wokół siebie?
- [x] Kod Grodu jako baza czy start od zera. Start od zera z przeniesionymi narzędziami, szczegóły w „Technika i plan prac”.
- [ ] Karty dla naszych jednostek i bohatera w tym samym szablonie co stwory: robimy?
