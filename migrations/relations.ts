import { relations } from "drizzle-orm/relations";
import { suppliers, purchaseLots, purchaseLotItems, qcInventory } from "./schema";

export const purchaseLotsRelations = relations(purchaseLots, ({one, many}) => ({
	supplier: one(suppliers, {
		fields: [purchaseLots.supplierId],
		references: [suppliers.supplierId]
	}),
	purchaseLotItems: many(purchaseLotItems),
	qcInventories: many(qcInventory),
}));

export const suppliersRelations = relations(suppliers, ({many}) => ({
	purchaseLots: many(purchaseLots),
}));

export const purchaseLotItemsRelations = relations(purchaseLotItems, ({one}) => ({
	purchaseLot: one(purchaseLots, {
		fields: [purchaseLotItems.lotId],
		references: [purchaseLots.lotId]
	}),
}));

export const qcInventoryRelations = relations(qcInventory, ({one}) => ({
	purchaseLot: one(purchaseLots, {
		fields: [qcInventory.lotId],
		references: [purchaseLots.lotId]
	}),
}));