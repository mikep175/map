var http = require("http");

var url = require('url');
var Cookies = require('cookies');

var mapstatic = require('./mapstatic.js');
var mapapp = require('./mapapp.js');
var mapdata = require('./mapdata.js');
var mapkeys = require('./mapkeys.js');

var server_port = process.env.OPENSHIFT_NODEJS_PORT || 86;
var server_ip_address = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';

var server = http.createServer(function (request, response) {

    try {
        var cookies = new Cookies(request, response, mapkeys.signingKeys);

        var urlParts = url.parse(request.url, true);

        var clientIP = request.connection.remoteAddress;

        if (request.headers && request.headers.HTTP_X_FORWARDED_FOR) {

            clientIP = request.headers.HTTP_X_FORWARDED_FOR;

        }

        if (urlParts.pathname.indexOf('/mapapp/') == 0) {

            if (urlParts.pathname.indexOf('/mapapp/login') == 0) {

                mapapp.login(response, request.headers.mapusername, request.headers.mappassword, clientIP, cookies);

            } else if (urlParts.pathname.indexOf('/mapapp/register') == 0) {

                var fullBody = '';

                request.on('data', function (chunk) {
                    fullBody += chunk.toString();
                });

                request.on('end', function () {
                    console.dir(fullBody);
                    var payload = JSON.parse(fullBody);
                    mapapp.createUser(response, payload.username, payload.password, payload.fullName, payload.email, clientIP);
                });

            }

        } else if (urlParts.pathname.indexOf('/mapdata/') == 0) {

            if (request.headers.mapauth == cookies.get("MapTicket", { signed: true })) {

                var userName = mapapp.isAuthenticated(request.headers.mapauth, clientIP);

                if (userName != null) {

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

                        }



                    }
                }
            } else {
                response.writeHead(401, { "Content-Type": 'text/plain' });
                response.write("401 Unathorized\n");
                response.end();
                console.dir('401: ' + urlParts.pathname);
            }

        } else {

            mapstatic.serveAppFile(urlParts, response);

        }

    } catch (err) {

        throw err;
        //console.dir(err);

    }

});

server.listen(server_port, server_ip_address);
console.log("Server is listening");



