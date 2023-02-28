const soap = require('soap')
const wsdlUrl = 'http://127.0.0.1:8000/xml/say_hello.wsdl'

// passing in overridePromiseSuffix because some of the endpoints end
// with "Async" which breaks promisify.


function soapRequest(url, method, args, callback) {
  soap.createClient(url, {}, function(err, client) {
    client[method](args, function(err, result) {
        callback(result);
    });
  });
}

const express = require('express')
const app = express()
const port = 8080

function addRoute(path,callback,appli = app) {

	appli.get(path, (req,res) => {
		res.setHeader('Access-Control-Allow-Origin', '*');
	  	res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
	  	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
		callback(req,res);
	});
}

addRoute('/', (req, res) =>{
  res.sendFile('www/index.html', {root: __dirname })
});
addRoute('/sayHello', (req, res) => {
  soapRequest(wsdlUrl, 'say_hello', {name: 'John',times:1}, function(result) {
    res.send(result);
  });

})

app.listen(port, () => console.log(`Example app listening on port ${port}!`))
