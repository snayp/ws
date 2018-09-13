describe("transfer service", function () {
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
        wsApi.sendMessage("account", "logout", null, function (done) {
            expect(true).toBeTruthy();
            done();
        });
    });

    it("search oneway for test provider", function (done) {
        var query = {
            num: 4,
            place: {
                in: "AI655303DM", //CI266088ZZ Moscow AI655303DM DME AI656440AA
                out: "HO072793MO" //HO072793MO HO874966AD
            },
            date: {
                in: new Date().getTime() + 60 * 60 * 24 * 40 * 1000
            },
            families: [
                {
                    adults: 1                    // кол-во взрослых
                }
            ],
            providers: ["test"]
        };

        wsApi.sendMessage("service", "transfer", query, function (data) {
            var d = data;
            var ds = d.search;
            var dl = ds.length;
            var o = [40, 54, 59, 134];
            expect(d).not.toBeNull();
            expect(ds).not.toBeNull();
            expect(dl).toBe(4);

            // Маркап 10% между Provider for Autotests и Herma B2B
            for (i = 0; i < dl; i++) {
                expect(ds[i].commerce.currency).toBe(978);               
                expect(ds[i].commerce.original).toBe(parseFloat(((parseFloat((o[i]/0.9).toFixed(2)))/0.85).toFixed(2))); // Между Herma B2b и Sfera jet 15%, между Herma B2b и Provider for Autotest 10%,
                expect(ds[i].commerce.toriginal).toBe(parseFloat(((parseFloat((o[i]/0.9).toFixed(2)))/0.85).toFixed(2))); // Между Herma B2b и Sfera jet 15%, между Herma B2b и Provider for Autotest 10%,
                expect(ds[i].commerce.payment).toBe(parseFloat(((parseFloat((o[i]/0.9).toFixed(2)))/0.85).toFixed(2)));
                expect(ds[i].commerce.tpayment).toBe(parseFloat(((parseFloat((o[i]/0.9).toFixed(2)))/0.85).toFixed(2)));
            }
            done();
        });
    });

    it("search oneway for a2b provider", function (done) {
        var query = {
            num: 5,
            place: {
                in: "AI177826SV",
                out: "HO001846MO"
            },
            date: {
                in: new Date().getTime() + 60 * 60 * 24 * 20 * 1000,
                intime: 50400000
            },
            families: [
                {
                    adults: 1
                }
            ],
            providers: ["a2btransfers"]
        };

        wsApi.sendMessage("service", "transfer", query, function (data) {
            expect(data).not.toBeNull();
            expect(data.search).not.toBeNull();
            expect(data.search.length).toBeGreaterThan(0);
            expect(data.search[0]).not.toBeNull();
            var transfer = data.search[0];

            var transferInfo = transfer.info;
            expect(transferInfo).not.toBeNull();
            expect(transferInfo.id).toBeDefined();
            expect(transferInfo.id).not.toBeNull();
            expect(transferInfo.type).toBeDefined();
            expect(transferInfo.type).not.toBeNull();
            expect(transferInfo.brand).toBeDefined();
            expect(transferInfo.brand).not.toBeNull();
            expect(transferInfo.num).toBeDefined();
            expect(transferInfo.num).not.toBeNull();
            expect(transferInfo.capacity).toBeDefined();
            expect(transferInfo.capacity).not.toBeNull();
            expect(transferInfo.isdesc).toBeDefined();
            expect(transferInfo.isdesc).not.toBeNull();
            expect(transferInfo.imgnum).toBeDefined();
            expect(transferInfo.imgnum).not.toBeNull();

            expect(transfer.items).not.toBeNull();
            expect(transfer.items.length).toBeGreaterThan(0);
            expect(transfer.items.length).toBe(1);
            var commerce = transfer.commerce;
            expect(commerce).not.toBeNull();
            expect(commerce.offer).not.toBeNull();
            expect(commerce.payment).not.toBeNull();
            expect(commerce.original).not.toBeNull();
            expect(commerce.currency).not.toBeNull();
            expect(commerce.currency).toBe(978);
            done();
        });
    });

    it("search multiway for a2b provider", function (done) {
        var query = {
            num: 5,
            place: {
                in: "AI177826SV",
                out: "HO001846MO",
                ret: "AI177826SV",
            },
            date: {
                in: new Date().getTime() + 60 * 60 * 24 * 14 * 1000,
                intime: 50400000,
                out: new Date().getTime() + 60 * 60 * 24 * 21 * 1000,
                outtime: 50400000,
            },
            families: [
                {
                    adults: 1
                }
            ],
            providers: ["a2btransfers"]
        };

        wsApi.sendMessage("service", "transfer", query, function (data) {
            expect(data).not.toBeNull();
            expect(data.search).not.toBeNull();
            expect(data.search.length).toBeGreaterThan(0);
            expect(data.search[0]).not.toBeNull();
            var transfer = data.search[0];
            expect(transfer.info).not.toBeNull();
            expect(transfer.info.id).not.toBeNull();
            expect(transfer.items).not.toBeNull();
            expect(transfer.items.length).toBeGreaterThan(0);
            expect(transfer.items.length).toBe(2);
            var commerce = transfer.commerce;
            expect(commerce).not.toBeNull();
            expect(commerce.offer).not.toBeNull();
            expect(commerce.payment).not.toBeNull();
            expect(commerce.original).not.toBeNull();
            expect(commerce.currency).not.toBeNull();
            expect(commerce.currency).toBe(978);
            done();
        });
    });

    it("search with ref true, true filter", function (done) {
        var query = {
            num: 5,
            place: {
                in: "AI655303DM", //CI266088ZZ Moscow AI655303DM DME AI656440AA
                out: "HO072793MO" //HO072793MO HO874966AD
            },
            date: {
                in: new Date().getTime() + 60 * 60 * 24 * 40 * 1000
            },
            families: [
                {
                    adults: 1
                }
            ],
            filters: {
                ref: [true, true]
            },
            providers: ["test"]
        };

        wsApi.sendMessage("service", "transfer", query, function (data) {
            expect(data).not.toBeNull();
            expect(data.search.length).toBe(4);
            done();
        });
    });

    it("search with ref false, true filter", function (done) {
        var query = {
            num: 5,
            place: {
                in: "AI655303DM", //CI266088ZZ Moscow AI655303DM DME AI656440AA
                out: "HO072793MO" //HO072793MO HO874966AD
            },
            date: {
                in: new Date().getTime() + 60 * 60 * 24 * 40 * 1000
            },
            families: [
                {
                    adults: 1
                }
            ],
            filters: {
                ref: [false, true]
            },
            providers: ["test"]
        };

        wsApi.sendMessage("service", "transfer", query, function (data) {
            expect(data).not.toBeNull();
            expect(data.search.length).toBe(4);
            done();
        });
    });

    it("search with ref true, false filter", function (done) {
        var query = {
            num: 5,
            place: {
                in: "AI655303DM", //CI266088ZZ Moscow AI655303DM DME AI656440AA
                out: "HO072793MO" //HO072793MO HO874966AD
            },
            date: {
                in: new Date().getTime() + 60 * 60 * 24 * 40 * 1000
            },
            families: [
                {
                    adults: 1
                }
            ],
            filters: {
                ref: [true, false]
            },
            providers: ["test"]
        };

        wsApi.sendMessage("service", "transfer", query, function (data) {
            expect(data).not.toBeNull();
            expect(data.search.length).toBe(0);
            done();
        });
    });

    it("search with ref false, false filter", function (done) {
        var query = {
            num: 5,
            place: {
                in: "AI655303DM", //CI266088ZZ Moscow AI655303DM DME AI656440AA
                out: "HO072793MO" //HO072793MO HO874966AD
            },
            date: {
                in: new Date().getTime() + 60 * 60 * 24 * 40 * 1000
            },
            families: [
                {
                    adults: 1
                }
            ],
            filters: {
                ref: [false, false]
            },
            providers: ["test"]
        };

        wsApi.sendMessage("service", "transfer", query, function (data) {
            expect(data).not.toBeNull();
            expect(data.search.length).toBe(4);
            done();
        });
    });

    it("search with price filter", function (done) {
        var query = {
            num: 5,
            place: {
                "in": "AI655303DM", //CI266088ZZ Moscow AI655303DM DME AI656440AA
                "out": "HO072793MO" //HO072793MO HO874966AD
            },
            date: {
                "in": new Date().getTime() + 60 * 60 * 24 * 40 * 1000
            },
            families: [
                {
                    "adults": 1
                }
            ],
            filters: {
                "price": [50, 120]
            },
            providers: ["test"]
        };
        wsApi.sendMessage("service", "transfer", query, function (data) {
            expect(data).not.toBeNull();
            expect(data.search.length).toBe(3);
            done();
        });
    });

    it("search with all filters", function (done) {
        var query = {
            num: 5,
            place: {
                in: "AI655303DM", //CI266088ZZ Moscow AI655303DM DME AI656440AA
                out: "HO072793MO" //HO072793MO HO874966AD
            },
            date: {
                in: new Date().getTime() + 60 * 60 * 24 * 40 * 1000
            },
            families: [
                {
                    adults: 1
                }
            ],
            filters: {
                ref: [true, true],
                price: [60, 100]
            },
            providers: ["test"]
        };
        wsApi.sendMessage("service", "transfer", query, function (data) {
            expect(data).not.toBeNull();
            expect(data.search.length).toBe(2);
            done();
        });
    });

    it("search oneway and add to order from test provider", function (done) {
        var context = {};
        var query = {
            num: 4,
            place: {
                in: "AI655303DM", //CI266088ZZ Moscow AI655303DM DME AI656440AA
                out: "HO072793MO" //HO072793MO HO874966AD
            },
            date: {
                in: new Date().getTime() + 60 * 60 * 24 * 40 * 1000
            },
            families: [
                {
                    adults: 1
                }
            ],
            providers: ["test"]
        };
        wsApi.sendMessage2("service", "transfer", query).then(function (data) {
            context.searchTransfer = data.search[0];
            return wsApi.sendMessage2("person", "create", cOrderAction.createPersonQuery)
        }).then(function (data) {
            expect(data).not.toBeNull();
            expect(data.id).not.toBeNull();
            context.personId = data.id;
            //create order and service
            return wsApi.sendMessage2("order", "create", {name: context.personId})
        }).then(function (data) {
            context.orderId = data.id;
            //create 1 transfer service
            context.createServiceAirQuery = {
                type: "transfer",
                orderid: context.orderId,
                offer: context.searchTransfer.commerce.offer
            };
            return wsApi.sendMessage2("service", "create", context.createServiceAirQuery);
        }).then(function (data) {
            expect(data).not.toBeNull();
            expect(data.id).not.toBeNull();
            context.serviceId = data.id;

            return wsApi.sendMessage2("order", "retrieve", { id:context.orderId })
        }).then(function (data) {
            context.orderTransfer = data.services[0];
            expect(data).not.toBeNull();
            expect(data.commerce.currency).toBe(978);
            var transferPayment = context.searchTransfer.commerce.payment;
            expect(data.commerce.payment).toBe(transferPayment);
            expect(context.orderTransfer.offer).not.toBeNull();
            var orderInfo = context.orderTransfer.info;
            var searchInfo = context.searchTransfer.info;
            expect(searchInfo.baggage).not.toBeNull();
            expect(orderInfo.baggage.amount).toBe(searchInfo.baggage.amount);
            expect(orderInfo.baggage.person).toBe(searchInfo.baggage.person);
            expect(orderInfo.capacity[0]).toBe(searchInfo.capacity[0]);
            expect(orderInfo.capacity[1]).toBe(searchInfo.capacity[1]);
            expect(orderInfo.type).toBe(searchInfo.type);
            expect(orderInfo.brand).toBe(searchInfo.brand);
            expect(context.orderTransfer.commerce.original).toBe(transferPayment);
            expect(context.orderTransfer.commerce.toriginal).toBe(transferPayment);
            expect(context.orderTransfer.commerce.payment).toBe(transferPayment);
            expect(context.orderTransfer.commerce.tpayment).toBe(transferPayment);
            var orderItems = context.orderTransfer.items[0];
            var searchItems = context.searchTransfer.items[0];
            expect(orderItems.duration).toBe(searchItems.duration);
            expect(orderItems.distance).toBe(searchItems.distance);

            done();
        });
    });

    it("service create (manual) and delete", function (done) {
        var offerDto = {
            "pr":"test",
            "pp": 100,
            "pc": "EUR",
            "tid":"MB5-20",
            "mtid":"TT848993PR",
            "dep": "AI655303DM",
            "arr": "HO064936CA",
            "adt": 1,
            "in": new Date().getTime() + 60 * 60 * 24 * 85 * 1000,
            "bk": "testbookcode"
        };

        wsApi.sendMessage("test", "encodetransferoffer", {offer: offerDto}, function (data) {
            expect(data.offer).not.toBeNull();
            var offer = data.offer;

            //create order and service
            wsApi.sendMessage("order", "create", null, function (data) {
                var orderId = data.id;

                //create service
                var createServiceQuery = {
                    type: "transfer",
                    orderid: orderId,
                    offer: offer
                };
                wsApi.sendMessage("service", "create", createServiceQuery, function (data) {
                    expect(data).not.toBeNull();
                    expect(data.id).not.toBeNull();
                    var serviceId = data.id;

                    wsApi.sendMessage("service", "delete", {service: data.id}, function (data) {
                        wsApi.sendMessage("order", "delete", {id: orderId}, function (data) {
                            done();
                        });
                    });
                });
            });
        });
    }, 10000);

    it("book ref transfer", function (done) {
        var context = {};
        cOrderAction.createOrderWith1Transfer(cOrderAction.offerTransfer2DTO)
        .then(function (ct) {
            context = ct;
            return cOrderAction.bookService(context.serviceId);
        }).then(function (data) {
            expect(data).not.toBeNull();
            expect(data.status).toBe(5);
            expect(data.id).not.toBeNull();
            expect(data.id).toBe(context.orderId);
            expect(data.commerce.currency).toBe(978);
            let person = data.services[0].persons[0];
            expect(person.id).toBe(context.personId);
            expect(person.name.first).toBe(cOrderAction.createPersonQuery.name.first);
            expect(person.name.last).toBe(cOrderAction.createPersonQuery.name.last);
            done();
        });
    }, 20000);


    it("try book with one valid and one invalid tourist", function (done) {
        let trOffer = Object.assign({}, cOrderAction.offerTransfer2DTO);
        trOffer.adt = 2;

        let context = {};
        wsApi.sendMessage2("test", "encodetransferoffer", { offer:trOffer }).then(function(data) {
            expect(data.offer).not.toBeNull();
            context.offer = data.offer;
            return wsApi.sendMessage2("person", "create", cOrderAction.createPersonQuery)
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.id).not.toBeNull();
            context.personId = data.id;

            return wsApi.sendMessage2("person", "create", cOrderAction.createPersonQueryWitoutContacts)
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.id).not.toBeNull();
            context.person2Id = data.id;
            return wsApi.sendMessage2("order", "create", { name:context.personId })
        }).then(function(data) {
            context.orderId = data.id;
            context.createServiceQuery = {
                "type": "transfer",
                "orderid": context.orderId,
                "offer": context.offer
            };
            return wsApi.sendMessage2("service", "create", context.createServiceQuery);
        }).then(function (data) {
            expect(data).not.toBeNull();
            expect(data.id).not.toBeNull();
            context.serviceId = data.id;
            return wsApi.sendMessage2("order", "retrieve", { id:context.orderId })
        }).then(function(data) {
            expect(data).not.toBeNull();
            var linkQuery = {
                service: context.serviceId,
                tourist: context.personId
            };
            return wsApi.sendMessage2("service", "linktourist", linkQuery);
        }).then(function(data) {
            expect(data).not.toBeNull();
            var linkQuery = {
                service: context.serviceId,
                tourist: context.person2Id
            };
            return wsApi.sendMessage2("service", "linktourist", linkQuery);
        }).then(function() {
            var updateQuery = {
                service: context.serviceId,
                trip: {
                    index: 0,
                    num: "FL1234"
                }
            };
            return wsApi.sendMessage2("service", "update", updateQuery);
        }).then(function(data) {
            return cOrderAction.bookService(context.serviceId);
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.status).toBe(5);
        }).then(function() {
            return sleep(3000);
        }).then(function() {
            return wsApi.sendMessage2("order", "retrieve", { id:context.orderId })
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.status).toBe(10, "Заказ должен забронироваться");
            done();
        }).catch(function (response) {
            console.error(response);
            fail("Создание трансфера с последующим бронированем не работают!");
            done();
        });
    }, 20000);

    it("book non_ref transfer", function (done) {
        var context = {};
        cOrderAction.createOrderWith1Transfer(cOrderAction.offerTransfer1DTO).then(function (ct) {
            context = ct;
            return cOrderAction.bookService(context.serviceId);
        }).then(function (data) {
            expect(data).not.toBeNull();
            expect(data.status).toBeUndefined();
            expect(data.id).not.toBeNull();
            expect(data.id).toBe(context.orderId);
            expect(data.commerce.currency).toBe(978);

            let person = data.services[0].persons[0];
            expect(person.id).toBe(context.personId);
            expect(person.name.first).toBe(cOrderAction.createPersonQuery.name.first);
            expect(person.name.last).toBe(cOrderAction.createPersonQuery.name.last);
            done();
        });
    }, 20000);

    it("pay transfer", function(done) {
        var context = {};
        cOrderAction.createOrderWith1Transfer(cOrderAction.offerTransfer1DTO).then(function(ct) {
            context = ct;
            return cOrderAction.payServiceCard(context.orderId, context.serviceId);
        }).then(function (data) {
            expect(data).not.toBeNull();
            expect(data.status).toBe(20);
            expect(data.id).not.toBeNull();
            expect(data.id).toBe(context.orderId);
            expect(data.commerce.currency).toBe(978);

            let person = data.services[0].persons[0];
            expect(person.id).toBe(context.personId);
            expect(person.name.first).toBe(cOrderAction.createPersonQuery.name.first);
            expect(person.name.last).toBe(cOrderAction.createPersonQuery.name.last);

            done();
        });
    }, 20000);

    it("cancel transfer", function(done) {
        var context = {};
        cOrderAction.createOrderWith1Transfer(cOrderAction.offerTransfer2DTO).then(function(ct) {
            context = ct;
            return cOrderAction.bookService(context.serviceId);
        }).then(function(data) {
            context.data = data;
            return delay(3000);
        }).then(function() {
            return wsApi.sendMessage2("order", "retrieve", { id:context.orderId });
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.status).toBe(10);
            expect(data.id).not.toBeNull();
            expect(data.id).toBe(context.orderId);
            expect(data.commerce.currency).toBe(978);

            let person = data.services[0].persons[0];
            expect(person.id).toBe(context.personId);
            expect(person.name.first).toBe(cOrderAction.createPersonQuery.name.first);
            expect(person.name.last).toBe(cOrderAction.createPersonQuery.name.last);
            return wsApi.sendMessage2("service", "cancel", { service:context.serviceId});
        }).then(function (data) {
            expect(data.status).toBe(80);
            done();
        });
    }, 25000);

    it("has invoice", function(done) {
        var context = {};
        cOrderAction.createOrderWith1Transfer(cOrderAction.offerTransfer1DTO).then(function(ct) {
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
        cOrderAction.createOrderWith1Transfer(cOrderAction.offerTransfer1DTO).then(function(ct) {
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


    it("book with no phones tourist", function (done) {//турист без телефона не должен бронировать трансфер
        let context = {};
        cOrderAction.createOrderWith1Transfer(cOrderAction.offerTransfer2DTO, Settings.payerId, cOrderAction.createPersonQueryWitoutContacts).then(function(ct) {
            context = ct;
            return cOrderAction.bookService(ct.serviceId);
        }).then(function (data) {
            fail("Турист без телефона не должен бронировать трансфер!");
            done();
        }).catch(function (response) {
            if(response.status == 418) {
                expect(response.data.error.services[0].persons[0].contacts.phones[0].prefix.id).toBe(1, "Должна быть валидация на телефон");
                done();
                return;
            }
            console.error(response);
            fail("Тест не работает!");
            done();
        });
    });

});