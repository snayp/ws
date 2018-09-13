describe("airticket service", function () {
    var wsApi = new WsApi(Settings.wsApiLocation);
    var payment = new Payment(Settings.paymentApiLocation, Settings.apiLocation);
    var cOrderAction = new CommonOrderAction(wsApi, payment);

    var settings = {
        settings: {
            lang: "en",
            payment: "978"
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

    afterAll(function () {
        wsApi.sendMessage("account", "logout");
        wsApi.close();
        expect(true).toBeTruthy();
    });

    xit("search oneway for aviacenter", function (done) {
        var query = {
            num: 5,
            place: {
                in: "CI025389BA",
                out: "AI551466TX"
            },
            date: {
                in: new Date().getTime() + 60 * 60 * 24 * 140 * 1000
            },
            families: {
                adults: 1
            },
            providers: ["aviacenter"]
        };

        wsApi.sendMessage("service", "airticket", query, function (data) {
            var paginationQuery = function (query) {
                wsApi.sendMessage("service", "airticket", query, function (data) {
                    expect(data.search).not.toBeUndefined();
                    expect(data.done).not.toBeNull();

                    if (!data.done) {
                        setTimeout(function () {
                            paginationQuery(query);
                        }, 1000);
                    } else {
                        expect(data).not.toBeNull();
                        expect(data.search).not.toBeNull();
                        expect(data.search.length).toBeGreaterThan(0);
                        expect(data.search.length).toBe(5);
                        var search = data.search[0];

                        done();
                    }
                });
            };

            //запрашиваем ещё
            paginationQuery(query);
        });
    }, 30000);

    it("search for test provider with ref filter", function (done) {
        var query = {
            num: 5,
            place: {
                in: "AI655303DM",
                out: "AI683025AB"
            },
            date: {
                in: new Date().getTime() + 60 * 60 * 24 * 140 * 1000
            },
            families: {
                adults: 1
            },
            filters: {
                ref: [true, false]
            },
            providers: ["test"]
        };
        wsApi.sendMessage2("service", "airticket", query).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.search).not.toBeUndefined();
            expect(data.done).not.toBeNull();
            expect(data.search).not.toBeNull();
            expect(data.search.length).toBe(0);

            done();
        });
    }, 15000);

    it("search for test provider with non_ref filter", function (done) {
        var query = {
            num: 5,
            place: {
                in: "AI655303DM",
                out: "AI683025AB"
            },
            date: {
                in: new Date().getTime() + 60 * 60 * 24 * 140 * 1000
            },
            families: {
                adults: 1
            },
            filters: {
                ref: [false, true]
            },
            providers: ["test"]
        };
        wsApi.sendMessage2("service", "airticket", query).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.search).not.toBeUndefined();
            expect(data.done).not.toBeNull();
            expect(data.search).not.toBeNull();
            expect(data.search.length).toBeGreaterThan(0);
            expect(data.search.length).toBe(4);

            done();
        });
    }, 15000);

    it("search for test provider with timein filter", function (done) {
        var query = {
            num: 5,
            place: {
                in: "AI655303DM",
                out: "AI683025AB"
            },
            date: {
                in: new Date().getTime() + 60 * 60 * 24 * 140 * 1000
            },
            families: {
                adults: 1
            },
            filters: {
                timein: [null, 7100000]
            },
            providers: ["test"]
        };
        wsApi.sendMessage2("service", "airticket", query).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.search).not.toBeUndefined();
            expect(data.done).not.toBeNull();
            expect(data.search).not.toBeNull();
            expect(data.search.length).toBeGreaterThan(0);
            expect(data.search.length).toBe(2);

            done();
        });
    }, 15000);

    it("search for test provider with max timein filter", function (done) {
        var query = {
            num: 5,
            place: {
                in: "AI655303DM",
                out: "AI683025AB"
            },
            date: {
                in: new Date().getTime() + 60 * 60 * 24 * 140 * 1000
            },
            families: {
                adults: 1
            },
            filters: {
                timein: [null, 10800000]
            },
            providers: ["test"]
        };
        wsApi.sendMessage2("service", "airticket", query).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.search).not.toBeUndefined();
            expect(data.done).not.toBeNull();
            expect(data.search).not.toBeNull();
            expect(data.search.length).toBeGreaterThan(0);
            expect(data.search.length).toBe(4);

            done();
        });
    }, 15000);

    it("search for test provider with min timein filter", function (done) {
        var query = {
            num: 5,
            place: {
                in: "AI655303DM",
                out: "AI683025AB"
            },
            date: {
                in: new Date().getTime() + 60 * 60 * 24 * 140 * 1000
            },
            families: {
                adults: 1
            },
            filters: {
                timein: [5400000, 10800000]
            },
            providers: ["test"]
        };
        wsApi.sendMessage2("service", "airticket", query).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.search).not.toBeUndefined();
            expect(data.done).not.toBeNull();
            expect(data.search).not.toBeNull();
            expect(data.search.length).toBeGreaterThan(0);
            expect(data.search.length).toBe(2);

            done();
        });
    }, 15000);

    it("search for test provider with timeret filter", function (done) {
        var query = {
            num: 5,
            place: {
                in: "AI655303DM",
                out: "AI683025AB"
            },
            date: {
                in: new Date().getTime() + 60 * 60 * 24 * 140 * 1000
            },
            families: {
                adults: 1
            },
            filters: {
                timeret: [32300000, 32500000]
            },
            providers: ["test"]
        };
        wsApi.sendMessage2("service", "airticket", query).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.search).not.toBeUndefined();
            expect(data.done).not.toBeNull();
            expect(data.search).not.toBeNull();
            expect(data.search.length).toBeGreaterThan(0);
            expect(data.search.length).toBe(2);

            done();
        });
    }, 15000);

    it("search for test provider with max timeret filter", function (done) {
        var query = {
            num: 5,
            place: {
                in: "AI655303DM",
                out: "AI683025AB"
            },
            date: {
                in: new Date().getTime() + 60 * 60 * 24 * 140 * 1000
            },
            families: {
                adults: 1
            },
            filters: {
                timeret: [null, 32500000]
            },
            providers: ["test"]
        };
        wsApi.sendMessage2("service", "airticket", query).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.search).not.toBeUndefined();
            expect(data.done).not.toBeNull();
            expect(data.search).not.toBeNull();
            expect(data.search.length).toBeGreaterThan(0);
            expect(data.search.length).toBe(2);

            done();
        });
    }, 15000);

    it("search for test provider with min timeret filter", function (done) {
        var query = {
            num: 5,
            place: {
                in: "AI655303DM",
                out: "AI683025AB"
            },
            date: {
                in: new Date().getTime() + 60 * 60 * 24 * 140 * 1000
            },
            families: {
                adults: 1
            },
            filters: {
                timeret: [35000000, null]
            },
            providers: ["test"]
        };
        wsApi.sendMessage2("service", "airticket", query).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.search).not.toBeUndefined();
            expect(data.done).not.toBeNull();
            expect(data.search).not.toBeNull();
            expect(data.search.length).toBeGreaterThan(0);
            expect(data.search.length).toBe(2);

            done();
        });
    }, 15000);

    it("search for test provider with timein and timeret filter", function (done) {
        var query = {
            num: 5,
            place: {
                in: "AI655303DM",
                out: "AI683025AB"
            },
            date: {
                in: new Date().getTime() + 60 * 60 * 24 * 140 * 1000
            },
            families: {
                adults: 1
            },
            filters: {
                timein: [3500000, 3700000],
                timeret: [32300000, 32500000]
            },
            providers: ["test"]
        };
        wsApi.sendMessage2("service", "airticket", query).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.search).not.toBeUndefined();
            expect(data.done).not.toBeNull();
            expect(data.search).not.toBeNull();
            expect(data.search.length).toBe(0);

            done();
        });
    }, 15000);

    it("search oneway for test provider and add to order", function (done) {
        var context = {};
        var query = {
            num: 5,
            place: {
                in: "AI655303DM",
                out: "AI683025AB"
            },
            date: {
                in: new Date().getTime() + 60 * 60 * 24 * 40 * 1000
            },
            families: {
                adults: 1
            },
            providers: ["test"]
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
                    return wsApi.sendMessage2("person", "create", cOrderAction.createPersonQuery).then(function (data) {
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
                            expect(data.person.name.first).toBe(cOrderAction.createPersonQuery.name.first);
                            expect(data.person.name.last).toBe(cOrderAction.createPersonQuery.name.last);
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
                            expect(item.cat).toBe(context.search.items[0][0].cat);
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

                            done();
                        });
                }
            });
        };

        //запрашиваем ещё
        paginationQuery(query);
    }, 20000);

    it("search multiway for test provider and add to order", function(done) {
        var context = {};
        var query = {
            num: 5,
            place: {
                in: "AI655303DM",
                out: "AI683025AB",
                ret: "AI697721VK"
            },
            date: {
                in: new Date().getTime() + 60 * 60 * 24 * 40 * 1000,
                out: new Date().getTime() + 60 * 60 * 24 * 60 * 1000
            },
            families: {
                adults: 1
            },
            providers: ["test"]
        };

        wsApi.sendMessage2("service", "airticket", query).then(function(data) {
            expect(data.search).not.toBeUndefined();
            expect(data.done).not.toBeNull();
            context.search = data.search[0];
            return wsApi.sendMessage2("person", "create", cOrderAction.createPersonQuery);
        }).then(function (data) {
            expect(data).not.toBeNull();
            expect(data.id).not.toBeNull();
            context.personId = data.id;
            //create order and service
            return wsApi.sendMessage2("order", "create", { name:context.personId });
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
            expect(data.person.name.first).toBe(cOrderAction.createPersonQuery.name.first);
            expect(data.person.name.last).toBe(cOrderAction.createPersonQuery.name.last);
            var order = data.services[0];
            expect(order.type).toBe("airticket");
            expect(order.id).toBe(context.serviceId);
            expect(order.items.length).toBe(2);
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
            expect(item.cat).toBe(context.search.items[0][0].cat);
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

            done();
        });
    }, 20000);

    it("service create (manual) and delete", function(done) {
        var context = {};
        wsApi.sendMessage2("test", "encodeaviaoffer", { offer:cOrderAction.offerFlight1DTO }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.offer).not.toBeNull();
            context.offer = data.offer;
            return wsApi.sendMessage2("order", "create");
        }).then(function(data) {
            context.orderId = data.id;
            var createServiceQuery = {
                type: "airticket",
                orderid: context.orderId,
                offer: context.offer
            };
            return wsApi.sendMessage2("service", "create", createServiceQuery);
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.id).not.toBeNull();
            context.serviceId = data.id;
            wsApi.sendMessage2("service", "delete", { service:context.serviceId });
            wsApi.sendMessage2("order", "delete", { id:context.orderId });
                            
            done();
        });
    }, 10000);

    it("book ref flight", function(done) {
        var context = {};
        cOrderAction.createOrderWith1Airticket(cOrderAction.offerFlight2DTO).then(function(ct) {
            context = ct;
            return cOrderAction.bookService(context.serviceId);
        }).then(function (data) {
            expect(data).not.toBeNull();
            expect(data.status).toBe(5);
            expect(data.id).not.toBeNull();
            expect(data.id).toBe(context.orderId);
            expect(data.commerce.currency).toBe(978);
            expect(data.person.id).toBe(context.personId);
            expect(data.person.name.first).toBe(cOrderAction.createPersonQuery.name.first);
            expect(data.person.name.last).toBe(cOrderAction.createPersonQuery.name.last);
            done();
        });
    }, 20000);

    it("book non_ref flight", function(done) {
        var context = {};
        cOrderAction.createOrderWith1Airticket(cOrderAction.offerFlight1DTO).then(function(ct) {
            context = ct;
            return cOrderAction.bookService(context.serviceId);
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.status).toBeUndefined();
            expect(data.id).not.toBeNull();
            expect(data.id).toBe(context.orderId);
            expect(data.commerce.currency).toBe(978);
            expect(data.person.id).toBe(context.personId);
            expect(data.person.name.first).toBe(cOrderAction.createPersonQuery.name.first);
            expect(data.person.name.last).toBe(cOrderAction.createPersonQuery.name.last);

            done();
        });
    }, 20000);

    it("pay flight", function(done) {
        var context = {};
        cOrderAction.createOrderWith1Airticket(cOrderAction.offerFlight1DTO).then(function(ct) {
            context = ct;
            return cOrderAction.payServiceCard(context.orderId, context.serviceId);
        }).then(function (data) {
            expect(data).not.toBeNull();
            expect(data.status).toBe(20);
            expect(data.id).not.toBeNull();
            expect(data.id).toBe(context.orderId);
            expect(data.commerce.currency).toBe(978);
            expect(data.person.id).toBe(context.personId);
            expect(data.person.name.first).toBe(cOrderAction.createPersonQuery.name.first);
            expect(data.person.name.last).toBe(cOrderAction.createPersonQuery.name.last);

            done();
        });
    }, 20000);

    it("cancel flight", function(done) {
        var context = {};
        cOrderAction.createOrderWith1Airticket(cOrderAction.offerFlight2DTO).then(function(ct) {
            context = ct;
            return cOrderAction.bookService(context.serviceId);
        }).then(function (data) {
            context.data = data;
            return delay(3000);
        }).then(function () {
            return wsApi.sendMessage2("order", "retrieve", { id:context.orderId });
        }).then(function (data) {
            expect(data).not.toBeNull();
            expect(data.status).toBe(10);
            expect(data.id).not.toBeNull();
            expect(data.id).toBe(context.orderId);
            expect(data.commerce.currency).toBe(978);
            expect(data.person.id).toBe(context.personId);
            expect(data.person.name.first).toBe(cOrderAction.createPersonQuery.name.first);
            expect(data.person.name.last).toBe(cOrderAction.createPersonQuery.name.last);
            return wsApi.sendMessage2("service", "cancel", { service:context.serviceId });
        }).then(function (data) {
            expect(data.status).toBe(80);
            done();
        });
    }, 25000);

    it("has invoice", function(done) {
        var context = {};
        cOrderAction.createOrderWith1Airticket(cOrderAction.offerFlight1DTO).then(function(ct) {
            context = ct;
            var invoiceQuery = {
                id: context.serviceId,
                type: "invoice"
            };
            return wsApi.sendMessage2("service", "doc", invoiceQuery);
        }).then(function (data) {
            expect(data).not.toBeNull();
            expect(data.url).not.toBeNull();
            checkDoc(Settings.apiLocation + data.url);
            done();
        });
    });

    it("has voucher", function(done) {
        var context = {};
        cOrderAction.createOrderWith1Airticket(cOrderAction.offerFlight1DTO).then(function(ct) {
            context = ct;
            return cOrderAction.bookService(context.serviceId);
        }).then(function () {
            return cOrderAction.payServiceCard(context.orderId, context.serviceId);
        }).then(function (order) {
            expect(order).not.toBeNull();
            expect(order.status).not.toBeNull();
            expect(order.status).toBe(20);
            var voucherQuery = {
                id: context.serviceId,
                type: "voucher"
            };
            return wsApi.sendMessage2("service", "doc", voucherQuery);
        }).then(function (data) {
            expect(data).not.toBeNull();
            checkDoc(Settings.apiLocation + data.url);
            done();
        });
    }, 30000);
});
