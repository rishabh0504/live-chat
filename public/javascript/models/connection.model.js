function ConnectionManager(configObject, user) {
    this.configObject = configObject;
    this.connectionUrl = null;
    this.user = user;
}

ConnectionManager.prototype.createConnectionUrl = function() {
    this.connectionUrl = (this.configObject.isSecure ? "https://" : "http://") + this.configObject.host + ':' + this.configObject.port + '/' + this.configObject.service;
}

ConnectionManager.prototype.onMessage = function(msg){
	console.log('prototype messages');
}

ConnectionManager.prototype.createConnection = function() {
    conn = new Strophe.Connection(this.connectionUrl,{'keepalive': true});
    conn.connect(`${this.user.username}@${this.configObject.host}`, this.user.password, function(status) {
        if (status === Strophe.Status.CONNECTED) {
            console.log('connection established....');
            Object.defineProperty(App, 'connection', {
                writable: false,
                configurable: false,
                value: conn,
                enumerable: true
            });
            
            App.connection.send($pres());
            App.connection.addHandler(this.onMessage, null, 'message', null, null, null);
            App.connection.addHandler(onSubscribe, null, "presence", "subscribe");
            App.connection.addHandler(onPresence, null, "presence");
        }
    });
}




function onMessage(msg) {

    // As this function wiil have always return true fro keeping this connection alive we need to do the dom update related to the message update .
    var to = msg.getAttribute('to');
    var from = msg.getAttribute('from');
    var userDetails = from.split('@');
    var type = msg.getAttribute('type');
    var elems = msg.getElementsByTagName('body');

    if (type == "chat" && elems.length > 0) {
        var message = Strophe.getText(elems[0]);
        console.log(`${userDetails[0]} : ${message}`);
    }
    return true;
}

function onSubscribe(stanza) {
    if (stanza.getAttribute("type") == "subscribe") {
        var from = $(stanza).attr('from');
        // Send a 'subscribed' notification back to accept the incoming
        // subscription request
        connection.send($pres({
            to: from,
            type: "subscribed"
        }));
    }
    return true;
}

function onPresence(presence) {
    console.log('onPresence presence object : ', presence);
    // $(p).find('status').text(); to get the users status
    var presence_type = $(presence).attr('type');
    var from = $(presence).attr('from');
    
    if(presence_type=='unavailable'){
    	console.log('yess unavailable');
    	App.connection.send($pres());
    }

    console.log(` from : ${from}, presence : ${presence_type}`);
    //if (!presence_type) presence_type = "online";

    if (presence_type != 'error') {
        if (presence_type === 'unavailable') {
            // Making contact as offline
        } else {
            var show = $(presence).find("show").text();
            if (show === 'chat' || show === '') {
                // Making contact as online
            } else {
                // etc...
            }
        }
    }
    return true;
}

function sendMessage(message, to, type) {
    var msg = $msg({
        to: to,
        from: App.connection.jid,
        type: 'chat'
    }).c('body').t(message);
    App.connection.send(msg.tree());
}


function getUsersList() {
    var response = "";
    var iq = $iq({ type: 'get' }).c('query', { xmlns: 'jabber:iq:roster' });
    App.connection.sendIQ(iq,
        function success(iq) {
            $(iq).find('item').each(function() {
                console.log($(this));
                var jid = $(this).attr('jid');
                var name = $(this).attr('name') || jid;
                var subscr = $(this).attr('subscription');
                var check = $pres({
                    type: 'probe',
                    to: jid
                });
                App.connection.send(check);
            });
        },
    );
}



function sendMessage(message, to, type) {
    var msg = $msg({
        to: to,
        from: App.connection.jid,
        type: 'chat'
    }).c('body').t(message);
    App.connection.send(msg.tree());
}
