import { FootballSourceError, footballCenterData, type FootballAction } from '../server/footballData.js';

export default async function handler(req:any,res:any) {
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('X-Content-Type-Options','nosniff');
  if(req.method!=='GET')return res.status(405).json({error:'method-not-allowed'});
  const action=String(req.query?.action||'fixtures');
  if(!['fixtures','lineups','events','statistics'].includes(action))return res.status(400).json({error:'invalid-action'});
  const raw=String(req.query?.fixture||'');
  const fixture=/^\d{1,12}$/.test(raw)?Number(raw):undefined;
  if(action!=='fixtures'&&(!fixture||!Number.isSafeInteger(fixture)))return res.status(400).json({error:'invalid-fixture'});
  try {
    const payload=await footballCenterData(action as FootballAction,fixture);
    res.setHeader('Cache-Control','public, max-age=60, s-maxage=120, stale-while-revalidate=300');
    return res.status(200).json({source:'api-football',...payload});
  } catch(error) {
    const issue=error instanceof FootballSourceError?error:new FootballSourceError(503,'data-temporarily-unavailable');
    res.setHeader('Cache-Control','no-store');
    return res.status(issue.status).json({error:issue.reason});
  }
}
