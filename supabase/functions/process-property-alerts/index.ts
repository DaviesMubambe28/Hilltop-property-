import{createClient}from'https://esm.sh/@supabase/supabase-js@2';
import{z}from'npm:zod@4.1.12';
const filtersSchema=z.object({query:z.string().max(120).optional(),locationId:z.string().uuid().optional(),province:z.string().max(80).optional(),cityId:z.string().uuid().optional(),neighborhoodId:z.string().uuid().optional(),propertyTypeId:z.string().uuid().optional(),listingType:z.enum(['sale','rent','investment']).optional(),minPrice:z.number().min(0).optional(),maxPrice:z.number().min(0).optional(),bedrooms:z.number().int().min(0).max(20).optional(),bathrooms:z.number().int().min(0).max(20).optional(),minLandSize:z.number().min(0).optional(),minFloorSize:z.number().min(0).optional(),furnishedStatus:z.enum(['furnished','unfurnished','part-furnished']).optional(),condition:z.enum(['new','excellent','good','renovation']).optional(),verificationStatus:z.enum(['unverified','pending','verified']).optional(),amenities:z.array(z.string().max(80)).max(20).optional(),sort:z.enum(['newest','priceAsc','priceDesc','sizeDesc']).optional()}).strict();
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json'}}),pageSize=100;

Deno.serve(async(request)=>{
  if(request.method!=='POST')return json({error:'POST is required.'},405);
  const secret=Deno.env.get('PROPERTY_ALERT_CRON_SECRET');if(!secret||request.headers.get('x-cron-secret')!==secret)return json({error:'Unauthorized.'},401);
  const client=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false}}),startedAt=new Date().toISOString();
  let processed=0,matches=0,invalid=0,failed=0,searchOffset=0;
  while(true){
    const searches=await client.from('saved_searches').select('id,user_id,name,filters,last_checked_at,created_at').eq('alert_enabled',true).order('id').range(searchOffset,searchOffset+pageSize-1);
    if(searches.error)throw searches.error;if(!searches.data?.length)break;
    for(const search of searches.data){
      processed++;const parsed=filtersSchema.safeParse(search.filters);if(!parsed.success){invalid++;continue;}const f=parsed.data;let propertyOffset=0,searchFailed=false;
      while(true){
        const result=await client.rpc('search_property_ids',{p_query:f.query??null,p_location_id:f.locationId??null,p_province:f.province??null,p_city_id:f.cityId??null,p_neighborhood_id:f.neighborhoodId??null,p_property_type_id:f.propertyTypeId??null,p_listing_type:f.listingType??null,p_min_price:f.minPrice??null,p_max_price:f.maxPrice??null,p_bedrooms:f.bedrooms??null,p_bathrooms:f.bathrooms??null,p_min_land_size:f.minLandSize??null,p_min_floor_size:f.minFloorSize??null,p_furnished_status:f.furnishedStatus??null,p_condition:f.condition??null,p_verification_status:f.verificationStatus??null,p_amenities:f.amenities??[],p_sort:'newest',p_limit:pageSize,p_offset:propertyOffset});
        if(result.error){console.error('alert_search_failed',{searchId:search.id,message:result.error.message});searchFailed=true;break;}
        const ids=(result.data??[]).map((row:{property_id:string})=>row.property_id);if(!ids.length)break;
        const properties=await client.from('properties').select('id,title,slug,published_at').in('id',ids).gt('published_at',search.last_checked_at??search.created_at??'1970-01-01');
        if(properties.error){console.error('alert_properties_failed',{searchId:search.id,message:properties.error.message});searchFailed=true;break;}
        for(const property of properties.data??[]){
          const notification=await client.rpc('create_property_alert_notification',{target_search:search.id,target_property:property.id,target_user:search.user_id,notification_title:`New match: ${search.name}`,notification_body:`${property.title} now matches your saved search. Open /property/${property.slug}`});
          if(notification.error){console.error('alert_notification_failed',{searchId:search.id,message:notification.error.message});searchFailed=true;continue;}const alert=notification.data?.[0];if(!alert?.created)continue;
          const resendKey=Deno.env.get('RESEND_API_KEY'),emailFrom=Deno.env.get('EMAIL_FROM');if(resendKey&&emailFrom){const user=await client.auth.admin.getUserById(search.user_id),email=user.data.user?.email;if(email){const site=(Deno.env.get('SITE_URL')??'').replace(/\/$/,'');const sent=await fetch('https://api.resend.com/emails',{method:'POST',headers:{authorization:`Bearer ${resendKey}`,'content-type':'application/json'},body:JSON.stringify({from:emailFrom,to:[email],subject:`New Hilltop property: ${property.title}`,text:`${property.title} matches your saved search “${search.name}”.\n\nView it: ${site}/property/${property.slug}\n\nManage alerts: ${site}/account.html`})});await client.from('property_alert_matches').update(sent.ok?{emailed_at:new Date().toISOString(),email_error:null}:{email_error:`Resend returned ${sent.status}`}).eq('id',alert.match_id);}}
          matches++;
        }
        if(ids.length<pageSize)break;propertyOffset+=pageSize;
      }
      if(searchFailed){failed++;continue;}const updated=await client.from('saved_searches').update({last_checked_at:startedAt}).eq('id',search.id);if(updated.error){console.error('alert_checkpoint_failed',{searchId:search.id,message:updated.error.message});failed++;}
    }
    if(searches.data.length<pageSize)break;searchOffset+=pageSize;
  }
  return json({processed,matches,invalid,failed});
});
