from spyne import *
from spyne import Application, rpc, ServiceBase
from spyne import Iterable
from spyne.protocol.soap import Soap11
from spyne.server.wsgi import WsgiApplication


class HelloWorldService(ServiceBase):
    @rpc(Unicode, Integer, _returns=Iterable(Unicode))
    def say_hello(ctx, name, times):
        for i in range(times):
            yield u'Hello, %s' % name
    
    @rpc(Integer, Integer, _returns=Integer)
    def addition(ctx, a, b):
        return a + b

    @rpc(Integer, Integer,Iterable(Integer), _returns=Integer)
    def dureeTrajet(ctx, nbRecharge, tempRecharge, tempTrajets):
        tempTrajet = 0
        for temp in tempTrajets:
            tempTrajet += temp
        return nbRecharge*tempRecharge + tempTrajet

application = Application([HelloWorldService], 'spyne.examples.hello.soap',
in_protocol=Soap11(validator='lxml'),
out_protocol=Soap11())
wsgi_application = WsgiApplication(application)

def main():
    from wsgiref.simple_server import make_server
    server = make_server('127.0.0.1', 8000, wsgi_application)
    server.serve_forever()
main()