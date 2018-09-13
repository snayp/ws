describe("extra service", function() {
    var wsApi = new WsApi(Settings.wsApiLocation);
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

    it("dry cleaning", function(done) {
        var inDate = new Date().getTime() + 60 * 60 * 24 * 40 * 1000;
        var outDate = new Date().getTime() + 60 * 60 * 24 * 40 * 1000;
        var searchQuery = {
            place: {
                in: "HO000288TR"
            },
            date: {
                in: inDate,
                out: outDate,
                intime: 43200000, // 12:00
                outtime: 50400000 // 14:00
            },
            families: [
                {
                    adults: 2
                }
            ]
        };
        var paginationQuery = function(searchQuery) {
            var context = {};
            wsApi.sendMessage2("service", "dayuse", searchQuery).then(function(data) {
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
                    expect(room.commerce.offer).not.toBeNull();
                    context.offer = room.commerce.offer;
                    context.createPersonQuery = cOrderAction.createPersonQuery;
                    return wsApi.sendMessage2("person", "create", context.createPersonQuery);
                }
            }).then(function(data) {
                expect(data).not.toBeNull();
                expect(data.id).not.toBeNull();
                context.personId = data.id;
                return wsApi.sendMessage2("order", "create");
            }).then(function(data) {
                context.orderId = data.id;
                var createServiceQuery = {
                    type: "dayuse",
                    orderid: context.orderId,
                    items: [{
                        offer: context.offer
                    }]
                };
                return wsApi.sendMessage2("service", "create", createServiceQuery);
            }).then(function(data) {
                expect(data).not.toBeNull();
                expect(data.id).not.toBeNull();
                context.serviceId = data.id;
                context.linkQuery = {
                    "service": context.serviceId,
                    "tourist": context.personId,
                    "item" : 0
                };
                return wsApi.sendMessage2("service", "linktourist", context.linkQuery);
            }).then(function() {
                return wsApi.sendMessage2("autocomplete", "clothes", { search:"", hotel:searchQuery.place.in });
            }).then(function(data) {
                expect(data).not.toBeNull();
                expect(data.length).toBeGreaterThan(0);
                var cloth = data[0];
                expect(cloth.id).not.toBeNull();
                expect(cloth.name).not.toBeNull();
                context.clothId = cloth.id;
                return wsApi.sendMessage2("extras", "dry", { cloth:context.clothId });
            }).then(function(data) {
                expect(data).not.toBeNull();
                expect(data.actions).not.toBeNull();
                expect(data.actions.length).toBeGreaterThan(0);
                var action = data.actions[0];
                expect(action.id).not.toBeNull();
                context.actionId = action.id;
                expect(action.name).not.toBeNull();
                expect(action.commerce).not.toBeNull();
                expect(action.commerce.original).not.toBeNull();
                expect(action.commerce.payment).not.toBeNull();
                expect(action.commerce.currency).not.toBeNull();
                expect(action.commerce.currency).toBe(978);
                expect(action.commerce.offer).not.toBeNull();
                context.extraOffer = action.commerce.offer;
                var updateExtras = {
                    service: context.serviceId,
                    extras: [
                        {
                            index: 0,
                            person: context.personId,
                            amount: 1,
                            offer: context.extraOffer,
                            type: "DRY",
                            item: {
                                id: context.clothId
                            },
                            action: {
                                id: context.actionId
                            }
                        }
                    ]
                }
                return wsApi.sendMessage2("extras", "update", updateExtras);
            }).then(function() {
                return wsApi.sendMessage2("order", "retrieve", { id:context.orderId });
            }).then(function(data) {
                expect(data).not.toBeNull();
                expect(data.id).not.toBeNull();
                expect(data.id).toBe(context.orderId);
                expect(data.date).not.toBeNull();
                expect(data.commerce.payment).not.toBeNull();
                expect(data.commerce.currency).not.toBeNull();
                expect(data.services).not.toBeNull();
                expect(data.services.length).toBeGreaterThan(0);
                expect(data.services.length).toBe(1);
                var service = data.services[0];
                expect(service.type).not.toBeNull();
                expect(service.type).toBe("dayuse");
                expect(service.id).not.toBeNull();
                expect(service.persons).not.toBeNull();
                expect(service.persons.length).toBeGreaterThan(0);
                expect(service.persons.length).toBe(1);
                var person = service.persons[0];
                expect(person).not.toBeNull();
                expect(person.id).not.toBeNull();
                expect(person.name.first).not.toBeNull();
                expect(person.name.first).toBe(context.createPersonQuery.name.first);
                expect(person.name.last).not.toBeNull();
                expect(person.name.last).toBe(context.createPersonQuery.name.last);

                expect(service.commerce.payment).not.toBeNull();
                expect(service.commerce.original).not.toBeNull();
                expect(service.commerce.currency).not.toBeNull();
                expect(service.commerce.currency).toBe(978);
                expect(service.commerce.tl).not.toBeNull();
                
                expect(service.extraCommerce.payment).not.toBeNull();
                expect(service.extraCommerce.original).not.toBeNull();
                expect(service.extraCommerce.currency).not.toBeNull();
                expect(service.extraCommerce.currency).toBe(978);

                return wsApi.sendMessage2("extras", "retrieve", { service:context.serviceId, type:"DRY" });
            }).then(function(data) {
                expect(data).not.toBeNull();
                expect(data.extras).not.toBeNull();
                expect(data.extras.length).toBeGreaterThan(0);
                expect(data.extras.length).toBe(1);
                
                var extra = data.extras[0];
                expect(extra.type).not.toBeNull();
                expect(extra.type).toBe("DRY");
                expect(extra.index).not.toBeNull();
                expect(extra.index).toBe(0);
                expect(extra.person).not.toBeNull();
                expect(extra.person).toBe(context.personId);
                expect(extra.item).not.toBeNull();
                expect(extra.item.id).not.toBeNull();
                expect(extra.item.name).not.toBeNull();
                expect(extra.action.id).not.toBeNull();
                expect(extra.action.name).not.toBeNull();
                expect(extra.commerce).not.toBeNull();
                expect(extra.commerce.offer).not.toBeNull();
                expect(extra.commerce.offer).toBe(context.extraOffer);
                expect(extra.commerce.original).not.toBeNull();
                expect(extra.commerce.payment).not.toBeNull();
                expect(extra.commerce.currency).not.toBeNull();
                expect(extra.commerce.currency).toBe(978);

                done();
            });
        };
        
        paginationQuery(searchQuery);
    }, 20000);
});
