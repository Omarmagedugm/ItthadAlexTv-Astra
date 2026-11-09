import { getIdbItem, setIdbItem } from './idbCache';
export type FootballAction='fixtures'|'lineups'|'events'|'statistics';
export type FootballPayload={value:any[];updatedAt:string;source:string;fromCache?:boolean};
function cacheKey(action:FootballAction,id?:number){return 'footballCenter:'+action+(id?':'+id:'');}
export async function loadFootballCenter(action:FootballAction,id?:number):Promise<FootballPayload> {
  const key=cacheKey(action,id);
  const saved=await getIdbItem<FootballPayload>(key);
  if(!navigator.onLine&&saved)return {...saved,fromCache:true};
  if(!navigator.onLine)throw new Error('offline-no-saved-data');
  const query=new URLSearchParams({action});
  if(id)query.set('fixture',String(id));
  try {
    const res=await fetch('/api/football?'+query.toString(),{credentials:'omit'});
    const payload=await res.json();
    if(!res.ok||!Array.isArray(payload?.value))throw new Error(payload?.error||'provider-unavailable');
    const value:FootballPayload={value:payload.value,updatedAt:payload.updatedAt,source:'API-Football'};
    void setIdbItem(key,value);
    return value;
  } catch(error) {
    if(saved)return {...saved,fromCache:true};
    throw error;
  }
}
