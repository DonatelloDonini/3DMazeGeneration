class Millimeter {
  constructor(measure) {
    this.measure = measure;
  }

  toMillimeters() {
    return this.measure;
  }

  toCentimeters() {
    return this.measure / 10;
  }

  toMeters() {
    return this.measure / 1000;
  }

  toKilometers() {
    return this.measure / 1e+6;
  }
}

class Centimeter {
  constructor(measure) {
    this.measure = measure;
  }

  toCentimeters() {
    return this.measure;
  }

  toMillimeters() {
    return this.measure * 10;
  }

  toMeters() {
    return this.measure / 100;
  }

  toKilometers() {
    return this.measure / 1e+5;
  }
}

class Meter {
  constructor(measure) {
    this.measure = measure;
  }

  toMeters() {
    return this.measure;
  }

  toCentimeters() {
    return this.measure * 100;
  }

  toMillimeters() {
    return this.measure * 1000;
  }

  toKilometers() {
    return this.measure / 1e+3;
  }
}

class Kilometer {
  constructor(measure) {
    this.measure = measure;
  }

  toKilometers() {
    return this.measure;
  }

  toMeters() {
    return this.measure * 1000;
  }

  toCentimeters() {
    return this.measure * 100000;
  }

  toMillimeters() {
    return this.measure * 1e+6;
  }
}


class Degrees{
  constructor(angle){
    this.measure= angle;
  }

  toRadians(){
    return this.measure * (Math.PI/180);
  }
}

export {
  Millimeter,
  Centimeter,
  Meter,
  Kilometer,
  Degrees
}