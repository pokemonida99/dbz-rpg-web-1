// Normal attacks (通常攻撃) from Z2 on, as the original plays them (Scene_Db_Battle_Anime, all.rb 54436-55107): the attacker's
// speed opens up to 18 kinds (set_ok_normalattackpattern 54436), one is drawn at random; most begin with a feint
// (けん制: anime 13 / 18 / 100001, half the time) and a way in to the middle (anime 1 5 7 8 11 12 15), then their own
// pattern, the blows (set_def_attack: anime 51-54 in a random order) and the hit (21) or the dodge (20). The way in, the
// feint and whether there is one are drawn again for every action (all.rb 53523).
// While variable 40 is 0 (Z1) src/anime.js keeps its four kinds (the remake's Z1 as it has always been).
// PAT below is anime_pattern 1-21, 51-54, 100001, 100101-100106 (all.rb 69111-71757, 73268-73311) turned into JS line by
// line (the scratch converter rb2js.py: case / when / if, @x → o.x); naRun is the frame loop around it (67470-67600):
// the pattern, then output_battle_anime (the attacker's @gx flips every frame, or @ax when the enemy attacks), then
// the effect pattern (120-123) at ray_x / ray_y; anime_pattern_fromat ends a pattern.
import { audio } from './core.js?v=20261108-1614';
import { Duel, draw } from './anime.js?v=20261108-1614';

const STANDARD_CHAX = -70, STANDARD_CHAY = 120, STANDARD_ENEX = 602, STANDARD_ENEY = 120;
const CENTER_CHAX = 240, CENTER_ENEX = 304;
const SPARK = 'Graphics/Pictures/戦闘アニメ.PNG', AFTER_BIG = 'Graphics/Pictures/戦闘アニメ96×96用回避.png';
const PIC = { '戦闘アニメ': SPARK, '戦闘アニメ96×96用回避': AFTER_BIG };

/* eslint-disable */
const PAT = {
  1(o) { // all.rb 69121
    if (o.f === 0) {
      o.change(0, 0);
      o.change(1, 0);
      o.chax = STANDARD_CHAX;
      o.chay = STANDARD_CHAY;
      o.enex = STANDARD_ENEX;
      o.eney = STANDARD_ENEY;
    } else if (o.f >= 1 && o.f <= 16) {
      o.ax = 18;
      o.gx = 18;
    } else if (o.f >= 17) {
      o.chax = CENTER_CHAX;
      o.enex = CENTER_ENEX;
      o.ax = 0;
      o.ay = 0;
      o.gx = 0;
      o.gy = 0;
      o.fmt = true;
      return 'next';
    }
  },
  2(o) { // all.rb 69144
    if (o.f === 0) {
      if (o.attackcourse === 0) {
        o.change(0, 5);
        o.change(1, 8);
        o.chax = STANDARD_ENEX;
        o.chay = STANDARD_CHAY + 60;
        o.enex = STANDARD_CHAX;
        o.eney = STANDARD_CHAY - 60;
      } else {
        o.change(1, 8);
        o.change(0, 5);
        o.chax = STANDARD_ENEX;
        o.chay = STANDARD_CHAY - 60;
        o.enex = STANDARD_CHAX;
        o.eney = STANDARD_CHAY + 60;
      }
    } else if (o.f >= 1 && o.f <= 20) {
      o.ax = -23;
      o.ay = 0;
      o.gx = -23;
      o.gy = 0;
    } else if (o.f >= 21 && o.f <= 40) {
      o.ax = -23;
      o.ay = -3;
      o.gx = -23;
      o.gy = 3;
    } else if (o.f >= 41) {
      o.ax = 0;
      o.ay = 0;
      o.gx = 0;
      o.gy = 0;
      o.fmt = true;
      return 'next';
    }
  },
  3(o) { // all.rb 69179
    if (o.f >= 0 && o.f <= 9) {
      if (o.f >= 0 && o.f <= 4) {
        o.effect_anime_pattern = 122;
      } else {
        o.effect_anime_pattern = 0;
      }
      o.ax = -20;
      o.ay = -6;
      o.gx = -20;
      o.gy = 6;
    } else if (o.f >= 10 && o.f <= 19) {
      o.ax = 20;
      o.ay = 6;
      o.gx = 20;
      o.gy = -6;
    } else if (o.f >= 20) {
      o.ax = 0;
      o.ay = 0;
      o.gx = 0;
      o.gy = 0;
      o.fmt = true;
      return 'next';
    }
  },
  4(o) { // all.rb 69205
    if (o.f >= 0 && o.f <= 9) {
      o.ax = 0;
      o.ay = -14;
      o.gx = 0;
      o.gy = 0;
    } else if (o.f >= 10 && o.f <= 14) {
      o.ax = -12;
      o.ay = -4;
    } else if (o.f >= 15 && o.f <= 17) {
      o.ax = -12;
      o.ay = 0;
    } else if (o.f >= 18 && o.f <= 24) {
      o.ax = -12;
      o.ay = 8;
    } else if (o.f >= 25 && o.f <= 29) {
      o.ax = 0;
      o.ay = 4;
    } else if (o.f >= 30 && o.f <= 34) {
      o.ax = 4;
      o.ay = 8;
    } else if (o.f >= 35 && o.f <= 42) {
      o.ax = 8;
      o.ay = 4;
    } else if (o.f >= 43 && o.f <= 50) {
      o.ax = 12;
      o.ay = 2;
    } else if (o.f >= 51) {
      o.ax = 0;
      o.ay = 0;
      o.gx = 0;
      o.gy = 0;
      o.fmt = true;
      return 'next';
    }
  },
  5(o) { // all.rb 69246
    { const _c1 = o.f;
    if (_c1 === 0) {
      o.change(0, 0);
      o.change(1, 0);
      o.chax = STANDARD_CHAX;
      o.chay = STANDARD_CHAY;
      o.enex = STANDARD_ENEX;
      o.eney = STANDARD_ENEY;
    } else if ((_c1 >= 1 && _c1 <= 4)) {
      o.ax = 18;
      o.gx = 18;
      o.ay = -4;
      o.gy = 4;
    } else if ((_c1 >= 5 && _c1 <= 8)) {
      o.ax = 18;
      o.gx = 18;
      o.ay = 4;
      o.gy = -4;
    } else if ((_c1 >= 9 && _c1 <= 12)) {
      o.ax = 18;
      o.gx = 18;
      o.ay = 4;
      o.gy = -4;
    } else if ((_c1 >= 13 && _c1 <= 16)) {
      o.ax = 18;
      o.gx = 18;
      o.ay = -4;
      o.gy = 4;
    } else if (_c1 === 17) {
      o.chax = CENTER_CHAX;
      o.enex = CENTER_ENEX;
      o.ax = 0;
      o.ay = 0;
      o.gx = 0;
      o.gy = 0;
      o.fmt = true;
      return 'next';
    } }
  },
  6(o) { // all.rb 69288
    { const _c1 = o.f;
    if (_c1 === 0) {
      o.change(0, 0);
      o.change(1, 0);
      o.ax = 0;
      o.gx = 0;
      o.ay = 0;
      o.gy = 0;
    } else if ((_c1 >= 1 && _c1 <= 6)) {
      o.ax = -24;
      o.gx = 0;
    } else if (_c1 === 7) {
      o.ax = -16;
      o.gx = 0;
    } else if ((_c1 >= 8 && _c1 <= 13)) {
      o.ax = 24;
      o.gx = 0;
    } else if (_c1 === 14) {
      o.ax = 16;
      o.gx = 0;
    } else if (_c1 === 15) {
      o.ax = 0;
      o.gx = 0;
      o.ay = 0;
      o.gy = 0;
      o.fmt = true;
      return 'next';
    } }
  },
  7(o) { // all.rb 69319
    { const _c1 = o.f;
    if (_c1 === 0) {
      o.change(0, 0);
      o.change(1, 0);
      o.ax = 0;
      o.gx = 0;
      o.ay = 0;
      o.gy = 0;
      o.chax = CENTER_CHAX;
      o.enex = CENTER_ENEX;
      o.chay = -200;
      o.eney = -200;
    } else if ((_c1 >= 1 && _c1 <= 20)) {
      o.ay = 16;
      o.gy = 16;
    } else if (_c1 === 21) {
      o.ax = 0;
      o.gx = 0;
      o.ay = 0;
      o.gy = 0;
      o.fmt = true;
      return 'next';
    } }
  },
  8(o) { // all.rb 69345
    { const _c1 = o.f;
    if (_c1 === 0) {
      o.change(0, 0);
      o.change(1, 0);
      o.chax = STANDARD_CHAX;
      o.chay = STANDARD_CHAY;
      o.enex = STANDARD_ENEX;
      o.eney = STANDARD_ENEY;
      if (o.attackcourse === 0) {
        o.chay = STANDARD_CHAY - 64;
        o.eney = STANDARD_ENEY + 64;
      } else {
        o.chay = STANDARD_CHAY + 64;
        o.eney = STANDARD_ENEY - 64;
      }
    } else if ((_c1 >= 1 && _c1 <= 16)) {
      o.ax = 18;
      o.gx = 18;
      o.ay = 4;
      o.gy = -4;
    } else if (_c1 === 17) {
      o.chax = CENTER_CHAX;
      o.enex = CENTER_ENEX;
      o.ax = 0;
      o.ay = 0;
      o.gx = 0;
      o.gy = 0;
      o.fmt = true;
      return 'next';
    } }
  },
  9(o) { // all.rb 69377
    { const _c1 = o.f;
    if ((_c1 >= 0 && _c1 <= 5)) {
      if (o.f >= 0 && o.f <= 4) {
        o.effect_anime_pattern = 122;
      } else {
        o.effect_anime_pattern = 0;
      }
      o.ax = -20;
      o.ay = -4;
      o.gx = -20;
      o.gy = 4;
    } else if ((_c1 >= 6 && _c1 <= 11)) {
      o.ax = 20;
      o.ay = 4;
      o.gx = 20;
      o.gy = -4;
      o.effect_anime_pattern = 0;
      o.effect_anime_frame = 0;
      o.effect_anime_type = 0;
    } else if ((_c1 >= 12 && _c1 <= 13)) {
      o.ax = 0;
      o.ay = 0;
      o.gx = 0;
      o.gy = 0;
    } else if ((_c1 >= 14 && _c1 <= 20)) {
      o.ax = -24;
      o.gx = -24;
      o.change(0, 16);
      o.change(1, 16);
      o.effect_anime_pattern = 122;
    } else if (_c1 === 21) {
      o.ax = -16;
      o.gx = -16;
    } else if (_c1 === 22) {
      o.effect_anime_pattern = 0;
      o.effect_anime_frame = 0;
      o.effect_anime_type = 0;
      o.ax = 16;
      o.gx = 16;
    } else if ((_c1 >= 23 && _c1 <= 29)) {
      o.ax = 24;
      o.gx = 24;
      o.change(0, 0);
      o.change(1, 0);
    } else if ((_c1 >= 30 && _c1 <= 31)) {
      o.ax = 0;
      o.ay = 0;
      o.gx = 0;
      o.gy = 0;
    } else if ((_c1 >= 32 && _c1 <= 38)) {
      o.ax = -24;
      o.gx = -24;
      o.change(0, 16);
      o.change(1, 16);
      o.effect_anime_pattern = 122;
    } else if (_c1 === 39) {
      o.ax = -16;
      o.gx = -16;
    } else if (_c1 === 40) {
      o.effect_anime_pattern = 0;
      o.effect_anime_frame = 0;
      o.effect_anime_type = 0;
      o.ax = 16;
      o.gx = 16;
    } else if ((_c1 >= 41 && _c1 <= 47)) {
      o.ax = 24;
      o.gx = 24;
      o.change(0, 0);
      o.change(1, 0);
    } else if (_c1 === 48) {
      o.ax = 0;
      o.ay = 0;
      o.gx = 0;
      o.gy = 0;
      o.effect_anime_pattern = 0;
      o.effect_anime_frame = 0;
      o.effect_anime_type = 0;
      o.fmt = true;
      return 'next';
    } }
  },
  10(o) { // all.rb 69460
    { const _c1 = o.f;
    if ((_c1 >= 0 && _c1 <= 5)) {
      if (o.f >= 0 && o.f <= 4) {
        o.effect_anime_pattern = 122;
      } else {
        o.effect_anime_pattern = 0;
      }
      o.ax = -20;
      o.ay = -4;
      o.gx = -20;
      o.gy = 4;
    } else if ((_c1 >= 6 && _c1 <= 11)) {
      o.ax = 20;
      o.ay = 4;
      o.gx = 20;
      o.gy = -4;
      o.effect_anime_pattern = 0;
      o.effect_anime_frame = 0;
      o.effect_anime_type = 0;
    } else if (_c1 === 12) {
      o.ax = 0;
      o.ay = 0;
      o.gx = 0;
      o.gy = 0;
      o.effect_anime_pattern = 0;
      o.effect_anime_frame = 0;
      o.effect_anime_type = 0;
      o.fmt = true;
      return 'next';
    } }
  },
  11(o) { // all.rb 69493
    { const _c1 = o.f;
    if (_c1 === 0) {
      o.change(0, 0);
      o.change(1, 0);
      o.chax = CENTER_CHAX - 460;
      o.chay = - 202;
      o.enex = CENTER_ENEX + 460;
      o.eney = - 202;
    } else if ((_c1 >= 1 && _c1 <= 23)) {
      o.ax = 20;
      o.ay = 14;
      o.gx = 20;
      o.gy = 14;
    } else if (_c1 === 24) {
      if (o.attackcourse === 0) {
        o.chay = STANDARD_CHAY;
      } else {
        o.eney = STANDARD_ENEY;
      }
      o.ax = 0;
      o.ay = 0;
      o.gx = 0;
      o.gy = 0;
      
      o.outNow = true;
      return 'next';
    } }
  },
  12(o) { // all.rb 69523
    { const _c1 = o.f;
    if (_c1 === 0) {
      o.change(0, 10);
      o.change(1, 10);
      o.chax = STANDARD_CHAX;
      o.chay = STANDARD_CHAY-24;
      o.enex = STANDARD_ENEX;
      o.eney = STANDARD_ENEY-24;
    } else if ((_c1 >= 1 && _c1 <= 20)) {
      o.ax = 18;
      o.gx = 18;
    } else if (_c1 === 21) {
      o.effect_anime_pattern = 122;
      o.ax = -2;
      o.gx = -2;
      o.ay = -6;
      o.gy = -4;
    } else if ((_c1 >= 22 && _c1 <= 26)) {
      o.ax = -2;
      o.gx = -2;
      o.ay = -16;
      o.gy = -14;
    } else if ((_c1 >= 27 && _c1 <= 31)) {
      o.effect_anime_pattern = 0;
      o.ax = -4;
      o.gx = -4;
      o.ay = -16;
      o.gy = -14;
    } else if ((_c1 >= 32 && _c1 <= 40)) {
      o.ax = -6;
      o.gx = -6;
      o.ay = -16;
      o.gy = -14;
    } else if (_c1 === 41) {
      o.ax = 0;
      o.gx = 0;
      o.ay = 0;
      o.gy = 0;
      o.chax = CENTER_CHAX - 80;
      o.enex = CENTER_ENEX + 80;
      o.chay = -200;
      o.eney = -200;
      o.change(0, 0);
      o.change(1, 0);
    } else if ((_c1 >= 42 && _c1 <= 60)) {
      o.ax = -4;
      o.gx = -4;
      o.ay = 18;
      o.gy = 14;
    } else if ((_c1 >= 62 && _c1 <= 71)) {
      o.ax = 16;
      o.gx = 16;
      o.ay = -4;
      o.gy = 4;
    } else if (_c1 === 72) {
      o.effect_anime_pattern = 0;
      o.ax = 0;
      o.ay = 0;
      o.gx = 0;
      o.gy = 0;
      o.fmt = true;
      return 'next';
    } }
  },
  13(o) { // all.rb 69593
    { const _c1 = o.f;
    if (_c1 === 0) {
      o.change(0, 10);
      o.change(1, 10);
      o.chax = STANDARD_CHAX;
      o.chay = STANDARD_CHAY;
      o.enex = STANDARD_ENEX;
      o.eney = STANDARD_ENEY;
      if (o.attackcourse === 0) {
        o.chay = STANDARD_CHAY - 88;
        o.eney = STANDARD_ENEY + 12;
      } else {
        o.chay = STANDARD_CHAY + 12;
        o.eney = STANDARD_ENEY - 88;
      }
    } else if ((_c1 >= 1 && _c1 <= 17)) {
      o.ax = 18;
      o.gx = 18;
      o.ay = 2;
      o.gy = -2;
    } else if (_c1 === 18) {
      o.ax = 16;
      o.gx = 16;
      o.ay = 2;
      o.gy = -2;
    } else if (_c1 === 19) {
      o.ax = 14;
      o.gx = 14;
      o.ay = 2;
      o.gy = -2;
    } else if (_c1 === 20) {
      o.ax = 12;
      o.gx = 12;
      o.ay = 2;
      o.gy = -2;
    } else if (_c1 === 21) {
      o.ax = 12;
      o.gx = 12;
      o.ay = 4;
      o.gy = -4;
    } else if (_c1 === 22) {
      o.ax = 6;
      o.gx = 6;
      o.ay = 4;
      o.gy = -4;
    } else if ((_c1 >= 23 && _c1 <= 26)) {
      o.effect_anime_pattern = 122;
      o.ax = 0;
      o.gx = 0;
      o.ay = 2;
      o.gy = -2;
    } else if (_c1 === 27) {
      o.ax = -6;
      o.gx = -6;
      o.ay = 4;
      o.gy = -4;
    } else if (_c1 === 28) {
      o.ax = -12;
      o.gx = -12;
      o.ay = 4;
      o.gy = -4;
    } else if (_c1 === 29) {
      o.ax = -12;
      o.gx = -12;
      o.ay = 2;
      o.gy = -2;
    } else if (_c1 === 30) {
      o.effect_anime_pattern = 0;
      o.ax = -14;
      o.gx = -14;
      o.ay = 2;
      o.gy = -2;
    } else if (_c1 === 31) {
      o.ax = -16;
      o.gx = -16;
      o.ay = 2;
      o.gy = -2;
    } else if ((_c1 >= 32 && _c1 <= 48)) {
      o.ax = -18;
      o.gx = -18;
      o.ay = 2;
      o.gy = -2;
    } else if ((_c1 >= 49 && _c1 <= 65)) {
      o.ax = 18;
      o.gx = 18;
      o.ay = -2;
      o.gy = 2;
    } else if (_c1 === 66) {
      o.ax = 16;
      o.gx = 16;
      o.ay = -2;
      o.gy = 2;
    } else if (_c1 === 67) {
      o.ax = 14;
      o.gx = 14;
      o.ay = -2;
      o.gy = 2;
    } else if (_c1 === 68) {
      o.ax = 12;
      o.gx = 12;
      o.ay = -2;
      o.gy = 2;
    } else if (_c1 === 69) {
      o.ax = 12;
      o.gx = 12;
      o.ay = -4;
      o.gy = 4;
    } else if (_c1 === 70) {
      o.ax = 6;
      o.gx = 6;
      o.ay = -4;
      o.gy = 4;
    } else if ((_c1 >= 71 && _c1 <= 74)) {
      o.effect_anime_pattern = 122;
      o.ax = 0;
      o.gx = 0;
      o.ay = -2;
      o.gy = 2;
    } else if (_c1 === 75) {
      o.ax = -6;
      o.gx = -6;
      o.ay = -4;
      o.gy = 4;
    } else if (_c1 === 76) {
      o.ax = -12;
      o.gx = -12;
      o.ay = -4;
      o.gy = 4;
    } else if (_c1 === 77) {
      o.ax = -12;
      o.gx = -12;
      o.ay = -2;
      o.gy = 2;
    } else if (_c1 === 78) {
      o.effect_anime_pattern = 0;
      o.ax = -14;
      o.gx = -14;
      o.ay = -2;
      o.gy = 2;
    } else if (_c1 === 79) {
      o.ax = -16;
      o.gx = -16;
      o.ay = -2;
      o.gy = 2;
    } else if ((_c1 >= 80 && _c1 <= 96)) {
      o.ax = -18;
      o.gx = -18;
      o.ay = -2;
      o.gy = 2;
    } else if (_c1 === 100) {
      o.ax = 0;
      o.ay = 0;
      o.gx = 0;
      o.gy = 0;
      o.fmt = true;
      return 'next';
    } }
  },
  14(o) { // all.rb 69756
    { const _c1 = o.f;
    if (_c1 === 0) {
      o.change(0, 0);
      o.change(1, 0);
      o.ax = 0;
      o.gx = 0;
      o.ay = 0;
      o.gy = 0;
    } else if ((_c1 >= 1 && _c1 <= 2)) {
      o.ax = -24;
      o.gx = 24;
      o.ay = 4;
      o.gy = -4;
    } else if ((_c1 >= 3 && _c1 <= 4)) {
      o.ax = -24;
      o.gx = 24;
      o.ay = 0;
      o.gy = 0;
    } else if ((_c1 >= 5 && _c1 <= 6)) {
      o.ax = -24;
      o.gx = 24;
      o.ay = -4;
      o.gy = 4;
    } else if (_c1 === 7) {
      o.ax = 0;
      o.gx = 0;
      o.ay = 0;
      o.gy = 0;
    } else if ((_c1 >= 8 && _c1 <= 21)) {
      o.ax = 8;
      o.gx = -8;
      o.ry = 480/2-90;
      o.rx = o.enex;
      { const _c2 = o.f;
      if (_c2 === 9) {
        o.effect_anime_pattern = 123;
        o.seStop();
        o.se('Z3 打撃');
        o.change(0, 3);
        o.change(1, 16);
      } else if (_c2 === 13) {
        o.effect_anime_pattern = 123;
        o.se('Z3 打撃');
        o.change(0, 1);
        o.change(1, 16);
      } else if (_c2 === 17) {
        o.effect_anime_pattern = 123;
        o.se('Z3 打撃');
        o.change(0, 4);
        o.change(1, 16);
      } else if (_c2 === 21) {
        o.change(0, 2);
        o.change(1, 16);
      } else if (_c2 === 11 || _c2 === 15 || _c2 === 19) {
        o.change(0, 0);
        o.change(1, 0);
        o.effect_anime_pattern = 0;
        o.effect_anime_frame = 0;
      } }
    } else if (_c1 === 22) {
      o.ax = 0;
      o.gx = 0;
      o.ay = 0;
      o.gy = 0;
      o.fmt = true;
      return 'next';
    } }
  },
  15(o) { // all.rb 69837
    { const _c1 = o.f;
    if (_c1 === 0) {
      o.change(0, 10);
      o.change(1, 10);
      o.chax = STANDARD_CHAX;
      o.chay = STANDARD_CHAY-128;
      o.enex = STANDARD_ENEX;
      o.eney = STANDARD_ENEY-128;
    } else if ((_c1 >= 1 && _c1 <= 18)) {
      o.ax = 20;
      o.gx = 18;
    } else if ((_c1 >= 19 && _c1 <= 20)) {
      o.ax = 0;
      o.ay = -600;
      o.gx = 18;
    } else if ((_c1 >= 21 && _c1 <= 36)) {
      o.gx = 0;
      o.ax = 0;
      o.ay = 0;
      if (o.attackcourse === 0) {
        o.ry = STANDARD_CHAY + 24;
        o.rx = CENTER_CHAX + 8;
      } else {
        o.ry = STANDARD_ENEY + 24;
        o.rx = CENTER_ENEX + 24;
      }
      if (o.f % 4 === 0) {
        o.kaihi('a', o.rx,o.ry);
      }
    } else if ((_c1 >= 37 && _c1 <= 53)) {
      o.gy = -600;
      if (o.attackcourse === 0) {
        o.change(0, 0);
        o.chax = CENTER_CHAX;
        o.chay = STANDARD_CHAY;
      } else {
        o.change(0, 0);
        o.enex = CENTER_ENEX;
        o.eney = STANDARD_ENEY;
      }
      if (o.attackcourse === 0) {
        o.ry = STANDARD_ENEY + 24;
        o.rx = CENTER_ENEX + 24;
      } else {
        o.ry = STANDARD_CHAY + 24;
        o.rx = CENTER_CHAX + 8;
      }
      if (o.f % 4 === 0) {
        o.kaihi('g', o.rx,o.ry);
      }
    } else if (_c1 === 54) {
      o.ax = 0;
      o.gx = 0;
      o.ay = 0;
      o.gy = 0;
      o.effect_anime_pattern = 0;
      if (o.attackcourse === 0) {
        o.change(1, 0);
        o.enex = CENTER_ENEX;
        o.eney = STANDARD_ENEY;
      } else {
        o.change(1, 0);
        o.chax = CENTER_CHAX;
        o.chay = STANDARD_CHAY;
      }
    } else if (_c1 === 55) {
      o.ax = 0;
      o.ay = 0;
      o.gx = 0;
      o.gy = 0;
      o.fmt = true;
      return 'next';
    } }
  },
  16(o) { // all.rb 69931
    { const _c1 = o.f;
    if (_c1 === 0) {
      o.change(0, 0);
      o.change(1, 0);
      o.ax = 0;
      o.gx = 0;
      o.ay = 0;
      o.gy = 0;
    } else if ((_c1 >= 1 && _c1 <= 13)) {
      o.ry = 480/2-90;
      o.rx = o.enex;
      { const _c2 = o.f;
      if (_c2 === 1) {
        o.seStop();
        o.se('Z3 打撃');
        o.change(0, 2);
        o.change(1, 16);
      } else if (_c2 === 5) {
        o.se('Z3 打撃');
        o.change(0, 3);
        o.change(1, 16);
      } else if (_c2 === 9) {
        o.se('Z3 打撃');
        o.change(0, 1);
        o.change(1, 16);
      } else if (_c2 === 13) {
        o.change(0, 4);
        o.change(1, 16);
      } else if (_c2 === 3 || _c2 === 7 || _c2 === 11) {
        o.change(0, 0);
        o.change(1, 0);
        o.effect_anime_pattern = 0;
        o.effect_anime_frame = 0;
      } }
    } else if (_c1 === 14) {
      o.ax = 0;
      o.gx = 0;
      o.ay = 0;
      o.gy = 0;
      o.fmt = true;
      return 'next';
    } }
  },
  17(o) { // all.rb 69989
    let sframe;
    { const _c1 = o.f;
    if (_c1 === 0) {
      o.change(0, 0);
      o.change(1, 0);
      o.ax = 0;
      o.gx = 0;
      o.ay = 0;
      o.gy = 0;
    } else if ((_c1 >= 1 && _c1 <= 13)) {
      o.ry = 480/2-90;
      o.rx = o.enex;
      { const _c2 = o.f;
      if (_c2 === 1) {
        o.seStop();
        o.se('Z3 打撃');
        o.change(0, 2);
        o.change(1, 16);
      } else if (_c2 === 5) {
        o.se('Z3 打撃');
        o.change(0, 3);
        o.change(1, 16);
      } else if (_c2 === 9) {
        o.se('Z3 打撃');
        o.change(0, 1);
        o.change(1, 16);
      } else if (_c2 === 13) {
        o.change(0, 4);
        o.change(1, 16);
      } else if (_c2 === 3 || _c2 === 7 || _c2 === 11) {
        o.change(0, 0);
        o.change(1, 0);
        o.effect_anime_pattern = 0;
        o.effect_anime_frame = 0;
      } }
    } else if (_c1 === 14) {
      o.change(0, 0);
      o.change(1, 0);
    } else if ((_c1 >= 15 && _c1 <= 20)) {
      sframe = 15;
      o.ry = STANDARD_ENEY + 32;
      o.rx = CENTER_ENEX + 16;
      { const _c3 = (o.f - sframe);
      if (_c3 === 0) {
        o.change(0, 16);
        o.change(1, 16);
      } else if (_c3 === 1) {
        o.effect_anime_pattern = 123;
      } else if (_c3 === 4) {
        o.effect_anime_pattern = 0;
      } }
      o.ax = -20;
      o.ay = -4;
      o.gx = -20;
      o.gy = 4;
    } else if ((_c1 >= 21 && _c1 <= 26)) {
      sframe = 21;
      { const _c4 = (o.f - sframe);
      if (_c4 === 0) {
        o.change(0, 0);
        o.change(1, 0);
      } }
      o.ax = 20;
      o.ay = 4;
      o.gx = 20;
      o.gy = -4;
    } else if (_c1 === 27) {
      o.ax = 0;
      o.ay = 0;
      o.gx = 0;
      o.gy = 0;
      o.change(0, Math.floor(Math.random() * 4) + 1);
    } else if (_c1 === 28) {
      o.ax = 0;
      o.ay = 0;
      o.gx = 0;
      o.gy = 0;
      o.effect_anime_pattern = 0;
      o.effect_anime_frame = 0;
      o.effect_anime_type = 0;
      o.fmt = true;
      return 'next';
    } }
  },
  18(o) { // all.rb 70095
    o.ry = STANDARD_ENEY - 34;
    o.rx = CENTER_ENEX - 10;
    { const _c1 = o.f;
    if (_c1 === 0) {
      o.change(0, 10);
      o.change(1, 10);
      o.chax = STANDARD_CHAX;
      o.chay = STANDARD_CHAY - 48;
      o.enex = STANDARD_ENEX;
      o.eney = STANDARD_ENEY - 48;
    } else if ((_c1 >= 1 && _c1 <= 10)) {
      o.ax = 18;
      o.gx = 18;
      o.ay = -4;
      o.gy = -4;
    } else if ((_c1 >= 11 && _c1 <= 17)) {
      o.ax = 18;
      o.gx = 18;
      o.ay = -2;
      o.gy = -2;
    } else if (_c1 === 18) {
      o.ax = 16;
      o.gx = 16;
      o.ay = -2;
      o.gy = -2;
    } else if (_c1 === 19) {
      o.ax = 14;
      o.gx = 14;
      o.ay = -2;
      o.gy = -2;
    } else if (_c1 === 20) {
      o.ax = 12;
      o.gx = 12;
      o.ay = -2;
      o.gy = -2;
    } else if (_c1 === 21) {
      o.ax = 12;
      o.gx = 12;
      o.ay = 0;
      o.gy = 0;
    } else if (_c1 === 22) {
      o.ax = 6;
      o.gx = 6;
      o.ay = 4;
      o.gy = 4;
    } else if (_c1 === 23) {
      o.effect_anime_pattern = 123;
      o.ax = -6;
      o.gx = -6;
      o.ay = 0;
      o.gy = 0;
    } else if (_c1 === 24) {
      o.ax = -12;
      o.gx = -12;
      o.ay = 2;
      o.gy = 2;
    } else if (_c1 === 25) {
      o.ax = -12;
      o.gx = -12;
      o.ay = 2;
      o.gy = 2;
    } else if (_c1 === 26) {
      o.effect_anime_pattern = 0;
      o.ax = -14;
      o.gx = -14;
      o.ay = 2;
      o.gy = 2;
    } else if (_c1 === 27) {
      o.ax = -16;
      o.gx = -16;
      o.ay = 4;
      o.gy = 4;
    } else if ((_c1 >= 28 && _c1 <= 44)) {
      o.ax = -18;
      o.gx = -18;
      o.ay = 4;
      o.gy = 4;
    } else if (_c1 === 45) {
      o.ax = 0;
      o.ay = 0;
      o.gx = 0;
      o.gy = 0;
      o.fmt = true;
      return 'next';
    } }
  },
  19(o) { // all.rb 70194
    let idoux, idouy, kaihityouseix, kaihityouseiy, mikatatyouseix, picture, rect, sframe, tyouseix;
    if (o.attackcourse === 0) {
      tyouseix = 192;
    } else {
      tyouseix = -192;
    }
    o.ry = o.eney + 34;
    o.rx = o.enex - 10;
    mikatatyouseix = 72;
    kaihityouseiy = 26;
    kaihityouseix = 16;
    idoux = [CENTER_ENEX,CENTER_ENEX + tyouseix,CENTER_ENEX + tyouseix];
    idouy = [STANDARD_ENEY,STANDARD_ENEY+48,STANDARD_ENEY-112];
    { const _c1 = o.f;
    if (_c1 === 0) {
      o.se('Z3 避ける');
      if (o.effect_anime_frame % 4 === 0) {
        picture = '戦闘アニメ';
        rect = [0,48, 64, 64];
        o.blt(idoux[0]+kaihityouseix-mikatatyouseix,idouy[0]+kaihityouseiy, picture, rect);
        o.blt(idoux[0]+kaihityouseix,idouy[0]+kaihityouseiy, picture, rect);
      }
      o.chay = -200;
      o.eney = -200;
    } else if ((_c1 >= 1 && _c1 <= 9)) {
      if (o.effect_anime_frame % 4 === 0) {
        picture = '戦闘アニメ';
        rect = [0,48, 64, 64];
        o.blt(idoux[0]+kaihityouseix-mikatatyouseix,idouy[0]+kaihityouseiy, picture, rect);
        o.blt(idoux[0]+kaihityouseix,idouy[0]+kaihityouseiy, picture, rect);
      }
    } else if ((_c1 >= 11 && _c1 <= 19)) {
      if (o.effect_anime_frame % 4 === 0) {
        picture = '戦闘アニメ';
        rect = [0,48, 64, 64];
        o.blt(idoux[1]+kaihityouseix-mikatatyouseix,idouy[1]+kaihityouseiy, picture, rect);
        o.blt(idoux[1]+kaihityouseix,idouy[1]+kaihityouseiy, picture, rect);
      }
    } else if (_c1 === 20) {
      o.chax = idoux[1]-mikatatyouseix;
      o.enex = idoux[1];
      o.chay = idouy[1];
      o.eney = idouy[1];
    } else if ((_c1 >= 21 && _c1 <= 30)) {
      sframe = 21;
      { const _c2 = (o.f - sframe);
      if (_c2 === 0) {
        o.effect_anime_pattern = 123;
        o.effect_anime_frame = 0;
        o.seStop();
        o.se('Z3 打撃');
        o.change(0, 1);
        o.change(1, 16);
      } else if (_c2 === 2 || _c2 === 5 || _c2 === 8) {
        o.effect_anime_pattern = 0;
        o.change(0, 0);
        o.change(1, 0);
      } else if (_c2 === 3) {
        o.effect_anime_pattern = 123;
        o.effect_anime_frame = 0;
        o.se('Z3 打撃');
        o.change(0, 4);
        o.change(1, 16);
      } else if (_c2 === 6) {
        o.effect_anime_pattern = 123;
        o.effect_anime_frame = 0;
        o.se('Z3 打撃');
        o.change(0, 2);
        o.change(1, 16);
      } else if (_c2 === 9) {
        o.effect_anime_pattern = 123;
        o.effect_anime_frame = 0;
        o.se('Z3 打撃');
        o.change(0, 3);
        o.change(1, 16);
      } }
    } else if (_c1 === 31) {
      o.effect_anime_pattern = 0;
      o.effect_anime_frame = 0;
      o.change(0, 0);
      o.change(1, 0);
      o.se('Z3 避ける');
    } else if ((_c1 >= 32 && _c1 <= 40)) {
      o.chay = -200;
      o.eney = -200;
      if (o.effect_anime_frame % 4 === 0) {
        picture = '戦闘アニメ';
        rect = [0,48, 64, 64];
        o.blt(idoux[1]+kaihityouseix-mikatatyouseix,idouy[1]+kaihityouseiy, picture, rect);
        o.blt(idoux[1]+kaihityouseix,idouy[1]+kaihityouseiy, picture, rect);
      }
    } else if ((_c1 >= 41 && _c1 <= 49)) {
      if (o.effect_anime_frame % 4 === 0) {
        picture = '戦闘アニメ';
        rect = [0,48, 64, 64];
        o.blt(idoux[2]+kaihityouseix-mikatatyouseix,idouy[2]+kaihityouseiy, picture, rect);
        o.blt(idoux[2]+kaihityouseix,idouy[2]+kaihityouseiy, picture, rect);
      }
    } else if (_c1 === 50) {
      o.chax = idoux[2]-mikatatyouseix;
      o.enex = idoux[2];
      o.chay = idouy[2];
      o.eney = idouy[2];
    } else if ((_c1 >= 51 && _c1 <= 60)) {
      sframe = 51;
      { const _c3 = (o.f - sframe);
      if (_c3 === 0) {
        o.effect_anime_pattern = 123;
        o.effect_anime_frame = 0;
        o.seStop();
        o.se('Z3 打撃');
        o.change(0, 1);
        o.change(1, 16);
      } else if (_c3 === 2 || _c3 === 5 || _c3 === 8) {
        o.effect_anime_pattern = 0;
        o.effect_anime_frame = 0;
        o.change(0, 0);
        o.change(1, 0);
      } else if (_c3 === 3) {
        o.effect_anime_pattern = 123;
        o.effect_anime_frame = 0;
        o.se('Z3 打撃');
        o.change(0, 4);
        o.change(1, 16);
      } else if (_c3 === 6) {
        o.effect_anime_pattern = 123;
        o.effect_anime_frame = 0;
        o.se('Z3 打撃');
        o.change(0, 2);
        o.change(1, 16);
      } else if (_c3 === 9) {
        o.effect_anime_pattern = 123;
        o.se('Z3 打撃');
        o.change(0, 3);
        o.change(1, 16);
      } }
    } else if (_c1 === 61) {
      o.effect_anime_pattern = 0;
      o.effect_anime_frame = 0;
      o.change(0, 0);
      o.change(1, 0);
      o.se('Z3 避ける');
    } else if ((_c1 >= 62 && _c1 <= 70)) {
      o.chay = -200;
      o.eney = -200;
      if (o.effect_anime_frame % 4 === 0) {
        picture = '戦闘アニメ';
        rect = [0,48, 64, 64];
        o.blt(idoux[2]+kaihityouseix-mikatatyouseix,idouy[2]+kaihityouseiy, picture, rect);
        o.blt(idoux[2]+kaihityouseix,idouy[2]+kaihityouseiy, picture, rect);
      }
    } else if ((_c1 >= 71 && _c1 <= 79)) {
      if (o.effect_anime_frame % 4 === 0) {
        picture = '戦闘アニメ';
        rect = [0,48, 64, 64];
        o.blt(idoux[0]+kaihityouseix-mikatatyouseix,idouy[0]+kaihityouseiy, picture, rect);
        o.blt(idoux[0]+kaihityouseix,idouy[0]+kaihityouseiy, picture, rect);
      }
    } else if (_c1 === 80) {
      o.chax = idoux[0]-mikatatyouseix;
      o.enex = idoux[0];
      o.chay = idouy[0];
      o.eney = idouy[0];
    } else if ((_c1 >= 81 && _c1 <= 90)) {
      sframe = 81;
      { const _c4 = (o.f - sframe);
      if (_c4 === 0) {
        o.effect_anime_pattern = 123;
        o.effect_anime_frame = 0;
        o.seStop();
        o.se('Z3 打撃');
        o.change(0, 1);
        o.change(1, 16);
      } else if (_c4 === 2 || _c4 === 5 || _c4 === 8) {
        o.effect_anime_pattern = 0;
        o.effect_anime_frame = 0;
        o.change(0, 0);
        o.change(1, 0);
      } else if (_c4 === 3) {
        o.effect_anime_pattern = 123;
        o.effect_anime_frame = 0;
        o.se('Z3 打撃');
        o.change(0, 4);
        o.change(1, 16);
      } else if (_c4 === 6) {
        o.effect_anime_pattern = 123;
        o.effect_anime_frame = 0;
        o.se('Z3 打撃');
        o.change(0, 2);
        o.change(1, 16);
      } else if (_c4 === 9) {
        o.effect_anime_pattern = 123;
        o.change(0, 3);
        o.change(1, 16);
      } }
    } else if (_c1 === 91) {
      o.ax = 0;
      o.ay = 0;
      o.gx = 0;
      o.gy = 0;
      o.fmt = true;
      return 'next';
    } }
  },
  100001(o) { // all.rb 70412
    o.ry = STANDARD_ENEY + 22;
    o.rx = CENTER_ENEX - 10;
    { const _c1 = o.f;
    if (_c1 === 0) {
      o.change(0, 10);
      o.change(1, 10);
      o.chax = STANDARD_CHAX;
      o.chay = STANDARD_CHAY;
      o.enex = STANDARD_ENEX;
      o.eney = STANDARD_ENEY;
      if (o.attackcourse === 0) {
        o.chay = STANDARD_CHAY + 48;
        o.eney = STANDARD_ENEY - 144;
      } else {
        o.chay = STANDARD_CHAY - 144;
        o.eney = STANDARD_ENEY + 48;
      }
    } else if ((_c1 >= 1 && _c1 <= 17)) {
      o.ax = 18;
      o.gx = 18;
      o.ay = -4;
      o.gy = 4;
    } else if (_c1 === 18) {
      o.ax = 16;
      o.gx = 16;
      o.ay = -4;
      o.gy = 4;
    } else if (_c1 === 19) {
      o.ax = 14;
      o.gx = 14;
      o.ay = -4;
      o.gy = 4;
    } else if (_c1 === 20) {
      o.ax = 12;
      o.gx = 12;
      o.ay = -4;
      o.gy = 4;
    } else if (_c1 === 21) {
      o.ax = 12;
      o.gx = 12;
      o.ay = -4;
      o.gy = 4;
    } else if (_c1 === 22) {
      o.ax = 6;
      o.gx = 6;
      o.ay = -4;
      o.gy = 4;
    } else if ((_c1 >= 23 && _c1 <= 24)) {
      o.effect_anime_pattern = 123;
      o.effect_anime_frame = 0;
      o.ax = -6;
      o.gx = -6;
      o.ay = 4;
      o.gy = -4;
    } else if ((_c1 >= 25 && _c1 <= 26)) {
      o.effect_anime_frame = 0;
      o.ax = -12;
      o.gx = -12;
      o.ay = 0;
      o.gy = 0;
    } else if ((_c1 >= 27 && _c1 <= 28)) {
      o.effect_anime_pattern = 0;
      o.effect_anime_frame = 0;
      o.ax = -12;
      o.gx = -12;
      o.ay = -4;
      o.gy = 4;
    } else if ((_c1 >= 29 && _c1 <= 30)) {
      o.ax = -8;
      o.gx = -8;
      o.ay = -6;
      o.gy = 6;
    } else if ((_c1 >= 31 && _c1 <= 32)) {
      o.ax = -6;
      o.gx = -6;
      o.ay = -8;
      o.gy = 8;
    } else if ((_c1 >= 33 && _c1 <= 34)) {
      o.ax = 0;
      o.gx = 0;
      o.ay = -8;
      o.gy = 8;
    } else if ((_c1 >= 35 && _c1 <= 36)) {
      o.ax = 12;
      o.gx = 12;
      o.ay = -8;
      o.gy = 8;
    } else if ((_c1 >= 37 && _c1 <= 38)) {
      o.ax = 12;
      o.gx = 12;
      o.ay = -6;
      o.gy = 6;
    } else if ((_c1 >= 39 && _c1 <= 40)) {
      o.ax = 12;
      o.gx = 12;
      o.ay = 2;
      o.gy = -2;
    } else if ((_c1 >= 41 && _c1 <= 42)) {
      o.ax = 8;
      o.gx = 8;
      o.ay = 4;
      o.gy = -4;
    } else if ((_c1 >= 43 && _c1 <= 47)) {
      o.ax = 0;
      o.gx = 0;
      o.ay = 8;
      o.gy = -8;
    } else if ((_c1 >= 48 && _c1 <= 58)) {
      o.effect_anime_pattern = 123;
      o.effect_anime_frame = 0;
      o.ax = -12;
      o.gx = -12;
      o.ay = -4;
      o.gy = 4;
    } else if ((_c1 >= 59 && _c1 <= 64)) {
      o.effect_anime_frame = 0;
      o.effect_anime_pattern = 0;
      o.effect_anime_frame = 0;
      o.ax = -12;
      o.gx = -12;
      o.ay = 0;
      o.gy = 0;
    } else if ((_c1 >= 65 && _c1 <= 75)) {
      o.ax = -12;
      o.gx = -12;
      o.ay = 4;
      o.gy = -4;
    } else if (_c1 === 80) {
      o.ax = 0;
      o.ay = 0;
      o.gx = 0;
      o.gy = 0;
      o.fmt = true;
      return 'next';
    } }
  },
  100101(o) { // all.rb 70562
    let idoux, idouy, kaihityouseix, kaihityouseiy, mikatatyouseix, sframe, tyouseix;
    if (o.attackcourse === 0) {
      tyouseix = -192;
    } else {
      tyouseix = 192;
    }
    if (o.attackcourse === 0) {
      o.ry = STANDARD_CHAY + 24;
      o.rx = CENTER_CHAX + 8;
    } else {
      o.ry = STANDARD_ENEY + 24;
      o.rx = CENTER_ENEX + 24;
    }
    mikatatyouseix = 72;
    kaihityouseiy = 26;
    kaihityouseix = 16;
    idoux = [CENTER_ENEX,CENTER_ENEX + tyouseix,CENTER_ENEX + tyouseix,CENTER_ENEX + tyouseix];
    idouy = [STANDARD_ENEY,STANDARD_ENEY-112,STANDARD_ENEY+48,STANDARD_ENEY-24];
    { const _c1 = o.f;
    if (_c1 === 0) {
      o.se('Z3 避ける');
      if (o.f % 4 === 0) {
        if (o.attackcourse === 0) {
          o.kaihi('a', idoux[0]+kaihityouseix-mikatatyouseix,idouy[0]+kaihityouseiy);
        } else {
          o.kaihi('a', idoux[0]+kaihityouseix,idouy[0]+kaihityouseiy);
        }
      }
      if (o.attackcourse === 0) {
        o.chay = -200;
      } else {
        o.eney = -200;
      }
    } else if ((_c1 >= 1 && _c1 <= 12)) {
      if (o.f % 4 === 0) {
        if (o.attackcourse === 0) {
          o.kaihi('a', idoux[0]+kaihityouseix-mikatatyouseix,idouy[0]+kaihityouseiy);
        } else {
          o.kaihi('a', idoux[0]+kaihityouseix,idouy[0]+kaihityouseiy);
        }
      }
    } else if ((_c1 >= 13 && _c1 <= 20)) {
      sframe = 13;
      { const _c2 = (o.f-sframe);
      if ((_c2 >= 0 && _c2 <= 8)) {
        o.gx = 4;
        o.gy = -8;
      } }
      if (o.f % 4 === 0) {
        if (o.attackcourse === 0) {
          o.kaihi('a', idoux[1]+kaihityouseix-mikatatyouseix,idouy[1]+kaihityouseiy);
        } else {
          o.kaihi('a', idoux[1]+kaihityouseix,idouy[1]+kaihityouseiy);
        }
      }
    } else if ((_c1 >= 21 && _c1 <= 28)) {
      sframe = 21;
      { const _c3 = (o.f-sframe);
      if (_c3 === 0) {
        o.gx = 0;
        o.gy = 0;
        o.se('Z3 打撃');
        o.change(1, 1);
        if (o.attackcourse === 0) {
          o.chax = idoux[1]-mikatatyouseix;
          o.chay = idouy[1];
        } else {
          o.enex = idoux[1];
          o.eney = idouy[1];
        }
      } }
    } else if ((_c1 >= 29 && _c1 <= 38)) {
      sframe = 29;
      { const _c4 = (o.f-sframe);
      if (_c4 === 0) {
        o.change(1, 0);
        o.se('Z3 避ける');
        if (o.attackcourse === 0) {
          o.chay = -200;
        } else {
          o.eney = -200;
        }
      } }
      if (o.f % 4 === 0) {
        if (o.attackcourse === 0) {
          o.kaihi('a', idoux[1]+kaihityouseix-mikatatyouseix,idouy[1]+kaihityouseiy);
        } else {
          o.kaihi('a', idoux[1]+kaihityouseix,idouy[1]+kaihityouseiy);
        }
      }
    } else if ((_c1 >= 39 && _c1 <= 46)) {
    } else if ((_c1 >= 47 && _c1 <= 54)) {
      sframe = 47;
      { const _c5 = (o.f-sframe);
      if ((_c5 >= 0 && _c5 <= 8)) {
        o.gx = 4;
        o.gy = 8;
      } }
      if (o.f % 4 === 0) {
        if (o.attackcourse === 0) {
          o.kaihi('a', idoux[2]+kaihityouseix-mikatatyouseix,idouy[2]+kaihityouseiy);
        } else {
          o.kaihi('a', idoux[2]+kaihityouseix,idouy[2]+kaihityouseiy);
        }
      }
    } else if ((_c1 >= 55 && _c1 <= 62)) {
      sframe = 55;
      { const _c6 = (o.f-sframe);
      if (_c6 === 0) {
        o.gx = 0;
        o.gy = 0;
        o.se('Z3 打撃');
        o.change(1, 4);
        if (o.attackcourse === 0) {
          o.chax = idoux[2]-mikatatyouseix;
          o.chay = idouy[2];
        } else {
          o.enex = idoux[2];
          o.eney = idouy[2];
        }
      } }
    } else if ((_c1 >= 63 && _c1 <= 70)) {
      sframe = 63;
      { const _c7 = (o.f-sframe);
      if (_c7 === 0) {
        o.change(1, 0);
        o.se('Z3 避ける');
        if (o.attackcourse === 0) {
          o.chay = -200;
        } else {
          o.eney = -200;
        }
      } }
      if (o.f % 4 === 0) {
        if (o.attackcourse === 0) {
          o.kaihi('a', idoux[2]+kaihityouseix-mikatatyouseix,idouy[2]+kaihityouseiy);
        } else {
          o.kaihi('a', idoux[2]+kaihityouseix,idouy[2]+kaihityouseiy);
        }
      }
    } else if ((_c1 >= 71 && _c1 <= 74)) {
    } else if ((_c1 >= 75 && _c1 <= 82)) {
      sframe = 75;
      { const _c8 = (o.f-sframe);
      if ((_c8 >= 0 && _c8 <= 8)) {
        o.gx = -8;
        if (o.attackcourse === 0) {
        } else {
        }
      } }
      if (o.f % 4 === 0) {
        if (o.attackcourse === 0) {
          o.kaihi('a', idoux[3]+kaihityouseix-mikatatyouseix,idouy[3]+kaihityouseiy);
        } else {
          o.kaihi('a', idoux[3]+kaihityouseix,idouy[3]+kaihityouseiy);
        }
      }
    } else if ((_c1 >= 83 && _c1 <= 90)) {
      sframe = 83;
      { const _c9 = (o.f-sframe);
      if (_c9 === 0) {
        o.gx = 0;
        if (o.attackcourse === 0) {
          o.chax = idoux[3]-mikatatyouseix;
          o.chay = idouy[3];
        } else {
          o.enex = idoux[3];
          o.eney = idouy[3];
        }
      } }
    } else if ((_c1 >= 91 && _c1 <= 98)) {
      sframe = 91;
      { const _c10 = (o.f-sframe);
      if (_c10 === 0) {
        o.se('Z3 避ける');
        if (o.attackcourse === 0) {
          o.chay = -200;
        } else {
          o.eney = -200;
        }
      } }
      if (o.f % 4 === 0) {
        if (o.attackcourse === 0) {
          o.kaihi('a', idoux[3]+kaihityouseix-mikatatyouseix,idouy[3]+kaihityouseiy);
        } else {
          o.kaihi('a', idoux[3]+kaihityouseix,idouy[3]+kaihityouseiy);
        }
      }
    } else if ((_c1 >= 99 && _c1 <= 102)) {
    } else if ((_c1 >= 103 && _c1 <= 110)) {
      sframe = 103;
      { const _c11 = (o.f-sframe);
      if (_c11 === 0) {
        if (o.attackcourse === 0) {
        } else {
        }
      } }
      if (o.f % 4 === 0) {
        if (o.attackcourse === 0) {
          o.kaihi('a', idoux[0]+kaihityouseix-mikatatyouseix,idouy[0]+kaihityouseiy);
        } else {
          o.kaihi('a', idoux[0]+kaihityouseix,idouy[0]+kaihityouseiy);
        }
      }
    } else if (_c1 === 111) {
      o.ax = 0;
      o.ay = 0;
      o.gx = 0;
      o.gy = 0;
      if (o.attackcourse === 0) {
        o.chax = idoux[0]-mikatatyouseix;
        o.chay = idouy[0];
      } else {
        o.enex = idoux[0];
        o.eney = idouy[0];
      }
      o.fmt = true;
      return 'next';
    } }
  },
  100102(o) { // all.rb 70812
    { const _c1 = o.f;
    if (_c1 === 0) {
      o.change(0, 0);
      o.change(1, 0);
      o.ax = 0;
      o.gx = 0;
      o.ay = 0;
      o.gy = 0;
    } else if ((_c1 >= 1 && _c1 <= 18)) {
      o.ax = -12;
      o.gx = 0;
    } else if ((_c1 >= 19 && _c1 <= 48)) {
      o.ax = 0;
      o.gx = 0;
    } else if ((_c1 >= 49 && _c1 <= 65)) {
      o.change(0, 16);
    } else if ((_c1 >= 66 && _c1 <= 74)) {
      o.ax = 24;
    } else if (_c1 === 75) {
      o.kyouda_se = true;
      o.change(0, 1);
      o.ax = 0;
      o.gx = 0;
      o.ay = 0;
      o.gy = 0;
      o.fmt = true;
      return 'next';
    } }
  },
  100103(o) { // all.rb 70843
    let sframe;
    { const _c1 = o.f;
    if (_c1 === 0) {
      o.change(0, 0);
      o.change(1, 0);
      o.ax = 0;
      o.gx = 0;
      o.ay = 0;
      o.gy = 0;
    } else if ((_c1 >= 1 && _c1 <= 41)) {
      sframe = 1;
      o.ax = 0;
      o.gx = 0;
      o.ay = 0;
      o.gy = 0;
      { const _c2 = (o.f-sframe);
      if ((_c2 >= 0 && _c2 <= 7)) {
        o.change(0, 1);
        o.change(1, 0);
      } else if ((_c2 >= 8 && _c2 <= 15)) {
        o.change(0, 0);
        o.change(1, 16);
      } else if ((_c2 >= 16 && _c2 <= 23)) {
        o.change(0, 2);
        o.change(1, 0);
      } else if ((_c2 >= 24 && _c2 <= 31)) {
        o.change(0, 0);
        o.change(1, 16);
      } else if ((_c2 >= 32 && _c2 <= 39)) {
        o.change(0, 3);
      } else if (_c2 === 40) {
        o.change(0, 0);
        o.change(1, 0);
      } }
      { const _c3 = (o.f-sframe);
      if (_c3 === 0 || _c3 === 16 || _c3 === 32) {
        o.se('Z1 打撃');
      } }
    } else if ((_c1 >= 42 && _c1 <= 57)) {
      o.ax = -8;
      o.gx = -8;
      o.ay = -2;
      o.gy = -2;
    } else if ((_c1 >= 58 && _c1 <= 73)) {
      o.ax = 8;
      o.gx = 8;
      o.ay = -2;
      o.gy = -2;
    } else if ((_c1 >= 74 && _c1 <= 114)) {
      sframe = 74;
      o.ax = 0;
      o.gx = 0;
      o.ay = 0;
      o.gy = 0;
      { const _c4 = (o.f-sframe);
      if ((_c4 >= 0 && _c4 <= 7)) {
        o.change(0, 4);
        o.change(1, 0);
      } else if ((_c4 >= 8 && _c4 <= 15)) {
        o.change(0, 0);
        o.change(1, 16);
      } else if ((_c4 >= 16 && _c4 <= 23)) {
        o.change(0, 2);
        o.change(1, 0);
      } else if ((_c4 >= 24 && _c4 <= 31)) {
        o.change(0, 0);
        o.change(1, 16);
      } else if ((_c4 >= 32 && _c4 <= 39)) {
        o.change(0, 1);
      } else if (_c4 === 40) {
        o.change(0, 0);
        o.change(1, 0);
      } }
      { const _c5 = (o.f-sframe);
      if (_c5 === 0 || _c5 === 16 || _c5 === 32) {
        o.se('Z1 打撃');
      } }
    } else if ((_c1 >= 115 && _c1 <= 130)) {
      o.ax = -8;
      o.gx = -8;
      o.ay = 4;
      o.gy = 4;
    } else if ((_c1 >= 131 && _c1 <= 146)) {
      o.ax = 8;
      o.gx = 8;
      o.ay = 4;
      o.gy = 4;
    } else if ((_c1 >= 147 && _c1 <= 187)) {
      sframe = 147;
      o.ax = 0;
      o.gx = 0;
      o.ay = 0;
      o.gy = 0;
      { const _c6 = (o.f-sframe);
      if ((_c6 >= 0 && _c6 <= 7)) {
        o.change(0, 1);
        o.change(1, 0);
      } else if ((_c6 >= 8 && _c6 <= 15)) {
        o.change(0, 0);
        o.change(1, 16);
      } else if ((_c6 >= 16 && _c6 <= 23)) {
        o.change(0, 3);
        o.change(1, 0);
      } else if ((_c6 >= 24 && _c6 <= 31)) {
        o.change(0, 0);
        o.change(1, 16);
      } else if ((_c6 >= 32 && _c6 <= 39)) {
        o.change(0, 4);
      } else if (_c6 === 40) {
        o.change(0, 0);
        o.change(1, 0);
      } }
      { const _c7 = (o.f-sframe);
      if (_c7 === 0 || _c7 === 16 || _c7 === 32) {
        o.se('Z1 打撃');
      } }
    } else if ((_c1 >= 188 && _c1 <= 203)) {
      o.ax = -8;
      o.gx = -8;
      o.ay = -2;
      o.gy = -2;
    } else if ((_c1 >= 204 && _c1 <= 219)) {
      o.ax = 8;
      o.gx = 8;
      o.ay = -2;
      o.gy = -2;
    } else if ((_c1 >= 220 && _c1 <= 252)) {
      sframe = 220;
      o.ax = 0;
      o.gx = 0;
      o.ay = 0;
      o.gy = 0;
      { const _c8 = (o.f-sframe);
      if ((_c8 >= 0 && _c8 <= 7)) {
        o.change(0, 3);
        o.change(1, 0);
      } else if ((_c8 >= 8 && _c8 <= 15)) {
        o.change(0, 0);
        o.change(1, 16);
      } else if ((_c8 >= 16 && _c8 <= 23)) {
        o.change(0, 2);
        o.change(1, 0);
      } else if ((_c8 >= 24 && _c8 <= 31)) {
        o.change(0, 0);
        o.change(1, 16);
      } else if ((_c8 >= 32 && _c8 <= 39)) {
        o.change(0, 1);
      } else if (_c8 === 40) {
        o.change(0, 0);
        o.change(1, 0);
      } }
      { const _c9 = (o.f-sframe);
      if (_c9 === 0 || _c9 === 16) {
        o.se('Z1 打撃');
      } }
    } else if (_c1 === 253) {
      o.change(0, 1);
      o.ax = 0;
      o.gx = 0;
      o.ay = 0;
      o.gy = 0;
      o.fmt = true;
      return 'next';
    } }
  },
  100104(o) { // all.rb 71030
    let sframe;
    { const _c1 = o.f;
    if (_c1 === 0) {
      o.change(0, 0);
      o.change(1, 0);
      o.ax = 0;
      o.gx = 0;
      o.ay = 0;
      o.gy = 0;
    } else if ((_c1 >= 1 && _c1 <= 30)) {
      sframe = 1;
      o.ax = 0;
      o.gx = 0;
      o.ay = 0;
      o.gy = 0;
      { const _c2 = (o.f-sframe);
      if ((_c2 >= 0 && _c2 <= 5)) {
        o.change(0, 1);
        o.change(1, 0);
      } else if ((_c2 >= 6 && _c2 <= 11)) {
        o.change(0, 2);
        o.change(1, 16);
      } else if ((_c2 >= 12 && _c2 <= 17)) {
        o.change(0, 1);
        o.change(1, 16);
      } else if ((_c2 >= 18 && _c2 <= 23)) {
        o.change(0, 4);
        o.change(1, 0);
      } else if ((_c2 >= 24 && _c2 <= 29)) {
        o.change(0, 2);
      } }
      { const _c3 = (o.f-sframe);
      if (_c3 === 0 || _c3 === 6 || _c3 === 12 || _c3 === 18 || _c3 === 24) {
        o.se('Z1 打撃');
      } }
    } else if ((_c1 >= 31 && _c1 <= 42)) {
      sframe = 31;
      { const _c4 = (o.f-sframe);
      if ((_c4 >= 0 && _c4 <= 4)) {
        o.change(0, 16);
        o.change(1, 16);
        o.ax = -20;
        o.gx = -20;
        o.ay = -4;
        o.gy = 4;
      } else if ((_c4 >= 5 && _c4 <= 12)) {
        o.ax = -10;
        o.gx = -10;
        o.ay = -2;
        o.gy = 2;
      } }
    } else if ((_c1 >= 43 && _c1 <= 72)) {
      o.change(0, 16);
      o.change(1, 16);
      o.ax = 0;
      o.gx = 0;
      o.ay = 0;
      o.gy = 0;
    } else if ((_c1 >= 73 && _c1 <= 89)) {
      o.change(0, 0);
      o.change(1, 0);
      o.ax = 10;
      o.gx = 10;
      o.ay = 2;
      o.gy = -2;
    } else if (_c1 === 90) {
      o.ax = 0;
      o.gx = 0;
      o.ay = 0;
      o.gy = 0;
    } else if ((_c1 >= 91 && _c1 <= 120)) {
      sframe = 91;
      o.ax = 0;
      o.gx = 0;
      o.ay = 0;
      o.gy = 0;
      { const _c5 = (o.f-sframe);
      if ((_c5 >= 0 && _c5 <= 5)) {
        o.change(0, 4);
        o.change(1, 0);
      } else if ((_c5 >= 6 && _c5 <= 11)) {
        o.change(0, 1);
        o.change(1, 16);
      } else if ((_c5 >= 12 && _c5 <= 17)) {
        o.change(0, 4);
        o.change(1, 16);
      } else if ((_c5 >= 18 && _c5 <= 23)) {
        o.change(0, 2);
        o.change(1, 0);
      } else if ((_c5 >= 24 && _c5 <= 29)) {
        o.change(0, 3);
      } }
      { const _c6 = (o.f-sframe);
      if (_c6 === 0 || _c6 === 6 || _c6 === 12 || _c6 === 18 || _c6 === 24) {
        o.se('Z1 打撃');
      } }
    } else if ((_c1 >= 121 && _c1 <= 132)) {
      sframe = 121;
      { const _c7 = (o.f-sframe);
      if ((_c7 >= 0 && _c7 <= 4)) {
        o.change(0, 16);
        o.change(1, 16);
        o.ax = -20;
        o.gx = -20;
        o.ay = 4;
        o.gy = -4;
      } else if ((_c7 >= 5 && _c7 <= 12)) {
        o.ax = -10;
        o.gx = -10;
        o.ay = 2;
        o.gy = -2;
      } }
    } else if ((_c1 >= 133 && _c1 <= 162)) {
      o.change(0, 16);
      o.change(1, 16);
      o.ax = 0;
      o.gx = 0;
      o.ay = 0;
      o.gy = 0;
    } else if ((_c1 >= 163 && _c1 <= 179)) {
      o.change(0, 0);
      o.change(1, 0);
      o.ax = 10;
      o.gx = 10;
      o.ay = -2;
      o.gy = 2;
    } else if (_c1 === 180) {
      o.ax = 0;
      o.gx = 0;
      o.ay = 0;
      o.gy = 0;
    } else if ((_c1 >= 181 && _c1 <= 205)) {
      sframe = 181;
      o.ax = 0;
      o.gx = 0;
      o.ay = 0;
      o.gy = 0;
      { const _c8 = (o.f-sframe);
      if ((_c8 >= 0 && _c8 <= 5)) {
        o.change(0, 4);
        o.change(1, 0);
      } else if ((_c8 >= 6 && _c8 <= 11)) {
        o.change(0, 1);
        o.change(1, 16);
      } else if ((_c8 >= 12 && _c8 <= 17)) {
        o.change(0, 4);
        o.change(1, 16);
      } else if ((_c8 >= 18 && _c8 <= 23)) {
        o.change(0, 2);
        o.change(1, 0);
      } else if (_c8 === 24) {
        o.kyouda_se = true;
        o.change(0, 3);
      } }
      { const _c9 = (o.f-sframe);
      if (_c9 === 0 || _c9 === 6 || _c9 === 12 || _c9 === 18) {
        o.se('Z1 打撃');
      } }
    } else if (_c1 === 206) {
      o.change(0, 1);
      o.ax = 0;
      o.gx = 0;
      o.ay = 0;
      o.gy = 0;
      o.fmt = true;
      return 'next';
    } }
  },
  100105(o) { // all.rb 71217
    let sframe;
    { const _c1 = o.f;
    if (_c1 === 0) {
      o.change(0, 0);
      o.change(1, 0);
      o.ax = 0;
      o.gx = 0;
      o.ay = 0;
      o.gy = 0;
    } else if ((_c1 >= 1 && _c1 <= 71)) {
      sframe = 1;
      o.ax = 0;
      o.gx = 0;
      o.ay = 0;
      o.gy = 0;
      { const _c2 = (o.f-sframe);
      if ((_c2 >= 0 && _c2 <= 6)) {
        o.change(0, 1);
        o.change(1, 0);
      } else if ((_c2 >= 7 && _c2 <= 13)) {
        o.change(0, 0);
        o.change(1, 16);
      } else if ((_c2 >= 14 && _c2 <= 20)) {
        o.change(0, 2);
        o.change(1, 0);
      } else if ((_c2 >= 21 && _c2 <= 27)) {
        o.change(0, 0);
        o.change(1, 16);
      } else if ((_c2 >= 28 && _c2 <= 34)) {
        o.change(0, 3);
      } else if ((_c2 >= 35 && _c2 <= 41)) {
        o.change(0, 0);
        o.change(1, 0);
      } else if ((_c2 >= 42 && _c2 <= 48)) {
        o.change(0, 4);
        o.change(1, 0);
      } else if ((_c2 >= 49 && _c2 <= 55)) {
        o.change(0, 0);
        o.change(1, 16);
      } else if ((_c2 >= 56 && _c2 <= 62)) {
        o.change(0, 1);
        o.change(1, 0);
      } else if ((_c2 >= 63 && _c2 <= 69)) {
        o.change(0, 0);
        o.change(1, 16);
      } else if (_c2 === 70) {
        o.change(0, 2);
        o.change(1, 16);
      } }
      { const _c3 = (o.f-sframe);
      if (_c3 === 0 || _c3 === 14 || _c3 === 28 || _c3 === 42 || _c3 === 56) {
        o.se('Z2 SE058');
      } }
    } else if (_c1 === 72) {
      o.kyouda_Z2_se = true;
      o.ax = 0;
      o.gx = 0;
      o.ay = 0;
      o.gy = 0;
      o.fmt = true;
      return 'next';
    } }
  },
  100106(o) { // all.rb 71287
    let sframe;
    { const _c1 = o.f;
    if (_c1 === 0) {
      o.change(0, 0);
      o.change(1, 0);
      o.ax = 0;
      o.gx = 0;
      o.ay = 0;
      o.gy = 0;
    } else if ((_c1 >= 1 && _c1 <= 250)) {
      sframe = 1;
      o.ax = 0;
      o.gx = 0;
      o.ay = 0;
      o.gy = 0;
      { const _c2 = (o.f-sframe);
      if ((_c2 >= 0 && _c2 <= 6)) {
        o.change(0, 4);
      } else if ((_c2 >= 7 && _c2 <= 13)) {
        o.change(0, 0);
        o.change(1, 16);
      } else if ((_c2 >= 14 && _c2 <= 20)) {
        o.change(0, 1);
      } else if ((_c2 >= 21 && _c2 <= 27)) {
        o.change(0, 0);
      } else if ((_c2 >= 28 && _c2 <= 34)) {
        o.change(0, 3);
        o.change(1, 0);
      } else if ((_c2 >= 35 && _c2 <= 49)) {
        o.change(0, 0);
        o.change(1, 0);
        o.ax = -8;
        o.gx = -8;
        o.ay = 4;
        o.gy = -4;
      } else if (_c2 === 50) {
        o.change(0, 5);
        o.change(1, 8);
        o.ay = -8;
        o.gy = 8;
      } else if ((_c2 >= 51 && _c2 <= 61)) {
        o.change(0, 5);
        o.change(1, 8);
      } else if (_c2 === 62) {
        o.ax = 0;
        o.gx = 2;
        o.ay = -2;
        o.gy = 0;
      } else if (_c2 === 63) {
        o.ax = 0;
        o.gx = 0;
        o.ay = -2;
        o.gy = 2;
      } else if (_c2 === 64) {
        o.ax = 2;
        o.gx = 2;
        o.ay = -2;
        o.gy = 2;
      } else if (_c2 === 65) {
        o.ax = 0;
        o.gx = 0;
        o.ay = -2;
        o.gy = 0;
      } else if (_c2 === 66) {
        o.ax = 2;
        o.gx = 0;
        o.ay = -2;
        o.gy = 2;
      } else if (_c2 === 67) {
        o.ax = 0;
        o.gx = 2;
        o.ay = -2;
        o.gy = 2;
      } else if (_c2 === 68) {
        o.ax = 0;
        o.gx = 0;
        o.ay = -2;
        o.gy = 0;
      } else if (_c2 === 69) {
        o.ax = 2;
        o.gx = 0;
        o.ay = -2;
        o.gy = 2;
      } else if (_c2 === 70) {
        o.ax = 0;
        o.gx = 2;
        o.ay = -2;
        o.gy = 2;
      } else if (_c2 === 71) {
        o.ax = 2;
        o.gx = 0;
        o.ay = 0;
        o.gy = 0;
      } else if (_c2 === 72) {
        o.ax = 0;
        o.gx = 2;
        o.ay = -2;
        o.gy = 2;
      } else if (_c2 === 73) {
        o.ax = 0;
        o.gx = 0;
        o.ay = -2;
        o.gy = 2;
      } else if (_c2 === 74) {
        o.ax = 2;
        o.gx = 0;
        o.ay = -2;
        o.gy = 0;
      } else if (_c2 === 75) {
        o.ax = 0;
        o.gx = 2;
        o.ay = -2;
        o.gy = 2;
      } else if (_c2 === 76) {
        o.ax = 2;
        o.gx = 0;
        o.ay = -2;
        o.gy = 2;
      } else if (_c2 === 77) {
        o.change(0, 0);
        o.change(1, 0);
        o.ay = -8;
        o.gy = 8;
      } else if (_c2 === 78) {
        o.ax = 0;
        o.gx = 2;
        o.ay = -2;
        o.gy = 0;
      } else if (_c2 === 79) {
        o.ax = 2;
        o.gx = 0;
        o.ay = -2;
        o.gy = 2;
      } else if (_c2 === 79) {
        o.ax = 0;
        o.gx = 2;
        o.ay = -2;
        o.gy = 2;
      } else if (_c2 === 80) {
        o.ax = 2;
        o.gx = 0;
        o.ay = 0;
        o.gy = 0;
      } else if (_c2 === 81) {
        o.ax = 0;
        o.gx = 0;
        o.ay = -2;
        o.gy = 2;
      } else if (_c2 === 82) {
        o.ax = 0;
        o.gx = 2;
        o.ay = -2;
        o.gy = 2;
      } else if (_c2 === 83) {
        o.ax = 2;
        o.gx = 0;
        o.ay = -2;
        o.gy = 0;
      } else if (_c2 === 84) {
        o.ax = 0;
        o.gx = 0;
        o.ay = -2;
        o.gy = 2;
      } else if (_c2 === 85) {
        o.ax = 2;
        o.gx = 2;
        o.ay = -2;
        o.gy = 2;
      } else if (_c2 === 86) {
        o.ax = 0;
        o.gx = 0;
        o.ay = -2;
        o.gy = 0;
      } else if (_c2 === 87) {
        o.ax = 0;
        o.gx = 2;
        o.ay = -2;
        o.gy = 2;
      } else if (_c2 === 88) {
        o.ax = 2;
        o.gx = 0;
        o.ay = -2;
        o.gy = 2;
      } else if (_c2 === 89) {
        o.ax = 0;
        o.gx = 2;
        o.ay = -2;
        o.gy = 0;
      } else if (_c2 === 90) {
        o.ax = 2;
        o.gx = 2;
        o.ay = -2;
        o.gy = 2;
      } else if ((_c2 >= 91 && _c2 <= 106)) {
        o.ax = 6;
        o.gx = 6;
      } else if ((_c2 >= 107 && _c2 <= 113)) {
        o.change(0, 2);
        o.change(1, 16);
      } else if ((_c2 >= 114 && _c2 <= 120)) {
        o.change(0, 0);
        o.change(1, 0);
      } else if ((_c2 >= 121 && _c2 <= 127)) {
        o.change(0, 4);
      } else if ((_c2 >= 128 && _c2 <= 134)) {
        o.change(0, 0);
        o.change(1, 0);
      } else if ((_c2 >= 135 && _c2 <= 141)) {
        o.change(0, 1);
        o.change(1, 16);
      } else if ((_c2 >= 142 && _c2 <= 156)) {
        o.change(0, 0);
        o.change(1, 0);
        o.ax = -8;
        o.gx = -8;
        o.ay = -4;
        o.gy = 4;
      } else if (_c2 === 157) {
        o.change(0, 5);
        o.change(1, 8);
        o.ay = 8;
        o.gy = -8;
      } else if ((_c2 >= 158 && _c2 <= 168)) {
        o.change(0, 5);
        o.change(1, 8);
      } else if (_c2 === 169) {
        o.ax = 0;
        o.gx = 2;
        o.ay = 2;
        o.gy = 0;
      } else if (_c2 === 170) {
        o.ax = 0;
        o.gx = 0;
        o.ay = 2;
        o.gy = -2;
      } else if (_c2 === 171) {
        o.ax = 2;
        o.gx = 2;
        o.ay = 2;
        o.gy = -2;
      } else if (_c2 === 172) {
        o.ax = 0;
        o.gx = 0;
        o.ay = 2;
        o.gy = 0;
      } else if (_c2 === 173) {
        o.ax = 2;
        o.gx = 0;
        o.ay = 2;
        o.gy = -2;
      } else if (_c2 === 174) {
        o.ax = 0;
        o.gx = 2;
        o.ay = 2;
        o.gy = -2;
      } else if (_c2 === 175) {
        o.ax = 0;
        o.gx = 0;
        o.ay = 2;
        o.gy = 0;
      } else if (_c2 === 176) {
        o.ax = 2;
        o.gx = 0;
        o.ay = 2;
        o.gy = -2;
      } else if (_c2 === 177) {
        o.ax = 0;
        o.gx = 2;
        o.ay = 2;
        o.gy = -2;
      } else if (_c2 === 178) {
        o.ax = 2;
        o.gx = 0;
        o.ay = 0;
        o.gy = 0;
      } else if (_c2 === 179) {
        o.ax = 0;
        o.gx = 2;
        o.ay = 2;
        o.gy = -2;
      } else if (_c2 === 180) {
        o.ax = 0;
        o.gx = 0;
        o.ay = 2;
        o.gy = -2;
      } else if (_c2 === 181) {
        o.ax = 2;
        o.gx = 0;
        o.ay = 2;
        o.gy = 0;
      } else if (_c2 === 182) {
        o.ax = 0;
        o.gx = 2;
        o.ay = 2;
        o.gy = -2;
      } else if (_c2 === 183) {
        o.ax = 2;
        o.gx = 0;
        o.ay = 2;
        o.gy = -2;
      } else if (_c2 === 184) {
        o.change(0, 0);
        o.change(1, 0);
        o.ay = 8;
        o.gy = -8;
      } else if (_c2 === 185) {
        o.ax = 0;
        o.gx = 2;
        o.ay = 2;
        o.gy = 0;
      } else if (_c2 === 186) {
        o.ax = 2;
        o.gx = 0;
        o.ay = 2;
        o.gy = -2;
      } else if (_c2 === 187) {
        o.ax = 0;
        o.gx = 2;
        o.ay = 2;
        o.gy = -2;
      } else if (_c2 === 188) {
        o.ax = 2;
        o.gx = 0;
        o.ay = 0;
        o.gy = 0;
      } else if (_c2 === 189) {
        o.ax = 0;
        o.gx = 0;
        o.ay = 2;
        o.gy = -2;
      } else if (_c2 === 190) {
        o.ax = 0;
        o.gx = 2;
        o.ay = 2;
        o.gy = -2;
      } else if (_c2 === 191) {
        o.ax = 2;
        o.gx = 0;
        o.ay = 2;
        o.gy = 0;
      } else if (_c2 === 192) {
        o.ax = 0;
        o.gx = 0;
        o.ay = 2;
        o.gy = -2;
      } else if (_c2 === 193) {
        o.ax = 2;
        o.gx = 2;
        o.ay = 2;
        o.gy = -2;
      } else if (_c2 === 194) {
        o.ax = 0;
        o.gx = 0;
        o.ay = 2;
        o.gy = 0;
      } else if (_c2 === 195) {
        o.ax = 0;
        o.gx = 2;
        o.ay = 2;
        o.gy = -2;
      } else if (_c2 === 196) {
        o.ax = 2;
        o.gx = 0;
        o.ay = 2;
        o.gy = -2;
      } else if (_c2 === 197) {
        o.ax = 0;
        o.gx = 2;
        o.ay = 0;
        o.gy = 2;
      } else if (_c2 === 198) {
        o.ax = 2;
        o.gx = 0;
        o.ay = 2;
        o.gy = -2;
      } else if ((_c2 >= 199 && _c2 <= 214)) {
        o.ax = 6;
        o.gx = 6;
      } else if ((_c2 >= 215 && _c2 <= 221)) {
        o.change(0, 1);
        o.change(1, 16);
      } else if ((_c2 >= 222 && _c2 <= 228)) {
        o.change(0, 0);
        o.change(1, 0);
      } else if ((_c2 >= 229 && _c2 <= 235)) {
        o.change(0, 2);
      } else if ((_c2 >= 236 && _c2 <= 242)) {
        o.change(0, 0);
        o.change(1, 0);
      } else if ((_c2 >= 243 && _c2 <= 249)) {
        o.change(0, 4);
        o.change(1, 16);
      } }
      { const _c3 = (o.f-sframe);
      if (_c3 === 0 || _c3 === 14 || _c3 === 28 || _c3 === 107 || _c3 === 121 || _c3 === 135 || _c3 === 215 || _c3 === 229 || _c3 === 243) {
        o.se('Z1 打撃');
      } }
    } else if (_c1 === 251) {
      o.kyouda_se = true;
      o.ax = 0;
      o.gx = 0;
      o.ay = 0;
      o.gy = 0;
      o.fmt = true;
      return 'next';
    } }
  },
  20(o) { // all.rb 71704
    if (o.f === 0) {
      o.se('Z3 避ける');
      o.gy = -500;
    } else if (o.f >= 1 && o.f <= 20) {
      o.gy = 0;
      o.effect_anime_pattern = 120;
    } else if (o.f >= 21 && o.f <= 50) {
    } else if (o.f === 51) {
      o.ax = 0;
      o.ay = 0;
      o.gx = 0;
      o.gy = 0;
      o.fmt = true;
      return 'next';
    }
  },
  21(o) { // all.rb 71725
    if (o.f === 0) {
      if (o.kyouda_Z2_se === true) {
        o.se('Z2 SE058');
      } else if (o.kyouda_se === false) {
        o.se('Z3 打撃');
      } else {
        o.se('ZG 打撃3');
      }
      o.change(1, 16);
      o.output_battle_damage_flag = true;
    } else if (o.f >= 1 && o.f <= 12) {
      o.gx = -18;
      if (o.attackcourse === 1 && o.bigMe || o.attackcourse === 0 && o.bigFoe) {
        if (o.f >= 8) { o.gx = 0; }
      }
      o.effect_anime_pattern = 121;
    } else if (o.f >= 13 && o.f <= 50) {
      o.gx = 0;
    } else if (o.f === 51) {
      o.ax = 0;
      o.ay = 0;
      o.gx = 0;
      o.gy = 0;
      o.fmt = true;
      return 'next';
    }
  },
  51(o) { // all.rb 73268
    if (o.f === 0) {
    } else if (o.f === 5) {
      o.change(0, 3);
    } else if (o.f >= 6) {
      
      o.outNow = true;
      return 'next';
    }
  },
  52(o) { // all.rb 73279
    if (o.f === 0) {
    } else if (o.f === 5) {
      o.change(0, 4);
    } else if (o.f >= 6) {
      
      o.outNow = true;
      return 'next';
    }
  },
  53(o) { // all.rb 73290
    if (o.f === 0) {
    } else if (o.f === 5) {
      o.change(0, 1);
    } else if (o.f >= 6) {
      
      o.outNow = true;
      return 'next';
    }
  },
  54(o) { // all.rb 73301
    if (o.f === 0) {
    } else if (o.f === 5) {
      o.change(0, 2);
    } else if (o.f >= 6) {
      
      o.outNow = true;
      return 'next';
    }
  },
};
/* eslint-enable */

// set_ok_normalattackpattern (all.rb 54436): the kinds the attacker's speed opens; a big one on either side drops 12 and 15
// (the original also drops 13 for an enemy without blow pictures, element 52, which the remake's data does not carry)
export function normalKinds(agi, big) {
  const k = [1, 2, 3, 4];
  if (agi >= 25) k.push(14);
  if (agi >= 30) k.push(18);
  if (agi >= 35) k.push(15, 16);
  if (agi >= 40) k.push(17);
  if (agi >= 45) k.push(5, 7);
  if (agi >= 55) k.push(8, 10);
  if (agi >= 65) k.push(6, 9);
  if (agi >= 75) k.push(11);
  if (agi >= 85) k.push(13);
  if (agi >= 95) k.push(12);
  return big ? k.filter((n) => n !== 12 && n !== 15) : k;
}
const pick = (a) => a[Math.floor(Math.random() * a.length)];
// the move switch for attack pattern 1 (all.rb 54746-55107): the anime patterns of $normalattackpattern n, before the
// hit; M = the way in (@mannakaidouno), K = the feint (@keinseino, skipped when @kenseiflag is false), D1-D4 = set_def_attack
export function normalSequence(n, M, K, feint) {
  const k = feint ? [K] : [];
  return {
    1: [M, 'D1'], 2: [2, 1, 'D1'], 3: [1, 3, 4, 'D1'], 4: [1, 'S1', 'S2', 'S3', 'D4'],
    5: [...k, M, 6, 'D1'], 6: [...k, M, 9, 'D1'], 7: [...k, M, 10, 'D1'], 8: [...k, M, 10, 6, 'D1'],
    9: [...k, 8, 14], 10: [...k, M, 16], 11: [...k, M, 17], 12: [...k, M, 19], 13: [...k, M, 100101, 'D1'],
    14: [...k, M, 100102], 15: [...k, M, 100103], 16: [...k, M, 100104], 17: [...k, M, 100105], 18: [M, 100106],
  }[n];
}
// the last kind drawn (for the dev check: ?dev=… then __game.lastNormal)
export const lastNormal = { n: 0, seq: null };

const era = () => { const s = globalThis.__game && globalThis.__game.state; return (s && s.var && s.var[40]) || 0; };
const normal0 = Duel.prototype.normalAttack;
Object.assign(Duel.prototype, {
  * normalAttack() {
    const sc = globalThis.__game && globalThis.__game.scene, d = sc && sc.duel;
    const who = d && (this.p ? d.m : d.f);
    if (this.constructor !== Duel || era() < 1 || !who || who.agi == null) return yield* normal0.call(this);
    const big = (this.L.sheets.size || 96) > 96 || (this.R.sheets.size || 96) > 96;
    const n = pick(normalKinds(who.agi, big));
    const seq = normalSequence(n, pick([1, 5, 7, 8, 11, 12, 15]), pick([13, 18, 100001]), Math.random() < 0.5);
    Object.assign(lastNormal, { n, seq });
    yield* this.naRun([...seq, this.hit ? 21 : 20]);
  },

  // the frame loop of Scene_Db_Battle_Anime for a list of anime patterns
  * naRun(seq) {
    const A = this.A, G = this.G, p = this.p;
    const order = [1, 2, 3, 4].sort(() => Math.random() - 0.5); // $attack_anime[1..4]
    const o = {
      f: 0, ax: 0, ay: 0, gx: 0, gy: 0, rx: 0, ry: 0, attackcourse: p ? 0 : 1,
      effect_anime_pattern: 0, effect_anime_frame: 0, effect_anime_type: 0, kyouda_se: false, kyouda_Z2_se: false,
      bigFoe: (this.R.sheets.size || 96) > 96, bigMe: (this.L.sheets.size || 96) > 96,
      U: [], fmt: false, outNow: false,
      get chax() { return this.L.x; }, set chax(v) { this.L.x = v; }, get chay() { return this.L.y; }, set chay(v) { this.L.y = v; },
      get enex() { return this.R.x; }, set enex(v) { this.R.x = v; }, get eney() { return this.R.y; }, set eney(v) { this.R.y = v; },
      L: this.L, R: this.R,
      change: (side, n) => this.pose(side ? G : A, n, false),
      se: (name) => this.se(name), seStop: () => audio.seStop(),
      blt(x, y, picture, rect) { const sheet = PIC[picture] || picture; this.U.push((c) => draw(c, sheet, rect[0], rect[1], rect[2], rect[3], x, y)); },
      kaihi(ag, x, y) { // put_kaihianime: the after-image of the one dodging (96×96 for a big one)
        const foeSide = (this.attackcourse === 0 && ag === 'g') || (this.attackcourse === 1 && ag === 'a');
        const big = foeSide ? this.bigFoe : this.bigMe;
        if (!big) this.blt(x, y, '戦闘アニメ', [0, 48, 64, 64]);
        else this.blt(x + (foeSide ? (ag === 'a' ? -24 : 24) : -72), y - 32, '戦闘アニメ96×96用回避', [0, 0, 128, 128]);
      },
    };
    this.pose(A, 0, false); this.pose(G, 0, false);
    const self = this;
    const fx = { list: [] };
    this.behind((c) => { for (const g of o.U) g(c); });
    this.effect((c) => { for (const g of fx.list) g(c); });
    const output = () => { // output_battle_anime
      if (p) { o.gx = -o.gx; o.L.x += o.ax; o.L.y += o.ay; o.R.x += o.gx; o.R.y += o.gy; }
      else { o.ax = -o.ax; o.L.x += o.gx; o.L.y += o.gy; o.R.x += o.ax; o.R.y += o.ay; }
    };
    for (let i = 0; i < seq.length; i++) {
      let n = seq[i], se = false;
      if (typeof n === 'string') { se = n[0] === 'S'; n = 50 + order[Number(n[1]) - 1]; } // set_def_attack x → 51-54
      o.f = 0;
      for (;;) {
        if (o.f === 0) { o.ax = o.ay = o.gx = o.gy = 0; }
        if (se && o.f === 0) o.se('Z1 打撃');
        o.U = []; o.fmt = false; o.outNow = false;
        const r = PAT[n](o);
        if (o.output_battle_damage_flag) { o.output_battle_damage_flag = false; self.showHit(); }
        fx.list = [];
        if (r === 'next') {
          output();
          if (o.fmt) { // anime_pattern_fromat
            audio.seStop();
            o.effect_anime_pattern = 0; o.effect_anime_frame = 0; o.effect_anime_type = 0;
            o.ax = o.ay = o.gx = o.gy = 0;
          }
          yield;
          break;
        }
        output();
        if (o.effect_anime_pattern) { const e = EFFECTS[o.effect_anime_pattern]; if (e) fx.list.push(e(o)); o.effect_anime_frame++; }
        yield;
        o.f++;
        if (o.f > 2000) break; // (a pattern that never ends)
      }
    }
    this.behind(null); this.effect(null);
  },
});

// effect_pattern 120-123 (all.rb 135031): the dodging after-image, the blow, the clash, a blow at ray_x / ray_y
const EFFECTS = {
  120: (o) => { // 回避: every 4th frame where the one dodging was (it is 500 above it now)
    const e = o.effect_anime_frame;
    if (e % 4) return () => {};
    if (o.attackcourse === 0) {
      const x = o.R.x, y = o.R.y;
      return o.bigFoe ? (c) => draw(c, AFTER_BIG, 0, 0, 128, 128, x + 32, y + 16 + 500 - 32) : (c) => draw(c, SPARK, 0, 48, 64, 64, x + 32, y + 16 + 500);
    }
    const x = o.L.x, y = o.L.y;
    return o.bigMe ? (c) => draw(c, AFTER_BIG, 0, 0, 128, 128, x + 8 - 64, y + 16 + 500 - 32) : (c) => draw(c, SPARK, 0, 48, 64, 64, x + 8, y + 16 + 500);
  },
  121: (o) => { // 攻撃ヒット: the spark at the fist and on the one hit
    const e = o.effect_anime_frame;
    if (e > 10) return () => {};
    const sx = e <= 4 ? 0 : 32, L = { x: o.L.x, y: o.L.y }, R = { x: o.R.x, y: o.R.y };
    if (o.attackcourse === 0) return (c) => { draw(c, SPARK, sx, 16, 32, 32, L.x + 96, L.y + 32); draw(c, SPARK, 32, 0, 32, 16, R.x, R.y - (o.bigFoe ? 48 : 0)); };
    return (c) => { draw(c, SPARK, sx, 16, 32, 32, R.x - 32, (e <= 4 ? R.y : L.y) + 32); draw(c, SPARK, 32, 0, 32, 16, L.x + 64, L.y); };
  },
  122: () => (c) => draw(c, SPARK, 32, 16, 32, 32, 640 / 2 - 16, 480 / 2 - 90), // ぶつかる
  123: (o) => { const x = o.rx, y = o.ry, sx = o.effect_anime_frame <= 4 ? 0 : 32; return (c) => draw(c, SPARK, sx, 16, 32, 32, x, y); },
};
