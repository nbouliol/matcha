    var app = angular.module('matcha', ['ui.router', 'ngCookies', 'ui.bootstrap', 'ngTagsInput', 'ngFileUpload', 'geolocation', 'gservice','rzModule']);

app.config(function ($stateProvider, $urlRouterProvider) {
    $stateProvider
        .state('main',{
            abstract: true,
            url: "",
            views:{
                "header":{
                    templateUrl: "views/header.html",
                    controller: "HeaderCtrl"
                },
                "" : {
                    templateUrl: "views/main.html"
                },
                "footer": {
                    templateUrl: "views/footer.html",
                    controller: "FooterCtrl"
                }
            }
        })
        .state('main.home',{
            url: '/',
            templateUrl: 'views/home.html',
            controller: "HomeCtrl",
            /*onEnter: function($state, $cookies, $http){
                var token = $cookies.get("token");
                if (!token)
                    return false;
                $http.post("/api/token", {token: token}).then(function s(r) {
                    if (r.data.success)
                        $state.go('main.profil');
                });
            }*/
            onEnter: ["$state", "abc", function ($state, abc) {
                if (abc.getToken()) {
                    abc.checkToken().then(function (r) {
                        //console.log(r);
                        if (r == "ok")
                            $state.go("main.profil");
                    });
                }
            }]
        })
        .state('main.profil',{
            url: '/profil',
            templateUrl: 'views/profil.html',
            controller: "ProfilCtrl",
            onEnter: ["$state", "abc", "$cookies", function ($state, abc, $cookies) {
                if (abc.getToken()) {
                    abc.checkToken().then(function (r) {
                        // console.log(r);
                        if (r == false)
                            $state.go($state.current, {}, {reload: true});
                        else if (r == "bad") {
                            $cookies.remove("token");
                            $cookies.remove("username");
                            $state.go("main.home");
                        }
                    });
                }else {
                    $state.go($state.current, {}, {reload: true});
                }
            }]
        })
        .state("main.otherprofil", {
            url : "/profil/:username",
            templateUrl : "views/otherprofil.html",
            controller : "OtherProfilCtrl",
            onEnter: ["$state", "abc","$stateParams","$http","$rootScope","$cookies", function ($state, abc,$stateParams,$http,$rootScope,$cookies) {
                var realUser = false;
                $rootScope.users.forEach(function (u)
                {
                    if (u == $stateParams.username)
                        realUser = true;
                });
                if (!realUser)
                    $state.go($state.current, {}, {reload: true});
                if (abc.getToken()) {
                    abc.checkToken().then(function (r) {
                        // console.log(r);
                        if (r == false)
                            $state.go($state.current, {}, {reload: true});
                        else if (r == "bad") {
                            $cookies.remove("token");
                            $cookies.remove("username");
                            $state.go("main.home");
                        }

                        /*var realUser = false;
                        console.log("before loop");
                        for (u in $rootScope.users){
                            if (u == $stateParams.username)
                                realUser = true;
                        }
                        console.log("before if");
                        if (!realUser)
                            $state.go("main.profil");*/
                    });
                }else {
                    $state.go($state.current, {}, {reload: true});
                }
            }]
        })
        .state("main.password", {
            url : "/mot-de-passe/:mail",
            templateUrl : "views/password.html",
            controller: "PasswordCtrl"
        })
        .state("main.chat", {
            url: "/chat",
            templateUrl : "views/chat.html",
            controller: "ChatCtrl",
            onEnter: ["$state", "abc","$cookies", function ($state, abc,$cookies) {
                if (abc.getToken()) {
                    abc.checkToken().then(function (r) {
                        //console.log(r);
                        if (r == false)
                            $state.go($state.current, {}, {reload: true});
                        else if (r == "bad") {
                            $cookies.remove("token");
                            $cookies.remove("username");
                            $state.go("main.home");
                        }
                    });
                }else {
                    $state.go($state.current, {}, {reload: true});
                }
            }]
        })
        .state("main.search", {
            url: "/recherche",
            templateUrl : "views/search.html",
            controller: "SearchCtrl",
            onEnter: ["$state", "abc","$cookies", function ($state, abc,$cookies) {
                if (abc.getToken()) {
                    abc.checkToken().then(function (r) {
                        //console.log(r);
                        if (r == false)
                            $state.go($state.current, {}, {reload: true});
                        else if (r == "bad") {
                            $cookies.remove("token");
                            $cookies.remove("username");
                            $state.go("main.home");
                        }
                    });
                }else {
                    $state.go($state.current, {}, {reload: true});
                }
            }]
        })
        .state("main.validation", {
            url: "/demandes",
            templateUrl : "views/validation.html",
            controller: "ValidationCtrl",
            onEnter: ["$state", "abc","$cookies", function ($state, abc,$cookies) {
                if (abc.getToken()) {
                    abc.checkToken().then(function (r) {
                        //console.log(r);
                        if (r == false)
                            $state.go($state.current, {}, {reload: true});
                        else if (r == "bad") {
                            $cookies.remove("token");
                            $cookies.remove("username");
                            $state.go("main.home");
                        }
                    });
                }else {
                    $state.go($state.current, {}, {reload: true});
                }
            }]
        })
        /*.state('main.map',{
            url: '/map',
            templateUrl : 'views/map.html',
            controller: "MapCtrl"
        })*/;
    $urlRouterProvider.otherwise("/");
});

app.run( function($rootScope, $location,$http) {
    $rootScope.$watch(function() {
            return $location.path();
        },
        function(a){
            // console.log('url has changed: ' + a);
            $http.get("/api/users/name").then(function(res){
                // console.log(res);
                $rootScope.users =  res.data.users;
                // console.log($rootScope.users);
            });
        });
});

app.factory('abc', function ($http, $cookies, $q) {
    var t = {};

    t.getToken = function () {
        return $cookies.get("token");
    };

    t.checkToken = function () {
        var token = t.getToken();

        //// console.log(token);
        var deferred = $q.defer();
        $http.post("/api/token", {token: token}).then(function (suc) {
            //// console.log(suc.data.success);
            deferred.resolve(suc.data.success);
        }, function (err) {
            deferred.reject(err);
        });

        return deferred.promise;
    };

   return t;
});

app.controller("HomeCtrl", function ($scope, $http, $state,$cookies) {
    $scope.connection = {};
    $scope.fill = function () {
        $scope.connection.mail = "Qwerty1@test.test";
        $scope.connection.password = "Qwerty1";
    };
    $scope.connect = function(){
        //// console.log($scope.connection);
        $http.post("/api/connect", $scope.connection).then(
            function success(res){
                //console.log(res.data);
                if (res.data.success){
                    //console.log("on se connecte ma gueule !");
                    //console.log(res.data);
                    $cookies.put('token', res.data.success);
                    $cookies.put('username', res.data.username);
                    $state.go("main.profil");
                    $scope.fail = false;
                }
                else {
                    $scope.fail = true;
                    //console.log($scope.fail);
                }
            }, function fail(res){
                //console.log(res);
            }
        )
    };


    $scope.inscription = {};
    $scope.successInscri = false;
    $scope.inscri = function(){

        $scope.inscription.password = $scope.inscription.password1;

        delete $scope.inscription.password1;
        delete $scope.inscription.password2;

        //$scope.inscription.splice($scope.inscription.indexOf("password2"), 1);

        $http.post("/api/users", $scope.inscription).then(
            function success(result) {
                //console.log(result);
                if (result.data.success) {
                    $scope.failInscri = false;
                    $scope.successInscri = true;
                    //console.log("on est inscrit pd !");
                    $scope.inscription = null;
                    $scope.inscriForm = {};
                    $("#connMail").focus();
                }else {
                    $scope.failInscri = true;
                    //console.log("Fail pd !");
                }
            }, function fail(result){  });
        //// console.log($scope.inscription);
    };

    $scope.pwdMail = function () {
      $http.get("/api/password?mail="+$scope.mailToRecover).then(function (res) {
         $scope.Pw = res.data.success;
          $scope.ePw = res.data.error;
      });
    };
});

app.controller("ProfilCtrl", function ($scope, $http, $cookies, Upload, gservice, $state) {
        var imageUrl = "/api/users/"+$cookies.get('token')+"/images";
    $scope.getImages = function () {
        //// console.log("get images");
        $http.get(imageUrl).then(function (re) {
            //// console.log("get images");
            //// console.log(re);
            $scope.images = re.data.images ? re.data.images : [];
        });
    };
    $scope.getImages();


    var profilPicUrl = "/api/users/"+$cookies.get("token")+"/profilPic";
    $scope.getProfilPic = function () {
        $http.get(profilPicUrl).then(function (result) {
            $scope.profilPic = result.data.profilPic;
        });
    };
    $scope.getProfilPic();
    // $scope.testtags = {};
    var url = "/api/users/"+$cookies.get("token")+"/profil";
    var TagsUrl = "/api/users/" + $cookies.get('token') + "/tags";

    $scope.infos = {};
    $http.get(url).then(function (res) {
        $scope.infos = res.data;
        $scope.firstname = $scope.infos.first_name;
        $scope.lastname = $scope.infos.last_name;
        //console.log($scope.infos);
    });



    $scope.save = function (){
        //console.log($scope.infos);
        // var url = "/api/users/"+$cookies.get("username")+"/profil";
        $scope.success = false;
        $http.post(url, $scope.infos).then(function (data) {
            $scope.success =  true;
        });
    };

    $http.get(TagsUrl).then(function (rp) {
        // console.log("tags");
        // console.log(rp);
        // if (Array.isArray(rp.data.tags)) {
            $scope.userTags = rp.data.tags;
        // }
    });


    $scope.goSearch = function () {
        if (!$scope.infos.gender || !$scope.userTags ){
            $scope.tab = "settings";
        }else
            $state.go("main.search");
    };

    $scope.tab = "home";
    $scope.changeTab = function (x) {
        if ($scope.tab != x) {
            $scope.tab = x;
        }
    };

    $scope.removeTag = function (x) {
        //// console.log("Remove tag : " + x.text);
        $http.delete(TagsUrl,{params: {tag: x.text}}).then(function (data) {
            $scope.userTags = data.data.tags;
        });
    };

    $scope.getTags = function(val) {
        //// console.log(val);
        return $http.get('/api/tags', {params: { query : val}}).then(function(response){
            //// console.log(response.data);
            if (response.data.tags)
                return response.data.tags;
            return [null];
        });
    };
    $scope.addTag = function (tag) {
      //console.log("Tag added :" + tag.text);
      $http.post(TagsUrl, {tags : tag.text}).then(function (rp) {
          //// console.log(rp.data.tags);
          $http.post("/api/tags", {tag: tag.text}).then(function (rp) {
              //// console.log(rp.data.tags);
          });
      });
    };

    $scope.upload = function (file) {
        Upload.upload({
            url: imageUrl,
            method: 'POST',
            data: {file: file},
            files: file
        }).then(function (resp) {
            //console.log( resp.data);
            // $scope.images = resp.data.images;
            $scope.getImages();
        }, function (resp) {
            //console.log('Error status: ' + resp.status);
        }, function (evt) {
            var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
            //// console.log('progress: ' + progressPercentage + '% ' + evt.config.data.file.name);
        });
    };

    $scope.test = function () {
      //console.log(imageUrl);
    };


    $scope.removeImage = function (image) {
        $http.delete(imageUrl, {params: {image: image.id}}).then(function (res) {
            $scope.delError = res.data.error;
        });
        $scope.getImages();
    };

    $scope.setAsProfilePic = function (image) {
        $http.post(profilPicUrl, {imgId: image.id});
        $scope.getProfilPic();
    };

    gservice.addToMap();
    gservice.initialize();


    $scope.changeUsername = function () {
        $http.post("/api/users/username", {username: $cookies.get("token"), newUsername: $scope.newUsername}).then(function (data) {
           $scope.chU = data.data.success;
           $scope.echU = data.data.error;
            //// console.log($scope.chU, $scope.echU);
        });
    };

    $scope.changeMail = function () {
        $http.post("/api/users/mail", {username: $cookies.get("token"), newMail: $scope.newMail}).then(function (data) {
            $scope.chM = data.data.success;
            $scope.echM = data.data.error;
        });
    };
    $scope.notifications = [];
    $scope.username = $cookies.get("username");
    $http.get("/api/users/" + $scope.username + "/notifs").then(function (data) {
        $scope.notifications = data.data;
    });
    // sockets.connect();
    /*var socket = io.connect('http://localhost:3000');
    socket.on("notification", function (data) {
       //// console.log(data.username);
       ////  console.log($scope.username);
        if (data.username == $scope.username){
            $scope.notifications.push(data);
            $scope.$apply();
        }
    });

    $scope.accept = function (username, target) {
        $http.get("/api/users/" + username + "/accept/" + target).then(function (d) {

        });
    };
    $scope.delNotif = function (e) {
        //console.log(e);
        $http.post("/api/users/" + $scope.username + "/delNotif", e).then(function (data) {
            $scope.notifications.splice($scope.notifications.indexOf(e), 1);
        });
    }*/
});

app.controller("OtherProfilCtrl", function ($scope, $http, $cookies, $stateParams) {
    $scope.username = $stateParams.username;
    /*$http.get("/api/users/name").then(function(res){
        console.log(res);
        if (res.data.users){
            var realUser = false;
            res.data.users.forEach(function (e) {
                if (e == $stateParams.username)
                    realUser = true;
            });
            console.log("go if " + realUser);
            if (!realUser)
                $state.go($state.current, {}, {reload: true});
        }
    });*/
    // console.log("OtherProfilCtrl");

    $http.post("/api/users/save", {username: $scope.username, token: $cookies.get('token')});


    $http.get("/api/users/"+$scope.username+"/pop").then(function (res) {
        $scope.score = res.data.score;
    });
    
    $http.get("/api/users/generic/"+$scope.username+"/lastConnection").then(function (res) {
        if (res.data.value)
            $scope.lastConnection = res.data.value;
        else
            $scope.lastConnection = new Date ("28 october 1991");
    });

    $scope.tab = "home";
    $scope.changeTab = function (x) {
        if ($scope.tab != x) {
            $scope.tab = x;
        }
    };
    var TagsUrl = "/api/users/" + $stateParams.username + "/tags";
    $http.get(TagsUrl).then(function (rp) {
        $scope.userTags = rp.data.tags;
    });
    var profilPicUrl = "/api/users/"+ $stateParams.username +"/profilPic";
    $scope.getProfilPic = function () {
        $http.get(profilPicUrl).then(function (result) {
            $scope.profilPic = result.data.profilPic;
        });
    };
    $scope.getProfilPic();
    var imageUrl = "/api/users/"+ $stateParams.username +"/images";
    $scope.getImages = function () {
        //console.log("get images");
        $http.get(imageUrl).then(function (re) {
            $scope.images = re.data.images ? re.data.images : [];
        });
    };
    $scope.getImages();
    var url = "/api/users/"+$stateParams.username+"/profil";

    $http.get(url).then(function (res) {
        $scope.infos = res.data;
        $scope.firstname = $scope.infos.first_name;
        $scope.lastname = $scope.infos.last_name;
    });
    $http.get("/api/users/"+$cookies.get("token")+"/state/"+$scope.username).then(function (res) {
        if (res.data.state == 'liked')
            $scope.state = "liked";
    });

    $scope.like = function () {
        $http.post("/api/users/"  + $cookies.get("username") + "/likeRequest", {askTo : $stateParams.username});
    };
});

app.controller("PasswordCtrl", function ($scope, $http, $stateParams, $state) {
    $scope.pwdMail = function () {
        //console.log("new pass : " + $scope.password1 + $stateParams.mail);
        $http.put("/api/password", {newPass : $scope.password1, token:$stateParams.mail}).then(function (res) {
           if (res.data.success)
               $state.go('main.home');
        });
    };
});

app.controller("ChatCtrl", function ($scope, $http, $cookies,$state) {
    var socket = io.connect('http://localhost:3000');
    $scope.messages = [];
    $scope.noroom = false;

    $scope.chat = null;
    $scope.loadMessages = function (user) {
        //console.log(user);
        // $scope.chat = user;
        $http.get("/api/message/"+user.roomId).then(function (res) {
           $scope.messages = res.data;
            //console.log(res.data);
        });
        $scope.room = user.roomId;
        $scope.activeMenu = user;
        $("#autoscroll").scrollView();
    };

    $.fn.scrollView = function () {
        return this.each(function () {
            $('#autoscroll').animate({
                scrollTop: $(this).offset().top + $(this).prop('scrollHeight')
            }, 1000);
        });
    };


    $scope.username = $cookies.get('username');
    $scope.rooms = [];
    $http.get("/api/rooms/"+$cookies.get('token')).then(function (res) {
        if (res.data.rooms != "empty") {
            $scope.rooms = res.data.rooms;
            //console.log($scope.rooms);
            $scope.rooms.forEach(function (e) {
                socket.emit("room", e);
            });
        }
        else {
            $scope.noroom = true;
            alert("Aucun chat disponible !  (╯︵╰,)");
            $state.go('main.profil');
        }
    });

    socket.on('connect', function(data) {
        // socket.emit("room", $scope.room);
    });

    socket.on("message", function (data) {
        //console.log(data);
        if (data.room == $scope.room){
            $scope.messages.push(data);
            $scope.$apply();
            $("#autoscroll").scrollView();
        }
    });

    $scope.send = function(){

        socket.emit('chat message', {room : $scope.room, msg: $scope.msg, user:$cookies.get('username')});

        $scope.msg = null;

    };

    $('textarea').keypress(function(event) {

        if (event.keyCode == 13) {
            // event.preventDefault();
            $scope.send();
        }
    });

});

app.controller("SearchCtrl", function ($scope, $cookies, $http) {
    console.log($scope.searchedUsers);
    $scope.search = {};
    $scope.minRangeSlider = {
        minValue: 22,
        maxValue: 30,
        options: {
            floor: 18,
            ceil: 50,
            step: 1
        }
    };
    $scope.pop = {
        minValue: 25,
        maxValue: 75,
        options: {
            floor: 0,
            ceil: 100,
            step: 1
        }
    };
    $scope.searchIt = function () {
        tags = $scope.search.tags;
        var sArray = { tags : [] };
        sArray.ageMax = $scope.minRangeSlider.maxValue ;
        sArray.ageMin = $scope.minRangeSlider.minValue;
        sArray.interest = $scope.search.interest;
        sArray.popMin = $scope.pop.minValue ;
        sArray.popMax = $scope.pop.maxValue ;

        tags.forEach(function (e) {
            sArray.tags.push(e.text);
        });
        //console.log(sArray);
        $scope.searchedUsers = [];
        $http.post("/api/search", {token : $cookies.get("token"), search: sArray}).then(function (res) {
           console.log(res);
            res.data.forEach(function (e) {
                $http.get("/api/users/" + e.username + "/profilPic").then(function (ret) {
                   $scope.searchedUsers.push({img : ret.data.profilPic, user: e.username, score: e.popScore});
                    //console.log($scope.users);
                });
            });
        });
    };
    $scope.propose = [];
    $scope.randoms = function () {
        $scope.class = false;
        //console.log("random");
        $http.get("/api/users/propose/"+$cookies.get("username")+"/random").then(function (res) {
            $scope.usersProp = [];
            res.data.random.forEach(function (e) {
                $http.get("/api/users/" + e.username + "/profilPic").then(function (ret) {
                    $scope.usersProp.push({img : ret.data.profilPic, user: e.username});
                    //console.log($scope.usersProp);
                });
            });
        })
    };
    $scope.classics = function () {
        //console.log("cassic");
        $scope.class = true;
        $http.get("/api/users/propose/"+$cookies.get("token")+"/classic").then(function (res) {
            $scope.usersProp = [];
            //console.log(res);
            res.data.classic.forEach(function (e) {
                $http.get("/api/users/" + e.username + "/profilPic").then(function (ret) {
                    $scope.usersProp.push({img : ret.data.profilPic, user: e.username, score: e.popScore});
                    //console.log($scope.usersProp);
                });
            });
        })

    };
});

app.controller("ValidationCtrl", function ($scope, $http, $cookies) {
    $scope.users = [];
    $scope.history = [];
    $http.get("/api/users/asked/"+$cookies.get('token')).then(function (result) {
        //console.log(result);
        if (!result.data.error) {
            result.data.forEach(function (e) {
                $http.get("/api/users/" + e + "/profilPic").then(function (ret) {
                    $scope.users.push({img: ret.data.profilPic, user: e});
                    //// console.log($scope.users);
                });
            });
        }
    });
    $scope.accept = function (e) {
        //// console.log(e);
        $http.get("/api/users/"+$cookies.get('username')+"/accept/"+ e.user).then(function (res) {
            $scope.users.splice($scope.users.indexOf(e));
        });
    };
    $http.get("/api/users/history/"+$cookies.get('token')).then(function (result) {
        if (result.data.history) {
            result.data.history.forEach(function (e) {
                if (e != $cookies.get('username')) {
                    $http.get("/api/users/" + e + "/profilPic").then(function (ret) {
                        $scope.history.push({img: ret.data.profilPic, user: e});
                    });
                }
            });
        }
    });
    $scope.report = false;
});

app.controller("MapCtrl", function ($scope, geolocation, gservice, $http) {
    gservice.initialize();
});

app.controller("FooterCtrl", function ($scope) {
    var pool = ["Tu veux rencontrer des filles chaudes de ta region ? Va sur MatchÀ et fais toi plaisir !", "Tu en as marre des rencontres banales et sans intérêts ? Va sur MatchÀ, c'est là que ça se passe !", "Adopt' et Tinder ?! Pfff même Tom Cruise est passé sur MatchÀ !", "Un mariage, si Dieu le veut !" ];
    var randomNumber = Math.floor(Math.random() * pool.length);
    $scope.pool = pool[randomNumber];
});

app.controller("HeaderCtrl", function ($scope, $cookies, $http, $state) {
    $scope.logout = function () {
        //console.log("delog");
        $cookies.remove("token");
        $cookies.remove("username");
        $state.go("main.home");
    };

    $scope.notifications = [];
    $scope.username = $cookies.get("username");
    if ($cookies.get("username")) {
        $http.get("/api/users/" + $scope.username + "/notifs").then(function (data) {
            $scope.notifications = data.data;
        });

        // sockets.connect();
        var socket = io.connect('http://localhost:3000');
        socket.on("notification", function (data) {
            //// console.log(data.username);
            ////  console.log($scope.username);
            if (data.username == $scope.username) {
                $scope.notifications.push(data);
                $scope.$apply();
            }
        });
    }

    $scope.accept = function (username, target) {
        $http.get("/api/users/" + username + "/accept/" + target).then(function (d) {

        });
    };
    $scope.delNotif = function (e) {
        //console.log(e);
        $http.post("/api/users/" + $scope.username + "/delNotif", e).then(function (data) {
            $scope.notifications.splice($scope.notifications.indexOf(e), 1);
        });
    }
});