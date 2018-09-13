describe("Restel accomodation service", function () {
    var payment = new Payment(Settings.paymentApiLocation, Settings.apiLocation);
    var wsApi = new WsApi(Settings.wsApiLocation);
    var cOrderAction = new CommonOrderAction(wsApi, payment);
    var settings = {
        "settings": {
            "lang": "en",
            "payment": "978"
        }
    };
    beforeAll(function (done) {
        wsApi.open({
            open: function () {
                var query = {
                    key: generateUUID(),
                    login: Settings.hermabooking.login,
                    pass: Settings.hermabooking.pass
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
    });

    afterAll(function () {
        wsApi.sendMessage("account", "logout");
        wsApi.close();
        expect(true).toBeTruthy();
    });

    it("search and book and pay", function (done) {
        var context = {};
        var datein = new Date().getTime() + 60 * 60 * 24 * 60 * 1000;
        var dateout = new Date().getTime() + 60 * 60 * 24 * 61 * 1000;
        var query = {
            place: {
                "in": "CI129333ZZ"
            },
            date: {
                "in": datein,
                "out": dateout
            },
            families: [
                {
                    "adults": 1
                }
            ],
            filters: {
                "ref": [true, false] // 0 - refundable, 1 - nonRefandable
            },
            providers: ["restel"]
        };


        var paginationQuery = function (query) {
            wsApi.sendMessage2("service", "accommodation", query)
                .then(function (data) {
                    expect(data.search).not.toBeUndefined();
                    expect(data.done).not.toBeNull();

                    if (!data.done) {
                        setTimeout(function () {
                            paginationQuery(query);
                        }, 6000);
                    } else {
                        context.search = data.search[0];
                        context.personId = "CLI97975619631783846025TK";
                        return wsApi.sendMessage2("order", "create", {name: context.personId})
                            .then(function (data) {
                                context.orderId = data.id;

                                //create 1 accommodation service
                                context.createServiceQuery = {
                                    "type": "accommodation",
                                    "orderid": context.orderId,
                                    items: [{
                                        "offer": context.search.items[0][0].commerce.offer
                                    }]
                                };
                                return wsApi.sendMessage2("service", "create", context.createServiceQuery);

                            }).then(function (data) {
                                expect(data).not.toBeNull();
                                expect(data.id).not.toBeNull();
                                context.service1Id = data.id;

                                var linkQuery = {
                                    "service": context.service1Id,
                                    "tourist": context.personId,
                                    "item": 0
                                };
                                return wsApi.sendMessage2("service", "linktourist", linkQuery);
                            }).then(function (data) {
                                return cOrderAction.bookService(context.service1Id);
                            }).then(function (data) {
                                expect(data).not.toBeNull();
                                return delay(10000);
                            }).then(function () {
                                return wsApi.sendMessage2("order", "retrieve", {id: context.orderId})
                            }).then(function (data) {
                                context.order = data.services[0];
                                expect(data.status).toBe(10);
                                done();
                            });
                    }
                });

        };

        //запрашиваем ещё
        paginationQuery(query);
    }, 115000);
});