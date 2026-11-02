// 卡片效果 B：141 喜歡角色變更（喜歡的角色系統）、142 悟空、144 比克、148 克林、151 貝吉塔、153 沙維扎、156 快速龍、160 威洛、169 外星人、173 氣墊車、197 修行之石、203 重力裝置、211 悟空(B)、212 克林(B) — docs/cards-plan.md; the data is built by tools/build_cards_b.py.
// Card effects register in src/items.js fieldCards[id] = async ({ game, battle }) => used | 'close' | false.
import { fieldCards } from './items.js?v=20261102-1554';

void fieldCards;
