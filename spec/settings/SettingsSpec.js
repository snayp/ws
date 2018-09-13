describe("settings", function () {
    // var wsApi = new WsApi(Settings.wsApiLocation);
    var wsApi = new WsApi(Settings.wsApiLocation);
    
    beforeAll(function (done) {
        wsApi.open({
            open : function () {
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
                    done();
                });
            }
        });
    });

    afterAll(function () {
        wsApi.sendMessage("account", "logout");
        wsApi.close();
        expect(true).toBeTruthy();
    });

    it("update", function (done) {
        var query = {
            settings: {
                payment: 978,
                lang: "en"
            }
        };

        wsApi.sendMessage("settings", "update", query, function (data) {
            done();
        });
    });
});
