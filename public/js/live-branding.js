/* Public display branding: no staff context or credentials are needed. */
(function(root){
 function apply(data,doc){
  doc=doc||root.document;
  if(doc?.body)doc.body.setAttribute('data-live-brand',data?.brand==='monday'?'monday':'club');
 }
 root.BeautyLiveBranding=Object.freeze({apply});
 if(typeof module==='object'&&module.exports)module.exports=root.BeautyLiveBranding;
})(typeof window==='object'?window:globalThis);
