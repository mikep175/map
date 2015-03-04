var MongoClient = require('mongodb').MongoClient;
var crypto = require('crypto');
var jwt = require('jwt-simple');
var bcrypt = require('bcrypt-nodejs');

var mapkeys = require('./mapkeys.js');

var expirationHours = 2;

Date.prototype.addHours = function (h) {
    this.setTime(this.getTime() + (h * 60 * 60 * 1000));
    return this;
}

var mongodb_connection_string = 'mongodb://127.0.0.1:27017/';
//take advantage of openshift env vars when available:
if (process.env.OPENSHIFT_MONGODB_DB_PASSWORD) {
    mongodb_connection_string = process.env.OPENSHIFT_MONGODB_DB_USERNAME + ":" +
  process.env.OPENSHIFT_MONGODB_DB_PASSWORD + "@" +
  process.env.OPENSHIFT_MONGODB_DB_HOST + ':' +
  process.env.OPENSHIFT_MONGODB_DB_PORT + '/';
}


module.exports = { isAuthenticated: function (rawToken, clientIP) {

    try {
        var decoded = jwt.decode(rawToken, mapkeys.jwtSecretSalt + clientIP, mapkeys.jwtAlogrithm);
        return decoded.username;
    } catch (err) {

        console.dir(err);

    }

    return null;
},

    //user
    ///username
    ///password (hashed)
    ///
    createUser: function (response, username, password, fullName, email) {

        var u = new Buffer(username, 'base64').toString('ascii');
        var p = new Buffer(password, 'base64').toString('ascii');

        if (u.toLowerCase().trim() == 'mapmaster') {

            response.writeHead(500, { "Content-Type": 'text/plain' });

            if (mapkeys.verboseErrors == true) {
                response.write("001: Reserved User Name\n");
            } else {
                response.write("500 Internal Server Error\n");
            }
            response.end();
            return;

        }

        var connString = mongodb_connection_string + 'mapmaster';
        console.dir(connString);
        MongoClient.connect(connString, function (err, db) {
            if (err) {
                response.writeHead(500, { "Content-Type": 'text/plain' });
                if (mapkeys.verboseErrors == true) {
                    response.write("002: " + JSON.stringify(err));
                } else {
                    response.write("500 Internal Server Error\n");
                }
                response.end();
                return console.dir(err);
            }

            var collection = db.collection('users');

            bcrypt.hash(p, bcrypt.genSaltSync(10), function () { }, function (err, hash) {

                collection.insert({ username: u, password: hash, fullName: fullName, email: email }, { w: 1 }, function (err, result) {

                    if (err) {
                        response.writeHead(500, { "Content-Type": 'text/plain' });
                        if (mapkeys.verboseErrors == true) {
                            response.write("003: " + JSON.stringify(err));
                        } else {
                            response.write("500 Internal Server Error\n");
                        }
                        response.end();
                        return console.dir(err);
                    }

                    response.writeHead(200, { 'Content-Type': 'application/json' });
                    db.close();
                    response.end();

                });

            });

        });

    },
    login: function (response, username, password, clientIP, cookies) {
        var u = new Buffer(username, 'base64').toString('ascii');
        var p = new Buffer(password, 'base64').toString('ascii');
        // Connect to the db application/json
        MongoClient.connect(mongodb_connection_string + 'mapmaster', function (err, db) {
            if (err) {
                response.writeHead(500, { "Content-Type": 'text/plain' });
                if (mapkeys.verboseErrors == true) {
                    response.write("004: " + JSON.stringify(err));
                } else {
                    response.write("500 Internal Server Error\n");
                }
                response.end();
                return console.dir(err);
            }



            var collection = db.collection('users');

            collection.findOne({ username: u }, function (err, doc) {

                if (doc == null) {
                    var loginValue = { LoginResult: false };
                    db.close();
                    response.writeHead(200, {
                        'Content-Type': 'application/json'
                    });
                    response.write(JSON.stringify(loginValue));
                    response.end();
                    return;

                }


                bcrypt.compare(p, doc.password, function (err, res) {
                    if (res == true) {

                        var loginValue = { LoginResult: true };
                        var token = jwt.encode({ username: u, loggedIn: new Date() }, mapkeys.jwtSecretSalt + clientIP, mapkeys.jwtAlogrithm);

                        cookies.set("MapTicket", token, { signed: true, expires: new Date().addHours(2), httpOnly: false });
                    } else {

                        var loginValue = { LoginResult: false };

                    }

                    db.close();
                    response.writeHead(200, {
                        'Content-Type': 'application/json'
                    });
                    response.write(JSON.stringify(loginValue));
                    response.end();
                });

            });

        });

    }

};
