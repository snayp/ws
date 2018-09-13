describe("status", function () {
    var wsApi = new WsApi(Settings.wsApiLocation);
    var payment = new Payment(Settings.paymentApiLocation, Settings.apiLocation);
    var cOrderAction = new CommonOrderAction(wsApi, payment);
    var settings = {
        "settings": {
            "lang": "en",
            "payment": "978"
        }
    };


    beforeAll(function (done) {
        wsApi.open({
            open: function () {
                var query = {
                    key: generateUUID(),
                    login: Settings.user.login,
                    pass: Settings.user.pass
                };
                wsApi.sendMessage("account", "login", query, function (data) {
                    expect(data).not.toBeNull();
                    expect(data.login).not.toBeNull();
                    expect(data.agent).toBeTruthy();
                    expect(data.deposit).not.toBeNull();
                    wsApi.sendMessage("settings", "update", settings, function (data) {
                        done();
                    });
                });
            }
        });
    });

    afterAll(function () {
        wsApi.sendMessage("account", "logout", null, function (done) {
            expect(true).toBeTruthy();
            done();
        });
    });

    it("for service after book is 10", function (done) {

    });

});

