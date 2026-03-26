const express = require('express');
const app = express();
app.get('/:docId(*)', (req, res) => {
  console.log(req.params.docId);
  res.send('ok');
});
app.listen(3000, () => console.log('started'));
