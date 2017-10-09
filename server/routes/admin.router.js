var express = require('express');
var router = express.Router();
var passport = require('passport');
var path = require('path');
var pool = require('../modules/pool.js');

// get a dataset for reporting purposes. takes in an array of properties and an array of years, and sends back the matching dataset
router.get('/data', function (req, res) {

    if (req.isAuthenticated()) {
        if (req.user.role == 'Administrator') {
            var properties = req.query.properties;
            var years = req.query.years;
            console.log('GET /survey/data', ...properties, years);

            var yearBlingString = "";

            // start at 1 because pg wants $1, $2, etc in sequence
            for (var i = 1; i < (years.length + 1); i++) { 
                yearBlingString += "$" + (i) + ",";
            }

            yearBlingString = yearBlingString.slice(0, -1);

            var propBlingString = "";
            var propBlingLength = i + properties.length;

            // continue sequence from yearBlingString
            for (i; i < propBlingLength; i++) {
                propBlingString += "$" + (i) + ",";
            }

            propBlingString = propBlingString.slice(0, -1);

            // var propertyString = "";

            // for (var i = 0; i < properties.length; i++) {
            //     propertyString += "'" + properties[i] + "',"
            // }

            // propertyString = propertyString.slice(0, -1) + ')';

            // var yearString = "(";

            // for (var i = 0; i < years.length; i++) {
            //     yearString += years[i] + ','
            // }

            // yearString = yearString.slice(0, -1);

            // query like:
            // SELECT * FROM responses WHERE property IN ('The Jourdain', '1822 Park') AND year IN (2017);

            queryString = 'SELECT * FROM responses WHERE year IN (' + yearBlingString + ') AND property IN (' + propBlingString + ')';

            console.log('queryString', queryString);


            pool.connect(function (err, client, done) {
                if (err) {
                    console.log('db connect error', err);
                    res.sendStatus(500);
                } else {
                    client.query(queryString, [...years, ...properties], function (err, data) {
                        if (err) {
                            console.log('data select query error', err);
                            res.sendStatus(500);
                        } else {
                            // console.log('data.rows', data.rows);

                            res.send(data.rows);
                        }
                    });
                }
            });
        } else {
            //not authorized
            res.sendStatus(403);
        }
    } else {
        //not authorized
        res.sendStatus(403);
    }
});

// Add a new property. called from admin-properties view
router.post('/new-property', function (req, res) {

    var thisYear = new Date();
    thisYear = thisYear.getFullYear();

    if (req.isAuthenticated()) {
        if (req.user.role == 'Administrator') {
            pool.connect(function (errDatabase, client, done) {
                if (errDatabase) {
                    console.log('Error connecting to database', errDatabase);
                    res.sendStatus(500);
                } else {
                    client.query('INSERT INTO occupancy (property, unit, year) VALUES ($1, $2, $3)', [
                            req.body.property,
                            req.body.unit,
                            thisYear
                        ],
                        function (errQuery, data) {
                            done();
                            if (errQuery) {
                                console.log('Error making database query', errQuery);
                                res.sendStatus(500);
                            } else {
                                res.sendStatus(201);
                            }
                        });
                }
            });
        } else {
            //not authorized
            res.sendStatus(403);
        }
    } else {
        //not authorized
        res.sendStatus(403);
    }
});

// Add a new unit to a property. called from admin-properties view
router.post('/new-unit', function (req, res) {

    var thisYear = new Date();
    thisYear = thisYear.getFullYear();

    if (req.isAuthenticated()) {
        if (req.user.role == 'Administrator') {
            pool.connect(function (errDatabase, client, done) {
                if (errDatabase) {
                    console.log('Error connecting to database', errDatabase);
                    res.sendStatus(500);
                } else {
                    client.query('INSERT INTO occupancy (property, unit, year) VALUES ($1, $2, $3)', [
                            req.body.property,
                            req.body.unit,
                            thisYear
                        ],
                        function (errQuery, data) {
                            done();
                            if (errQuery) {
                                console.log('Error making database query', errQuery);
                                res.sendStatus(500);
                            } else {
                                res.sendStatus(201);
                            }
                        });
                }
            });
        } else {
            //not authorized
            res.sendStatus(403);
        }
    } else {
        //not authorized
        res.sendStatus(403);
    }
});

// Delete a property unit. called from admin-properties view
router.delete('/delete-unit', function (req, res) {
    var occupancyId = req.query.occupancyId;
    if (req.isAuthenticated()) {
        if (req.user.role == 'Administrator') {
            pool.connect(function (err, client, done) {
                if (err) {
                    console.log('db connect error', err);
                    res.sendStatus(500);
                } else {
                    client.query('DELETE FROM occupancy WHERE id=$1', [occupancyId], function (err, data) {
                        done();
                        if (err) {
                            console.log('query error', err);
                            res.sendStatus(500);
                        } else {
                            res.sendStatus(200);
                        }
                    });
                }
            });
        } else {
            //not admin
            res.sendStatus(403);
        }
    } else {
        //not logged in
        res.sendStatus(403);
    }

});

// Update unit occupied status. called from admin-properties view
router.put('/updateOccupied', function (req, res) {
    if (req.isAuthenticated()) {
        if (req.user.role == 'Administrator') {
            pool.connect(function (errDatabase, client, done) {
                if (errDatabase) {
                    console.log('Error connecting to database', errDatabase);
                    res.sendStatus(500);
                } else {
                    client.query('UPDATE occupancy SET occupied=$1 WHERE id=$2;', [
                            req.body.occupied,
                            req.body.id
                        ],
                        function (errQuery, data) {
                            done();
                            if (errQuery) {
                                console.log('Error making database query', errQuery);
                                res.sendStatus(500);
                            } else {
                                res.sendStatus(201);
                            }
                        });
                }
            });
        } else {
            //not authorized
            res.sendStatus(403);
        }
    } else {
        //not authorized
        res.sendStatus(403);
    }
});

module.exports = router;