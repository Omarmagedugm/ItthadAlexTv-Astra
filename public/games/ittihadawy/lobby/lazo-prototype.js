import {attachCharacterPrototype} from './character-prototype.js?v=1';
export function attachLazoPrototype(player,api){
 return attachCharacterPrototype(player,api,{id:'lazo',url:new URL('../models/lazo-prototype.glb',import.meta.url).href});
}
