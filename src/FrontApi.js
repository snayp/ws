    function FrontApi(apiHost) {
    this.apiHost = apiHost;
}

FrontApi.prototype.confirmReg = function(login, code, isTest, callback) {
    return $.ajax({
        type: "GET",
        url: this.apiHost + "/api/v2/confirm/reg?loginValue=" + login + "&code=" + code + "&isTest=" + isTest,
        contentType : 'application/json'
    }).done(function(data, textStatus, jqXHR) {
        if(callback !== undefined) {
            callback(jqXHR.status); // invokes the callback function passed as parameter
        }
    });
};

FrontApi.prototype.confirmRestore = function (login, code, isTest, callback) {
    return $.ajax({
        type: "GET",
        url: this.apiHost + "/api/v2/confirm/restore?loginValue=" + login + "&code=" + code + "&isTest=" + isTest,
        contentType : 'application/json'
    }).done(function(data, textStatus, jqXHR) {
        if(callback !== undefined) {
            callback(jqXHR.status); // invokes the callback function passed as parameter
        }
    });
};