class NotImplementedError extends Error{
  constructor(message="This method has not jet been implemented"){
    super(message);
    this.name= "NotImplementedError";
  }
}

class LostPackageError extends Error{
  constructor(message="There was an error in the communication and one or more packages were lost"){
    super(message);
    this.name= "LostPackageError";
  }
}

class NotValidDirectionError extends Error{
  constructor(direction= null, message="The direction passed is not valid."){
    if (direction!== null){
      message+= `\nDirection passed: ${direction}`;
    }
    
    super(message);
    this.name= "NotValidDirectionError";
  }
}

class InvalidFloorCodeError extends Error{
  constructor(floorCode= null, message="The floor code passed isn't valid"){
    if (floorCode!== null){
      message+= `\nFloor code passed: ${floorCode}`;
    }

    super(message);
    this.name= "InvalidFloorCodeError";
  }
}

class InvalidVictimError extends Error{
  constructor(victim= null, message="The victim code passed is not valid."){
    if (victim!== null){
      message+= `\nVictim passed: ${victim}`;
    }
    super(message);
    this.name= "InvalidVictimError";
  }
}

class SideNotValidError extends Error{
  constructor(side= null, message="The side you want to add the victim to does not exist."){
    if (side!== null){
      message+= `\nSide passed: ${side}`;
    }
    super(message);
    this.name= "SideNotValidError";
  }
}

export {
  NotImplementedError,
  LostPackageError,
  NotValidDirectionError,
  InvalidFloorCodeError,
  InvalidVictimError,
  SideNotValidError
}