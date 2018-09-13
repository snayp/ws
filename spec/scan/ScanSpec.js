describe("scan", function () {
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
        wsApi.sendMessage("account", "logout", null, function (data) {
            expect(true).toBeTruthy();
            done();
        });
    });

    it("update and delete", function (done) {
        var query = {
            image: "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"
         };

        wsApi.sendMessage("scan", "update", query, function (data) {
            expect(data).not.toBeNull();
            expect(data.path).not.toBeNull();
            var path = data.path;
            
            wsApi.sendMessage("scan", "delete", {path: "https://upload-dev.connectflexi.com" + path}, function (data) {
                expect(true).toBeTruthy();
                done();
            });
        });
    });
});