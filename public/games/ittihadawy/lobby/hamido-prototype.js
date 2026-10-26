import {attachCharacterPrototype} from './character-prototype.js?v=4';
export function attachHamidoPrototype(player,api){
 return attachCharacterPrototype(player,api,{id:'hamido',url:new URL('../models/hamido-prototype.glb',import.meta.url).href});
}
