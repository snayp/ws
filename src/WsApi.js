function WsApi(apiHost) {
    this.apiHost = apiHost;
    this.isOpened = false;
    this.successCallbacks = {};
    this.failCallbacks = {};
    this.noticeCallbacks = {};
}

WsApi.prototype.open = function(callbacks) {
    var wsApi = this;
    try {
        this.socket = new WebSocket(this.apiHost + '/api/v2/websocket');
    } catch (error) {
        console.log('WebSocket Constructor error: ' + error.message + '\n');
    }

    this.socket.onopen = function () {
        console.log('WebSocket Opened\n');
        wsApi.isOpened = true;
        if(callbacks !== undefined && callbacks.open !== undefined) {
            callbacks.open();
        }
    };

    this.socket.onclose = function (event) {
        wsApi.isOpened = false;
        var msg = "";
        if (event.wasClean) {
            msg += 'WebSocket closed';
        } else {
            msg += 'WebSocket broken pipe';
        }
        console.log(msg + ': code: ' + event.code + ' | reason: ' + event.reason + ' | readyState: ' + wsApi.socket.readyState + '\n');

        if(callbacks !== undefined && callbacks.close !== undefined) {
            callbacks.close();
        }
    };

    this.socket.onmessage = function (event) {
        console.log('WebSocket receive message: ' + event.data + '\n');
        var response = JSON.parse(event.data);

        if (response.type == "notice") {
            console.info("Received notice \""+ response.action +"\" from server. Skip it.");
            return;
        }

        if(response.status == 200) {
            var callback = wsApi.successCallbacks[response.key];
            if(callback) {
                callback(response.data);
            } else {
                console.error("Could not find success callback for " + response.key)
            }
        } else {
            var callback = wsApi.failCallbacks[response.key];
            if(callback) {
                callback(response);
            } else {
                console.error("Call error: " + event.data)
            }
        }
    };

    this.socket.onerror = function (error) {
        wsApi.isOpened = false;
        console.log('WebSocket Error: ' + error.message + ' | readyState: ' + wsApi.socket.readyState + '\n');
    };
};

WsApi.prototype.sendMessage = function(type, action, requestData, successCallback, failCallback) {
    var query = {
        key: generateUUID(),
        type: type,
        action: action
    };
    if(requestData != null)
        query.data = requestData;

    this.successCallbacks[query.key] = successCallback ;
    this.failCallbacks[query.key] = failCallback;

    $('#reqMsg').val();

    var queryStr = JSON.stringify(query, null, 4);
    this.socket.send(queryStr);

    console.log("WebSocket send message:\n" + queryStr.substr(0, 3000));
    return query;
};

WsApi.prototype.sendMessage2 = function(type, action, requestData) {
    var ws = this;
    return new Promise(function (resolve, reject) {

        var query = {
            key: generateUUID(),
            type: type,
            action: action
        };
        if(requestData != null)
            query.data = requestData;


        $('#reqMsg').val();

        var queryStr = JSON.stringify(query, null, 4);

        ws.successCallbacks[query.key] = function(data){
            resolve(data);
        };
        ws.failCallbacks[query.key] = function(response){
            reject(response);
        };

        console.log("WebSocket send message:\n" + queryStr.substr(0, 3000));
        ws.socket.send(queryStr);
    });
};

WsApi.prototype.isWsAlive = function() {
    if (this.socket === undefined || this.socket.readyState === this.socket.CLOSED || this.socket.readyState === this.socket.CLOSING) {
        return false;
    }
    return true;
};

WsApi.prototype.close = function() {
    this.socket.close();
    this.isOpened = false;
    console.log("WebSocket closed");
};
