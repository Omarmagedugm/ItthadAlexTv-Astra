import { useState } from 'react';

export default function HeaderLogo({src,text}:{src:string;text:string}) {
 const [failed,setFailed]=useState(false);
 return <span className="ds-header-logo">{failed ? <span className="ds-header-logo-fallback"><strong>{text}</strong><small>ITTIHAD ALEX TV</small></span> : <img src={src} alt={text} onError={()=>setFailed(true)} fetchPriority="high" decoding="async"/>}</span>;
}
