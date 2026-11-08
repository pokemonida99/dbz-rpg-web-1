// 設定 「作弊模式」 / 「卡片全滿」 (not in the original): while on, CAP (state.zeni) and every member's ZP stay at the top,
// and every ranked card (not the Dragon Balls or the story's items, rank null) at its holding limit; spending them takes
// nothing. Turned off, they are spent as usual from what is there (src/fieldmenu.js options.cheat / cheatCards)
export const CHEAT_MAX = 9999999; // gain_gold's top (all.rb 27479)
export const cheat = { on: false, cards: false };
// held at the top (each field frame, src/field.js update, and when an option is turned on)
export function cheatFill(s, world) {
  if (!s || !s.party) return;
  if (cheat.on) {
    s.zeni = CHEAT_MAX;
    for (const m of [...s.party, ...Object.values(s.bench || {})]) if (m) m.zp = CHEAT_MAX;
  }
  if (cheat.cards && world && s.cards && s.cardMax) {
    for (const [id, it] of Object.entries(world.items)) if (it.rank) s.cards[id] = s.cardMax[it.rank]; // (items.js maxOf)
  }
}
// a payment of CAP / ZP: nothing taken while 作弊模式 is on
export const pay = (n) => (cheat.on ? 0 : n);
// a ranked card used up: kept while 卡片全滿 is on (src/items.js lose)
export const keepCard = (it) => !!(cheat.cards && it && it.rank);
