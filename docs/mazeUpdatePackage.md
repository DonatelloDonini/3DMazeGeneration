mazeUpdatePackage.json
---

## Format
```
{
  "id": number,
  "direction"?: number,
  "positionUpdate"?: number,
  "floor"?: number,
  "walls"?: number,
  "victim"?: number,
  "ramp"?: number,
  "rampLength"?: number
}
```

## Params explanation
### id: _number_ [0-n] [optional]
The `id` parameter is a progressive number.\
It indicates the number of an update package, it's used to determine wether a network error has occurred (to see if all the packages were delivered).
### direction: _number_ [0-3] [optional]
The `direction` parameter is a number indicating where it's facing.\
Respectively
* 0 forwards
* 1 right
* 2 backwards
* 3 left

Attention!\
This parameter is always checked before the positionUpdate
### positionUpdate: _number_ [0-1] [optional]
The `positionUpdate` parameter indicates the number of cells gone forwards from the last update (it doesn't take into account the direction since there's another paramter specifying it)

The directions are calculated considering the initial position of the robot as reference (at initialization robot always has direction 0).
### floor: _number_ [0-4] [optional]
The `floor` parameter is a number indicating the type of floor the robot is currently moving on.\
Respectively
* 0 for regular floor
* 1 for black floor
* 2 for blue floor
* 3 for checkpoint
### walls: _number_ [0-15] [optional]
The `walls` parameter is a number from 0 to 15 and represents all the walls currenlty around the robot.\
To get the numbers you must convert the value into binary, after that you start from the top and go clockwise placing the different digits you got from the binary conversion, the numbers are on the sides with the number `1`.
### victim: _number_ [optional]
The `victim` parameter is optional and represents the type of victim encountered at the moment.\
Respectively
* 0 for letter `U` victims on the left side
* 1 for letter `S` victims on the left side
* 2 for letter `H` victims on the left side
* 100 for letter `U` victims on the right side
* 101 for letter `S` victims on the right side
* 102 for letter `H` victims on the right side
* 10 for `green` square victims on the left side
* 11 for `yellow` square victims on the left side
* 12 for `red` square victims on the left side
* 110 for `green` square victims on the right side
* 111 for `yellow` square victims on the right side
* 112 for `red` square victims on the right side

### ramp: _number_ [optional]
The `ramp` parameter, when present means that the robot has encountered a ramp, the value passed is the inclination of the ramp itself
### rampLength: _number_  [optional]
The `rampLength` parameter, when present, means that the robot has gone up (or down) a ramp and it's returning the estimated measure of the ramp itself (for a better map creation)