import { createHmac, timingSafeEqual } from 'node:crypto';
export function signToken(id,secret) {
  const payload=Buffer.from(JSON.stringify({id,exp:Date.now()+30*86400000})).toString('base64url');
  return payload+'.'+createHmac('sha256',secret).update(payload).digest('base64url');
}
export function verifyToken(token,secret) {
  try {
    const fields=String(token).split('.');if(fields.length!==2)return null;
    const [payload,sig]=fields;
    const expected=createHmac('sha256',secret).update(payload).digest();
    const actual=Buffer.from(sig,'base64url');
    if(actual.length!==expected.length||!timingSafeEqual(actual,expected))return null;
    const data=JSON.parse(Buffer.from(payload,'base64url'));return data.exp>Date.now()&&typeof data.id==='string'?data.id:null;
  } catch{return null;}
}
export function secretEqual(a,b) {
  if(typeof a!=='string'||typeof b!=='string'||!a||!b)return false;const x=Buffer.from(a),y=Buffer.from(b);
  return x.length===y.length&&timingSafeEqual(x,y);
}
export function cleanText(value,max=240) {return String(value??'').replace(/[\u0000-\u001f\u007f<>]/g,'').trim().slice(0,max);}
