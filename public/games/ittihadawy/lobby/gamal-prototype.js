import {attachCharacterPrototype} from './character-prototype.js?v=4';
export function attachGamalPrototype(player,api){
 return attachCharacterPrototype(player,api,{id:'gamal',url:new URL('../models/gamal-prototype.glb',import.meta.url).href});
}
