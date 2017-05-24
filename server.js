var express = require ("express");
var path = require ("path");
var bodyParser = require("body-parser");
var crypto = require("crypto");
var MongoClient = require ("mongodb").MongoClient;
var ObjectID = require('mongodb').ObjectID;

var shuffle = require('knuth-shuffle').knuthShuffle;

const fs = require('fs');
var multiparty = require('connect-multiparty'),
    multipartyMiddleware = multiparty();
var async = require("async");
var app = express();
var nodemailer = require ("nodemailer");


var transporter = nodemailer.createTransport('smtps://*******@gmail.com:*******@smtp.gmail.com');

var users = require ("./public/javascript/users");

// var http = require('http').Server(app);
// var io = require('socket.io')(http);
var server = require('http').createServer(app);
var io = require('socket.io')(server);

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use('/js', express.static(__dirname + '/node_modules/bootstrap/dist/js'));
app.use('/js', express.static(__dirname + '/node_modules/jquery/dist'));
app.use('/js', express.static(__dirname + '/node_modules/angular/'));
app.use('/js', express.static(__dirname + '/node_modules/angularjs-slider/dist'));
// app.use('/js', express.static(__dirname + '/node_modules/angular-h-sweetalert/dist'));
app.use('/js', express.static(__dirname + '/node_modules/angularjs-geolocation/dist'));
app.use('/js', express.static(__dirname + '/node_modules/ng-file-upload/dist'));
app.use('/js', express.static(__dirname + '/node_modules/ng-tags-input/build'));
app.use('/js', express.static(__dirname + '/node_modules/angular-cookies/'));
app.use('/js', express.static(__dirname + '/node_modules/angular-ui-bootstrap/dist'));
app.use('/js', express.static(__dirname + '/node_modules/angular-ui-router/release'));
app.use('/css', express.static(__dirname + '/node_modules/bootstrap/dist/css'));
app.use('/socket', express.static(__dirname + '/node_modules/socket.io-client/dist'));

app.use(express.static(path.join(__dirname, 'public')));

// var users = require ("/javascript/users.js");
// console.log(users.usersArray);


app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, 'index.html'));
});

var uniqId = function () {
  return  (new Date().getTime()).toString(16);
};

var router = express.Router();

var url = 'mongodb://localhost:27017/test';

router.route("/users")
    .get(function(req, res){
        MongoClient.connect(url, function(err, db) {
            if (!err)
                console.log("Connected to mongo db, GET " + req.originalUrl);
            var collection = db.collection('users');
            collection.find().toArray(function (err, result) {
                if (err) {
                    console.log(err);
                } else if (result.length) {
                    //console.log('Found:', result);
                    res.json(result);
                } else {
                    console.log('No document(s) found with defined "find" criteria!');
                }
            });
            db.close();
        });
    })
    .post(function(req, res){
        var infos = req.body;
        infos.password = crypto.createHash("whirlpool").update(infos.password).digest("hex");
        MongoClient.connect(url, function(err, db) {
            if (!err)
                console.log("Connected to mongo db, POST " + req.originalUrl);
            var collection = db.collection('users');
            collection.find({$or: [{mail : infos.mail},{username : infos.username }]}).toArray(function (err, result) {
                if (result.length){
                    res.json({fail : "ok"});
                    db.close();
                }
                else{
                    console.log("pas in db");
                    collection.insert(infos, function (err, result) {
                        if (err) {
                            console.log(err);
                        } else {
                            console.log('Inserted %d documents into the "users" collection. The documents inserted with "_id" are:', result.length, result);
                        }
                    }, function() { db.close(); });
                    res.json({success:"ok"});
                }
            });
            //db.close();
        });
        console.log(req.body);
    });

router.route("/users/generic/:username/:key")
    .get(function (req, res) {
        // console.log(req.params);
       MongoClient.connect(url, function (err, db) {
           if (!err)
               console.log("Connected to mongo db, GET " + req.originalUrl);
          db.collection("users").findOne({$or:[{ username : req.params.username }, {token : req.params.username}]}, function (err, result) {
              // console.log(result);
             if(result[req.params.key]){
                 res.json({value: result[req.params.key]});
             }
             else
                 res.json({error: true});
              db.close();
          });
       });
    });

function getPopularity() {

    return new Promise ((resolve, reject) => {
        var Users = [];
        var visits, asked;
        MongoClient.connect(url, function (err, db) {
            db.collection("users").find({}).toArray( function(er, result){
                // console.log(result);
                result.forEach(function (e) {
                    if ("visited" in e && "askedFrom" in e) {
                        visits = e.visited.length;
                        asked = e.askedFrom.length;
                        if ("accepted" in e)
                            asked += e.accepted.length;
                    }
                    console.log(e.username, visits, asked);
                    score = (asked && visits) ? (asked / visits) * 100 : 0;
                    Users.push({username: e.username, score: score});
                });
                db.close();
                resolve(Users);
            });
        });
    });
}

router.route("/users/name").get(function (req, res) {
   MongoClient.connect(url, function (err, db) {
      db.collection("users").find({},{username:1}).toArray(function (er, result) {
          var users = [];
         if (result){
             result.forEach(function (e) {
                 users.push(e.username);
             });
         }
         res.json({users:users});
          db.close();
      });
   });
});

router.route("/test").get(function(req, res){

    console.log(router);

});

router.route("/createUsers")
    .get(function (req, res) {
       MongoClient.connect(url, function (err, db) {
           users.usersArray.forEach(function (e) {
               // console.log(e.informations.last_name);
               db.collection("users").insert(e, function (err, res) {

               });
           });
           db.close();
           res.end();
       });
    });

router.route("/token").post(function (req, res) {
    MongoClient.connect(url, function (err, db) {
      if (!err)
          console.log("Connected to mongo db, POST " + req.originalUrl);
      // console.log("req.body.token : "+req.body.token);
      if (!req.body.token){
          res.json({success:false});
          // console.log("IN");
          return ;
      }
        // console.log("OUT");
      db.collection("users").find({token : req.body.token}).toArray(function (err, result) {
        if (result.length)
            res.json({success : "ok"});
        else
            res.json({success: "bad"});
      })
    });
});


router.route("/users/:username/profil")
    .get(function (req, res) {
        MongoClient.connect(url, function(err, db) {
            if (!err)
                console.log("Connected to mongo db, GET " + req.originalUrl);
            var collection = db.collection('users');
            collection.find({$or : [{ username: req.params.username }, {token : req.params.username}]}).toArray(function (err, result) {
                if (err) {
                    console.log(err);
                } else if (result.length) {
                    // console.log('Found:', result);
                    res.json(result[0].informations);
                } else {
                    // console.log('No document(s) found with defined "find" criteria!');
                    res.json({});
                }
            });
            db.close();
        });
    })
    .post(function (req, res) {
        MongoClient.connect(url, function(err, db){
            if (!err)
                console.log("Connected to mongo db, POST " + req.originalUrl);
            db.collection("users").update({$or:[{ username : req.params.username }, {token : req.params.username}]}, { $set : { informations : req.body }})
                .then(function s(data) {
                    db.collection("users").find({$or : [{ username: req.params.username }, {token : req.params.username}]}).toArray(function (err, result) {
                        if (result.length)
                            res.json({tags : result[0].informations});
                    });
                    db.close();
                }, function f(err) { console.log(err) ;});
            //db.close;
        });
         // res.end();
    });

router.route("/users/:username/tags")
    .get(function (req, res) {
        MongoClient.connect(url, function(err, db) {
            if (!err)
                console.log("Connected to mongo db, GET " + req.originalUrl);
            var collection = db.collection('users');
            collection.find({$or : [{ username: req.params.username }, {token : req.params.username}]}).toArray(function (err, result) {
                // console.log(result);
                if (err) {
                    console.log(err);
                } else if (result.length) {
                    // console.log('Found:', result);
                    res.json({tags:result[0].tags? result[0].tags : false});
                } else {
                    // console.log('No document(s) found with defined "find" criteria!');
                }
            });
            db.close();
        });
    })
    .post(function (req, res) {
        MongoClient.connect(url, function(err, db){
            if (!err)
                console.log("Connected to mongo db, POST " + req.originalUrl);
            db.collection("users").update({$or:[{ username : req.params.username }, {token : req.params.username}]}, { $push : { tags : req.body.tags }})
                .then(function s(data) {
                    db.collection("users").find({$or : [{ username: req.params.username }, {token : req.params.username}]}).toArray(function (err, result) {
                        if (result.length)
                            res.json({tags : result[0].tags});
                    });
                    db.close();
                }, function f(err) { console.log(err) ;});
        });
        // res.end();
    })
    .delete(function (req, res) {
        MongoClient.connect(url, function (err, db) {
            if (!err)
                console.log("Connected to mongo db, DEL " + req.originalUrl);
            db.collection("users").update(
                {$or:[{ username : req.params.username }, {token : req.params.username}]},
                { $pull: { tags : req.query.tag } }
            ).then(function (data) {
                db.collection("users").find({$or : [{ username: req.params.username }, {token : req.params.username}]}).toArray(function (err, result) {
                    if (result.length)
                        res.json({tags : result[0].tags});
                });
                db.close();
            });
        });
    });

var rand = function() {
    return Math.random().toString(36).substr(2); // remove `0.`
};

var token = function() {
    return rand() + rand(); // to make it longer
};

router.route("/connect").post(function(req, res){
    var infos = req.body;
    // console.log(infos);
    hashedPassword = crypto.createHash("whirlpool").update(infos.password).digest("hex");


    MongoClient.connect(url, function(err, db) {
        if (!err)
            console.log("Connected to mongo db, POST " + req.originalUrl);
        var collection = db.collection('users');
        collection.find({mail : infos.mail, password : hashedPassword }).toArray(function (err, result) {
            if (err) {
                console.log(err);
            } else if (result.length) {
                var tok = token();
                ret = {success : tok, username: result[0].username};
                collection.update({mail: infos.mail}, {$set: {token : tok, lastConnection : new Date()}}).then(function s(res) { db.close();}, function f(err) { console.log(err) ;});
                res.json(ret);
            } else {
                ret = {fail : "ok"};
                res.json(ret);
            }
        });
        // db.close();
    });
});

router.route("/tags")
    .get(function(req, res){
        MongoClient.connect(url, function(err, db) {
            if (!err)
                console.log("Connected to mongo db, GET " + req.originalUrl);
            var collection = db.collection('tags');
            var query = req.query.query;
            console.log(query);
            var regex = { tag : new RegExp("^" + query ) };
            // console.log(regex);
            collection.find(regex).toArray(function (err, result) {
                if (err) {
                    console.log(err);
                } else if (result.length) {
                    var arr = [];
                    for (var key in result) {
                        if (!result.hasOwnProperty(key)) continue;
                        var obj = result[key];
                        arr.push(obj['tag']);
                    }
                    // console.log('Found:', result);
                    res.json({tags: arr});
                } else {
                    // console.log('No document(s) found with defined "find" criteria!');
                    res.json({});
                }
            });
            db.close();
        });
    })
    .post(function(req, res){
        MongoClient.connect(url, function(err, db){
            if (!err)
                console.log("Connected to mongo db, POST " + req.originalUrl);
            var coll = db.collection("tags");
            coll.update(
                {tag: req.body.tag},
                {
                    $setOnInsert: {tag : req.body.tag}
                },
                { upsert: true }
            ).then(function (data) {
                coll.find().toArray(function(err, result){
                    if (result.length) {
                        var arr = [];
                        for (var key in result) {
                            if (!result.hasOwnProperty(key)) continue;
                            var obj = result[key];
                            arr.push(obj['tag']);
                        }
                        // console.log('Found:', result);
                        res.json({tags: arr});
                    }
                })
            });
        });
    });

router.route("/users/:username/images")
    .post(multipartyMiddleware, function (req, res) {
        var file = req.files.file;
        fs.readFile(file.path, "base64", function (err, data) {
           if(err)
               return console.log(err);
            // console.log(data);
            MongoClient.connect(url, function (err, db) {
                if (!err)
                    console.log("Connected to mongo db, POST " + req.originalUrl);

                db.collection("images").insert({user: req.params.username, image: data}, function (err, result) {
                    db.collection("users").update({$or:[{ username : req.params.username }, {token : req.params.username}]}, { $addToSet : { images : result.insertedIds[0] }})
                        .then(function (data) {
                            db.collection("users").find({$or : [{ username: req.params.username }, {token : req.params.username}]}).toArray(function (err, result) {
                                if (result.length)
                                    res.json({images : result[0].images});
                            });
                        });
                });
            });
        });
        // res.end();
    })
    .get(function (req, res) {
        MongoClient.connect(url, function (err, db) {
            if (!err)
                console.log("Connected to mongo db, GET " + req.originalUrl);
            db.collection("users").find({$or : [{ username: req.params.username }, {token : req.params.username}]}).toArray(function (err, result) {
            // console.log(result[0]);
              if(result.length && result[0].images){
                  var b64Images = [];
                  // console.log(result[0].images);
                  queryPromises = [];
                  result[0].images.forEach(function (e) {
                      console.log(e);
                      queryPromise = db.collection("images").find({_id : e}).toArray();
                      queryPromises.push(queryPromise);
                  });
                  Promise.all(queryPromises).
                  then((valeur) => {
                      // console.log("Length : " + valeur.length);
                        valeur.forEach(function (elem) {
                            b64Images.push({img: elem[0].image, id: elem[0]._id});
                        });
                        res.json({images : b64Images});
                         }, (raison) => {
                      console.log(raison);
                  });

              }
              else {
                  res.end();
              }
                db.close();
            });
        });
    })
    .delete(function (req, res) {
        MongoClient.connect(url, function (err, db) {
           if (!err)
               console.log("Connected to mongo db, DELETE " + req.originalUrl);
            // console.log(ObjectID(req.query.image).toString());
            db.collection("users").findOne({$or:[{ username : req.params.username }, {token : req.params.username}]}, function (err, doc) {
                if (doc.profilPic == req.query.image) {
                    res.json({error: "Cette photo est votre photo de profil, veuillez en changer avant de la supprimer."});
                    db.close();
                }
                else {
                   db.collection("users").update(
                       {$or:[{ username : req.params.username }, {token : req.params.username}]},
                       { $pull: { images :  ObjectID(req.query.image) } }, function () {
                           db.collection("images").deleteOne({_id: ObjectID(req.query.image)}).then(function () {
                               res.end();
                               db.close();
                           });
                       }
                   );
                }
            });
        });
    });

router.route("/users/:username/profilPic")
    .get(function (req, res) {
        var profilId ;
       MongoClient.connect(url, function (err, db) {
          if (!err)
              console.log("Connected to mongo db, GET " + req.originalUrl);
          db.collection("users").findOne({$or:[{ username : req.params.username }, {token : req.params.username}]},function (err, doc) {
              // profilId = doc.profilPic;
              // console.log(profilId);
              if (doc) {
                  MongoClient.connect(url, function (err2, db2) {
                      // console.log(doc.profilPic);
                      db2.collection("images").findOne({"_id": ObjectID(doc.profilPic)}, function (er, dc) {
                          if (er)
                              console.log(er);
                          // console.log(dc);
                          res.json(dc ? {profilPic: "data:image/png;base64," + dc.image} : {profilPic: "/style/images/profil.png"});
                      });
                      db.close();
                  });
              }
              else
                  res.json( {profilPic: "/style/images/profil.png"});
          });
          db.close();
       });
    })
    .post(function (req, res) {
        MongoClient.connect(url, function (err, db) {
           if (!err)
               console.log("Connected to mongo db, POST " + req.originalUrl);
            console.log(req.body.imgId);
           db.collection("users").update(
               {$or:[{ username : req.params.username }, {token : req.params.username}]},
               {$set : {profilPic : req.body.imgId}},
               function () {
                   res.end();
                   db.close();
               }
           )
        });
    });


router.route("/users/:username/coords")
    .post(function (req, res) {
        MongoClient.connect(url, function (err, db) {
           if (!err)
               console.log("Connected to mongo db, POST " + req.originalUrl);
            db.collection("users").update({$or:[{ username : req.params.username }, {token : req.params.username}]}, { $set: {coords : req.body.coords} }, {}, function (data) {
                db.close();
                res.end();
            });
        });
    });

router.route("/users/coords")
    .get(function (req, res) {
        MongoClient.connect(url, function (err, db) {
           if (!err)
               console.log("Connected to mongo db, GET " + req.originalUrl);
            db.collection("users").find({}, {coords: 1, username:1, gender: 1, informations: 1}).toArray(function (err, result) {
                res.json({users : result});
                db.close();
            });
        });
    });

router.route("/users/username")
    .post(function (req, res) {
       MongoClient.connect(url, function (err, db) {
           if (!err)
               console.log("Connected to mongo db, POST" + req.originalUrl);
           db.collection("users").findOne({username : req.body.newUsername}, function (err, result) {
              if (!result){
                db.collection("users").update({$or:[{ username : req.body.username }, {token : req.body.username}]}, {$set : {username : req.body.newUsername}}, function (err, resu) {
                    res.json({success : "Votre nouveau nom d'utilisateur est " + req.body.newUsername});
                    db.close();
                });
              }else {
                  res.json({error : "Nom d'utilisateur déjà utilisé."});
                  db.close();
              }
          });
       });
    });

router.route("/users/mail")
    .post(function (req, res) {
       MongoClient.connect(url, function (err, db) {
          if (!err)
              console.log("Connected to mongo db, POST" + req.originalUrl);
           db.collection("users").findOne({mail : req.body.newMail}, function (err, result) {
               if (!result){
                   db.collection("users").update({$or:[{ username : req.body.username }, {token : req.body.username}]}, {$set : {mail : req.body.newMail}}, function (err, resu) {
                       res.json({success : "Votre nouvelle adresse mail est " + req.body.newMail});
                       db.close();
                   });
               }else {
                   res.json({error : "Adresse mail déjà utilisée."});
                   db.close();
               }
           });
       });
    });

router.route("/password")
    .get(function (req, res) {
       MongoClient.connect(url, function (err, db) {
           if (!err)
               console.log("Connected to mongo db, GET" + req.originalUrl);
           console.log(req.query.mail);
          db.collection("users").findOne({mail : req.query.mail}, function (err, result) {
             if (!result){
                 res.json({error : "Adresse mail inconnue."});
             } else {
                 var url = 'http:localhost:3000/#/mot-de-passe/'+result.token;
                 var options = {
                     from : '"MatchA" <mot-de-passe@matcha.fr>',
                     to : req.query.mail,
                     subject: "Réinitialisez votre mot de passe",
                     html: "<h4>Bonjour !</h4><p>J’ai ouï dire que vous aviez oublié votre mot de passe !</p><a href="+url+">Cliquez ici pour le changer.</a><p>Si le lien ne fonctionne pas, allez sur "+url+"</p>"
                 };
                 transporter.sendMail(options,function(error, info){
                     if(error){
                         res.json({error : true});
                         db.close();
                         return console.log(error);
                     }
                     console.log('Message sent: ' + info.response);
                     res.json({success : "Vérifiez vos mails, on vous a envoyé de quoi changer de mot de passe."});
                     db.close();
                 });
             }
          });
       });
    })
    .put(function (req, res) {
        MongoClient.connect(url, function (err, db) {
            if (!err)
                console.log("Connected to mongo db, PUT" + req.originalUrl);
            // console.log(req.body);
            password = crypto.createHash("whirlpool").update(req.body.newPass).digest("hex");
            // console.log(password);
            db.collection("users").update({token: req.body.token}, {$set : {password:password}}, function (err, result) {
                console.log(result);
               if (!err){
                   res.json({success: true});
                   db.close();
               }
            });
        });
    });



app.use('/api', router);

function sendNotif(username, type, from) {
    var d = new Date();
    MongoClient.connect(url, function (err, db) {
        db.collection("users").update({username: username}, {$addToSet : {notifications : {type: type, from: from, date: d}}}, function (result) {
            io.emit("notification", {username : username, type: type, from: from, date: d});
            db.close();
        });
    });
}

io.on('connection', function(socket){
    console.log("Connected !");
    var room_;
    socket.on("room", function (room) {
        room_ = room;
       socket.join(room.roomId);
        console.log(room + " joined room : " +  room.roomId + " with : " + room.user);
        // console.log(room);
    });

    socket.on('chat message', function(msg){
        console.log('message: ' + msg.msg + " - roomId : " + msg.room + " - from : " + msg.user);
        // socket.broadcast.to(msg.room);
        // socket.broadcast.to(msg.room).emit('message', {msg:msg.msg});
        // io.in(msg.room).emit('message', {msg:msg.msg});
        io.in(msg.room).emit('message', {msg: msg.msg, user: msg.user, room:msg.room});
        MongoClient.connect(url, function (err, db) {
                // if(!err)
            // console.log("Connected to mongo db, POST" + req.originalUrl);
                db.collection("messages").insert({roomId : msg.room, msg: msg.msg, user: msg.user}, function (err, result) {
                    db.collection("users").findOne({username: msg.user}, function (er, user) {
                       user.rooms.forEach(function (e) {
                          if (e.roomId == msg.room){
                              sendNotif(e.user, "Message : " +
                                  (msg.msg.length > 6 ? msg.msg.substring(0, 6) + "..." : msg.msg)
                                  , msg.user);
                          }// console.log(e.user);
                       });
                       // console.log(user.rooms);
                    // sendNotif();
                    });
                    db.close();
                    // TODO Peut etre mettre l'insert directement dans la partie socket io
                });
        });
    });

});

router.route("/message/:room")
    .get(function (req, res) {
       MongoClient.connect(url, function (err, db) {
           if(!err)
               console.log("Connected to mongo db, GET" + req.originalUrl);
          db.collection("messages").find({roomId:req.params.room}).toArray(function (er, result) {
              res.json(result);
              db.close();
          })
       });
    })
    .post(function (req, res) {
        MongoClient.connect(url, function (err, db) {
            if(!err)
                // console.log("Connected to mongo db, POST" + req.originalUrl);
            db.collection("messages").insert({room : req.body.room, message: req.body.message, pseudo: req.body.pseudo}, function (err, result) {
                db.close();
                res.end();
                // TODO Peut etre mettre l'insert directement dans la partie socket io
            })
        })
    });

router.route("/createRoom")
    .post(function (req, res) {
        var roomAllreadyHere = false;
        var id = uniqId();
        var users = [];
        users.push(req.body.u1);
        users.push(req.body.u2);
        MongoClient.connect(url, function (err, db) {
           if (!err)
               console.log("Connected to mongo db, POST" + req.originalUrl);
           db.collection("users").findOne({username : req.body.u1}, function (err, result) {
                if (result.rooms){
                    result.rooms.forEach(function (e) {
                       if (e.user == req.body.u2){
                           console.log('in that shit');
                           roomAllreadyHere = true;
                       }
                    });
                }
                console.log("roomAllreadyHere : " + roomAllreadyHere);
                if (!roomAllreadyHere){
                    users.forEach(function (e) {
                        var user;
                        users.forEach(function (el) {
                           if (el != e)
                               user = el;
                        });
                        db.collection("users").update({username: e},{$push: {rooms : {roomId : id, user: user}}},function (err, result) {
                        });
                    });
                }
                res.end();
                db.close();
           });
        });
    });
router.route("/room/:user1/:user2")
    .get(function (req, res) {
       MongoClient.connect(url, function (err, db) {
           if (!err)
               console.log("Connected to mongo db, GET" + req.originalUrl);
           var roomId = null;
           db.collection("users").findOne({$or:[{ username : req.params.user1 }, {token : req.params.user1}]}, function (er, result) {
               if (result.rooms){
                   result.rooms.forEach(function (e) {
                      // console.log(e);
                       if (e.user == req.params.user2){
                           roomId = e.roomId;
                       }
                   });
               }
               if (roomId != null)
                   res.json({roomId : roomId});
               else
                   res.end();
               db.close();
           })
       })
    });

function compareRoomAccepted(user, rooms) {
    var ret = false;
    rooms.forEach(function (e) {
        if (user == e.user)
            ret = true;
    });
    console.log(user, ret);
    return ret;
}
router.route("/rooms/:username").get(function (req, res) {
    // TODO CHAT
   /* On va chercher a récuperer toutes les room d'un utilisateur, on cherche toutes celles qui existent,
   et si il en manque par rapport à accepted[], on les créer ! */
   MongoClient.connect(url, function (err, db) {
       if ( !err )
           console.log("Connected to mongo db, GET " + req.originalUrl);
       db.collection("users").findOne({$or:[{token:req.params.username},{username:req.params.username}]}, function (er, user) {
           if (user) {
               if (!user.rooms && !user.accepted) {
                   console.log("No rooms and no accepted");
                   res.json({rooms: "empty"});
                   db.close();
               }
               else if (!user.rooms && user.accepted) {  // Si l'array rooms n'est pas présent bah on le créé
                   console.log("No rooms found !");
                   var rooms = [];
                   user.accepted.forEach(function (e, i) {
                       var id = uniqId();
                       console.log(e);
                       // on update d'abord celui qui fait la requete
                       db.collection("users").update({username: user.username}, {
                           $addToSet: {
                               rooms: {
                                   user: e,
                                   roomId: id
                               }
                           }
                       }, function (er, result) {
                           rooms.push({user: e, roomId: id});
                           // et la on update l'autre
                           // console.log(user.username);
                           db.collection("users").update({username: e}, {
                               $addToSet: {
                                   rooms: {
                                       user: user.username,
                                       roomId: id
                                   }
                               }
                           }, function (errr, ress) {
                               if (i == user.accepted.length - 1)
                                   res.json({rooms: rooms});
                           });
                           /*db.collection("users").findOne({username:e}, function (ee, rr) {
                            console.log(rr);
                            console.log(ee);
                            });*/
                       });
                   });


                   // db.close();
               }
               else if (user.rooms.length < user.accepted.length) {
                   var missingRooms = [];
                   var rooms = user.rooms;
                   user.accepted.forEach(function (e) {
                       console.log(e);
                       if (!compareRoomAccepted(e, user.rooms))
                           missingRooms.push(e);
                   });

                   // la on va creer les rooms qui mangquent !

                   missingRooms.forEach(function (e, i) {
                       var id = uniqId();
                       // on update d'abord celui qui fait la requete
                       db.collection("users").update({username: user.username}, {
                           $addToSet: {
                               rooms: {
                                   user: e,
                                   roomId: id
                               }
                           }
                       }, function (er, result) {
                           rooms.push({user: e, roomId: id});
                           // et la on update l'autre
                           db.collection("users").update({username: e}, {
                               $addToSet: {
                                   rooms: {
                                       user: user.username,
                                       roomId: id
                                   }
                               }
                           }, function (errr, ress) {
                               if (i == missingRooms.length - 1)
                                   res.json({rooms: rooms});
                           });
                       });
                   });
                   // db.close();

               } else {
                   // on renvoi l'array rooms [];
                   res.json({rooms: user.rooms});
               }
           }
       });
   });
    // res.end();
});

function checkAge(searchMin, searchMax, targetAge) {
    return searchMin <= targetAge && targetAge <= searchMax;
}

function checkTag(userTags, targetTags) {
    var i = 0;
    userTags.forEach(function (u) {
        if (targetTags.indexOf(u) != -1)
            i++;
    });

    return i >= userTags.length/2;   // true si dans target tags on trouve plus de la moitié des tags de user
}

function toRadians(x) {
    return x * (Math.PI/180);
}

function distance(lat1, lon1, lat2, lon2) {



    var R = 6371e3; // metres
    var φ1 = toRadians(lat1);
    var φ2 = toRadians(lat2);
    var Δφ = toRadians(lat2-lat1);
    var Δλ = toRadians(lon2-lon1);

    var a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ/2) * Math.sin(Δλ/2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    var d = R * c;

    return d / 10e2 <= 100;
    // return d;
}

function checkPop(min, max, user, popArray) {
    var score = null;
    popArray.forEach(function (e) {
        if (e.username == user) {
            score = e.score;
        }
    });
    return [min <= score && score <= max, score];
}

router.route("/search")
    .post(function (req, res) {
        var search = req.body.search;
        var retUsers = [];
        var user;
        getPopularity().then(function (popularity) {
            console.log(popularity);
           MongoClient.connect(url, function (err, db) {
               if (!err)
                   console.log("Connected to mongo db, POST" + req.originalUrl);
               db.collection("users").findOne({$or:[{ username : req.body.token }, {token : req.body.token }]}, function (er, result) {
                   user = result;
               });
               db.collection("users").find().toArray(function (er, result) {
                   console.log(req.body.search);
                   result.forEach(function (e) {
                       var pop = checkPop(search.popMin, search.popMax, e.username, popularity);
                        if (user.informations.interest.indexOf(e.informations.gender) != -1 &&
                            e.informations.interest.indexOf(user.informations.gender) != -1 &&
                            checkAge(search.ageMin, search.ageMax, e.informations.age) &&
                            checkTag(search.tags, e.tags) &&
                            pop[0] == true &&
                            distance(user.coords.lat, user.coords.long, e.coords.lat, e.coords.long) &&
                            e.username != user.username){
                            e.popScore = pop[1];
                            retUsers.push(e);
                        }
                        // console.log(pop);
                       console.log(e.username + " : " + user.informations.interest.indexOf(e.informations.gender) + "  -  " +
                           e.informations.interest.indexOf(user.informations.gender) + "  -  " +
                           checkAge(search.ageMin, search.ageMax, e.informations.age) + "  -  " +
                           checkTag(search.tags, e.tags) + "  -  " +
                           pop + "  -  " +
                           distance(user.coords.lat, user.coords.long, e.coords.lat, e.coords.long));
                   });
                   res.json(retUsers);
                   db.close();
               });
           });
        })

    });


router.route("/users/:username/likeRequest")
    .get(function (req, res) {
        MongoClient.connect(url, function (err, db) {
            if (!err)
                console.log("Connected to mongo db, GET" + req.originalUrl);
            db.collection("users").findOne({username : req.params.username} , {askedFrom : 1, askingTo: 1}, function (er, result) {
                res.json(result);
                db.close();
            });
        });
    })
    .post(function (req, res) {
        MongoClient.connect(url, function (err, db) {
           if (!err)
               console.log("Connected to mongo db, POST" + req.originalUrl);
           db.collection("users").update({username : req.params.username},{ $addToSet : {askingTo : req.body.askTo}}).then(function (re) {
               db.collection("users").update({username : req.body.askTo},{ $addToSet: {askedFrom : req.params.username}}).then(function (re) {
                    res.end();
                    db.close();
                   sendNotif(req.body.askTo, "Invitation", req.params.username);
                   // io.on("connection", function (socket) {
                   //    io.emit("notification", {username : req.body.askTo, type: "Invitation", from: req.params.username});
                   // });
              });
           });
        });
    });

router.route("/users/:username/notifs")
    .get(function (req, res) {
        console.log(req.params.username);
        MongoClient.connect(url, function (err, db) {
            if (!err)
                console.log("Connected to mongo db, GET" + req.originalUrl);
            db.collection("users").findOne({$or : [{token : req.params.username}, {username: req.params.username}]} , {notifications: 1}, function (er, result) {
                if (result && "notifications" in result) {
                    result.notifications.forEach(function (e) {
                        // console.log(e);
                        if ((x = result.notifications.indexOf(e)) != -1) {
                            result.notifications.splice(x, 1);
                        }
                    });
                    res.json(result.notifications);
                    db.close();
                }
                else {
                    res.end();
                    db.close();
                }
            });
        });
    });

router.route("/users/:username/accept/:target")  // Qwerty1 - Azerty1
    .get(function (req, res) {
       MongoClient.connect(url, function (err, db) {
           if (!err)
               console.log("Connected to mongo db, GET" + req.originalUrl);
           db.collection("users").findOne({$or : [{token : req.params.username}, {username:req.params.username}]}, {askedFrom: req.params.target}, function (er, resu) {
               if (resu) {
                   /// TODO ajouter le pourcentage !

                   db.collection("users").update({$or: [{token: req.params.username}, {username: req.params.username}]}, {
                       $addToSet : {accepted : req.params.target},
                       $pull: {askedFrom : req.params.target}
                   }, function (e) {
                       db.collection("users").update({$or: [{token: req.params.target}, {username: req.params.target}]}, {
                           $addToSet : {accepted : req.params.username},
                           $pull: {askingTo : req.params.username}},function (r) {
                          db.close();
                           res.end();
                       });
                   });
               }
               else {
                   res.end();
                   db.close();
               }
           })
       });
    });

router.route("/users/:username/delNotif")
    .post(function (req, res) {
       MongoClient.connect(url, function (err, db) {
           if (!err)
               console.log("Connected to mongo db, POST " + req.originalUrl);
           console.log(new Date(req.body.date));
          db.collection("users").update({$or: [{token: req.params.username}, {username: req.params.username}]},
              { $pull : {notifications: { from : req.body.from , date : new Date(req.body.date)}}}, function (result) {
                 res.end();
                  db.close();
              });
       });
    });

router.route("/users/:username/state/:target").get(function (req,res) {
        // console.log(req.params);
        MongoClient.connect(url, function (err, db) {
            if (!err)
                console.log("Connected to mongo db, GET " + req.originalUrl);
            db.collection("users").findOne({ $or:
                                                [
                                                    { username : req.params.username }
                                                    , { token : req.params.username }
                                                ]
                                            }, function (er, result) {
                if ('askingTo' in result){
                    if (result['askingTo'].indexOf(req.params.target) != -1)
                        res.json({state: "liked"});
                    else if ("accepted" in result && result['accepted'].indexOf(req.params.target) != -1)
                        res.json({state: 'liked'});
                    else
                        res.json({state: 'none'});
                }
                else
                    res.json({state: 'none'});
                db.close();
            });
        });
    });

router.route("/users/save").post(function (req, res) {
   MongoClient.connect(url, function (err, db) {
       if (!err)
           console.log("Connected to mongo db, POST " + req.originalUrl);
       db.collection('users').findOne({token: req.body.token}, {username:1}, function (er, result) {

           db.collection("users").update({username: req.body.username}, {$addToSet:{visited:result.username}}, function (resu) {
               db.close();
               res.end();
           })
       });

   });
});

router.route("/users/asked/:username")
    .get(function (req, res) {
       MongoClient.connect(url, function (err, db) {
           if (!err)
               console.log("Connected to mongo db, GET " + req.originalUrl);
           db.collection('users').findOne({$or : [{token : req.params.username}, {username:req.params.username}]}, function (er, result) {
               console.log  (result);
               if (result && "askedFrom" in result){
                   res.json(result.askedFrom);
               }
               else
                   res.json({error: true});
               db.close();
           })
       })
    });

router.route("/users/history/:username")
    .get(function (req, res) {
        MongoClient.connect(url, function (err, db) {
            if (!err)
                console.log("Connected to mongo db, GET " + req.originalUrl);
            db.collection("users").findOne({$or : [{token : req.params.username}, {username: req.params.username}]}, function (er, result) {
                if (result && "visited" in result){
                    res.json({history : result.visited});
                } else
                    res.end();
                db.close();
            })
        });
    });


router.route("/users/propose/:username/:type")
    .get(function (req, res) {
        MongoClient.connect(url, function (err, db) {
            if (!err)
                console.log("Connected to mongo db, GET " + req.originalUrl);
            if (req.params.type == "random") {
                var array, ret = [];
                db.collection("users").find({}).toArray(function (er, result) {
                    array = shuffle(result);
                    array.forEach(function (e) {
                        if (ret.length <= 8 && e.username != req.params.username){
                            ret.push(e);
                        }
                    });
                    res.json({random: ret});
                    db.close();
                });
            } else if (req.params.type == "classic"){
                var retUsers = [];
                var user;
                getPopularity().then(function (popularity) {
                    db.collection("users").findOne({$or:[{ username : req.params.username }, {token : req.params.username }]}, function (er, result) {
                        user = result;
                        MongoClient.connect(url, function(error, db2){
                            // console.log(user);
                            db2.collection("users").find().toArray(function (er, result) {
                                result.forEach(function (e) {
                                    var pop = checkPop(50, 100, e.username, popularity);
                                    if (user.informations.interest.indexOf(e.informations.gender) != -1 &&
                                        e.informations.interest.indexOf(user.informations.gender) != -1 &&
                                        checkAge(e.informations.age - 5, e.informations.age + 5, e.informations.age) &&
                                        checkTag(user.tags, e.tags) &&
                                        pop[0] == true &&
                                        distance(user.coords.lat, user.coords.long, e.coords.lat, e.coords.long) &&
                                        e.username != user.username && retUsers.length <= 8) {
                                        e.popScore = pop[1];
                                        retUsers.push(e);
                                    }
                                });
                                res.json({classic: retUsers});
                                db2.close();
                            });
                        });
                        db.close();
                    });
                });
            }else {
                res.end();
                db.close();
            }
        });
    });


router.route("/users/:username/pop")
    .get(function (req, res) {
        getPopularity().then((result) => {
            result.forEach(function (e) {
                if (e.username == req.params.username){
                    res.json({score: e.score});
                    return ;
                }
            });
        });
    });

app.get('*',function (req, res) {
    res.redirect('/');
});

server.listen(3000, function() {
    console.log("Listening on 3000");
});


// TODO  L'utilisateur doit pouvoir consulter les personnes ayant consulté son profil (il doit donc y avoir un historique des visites du profil), ainsi que les personnes qui l'ont "liké".
// TODO  Chaque utilisateur doit avoir un score de popularité. Demandez à l'étudiant d'expliquer sa stratégie pour calculer ce score, elle doit être cohérente et un minima pertinente.
