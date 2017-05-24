angular.module('gservice', ['ngCookies'])
    .factory('caca', function($http){

        // Initialize Variables
        // -------------------------------------------------------------
        // Service our factory will return
        var googleMapService = {};

        // Array of locations obtained from API calls
        var locations = [];

        // Selected Location (initialize to center of America)
        var selectedLat = 48.854212;
        var selectedLong = 2.346439;

        // Functions
        // --------------------------------------------------------------
        // Refresh the Map with new data. Function will take new latitude and longitude coordinates.
        googleMapService.refresh = function(latitude, longitude){

            // Clears the holding array of locations
            locations = [];

            // Set the selected lat and long equal to the ones provided on the refresh() call
            selectedLat = latitude;
            selectedLong = longitude;

            // Perform an AJAX call to get all of the records in the db.
            /*$http.get('/users').success(function(response){

                // Convert the results into Google Map Format
                locations = convertToMapPoints(response);

                // Then initialize the map.
                initialize(latitude, longitude);
            }).error(function(){});*/
            initialize(latitude, longitude);
        };

        // Private Inner Functions
        // --------------------------------------------------------------
        // Convert a JSON of users into map points
        var convertToMapPoints = function(response){

            // Clear the locations holder
            var locations = [];

            // Loop through all of the JSON entries provided in the response
            for(var i= 0; i < response.length; i++) {
                var user = response[i];

                // Create popup windows for each record
                var  contentString =
                    '<p><b>Username</b>: ' + user.username +
                    '<br><b>Age</b>: ' + user.age +
                    '<br><b>Gender</b>: ' + user.gender +
                    '<br><b>Favorite Language</b>: ' + user.favlang +
                    '</p>';

                // Converts each of the JSON records into Google Maps Location format (Note [Lat, Lng] format).
                locations.push({
                    latlon: new google.maps.LatLng(user.location[1], user.location[0]),
                    message: new google.maps.InfoWindow({
                        content: contentString,
                        maxWidth: 320
                    }),
                    username: user.username,
                    gender: user.gender,
                    age: user.age,
                    favlang: user.favlang
                });
            }
            // location is now an array populated with records in Google Maps format
            return locations;
        };

// Initializes the map
        var initialize = function(latitude, longitude) {

            // Uses the selected lat, long as starting point
            var myLatLng = {lat: selectedLat, lng: selectedLong};

            // If map has not been created already...
            if (!map){

                // Create a new map and place in the index.html page
                var map = new google.maps.Map(document.getElementById('map'), {
                    zoom: 3,
                    center: myLatLng
                });
            }

            // Loop through each location in the array and place a marker
            locations.forEach(function(n, i){
                var marker = new google.maps.Marker({
                    position: n.latlon,
                    map: map,
                    title: "Big Map",
                    icon: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
                });

                // For each marker created, add a listener that checks for clicks
                google.maps.event.addListener(marker, 'click', function(e){

                    // When clicked, open the selected marker's message
                    currentSelectedMarker = n;
                    n.message.open(map, marker);
                });
            });

            // Set initial location as a bouncing red marker
            var initialLocation = new google.maps.LatLng(latitude, longitude);
            var marker = new google.maps.Marker({
                position: initialLocation,
                animation: google.maps.Animation.BOUNCE,
                map: map,
                icon: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
            });
            lastMarker = marker;

        };

// Refresh the page upon window load. Use the initial latitude and longitude
        google.maps.event.addDomListener(window, 'load',
            googleMapService.refresh(selectedLat, selectedLong));

        return googleMapService;
    })

.factory("gservice", function ($http, $q, $cookies) {

    var gMapService = {};

    var locations = [];

    function getCoords() {
        var deferred = $q.defer();
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function (p) {
                deferred.resolve( {lat : p.coords.latitude, long : p.coords.longitude});
            }, function (error) {
                trackByIp();
            });
        }
        else {
            trackByIp();
        }

        function trackByIp () {
            $http.get("//freegeoip.net/json/?callback=").then(function (res) {
                deferred.resolve ({lat : res.data.latitude, long : res.data.longitude});
            }, function (err) {
                deferred.reject(err);
            });
        }
        return deferred.promise;
    };

    gMapService.addToMap = function () {
        $http.get("/api/users/coords").then(function (response) {
           locations = [];
           var users = response.data.users;
            // console.log(users);
            users.forEach(function (e) {
                // console.log(e.username);
                var  contentString = null;

                if ("informations" in e) {
                    if ("username" in e)
                        contentString += "<p style='color: black'><b>Nom d'utilisateur</b> : " + e.username + "<br>";
                    if ("gender" in e.informations)
                        contentString += "<b>Sexe </b>: " + e.informations.gender + "<br>";
                    if ("interest" in e.informations)
                        contentString += "<b>Intéressé par : </b>" + e.informations.interest + "<br>";
                    if ("username" in e)
                        contentString += "<b>Page : </b><a href='/#/profil/" + e.username + "'>clique</a>";
                    if (contentString != null)
                        contentString += "</p>";
                    /*var  contentString =
                     "<p style='color: black'><b>Nom d'utilisateur</b> : " + e.username + "<br>" +
                     "<b>Sexe </b>: " + e.informations.gender + "<br>" +
                     "<b>Intéressé par : </b>" + e.informations.interest + "<br>" +
                     "<b>Page : </b><a href='/#/profil/"+e.username+"'>clique</a>" +
                     "</p>";*/

                    locations.push({
                        latlon: new google.maps.LatLng(e.coords.lat, e.coords.long),
                        message: new google.maps.InfoWindow({
                            content: contentString
                        }),
                        username: e.username
                    });
                }
            });
        });
    };

    gMapService.initialize = function () {
        getCoords().then(function (coords) {
            var myLatLng = {lat: coords.lat, lng: coords.long};
            
            var url = "/api/users/" + $cookies.get("token") + "/coords";


            $http.post(url, {coords: coords}).then(function (data) {

            });
            
            if (!map && document.getElementById('map')) {
                // Create a new map and place it
                var map = new google.maps.Map(document.getElementById('map'), {
                    zoom: 14,
                    center: myLatLng
                });
            }
            locations.forEach(function(n, i){
                var marker = new google.maps.Marker({
                    position: n.latlon,
                    map: map,
                    title: n.username,
                    icon: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
                });

                // For each marker created, add a listener that checks for clicks
                /*google.maps.event.addListener(marker, 'click', function(e){

                    // When clicked, open the selected marker's message
                    currentSelectedMarker = n;
                    n.message.open(map, marker);
                });*/
                marker.addListener('click', function () {
                   n.message.open(map, marker);
                });
            });
            var initialLocation = new google.maps.LatLng(coords.lat, coords.long); // lat , long
            var marker = new google.maps.Marker({
                position: initialLocation,
                // animation: google.maps.Animation.BOUNCE,
                map: map,
                icon: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
            });
        });
    };
    
    return gMapService;

});