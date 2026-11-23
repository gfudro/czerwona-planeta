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
    music: 'Muzyka',
    win: 'Brawo!',
    next: 'Dalej',
    lose: 'Koniec',
    again: 'Jeszcze',
    mission: 'Misja',
    theEnd: 'Zwycięstwo!',
    // What to do now, shown next to the goal counter: two or three short words.
    // Keyed by "mission.goal".
    goalText: {
      '1.0': 'Zbierz złom',
      '1.1': 'Zbuduj kopułę',
      '1.2': 'Zrób osadnika',
      '1.3': 'Zbierz kryształy',
      '2.0': 'Zasyp gniazda',
      '3.0': 'Idź do rakiety',
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
