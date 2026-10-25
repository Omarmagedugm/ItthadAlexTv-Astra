export function coinDelta(previous:number,incoming:number){if(!Number.isSafeInteger(incoming)||incoming<0||incoming>1000000)throw new Error('invalid-coins');return Math.max(0,incoming-previous)}
