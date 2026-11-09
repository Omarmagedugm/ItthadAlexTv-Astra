import { getAdminDatabase } from './firebaseAdmin.js';

const API_ORIGIN = 'https://v3.football.api-sports.io';
const MEMORY = new Map<string, { expires: number; value: unknown }>();
const CACHE_COLLECTION = 'football_api_cache';

export class FootballSourceError extends Error {
  constructor(public status: number, public reason: string) { super(reason); }
}
function getKey(): string {
  const key = process.env.APISPORTS_KEY || process.env.API_FOOTBALL_KEY || '';
  if (!key) throw new FootballSourceError(503, 'api-not-configured');
  return key;
}
async function fromProvider(endpoint: string, params: Record<string,string>): Promise<any[]> {
  const url = new URL(endpoint, API_ORIGIN);
  Object.entries(params).forEach(([name,value])=>url.searchParams.set(name,value));
  let res: Response;
  try { res = await fetch(url.toString(), {method:'GET', headers:{'x-apisports-key': getKey(),accept:'application/json'},signal:AbortSignal.timeout(9000)}); }
  catch { throw new FootballSourceError(503,'provider-unreachable'); }
  if (res.status===429) throw new FootballSourceError(429,'provider-rate-limit');
  if (!res.ok) throw new FootballSourceError(502,'provider-error');
  let data: any;
  try { data=await res.json(); }
  catch { throw new FootballSourceError(502,'provider-invalid-data'); }
  if (data?.errors && (Array.isArray(data.errors)?data.errors.length:Object.keys(data.errors).length)) {
    throw new FootballSourceError(502,'provider-coverage-or-plan-error');
  }
  if (!Array.isArray(data?.response)) throw new FootballSourceError(502,'provider-invalid-data');
  return data.response;
}
async function cached<T>(id: string, ttl: number, fetchFresh: ()=>Promise<T>): Promise<T> {
  const local=MEMORY.get(id);
  if (local && local.expires>Date.now()) return local.value as T;
  try {
    const doc=await getAdminDatabase().collection(CACHE_COLLECTION).doc(id).get();
    const value=doc.data();
    if (value && typeof value.expires==='number' && value.expires>Date.now()) {
      MEMORY.set(id,{expires:value.expires,value:value.value});
      return value.value as T;
    }
  } catch { /* Firebase Admin may be unavailable: fall back to memory. */ }
  const fresh=await fetchFresh();
  const expires=Date.now()+ttl;
  MEMORY.set(id,{expires,value:fresh});
  try {
    await getAdminDatabase().collection(CACHE_COLLECTION).doc(id).set({value:fresh,expires,updatedAt:new Date().toISOString()});
  } catch { /* Keep memory cache if server persistence fails. */ }
  return fresh;
}
function normalized(value:string):string {
  return value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
}
export function findAlexandriaTeam(results:any[]):number|null {
  const candidates=results.filter(item=>item?.team && String(item.team.country).toLowerCase()==='egypt');
  const match=candidates.find(item=>{
    const label=normalized(item.team.name||'');
    return /ittihad|etihad|ithad/.test(label) && /alex|sakandar|iskandar/.test(label);
  }) || candidates.find(item=>/^(al |el )?(ittihad|etihad|ithad)( sc)?$/.test(normalized(item.team.name||'')));
  const id=Number(match?.team?.id);
  return Number.isSafeInteger(id)&&id>0?id:null;
}
export async function getTeamId():Promise<number> {
  const configured=Number(process.env.FOOTBALL_TEAM_ID||0);
  if (Number.isSafeInteger(configured)&&configured>0) return configured;
  return cached<number>('alexandria-team-v1',30*24*3600000,async()=>{
    for (const name of ['Al Ittihad','Ittihad','Alexandria']) {
      const items=await fromProvider('/teams',{search:name});
      const id=findAlexandriaTeam(items);
      if(id) return id;
    }
    throw new FootballSourceError(404,'alexandria-team-not-found');
  });
}
export async function footballFixtures():Promise<any[]> {
  return cached<any[]>('alexandria-fixtures-v2',20*60000,async()=>{
    const team=await getTeamId();
    const now=new Date();
    const season=String(now.getUTCMonth()>=6?now.getUTCFullYear():now.getUTCFullYear()-1);
    let fixtures:any[]=[];
    try { fixtures=await fromProvider('/fixtures',{team:String(team),season}); }
    catch(e) { if (!(e instanceof FootballSourceError && e.reason==='provider-coverage-or-plan-error')) throw e; }
    if (!fixtures.length) {
      try {
        const [last,next]=await Promise.all([
          fromProvider('/fixtures',{team:String(team),last:'10'}),
          fromProvider('/fixtures',{team:String(team),next:'10'}),
        ]);
        fixtures=[...last,...next];
      } catch(e) {
        if(!(e instanceof FootballSourceError && e.reason==='provider-coverage-or-plan-error')) throw e;
      }
    }
    // Some free API plans restrict recent seasons; historical results are only for
    // a clearly labelled trial (never presented as current live fixtures).
    if (!fixtures.length) {
      try { fixtures=await fromProvider('/fixtures',{team:String(team),season:'2024'}); }
      catch(e) { if(!(e instanceof FootballSourceError && e.reason==='provider-coverage-or-plan-error')) throw e; }
    }
    const ids=new Set<number>();
    return fixtures.filter(item=>{
      const id=Number(item?.fixture?.id);
      if(!Number.isSafeInteger(id)||ids.has(id))return false;
      ids.add(id);return true;
    }).sort((a,b)=>new Date(a.fixture.date).getTime()-new Date(b.fixture.date).getTime()).slice(-65);
  });
}
export type FootballAction='fixtures'|'lineups'|'events'|'statistics';
export async function footballCenterData(action:FootballAction,fixtureId?:number):Promise<{value:any[];updatedAt:string}> {
  getKey();
  if(action==='fixtures')return {value:await footballFixtures(),updatedAt:new Date().toISOString()};
  if(!Number.isSafeInteger(fixtureId)||!fixtureId||fixtureId<=0) throw new FootballSourceError(400,'invalid-fixture');
  const fixtures=await footballFixtures();
  const match=fixtures.find(item=>Number(item.fixture?.id)===fixtureId);
  if(!match) throw new FootballSourceError(404,'fixture-not-in-team-season');
  const done=['FT','AET','PEN'].includes(match.fixture?.status?.short);
  const ttl=done?6*3600000:action==='lineups'?20*60000:8*60000;
  const items=await cached<any[]>('alexandria-'+action+'-'+fixtureId,ttl,()=>fromProvider('/fixtures/'+action,{fixture:String(fixtureId)}));
  return {value:items,updatedAt:new Date().toISOString()};
}
