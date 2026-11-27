import { createClient } from 'npm:@supabase/supabase-js@2.47.10';
import { z } from 'npm:zod@4.1.12';
import { consumeRateLimit, hmac, originAllowed, requestIp } from '../_shared/security.ts';

const schema = z.object({ propertyId:z.string().uuid(), name:z.string().trim().min(2).max(120), email:z.string().trim().email().max(254), phone:z.string().trim().max(30).optional(), preferredStart:z.string().datetime(), mode:z.enum(['physical','virtual']), consent:z.literal(true), idempotencyKey:z.string().uuid(), website:z.string().max(0).optional() }).refine((input)=>new Date(input.preferredStart).getTime()>Date.now()+30*60_000,{path:['preferredStart'],message:'Choose a future viewing time.'});
const allowedOrigin=Deno.env.get('SITE_URL')??'http://localhost:4173';
const headers={'Access-Control-Allow-Origin':allowedOrigin,'Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type','Content-Type':'application/json'};
const respond=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers});

Deno.serve(async(request)=>{
  if(request.method==='OPTIONS')return new Response('ok',{headers});
  if(request.method!=='POST')return respond({error:{code:'METHOD_NOT_ALLOWED',message:'POST is required.'}},405);
  if(!originAllowed(request,allowedOrigin))return respond({error:{code:'FORBIDDEN_ORIGIN',message:'This origin is not allowed.'}},403);
  if(Number(request.headers.get('content-length')??0)>20_000)return respond({error:{code:'PAYLOAD_TOO_LARGE',message:'The request is too large.'}},413);
  try{
    const parsed=schema.safeParse(await request.json());
    if(!parsed.success)return respond({error:{code:'VALIDATION_ERROR',message:'Check the viewing details.'}},422);
    const input=parsed.data;
    const secret=Deno.env.get('RATE_LIMIT_SECRET');if(!secret||secret.length<32)throw new Error('rate_limit_secret_not_configured');
    const client=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false}});
    const existing=await client.from('viewing_appointments').select('id,status,property_id,name,email,phone,preferred_start,mode').eq('idempotency_key',input.idempotencyKey).maybeSingle();
    if(existing.error)throw existing.error;
    if(existing.data){
      const samePayload=
        existing.data.property_id===input.propertyId &&
        existing.data.name===input.name &&
        existing.data.email===input.email.toLowerCase() &&
        (existing.data.phone??null)===(input.phone||null) &&
        existing.data.mode===input.mode &&
        new Date(existing.data.preferred_start).toISOString()===new Date(input.preferredStart).toISOString();
      if(!samePayload)return respond({error:{code:'CONFLICT',message:'This submission key belongs to different viewing details.'}},409);
      return respond(existing.data);
    }
    const property=await client.from('properties').select('id,reference,title').eq('id',input.propertyId).eq('status','published').eq('is_available',true).maybeSingle();
    if(property.error)throw property.error;if(!property.data)return respond({error:{code:'INVALID_PROPERTY',message:'This property is not available for viewing.'}},422);
    const key=await hmac(`viewing:${requestIp(request)}:${input.email.toLowerCase()}`,secret);
    if(!await consumeRateLimit(client,'viewing-request',key,5,3600))return respond({error:{code:'RATE_LIMITED',message:'Too many viewing requests. Try again later.'}},429);
    let customerId:null|string=null;const auth=request.headers.get('authorization');if(auth)customerId=(await client.auth.getUser(auth.replace(/^Bearer\s+/i,''))).data.user?.id??null;
    const inserted=await client.from('viewing_appointments').insert({property_id:input.propertyId,customer_id:customerId,name:input.name,email:input.email.toLowerCase(),phone:input.phone||null,mode:input.mode,preferred_start:input.preferredStart,consent:true,idempotency_key:input.idempotencyKey}).select('id,status').single();
    if(inserted.error)throw inserted.error;
    const resend=Deno.env.get('RESEND_API_KEY'),staff=Deno.env.get('STAFF_NOTIFICATION_EMAIL'),from=Deno.env.get('EMAIL_FROM');
    if(resend&&staff&&from)await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${resend}`,'Content-Type':'application/json'},body:JSON.stringify({from,to:[staff,input.email],subject:`Viewing request: ${property.data.reference}`,text:`Viewing request ${inserted.data.id}\nProperty: ${property.data.title}\nPreferred: ${input.preferredStart}\nMode: ${input.mode}\nStatus: requested`})}).catch(()=>undefined);
    return respond(inserted.data,201);
  }catch(error){console.error('submit_viewing_failed',{message:error instanceof Error?error.message:'unknown'});return respond({error:{code:'INTERNAL_ERROR',message:'The viewing request could not be submitted.'}},500);}
});
