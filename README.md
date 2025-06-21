# dbaudio Soundscape DAW OSC Plugin Chataigne module
Chataigne module to catch up OSC sent by d&b Soundscape OSC Plug-ins: https://github.com/dbaudio-soundscape.  

This community module is NOT OFFICIALLY supported by d&b audiotechnik.
It is publicly available to enable interested users to experiment, extend and create their own adaptations.
There is no guarantee for compatibility in between versions or for the implemented functionality to be reliable for professional.
Use what is provided here at your own risk!

That being said, I took great care to beta test all features with DS100 hardware before commits.
Please use GitHub Issues and/or contact me on Discord if you see any bug, I'll try to fix it asap !

To learn more about Chataigne, please visit : http://benjamin.kuperberg.fr/chataigne/

And Ben's Youtube channel where you can find tutorials : https://youtu.be/RSBU9MwJNLY

To learn more about d&amp;b audiotechnik DS100, please visit : https://www.dbsoundscape.com/  

For global support on how to use Chataigne and its modules, please join us on Discord : 
https://discord.com/invite/ngnJ5z my contact there is also "madees".

## Installation
To install the Custom Module, download it as ZIP file and extract it to your /Chataigne/Modules folder

## Principle of use
Receives OSC sent by the Plugin in TX mode to modules's Values containers.
Just set the Plugin's IP setting to Chataigne IP. The plugin indicator should turn on blue if the connection is OK.

If you activate RX mode on Plugin, Chataigne will sent back to it the Values. This could be usefull to write Plugin automation from Chataigne without a DS100.

It is possible to activate pass-tru of those values to DS100.

Additionally, you may use Module Commands to control DS100 parameters directly from this same Module, like remap the Values before sending them to DS100, re-patching the objects ID up to 128...
Note : The module doesn't receive anything from DS100, only from plugin.

## Module interface
First, global Module parameters :
#### Pass-thru
You can select which values to automatically forward straight to the pass-thru device.

#### OSC Output pass-thru
Set accordingly to the DS100 Devices settings. Default is the DS100 default port.
Coordinate mapping is same as it is received.

### Values
Those containers receive the plugin parameters for all objects.
You may use Chataigne Multiplex mapping to forward those to other Modules or send them modified to DS100 with Commands.

## Commands
Commands are ready to use with the "Command tester" tool, or as outputs from the State machine and Sequences in Time Machine, or from your own scripts.

#### Common arguments
- gain is in dB, float, -120 to +24 range
- object is sound object (input matrix channel), integer, 1 to 128 range
- mapping is the DS100 coordinate mapping area as specified in R1, integer. 0 will use the global module parameter, or specific area form 1 to 4.

Here is the command list, if you need to know more about arguments type and ranges, please refer to the https://www.dbaudio.com/assets/products/downloads/manuals-documentation/electronics/dbaudio-osc-protocol-ds100-1.3.7-en.pdf

- Custom Message() :
If you need one OSC command that isn't in the Module yet, the command Custom Message is there for that purpose. Just add the OSC string from documentation above and eventually Arguments. If you think this command may be usefull for other users and want to add it to the Community Module, please contact us thru Chataigne Discord or Forum : http://benjamin.kuperberg.fr/chataigne/en/#community

### Global device
- deviceClear() : clear all DS100 values settings !!! Use with care (confirmation Popup window)

- masterOutputLevel(gain) : set global output level by overwriting all DS100 outputs levels !!! Use with care

### Scenes manipulation
- nextScene() : switch to next scene

- previousScene() : switch to previous scene

- sceneRecall(majIndex, minIndex) : recal a specific scene. Scene index is split in two integers: majIndex.minIndex, max is 999.99

### EnSpace manipulation
- reverbRoomId(id) : set the reverb room id (0=off, 1-9=room model)

- preDelayFactor(float) : set the reverb pre-delay factor, from 0.2 to 2

- rearLevel(float) : set the reverb rear sources returns levels, from -24 dB to +24 dB

### Sound objects manipulation
- sourceSpread(object, spread) : set the spread parameter of a specific sound object

- sourceDelayMode(object, mode) : set the delay mode of a specific sound object

- coordinateMappingSourcePositionXY(mapping, object, position) : set a specific sound object position in a specified coordinate mapping, with DS100 cartesian XY standard limits (0,0)-(1,1)

- coordinateMappingSourcePositionX(mapping, object, position) : set a specific sound object X only position in a specified coordinate mapping, range 0-1

- coordinateMappingSourcePositionY(mapping, object, position) : set a specific sound object Y only position in a specified coordinate mapping, range 0-1

- coordinateMappingSourcePoint2D(mapping, object, position) : set a specific sound object position in a specified coordinate mapping, with Chataigne Point2D axis ( limits (-1,-1)-(1,1)), output to default DS100 coordinate mapping, center (0,0) from Chataigne will be @(0.5,0.5), and limits for (X,Y):(0,0)-(1,1).

- coordinateMappingSourcePoint3D(mapping, object, position) : set a specific sound object position in a specified coordinate mapping, with Point3D for (X,Y,Z), area limits are (0,0,0)-(1,1,1).

- coordinateMappingSourcePositionPolar(mapping, object, azimuth, distance) : set a specific sound object position in a specified coordinate mapping, in polar coordinates (azimuth,distance), azimuth & distance are floats, range 0-1, output to default DS100 coordinate mapping with center @(0.5,0.5), and limits for (X,Y):(0,0)-(1,1).

- reverbSendGain(object, gain) : set the EnSpace reverb level send for a specific object

- matrixInputGain(object, gain) : set a specific sound object level

- matrixInputMute(object, boolean) : set a specific sound object mute state

- FGOutputMute(object, boolean) : set a specific sound object mute state to a specific Function Group

- FGOutputGain(Object, gain) : set the gain of this specific Sound Object to this specific Function Group cross point
