// Every Polish word shown to the player lives here. Single words: Artur reads slowly.
(function (CP) {
  'use strict';

  CP.STR = {
    title: 'Czerwona Planeta',
    pause: 'Pauza',
    play: 'Gra',
    menu: 'Menu',
    slow: 'Wolno',
    normal: 'Normalnie',
    fast: 'Szybko',
    autoPause: 'Autopauza',
    fullscreen: 'Ekran',
    sound: 'Dźwięk',
    or: 'albo',
    music: 'Muzyka',
    win: 'Brawo!',
    next: 'Dalej',
    lose: 'Koniec',
    again: 'Jeszcze',
    mission: 'Misja',
    theEnd: 'Zwycięstwo!',
    // Building upgrades: one word each.
    // What each upgrade does, shown under its name: as short as possible.
    upgradeText: {
      picks: 'Niesie więcej',
      boots: 'Szybsi osadnicy',
      supplies: '+2 miejsca',
      infirmary: 'Leczy przy kopule',
      swords: 'Piechur bije mocniej',
      shields: 'Mniej ran',
      barrels: 'Mocniejsze strzały',
      sights: 'Dalsze strzały',
    },
    upgrades: {
      picks: 'Kilofy',
      boots: 'Buty',
      supplies: 'Zapasy',
      infirmary: 'Lecznica',
      swords: 'Miecze',
      shields: 'Tarcze',
      barrels: 'Lufy',
      sights: 'Celowniki',
    },
    // What to do now, shown next to the goal counter: two or three short words.
    // Keyed by "mission.goal".
    goalText: {
      '1.0': 'Zbierz złom',
      '1.1': 'Zbuduj kopułę',
      '1.2': 'Zrób osadnika',
      '1.3': 'Zbierz kryształy',
      '2.0': 'Zasyp gniazda',
      '3.0': 'Rozbierz rakietę',
      '4.0': 'Zbuduj kuźnię',
      '4.1': 'Pokonaj Strażnika',
      '4.2': 'Kop duże złoże',
      '5.0': 'Pokonaj Imapię',
      '6.0': 'Pokonaj Władcę',
    },
    units: {
      settler: 'Osadnik',
      infantry: 'Piechur',
      rifleman: 'Strzelec',
      cannon: 'Działo',
      hero: 'Bohater',
      mabmia: 'Mabmia',
      wormSmall: 'Robak',
      wormBig: 'Robaczysko',
      maibawu: 'MAibawu',
      guardian: 'Strażnik',
      imapia: 'Imapia',
      crystalLord: 'Władca',
    },
    buildings: {
      lander: 'Lądownik',
      dome: 'Kopuła',
      workshop: 'Warsztat',
      forge: 'Kuźnia',
    },
    things: {
      crystal: 'Kryształy',
      wreck: 'Wrak',
      nest: 'Gniazdo',
      rocket: 'Rakieta',
      bigCrystal: 'Złoże',
    },
  };
})(window.CP = window.CP || {});
