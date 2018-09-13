describe("A2BTransfers transfer service", function () {
    var wsApi = new WsApi(Settings.wsApiLocation);
    var payment = new Payment(Settings.paymentApiLocation, Settings.apiLocation);
    var cOrderAction = new CommonOrderAction(wsApi, payment);

    var settings = {
        "settings": {
            "lang": "en",
            "payment": "978"
        }
    };


    var context = {};

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

    it("search and book and cancel", function (done) {
        var query = {
            num: 5,
            place: {
                "in": "AI697721VK", //CI266088ZZ Moscow AI655303DM DME AI656440AA
                "out": "HO592654MO" //HO072793MO HO874966AD
            },
            date: {
                "in": new Date().getTime() + 60 * 60 * 24 * 40 * 1000
            },
            families: [
                {
                    "adults": 1
                }
            ],
            providers: ["a2btransfers"]
        };

        var paginationQuery = function (query) {
            wsApi.sendMessage2("service", "transfer", query)
                .then(function (data) {
                    expect(data.search).not.toBeUndefined();
                    expect(data.done).not.toBeNull();

                    if (!data.done) {
                        setTimeout(function () {
                            paginationQuery(query);
                        }, 2000);
                    } else {
                        context.search = data.search[0];
                        return wsApi.sendMessage2("person", "create", cOrderAction.createPersonQuery)
                            .then(function (data) {
                                expect(data).not.toBeNull();
                                expect(data.id).not.toBeNull();
                                context.personId = data.id;

                                //create order and service
                                return wsApi.sendMessage2("order", "create", {name: context.personId})
                            }).then(function (data) {
                                context.orderId = data.id;

                                //create 1 transfer service
                                context.createServiceQuery = {
                                    "type": "transfer",
                                    "orderid": context.orderId,
                                    "offer": context.search.commerce.offer
                                };

                                return wsApi.sendMessage2("service", "create", context.createServiceQuery);
                            }).then(function (data) {
                                expect(data).not.toBeNull();
                                expect(data.id).not.toBeNull();
                                context.service1Id = data.id;

                                return wsApi.sendMessage2("order", "retrieve", {id: context.orderId})
                            }).then(function (data) {
                                context.order = data.services[0];
                                expect(data).not.toBeNull();
                                expect(data.id).toBe(context.orderId);
                                expect(data.person.id).toBe(context.personId);
                                expect(data.person.name.first).toBe(cOrderAction.createPersonQuery.name.first);
                                expect(data.person.name.last).toBe(cOrderAction.createPersonQuery.name.last);
                                expect(context.order.type).toBe("transfer");
                                expect(context.order.id).toBe(context.service1Id);
                                expect(context.search.info.duration).toBe(context.order.info.duration);
                                expect(context.search.info.durationReturn).toBe(context.order.info.durationReturn);
                                expect(context.order.items.length).toBe(1);
                                expect(context.order.items[0][0].luggage).toBeNull();
                                expect(context.order.items[0][0].place.in).toBe(context.search.items[0][0].place.in);
                                expect(context.order.items[0][0].place.out).toBe(context.search.items[0][0].place.out);
                                expect(context.order.items[0][0].place.incode).toBe(context.search.items[0][0].place.incode);
                                expect(context.order.items[0][0].place.outcode).toBe(context.search.items[0][0].place.outcode);
                                expect(context.order.items[0][0].date.in).toBe(context.search.items[0][0].date.in);
                                expect(context.order.items[0][0].date.out).toBe(context.search.items[0][0].date.out);
                                expect(context.order.items[0][0].date.intime).toBe(context.search.items[0][0].date.intime);
                                expect(context.order.items[0][0].date.outtime).toBe(context.search.items[0][0].date.outtime);
                                expect(context.order.items[0][0].supplier).toBe(context.search.items[0][0].supplier);
                                expect(context.order.items[0][0].flight).toBe(context.search.items[0][0].flight);
                                expect(context.order.items[0][0].duration).toBe(context.search.items[0][0].duration);
                                expect(context.order.items[0][0].cat).toBe(context.search.items[0][0].cat);
                                expect(context.order.commerce.offer).toBe(context.search.commerce.offer);
                                expect(context.order.commerce.toriginal).toBe(context.search.commerce.toriginal);
                                expect(context.order.commerce.don).toBe(context.search.commerce.don);
                                expect(context.order.commerce.original).toBe(context.search.commerce.original);
                                expect(context.order.commerce.tpayment).toBe(context.search.commerce.tpayment);
                                expect(context.order.commerce.discount).toBe(context.search.commerce.discount);
                                expect(context.order.commerce.currency).toBe(context.search.commerce.currency);
                                expect(context.order.commerce.payment).toBe(context.search.commerce.payment);
                                expect(context.order.commerce.commission).toBe(context.search.commerce.commission);
                                done();
                            });
                    }
                });
        };

        //запрашиваем ещё
        paginationQuery(query);
    }, 30000);
});
