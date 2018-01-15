import * as util from './util.js';

class Battlefield {
  constructor(attackingTerr, defendingTerr) {
    this.attacker = attackingTerr.owner;
    this.defender = defendingTerr.owner;
    if (this.attacker === this.defender) {
      throw new Error('You can\'t attack your own territory');
    } else if (!attackingTerr.isNeighborTo(defendingTerr)) {
      throw new Error(`${defendingTerr.name} isn't a neighbor to \
      ${attackingTerr.name}`);
    }
    this.attackingTerr = attackingTerr;
    this.defendingTerr = defendingTerr;
    this.won = 0;
    this.lost = 0;
    this.lastNbrAttacking = undefined;
    this.dices = [];
    this.victory = false;
    console.debug(`${attackingTerr.name} started an attack on \
      ${defendingTerr.name}`);
  }
  fight(nbrAttacking, nbrDefending) {
    if (this.victory) {
      console.error('This fight is already over');
      return true;
    }
    if (nbrAttacking > this.attackingTerr.troops) {
      throw new Error(`You don't have enough troops in \
      ${this.attackingTerr.name} to perform this attack`);
    } else if (nbrDefending > this.defendingTerr.troops) {
      throw new Error(`You don't have enough troops in \
      ${this.defendingTerr.name} to perform this defend`);
    }
    nbrAttacking = Math.min(nbrAttacking, 3);
    nbrDefending = Math.min(nbrDefending, 2);
    this.lastNbrAttacking = nbrAttacking;

    const dices = this.rollDices(nbrAttacking, nbrDefending);
    this.dices.push(dices);

    console.debug(`${this.attacker.name} through ${dices.attackingDices}`);
    console.debug(`${this.defender.name} through ${dices.defendingDices}`);

    const outcome = Battlefield.outcomeOfDices(dices.attackingDices, dices.defendingDices);
    this.lose(outcome.def);
    this.win(outcome.att);

    if (this.defendingTerr.troops === 0) {
      this.victory = true;
      console.debug(`${this.attacker.name} finally won in the battle \
        between ${this.attackingTerr.name} and ${this.defendingTerr.name}`);
      this.attacker.conquerTerritory(this.defendingTerr, 0);
      return true;
    } else {
      return false;
    }
  }
  rollDices(attacking, defending) {
    const attackingDices = [];
    const defendingDices = [];
    for (let i = 0; i < attacking; i++) {
      const dice = parseInt(Math.random()*6, 10) + 1;
      attackingDices.push(dice);
    }
    for (let i = 0; i < defending; i++) {
      const dice = parseInt(Math.random()*6, 10) + 1;
      defendingDices.push(dice);
    }
    attackingDices.sort();
    defendingDices.sort();
    return {
      attackingDices,
      defendingDices
    }
  }
  win(troops) {
    this.won += troops;
    this.defendingTerr.loseTroops(troops);
    console.debug(`${this.defendingTerr.name} lost ${troops} troop${util.pl(troops)} \
    in the fight`);
  }
  lose(troops) {
    this.lost += troops;
    this.attackingTerr.loseTroops(troops);
    console.debug(`${this.attackingTerr.name} lost ${troops} troop${util.pl(troops)} \
    in the fight`);
  }
  static outcomeOfDices(attDices, defDices){
    attDices
      .sort()
      .reverse();
    defDices
      .sort()
      .reverse();
    const outcome = {
      att: 0,
      def: 0,
    };
    for (let i = 0; i < Math.min(attDices.length, defDices.length); i++) {
      if (attDices[i] > defDices[i]) {
        outcome.att++;
      } else {
        outcome.def++;
      }
    }
    return outcome;
  }
  getLastDices() {
    return this.dices[this.dices.length - 1];
  }
}

export default Battlefield;
