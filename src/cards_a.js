// 卡片效果 A：55 月亮和尾巴、73 皮拉夫、76 飛機、79 老鼠、91 阿修、92 小舞、96 藍將軍、100 小八、107 桃白白、112 鈴鼓、113 銅撥、114 比克(O)、123 木乃伊 — docs/cards-plan.md; the data is built by tools/build_cards_a.py.
// Card effects register in src/items.js fieldCards[id] = async ({ game, battle }) => used | 'close' | false.
import { fieldCards } from './items.js?v=20261102-1554';

void fieldCards;
