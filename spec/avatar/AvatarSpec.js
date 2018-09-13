describe("avatar", function () {
    var wsApi = new WsApi(Settings.wsApiLocation);
    
    beforeEach(function(done) {   
        if (!wsApi.isWsAlive()) {
            wsApi = new WsApi(Settings.wsApiLocation);
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
        } else {
            done();
        }
    });

    afterAll(function () {
        wsApi.sendMessage("account", "logout");
        wsApi.close();
        expect(true).toBeTruthy();
    });

    it("retrieve", function (done) {
        var query = { };

        wsApi.sendMessage("avatar", "retrieve", query, function (data) {
            expect(data).not.toBeNull();
            expect(data.path).not.toBeNull();
            done();
        });
    });

    it("update", function (done) {
        var query = {
            image: "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"
         };

        wsApi.sendMessage("avatar", "update", query, function (data) {
            expect(data).not.toBeNull();
            expect(data.path).not.toBeNull();
            done();
        });
    }, 10000);
});