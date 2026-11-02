// 卡片格依時代換商品（Scene_Shop 的 z1～zG_cardlist、create_get_card 的 card_id_z1～zg、神經衰弱，變數 44）＋卡片 198／199／200、90／103／157 村人、119 基朗、202 界王星 — docs/cards-plan.md; the data is built by tools/build_cards_square.py.
// Card effects register in src/items.js fieldCards[id] = async ({ game, battle }) => used | 'close' | false.
import { fieldCards } from './items.js?v=20261102-1554';

void fieldCards;
