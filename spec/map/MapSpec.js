describe("map", function () {
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

    it("retrieve", function (done) {
        var query = {
            bounds: "2.06869125366211,41.34318019630203,2.223014831542969,41.459066731634536"
        };

        wsApi.sendMessage("map", "retrieve", query, function (data) {
            expect(data).not.toBeNull();
            expect(data.HO422474BA).not.toBeNull();
            expect(data.HO422474BA.p).not.toBeNull();
            done();
        });
    });

    xit("loc", function (done) {
        var query = {

        };

        wsApi.sendMessage("map", "loc", query, function (data) {
            done();
        });
    });
});