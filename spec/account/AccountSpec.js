describe("account", function() {
    var wsApi = new WsApi(Settings.wsApiLocation);
    var frontApi = new FrontApi(Settings.apiLocation);
    var email = generateUUID() + "@mail1.ru";

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
                    wsApi.sendMessage("account", "login", query, function(data) {
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

    afterAll(function() {
        wsApi.sendMessage("account", "logout");
        wsApi.close();
        expect(true).toBeTruthy();
    });

    it("retrieve", function(done) {
        wsApi.sendMessage("account", "retrieve", null, function(data) {
            expect(data).not.toBeNull();
            expect(data.id).not.toBeNull();
            expect(data.name).not.toBeNull();
            expect(data.name.first).not.toBeNull();
            expect(data.name.last).not.toBeNull();
            expect(data.gender).not.toBeNull();
            expect(data.nat).not.toBeNull();
            expect(data.contacts).not.toBeNull();

            done();
        });
    });

    it("registration: 200-OK", function(done) {
        var regQuery = {
            login: email,
            pass: "12345",
            isTest: true
        };
        wsApi.sendMessage("account", "registration", regQuery, function(data) {
            expect(data).not.toBeNull();
            expect(data.result).not.toBeNull();
            expect(data.confirmCode).not.toBeNull();
            var code = data.confirmCode;
            frontApi.configQuery.login, code, regQuery.isTest, function(status) {
                expect(status).not.toBeNull();
                expect(status).toBe(200);
                var loginQuery = {
                    key: generateUUID(),
                    login: regQuery.login,
                    pass: regQuery.pass
                };
                wsApi.sendMessage("account", "login", loginQuery, function(data) {
                    expect(data).not.toBeNull();
                    expect(data.login).not.toBeNull();
                    expect(data.agent).not.toBeTruthy();
                    expect(data.deposit).not.toBeNull();
                    done();
                });
            });
        });
    });

    it("registration: WRONG_LOGIN", function (done) {
        var query = {
            login: "test",
            pass: "12345"
        };
        wsApi.sendMessage2("account", "registration", query).catch(function(response) {
            expect(response).not.toBeNull();
            expect(response.status).not.toBeNull();
            expect(response.status).toBe(418);
            expect(response.data).not.toBeNull();
            expect(response.data.error).not.toBeNull();
            expect(response.data.error.login).not.toBeNull();
            expect(response.data.error.login).toBe(153);

            done();
        });
    });

    it("registration: LOGIN_IS_USED", function(done) {
        var regQuery = {
            login: generateUUID() + "@mail1.ru",
            pass: "123457789",
            isTest: true
        };
        wsApi.sendMessage2("account", "registration", regQuery).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.result).not.toBeNull();
            expect(data.confirmCode).not.toBeNull();
            return data.confirmCode;
        }).then(function(code) {
            frontApi.confirmReg(regQuery.login, code, true, function(status) {
                expect(status).not.toBeNull();
                expect(status).toBe(200);
                wsApi.sendMessage2("account", "registration", regQuery).catch(function(response) {
                    expect(response).not.toBeNull();
                    expect(response.status).not.toBeNull();
                    expect(response.status).toBe(418);
                    expect(response.data).not.toBeNull();
                    expect(response.data.error).not.toBeNull();
                    expect(response.data.error.login).not.toBeNull();
                    expect(response.data.error.login).toBe(155);

                    done();
                });
            });
        });
    });

    it("registration: WRONG_PASS", function(done) {
        var query = {
            login: "supermail@mail2.ru",
            pass: ""
        };
        wsApi.sendMessage2("account", "registration", query).catch(function(response) {
            expect(response).not.toBeNull();
            expect(response.status).not.toBeNull();
            expect(response.status).toBe(418);
            expect(response.data).not.toBeNull();
            expect(response.data.error).not.toBeNull();
            expect(response.data.error.pass).not.toBeNull();
            expect(response.data.error.pass).toBe(151);
            done();
        });
    });

    xit("restore: 200-OK", function(done) {
        var restoreQuery = {
            login: email,
            isTest: true
        };
        wsApi.sendMessage("account", "restore", restoreQuery, function(data) {
            expect(data).not.toBeNull();
            expect(data.result).not.toBeNull();
            expect(data.confirmCode).not.toBeNull();
            var code = data.confirmCode;
            frontApi.confirmRestore(restoreQuery.login, code, restoreQuery.isTest, function(status) {
                expect(status).not.toBeNull();
                expect(status).toBe(200);
                var loginQuery = {
                    key: generateUUID(),
                    login: restoreQuery.login,
                    pass: restoreQuery.pass
                };
                wsApi.sendMessage("account", "login", loginQuery, function(data) {
                    expect(data).not.toBeNull();
                    expect(data.login).not.toBeNull();
                    expect(data.agent).not.toBeTruthy();
                    expect(data.deposit).not.toBeNull();
                    done();
                });
            });
        });
    });

    it("restore: 401-WRONG_LOGIN", function(done) {
        var query = {
            login: "testSuperFlexi",
            pass: "12345"
        };

        wsApi.sendMessage2("account", "restore", query).catch(function(response) {
            expect(response).not.toBeNull();
            expect(response.status).not.toBeNull();
            expect(response.status).toBe(418);
            expect(response.data).not.toBeNull();
            expect(response.data.error).not.toBeNull();
            expect(response.data.error).toBe(153);

            done();
        });
    });

    it("wrong update pass", function(done) {
        var query = {
            newPass: "resttest",
            oldPass: "resttest"
        };
        wsApi.sendMessage2("account", "update", query).catch(function(response) {
            expect(response).not.toBeNull();
            expect(response.status).not.toBeNull();
            expect(response.status).toBe(418);

            done();
        });
    });

    it("is agent", function(done) {
        var loginQuery = {
            key: generateUUID(),
            login: Settings.user.login,
            pass: Settings.user.pass
        };
        wsApi.sendMessage2("account", "login", loginQuery).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.agent).toBeTruthy();
            done();
        });
    });

    it("opened service category", function(done) {
        var loginQuery = {
            key: generateUUID(),
            login: Settings.user.login,
            pass: Settings.user.pass
        };
        wsApi.sendMessage2("account", "login", loginQuery).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.cat).not.toBeNull();
            expect(data.cat.length).toBeGreaterThan(0);
            expect(data.cat.length).toBe(13);
            expect(data.cat.includes("airticket")).toBeTruthy();
            expect(data.cat.includes("transfer")).toBeTruthy();
            expect(data.cat.includes("accommodation")).toBeTruthy();
            done();
        });
    });

    it("invalid role (only agent_debug, not agent)", function(done) {
        var loginQuery = {
            key: generateUUID(),
            login: "Loginer",
            pass: "12345"
        };
        wsApi.sendMessage2("account", "login", loginQuery).catch(function(response) {
            expect(response).not.toBeNull();
            expect(response.status).not.toBeNull();
            expect(response.status).toBe(418);
            expect(response.data).not.toBeNull();
            expect(response.data.error).not.toBeNull();
            expect(response.data.error.login).not.toBeNull();
            expect(response.data.error.login).toBe(153);

            done();
        });
    });
});
