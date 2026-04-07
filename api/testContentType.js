const docId = "Q11.paint";
res = {};
let contentType = 'image/png';
if(docId.endsWith('.paint')) contentType = 'image/*';
console.log(contentType);
