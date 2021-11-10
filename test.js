let minDepth = 3;
let maxDepth = 10;

let depth = minDepth;
let slotCount;
let slot;

let num = 1;

let total = 0;
let slotCountChart = {};
for (let i = minDepth; i <= maxDepth; i++) {
  let size = Math.pow(2, i);
  slotCountChart[`_${i}`] = size;
  total += size;
}

let curr = (num % total);
console.log(`Init Current: ${curr}`);

for (let i = minDepth; i <= maxDepth; i++) {
  let currDepth = slotCountChart[`_${i}`];

  if (curr > currDepth) {
    depth++;
    curr = curr - currDepth;
  } else {
    break;
  }
}
slot = curr;
if (slot === 0) {
  slot++;
}
slotCount = Math.pow(2, depth);

console.log(`Depth ${depth}`);
console.log(`slotCount: ${slotCount}`);
console.log(`slot ${slot}`);

let minutes = 5;
let seconds = minutes * 60;

let cursor = slot;
let size = (seconds / slotCount);
let blockSize = size / 2;
let value;

if (slot % 2 !== 0) {
  value = (cursor * size) - blockSize;
} else {
  cursor = slotCount - --cursor;
  value = ((cursor * size) + blockSize);
}

value = Math.floor(value);

console.log(`Value ${value}`);

let newMinute = Math.floor(value / 60);
let newSecond = value - (newMinute * 60);

console.log(`Minute: ${newMinute}, Seconds ${newSecond}`);
let newMinuteGroup = '';
for (let i = 0; i < (60 / minutes); i++) {
  newMinuteGroup += `${newMinute + (minutes * i)},`;
}
newMinuteGroup = newMinuteGroup.slice(0, -1);
console.log(`CRON schedule: ${newSecond} ${newMinuteGroup} * * * *`);
