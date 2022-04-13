const config = require('config');
const path = require('path');

const redis = require(path.resolve('lib', 'redis'));

const minDepth = 3;
const maxDepth = 10;
const { slotCountChart, totalSlotCountSize } = getSlotCountChart();

module.exports = {
	Init,
	GetCronSchedule
};

function Init (cb) {
	return redis.Init(cb);
}

function GetCronSchedule (name, minutes, cb) {
	if (minutes > 60) {
		return cb(new Error('Minute must be less than or equal to 60'));
	}

	getAllocatedSlotCount(name, function (err, allocatedSlotCount) {
		if (err) {
			return cb(err);
		}

		const { depth, slot } = getCurrentSlot(allocatedSlotCount);
		const slotCount = Math.pow(2, depth);
		const seconds = minutes * 60;
		const size = (seconds / slotCount);
		const blockSize = size / 2;

		let cursor = slot;
		let targetSlot;

		if (slot % 2 !== 0) {
			targetSlot = (cursor * size) - blockSize;
		} else {
			cursor = slotCount - --cursor;
			targetSlot = ((cursor * size) + blockSize);
		}

		targetSlot = Math.floor(targetSlot);

		let newMinute = Math.floor(targetSlot / 60);
		let newSecond = targetSlot - (newMinute * 60);

		let newMinuteGroup = '';
		for (let i = 0; i < (60 / minutes); i++) {
			newMinuteGroup += `${newMinute + (minutes * i)},`;
		}
		newMinuteGroup = newMinuteGroup.slice(0, -1);

		return cb(null, `${newSecond} ${newMinuteGroup} * * * *`);
	});
}

function getAllocatedSlotCount (name, cb) {
	if (!name) {
		name = 'default';
	}

	redis.GetClient().incr(`${config.get('name')}:cronGeneratorAllocatedCounter:${name}`, (err, value) => {
		if (err) {
			return cb(err);
		}

		return cb(null, value);
	});
}

function getSlotCountChart () {
	let slotCountChart = {};
	let totalSlotCountSize = 0;
	for (let i = minDepth; i <= maxDepth; i++) {
		let size = Math.pow(2, i);
		slotCountChart[`_${i}`] = size;
		totalSlotCountSize += size;
	}

	return { slotCountChart, totalSlotCountSize };
}

function getCurrentSlot (allocatedSlotCount) {
	let depth = minDepth;
	let curr = (allocatedSlotCount % totalSlotCountSize);

	if (curr === 0) {
		curr++;
	}

	for (let i = minDepth; i <= maxDepth; i++) {
		let currDepth = slotCountChart[`_${i}`];

		if (curr > currDepth) {
			depth++;
			curr = curr - currDepth;
		} else {
			break;
		}
	}

	return { depth, slot: curr };
}
