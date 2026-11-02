// 劇情與特殊卡片：38 波倫加、48 未來特效藥、57 藥草、58 瀉藥、59 炸藥、62 任意卡、63 交換、68 顛倒、78 筋斗雲、125～133 重要物品與撒旦的簽名、140 芭蕉扇、145 20號、155 弗利薩(S)、168 時間君、171 恐龍 — docs/cards-plan.md; the data is built by tools/build_cards_story.py.
// Card effects register in src/items.js fieldCards[id] = async ({ game, battle }) => used | 'close' | false.
import { fieldCards } from './items.js?v=20261102-1554';

void fieldCards;
