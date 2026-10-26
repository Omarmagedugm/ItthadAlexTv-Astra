import {attachCharacterPrototype} from './character-prototype.js?v=4';
export function attachLazoPrototype(player,api){
 return attachCharacterPrototype(player,api,{id:'lazo',url:new URL('../models/lazo-prototype.glb',import.meta.url).href});
}
