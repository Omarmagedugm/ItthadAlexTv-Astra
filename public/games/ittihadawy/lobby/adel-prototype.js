// Compatibility entry point for the original Adel experiment.
export {readPrototype,partJoint} from './character-prototype.js?v=4';
import {attachCharacterPrototype} from './character-prototype.js?v=4';
export function attachAdelPrototype(player,api){
 return attachCharacterPrototype(player,api,{id:'adel',url:new URL('../models/adel-prototype.glb',import.meta.url).href});
}
