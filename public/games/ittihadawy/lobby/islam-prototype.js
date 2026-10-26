import {attachCharacterPrototype} from './character-prototype.js?v=4';
export function attachIslamPrototype(player,api){
 return attachCharacterPrototype(player,api,{id:'islam',url:new URL('../models/islam-prototype.glb',import.meta.url).href});
}
