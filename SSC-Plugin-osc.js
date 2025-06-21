/* Chataigne Module for d&b audiotechnik Soundscape DAW Plugin OSC v1.0 (c) Mathieu Delquignies, 06/2025
===============================================================================
This file is a Chataigne Custom Module to catch OSC commands from Soundscape DAW or console plugin and forward it to d&b audiotechnik DS100.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:
1. Redistributions of source code must retain the above copyright notice,
this list of conditions and the following disclaimer.
2. Redistributions in binary form must reproduce the above copyright notice,
this list of conditions and the following disclaimer in the documentation
and/or other materials provided with the distribution.
3. The name of the author may not be used to endorse or promote products
derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED "AS IS" AND ANY
EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY DIRECT, INDIRECT,
INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE
OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF
ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
===============================================================================
*/

/** 
 * Constants
 * 
 * Table of OSC strings from https://www.dbsoundscape.com/assets/products/downloads/manuals-documentation/electronics/dbaudio-osc-protocol-ds100-1.3.9-en.pdf 
 * Juce Javascript don't allow const so they are defined as global variable instead, see https://docs.juce.com/master/index.html
 */
var OSCDeviceName = "/dbaudio1/settings/devicename";
var OSCDeviceSerial = "/dbaudio1/fixed/sernr";
var OSCPing = "/ping";
var OSCPong = "/pong";
var OSCGnrlErr = "/dbaudio1/error/gnrlerr";
var OSCErrorText = "/dbaudio1/error/errortext";
var OSCDeviceClear = "/dbaudio1/device/clear";
var OSCRoomId = "/dbaudio1/matrixsettings/reverbroomid";
var OSCPreDelayFactor ="/dbaudio1/matrixsettings/reverbpredelayfactor";
var OSCRearLevel ="/dbaudio1/matrixsettings/reverbrearlevel";
var OSCOutputGain = "/dbaudio1/matrixoutput/gain/";
var OSCSceneNext = "/dbaudio1/scene/next";
var OSCScenePrevious = "/dbaudio1/scene/previous";
var OSCSceneRecall = "/dbaudio1/scene/recall/";
var OSCSpread = "/dbaudio1/positioning/source_spread/";
var OSCDelayMode = "/dbaudio1/positioning/source_delaymode/";
var OSCPositionXY = "/dbaudio1/coordinatemapping/source_position_xy/";
var OSCPositionXYZ = "/dbaudio1/coordinatemapping/source_position/";
var OSCPositionX = "/dbaudio1/coordinatemapping/source_position_x/";
var OSCPositionY = "/dbaudio1/coordinatemapping/source_position_y/";
var OSCPositionZ = "/dbaudio1/coordinatemapping/source_position_z/";
var OSCRevGain = "/dbaudio1/matrixinput/reverbsendgain/";
var OSCInputGain = "/dbaudio1/matrixinput/gain/";
var OSCChannelName = "/dbaudio1/matrixinput/channelname/";
var OSCSceneIndex = "/dbaudio1/scene/sceneindex";
var OSCSceneName = "/dbaudio1/scene/scenename";
var OSCSceneComment = "/dbaudio1/scene/scenecomment";
var OSCInputMute = "/dbaudio1/matrixinput/mute/";
var OSCFGOutputGain = "/dbaudio1/soundobjectrouting/gain/";
var OSCFGOutputMute = "/dbaudio1/soundobjectrouting/mute/";
var OSCSRStatus = "/dbaudio1/status/audionetworksamplestatus";
var OSCMeter ="/dbaudio1/matrixinput/levelmeterpremute/";

/** 
 * Global variables
 */
var xy = [];
var reverb = [];
var spread = [];
var delay = [];

/**
 * This function is called automatically by Chataigne when you add the module in your Noisette.
 * Used for GUI initialisation, global OSC Rx management with callbacks and soundObjects container construction.
 */
function init() 
{
	// Add Sound Objects Positions XY, reverb, spread and delay containers of values
	XYContainer = local.values.addContainer("XY", "X and Y values for each objects");
	XYContainer.setCollapsed(true);
	reverbContainer = local.values.addContainer("Reverb", "En-Space level for each objects");
	reverbContainer.setCollapsed(true);
	spreadContainer = local.values.addContainer("Spread", "Spread for each objects");
	spreadContainer.setCollapsed(true);
	delayContainer = local.values.addContainer("Delay", "Delay mode for each objects");
	delayContainer.setCollapsed(true);
	local.parameters.oscOutputs.pass_toDS100.listenToFeedback.setAttribute("enabled", false);

	// Add 64 values into those containers
	for (var i = 1; i <= 64; i++) {
    	xy[i]= XYContainer.addPoint2DParameter(i, "XY");
		//xy[i].setAttribute("readonly", true);
		reverb[i]= reverbContainer.addFloatParameter(i, "Reverb", 0, -120, 24);
		//reverb[i].setAttribute("readonly", true);
		spread[i]= spreadContainer.addFloatParameter(i, "Spread", 0, 0, 1);
		//spread[i].setAttribute("readonly", true);
		delay[i]= delayContainer.addIntParameter(i, "Delay", 0, 0, 2);
		//delay[i].setAttribute("readonly", true);
    	};
}

/**
 * This function is called automatically by Chataigne when a module parameter changes in GUI
 * @param {Parameters} param 
 */
function moduleParameterChanged(param)
{
}

/**
 * This function is called automatically by Chataigne when a module value changes
 * @param {value} value 
 */
function moduleValueChanged(value)
{
}

/**
 * Called when an OSC message is received
 * Parse received values 
 * @param {string} address 
 * @param {array} args 
 */
function oscEvent(address, args, originIp)
{
	if (local.match(address, OSCPing)) local.sendTo(originIp, 50011, OSCPong); // turn on the blue indicator
	else if (local.match(address, OSCPositionXY+"*/*/")) // this is position XY
		{
			id=parseInt(address.substring(OSCPositionXY.length+2, address.length)); // add 2 to skip coordinate mapping ID
			mapping=parseInt(address.substring(OSCPositionXY.length, OSCPositionXY.length+1)); // ? usefull to store the mappings as values ? TBC, from now just used for pass-throughs
			if(args.length==0)
			{
				// no args means RX mode on plugin, so send back the value to it
				local.sendTo(originIp, 50011, OSCPositionXY+mapping+"/"+id+"/", xy[id].get());
			}
			else
			{
				xy[id].set(args[0], args[1]);
				if(local.parameters.pass_toDS100XY.get()) coordinateMappingSourcePositionXY(mapping, id, xy[id].get()); // pass-through positions
			}
		}
	else if (local.match(address, OSCRevGain+"*/")) // this is En-Space send level
		{
			id=parseInt(address.substring(OSCRevGain.length, address.length));
			if(args.length==0)
			{
				// no args means RX mode on plugin, so send back the value to it
				local.sendTo(originIp, 50011, OSCRevGain+id+"/", reverb[id].get());
			}
			else
			{
				reverb[id].set(args[0]);
				if(local.parameters.pass_toDS100Reverb.get()) reverbSendGain(id, reverb[id].get()); // pass-through reverb
			}
		}
	else if (local.match(address, OSCSpread+"*/")) // this is Spread level
		{
			id=parseInt(address.substring(OSCSpread.length, address.length));
			if(args.length==0)
			{
				// no args means RX mode on plugin, so send back the value to it
				local.sendTo(originIp, 50011, OSCSpread+id+"/", spread[id].get());
			}
			else
			{
				spread[id].set(args[0]);
				if(local.parameters.pass_toDS100Spread.get()) sourceSpread(id, spread[id].get()); // pass-through spread
			}
		}
	else if (local.match(address, OSCDelayMode+"*/")) // this is Delay mode (as integer 0=off, 1=tight, 2=full)
		{
			id=parseInt(address.substring(OSCDelayMode.length, address.length));
			if(args.length==0)
			{
				// no args means RX mode on plugin, so send back the value to it
				local.sendTo(originIp, 50011, OSCDelayMode+id+"/", delay[id].get());
			}
			else
			{
				delay[id].set(args[0]);
				if(local.parameters.pass_toDS100Delay.get()) sourceDelayMode(id, delay[id].get()); // pass-through delay
			}
		}
	else 
		{
		script.logWarning("OSC Event parser received useless OSC messages: " + address + " " + args);
		}
}

/*	===============================================================================
	Commands to send OSC messages to DS100
	===============================================================================
*/

/*	===============================================================================
	DS100 global commands
*/

/**
 * Clear all DS100 settings, with a OkCancelBox to confirm
 */
function deviceClear()
{
	if (util.showOkCancelBox("DeviceClear","It will clear all device settings !", "(excluding IP)\n Are you sure ?", "warning", "Yes, clear all values","Naaah"))
	{
		local.send(OSCDeviceClear);
	}
}

/**
 * Set the reverb room id
 * @param {integer} id (0=off, 1-9=room model)
 */
function reverbRoomId(id)
{
	local.send(OSCRoomId, id);
}

/**
 * Set EnSpace reverb predelay factor
 * @param {float} factor 
 */
function preDelayFactor(factor)
{
	local.send(OSCPreDelayFactor, factor);
}

/**
 * Set EnSpace reverb rear level
 * @param {float} level 
 */
function rearLevel(level)
{
	local.send(OSCRearLevel, level);
}

/**
 * Set global output level with overwriting all DS100 outputs levels by joker
 * !!! Use with care as it overwrite all matrix outputs levels !!!
 * @param {float} gain (from -120 to +24 in dB)
 */
function masterOutputLevel(gain)
{
	local.send(OSCOutputGain + "*", gain);
}

/*	===============================================================================
	Commands for scene manipulation
*/

/**
 * Recall previous scene
 */
function nextScene() 
{
	local.send(OSCSceneNext);
}

/**
 * Recall next scene
 */
function previousScene() 
{
	local.send(OSCScenePrevious);
}

/**
 * Recal a specific scene. 
 * Scene index is split in two integers: majIndex.minIndex, max is 999.99
 * @param {integer} majIndex 
 * @param {integer} minIndex 
 */
function sceneRecall(majIndex, minIndex)
{
	local.send(OSCSceneRecall, majIndex , minIndex );
}

/* 	===============================================================================
	Commands for sound objects manipulation
*/

/**
 * Set the spread parameter of a specific sound object by its matrix input number
 * @param {integer} object 
 * @param {float} spread 
 */
function sourceSpread(object, spread)
{
	local.send(OSCSpread + object, spread);
}

/**
 * Set the delay mode of a specific sound object by its matrix input number
 * @param {integer} object 
 * @param {integer} mode 
 */
function sourceDelayMode(object, mode)
{
	local.send(OSCDelayMode + object, mode);
}

/**
 * Set a specific sound object X position in a specified coordinate Mapping, with DS100 cartesian standard limits (0,0)-(1,1)
 * @param {integer} coordinateMapping 
 * @param {integer} object 
 * @param {float} X 
 */
function coordinateMappingSourcePositionX(coordinateMapping, object, X) 
{
	if (coordinateMapping==0) {
		coordinateMapping=defaultCoordinateMapping;
		}
	local.send(OSCPositionX + coordinateMapping + "/" + object, X);
}

/**
 * Set a specific sound object Y position in a specified coordinate Mapping, with DS100 cartesian standard limits (0,0)-(1,1)
 * @param {integer} coordinateMapping 
 * @param {integer} object 
 * @param {point2D array} Y 
 */
function coordinateMappingSourcePositionY(coordinateMapping, object, Y) 
{
	if (coordinateMapping==0) {
		coordinateMapping=defaultCoordinateMapping;
		}
	local.send(OSCPositionY + coordinateMapping + "/" + object, Y );
}

/**
 * Set a specific sound object Z position in a specified coordinate Mapping, with DS100 cartesian standard limits (0,0)-(1,1)
 * @param {integer} coordinateMapping 
 * @param {integer} object 
 * @param {point2D array} Z 
 */
function coordinateMappingSourcePositionZ(coordinateMapping, object, Z) 
{
	if (coordinateMapping==0) {
		coordinateMapping=defaultCoordinateMapping;
		}
	local.send(OSCPositionZ + coordinateMapping + "/" + object, Z );
}

/**
 * Set a specific sound object position in a specified coordinate Mapping, with DS100 cartesian XY standard limits (0,0)-(1,1)
 * @param {integer} coordinateMapping 
 * @param {integer} object 
 * @param {point2D array} position 
 */
function coordinateMappingSourcePositionXY(coordinateMapping, object, position) 
{
	if (coordinateMapping==0) {
		coordinateMapping=defaultCoordinateMapping;
		}
	local.send(OSCPositionXY + coordinateMapping + "/" + object, position[0] , position[1] );
}

/**
 * Set a specific sound object position in a specified coordinate Mapping, with DS100 cartesian XYZ standard limits (0,0)-(1,1)
 * @param {integer} coordinateMapping 
 * @param {integer} object 
 * @param {point3D array} position 
 */
function coordinateMappingSourcePoint3D(coordinateMapping, object, position) 
{
	if (coordinateMapping==0) {
		coordinateMapping=defaultCoordinateMapping;
		}
	local.send(OSCPositionXYZ + coordinateMapping + "/" + object, position[0] , position[1], position[2]);
}

/**
 * Set a specific sound object position in a specified coordinate Mapping, with Chataigne Point2D axis (center @(0.5,0.5), limits (-1,-1)-(1,1))
 * @param {integer} coordinateMapping 
 * @param {integer} object 
 * @param {point2D array} position 
 */
function coordinateMappingSourcePoint2D(coordinateMapping, object, position) 
{
	var pos=[];
	pos[0]=(1+position[0])/2;
	pos[1]=(1+position[1])/2;
	coordinateMappingSourcePositionXY(coordinateMapping, object, pos);
}

/**
 * Set a specific sound object position in a specified coordinate Mapping, in polar coordinates (azimuth,distance), with center @(0.5,0.5)
 * @param {integer} coordinateMapping 
 * @param {integer} object 
 * @param {float} azimuth 
 * @param {float} distance 
 */
function coordinateMappingSourcePositionPolar(coordinateMapping, object, azimuth, distance) 
{
	var pos=[];
	pos[0]=0.5 + (distance /2 * Math.cos((0.25 - azimuth) * 2 * Math.PI));
	pos[1]=0.5 + (distance /2 * Math.sin((0.25 - azimuth) * 2 * Math.PI));
	coordinateMappingSourcePositionXY(coordinateMapping, object, pos);
}

/**
 * Set the EnSpace reverb level send for a specific object
 * @param {integer} object 
 * @param {float} gain (from -120 to +24 in dB)
 */
function reverbSendGain(object, gain)
{
	local.send(OSCRevGain + object, gain);
}

/**
 * Set a specific sound object level with matrix input
 * @param {integer} object 
 * @param {float} gain (from -120 to +24 in dB)
 */
function matrixInputGain(object, gain)
{
	local.send(OSCInputGain + object, gain);
}

/**
 * Set a specific sound object matrix input mute state
 * @param {integer} object 
 * @param {boolean} state 
 */
function matrixInputMute(object, state)
{
	local.send(OSCInputMute + object, state);
}


/**
 * Set a specific sound object level within a specific FG
 * @param {integer} object 
 * @param {integer} FG (Function Group, from 1 to 32)
 * @param {float} gain (from -120 to +24 in dB)
 */
 function FGOutputGain(object, FG, gain)
 {
	 local.send(OSCFGOutputGain + FG + "/" + object, gain);
 }
 
 /**
  * Set a specific sound object matrix input mute state
  * @param {integer} object
  *  * @param {integer} FG (Function Group, from 1 to 32)
  * @param {boolean} state 
  */
 function FGOutputMute(object, FG, state)
 {
	 local.send(OSCFGOutputMute + FG + "/" + object, state);
 }