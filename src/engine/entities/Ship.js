/**
 * Ship entity — represents the player's ship on the exploration map
 */

export class Ship {
  constructor({ x = 400, y = 300, radius = 15 } = {}) {
    this.x = x // posición x en píxeles
    this.y = y // posición y en píxeles
    this.radius = radius // radio del círculo que representa el barco
    this.color = 0x8b5a2b // color café/marrón
  }

  /**
   * Retorna la posición actual del barco
   */
  getPosition() {
    return { x: this.x, y: this.y }
  }

  /**
   * Mueve el barco a una nueva posición
   */
  moveTo(x, y) {
    this.x = x
    this.y = y
  }

  /**
   * Verifica si el barco está colisionando con una isla
   */
  isCollidingWithIsland(island) {
    const dx = this.x - island.x
    const dy = this.y - island.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    return distance <= this.radius + island.radius
  }
}
