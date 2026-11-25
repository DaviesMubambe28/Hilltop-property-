const privateDocumentTypes=new Set(['application/pdf','image/jpeg','image/png']);
export const privateDocumentLimit=10*1024*1024;

export function validatePrivateDocument(file:Pick<File,'size'|'type'>):string|null{
  if(!privateDocumentTypes.has(file.type))return'Documents must be PDF, JPEG or PNG.';
  if(file.size<=0||file.size>privateDocumentLimit)return'Documents must be between 1 byte and 10 MB.';
  return null;
}

export function validateOffer(amount:number,expiry:string,now=Date.now()):string|null{
  if(!Number.isFinite(amount)||amount<=0)return'Enter a valid offer amount.';
  if(expiry&&new Date(`${expiry}T23:59:59Z`).getTime()<=now)return'Choose a future offer expiry.';
  return null;
}
