var MongoClient = require('mongodb').MongoClient;


var mongodb_connection_string = 'mongodb://127.0.0.1:27017/';
//take advantage of openshift env vars when available:
if (process.env.OPENSHIFT_MONGODB_DB_URL) {
    mongodb_connection_string = process.env.OPENSHIFT_MONGODB_DB_URL;
}

module.exports = { retrieveCollections: function (response, username) {

    // Connect to the db application/json
    MongoClient.connect(mongodb_connection_string + username, function (err, db) {
        if (err) {
            response.writeHead(500, { "Content-Type": 'text/plain' });
            response.write("500 Internal Server Error\n");
            response.end();
            return console.dir(err);
        }

        response.writeHead(200, { 'Content-Type': 'application/json' });

        var collection = db.collections(function (err, collections) {

            var ret = [];

            for (var i = 0; i < collections.length; i++) {

                var coll = collections[i];

                if (coll.collectionName.indexOf("system.") != 0) {

                    ret.push({ name: coll.collectionName });

                }

            }
            response.write(JSON.stringify(ret));
            db.close();
            response.end();

        });

    });

},

    createCollection: function (collName, response, username) {

        // Connect to the db application/json
        MongoClient.connect(mongodb_connection_string + username, function (err, db) {
            if (err) {
                response.writeHead(500, { "Content-Type": 'text/plain' });
                response.write("500 Internal Server Error\n");
                response.end();
                return console.dir(err);
            }



            var collection = db.createCollection(collName, function (err, collection) {

                if (err) {
                    response.writeHead(500, { "Content-Type": 'text/plain' });
                    response.write("500 Internal Server Error\n");
                    response.end();
                    return console.dir(err);
                }

                response.writeHead(200, { 'Content-Type': 'application/json' });
                response.write(JSON.stringify({ name: collName }));
                db.close();
                response.end();

            });

        });

    },


    queryCollection: function (collName, payload, response, userName) {

        // Connect to the db application/json
        MongoClient.connect(mongodb_connection_string + userName, function (err, db) {
            if (err) {
                response.writeHead(500, { "Content-Type": 'text/plain' });
                response.write("500 Internal Server Error\n");
                response.end();
                return console.dir(err);
            }



            var collection = db.collection(collName);

            var stream = collection.find(payload).stream();

            response.writeHead(200, { 'Content-Type': 'application/json' });

            response.write('[');

            var first = true;

            stream.on("data", function (item) {

                if (first == true) {
                    first = false;
                } else {
                    response.write(',');
                }

                response.write(JSON.stringify(item));

            });
            stream.on("end", function () {

                response.write(']');

                db.close();
                response.end();

            });

        });

    },

    retrieveCollection: function (collName, response, userName) {

        // Connect to the db application/json
        MongoClient.connect(mongodb_connection_string + userName, function (err, db) {
            if (err) {
                response.writeHead(500, { "Content-Type": 'text/plain' });
                response.write("500 Internal Server Error\n");
                response.end();
                return console.dir(err);
            }



            var collection = db.collection(collName);

            var stream = collection.find().stream();

            response.writeHead(200, { 'Content-Type': 'application/json' });

            response.write('[');

            var first = true;

            stream.on("data", function (item) {

                if (first == true) {
                    first = false;
                } else {
                    response.write(',');
                }

                response.write(JSON.stringify(item));

            });
            stream.on("end", function () {

                response.write(']');

                db.close();
                response.end();

            });

        });

    },

    createDocument: function (coll, payload, response, userName) {

        var connString = mongodb_connection_string + userName;

        MongoClient.connect(connString, function (err, db) {
            if (err) {
                response.writeHead(500, { "Content-Type": 'text/plain' });
                response.write("500 Internal Server Error\n");
                response.end();
                return console.dir(err);
            }

            var collection = db.collection(coll);



            collection.insert(payload, { w: 1 }, function (err, result) {

                if (err) {
                    response.writeHead(500, { "Content-Type": 'text/plain' });
                    response.write("500 Internal Server Error\n");
                    response.end();
                    return console.dir(err);
                }

                response.writeHead(200, { 'Content-Type': 'application/json' });
                response.write(JSON.stringify(payload));
                db.close();
                response.end();

            });

        });

    }
};