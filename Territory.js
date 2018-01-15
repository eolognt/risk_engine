class Territory {
  constructor(name) {
    if (typeof name === undefined) {
      throw new Error('Territory must have a name');
    }
    this.name = name;
    this.neighbors = [];
    this.troops = 0;
  }
  addNeighbor(neighbor) {
    this.neighbors.push(neighbor);
  }
  hasOwner() {
    return typeof this.owner !== 'undefined';
  }
  hasEnemyNeighbor() {
    return this.neighbors.some((neighbor) => {
      return neighbor.owner !== this.owner;
    });
  }
  conquer(player, troops) {
    this.owner = player;
    this.troops = troops;
  }
  isLinkedWith(anotherTerritory) {
    const visited = new Set();
    let linked = false;
    const visit = function (terr) {
      visited.add(terr);
      if (terr === anotherTerritory || linked) {
        linked = true;
        return;
      }
      for (const adjacent of terr.neighbors) {
        if (!visited.has(adjacent) && adjacent.owner === this.owner) {
          visit(adjacent);
        }
      }
    }.bind(this);
    visit(this);
    return linked;
  }
  placeTroops(troops = 0) {
    this.troops += troops;
    return this.troops;
  }
  loseTroops(troops = 0) {
    if (this.troops - troops < 0) {
      throw new Error('A territories troops count can\' be negative');
    }
    this.troops -= troops;
    return this.troops;
  }
  isNeighborTo(anotherTerritory) {
    return this.neighbors.includes(anotherTerritory);
  }
}

export default Territory;
