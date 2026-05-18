/**
 * ShopSystem — purchase validation and catalog generation (T043, SC-009).
 *
 * Rules:
 *  - All shop items must cost >= MIN_SHOP_PRICE (15 gold). Items below this
 *    threshold are considered invalid and will throw or be filtered out.
 *  - Purchases require the player to have at least item.cost gold.
 *  - generateShopCatalog never returns items below the minimum price.
 *  - No Vue or PixiJS imports — pure JS engine module.
 */

/** Minimum allowed price for any shop item (FR-015, SC-009). */
const MIN_SHOP_PRICE = 15

/**
 * @typedef {Object} PurchaseResult
 * @property {boolean} success - Whether the purchase was completed
 * @property {object}  [card]  - The purchased card (only present when success is true)
 */

/**
 * @description Validates and resolves a shop purchase.
 *              Throws if the item violates the minimum price invariant.
 *              Returns { success: false } without side effects if the player
 *              cannot afford the item.
 *
 * @param {number} playerGold - Current gold available to the player
 * @param {{ cost: number } & object} item - Shop item to purchase
 * @returns {PurchaseResult}
 * @throws {Error} If item.cost < MIN_SHOP_PRICE (invariant violation)
 */
export function attemptPurchase(playerGold, item) {
    if (item.cost < MIN_SHOP_PRICE) {
        throw new Error(
            `Shop item price must be >= ${MIN_SHOP_PRICE} gold, got ${item.cost}. ` +
            'All shop items must have a valid price.'
        )
    }

    if (playerGold < item.cost) {
        return { success: false }
    }

    return { success: true, card: item }
}

/**
 * @description Generates a randomized shop catalog from a card pool.
 *              Items with cost < MIN_SHOP_PRICE are silently filtered out.
 *              The result contains at most `catalogSize` non-duplicate items.
 *
 * @param {Array<{ cost: number } & object>} cardPool   - Full pool of available cards
 * @param {number}                           catalogSize - Maximum number of items to show
 * @param {() => number}                     rng         - Seeded RNG returning [0, 1)
 * @returns {Array<{ cost: number } & object>} Shuffled catalog subset
 */
export function generateShopCatalog(cardPool, catalogSize, rng) {
    const eligible = cardPool.filter((card) => card.cost >= MIN_SHOP_PRICE)
    const available = [...eligible]
    const count = Math.min(catalogSize, available.length)
    const catalog = []

    for (let i = 0; i < count; i++) {
        const idx = Math.floor(rng() * available.length)
        catalog.push(available[idx])
        available.splice(idx, 1)
    }

    return catalog
}
