import Territory from './Territory.js';
import * as util from './util.js';

class RiskMap {
  constructor(name = 'Map', TERRITORY_DATA, CONTINENT_DATA) {
    this.name = name;
    this.territories = new Map();
    this.continents = [];

    // Create continents from data
    for (const continent of CONTINENT_DATA) {
      const continentObj = new Continent(continent.name, continent.points);
      this.addContinent(continentObj);
    }

    // Create territories from data
    for (const territory of TERRITORY_DATA) {
      const territoryObj = this.addTerritory(territory.name);
      if (!this.continents.some((continent) => {
        return continent.name === territory.continent;
      })) {
        throw new Error(`There doesn't exist any continent with name \
          ${territory.continent}`);
      }
      for (const continent of this.continents) {
        if (continent.name === territory.continent) {
          continent.addTerritory(territoryObj);
        }
      }
    }

    // Add neighbors for territories from data
    for (const territory of TERRITORY_DATA) {
      const territoryObj = this.territories.get(territory.name);
      for (const neighbor of territory.neighbors) {
        if (!this.territories.has(neighbor)) {
          throw new Error(`"${neighbor}" doesn't exist as a territory\
            and can't therefore be added as a neighbor`);
        }
        const neighborObj = this.territories.get(neighbor);
        territoryObj.addNeighbor(neighborObj);
      }
    }
  }
  addTerritory(name) {
    if (this.territories.has(name)) {
      throw new Error('Two territories can\'t have the same name');
    }
    const territory = new Territory(name)
    this.territories.set(territory.name, territory);
    return territory;
  }
  addContinent(continent) {
    this.continents.push(continent);
  }
  calcBonus(territories) {
    let bonus = 0;
    for (const continent of this.continents) {
      let hasContinent = true;
      for (const territory of continent.territories) {
        if (territories.includes(territory) === false) {
          hasContinent = false;
          break;
        }
      }
      if (hasContinent === true) {
        console.debug(`${territories[0].owner.name} has ${continent.name} \
           and receives ${continent.points} troop${util.pl(continent.points)}`);
        bonus += continent.points;
      }
    }
    return bonus;
  }
  getTerritory(terrName) {
    return this.territories.get(terrName);
  }
}

class WorldMap extends RiskMap {
  constructor(TERRITORY_DATA, CONTINENT_DATA) {
    super('World Map', TERRITORY_DATA, CONTINENT_DATA);
  }
}
class Continent {
  constructor(name, points) {
    this.territories = [];
    this.name = name;
    this.points = points;
  }
  addTerritory(territory) {
    this.territories.push(territory);
  }
}

export default WorldMap;
