class CardDeck {
  constructor(territories) {
    const length = territories.length;
    this.territories = territories;
    this.cards = [];
    let counter = 0;
    for (const territory of territories) {
      counter++;
      let value;
      if (counter <= length / 3) {
        value = CardDeck.ARTILLERY;
      } else if (counter <= length * 2/3) {
        value = CardDeck.CAVALRY;
      } else {
        value = CardDeck.INFANTRY;
      }
      this.cards.push(new Card(territory, value));
    }
    for (let i = 0; i < 2; i++) {
      counter++;
      this.cards.push(new Card(null, CardDeck.WILD));
    }
    this.shuffle();
  }
  shuffle() {
    let temp = [];
    for (const card of this.cards) {
      const index = parseInt(Math.random()*(temp.length+1), 10);
      temp.splice(index, 0, card);
    }
    this.cards = temp;
  }
  pop() {
    return this.cards.pop();
  }
  discard(card) {
    this.cards.unshift(card);
  }
  isEmpty() {
    return this.cards.length === 0;
  }
  static pointsOfCards(values) {
    if (values.length < 3) {
      return 0;
    }
    // Wild cards are removed
    const newValues = [];
    for (const value of values) {
      if (value !== CardDeck.WILD) {
        newValues.push(value);
      }
    }
    values = newValues;
    if (!values.some((value, index, array) => array.indexOf(value, index + 1) !== -1)) {
      // All values are unique
      return 10;
    } else if (values.every((value) => value === CardDeck.INFANTRY)) {
      // All values are infantry
      return 4;
    } else if (values.every((value) => value === CardDeck.CAVALRY)) {
      // ALl values are cavalry
      return 6;
    } else if (values.every((value) => value === CardDeck.ARTILLERY)) {
      // All values are artillery
      return 8;
    } else {
      // No point giving combination was found
      return 0;
    }
  }
}
CardDeck.INFANTRY = 'INFANTRY';
CardDeck.CAVALRY = 'CAVALRY';
CardDeck.ARTILLERY = 'ARTILLERY';
CardDeck.WILD = 'WILD';

class Card {
  constructor(territory, value) {
    this.id = Card.idCounter;
    this.territory = territory;
    this.value = value;
    Card.idCounter++;
  }
  toString() {
    if (this.territory === null) {
      return 'A wildcard';
    }
    return `Card with ${this.territory.name} and value ${this.value}`;
  }
}
Card.idCounter = 1;


export default CardDeck;
