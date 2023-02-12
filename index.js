"use strict";
exports.__esModule = true;
exports.PlayerState = exports.getEffectLevel = exports.getStatusEffectNamesForVersion = exports.Physics = exports.clamp = void 0;
var minemath_1 = require("minemath");
var vec3_1 = require("vec3");
var data_registries_1 = require("data-registries");
function clamp(min, x, max) {
    return Math.max(min, Math.min(x, max));
}
exports.clamp = clamp;
function Physics(mcData, world) {
    var blocksByName = mcData.blocksByName;
    var blockSlipperiness = {};
    var slimeBlockId = blocksByName.slime_block ? blocksByName.slime_block.id : blocksByName.slime.id;
    blockSlipperiness[slimeBlockId] = 0.8;
    blockSlipperiness[blocksByName.ice.id] = 0.98;
    blockSlipperiness[blocksByName.packed_ice.id] = 0.98;
    if (blocksByName.frosted_ice) { // 1.9+
        blockSlipperiness[blocksByName.frosted_ice.id] = 0.98;
    }
    if (blocksByName.blue_ice) { // 1.13+
        blockSlipperiness[blocksByName.blue_ice.id] = 0.989;
    }
    // Block ids
    var soulsandId = blocksByName.soul_sand.id;
    var honeyblockId = blocksByName.honey_block ? blocksByName.honey_block.id : -1; // 1.15+
    var webId = blocksByName.cobweb ? blocksByName.cobweb.id : blocksByName.web.id;
    var waterId = blocksByName.water.id;
    var lavaId = blocksByName.lava.id;
    var ladderId = blocksByName.ladder.id;
    var vineId = blocksByName.vine.id;
    var physics = {
        adjustPositionHeight: function (pos) {
            var playerBB = getPlayerBB(pos);
            var queryBB = playerBB.clone().extend(0, -1, 0);
            var surroundingBBs = getSurroundingBBs(world, queryBB);
            var dy = -1;
            for (var _i = 0, surroundingBBs_1 = surroundingBBs; _i < surroundingBBs_1.length; _i++) {
                var blockBB = surroundingBBs_1[_i];
                dy = blockBB.computeOffsetY(playerBB, dy);
            }
            pos.y += dy;
        },
        gravity: 0.08,
        airdrag: Math.fround(1 - 0.02),
        yawSpeed: 3.0,
        pitchSpeed: 3.0,
        playerSpeed: 0.1,
        sprintSpeed: 0.3,
        sneakSpeed: 0.3,
        stepHeight: 0.6,
        negligeableVelocity: 0.003,
        soulsandSpeed: 0.4,
        honeyblockSpeed: 0.4,
        honeyblockJumpSpeed: 0.4,
        ladderMaxSpeed: 0.15,
        ladderClimbSpeed: 0.2,
        playerHalfWidth: 0.3,
        playerHeight: 1.8,
        waterInertia: 0.8,
        lavaInertia: 0.5,
        liquidAcceleration: 0.02,
        airborneInertia: 0.91,
        airborneAcceleration: 0.02,
        defaultSlipperiness: 0.6,
        outOfLiquidImpulse: 0.3,
        autojumpCooldown: 10,
        bubbleColumnSurfaceDrag: {
            down: 0.03,
            maxDown: -0.9,
            up: 0.1,
            maxUp: 1.8
        },
        bubbleColumnDrag: {
            down: 0.03,
            maxDown: -0.3,
            up: 0.06,
            maxUp: 0.7
        },
        slowFalling: 0.125,
        waterGravity: 0,
        lavaGravity: 0
    };
    physics.waterGravity = physics.gravity / 16;
    physics.lavaGravity = physics.gravity / 4;
    function getPlayerBB(pos) {
        var w = physics.playerHalfWidth;
        return new minemath_1.AxisAlignedBB(new vec3_1.Vec3(-w, 0, -w), new vec3_1.Vec3(w, physics.playerHeight, w)).offset(pos.x, pos.y, pos.z);
    }
    function setPositionToBB(bb, pos) {
        pos.x = bb.min.x + physics.playerHalfWidth;
        pos.y = bb.min.y;
        pos.z = bb.min.z + physics.playerHalfWidth;
    }
    function getSurroundingBBs(world, queryBB) {
        var result = [];
        var cursor = new vec3_1.Vec3(0, 0, 0);
        var fmin = queryBB.min.floor();
        var fmax = queryBB.max.floor();
        for (cursor.y = fmin.y - 1; cursor.y <= fmax.y; cursor.y++) {
            for (cursor.z = fmin.z - 1; cursor.z <= fmax.z; cursor.z++) {
                for (cursor.x = fmin.x - 1; cursor.x <= fmax.x; cursor.x++) {
                    var block = world.getBlock(cursor);
                    if (block) {
                        for (var _i = 0, _a = block.shapes; _i < _a.length; _i++) {
                            var shape = _a[_i];
                            var blockBB = new minemath_1.AxisAlignedBB(new vec3_1.Vec3(shape[0], shape[1], shape[2]), new vec3_1.Vec3(shape[3], shape[4], shape[5]));
                            blockBB.offset(block.position.x, block.position.y, block.position.z);
                            result.push(blockBB);
                        }
                    }
                }
            }
        }
        return result;
    }
    function moveEntity(entity, world, dx, dy, dz) {
        var vel = entity.vel;
        var pos = entity.pos;
        if (entity.isInWeb) {
            dx *= 0.25;
            dy *= 0.25;
            dz *= 0.25;
            vel.x = 0;
            vel.y = 0;
            vel.z = 0;
            entity.isInWeb = false;
        }
        var oldVelX = dx;
        var oldVelY = dy;
        var oldVelZ = dz;
        if (entity.control.sneak && entity.onGround) {
            var step = 0.05;
            // todo: block edge detection
        }
        var playerBB = getPlayerBB(pos);
        var queryBB = playerBB.clone().extend(dx, dy, dz);
        var surroundingBBs = getSurroundingBBs(world, queryBB);
        var oldBB = playerBB.clone();
        for (var _i = 0, surroundingBBs_2 = surroundingBBs; _i < surroundingBBs_2.length; _i++) {
            var blockBB = surroundingBBs_2[_i];
            dy = blockBB.computeOffsetY(playerBB, dy);
        }
        playerBB.offset(0, dy, 0);
        for (var _a = 0, surroundingBBs_3 = surroundingBBs; _a < surroundingBBs_3.length; _a++) {
            var blockBB = surroundingBBs_3[_a];
            dx = blockBB.computeOffsetX(playerBB, dx);
        }
        playerBB.offset(dx, 0, 0);
        for (var _b = 0, surroundingBBs_4 = surroundingBBs; _b < surroundingBBs_4.length; _b++) {
            var blockBB = surroundingBBs_4[_b];
            dz = blockBB.computeOffsetY(playerBB, dz);
        }
        playerBB.offset(0, 0, dz);
        if (physics.stepHeight > 0 &&
            (entity.onGround || (dy !== oldVelY && oldVelY < 0)) &&
            (dx !== oldVelX || dz !== oldVelZ)) {
            var oldVelXCol = dx;
            var oldVelYCol = dy;
            var oldVelZCol = dz;
            var oldBBCol = playerBB.clone();
            dy = physics.stepHeight;
            var queryBB_1 = oldBB.clone().extend(oldVelX, dy, oldVelZ);
            var surroundingBBs_9 = getSurroundingBBs(world, queryBB_1);
            var BB1 = oldBB.clone();
            var BB2 = oldBB.clone();
            var BB_XZ = BB1.clone().extend(dx, 0, dz);
            var dy1 = dy;
            var dy2 = dy;
            for (var _c = 0, surroundingBBs_5 = surroundingBBs_9; _c < surroundingBBs_5.length; _c++) {
                var blockBB = surroundingBBs_5[_c];
                dy1 = blockBB.computeOffsetY(BB_XZ, dy1);
                dy2 = blockBB.computeOffsetY(BB2, dy2);
            }
            BB1.offset(0, dy1, 0);
            BB2.offset(0, dy2, 0);
            var dx1 = oldVelX;
            var dx2 = oldVelX;
            for (var _d = 0, surroundingBBs_6 = surroundingBBs_9; _d < surroundingBBs_6.length; _d++) {
                var blockBB = surroundingBBs_6[_d];
                dx1 = blockBB.computeOffsetX(BB1, dx1);
                dx2 = blockBB.computeOffsetX(BB2, dx2);
            }
            BB1.offset(dx1, 0, 0);
            BB2.offset(dx2, 0, 0);
            var dz1 = oldVelZ;
            var dz2 = oldVelZ;
            for (var _e = 0, surroundingBBs_7 = surroundingBBs_9; _e < surroundingBBs_7.length; _e++) {
                var blockBB = surroundingBBs_7[_e];
                dz1 = blockBB.computeOffsetZ(BB1, dz1);
                dz2 = blockBB.computeOffsetZ(BB2, dz2);
            }
            BB1.offset(0, 0, dz1);
            BB2.offset(0, 0, dz2);
            var norm1 = dx1 * dx1 + dz1 * dz1;
            var norm2 = dx2 * dx2 + dz2 * dz2;
            if (norm1 > norm2) {
                dx = dx1;
                dy = -dy1;
                dz = dz1;
                playerBB = BB1;
            }
            else {
                dx = dx2;
                dy = -dy2;
                dz = dz2;
                playerBB = BB2;
            }
            for (var _f = 0, surroundingBBs_8 = surroundingBBs_9; _f < surroundingBBs_8.length; _f++) {
                var blockBB = surroundingBBs_8[_f];
                dy = blockBB.computeOffsetY(playerBB, dy);
            }
            playerBB.offset(0, dy, 0);
            if (oldVelXCol * oldVelXCol + oldVelZCol * oldVelZCol >= dx * dx + dz * dz) {
                dx = oldVelXCol;
                dy = oldVelYCol;
                dz = oldVelZCol;
                playerBB = oldBBCol;
            }
        }
        setPositionToBB(playerBB, pos);
        entity.isCollidedHorizontally = dx !== oldVelX || dz !== oldVelZ;
        entity.isCollidedVertically = dy !== oldVelY;
        entity.onGround = entity.isCollidedVertically && oldVelY < 0;
        var blockAtFeet = world.getBlock(pos.offset(0, -0.2, 0));
        if (dx !== oldVelX)
            vel.x = 0;
        if (dz !== oldVelZ)
            vel.z = 0;
        if (dy !== oldVelY) {
            if (blockAtFeet && blockAtFeet.type === slimeBlockId && !entity.control.sneak) {
                vel.y = -vel.y;
            }
            else {
                vel.y = 0;
            }
        }
        playerBB.contract(0.001, 0.001, 0.001);
        var cursor = new vec3_1.Vec3(0, 0, 0);
        for (cursor.y = Math.floor(playerBB.min.y); cursor.y <= Math.floor(playerBB.max.y); cursor.y++) {
            for (cursor.z = Math.floor(playerBB.min.z); cursor.z <= Math.floor(playerBB.max.z); cursor.z++) {
                for (cursor.x = Math.floor(playerBB.min.x); cursor.x <= Math.floor(playerBB.max.x); cursor.x++) {
                    var block = world.getBlock(cursor);
                    if (block) {
                        if (block.type === soulsandId) {
                            vel.x *= physics.soulsandSpeed;
                            vel.z *= physics.soulsandSpeed;
                        }
                        else if (block.type === honeyblockId) {
                            vel.x *= physics.honeyblockSpeed;
                            vel.z *= physics.honeyblockSpeed;
                        }
                        if (block.type === webId) {
                            entity.isInWeb = true;
                        }
                    }
                }
            }
        }
        var blockBelow = world.getBlock(entity.pos.floored().offset(0, -0.5, 0));
        if (blockBelow) {
            if (blockBelow.type === soulsandId) {
                vel.x *= physics.soulsandSpeed;
                vel.z *= physics.soulsandSpeed;
            }
            else if (blockBelow.type === honeyblockId) {
                vel.x *= physics.honeyblockSpeed;
                vel.z *= physics.honeyblockSpeed;
            }
        }
    }
    function applyHeading(entity, strafe, forward, multiplier) {
        var speed = Math.sqrt(strafe * strafe + forward * forward);
        if (speed < 0.01)
            return new vec3_1.Vec3(0, 0, 0);
        speed = multiplier / Math.max(speed, 1);
        strafe *= speed;
        forward *= speed;
        var yaw = Math.PI - entity.yaw;
        var sin = Math.sin(yaw);
        var cos = Math.cos(yaw);
        var vel = entity.vel;
        vel.x -= strafe * cos + forward * sin;
        vel.z += forward * cos - strafe * sin;
    }
    function isOnLadder(world, pos) {
        var block = world.getBlock(pos);
        return (block && (block.type === ladderId || block.type === vineId));
    }
    function doesNotCollide(world, pos) {
        var pBB = getPlayerBB(pos);
        return !getSurroundingBBs(world, pBB).some(function (x) { return pBB.intersects(x); }) && getWaterInBB(world, pBB).length === 0;
    }
    function getLiquidHeightPcent(block) {
        return (getRenderedDepth(block) + 1) / 9;
    }
    function getRenderedDepth(block) {
        if (!block)
            return -1;
        if (block.getProperties().waterlogged)
            return 0;
        if (block.type !== waterId)
            return -1;
        var meta = block.metadata;
        return meta >= 8 ? 0 : meta;
    }
    function getFlow(world, block) {
        var curlevel = getRenderedDepth(block);
        var flow = new vec3_1.Vec3(0, 0, 0);
        for (var _i = 0, _a = [[0, 1], [-1, 0], [0, -1], [1, 0]]; _i < _a.length; _i++) {
            var _b = _a[_i], dx = _b[0], dz = _b[1];
            var adjBlock = world.getBlock(block.position.offset(dx, 0, dz));
            var adjLevel = getRenderedDepth(adjBlock);
            if (adjLevel < 0) {
                if (adjBlock && adjBlock.boundingBox !== 'empty') {
                    var adjLevel_1 = getRenderedDepth(world.getBlock(block.position.offset(dx, -1, dz)));
                    if (adjLevel_1 >= 0) {
                        var f = adjLevel_1 - (curlevel - 8);
                        flow.x += dx * f;
                        flow.z += dz * f;
                    }
                }
            }
            else {
                var f = adjLevel - curlevel;
                flow.x += dx * f;
                flow.z += dz * f;
            }
        }
        if (block.metadata >= 8) {
            for (var _c = 0, _d = [[0, 1], [-1, 0], [0, -1], [1, 0]]; _c < _d.length; _c++) {
                var _e = _d[_c], dx = _e[0], dz = _e[1];
                var adjBlock = world.getBlock(block.position.offset(dx, 0, dz));
                var adjUpBlock = world.getBlock(block.position.offset(dx, 1, dz));
                if ((adjBlock && adjBlock.boundingBox !== 'empty') || (adjUpBlock && adjUpBlock.boundingBox !== 'empty')) {
                    flow.normalize().translate(0, -6, 0);
                }
            }
        }
        return flow.normalize();
    }
    function getWaterInBB(world, bb) {
        var waterBlocks = [];
        var cursor = new vec3_1.Vec3(0, 0, 0);
        for (cursor.y = Math.floor(bb.min.y); cursor.y <= Math.floor(bb.max.y); cursor.y++) {
            for (cursor.z = Math.floor(bb.min.z); cursor.z <= Math.floor(bb.max.z); cursor.z++) {
                for (cursor.x = Math.floor(bb.min.x); cursor.x <= Math.floor(bb.max.x); cursor.x++) {
                    var block = world.getBlock(cursor);
                    if (block && (block.type === waterId || block.getProperties().waterlogged)) {
                        var waterLevel = cursor.y + 1 - getLiquidHeightPcent(block);
                        if (Math.ceil(bb.max.y) >= waterLevel)
                            waterBlocks.push(block);
                    }
                }
            }
        }
        return waterBlocks;
    }
    function isInWaterApplyCurrent(world, bb, vel) {
        var acceleration = new vec3_1.Vec3(0, 0, 0);
        var waterBlocks = getWaterInBB(world, bb);
        var isInWater = waterBlocks.length > 0;
        for (var _i = 0, waterBlocks_1 = waterBlocks; _i < waterBlocks_1.length; _i++) {
            var block = waterBlocks_1[_i];
            var flow = getFlow(world, block);
            acceleration.add(flow);
        }
        var len = acceleration.norm();
        if (len > 0) {
            vel.x += acceleration.x / len * 0.014;
            vel.y += acceleration.y / len * 0.014;
            vel.z += acceleration.z / len * 0.014;
        }
        return isInWater;
    }
    function moveEntityWithHeading(entity, world, strafe, forward) {
        var vel = entity.vel;
        var pos = entity.pos;
        var gravityMultiplier = (vel.y <= 0 && entity.slowFalling > 0) ? physics.slowFalling : 1;
        if (!entity.isInWater && !entity.isInLava) {
            // Normal movement
            var acceleration = physics.airborneAcceleration;
            var inertia = physics.airborneInertia;
            var blockUnder = world.getBlock(pos.offset(0, -1, 0));
            if (entity.onGround && blockUnder) {
                // let playerSpeedAttribute
                // if (entity.attributes && entity.attributes[physics.movementSpeedAttribute]) {
                // 	// Use server-side player attributes
                // 	playerSpeedAttribute = entity.attributes[physics.movementSpeedAttribute]
                // } else {
                // 	// Create an attribute if the player does not have it
                // 	playerSpeedAttribute = attribute.createAttributeValue(physics.playerSpeed)
                // }
                // // Client-side sprinting (don't rely on server-side sprinting)
                // // setSprinting in LivingEntity.java
                // playerSpeedAttribute = attribute.deleteAttributeModifier(playerSpeedAttribute, physics.sprintingUUID) // always delete sprinting (if it exists)
                // if (entity.control.sprint) {
                // 	if (!attribute.checkAttributeModifier(playerSpeedAttribute, physics.sprintingUUID)) {
                // 		playerSpeedAttribute = attribute.addAttributeModifier(playerSpeedAttribute, {
                // 			uuid: physics.sprintingUUID,
                // 			amount: physics.sprintSpeed,
                // 			operation: 2
                // 		})
                // 	}
                // }
                // Calculate what the speed is (0.1 if no modification)
                var attributeSpeed = 0.1;
                inertia = (blockSlipperiness[blockUnder.type] || physics.defaultSlipperiness) * 0.91;
                acceleration = attributeSpeed * (0.1627714 / (inertia * inertia * inertia));
                if (acceleration < 0)
                    acceleration = 0; // acceleration should not be negative
            }
            applyHeading(entity, strafe, forward, acceleration);
            if (isOnLadder(world, pos)) {
                vel.x = clamp(-physics.ladderMaxSpeed, vel.x, physics.ladderMaxSpeed);
                vel.z = clamp(-physics.ladderMaxSpeed, vel.z, physics.ladderMaxSpeed);
                vel.y = Math.max(vel.y, entity.control.sneak ? 0 : -physics.ladderMaxSpeed);
            }
            moveEntity(entity, world, vel.x, vel.y, vel.z);
            if (isOnLadder(world, pos) && (entity.isCollidedHorizontally ||
                entity.control.jump)) {
                vel.y = physics.ladderClimbSpeed; // climb ladder
            }
            // Apply friction and gravity
            if (entity.levitation > 0) {
                vel.y += (0.05 * entity.levitation - vel.y) * 0.2;
            }
            else {
                vel.y -= physics.gravity * gravityMultiplier;
            }
            vel.y *= physics.airdrag;
            vel.x *= inertia;
            vel.z *= inertia;
        }
        else {
            // Water / Lava movement
            var lastY = pos.y;
            var acceleration = physics.liquidAcceleration;
            var inertia = entity.isInWater ? physics.waterInertia : physics.lavaInertia;
            var horizontalInertia = inertia;
            if (entity.isInWater) {
                var strider = Math.min(entity.depthStrider, 3);
                if (!entity.onGround) {
                    strider *= 0.5;
                }
                if (strider > 0) {
                    horizontalInertia += (0.546 - horizontalInertia) * strider / 3;
                    acceleration += (0.7 - acceleration) * strider / 3;
                }
                if (entity.dolphinsGrace > 0)
                    horizontalInertia = 0.96;
            }
            applyHeading(entity, strafe, forward, acceleration);
            moveEntity(entity, world, vel.x, vel.y, vel.z);
            vel.y *= inertia;
            vel.y -= (entity.isInWater ? physics.waterGravity : physics.lavaGravity) * gravityMultiplier;
            vel.x *= horizontalInertia;
            vel.z *= horizontalInertia;
            if (entity.isCollidedHorizontally && doesNotCollide(world, pos.offset(vel.x, vel.y + 0.6 - pos.y + lastY, vel.z))) {
                vel.y = physics.outOfLiquidImpulse; // jump out of liquid
            }
        }
    }
    function isMaterialInBB(world, queryBB, type) {
        var cursor = new vec3_1.Vec3(0, 0, 0);
        for (cursor.y = Math.floor(queryBB.min.y); cursor.y <= Math.floor(queryBB.max.y); cursor.y++) {
            for (cursor.z = Math.floor(queryBB.min.z); cursor.z <= Math.floor(queryBB.max.z); cursor.z++) {
                for (cursor.x = Math.floor(queryBB.min.x); cursor.x <= Math.floor(queryBB.max.x); cursor.x++) {
                    var block = world.getBlock(cursor);
                    if (block && block.type === type)
                        return true;
                }
            }
        }
        return false;
    }
    physics.simulatePlayer = function (entity, world) {
        var vel = entity.vel;
        var pos = entity.pos;
        var waterBB = getPlayerBB(pos).contract(0.001, 0.401, 0.001);
        var lavaBB = getPlayerBB(pos).contract(0.1, 0.4, 0.1);
        entity.isInWater = isInWaterApplyCurrent(world, waterBB, vel);
        entity.isInLava = isMaterialInBB(world, lavaBB, lavaId);
        // Reset velocity component if it falls under the threshold
        if (Math.abs(vel.x) < physics.negligeableVelocity)
            vel.x = 0;
        if (Math.abs(vel.y) < physics.negligeableVelocity)
            vel.y = 0;
        if (Math.abs(vel.z) < physics.negligeableVelocity)
            vel.z = 0;
        // Handle inputs
        if (entity.control.jump || entity.jumpQueued) {
            if (entity.jumpTicks > 0)
                entity.jumpTicks--;
            if (entity.isInWater || entity.isInLava) {
                vel.y += 0.04;
            }
            else if (entity.onGround && entity.jumpTicks === 0) {
                var blockBelow = world.getBlock(entity.pos.floored().offset(0, -0.5, 0));
                vel.y = Math.fround(0.42) * ((blockBelow && blockBelow.type === honeyblockId) ? physics.honeyblockJumpSpeed : 1);
                if (entity.jumpBoost > 0) {
                    vel.y += 0.1 * entity.jumpBoost;
                }
                if (entity.control.sprint) {
                    var yaw = Math.PI - entity.yaw;
                    vel.x -= Math.sin(yaw) * 0.2;
                    vel.z += Math.cos(yaw) * 0.2;
                }
                entity.jumpTicks = physics.autojumpCooldown;
            }
        }
        else {
            entity.jumpTicks = 0; // reset autojump cooldown
        }
        entity.jumpQueued = false;
        var strafe = ((entity.control.right ? 1 : 0) - (entity.control.left ? 1 : 0)) * 0.98;
        var forward = ((entity.control.forward ? 1 : 0) - (entity.control.back ? 1 : 0)) * 0.98;
        if (entity.control.sneak) {
            strafe *= physics.sneakSpeed;
            forward *= physics.sneakSpeed;
        }
        moveEntityWithHeading(entity, world, strafe, forward);
        return entity;
    };
    return physics;
}
exports.Physics = Physics;
function getStatusEffectNamesForVersion() {
    return {
        jumpBoostEffectName: 'jump_boost',
        speedEffectName: 'speed',
        slownessEffectName: 'slowness',
        dolphinsGraceEffectName: 'dolphins_grace',
        slowFallingEffectName: 'slow_falling',
        levitationEffectName: 'levitation'
    };
}
exports.getStatusEffectNamesForVersion = getStatusEffectNamesForVersion;
function getEffectLevel(mcData, effectName, effects) {
    var effectDescriptor = mcData.effectsByName[effectName];
    if (!effectDescriptor) {
        return 0;
    }
    var effectInfo = effects[effectDescriptor.id];
    if (!effectInfo) {
        return 0;
    }
    return effectInfo.amplifier + 1;
}
exports.getEffectLevel = getEffectLevel;
var PlayerState = /** @class */ (function () {
    function PlayerState(bot, control) {
        var _a, _b;
        var dataRegistries = (0, data_registries_1.get)(bot.version);
        var mcData = dataRegistries.minecraft;
        // Input / Outputs
        this.pos = bot.entity.position.clone();
        this.vel = bot.entity.velocity.clone();
        this.onGround = bot.entity.onGround;
        this.isInWater = bot.entity.isInWater;
        this.isInLava = bot.entity.isInLava;
        this.isInWeb = bot.entity.isInWeb;
        this.isCollidedHorizontally = bot.entity.isCollidedHorizontally;
        this.isCollidedVertically = bot.entity.isCollidedVertically;
        this.jumpTicks = bot.jumpTicks;
        this.jumpQueued = bot.jumpQueued;
        // Input only (not modified)
        this.attributes = (_a = bot.entity.attributes) !== null && _a !== void 0 ? _a : [];
        this.yaw = bot.entity.yaw;
        this.control = control;
        // effects
        var effects = (_b = bot.entity.effects) !== null && _b !== void 0 ? _b : [];
        var statusEffectNames = getStatusEffectNamesForVersion();
        this.jumpBoost = getEffectLevel(mcData, statusEffectNames.jumpBoostEffectName, effects);
        this.speed = getEffectLevel(mcData, statusEffectNames.speedEffectName, effects);
        this.slowness = getEffectLevel(mcData, statusEffectNames.slownessEffectName, effects);
        this.dolphinsGrace = getEffectLevel(mcData, statusEffectNames.dolphinsGraceEffectName, effects);
        this.slowFalling = getEffectLevel(mcData, statusEffectNames.slowFallingEffectName, effects);
        this.levitation = getEffectLevel(mcData, statusEffectNames.levitationEffectName, effects);
        // armour enchantments
        // todo: depth strider
        // const boots = bot.inventory.slots[8]
        // if (boots && boots.nbt) {
        // 	const simplifiedNbt = nbt.simplify(boots.nbt)
        // 	const enchantments = simplifiedNbt.Enchantments ?? simplifiedNbt.ench ?? []
        // 	this.depthStrider = getEnchantmentLevel(mcData, 'depth_strider', enchantments)
        // } else {
        // 	this.depthStrider = 0
        // }
        this.depthStrider = 0;
    }
    PlayerState.prototype.apply = function (bot) {
        bot.entity.position = this.pos;
        bot.entity.velocity = this.vel;
        bot.entity.onGround = this.onGround;
        bot.entity.isInWater = this.isInWater;
        bot.entity.isInLava = this.isInLava;
        bot.entity.isInWeb = this.isInWeb;
        bot.entity.isCollidedHorizontally = this.isCollidedHorizontally;
        bot.entity.isCollidedVertically = this.isCollidedVertically;
        bot.jumpTicks = this.jumpTicks;
        bot.jumpQueued = this.jumpQueued;
    };
    return PlayerState;
}());
exports.PlayerState = PlayerState;
