// Runs an original event as converted by tools/build_data.py (script()): the text in order, with branches on the
// original's switches / variables, the switch and variable changes, sounds and choices; cards given go to state.cards.
// state.sw / state.var hold the original's switches and variables, so the same conditions work as in the classic.
import { say, choose, audio, toast } from './core.js?v=20261101-1900';
import { eventCard } from './items.js?v=20261101-1900';

const CMP = [(a, b) => a === b, (a, b) => a >= b, (a, b) => a <= b, (a, b) => a > b, (a, b) => a < b, (a, b) => a !== b];

export async function runEvent(nodes, state) {
  const sw = state.sw || (state.sw = {});
  const v = state.var || (state.var = {});
  let lines = [];
  const flush = async (keep) => { if (lines.length) { await say(lines, keep); lines = []; } };
  const test = (c) => (c[0] === 'sw' ? !!sw[c[1]] === c[2] : c[0] === 'var' ? CMP[c[3]](v[c[1]] || 0, c[2]) : false);
  // returns true when the event ends early
  const run = async (list) => {
    for (const n of list) {
      if (n.say) lines.push(n.say);
      else if (n.if) { if (await run(test(n.if) ? n.then : n.else)) return true; }
      else if (n.sw) { for (let i = n.sw[0]; i <= n.sw[1]; i++) sw[i] = n.sw[2]; }
      else if (n.var) { const [id, op, x] = n.var; v[id] = op === 0 ? x : (v[id] || 0) + (op === 1 ? x : -x); }
      else if (n.item) { await flush(); const it = eventCard(state, n.item[0], n.item[1]); if (it && n.item[1] > 0) { audio.se('Z1 アイテム取得', 80); toast(`得到了「${it.name}」卡片！`); } }
      else if (n.se) { await flush(); audio.se(n.se, 80); }
      else if (n.choice) {
        await flush(true);
        if (await run(n.branches[await choose(n.choice)] || [])) return true;
      } else if (n.end) return true;
    }
    return false;
  };
  await run(nodes);
  await flush();
}
