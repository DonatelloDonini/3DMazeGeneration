# 3DMazeGeneration
A JS-based web interface to visualize 3D models of a certain Rescue Maze map based on a set (a sequence) of packages sent from a robot.

![image](https://github.com/DonatelloDonini/3DMazeGeneration/assets/134225482/4ece1881-cd3e-4276-bc55-73186c8560cc)


# GET IT ON YOUR MACHINE (todo)
// the list of commands to get the repository code on your machine

# VERSIONS
## V 1.0.0:
- Support for flat mazes
- Dynamic generation

## V 1.1.0:
- Support for multi-level mazes
- Performance optimizations

## V 1.2.0 (work in progress):
- Setup actual communication with raspberry and have the map update on raspbery's sent packages

## V 1.3.0 (future update):
- Loop closure
- A placeholder model of the robot is shown navigating the maze
- Checks will be applied to alert the user when a maze has some strange properties I.E. ramps too steep, victims near colored floors, other competition clause

## V 1.4.0 (future update):
- Pathfinding suggestions: the shortest path from tile A to tile B (chosen by the user) will be shown. (it won't necessarily be the path the robot will take)

## Technical details
The matrix is not pre-defined, because of that, there is the possibility to visualize a mazes big as the computational limit of your machine.
