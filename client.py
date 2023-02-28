import zeep

wsdl = 'http://127.0.0.1:8000/xml/say_hello.wsdl'
client = zeep.Client(wsdl=wsdl)
print(client.service.say_hello('Zeep', 10))


wsdl = 'http://127.0.0.1:8000/xml/addition.wsdl'
client = zeep.Client(wsdl=wsdl)
print(client.service.addition(3, 10))