var express = require('express');
var router = express.Router();
var passport = require('passport');
var path = require('path');
var pool = require('../modules/pool.js');

const OCCUPANCY_ROW_LENGTH = 4;
const OCCUPANCY_IGNORE_ROWS = 4; // number of rows to ignore at top of imported .csv
const OCCUPANCY_IGNORE_ENDING_ROWS = 1;
const START_YEAR = 2010; // startpoint for valid year param range
const END_YEAR = 2100; // endpoint for valid year param range

// Handles CSV upload from admin view
router.post('/upload/:year', function (req, res) {
  if (!req.isAuthenticated() || req.user.role != 'Administrator') {
    res.sendStatus(403);
    return;
  }

  if ((req.params.year < START_YEAR) || (req.params.year > END_YEAR)) {
    res.status(400).send("Must be a year between 2010 and 2100.");
    return;
  }

  validateCsvImportData(req.body);

  // const parsedData = parseImportRequestBody(req.body.data);

  // first, delete the old table
  pool.connect(function (err, client, done) {
    if (err) {
      console.log('csv.router.js /upload/:year POST connect error', err);
      res.sendStatus(500);
      return;
    }

    client.query('DELETE FROM occupancy WHERE year=$1', [req.params.year], function (err, data) {
      if (err) {
        done();
        console.log('csv.router.js /upload/:year POST delete query error', err);
        res.sendStatus(500);
        return;
      }

      var unitsArray = req.body.data;
      unitsArray.splice(0, OCCUPANCY_IGNORE_ROWS);
      unitsArray.splice(unitsArray.length-OCCUPANCY_IGNORE_ENDING_ROWS, OCCUPANCY_IGNORE_ENDING_ROWS);
      // unitsArray = sanitizeUnitsArray(unitsArray);
      const queryBlingString = buildCsvImportBlingString(unitsArray);
      const queryString = buildCsvImportQueryString(unitsArray, queryBlingString);
      var sqlParams = unitsArray.flat();

      // push the whole thing into the occupancy table of the db
      client.query(queryString, sqlParams, function (err, result) {
        done();
        if (err) {
          console.log('error making csv insert query', err);
          res.sendStatus(500);
          return;
        }

        res.sendStatus(201);
      });
    });
  });
}); // end POST route

// exports all responses from the passed-in year. called from admin
router.get('/export/:year', function (req, res) {
  if (!req.isAuthenticated() || (req.user && req.user.role !== 'Administrator')) {
    res.sendStatus(403);
    return;
  }

  // query db, get all responses
  pool.connect(function (err, client, done) {
    if (err) {
      console.log('error connecting to db', err);
      res.sendStatus(500);
      return;
    }

    var queryString = 'SELECT * FROM responses WHERE year=$1';

    // run the actual query
    client.query(queryString, [req.params.year], function (err, data) {
      done();
      if (err) {
        console.log('query error', err);
        res.sendStatus(500);
        return;
      }

      // send response data back to client
      res.send(data.rows);

    });
  });
}); // end GET route

router.get('/household/:year', function (req, res) {
  if (!req.isAuthenticated() || (req.user && req.user.role !== 'Administrator')) {
    res.sendStatus(403);
    return;
  }

  pool.connect(function (err, client, done) {
    if (err) {
      console.log('error connecting to db', err);
      res.sendStatus(500);
      return;
    }
    var queryString = 'SELECT * FROM household WHERE year=$1';

    client.query(queryString, [req.params.year], function (err, data) {
      done();
      if (err) {
        console.log('query error', err);
        res.sendStatus(500);
        return;
      }

      res.send(data.rows);

    });
  });
});


// result: "($1,$2,$3,$4),($5,$6,$7,$8),($9, $10..."
function buildCsvImportBlingString(requestBodyData) {
  let result = "";
  let rowCounter = 1;

  for (let i = 0; i < requestBodyData.length; i++) {
    result += `(\$${rowCounter},`;
    result += `\$${rowCounter+1},`;
    result += `\$${rowCounter+2},`;
    result += `\$${rowCounter+3}),`;

    rowCounter += 4;
  }

  return result.slice(0, -1);
}

//INSERT INTO occupancy (property, occupied, unit, year) VALUES ($1, $2, $3, $4), ($5,$6,$7,$8), [...]
function buildCsvImportQueryString(requestBodyData, blingString) {
  return `INSERT INTO occupancy (property, occupied, unit, year) VALUES ${blingString}`;
}

function validateCsvImportData(requestBodyData) {
  if (typeof requestBodyData !== "object" || requestBodyData.length < 1) {
    throw new Error("Invalid CSV import data");
  }
}

module.exports = router;