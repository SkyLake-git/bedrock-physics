import { AxisAlignedBB } from 'minemath'
import { Attribute, Effect, Effects, IndexedData } from 'minecraft-data'
import { World, WorldBlockDataProvider } from 'bedrock-sync-world'
import { Vec3 } from 'vec3'
import { get as dataLoader } from 'data-registries'
import { Block } from 'prismarine-block'

type EffectInstance = Effect & {
	amplifier: number
}


type Entity = {
	position: Vec3,
	velocity: Vec3
	onGround: boolean,
	isInWater: boolean,
	isInLava: boolean,
	isInWeb: boolean,
	isCollidedHorizontally: boolean,
	isCollidedVertically: boolean,
	yaw: number
	pitch: number

	attributes?: Attribute[]
	effects?: EffectInstance[]
}

type PhysicsEntity = {
	entity: Entity,
	jumpTicks: number,
	jumpQueued: boolean
	version: string
}

type Controls = {
	forward: boolean,
	back: boolean,
	left: boolean,
	right: boolean,
	jump: boolean,
	sprint: boolean,
	sneak: boolean
}

type PhysicsSettings = {
	adjustPositionHeight(pos: Vec3): void,
	simulatePlayer?(entity: PlayerState, world: WorldBlockDataProvider): PlayerState,
	gravity: number,
	airdrag: number,
	yawSpeed: number,
	pitchSpeed: number,
	playerSpeed: number,
	sprintSpeed: number,
	sneakSpeed: number,
	stepHeight: number,
	negligeableVelocity: number,
	soulsandSpeed: number,
	honeyblockSpeed: number,
	honeyblockJumpSpeed: number,
	ladderMaxSpeed: number,
	ladderClimbSpeed: number,
	playerHalfWidth: number,
	playerHeight: number,
	waterInertia: number,
	lavaInertia: number,
	liquidAcceleration: number,
	airborneInertia: number,
	airborneAcceleration: number,
	defaultSlipperiness: number,
	outOfLiquidImpulse: number,
	autojumpCooldown: number,
	bubbleColumnSurfaceDrag: {
		down: number,
		maxDown: number,
		up: number,
		maxUp: number
	},
	bubbleColumnDrag: {
		down: number,
		maxDown: number,
		up: number,
		maxUp: number
	},
	slowFalling: number,
	waterGravity: number
	lavaGravity: number
}

export function clamp(min: number, x: number, max: number)

export function Physics(mcData: IndexedData, world: WorldBlockDataProvider): PhysicsSettings

export function getStatusEffectNamesForVersion(): {
	jumpBoostEffectName: 'jump_boost',
	speedEffectName: 'speed',
	slownessEffectName: 'slowness',
	dolphinsGraceEffectName: 'dolphins_grace',
	slowFallingEffectName: 'slow_falling',
	levitationEffectName: 'levitation'
}

export function getEffectLevel(mcData: IndexedData, effectName: string, effects: EffectInstance[]): number


export class PlayerState {
	pos: Vec3
	vel: Vec3
	onGround: boolean
	isInWater: boolean
	isInLava: boolean
	isInWeb: boolean
	isCollidedHorizontally: boolean
	isCollidedVertically: boolean
	jumpTicks: number
	jumpQueued: boolean
	attributes: Attribute[]
	effects: EffectInstance[]
	yaw: number
	control: Controls

	jumpBoost: number
	speed: number
	slowness: number

	dolphinsGrace: number
	slowFalling: number
	levitation: number
	depthStrider: number

	constructor(bot: PhysicsEntity, control: Controls)

	apply(bot: PhysicsEntity): void
}
