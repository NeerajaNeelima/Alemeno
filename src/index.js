// src/index.js

const express = require('express');
const { router } = require('../tasks/router');


const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());


app.use('/api', router);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
