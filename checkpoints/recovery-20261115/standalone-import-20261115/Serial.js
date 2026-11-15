function beautyImportSerial_(value,zone) {
  if(typeof value==='number'&&Number.isFinite(value))return value;
  if(value instanceof Date&&!isNaN(value.getTime()))return (Date.parse(Utilities.formatDate(value,zone,"yyyy-MM-dd'T'HH:mm:ss.SSS")+'Z')-Date.UTC(1899,11,30))/86400000;
  throw Error('LAYOUT');
}
