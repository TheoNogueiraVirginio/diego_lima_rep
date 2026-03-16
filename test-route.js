const express = require('express');
const app = express();
app.get('/test/:docId(*)', (req, res) => {
  res.json({ docId: req.params.docId });
});
app.get('/test2/*', (req, res) => {
  res.json({ val: req.params[0] });
});
app.listen(3333, () => console.log('started'));
