import * as util from './util.js';

class Player {
  constructor(name) {
    this.name = name;
    this.territories = [];
    this.supply = 0;
    this.lost = false;
    this.cards = [];
  }
  conquerTerritory(territory, nbrTroops) {
    console.debug(`${this.name} conquered ${territory.name}`);
    this.territories.push(territory);
    if (typeof territory.owner !== 'undefined') {
      territory.owner.retreatTerritory(territory);
    }
    territory.conquer(this, nbrTroops);
  }
  retreatTerritory(territory) {
    const index = this.territories.indexOf(territory);
    if (index === -1) {
      console.error(`${this.name} didn't have ${territory.name} to retreat \
      from`);
    } else {
      console.debug(`${this.name} retreated from ${territory.name}`);
      this.territories.splice(index, 1);
      territory.owner = undefined;
    }
    if (this.territories.length === 0) {
      this.lose();
    }
  }
  receiveSupply(troops) {
    console.debug(`${this.name} received ${troops} troop${util.pl(troops)}`);
    this.supply += troops;
  }
  receiveCard(card) {
    this.cards.push(card);
  }
  loseCard(card) {
    const index = this.cards.indexOf(card);
    if (index === -1) {
      throw new Error('You didn\'t have the passed card');
    }
    this.cards.splice(index, 1);
  }
  countTroops() {
    let count = 0;
    for (const territory of this.territories) {
      count += territory.troops;
    }
    return count;
  }
  countTerritories() {
    return this.territories.length;
  }
  getCards() {
    return this.cards;
  }
  lose() {
    console.debug(`${this.name} has lost`);
    this.lost = true;
  }
}

export default Player;
