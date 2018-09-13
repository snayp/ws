describe("account registration", function() {
    const N2SMAIL = "@n2s-test.ru";
    var wsApi = new WsApi(Settings.wsApiLocation);
    var frontApi = new FrontApi(Settings.apiLocation);
    var email = generateUUID() + N2SMAIL;

    beforeEach(function(done) {
        if (!wsApi.isWsAlive()) {
            wsApi = new WsApi(Settings.wsApiLocation);
            wsApi.open({
                open : function () {
                    wsApi.sendMessage2("account", "login", {key: generateUUID()}).then(function(data) {
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



    it("200-OK", function(done) {
        var regQuery = {
            login: email,
            pass: "12345",
            isTest: true
        };
        wsApi.sendMessage2("account", "registration", regQuery).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.result).not.toBeNull();
            expect(data.confirmCode).not.toBeNull();

            var confQuery = {
                cc : data.confirmCode,
                isTest: true,
                key : generateUUID()
            };
            return wsApi.sendMessage2("account", "login", confQuery);//confirm
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.login).not.toBeNull();
            expect(data.agent).not.toBeTruthy();
            expect(data.deposit).not.toBeNull();
            done();
        }).catch(function(){
            fail("Регистрация не прошла!");
            done();
        });
    });

    it("WRONG_LOGIN", function (done) {
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
    it("WRONG_LOGIN(SPECIAL)", function (done) {
        var query = {
            login: "вап3434!№;%:?*()@n2s.ru",
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

    it("LOGIN_IS_USED", function(done) {
        var regQuery = {
            login: generateUUID() + N2SMAIL,
            pass: "123457789",
            isTest: true
        };
        wsApi.sendMessage2("account", "registration", regQuery).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.result).not.toBeNull();
            expect(data.confirmCode).not.toBeNull();

            var confQuery = {
                cc : data.confirmCode,
                isTest: true,
                key : generateUUID()
            };

            return wsApi.sendMessage2("account", "login", confQuery);//confirm
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.login).not.toBeNull();

            return wsApi.sendMessage2("account", "registration", regQuery);
        }).catch(function(response) {
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

    it("WRONG_PASS", function(done) {
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

    it("restore: 200-OK", function(done) {

        var regQuery = {
            login: generateUUID() + N2SMAIL,
            pass: "12345",
            isTest: true
        };
        wsApi.sendMessage2("account", "registration", regQuery).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.result).not.toBeNull();
            expect(data.confirmCode).not.toBeNull();

            var confQuery = {
                cc : data.confirmCode,
                isTest: true,
                key : generateUUID()
            };
            return wsApi.sendMessage2("account", "login", confQuery);//confirm
        }).then(function(data) {
            var restoreQuery = {
                login: regQuery.login,
                isTest: true
            };
            return wsApi.sendMessage2("account", "restore", restoreQuery)
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.result).not.toBeNull();
            expect(data.confirmCode).not.toBeNull();
            var code = data.confirmCode;

            var restoreQuery = {
                rc: data.confirmCode,
                isTest: true,
                key: generateUUID()
            };

            return wsApi.sendMessage2("account", "login", restoreQuery);//restore
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.login).not.toBeNull();
            expect(data.agent).not.toBeTruthy();
            expect(data.deposit).not.toBeNull();
            expect(data.cat).not.toBeNull();
            expect(data.state).toBe("unres");

            done();
        }).catch(function(e){
            console.error(e);
            fail("Восстановление УЗ не прошло!");
            done();
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

    it("company: 200-OK", function(done) {
        let rnd = randomString(15);
        var regQuery = {
            login: generateUUID() + N2SMAIL,
            pass: "123456",
            isTest: true,
            "person": {
                "cgender": 0,
                "ggender": 0,
                "agender": 0,
                "ru": true,
                "type": 2,
                "fname": "Jasmine company " + rnd,
                "postal": "123123",
                "country": "CO350220RU",
                "city": "CI266088ZZ",
                "street": "ASDDSFFDS",
                "house": "12",
                "bc": "asd",
                "reg": generateUUID (),
                "tax": "12312345234",
                "gfname": "Asasas",
                "gsname": "BVddsfsf",
                "gemail": "g1752572@nwytg.com",
                "gphone": "2342423423",
                "cemail": "g1752572@nwytg.com",
                "csname": "Asdsffds",
                "cphone": "353567547",
                "cfname": "asdasdasd"
            }
        };
        wsApi.sendMessage2("account", "registration", regQuery).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.result).not.toBeNull();
            expect(data.confirmCode).not.toBeNull();

            var confQuery = {
                cc : data.confirmCode,
                isTest: true,
                key : generateUUID()
            };
            return wsApi.sendMessage2("account", "login", confQuery);//confirm
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.login).not.toBeNull();
            expect(data.agent).toBeTruthy();
            done();
        }).catch(function(){
            fail("Регистрация компании не прошла!");
            done();
        });
    }, 10000);


});
