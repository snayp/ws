describe("accommodation service", function () {
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


    it("check price with markup for all rooms", function(done) {
        var o = [464.67, 498.66, 498.66, 572.33, 606.33, 798.99, 1224, 1779.33, 2448, 4284];
        var inDate = new Date().getTime() + 60 * 60 * 24 * 40 * 1000;
        var outDate = new Date().getTime() + 60 * 60 * 24 * 41 * 1000; 
        var searchQuery = {
            place: {
                in: "HO873509AG"
            },
            num: 5,
            date: {
                "in": inDate,
                "out": outDate
            },
            families: [
                {
                    "adults": 2
                }
            ],
            providers: ["test"]
        };
        var paginationQuery = function(searchQuery) {
            wsApi.sendMessage("service", "accommodation", searchQuery, function(data) {
                expect(data.search).not.toBeUndefined();
                expect(data.done).not.toBeNull();
                if (!data.done) {
                    setTimeout(function() {
                        paginationQuery(searchQuery);
                    }, 1000);
                } else {
                    var room = data.search[0].items[0][0];
                    expect(room.commerce.currency).toBe(978);
                    expect(room.commerce.original).toBe(parseFloat((o[0] / 0.9).toFixed(2)));
                    expect(room.commerce.payment).toBe(parseFloat((o[0] / 0.9).toFixed(2)));
                    var hotelitems = {
                        index: 0,
                        hotel: "HO873509AG",
                        search: {
                            place: {
                                in: "HO873509AG"
                            },
                            date: {
                                in: inDate,
                                out: outDate
                            },
                            families: [
                                {
                                    adults: 2
                                }
                            ],
                            providers: ["test"]
                        }
                    };
                    wsApi.sendMessage("hotel", "rooms", hotelitems, function(data) {
                        expect(data).not.toBeNull();
                        expect(data.length).toBeGreaterThan(0);
                        for (i = 0; i < data.length; i++) {
                            var commerce = data[i].commerce;
                            expect((commerce)).not.toBeNull();
                            expect((commerce.offer)).not.toBeNull();
                            expect((commerce.toriginal)).toBe(parseFloat((o[i] / 0.9).toFixed(2)));
                            expect((commerce.don)).not.toBeNull();
                            expect((commerce.original)).toBe(parseFloat((o[i] / 0.9).toFixed(2)));
                            expect((commerce.tpayment)).toBe(parseFloat((o[i] / 0.9).toFixed(2)));
                            expect((commerce.cad)).not.toBeNull();
                            expect((commerce.tl)).not.toBeNull();
                            expect((commerce.discount)).not.toBeNull();
                            expect(commerce.currency).toBe(978);
                            expect((commerce.payment)).toBe(parseFloat((o[i] / 0.9).toFixed(2)));
                            expect((commerce.commission)).not.toBeNull();
                        }

                        done();
                    });
                }
            });
        };
        paginationQuery(searchQuery);
    }, 20000);




    it("check ref rooms", function (done) {
        const searchQuery = {
            place: {
                "in": "HO757233SA"
            },
            num: 5,
            date: {
                "in": new Date().getTime() + 60 * 60 * 24 * 40 * 1000,
                "out": new Date().getTime() + 60 * 60 * 24 * 42 * 1000
            },
            families: [
                {
                    "adults": 2
                }
            ],
            filters: {
                ref: [true, null]
            },
            providers: ["test"]
        };

        const roomsSearch = {
            index: 0,
            hotel: searchQuery.place.in,
            search: searchQuery
        };

        cOrderAction.searchWhileNotDone("accommodation", searchQuery).then(function (data) {
            expect(data).not.toBeNull();
            expect(data.search).not.toBeNull();
            expect(data.search.length).toBe(1);



            return wsApi.sendMessage2("hotel", "rooms", roomsSearch);
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.length).toBe(3);
            data.forEach((room, i) => {
                CommonValidate.notEmptyObject(room.commerce, "[" + i + "].commerce");
                CommonValidate.notZero(room.commerce.tl, "[" + i + "].commerce.tl");//у всех должен быть TimeLimit
            });
        }).then(function(data) {
            delete roomsSearch.search.filters.ref;// = undefined;

            return wsApi.sendMessage2("hotel", "rooms", roomsSearch);
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.length).toBe(3, "Вариантов комнат должно паолучится 3(с учётом timelimit)");

            done();
        }).catch(function (response) {
            console.error(response);
            fail("Тест не работает!");
            done();
        });
    }, 30000);
});
