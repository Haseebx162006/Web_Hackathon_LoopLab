const express = require('express');
const { autocomplete } = require('../controllers/searchController');

const router = express.Router();

router.get('/autocomplete', autocomplete);

module.exports = router;
