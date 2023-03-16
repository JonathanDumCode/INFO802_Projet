const soap = require('soap')
const http = require('http');

const wsdlUrl = 'https://soap-three.vercel.app/xml/dureeTrajet.wsdl'


// passing in overridePromiseSuffix because some of the endpoints end
// with "Async" which breaks promisify.


function soapRequest(url, method, args, callback) {
  const soap = require('soap')
  soap.createClient(url, function (err, client) {
    client[method](args, function (err, result) {
      callback(result);
    });
  });
}


const express = require('express');
const { head } = require('request');
const app = express()
const port = 3000
const TOKEN = "5b3ce3597851110001cf6248219e21c992e0455882e7f9a3030fc8e2";


function addRoute(path, callback, appli = app) {

  appli.get(path, (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    callback(req, res);
  });
}

addRoute('/', (req, res) => {
  res.sendFile('www/index.html', { root: __dirname })
});
addRoute('/font', (req, res) => {
  res.sendFile('www/font/aabstractgroovy-webfont.woff', { root: __dirname })
});

// addRoute('/tinysoap-browser-min.js', (req, res) => {
//   res.sendFile('www/tinysoap-browser-min.js', { root: __dirname })
// });

function getGEOJSONFromOSRM(coord, callback) {
  var request = require('request');
  request({
    method: 'POST',
    url: 'https://api.openrouteservice.org/v2/directions/driving-car/geojson',
    body: coord,
    headers: {
      'Accept': 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8',
      'Authorization': TOKEN,
      'Content-Type': 'application/json; charset=utf-8'
    }
  }, function (error, response, body) {
    // console.log('Status:', response.statusCode);
    // console.log('Headers:', JSON.stringify(response.headers));
    // console.log('Response:', body);
    callback(body);
  });
}

function getStations(geoJSON, range, callback) {
  const { request, GraphQLClient } = require('graphql-request')
  const qql = require('graphql-tag')
  let headers = {
    'x-client-id': '6400515d1952b9ff2c914636',
    'x-app-id': '6400515d1952b9ff2c914638'
  }



  const StationAroundQuery = qql`
    query stationAround($query: StationAroundQuery!){
      stationAround(
          query:$query,
          size: 1
          page: 0
        ) {
          id
          location {
            type
            coordinates
          }
          status
          speed
        }
      }
`;

  let dataJson = JSON.parse(geoJSON);
  let points = dataJson.features[0].geometry.coordinates;
  let distances = dataJson.features[0].properties.segments[0].steps;
  let distance = 0;
  let pList = [];
  let distmax = range * 1000;

  for (let i = 0; i < distances.length; i++) {
    distance += distances[i].distance;
    if (distance > distmax) {
      pList.push(points[distances[Math.max(i - 1, 0)].way_points[1]]);
      distance = distances[i].distance;
    }
  }

  let listStation = [];
  const client = new GraphQLClient("https://api.chargetrip.io/graphql", { headers: headers })
  function getStation(pList, i, listStation) {
    if (i >= pList.length) {
      callback(listStation);
    } else {
      client.request(StationAroundQuery, { query: { location: { type: "Point", coordinates: pList[i] }, distance: 3000 } }).then((data) => {
        listStation.push(data.stationAround);
        getStation(pList, i + 1, listStation);
      })
    }
  }
  getStation(pList, 0, listStation)

}
addRoute('/getPath', (req, res) => {
  console.log("getPath en Cours");
  var request = require('request');
  let x1 = req.query.x1;
  let y1 = req.query.y1;
  let x2 = req.query.x2;
  let y2 = req.query.y2;
  let range = req.query.range;
  let worstTime = req.query.worstTime;
  let bestTime = req.query.bestTime;
  let coord = JSON.stringify({ "coordinates": [[x1, y1], [x2, y2]] });
  getGEOJSONFromOSRM(coord, (geoJSON) => {
    getStations(geoJSON, range, (stations) => {
      let tab = [[x1, y1]]
      for (let i = 0; i < stations.length; i++) {
        if(stations[i].length>0){
          tab.push(stations[i][0].location.coordinates)
        }
        
      }
      tab.push([x2, y2])
      let coord = JSON.stringify({ "coordinates": tab });

      getGEOJSONFromOSRM(coord, (geoJSONFinal) => {

        let dataJson = JSON.parse(geoJSONFinal);
        let distances = dataJson.features[0].properties.segments[0].steps;
        let distancels = [];
        for (let i = 0; i < distances.length; i++) {
          distancels.push(distances[i].distance);
        }
        let distancelsJSON = JSON.stringify({ ls: distancels })
        let arg = {
          nbRecharge: stations.length,
          tempRecharge: parseInt(worstTime),
          distancels: distancelsJSON
        }

        soapRequest(wsdlUrl, "dureeTrajet", arg, (tempsMax) => {

          tempsMax = tempsMax.dureeTrajetResult;
          arg.tempRecharge = parseInt(bestTime);
          soapRequest(wsdlUrl, "dureeTrajet", arg, (tempsMin) => {
            tempsMin = tempsMin.dureeTrajetResult;
            let data = {
              geoJSON: geoJSONFinal,
              stations: stations,
              tempsMax: tempsMax,
              tempsMin: tempsMin

            }
            res.send(data);
          });
        })
      })

    })
  });

});





addRoute('/getVilles', (req, res) => {
  const { cities } = require("country-city-location");

  res.send(cities);
});
addRoute('/getVehicule', (req, res) => {
  const { request, GraphQLClient } = require('graphql-request')
  const qql = require('graphql-tag')
  let headers = {
    'x-client-id': '6400515d1952b9ff2c914636',
    'x-app-id': '6400515d1952b9ff2c914638'
  }

  const vehicleListQuery = qql`
  query vehicleList {
    vehicleList(
      page: 0, 
      size: 20
    ) {
    id
    naming {
      make
      model
      chargetrip_version
    }
    connectors {
      time
    }
    range{
      chargetrip_range {
        best
        worst
      }
    }
  }
}
`;
  const client = new GraphQLClient("https://api.chargetrip.io/graphql", { headers: headers })
  client.request(vehicleListQuery, {}).then((data) => {
    res.send(data);
  })
});

addRoute('/stationIcone', (req, res) => {
  res.sendFile('www/img/iconStation.png', { root: __dirname })
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}!`)

})
module.exports = app;