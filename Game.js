import {TERRITORY_DATA, CONTINENT_DATA} from './data.js';
import CardDeck from './CardDeck.js';
import WorldMap from './Maps.js';
import Player from './Player.js';
import Battlefield from './Battlefield.js';
import * as util from './util.js';

class Game {
  /* TODO:
   * Implement missions
   * ? Receive conquered card on end of round or when conquering
   * Add hook for when you receive more than 4 cards by eliminating a player
   * Add comments
   * Add functionality to customize further (game options)
   * Dynamically add data
   */
  constructor(players, {
    maxPlayers = 6,
    startTroops = [40, 35, 30, 25, 20],
  } = {}) {
    const CONFIG = {maxPlayers, startTroops};
    Object.freeze(CONFIG);
    if (players.length > CONFIG.maxPlayers) {
      throw new Error(`The number of players exceeded the max limit \
        (${CONFIG.maxPlayers} players)`);
    } else if (players.length < 2) {
      throw new Error(`The number of players is under the min limit (2 \
        players)`);
    }
    this.state = {
      playerNbr: 0,
      player: players[0],
      phase: 'init',
      battlefield: null,
      conquered: false,
    };

    this.players = players;
    this.map = new WorldMap(TERRITORY_DATA, CONTINENT_DATA);
    this.cardDeck = new CardDeck(Array.from(this.map.territories.values()));
    this.battlefields = [];

    this.assignTerritories();

    // Supply every player with a start amount of troops
    for (const player of this.players) {
      const supply = CONFIG.startTroops[this.players.length - 2] - player.countTroops();
      player.receiveSupply(supply);
    }
    this.logger('The game was initialized');

    this.changePhase('supply.supply');
    // Starting the next round as the first player
    this.nextPlayer(this.players[0]);
  }
  logger(text) {
    console.log(`%c[${this.state.phase.toUpperCase()}] ${text}`, 'color: blue;');
  }
  retreat(from, to, troops) {
    troops = parseInt(troops, 10);
    if (!this.validatePhase('round.retreat')) {
      console.error('You can\'t perform this action during this phase');
      return false;
    }
    if (!from.isLinkedWith(to)) {
      console.error(`${from.name} and ${to.name} are not connected`);
      return false;
    } else if (troops >= from.troops) {
      console.error('You can\'t move that many troops');
      return false;
    } else {
      this.logger(`${from.owner.name} retreated with ${troops} \
        troop${util.pl(troops)} from ${from.name} to ${to.name}`);
      from.loseTroops(troops);
      to.placeTroops(troops);
      this.nextRound();
      return true;
    }
  }
  walkOver() {
    this.state.player.lose();
    this.nextRound();
  }
  fight(attackingTerr, defendingTerr, attackingTroops, defendingTroops) {
    if (!this.validatePhase('round.attack')) {
      console.error('You can\'t perform this action during this phase');
      return
    }
    attackingTroops = parseInt(attackingTroops, 10);
    defendingTroops = parseInt(defendingTroops, 10);
    if (attackingTroops >= attackingTerr.troops) {
      console.error(`The attacker doesn't have enough troops in\
      ${attackingTerr.name}`);
      return;
    }
    if (defendingTroops > defendingTerr.troops) {
      console.error(`The defender doesn't have enough troops in\
      ${defendingTerr.name}`);
      return;
    }
    let battlefield = this.state.battlefield;
    if (battlefield !== null) {
      if (battlefield.attackingTerr === attackingTerr &&
          battlefield.defendingTerr === defendingTerr) {
        // Do nothing
      } else {
        this.battlefields.push(battlefield);
        battlefield = new Battlefield(attackingTerr, defendingTerr);
      }
    } else {
      battlefield = new Battlefield(attackingTerr, defendingTerr);
    }
    this.state.battlefield = battlefield;
    const defender = defendingTerr.owner;
    const won = battlefield.fight(attackingTroops, defendingTroops);
    if (won) {
      if (!this.state.conquered) {
        const card = this.cardDeck.pop();
        this.state.player.receiveCard(card);
        this.state.conquered = true;
        this.logger(`${this.state.player.name} conquered his/her first \
          territory this round and receives a card`);
        this.logger(`The card looks like this: ${card}`);
      }
      if (defender.lost) {
        const cards = defender.getCards();
        for (const card of cards) {
          defender.loseCard(card);
          this.state.player.receiveCard(card);
        }
        this.logger(`${this.state.player.name} conquered ${defender.name}'s \
          last territory and got all his/her cards`);
      }
      this.changePhase('round.attack.move');
    }
    return battlefield;
  }
  move(nbrTroops) {
    if (!this.validatePhase('round.attack.move')) {
      console.error('You can\'t perform this action during this phase');
      return false;
    }
    nbrTroops = parseInt(nbrTroops, 10);
    const lastBattle = this.state.battlefield;
    if (nbrTroops < lastBattle.lastNbrAttacking) {
      console.error('You must move at least as many troops as you battled with');
      return false;
    } else if (lastBattle.attackingTerr.troops <= nbrTroops) {
      console.error(`You don't have enough troops in \
      ${lastBattle.attackingTerr.name} to move ${nbrTroops} troops`);
      return false;
    }
    this.logger(`${this.state.player.name} moved ${nbrTroops} \
      troop${util.pl(nbrTroops)} from ${lastBattle.attackingTerr.name} \
      to ${lastBattle.defendingTerr.name}`);
    lastBattle.attackingTerr.loseTroops(nbrTroops);
    lastBattle.defendingTerr.placeTroops(nbrTroops);
    this.battlefields.push(lastBattle);
    this.state.battlefield = null;
    this.changePhase('round.attack');
    return true;
  }
  placeTroops(territory, nbrTroops = 1) {
    if (!this.validatePhase('round.supply', 'supply.supply')) {
      console.error('You can\'t perform this action during this phase');
      return false;
    }
    nbrTroops = parseInt(nbrTroops, 10);
    // Force only 1 troop during supply.supply phase
    if (this.state.phase === 'supply.supply') {
      nbrTroops = 1;
    }
    const player = territory.owner;
    if (player.supply - nbrTroops < 0) {
      console.error('You don\'t have enough supply to place the troops');
      return false;
    }
    territory.placeTroops(nbrTroops);
    player.supply -= nbrTroops;
    this.logger(`${territory.owner.name} placed ${nbrTroops} \
      troop${util.pl(nbrTroops)} in ${territory.name}`);

    if (this.state.phase === 'supply.supply') {
      this.nextPlayer();
      if (this.state.player.supply === 0) {
        this.nextPlayer(this.players[0]);
        this.supply();
      }
    } else if (this.state.phase === 'round.supply' && this.state.player.supply === 0) {
      this.changePhase('round.attack');
    }
    return true;
  }
  endAttacking(retreating = true) {
    if (!this.validatePhase('round.attack', 'round.retreat')) {
      console.error('You can\'t perform this action during this phase');
      return false;
    }
    if (!retreating) {
      this.nextRound();
    } else {
      this.changePhase('round.retreat');
    }
    return true;
  }
  tradeInCards(cards) {
    if (!this.validatePhase('round.supply')) {
      console.error('You can\'t perform this action during this phase');
      return false;
    }
    if (cards.length !== 3) {
      console.error('You must trade in 3 cards');
      return false;
    }
    const ids = [];
    let values = [];
    for (const card of cards) {
      if (ids.includes(card.id)) {
        console.error('Two cards with the same id were passed to the function');
        return false;
      }
      if (!this.state.player.cards.some((playerCard) => playerCard.id === card.id)) {
        console.error('You don\'t have these cards on your hand');
        return false;
      }
      ids.push(card.id);
      values.push(card.value);
    }
    // Validation was successful
    const troops = CardDeck.pointsOfCards(values);
    if (troops !== 0) {
      for (const card of cards) {
        if (card.territory.owner === this.state.player) {
          card.territory.placeTroops(1);
          this.logger(`${this.state.player.name} had a card of \
            ${card.territory.name} and got 1 troop in that territory.`);
        }
        this.state.player.loseCard(card);
        this.cardDeck.discard(card);
      }
      this.logger(`${this.state.player.name} traded in 3 cards and got \
        ${troops} points in return.`);
      this.state.player.receiveSupply(troops);
      return true;
    } else {
      console.warn('The cards couldn\'t be traded in');
      return false;
    }
  }
  supply() {
    this.changePhase('round.supply');
    this.logger('A new round started');
    const nbrTerritories = this.state.player.countTerritories();
    const baseSupply = Math.max(parseInt(nbrTerritories / 3, 10), 3);
    let supply = baseSupply;
    supply += this.map.calcBonus(this.state.player.territories);
    this.state.player.receiveSupply(supply);

    console.debug(`${this.state.player.name} has ${nbrTerritories} territories\
      and receives from that ${baseSupply} troops`);
    this.logger(`${this.state.player.name} got ${supply} troop${util.pl(supply)} \
      in supply`);
  }
  nextRound() {
    this.state.conquered = false;
    this.nextPlayer();
    this.supply();
  }
  nextPlayer(player) {
    if (this.players.includes(player)) {
      this.state.player = player;
      this.state.playerNbr = this.players.indexOf(player);
    } else {
      this.state.playerNbr++;
      if (this.state.playerNbr > this.players.length - 1) {
        this.state.playerNbr = 0;
      }
      this.state.player = this.players[this.state.playerNbr];
    }
    if (this.state.player.lost) {
      this.nextPlayer();
    } else {
      this.logger(`The next player is ${this.state.player.name}`);
    }
  }
  assignTerritories() {
    do {
      this.assignTerritoryToPlayer(this.state.player);
      this.nextPlayer();
    } while(this.unassignedTerritoryLeft())
  }
  assignTerritoryToPlayer(player) {
    if (this.unassignedTerritoryLeft === false) {
      console.error('There are no more territories to assign');
      return;
    }
    const territoryArray = Array.from(this.map.territories.values());
    let rand;
    let territory;
    do {
      rand = parseInt(Math.random()*territoryArray.length, 10);
      territory = territoryArray[rand];
    } while (territory.hasOwner())

    player.conquerTerritory(territory, 1);
    this.logger(`${player.name} got ${territory.name}`);
  }
  changePhase(newPhase) {
    if (typeof newPhase !== 'string') {
      return;
    }
    this.logger(`The phase of the game changed from ${this.state.phase}\
      to ${newPhase}`);
    this.state.phase = newPhase;
  }
  unassignedTerritoryLeft() {
    const territoryArray = Array.from(this.map.territories.values());
    return territoryArray.some(function (el) {
      return el.hasOwner() === false;
    })
  }
  validatePhase(...phases) {
    return phases.includes(this.state.phase);
  }
  getTerritories() {
    return this.map.territories;
  }
  getPlayers() {
    return this.players;
  }
  getCurrentPlayer() {
    return this.state.player;
  }
  getPhase() {
    return this.state.phase;
  }
}

export {Game, Player};
