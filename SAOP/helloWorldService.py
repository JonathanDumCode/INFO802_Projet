from spyne import *
from spyne import Application, rpc, ServiceBase
from spyne import Integer, Unicode, Float
from spyne.protocol.soap import Soap11
from spyne.server.wsgi import WsgiApplication
import json


class HelloWorldService(ServiceBase):
    @rpc(Unicode, Integer, _returns=Iterable(Unicode))
    def say_hello(ctx, name, times):
        for i in range(times):
            yield u'Hello, %s' % name


    @rpc(Integer, Integer,Unicode, _returns=Integer)
    def dureeTrajet(ctx, nbRecharge, tempRecharge, distancels):
        ls = json.loads(distancels)["ls"]
        dist = 0
        for i in ls:
            dist += i

        tempTrajet = int((dist/1000) / 80 *60)
        return nbRecharge*tempRecharge + tempTrajet

application = Application([HelloWorldService], 'spyne.examples.hello.soap',
in_protocol=Soap11(validator='lxml'),
out_protocol=Soap11())
wsgi_application = WsgiApplication(application)

def main():
    from wsgiref.simple_server import make_server
    server = make_server('127.0.0.1', 8000, wsgi_application)
    server.serve_forever()
#main()
app = WsgiApplication(application)