var http = require("http");
var fs = require('fs');
var url = require('url');
var Cookies = require('cookies');

var crypto = require('crypto');
var jwt = require('jwt-simple');
var bcrypt = require('bcrypt-nodejs');

var staticCache = [];

var keys = ['IFEesFMESV(sV(M(#M$R#@843242(*', 'F(s9fMSEf39394329$M324#@$', 'DFsd9VsD(VM(3(M332424'];
var jwtAlogrithm = 'HS512';
var jwtSecretSalt = 'F(SEFsjv*SZV*XZV8efes8f';

var expirationHours = 2;

Date.prototype.addHours = function(h) {    
   this.setTime(this.getTime() + (h*60*60*1000)); 
   return this;   
}

var server = http.createServer(function (request, response) {

    try {
        var cookies = new Cookies(request, response, keys);

        var urlParts = url.parse(request.url, true);

        var clientIP = request.connection.remoteAddress;

        if (request.headers && request.headers.HTTP_X_FORWARDED_FOR) {

            clientIP = request.headers.HTTP_X_FORWARDED_FOR;

        }

        if (urlParts.pathname.indexOf('/mapapp/') == 0) {

            if (urlParts.pathname.indexOf('/mapapp/login') == 0) {

                mapLogin(response, request.headers.mapusername, request.headers.mappassword, clientIP, cookies);

            } else if (urlParts.pathname.indexOf('/mapapp/register') == 0) {

                var fullBody = '';

                request.on('data', function (chunk) {
                    fullBody += chunk.toString();
                });

                request.on('end', function () {
                    console.dir(fullBody);
                    var payload = JSON.parse(fullBody);
                    mapCreateUser(response, payload.username, payload.password, payload.fullName, payload.email, clientIP);
                });

            }

        } else if (urlParts.pathname.indexOf('/mapdata/') == 0) {

            if (request.headers.mapauth == cookies.get("MapTicket", { signed: true })) {

                var userName = mapIsAuthenticated(request.headers.mapauth, clientIP);

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
                                queryCollection(subpart, payload, response, userName);
                            });

                        } else if (request.method == 'GET') {

                            retrieveCollection(subpart, response, userName);

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
                                createDocument(subpart, payload, response, userName);
                            });

                        } else if (request.method == 'GET') {

                            retrieveCollection(subpart, response, userName);

                        }


                    } else if (urlParts.pathname.indexOf('/mapdata/collections') == 0) {

                        if (request.method == 'POST') {

                            var fullBody = '';

                            request.on('data', function (chunk) {
                                fullBody += chunk.toString();
                            });

                            request.on('end', function () {
                                var payload = JSON.parse(fullBody);
                                createCollection(payload.name, response, userName);
                            });



                        } else if (request.method == 'GET') {

                            retrieveCollections(response, userName);

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

            var responded = false;

            var file = null;

            var len = staticCache.length;

            for (var i = 0; i < len; i++) {
                if (staticCache[i].pathname === urlParts.pathname) {
                    file = staticCache[i].filecontent;
                    break;
                }
            }

            if (file == null) {
                try {

                    fs.readFile('app/' + urlParts.pathname, function (err, data) {
                        if (!err) {
                            fileResponse(response, data, urlParts.pathname);
                            staticCache.push({ pathname: urlParts.pathname, filecontent: data });
                        } else {
                            console.log(err);
                            response.writeHead(404, { "Content-Type": 'text/plain' });
                            response.write("404 Not Found\n");
                            response.end();
                            console.dir('404: ' + urlParts.pathname);
                        }

                    });


                } catch (err) {

                }
            } else {
                fileResponse(response, file, urlParts.pathname);

            }



        }

    } catch (err) {

        console.dir(err);

    }

});

var server_port = process.env.OPENSHIFT_NODEJS_PORT || 86;
var server_ip_address = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';

var mongodb_connection_string = 'mongodb://127.0.0.1:27017/';
//take advantage of openshift env vars when available:
if (process.env.OPENSHIFT_MONGODB_DB_URL) {
    mongodb_connection_string = process.env.OPENSHIFT_MONGODB_DB_URL;
}


server.listen(server_port, server_ip_address);
console.log("Server is listening");


function fileResponse(response, file, pathname) {


    var contentType = exports.ext.getContentType(exports.ext.getExt(pathname));

    response.writeHead(200, { 'Content-Type': contentType });

    if (contentType.indexOf('image/') == 0 || contentType.indexOf('audio/') == 0 || contentType.indexOf('video/') == 0 || contentType.indexOf('application/') == 0) {
        response.end(file, 'binary');
    } else {
        response.end(file);
    }
    console.dir('200: ' + pathname);

}

var MongoClient = require('mongodb').MongoClient;


function retrieveCollections(response, username) {

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

}

function createCollection(collName, response, username) {

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
            response.write(JSON.stringify({name: collName}));
            db.close();
            response.end();

        });

    });

}


function queryCollection(collName, payload, response, userName) {

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

}

function retrieveCollection(collName, response, userName) {

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

}

function createDocument(coll, payload, response, userName) {

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

function mapIsAuthenticated(rawToken, clientIP) {

    try {
        var decoded = jwt.decode(rawToken, jwtSecretSalt + clientIP, jwtAlogrithm);
        return decoded.username;
    } catch (err) {

    console.dir(err);

}

return null;
}

//user
///username
///password (hashed)
///
function mapCreateUser(response, username, password, fullName, email) {

    var u = new Buffer(username, 'base64').toString('ascii');
    var p = new Buffer(password, 'base64').toString('ascii');

    if (u.toLowerCase().trim() == 'mapmaster') {

        response.writeHead(500, { "Content-Type": 'text/plain' });
        response.write("500 Internal Server Error\n");
        response.end();
        return;

    }

    var connString = mongodb_connection_string + 'mapmaster';
    console.dir(connString);
    MongoClient.connect(connString, function (err, db) {
        if (err) {
            response.writeHead(500, { "Content-Type": 'text/plain' });
            response.write("500 Internal Server Error\n");
            response.end();
            return console.dir(err);
        }

        var collection = db.collection('users');

        bcrypt.hash(p, bcrypt.genSaltSync(10), function () { }, function (err, hash) {

            collection.insert({ username: u, password: hash, fullName: fullName, email: email }, { w: 1 }, function (err, result) {

                if (err) {
                    response.writeHead(500, { "Content-Type": 'text/plain' });
                    response.write("500 Internal Server Error\n");
                    response.end();
                    return console.dir(err);
                }

                response.writeHead(200, { 'Content-Type': 'application/json' });
                db.close();
                response.end();

            });

        });

    });

}



function mapLogin(response, username, password, clientIP, cookies) {
    var u = new Buffer(username, 'base64').toString('ascii');
    var p = new Buffer(password, 'base64').toString('ascii');
    // Connect to the db application/json
    MongoClient.connect(mongodb_connection_string + 'mapmaster', function (err, db) {
        if (err) {
            response.writeHead(500, { "Content-Type": 'text/plain' });
            response.write("500 Internal Server Error\n");
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
                    var token = jwt.encode({ username: u, loggedIn: new Date() }, jwtSecretSalt + clientIP, jwtAlogrithm);

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

exports.ext = function () {
    var extTypes = {
        "3gp": "video/3gpp"
		, "a": "application/octet-stream"
		, "ai": "application/postscript"
		, "aif": "audio/x-aiff"
		, "aiff": "audio/x-aiff"
		, "asc": "application/pgp-signature"
		, "asf": "video/x-ms-asf"
		, "asm": "text/x-asm"
		, "asx": "video/x-ms-asf"
		, "atom": "application/atom+xml"
		, "au": "audio/basic"
		, "avi": "video/x-msvideo"
		, "bat": "application/x-msdownload"
		, "bin": "application/octet-stream"
		, "bmp": "image/bmp"
		, "bz2": "application/x-bzip2"
		, "c": "text/x-c"
		, "cab": "application/vnd.ms-cab-compressed"
		, "cc": "text/x-c"
		, "chm": "application/vnd.ms-htmlhelp"
		, "class": "application/octet-stream"
		, "com": "application/x-msdownload"
		, "conf": "text/plain"
		, "cpp": "text/x-c"
		, "crt": "application/x-x509-ca-cert"
		, "css": "text/css"
		, "csv": "text/csv"
		, "cxx": "text/x-c"
		, "deb": "application/x-debian-package"
		, "der": "application/x-x509-ca-cert"
		, "diff": "text/x-diff"
		, "djv": "image/vnd.djvu"
		, "djvu": "image/vnd.djvu"
		, "dll": "application/x-msdownload"
		, "dmg": "application/octet-stream"
		, "doc": "application/msword"
		, "dot": "application/msword"
		, "dtd": "application/xml-dtd"
		, "dvi": "application/x-dvi"
		, "ear": "application/java-archive"
		, "eml": "message/rfc822"
		, "eps": "application/postscript"
		, "exe": "application/x-msdownload"
		, "f": "text/x-fortran"
		, "f77": "text/x-fortran"
		, "f90": "text/x-fortran"
		, "flv": "video/x-flv"
		, "for": "text/x-fortran"
		, "gem": "application/octet-stream"
		, "gemspec": "text/x-script.ruby"
		, "gif": "image/gif"
		, "gz": "application/x-gzip"
		, "h": "text/x-c"
		, "hh": "text/x-c"
		, "htm": "text/html"
		, "html": "text/html"
		, "ico": "image/vnd.microsoft.icon"
		, "ics": "text/calendar"
		, "ifb": "text/calendar"
		, "iso": "application/octet-stream"
		, "jar": "application/java-archive"
		, "java": "text/x-java-source"
		, "jnlp": "application/x-java-jnlp-file"
		, "jpeg": "image/jpeg"
		, "jpg": "image/jpeg"
		, "js": "application/javascript"
		, "json": "application/json"
		, "log": "text/plain"
		, "m3u": "audio/x-mpegurl"
		, "m4v": "video/mp4"
		, "man": "text/troff"
		, "mathml": "application/mathml+xml"
		, "mbox": "application/mbox"
		, "mdoc": "text/troff"
		, "me": "text/troff"
		, "mid": "audio/midi"
		, "midi": "audio/midi"
		, "mime": "message/rfc822"
		, "mml": "application/mathml+xml"
		, "mng": "video/x-mng"
		, "mov": "video/quicktime"
		, "mp3": "audio/mpeg"
		, "mp4": "video/mp4"
		, "mp4v": "video/mp4"
		, "mpeg": "video/mpeg"
		, "mpg": "video/mpeg"
		, "ms": "text/troff"
		, "msi": "application/x-msdownload"
		, "odp": "application/vnd.oasis.opendocument.presentation"
		, "ods": "application/vnd.oasis.opendocument.spreadsheet"
		, "odt": "application/vnd.oasis.opendocument.text"
		, "ogg": "application/ogg"
		, "p": "text/x-pascal"
		, "pas": "text/x-pascal"
		, "pbm": "image/x-portable-bitmap"
		, "pdf": "application/pdf"
		, "pem": "application/x-x509-ca-cert"
		, "pgm": "image/x-portable-graymap"
		, "pgp": "application/pgp-encrypted"
		, "pkg": "application/octet-stream"
		, "pl": "text/x-script.perl"
		, "pm": "text/x-script.perl-module"
		, "png": "image/png"
		, "pnm": "image/x-portable-anymap"
		, "ppm": "image/x-portable-pixmap"
		, "pps": "application/vnd.ms-powerpoint"
		, "ppt": "application/vnd.ms-powerpoint"
		, "ps": "application/postscript"
		, "psd": "image/vnd.adobe.photoshop"
		, "py": "text/x-script.python"
		, "qt": "video/quicktime"
		, "ra": "audio/x-pn-realaudio"
		, "rake": "text/x-script.ruby"
		, "ram": "audio/x-pn-realaudio"
		, "rar": "application/x-rar-compressed"
		, "rb": "text/x-script.ruby"
		, "rdf": "application/rdf+xml"
		, "roff": "text/troff"
		, "rpm": "application/x-redhat-package-manager"
		, "rss": "application/rss+xml"
		, "rtf": "application/rtf"
		, "ru": "text/x-script.ruby"
		, "s": "text/x-asm"
		, "sgm": "text/sgml"
		, "sgml": "text/sgml"
		, "sh": "application/x-sh"
		, "sig": "application/pgp-signature"
		, "snd": "audio/basic"
		, "so": "application/octet-stream"
		, "svg": "image/svg+xml"
		, "svgz": "image/svg+xml"
		, "swf": "application/x-shockwave-flash"
		, "t": "text/troff"
		, "tar": "application/x-tar"
		, "tbz": "application/x-bzip-compressed-tar"
		, "tcl": "application/x-tcl"
		, "tex": "application/x-tex"
		, "texi": "application/x-texinfo"
		, "texinfo": "application/x-texinfo"
		, "text": "text/plain"
		, "tif": "image/tiff"
		, "tiff": "image/tiff"
		, "torrent": "application/x-bittorrent"
		, "tr": "text/troff"
		, "txt": "text/plain"
		, "vcf": "text/x-vcard"
		, "vcs": "text/x-vcalendar"
		, "vrml": "model/vrml"
		, "war": "application/java-archive"
		, "wav": "audio/x-wav"
		, "wma": "audio/x-ms-wma"
		, "wmv": "video/x-ms-wmv"
		, "wmx": "video/x-ms-wmx"
		, "wrl": "model/vrml"
		, "wsdl": "application/wsdl+xml"
		, "xbm": "image/x-xbitmap"
		, "xhtml": "application/xhtml+xml"
		, "xls": "application/vnd.ms-excel"
		, "xml": "application/xml"
		, "xpm": "image/x-xpixmap"
		, "xsl": "application/xml"
		, "xslt": "application/xslt+xml"
		, "yaml": "text/yaml"
		, "yml": "text/yaml"
		, "zip": "application/zip"
    }
    return {
        getExt: function (path) {
            var i = path.lastIndexOf('.');
            return (i < 0) ? '' : path.substr(i + 1);
        },
        getContentType: function (ext) {
            return extTypes[ext.toLowerCase()] || 'application/octet-stream';
        }
    };
} ();