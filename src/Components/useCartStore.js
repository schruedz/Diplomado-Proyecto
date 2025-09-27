import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product, qty = 1) => {
        if (!product?.id || !product?.active) return;
        set((state) => {
          const idx = state.items.findIndex((p) => p.id === product.id);
          if (idx >= 0) {
            const next = [...state.items];
            const maxQty = product.stock ?? next[idx].qty + qty;
            next[idx] = { ...next[idx], qty: Math.min(next[idx].qty + qty, maxQty) };
            return { items: next };
          }
          return {
            items: [
              ...state.items,
              {
                id: product.id,
                title: product.title,
                price: Number(product.price || 0),
                image: product.image,
                qty: Math.min(qty, product.stock ?? qty),
              },
            ],
          };
        });
      },

      removeItem: (id) =>
        set((state) => ({ items: state.items.filter((p) => p.id !== id) })),

      clear: () => set({ items: [] }),

      setQty: (id, qty) =>
        set((state) => ({
          items: state.items.map((p) =>
            p.id === id ? { ...p, qty: Math.max(1, qty) } : p
          ),
        })),

      totalQty: () => get().items.reduce((a, b) => a + b.qty, 0),
      total: () => get().items.reduce((a, b) => a + b.qty * b.price, 0),
    }),
    {
      name: "cart",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
    }
  )
);
