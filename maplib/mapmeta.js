var mapdata = require('./mapdata.js');

module.exports = {

    handleMapMetaRequest: function (request, response, urlParts, userName) {

        if (urlParts.pathname.indexOf('/mapdata/find/') == 0) {

            var subpart = urlParts.pathname.replace('/mapdata/find/', '');

            if (request.method == 'POST') {

                var fullBody = '';

                request.on('data', function (chunk) {
                    fullBody += chunk.toString();
                });

                request.on('end', function () {
                    var payload = JSON.parse(fullBody);
                    mapdata.queryCollection(subpart, payload, response, userName);
                });

            } else if (request.method == 'GET') {

                mapdata.retrieveCollection(subpart, response, userName);

            } else {
                response.writeHead(404, { "Content-Type": 'text/plain' });
                response.write("404 Not Found\n");
                response.end();
                console.dir('404: ' + urlParts.pathname);

            }


        } else if (urlParts.pathname.indexOf('/mapdata/collections/') == 0) {

            var subpart = urlParts.pathname.replace('/mapdata/collections/', '');

            if (request.method == 'POST') {

                var fullBody = '';

                request.on('data', function (chunk) {
                    fullBody += chunk.toString();
                });

                request.on('end', function () {
                    var payload = JSON.parse(fullBody);
                    mapdata.createDocument(subpart, payload, response, userName);
                });

            } else if (request.method == 'GET') {

                mapdata.retrieveCollection(subpart, response, userName);

            } else if (request.method == 'PUT') {

                var fullBody = '';

                request.on('data', function (chunk) {
                    fullBody += chunk.toString();
                });

                request.on('end', function () {
                    var payload = JSON.parse(fullBody);
                    mapdata.saveDocument(subpart, payload, response, userName);
                });
            } else {
                response.writeHead(404, { "Content-Type": 'text/plain' });
                response.write("404 Not Found\n");
                response.end();
                console.dir('404: ' + urlParts.pathname);

            }


        } else if (urlParts.pathname.indexOf('/mapdata/collections') == 0) {

            if (request.method == 'POST') {

                var fullBody = '';

                request.on('data', function (chunk) {
                    fullBody += chunk.toString();
                });

                request.on('end', function () {
                    var payload = JSON.parse(fullBody);
                    mapdata.createCollection(payload.name, response, userName);
                });



            } else if (request.method == 'GET') {

                mapdata.retrieveCollections(response, userName);

            } else {
                response.writeHead(404, { "Content-Type": 'text/plain' });
                response.write("404 Not Found\n");
                response.end();
                console.dir('404: ' + urlParts.pathname);

            }



        } else {
            response.writeHead(404, { "Content-Type": 'text/plain' });
            response.write("404 Not Found\n");
            response.end();
            console.dir('404: ' + urlParts.pathname);

        }


    }
};