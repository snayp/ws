function ConnectflexiApi(apiHost, login, pass) {
    this.apiHost = apiHost;
    this.login = login;
    this.pass = pass;
}

// send email
ConnectflexiApi.prototype.sendEmail = function(mailDTO) {
    return $.post({
        url: this.apiHost + "/api/v2/connectflexi/mail/contact",
        contentType: "application/json",
        dataType: "json",
        data: mailDTO
    });
};