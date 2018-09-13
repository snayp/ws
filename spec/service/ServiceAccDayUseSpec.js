describe("accommodation service", function() {
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

    it("find day use hotel", function(done) {
        var inDate = new Date().getTime() + 60 * 60 * 24 * 40 * 1000;
        var outDate = new Date().getTime() + 60 * 60 * 24 * 40 * 1000;
        var searchQuery = {
            place: {
                in: "HO273420SA"//Hotel Saratovskaya
            },
            date: {
                in: inDate,
                intime: 43200000,
                out: outDate,
                outtime: 50400000
            },
            families: [
                {
                    "adults": 2
                }
            ],
            providers: ["test"]
        };
        var paginationQuery = function(searchQuery) {
            wsApi.sendMessage("service", "dayuse", searchQuery, function(data) {
                expect(data.search).not.toBeUndefined();
                expect(data.done).not.toBeNull();
                if (!data.done) {
                    setTimeout(function() {
                        paginationQuery(searchQuery);
                    }, 1000);
                } else {
                    expect(data.search).toBeDefined();
                    expect(data.search.length).toBeGreaterThan(0, "Нет результатов поиска");
                    expect(data.search[0].items).toBeDefined("Нет результатов поиска");
                    expect(data.search[0].items.length).toBeGreaterThan(0);

                    var room = data.search[0].items[0][0];
                    expect(room.meal).toBeDefined();
                    expect(room.type).toBeDefined();
                    expect(room.intime).toBe(searchQuery.date.intime, "Не сходится время заезда");
                    expect(room.outtime).toBe(searchQuery.date.outtime, "Не сходится время выезда");

                    expect(room.commerce.currency).toBe(978);
                    expect(room.commerce.original).toBeGreaterThan(0);
                    expect(room.commerce.payment).toBeGreaterThan(0);
                    done();
                }
            });
        };
        paginationQuery(searchQuery);
    }, 20000);
});
