import {test} from 'node:test';import assert from 'node:assert/strict';import {coinDelta} from '../src/lib/gameCoinMath';
test('retries, repeated checkpoints and lower snapshots do not award coins twice',()=>{
 let credited=0,previous=0;for(const count of [10,10,8,15,15,20]){credited+=coinDelta(previous,count);previous=Math.max(previous,count)}assert.equal(credited,20);
});
test('coins must be bounded nonnegative whole numbers',()=>{for(const count of [-1,NaN,Infinity,.5,1000001])assert.throws(()=>coinDelta(0,count));assert.equal(coinDelta(0,0),0)});
