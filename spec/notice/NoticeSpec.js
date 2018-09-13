describe("notice", function () {
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
        wsApi.sendMessage("notice", "new", null, function (data) {
            expect(data).not.toBeNull();
            expect(data.id).not.toBeNull();
            var noticeId = data.id;

            wsApi.sendMessage("notice", "retrieve", {pagination:2}, function (data) {
                expect(data).not.toBeNull();
                expect(data.unread).not.toBeNull();
                expect(data.notices).not.toBeNull();
                expect(data.notices.length).toBeGreaterThan(0);
                expect(data.notices[0].id).not.toBeNull();
                expect(data.notices[0].date).not.toBeNull();

                wsApi.sendMessage("notice", "delete", {id:noticeId}, function (data) {
                    done();
                });
            });
        });
    });

    it("update first", function (done) {
        wsApi.sendMessage("notice", "new", null, function (data) {
            expect(data).not.toBeNull();
            expect(data.id).not.toBeNull();
            var noticeId = data.id;

            var query = {
                id: noticeId,
                unread: true
            };
            wsApi.sendMessage("notice", "update", query, function (data) {
                expect(data).not.toBeNull();
                expect(data.unread).not.toBeNull();
                expect(data.unread).toBeGreaterThan(0);

                wsApi.sendMessage("notice", "delete", {id:noticeId}, function (data) {
                    done();
                });
            });
        });
    });

    it("update all", function (done) {
        wsApi.sendMessage("notice", "new", null, function (data) {
            expect(data).not.toBeNull();
            expect(data.id).not.toBeNull();
            var noticeId = data.id;

            wsApi.sendMessage("notice", "update", null, function (data) {
                expect(data).not.toBeNull();
                expect(data.unread).not.toBeNull();
                expect(data.unread).toBe(0);

                wsApi.sendMessage("notice", "delete", {id:noticeId}, function (data) {
                    done();
                });
            });
        });
    });

    it("delete", function (done) {
        wsApi.sendMessage("notice", "new", null, function (data) {
            expect(data).not.toBeNull();
            expect(data.id).not.toBeNull();
            var noticeId = data.id;

            wsApi.sendMessage("notice", "delete", {id:noticeId}, function (data) {
                done();
            });
        });
    });
});