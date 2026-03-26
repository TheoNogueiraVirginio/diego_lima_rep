import express from 'express';
const app = express();
app.get('/api/pdf/:docId(*)', (req, res) => {
  let p = req.params.docId;
  console.log("Raw param:", p);
  try { console.log("Decoded:", decodeURIComponent(p)); } catch(e){}
  res.send('ok');
});
app.listen(3000, () => console.log('started'));
