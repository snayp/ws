describe("persons", function () {
    var wsApi = new WsApi(Settings.wsApiLocation);
    var payment = new Payment(Settings.paymentApiLocation, Settings.apiLocation);
    var cOrderAction = new CommonOrderAction(wsApi, payment);
    var backofficeApi = new BackofficeApi(Settings.backofficeApiLocation);

    var queryLogin = {
        key: generateUUID(),
        login: Settings.user.login,
        pass: Settings.user.pass
    };

    var createfullperson = {
        "name": {
            "first": "Air",
            "middle": "Fullmiddle",
            "last": "FullTest"
        },
        "birthday": 636854400000,
        "gender": "female",
        "contacts": {
            "mobiles": [
                {
                    "code": "ru",
                    "num": "9113456789"
                },
                {
                    "code": "ru",
                    "num": "1123456763"
                }
            ],
            "phones": [
                {
                    "code": "ru",
                    "num": "123456789"
                },
                {
                    "code": "ru",
                    "num": "234665456"
                }
            ],
            "emails": [
                "fgtyu@connectflexi.com",
                "ghyutj_uuhg@connectflexi.com"
            ],
            "addrs": [
                {
                    "country": "ag",
                    "region": "El Morro",
                    "city": "Islamabad",
                    "district": "Columbia",
                    "street": "Lenina",
                    "pcode": "478308"
                }
            ]
        },
        "docs": [
            {
                "type": 1,
                "num": "234345345334",
                "expdate": 2132697600000,//01.08.2037
                "issdate": 1501545600000,//01.08.2017
                "issby": "Baumanskiy ROVD",
                "visa": true,
                "scans": Settings.person.scans,
                "nat": "GW"
            },
            {
                "type": 2,
                "num": "11111345334",
                "expdate": 1818547200000,//18.08.2027
                "issdate": 1187395200000,//18.08.2007
                "issby": "Presnenskiy ROVD",
                "visa": true,
                "scans": Settings.person.scans,
                "nat": "ru"
            },
            {
                "type": 0,
                "num": "11111345334",
                "expdate": 1818547200000,//18.08.2027
                "issdate": 1187395200000,//18.08.2007
                "issby": "Presnenskiy ROVD",
                "visa": false,
                "scans": Settings.person.scans,
                "nat": "ru"
            }
        ]
    };
    var settings = {
        "settings": {
            "lang": "en",
            "payment": "978"
        }
    };

    beforeEach(function (done) {
        if (!wsApi.isWsAlive()) {
            wsApi = new WsApi(Settings.wsApiLocation);
            cOrderAction = new CommonOrderAction(wsApi, payment);
            wsApi.open({
                open: function () {
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

    afterAll(function () {
        wsApi.sendMessage("account", "logout");
        wsApi.close();
        expect(true).toBeTruthy();
    });

    it("search oneway for aviacenter", function (done) {
        var context = {};
        var query = {
            num: 5,
            place: {
                "in": "AI177826SV", //svo
                "out": "AI013259LH" //heathrow
            },
            date: {
                "in": new Date().getTime() + 60 * 60 * 24 * 140 * 1000
            },
            families: {
                "adults": 1
            },
            providers: ["aviacenter"]
        };

        var paginationQuery = function (query) {

        wsApi.sendMessage2("service", "airticket", query).then(function (data) {
            expect(data.search).not.toBeUndefined();
            expect(data.done).not.toBeNull();

            if (!data.done) {
                setTimeout(function () {
                    paginationQuery(query);
                }, 2000);
            } else {
                context.search = data.search[0];
                return wsApi.sendMessage2("person", "create", createfullperson).then(function (data) {
                    expect(data).not.toBeNull();
                    expect(data.id).not.toBeNull();
                    context.personId = data.id;
                    //create order and service
                    return wsApi.sendMessage2("order", "create", {name: context.personId})
                }).then(function (data) {
                    context.orderId = data.id;

                    //create 1 airticket service
                    context.createServiceQuery = {
                        type: "airticket",
                        orderid: context.orderId,
                        offer: context.search.commerce.offer
                    };
                    return wsApi.sendMessage2("service", "create", context.createServiceQuery);
                }).then(function (data) {
                    expect(data).not.toBeNull();
                    expect(data.id).not.toBeNull();
                    context.serviceId = data.id;
                    return wsApi.sendMessage2("order", "retrieve", {id: context.orderId})
                }).then(function (data) {
                    expect(data).not.toBeNull();
                    expect(data.id).toBe(context.orderId);
                    expect(data.person.id).toBe(context.personId);
                    // expect(data.person.name.first).toBe(cOrderAction.createPersonQuery.name.first);
                    // expect(data.person.name.last).toBe(cOrderAction.createPersonQuery.name.last);
                    var order = data.services[0];
                    expect(order.type).toBe("airticket");
                    expect(order.id).toBe(context.serviceId);
                    expect(order.items.length).toBe(1);
                    expect(order.items[0]).not.toBeNull();
                    expect(order.items[0][0]).not.toBeNull();
                    var item = order.items[0][0];
                    expect(item.place.inpoint.city).toBe(context.search.items[0][0].place.inpoint.city);
                    expect(item.place.inpoint.name).toBe(context.search.items[0][0].place.inpoint.name);
                    expect(item.place.inpoint.code).toBe(context.search.items[0][0].place.inpoint.code);
                    expect(item.place.outpoint.city).toBe(context.search.items[0][0].place.outpoint.city);
                    expect(item.place.outpoint.name).toBe(context.search.items[0][0].place.outpoint.name);
                    expect(item.place.outpoint.code).toBe(context.search.items[0][0].place.outpoint.code);
                    expect(item.date.in).toBe(context.search.items[0][0].date.in);
                    expect(item.date.out).toBe(context.search.items[0][0].date.out);
                    expect(item.date.intime).toBe(context.search.items[0][0].date.intime);
                    expect(item.date.outtime).toBe(context.search.items[0][0].date.outtime);
                    expect(item.supplier).toBe(context.search.items[0][0].supplier);
                    expect(item.flight).toBe(context.search.items[0][0].flight);
                    expect(item.duration).toBe(context.search.items[0][0].duration);
                    // expect(item.cat).toBe(context.search.items[0][0].cat);
                    var commerce = order.commerce;
                    expect(commerce.offer).toBe(context.search.commerce.offer);
                    expect(commerce.toriginal).toBe(context.search.commerce.toriginal);
                    expect(commerce.don).toBe(context.search.commerce.don);
                    expect(commerce.cad).toBe(context.search.commerce.cad);
                    expect(commerce.original).toBe(context.search.commerce.original);
                    expect(commerce.tpayment).toBe(context.search.commerce.tpayment);
                    expect(commerce.discount).toBe(context.search.commerce.discount);
                    expect(commerce.currency).toBe(context.search.commerce.currency);
                    expect(commerce.currency).toBe(978);
                    expect(commerce.payment).toBe(context.search.commerce.payment);
                    expect(commerce.commission).toBe(context.search.commerce.commission);
                    //     var updateService = {
                    //         "service" : context.serviceId,
                    //         "docs" : [{
                    //             "id" : context.personId,
                    //             "docId" : "doc for test"
                    //         }]
                    //     };
                    //     return wsApi.sendMessage2("service", "update", updateService)

                    }).then(function (data) {
                    var linkQuery = {
                        "service": context.serviceId,
                        "tourist": context.personId
                    };
                    return wsApi.sendMessage2("service", "linktourist", linkQuery);
                }).then(function (data) {
                    return cOrderAction.bookService(context.serviceId);
                }).then(function () {
                    return cOrderAction.payServiceCard(context.orderId, context.serviceId);
                }).then(function (data) {
                    expect(data).not.toBeNull();
                    expect(data.status).toBe(20);
                    done();
                });
            }
        });
    };

        //запрашиваем ещё
        paginationQuery(query);
    }, 145000);


});
