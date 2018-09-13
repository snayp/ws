describe("package service", function () {
    var wsApi = new WsApi(Settings.wsApiLocation);
    var hotel, room, offerSearch, orderId, serviceId;
    var payment = new Payment(Settings.paymentApiLocation, Settings.apiLocation);
    var cOrderAction = new CommonOrderAction(wsApi, payment);

    var settings = {
        "settings": {
            "lang": "en",
            "payment": "978"
        }
    };

    beforeEach(function(done) {   
        if (!wsApi.isWsAlive()) {
            wsApi = new WsApi(Settings.wsApiLocation);
            cOrderAction = new CommonOrderAction(wsApi, payment);
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
                        wsApi.sendMessage("settings", "update", settings, function (data) {
                            done();
                        });
                    });
                }
            });
        } else {
            done();
        }
    });

    afterAll(function (done) {
        wsApi.sendMessage("account", "logout");
        expect(true).toBeTruthy();
        wsApi.close();
        done();
    });


    it("real search and add (from Moscow to Berlin)", function(done) {

        let searchQuery = {
            "place": {
                "in": "CI266088ZZ",
                "out": "CI139974BE"
            },
            "date": {
                "in": new Date().getTime() + 60 * 60 * 24 * 40 * 1000,
                "out": new Date().getTime() + 60 * 60 * 24 * 45 * 1000
            },
            "families": [{"adults": 2}],
                "filters": {
                "price": [
                    0,
                    null
                ]
            },
            "lastid": 0,
            "num": 10
        };

        let paginationQuery = function(searchQuery) {
            wsApi.sendMessage("service", "package", searchQuery, function(data) {
                expect(data.search).not.toBeUndefined();
                expect(data.done).not.toBeNull();
                if (!data.done) {
                    setTimeout(function() {
                        paginationQuery(searchQuery);
                    }, 1000);
                } else {

                    expect(data.search).toBeDefined();
                    expect(data.search.length).toBeGreaterThan(0, "Нет результатов поиска");

                    let result = data.search[0];

                    //validate acc
                    expect(result.accommodations).toBeDefined("Отель должен быть");
                    expect(result.accommodations.length).toBeGreaterThan(0, "Отель должен быть");
                    ServiceValidate.validateAccInfo(result.accommodations[0].info, "accommodations[0].info");
                    ServiceValidate.validateAccItems(result.accommodations[0].items, "accommodations[0].items");


                    //validate airticket
                    expect(result.airtickets).toBeDefined("Билет должен быть");
                    expect(result.airtickets.length).toBeGreaterThan(0, "Билет должен быть");
                    let airticket = result.airtickets[0];
                    ServiceValidate.validateAirTicket(airticket);

                    done();
                }
            });
        };
        paginationQuery(searchQuery);
    }, 60000);


    it("check search on 20 days", function(done) {

        let searchQuery = {
            "place": {
                "in": "CI266088ZZ",
                "out": "CI139974BE"
            },
            "date": {
                "in": new Date().getTime() + 60 * 60 * 24 * 40 * 1000,
                "out": new Date().getTime() + 60 * 60 * 24 * 60 * 1000
            },
            "families": [{"adults": 2}],
            "filters": {
                "price": [
                    0,
                    null
                ]
            },
            "lastid": 0,
            "num": 10
        };


        wsApi.sendMessage("service", "package", searchQuery, function(data) {
                expect(data.search).not.toBeUndefined();
                expect(data.done).not.toBeNull();
                expect(data.done).toBe(true);

                expect(data.search).toBeDefined();
                expect(data.search.length).toBe(0, "Результатов поиска не должно быть, так как пакет максимум на 10 дней настроен");

                done();
        });
    }, 60000);


    it("real search with scrolling(from Moscow to Berlin)", function(done) {

        let searchQuery = {
            "place": {
                "in": "CI266088ZZ",
                "out": "CI139974BE"
            },
            "date": {
                "in": new Date().getTime() + 60 * 60 * 24 * 40 * 1000,
                "out": new Date().getTime() + 60 * 60 * 24 * 46 * 1000
            },
            "families": [{"adults": 2}],
            "filters": {
                "price": [
                    0,
                    null
                ]
            },
            "lastid": 0,
            "num": 3
        };

        let paginationQuery = function(searchQuery) {
            wsApi.sendMessage("service", "package", searchQuery, function(data) {
                expect(data.search).not.toBeUndefined();
                expect(data.done).not.toBeNull();
                // если ещё не нашлось требуемого кол-ва, ждем
                if (!data.done) {
                    setTimeout(function() {
                        paginationQuery(searchQuery);
                    }, 2000);
                } else if(data.search.length >= searchQuery.num) {
                    searchQuery.lastid += searchQuery.num;
                    paginationQuery(searchQuery);
                } else {
                    done();
                }
            });
        };
        paginationQuery(searchQuery);
    }, 60000);


});
