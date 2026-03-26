import { signal, computed } from '@angular/core';

export interface KdsItem {
  _id: string;
  item_name_snapshot: { es: string; en: string; fr: string; ar: string };
  item_state: 'ORDERED' | 'ON_PREPARE' | 'SERVED' | 'CANCELED';
  item_base_price: number;
  createdAt: string;
  order_id: string;
  session_id: string;
}

const _items = signal<KdsItem[]>([]);

export const kdsStore = {
  items: _items.asReadonly(),
  ordered: computed(() => _items().filter((i) => i.item_state === 'ORDERED')),
  onPrepare: computed(() => _items().filter((i) => i.item_state === 'ON_PREPARE')),
  served: computed(() => _items().filter((i) => i.item_state === 'SERVED')),

  setItems(items: KdsItem[]) {
    _items.set(items);
  },

  addItem(item: KdsItem) {
    _items.update((current) => [item, ...current]);
  },

  updateItemState(itemId: string, newState: KdsItem['item_state']) {
    _items.update((current) =>
      current.map((i) => (i._id === itemId ? { ...i, item_state: newState } : i))
    );
  },
};
