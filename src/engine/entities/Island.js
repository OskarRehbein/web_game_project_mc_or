/**
 * Island entity — represents an island on the exploration map
 */

export class Island {
  constructor({ id, name, type, x, y, radius = 20, interactionRadius = 80 }) {
    this.id = id
    this.name = name
    this.type = type // 'forest' (verde), 'desert' (amarilla), 'rock' (gris)
    this.x = x // posición x en píxeles
    this.y = y // posición y en píxeles
    this.radius = radius // radio del círculo que representa la isla
    this.interactionRadius = interactionRadius // radio de la zona de interacción
  }

  /**
   * Retorna el color de la isla según su tipo
   */
  getColor() {
    const colors = {
      forest: 0x4a9d6f, // verde
      desert: 0xe8d77d, // amarillo/arena
      rock: 0x8b8b8b, // gris
    }
    return colors[this.type] || 0xffffff
  }

  /**
   * Verifica si un punto está dentro del radio de la isla
   */
  isPointInside(px, py) {
    const dx = px - this.x
    const dy = py - this.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    return distance <= this.radius
  }

  /**
   * Calcula la distancia desde la isla a un punto (barco)
   */
  getDistanceTo(px, py) {
    const dx = px - this.x
    const dy = py - this.y
    return Math.sqrt(dx * dx + dy * dy)
  }

  /**
   * Verifica si un punto está dentro de la zona de interacción
   */
  isInInteractionZone(px, py) {
    const distance = this.getDistanceTo(px, py)
    return distance <= this.interactionRadius
  }
}

