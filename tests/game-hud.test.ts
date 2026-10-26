import {test} from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {regionBanner,speedDisplay} from '../public/games/ittihadawy/lobby/hud.js';
test('zone banner names the current region and labels remaining distance separately',()=>{
 const html=renderToStaticMarkup(regionBanner(React,{current:{id:'komeldikka',name:'كوم الدكة'},remaining:100}));
 assert.ok(html.includes('المنطقة الحالية'));assert.ok(html.includes('Kom El Dikka'));assert.ok(html.includes('0.1 km'));assert.ok(html.includes('للمنطقة التالية'));assert.ok(!html.includes('النزلة الجاية'));
});
test('bike dial uses actual speed and disappears for running mode',()=>{
 const bike=renderToStaticMarkup(speedDisplay(React,40,true));
 assert.ok(bike.includes('144'));assert.ok(bike.includes('motorcycle-speed'));
 const running=renderToStaticMarkup(speedDisplay(React,40,false));
 assert.ok(running.includes('144'));assert.ok(!running.includes('motorcycle-speed'));
});
