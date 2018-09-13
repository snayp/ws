describe("order", function () {
    var wsApi = new WsApi(Settings.wsApiLocation);
    var payment = new Payment(Settings.paymentApiLocation, Settings.apiLocation);
    var cOrderAction = new CommonOrderAction(wsApi, payment);
    var backofficeApi = new BackofficeApi(Settings.backofficeApiLocation);
    const PAYER_ID = Settings.payerId;
    
    var queryLogin = {
        key: generateUUID(),
        login: Settings.user.login,
        pass: Settings.user.pass
    };

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

    afterAll(function () {
        wsApi.sendMessage("account", "logout");
        wsApi.close();
        expect(true).toBeTruthy();
    });

    it("create and delete empty", function (done) {
        wsApi.sendMessage("order", "create", null, function (data) {
            expect(data).not.toBeNull();
            expect(data.id).not.toBeNull();
            var orderId = data.id;

            wsApi.sendMessage("order", "delete", { id:orderId }, function (data) {
                done();
            });
        });
    });

    it("create and delete with payer", function (done) {
        var context = {};
        wsApi.sendMessage2("person", "create", cOrderAction.createPersonQuery).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.id).not.toBeNull();
            context.personId = data.id;
            return wsApi.sendMessage2("order", "create", { name:context.personId });
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.id).not.toBeNull();
            context.orderId = data.id;
        }).then(function(data) {
            return wsApi.sendMessage2("order", "delete", { id:context.orderId });
        }).then(function(data) {
            wsApi.sendMessage2("person", "delete", { id:context.personId });
            
            done();
        });
    });

    it("update payer in order with 1 service", function (done) {
        var context = {};
        var queryPayer1 = {
           name: {
               first: "PayerFirst",
               last: "PayerovFirst"
           },
           gender: "male",
           birthday: 636854400000
        };
        wsApi.sendMessage2("person", "create", queryPayer1).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.id).not.toBeNull();
            context.payer1Id = data.id;
            return cOrderAction.addTransferToOrder(null, context.payer1Id);
        }).then(function(data) {
            context.orderId = data.orderId;
            expect(data).not.toBeNull();
            expect(data.id).not.toBeNull();
            expect(data.services).not.toBeNull();
            expect(data.id).not.toBeNull();
            expect(data.person).not.toBeNull();
            expect(data.person.id).not.toBeNull();
            expect(data.person.id).toBe(context.payer1Id);
            expect(data.person.name).not.toBeNull();
            context.payer2 = data.person;
            context.payer2.name.first = "PayerSecond";
            context.payer2.name.last = "PayerovSecond";
            return wsApi.sendMessage2("person", "update", { person:context.payer2 });
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.id).not.toBeNull();
            context.payer2.id = data.id;
            return sleep(5000).then(() => {
                return wsApi.sendMessage2("order", "retrieve", { id:context.orderId })
            });
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.person).not.toBeNull();
            expect(data.person.id).toBe(context.payer2.id);
            expect(data.person.name).not.toBeNull();
            expect(data.person.name.first).toBe("PayerSecond");
            expect(data.person.name.last).toBe("PayerovSecond");
            return wsApi.sendMessage2("order", "delete", { id:context.orderId });
        }).then(function() {
            return wsApi.sendMessage2("person", "delete", { id:context.payer1Id });
        }).then(function() {
            return wsApi.sendMessage2("person", "delete", { id:context.payer2.id });
        }).then(function() {
            done();
        });
    }, 15000);

    it("update payer in order (other owner but same agency)", function (done) {
        var context = {};
        var queryPayer = {
           name: {
               first: "Payer",
               middle: "resttest",
               last: "Payerov"
           },
           gender: "male",
           birthday: 636854400000
        };
        wsApi.sendMessage2("person", "create", queryPayer).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.id).not.toBeNull();
            context.payerId = data.id;
            var wsApi2 = new WsApi(Settings.wsApiLocation);
            wsApi2.open({
                open: function() {
                    var login = {
                        key: generateUUID(),
                        login: "agent007",
                        pass: "12345"
                    };
                    wsApi2.sendMessage2("account", "login", login).then(function(data) {
                        expect(data).not.toBeNull();
                        return wsApi2.sendMessage2("order", "create");
                    }).then(function(data) {
                        expect(data).not.toBeNull();
                        expect(data.id).not.toBeNull();
                        context.orderId = data.id;
                        return wsApi2.sendMessage2("order", "update", { id:context.orderId,name:context.payerId } )
                    }).then(function(data) {
                        wsApi2.sendMessage2("account", "logout");
                        done();
                    });
                }
            });
        });
    });

    it("update payer in order (other owner and other agency)", function (done) {
        var context = {};
        var queryPayer = {
           name: {
               first: "Payer",
               middle: "resttest",
               last: "Payerov"
           },
           gender: "male",
           birthday: 636854400000
        };
        wsApi.sendMessage2("person", "create", queryPayer).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.id).not.toBeNull();
            context.payerId = data.id;
            var wsApi2 = new WsApi(Settings.wsApiLocation);
            wsApi2.open({
                open: function() {
                    var login = {
                        key: generateUUID(),
                        login: "wssrest",
                        pass: "wssrest"
                    };
                    wsApi2.sendMessage2("account", "login", login).then(function(data) {
                        expect(data).not.toBeNull();
                        return wsApi2.sendMessage2("order", "create");
                    }).then(function(data) {
                        expect(data).not.toBeNull();
                        expect(data.id).not.toBeNull();
                        context.orderId = data.id;
                        return wsApi2.sendMessage2("order", "update", { id:context.orderId,name:context.payerId } )
                    }).catch(function(response) {
                        expect(response).not.toBeNull();
                        expect(response.status).not.toBeNull();
                        expect(response.status).toBe(403);
                        wsApi2.sendMessage2("account", "logout");
                        done();
                    });
                }
            });
        });
    });

    it("create and delete with payer and service", function(done) {
        wsApi.sendMessage("test", "encodehoteloffer", { offer:cOrderAction.offer11Dto }, function(data) {
            expect(data.offer).not.toBeNull();
            var offer = data.offer;

            var createPersonQuery = {
                "name": {
                    "first": "Test",
                    "last": "Test"
                },
                "gender": "male",
                "birthday": 636854400000
            };
            wsApi.sendMessage("person", "create", createPersonQuery, function (data) {
                expect(data).not.toBeNull();
                expect(data.id).not.toBeNull();
                var personId = data.id;

                wsApi.sendMessage("order", "create", {name:personId}, function (data) {
                    expect(data).not.toBeNull();
                    expect(data.id).not.toBeNull();
                    var orderId = data.id;

                    var createServiceQuery = {
                        "type": "accommodation",
                        "orderid" : orderId,
                        "items" : [{
                            "offer" : offer
                        }]
                    };
                    wsApi.sendMessage("service", "create", createServiceQuery, function (data) {
                        expect(data).not.toBeNull();
                        expect(data.id).not.toBeNull();
                        serviceId = data.id;

                        wsApi.sendMessage("order", "retrieve", {id: orderId}, function (data) {
                            var service = data.services[0];
                            expect(data).not.toBeNull();
                            expect(data.id).not.toBeNull();
                            expect(data.id).toBe(orderId);
                            expect(data.date).not.toBeNull();
                            var person = data.person;
                            expect(person).not.toBeNull();
                            expect(person.id).not.toBeNull();
                            expect(person.name.first).not.toBeNull();
                            expect(person.name.first).toBe(createPersonQuery.name.first);
                            expect(person.name.last).not.toBeNull();
                            expect(person.name.last).toBe(createPersonQuery.name.last);
                            expect(data.commerce.payment).not.toBeNull();
                            expect(data.commerce.currency).not.toBeNull();
                            expect(data.services).not.toBeNull();
                            expect(data.services.length).toBeGreaterThan(0);
                            expect(data.services.length).toBe(1);
                            var service = data.services[0];
                            expect(service.type).not.toBeNull();
                            expect(service.type).toBe("accommodation");
                            expect(service.id).not.toBeNull();
                            expect(service.commerce.payment).not.toBeNull();
                            expect(service.commerce.original).not.toBeNull();
                            expect(service.commerce.original).toBe(parseFloat((145 / 0.9).toFixed(2)));
                            expect(service.commerce.currency).not.toBeNull();
                            expect(service.commerce.currency).toBe(978);
                            expect(service.commerce.tl).not.toBeNull();
                            expect(service.items[0]).not.toBeNull();
                            expect(service.items[0].length).toBeGreaterThan(0);
                            expect(service.items[0][0]).not.toBeNull();
                            var item = service.items[0][0];
                            expect(item.meal).toBe("ONLY BED");
                            expect(item.type).toBe("ROOM ONLY");
                            expect(item.adults).toBe(2);
                        
                            wsApi.sendMessage("service", "delete", {service: serviceId}, function (data) {
                                wsApi.sendMessage("person", "delete", {id: personId}, function (data) {
                                    wsApi.sendMessage("order", "delete", {id:orderId}, function (data) {    
                                        done();
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    }, 12000);

    it("retrieve empty with payer", function (done) {
        var query = {
            "name": {
                "first": "Test",
                "last": "Test"
            },
            "gender": "male",
            "birthday": 636854400000
        };

        wsApi.sendMessage("person", "create", query, function (data) {
            expect(data).not.toBeNull();
            expect(data.id).not.toBeNull();
            var personId = data.id;

            wsApi.sendMessage("order", "create", {name:personId}, function (data) {
                expect(data).not.toBeNull();
                expect(data.id).not.toBeNull();
                var orderId = data.id;

                wsApi.sendMessage("order", "retrieve", {id:orderId}, function (data) {
                    expect(data).not.toBeNull();
                    expect(data.id).not.toBeNull();
                    expect(data.id).toBe(orderId);
                    expect(data.date).not.toBeNull();
                    var person = data.person;
                    expect(person).not.toBeNull();
                    expect(person.id).not.toBeNull();
                    expect(person.name.first).not.toBeNull();
                    expect(person.name.first).toBe(query.name.first);
                    expect(person.name.last).not.toBeNull();
                    expect(person.name.last).toBe(query.name.last);

                    wsApi.sendMessage("order", "delete", {id:orderId}, function (data) {
                        wsApi.sendMessage("person", "delete", {"id" : personId}, function (data) {
                            done();
                        });
                    });
                });
            });
        });
    }, 10000);

    it("can't be shown by not owner", function (done) {
        var context = {};
        wsApi.sendMessage2("order", "create").then(function(data) {
            expect(data).not.toBeNull();
            expect(data.id).not.toBeNull();
            context.orderId = data.id;
            var wsApi2 = new WsApi(Settings.wsApiLocation);
            wsApi2.open({
                open: function () {
                    var login2 = {
                        key: generateUUID(),
                        login: "wssrest",
                        pass: "wssrest"
                    };
                    wsApi2.sendMessage2("account", "login", login2).then(function(data) {
                        expect(data).not.toBeNull();
                        return wsApi2.sendMessage2("order", "retrieve", { id:context.orderId }).then(function(data){
                            fail("Доступ к чужому заказу был получен!");
                            done();
                        });
                    }).catch(function(response) {
                        expect(response.status).not.toBe(200);
                        wsApi2.sendMessage2("account", "logout");

                        done();
                    });
                }
            });
        });
    });

    it("has access in same agency for all agents", function (done) {
        var context = {};
        wsApi.sendMessage2("order", "create").then(function(data) {
            expect(data).not.toBeNull();
            expect(data.id).not.toBeNull();
            context.orderId = data.id;
            var wsApi2 = new WsApi(Settings.wsApiLocation);
            wsApi2.open({
                open: function () {
                    var login2 = {
                        key: generateUUID(),
                        login: "agent007",
                        pass: "12345"
                    };
                    wsApi2.sendMessage2("account", "login", login2).then(function(data) {
                        expect(data).not.toBeNull();
                        return wsApi2.sendMessage2("order", "retrieve", { id:context.orderId });
                    }).then(function(data) {
                        expect(data).not.toBeNull();
                        expect(data.id).not.toBeNull();
                        wsApi2.sendMessage2("account", "logout");

                        done();
                    });
                }
            });
        });
    });

    it("book order with acc and payer", function(done) {
        var context = {};
        cOrderAction.createOrderWith1Service(cOrderAction.offer1Dto, "encodehoteloffer", "accommodation", 0, PAYER_ID).then(function(data) {
            context = data;
            return cOrderAction.bookService(context.serviceId);
        }).then(function(data) {
            return sleep(3000).then(() => {
                return wsApi.sendMessage2("order", "retrieve", { id:context.orderId });
            });
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.status).toBe(10);
            expect(data.services).not.toBeNull();
            expect(data.services.length).toBe(1);
            expect(data.services[0].status).toBe(10);

            done();
        });
    }, 20000);

    it("if payed with three services from deposit and one service can't be booked, deposit don`t refunded", function(done) {
        var context = {};
        context.settings = {
            "settings": {
                "lang": "en",
                "payment": "978"
            }
        };
        var wsApi2 = new WsApi(Settings.wsApiLocation);
        wsApi2.open({
            open: function () {
                wsApi2.sendMessage2("account", "login", queryLogin).then(function (data) {
                    expect(data).not.toBeNull();
                    context.startDeposit = data.deposits.filter(deposit => Object.is(deposit.id, "978"))[0];
                    context.euroDeposit = {
                        "978": parseFloat((245 / 0.9).toFixed(2)) + parseFloat((245 / 0.9).toFixed(2)) + parseFloat((145 / 0.9).toFixed(2)),
                        payer : PAYER_ID
                    };
                    return wsApi2.sendMessage2("settings", "update", context.settings);
                }).then(function (data) {
                    return wsApi2.sendMessage2("deposit", "add", context.euroDeposit);
                }).then(function (data) {
                    expect(data).not.toBeNull();
                    expect(data.url).not.toBeNull();
                    expect(data.transaction).not.toBeNull();
                    context.trId = data.transaction;
                    return payment.getPaymentDepositInfo(parseFloat((245 / 0.9).toFixed(2)) + parseFloat((245 / 0.9).toFixed(2)) + parseFloat((145 / 0.9).toFixed(2)), "EUR");
                }).then(function (data) {
                    data.transaction = context.trId;
                    return payment.doPay(JSON.stringify(data), true);
                }).then(function (data) {
                    return cOrderAction.createOrderWithServices(cOrderAction.offer1Dto, cOrderAction.offer2Dto);
                }).then(function (ct) {
                    context.orderId = ct.orderId;
                    context.personId = ct.personId;
                    context.service1Id = ct.service1Id;
                    context.service2Id = ct.service2Id;
                    return wsApi.sendMessage2("test", "encodehoteloffer", {offer: cOrderAction.offer3Dto});
                }).then(function (data) {
                    expect(data.offer).not.toBeNull();
                    var offer3 = data.offer;
                    //create service
                    var createServiceQuery = {
                        "type": "accommodation",
                        "orderid": context.orderId,
                        "items": [{
                            "offer": offer3
                        }]
                    };
                    return wsApi.sendMessage2("service", "create", createServiceQuery);
                }).then(function(data) {
                    expect(data).not.toBeNull();
                    expect(data.id).not.toBeNull();
                    context.service3Id = data.id;
                    return wsApi2.sendMessage2("order", "retrieve", {id: context.orderId});
                }).then(function (data) {
                    var service3 = data.services[0];
                    var linkQuery3 = {
                        "service": context.service3Id,
                        "tourist": context.personId,
                        "item": 0
                    };
                    return wsApi2.sendMessage2("service", "linktourist", linkQuery3);
                }).then(function (data) {
                    return cOrderAction.payOrderDeposit(context.orderId);
                }).then(function (order) {
                    expect(order.status).not.toBeNull();
                    expect(order.status).toBe(20, "Если в заказе есть сервис со статусом OK, то весь заказ ОК");
                    return wsApi2.sendMessage2("account", "login", queryLogin);
                }).then(function (data) {
                    context.pp = cOrderAction.offer3Dto.mrt[0].pp;
                    context.payment = parseFloat((context.pp / 0.9).toFixed(2));
                    expect(data).not.toBeNull();
                    var currentDeposit = data.deposits.filter(deposit => Object.is(deposit.id, "978"))[0];
                    expect(currentDeposit.amount).toBe(context.startDeposit.amount);
                    backofficeApi.token = data.token;
                }).then(function (data) {
                    return backofficeApi.paymentStatus(context.service1Id);
                }).then(function(data) {
                    expect(data[0].status).toBe("PAID");
                    expect(data[1].status).toBe("PAID");
                    expect(data[2].status).toBe("PAID");
                    var pp = cOrderAction.offer1Dto.pp;
                    expect(data[2].netto).toBe(parseFloat((pp / 0.9).toFixed(2)));
                    return backofficeApi.paymentStatus(context.service2Id);
                }).then(function (data) {
                    expect(data[0].status).toBe("PAID");
                    expect(data[1].status).toBe("PAID");
                    expect(data[2].status).toBe("PAID");
                    var pp = cOrderAction.offer2Dto.pp;
                    expect(data[2].netto).toBe(parseFloat((pp / 0.9).toFixed(2)));
                    return backofficeApi.paymentStatus(context.service3Id);
                }).then(function (data) {
                    expect(data[0].status).toBe("NOT_PAID");
                    expect(data[1].status).toBe("REFUND");
                    expect(data[2].status).toBe("REFUND");
                    var pp = cOrderAction.offer3Dto.pp;
                    expect(data[2].netto).toBe(parseFloat((pp / 0.9).toFixed(2)));

                    done();
                }).catch(function (response) {
                    console.error(response);
                    fail("Тест не работает!");
                    done();
                });
            }
        });
    }, 50000);

    it("success pay with one service from deposit", function (done) {
        var context = {};
        wsApi.sendMessage2("account", "login", queryLogin)
        .then(function (data) {
            expect(data).not.toBeNull();
            context.startDeposit = data.deposits.filter(deposit => Object.is(deposit.id, "978"))[0];
        }).then(function(data) {
            var settingsQuery  = {
                "settings": {
                    "lang": "en",
                    "payment": "978"
                }
            };
            return wsApi.sendMessage2("settings", "update", settingsQuery);
        }).then(function (data) {
            context.pp = cOrderAction.offer1Dto.pp;
            context.payment = parseFloat((context.pp / 0.9).toFixed(2));
            return wsApi.sendMessage2("deposit", "add", {"978": context.payment, payer: PAYER_ID});
        }).then(function (data) {
            expect(data).not.toBeNull();
            expect(data.url).not.toBeNull();
            expect(data.transaction).not.toBeNull();
            context.trId = data.transaction;
            return payment.getPaymentDepositInfo(context.payment, "EUR");
        }).then(function (data) {
            data.transaction = context.trId;
            return payment.doPay(JSON.stringify(data), true);
        }).then(function (data) {
            return cOrderAction.createOrderWith1Service(cOrderAction.offer1Dto, "encodehoteloffer", "accommodation", 0, PAYER_ID);
        }).then(function(ct) {
            context.orderId = ct.orderId;
            context.serviceId = ct.service1Id;
            context.personId = ct.personId;
            context.roomOffer = ct.room1Offer;
            return cOrderAction.payOrderDeposit(context.orderId);
        }).then(function(order) {
            expect(order.status).not.toBeNull();
            expect(order.status).toBe(20);
            return wsApi.sendMessage2("account", "login", queryLogin);
        }).then(function (data) {
            expect(data).not.toBeNull();
            var currentDeposit = data.deposits.filter(deposit => Object.is(deposit.id, "978"))[0];
            expect(currentDeposit.amount).toBe(context.startDeposit.amount);
            done();
        }).catch(function (response) {
            console.error(response);
            fail("Тест не работает!");
            done();
        });
    }, 40000);

    it("pay with one service from deposit which can't be booked deposit don`t refunded", function (done) {
        var context = {};
        wsApi.sendMessage2("account", "login", queryLogin)
            .then(function (data) {
                expect(data).not.toBeNull();
                context.startDeposit = data.deposits.filter(deposit => Object.is(deposit.id, "978"))[0];
            }).then(function (data) {
            var settingsQuery = {
                "settings": {
                    "lang": "en",
                    "payment": "978"
                }
            };
            return wsApi.sendMessage2("settings", "update", settingsQuery);
        }).then(function (data) {
            context.pp = cOrderAction.offer3Dto.pp;
            context.payment = parseFloat((context.pp / 0.9).toFixed(2));
            return wsApi.sendMessage2("deposit", "add", {"978": context.payment, payer: PAYER_ID});
        }).then(function (data) {
            expect(data).not.toBeNull();
            expect(data.url).not.toBeNull();
            expect(data.transaction).not.toBeNull();

            context.trId = data.transaction;
            return payment.getPaymentDepositInfo(context.payment, "EUR");
        }).then(function (data) {
            data.transaction = context.trId;
            return payment.doPay(JSON.stringify(data), true);
        }).then(function (data) {
            return cOrderAction.createOrderWith1Service(cOrderAction.offer3Dto, "encodehoteloffer", "accommodation", 0, PAYER_ID);
        }).then(function (ct) {
            context.orderId = ct.orderId;
            context.serviceId = ct.serviceId;
            context.personId = ct.personId;
            context.roomOffer = ct.room1Offer;
            return cOrderAction.payOrderDeposit(context.orderId);
        }).then(function (order) {
            expect(order.status).not.toBeNull();
            expect(order.status).toBe(70);
            return wsApi.sendMessage2("account", "login", queryLogin);
        }).then(function (data) {
            expect(data).not.toBeNull();
            var currentDeposit = data.deposits.filter(deposit => Object.is(deposit.id, "978"))[0];
            expect(currentDeposit.amount).toBe(context.startDeposit.amount, "Ожидается, что на депозит сразу деньги не вернуться");
            backofficeApi.token = data.token;
        }).then(function (data) {
            return backofficeApi.paymentStatus(context.serviceId);
        }).then(function (data) {
            expect(data[0].status).toBe("NOT_PAID");
            expect(data[1].status).toBe("REFUND");
            expect(data[2].status).toBe("REFUND");
            expect(data[2].netto).toBe(context.payment);
            done();
        }).catch(function (response) {
            console.error(response);
            fail("Тест не работает!");
            done();
        });
    }, 45000);

    it("pay order from deposit twice, deposit should be used once", function(done) {
        var context = {};
        wsApi.sendMessage2("account", "login", queryLogin)
            .then(function(data) {
                expect(data).not.toBeNull();
                context.startDeposit = data.deposits.filter(deposit => Object.is(deposit.id, "978"))[0];
            }).then(function(data) {
            var settingsQuery = {
                "settings": {
                    "lang": "en",
                    "payment": "978"
                }
            };
            return wsApi.sendMessage2("settings", "update", settingsQuery);
        }).then(function(data) {
            return wsApi.sendMessage2("deposit", "add", {"978": 161.11, payer: PAYER_ID});
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.url).not.toBeNull();
            expect(data.transaction).not.toBeNull();

            context.trId = data.transaction;
            return payment.getPaymentDepositInfo(161.11, "EUR");
        }).then(function(data) {
            data.transaction = context.trId;
            return payment.doPay(JSON.stringify(data), true);

        }).then(function(data) {
            return cOrderAction.createOrderWith1Service(cOrderAction.offer1Dto, "encodehoteloffer", "accommodation", 0, PAYER_ID);
        }).then(function(ct) {
            context.orderId = ct.orderId;
            context.serviceId = ct.service1Id;
            context.personId = ct.personId;
            context.roomOffer = ct.room1Offer;
            return cOrderAction.payOrderDeposit(context.orderId);
        }).then(function(order) {
            expect(order.status).not.toBeNull();
            expect(order.status).toBe(20);
            return wsApi.sendMessage2("account", "login", queryLogin);
        }).then(function(data) {
            expect(data).not.toBeNull();
            var currentDeposit = data.deposits.filter(deposit => Object.is(deposit.id, "978"))[0];
            expect(currentDeposit.amount).toBe(context.startDeposit.amount);
        }).then(function(data) {
            return cOrderAction.payOrderDeposit(context.orderId);
        }).then(function(data) {
            return wsApi.sendMessage2("account", "login", queryLogin);
        }).then(function(data) {
            var currentDeposit = data.deposits.filter(deposit => Object.is(deposit.id, "978"))[0];
            expect(currentDeposit.amount).toBe(context.startDeposit.amount);
            done();
        }).catch(function (response) {
            console.error(response);
            fail("Тест не работает!");
            done();
        });
    }, 45000);

    it("pay order with two services from deposit one service always paid", function (done) {
        var context = {};
        wsApi.sendMessage2("account", "login", queryLogin)
            .then(function (data) {
                expect(data).not.toBeNull();
                context.startDeposit = data.deposits.filter(deposit => Object.is(deposit.id, "978"))[0];;
            }).then(function (data) {
            var settingsQuery = {
                "settings": {
                    "lang": "en",
                    "payment": "978"
                }
            };
            return wsApi.sendMessage2("settings", "update", settingsQuery);
        }).then(function (data) {
            context.pp1 = cOrderAction.offer1Dto.pp;
            context.pp2 = cOrderAction.offer2Dto.pp;
            context.payment1 = parseFloat((context.pp1 / 0.9).toFixed(2));
            context.payment2 = parseFloat((context.pp2 / 0.9).toFixed(2));
            return wsApi.sendMessage2("deposit", "add", {"978": context.payment1 + context.payment2, payer: PAYER_ID});
        }).then(function (data) {
            expect(data).not.toBeNull();
            expect(data.url).not.toBeNull();
            expect(data.transaction).not.toBeNull();

            context.trId = data.transaction;
            return payment.getPaymentDepositInfo(context.payment1 + context.payment2, "EUR");
        }).then(function (data) {
            data.transaction = context.trId;
            return payment.doPay(JSON.stringify(data), true);

        }).then(function (data) {
            return cOrderAction.createOrderWith1Service(cOrderAction.offer1Dto, "encodehoteloffer", "accommodation", 0, PAYER_ID);
        }).then(function (ct) {
            context.orderId = ct.orderId;
            context.service1Id = ct.service1Id;
            context.personId = ct.personId;
            context.roomOffer = ct.room1Offer;
            return cOrderAction.payOrderDeposit(context.orderId);
        }).then(function (order) {
            expect(order.status).not.toBeNull();
            expect(order.status).toBe(20);
            return wsApi.sendMessage2("test", "encodehoteloffer", {offer: cOrderAction.offer2Dto});
        }).then(function (data) {
            expect(data.offer).not.toBeNull();
            var offer2 = data.offer;
            //create service
            var createService2Query = {
                "type": "accommodation",
                "orderid": context.orderId,
                "items": [{
                    "offer": offer2
                }]
            };
            return wsApi.sendMessage2("service", "create", createService2Query);
        }).then(function (data) {
            expect(data).not.toBeNull();
            expect(data.id).not.toBeNull();
            context.service2Id = data.id;

            return wsApi.sendMessage2("order", "retrieve", {id: context.orderId});
        }).then(function (data) {
            expect(data).not.toBeNull();
            expect(data.services).not.toBeNull();
            expect(data.services.length).toBeGreaterThan(0);

            var linkQuery2 = {
                "service": context.service2Id,
                "tourist": context.personId,
                "item": 0
            };
            return wsApi.sendMessage2("service", "linktourist", linkQuery2);
        }).then(function (data) {
            return cOrderAction.payOrderDeposit(context.orderId);
        }).then(function (order) {
            expect(order.status).not.toBeNull();
            expect(order.status).toBe(20);

            return wsApi.sendMessage2("account", "login", queryLogin);
        }).then(function (data) {
            expect(data).not.toBeNull();
            var currentDeposit = data.deposits.filter(deposit => Object.is(deposit.id, "978"))[0];
            expect(currentDeposit.amount).toBe(context.startDeposit.amount);
            done();
        }).catch(function (response) {
            console.error(response);
            fail("Тест не работает!");
            done();
        });
    }, 45000);

    it("pay order with two services from card one service always paid", function(done) {
        var context = {};
        wsApi.sendMessage2("account", "login", queryLogin).then(function(data) {
                expect(data).not.toBeNull();
                context.startDeposit = data.deposits.filter(deposit => Object.is(deposit.id, "978"))[0];
            }).then(function(data) {
            var settingsQuery = {
                settings: {
                    lang: "en",
                    payment: "978"
                }
            };
            return wsApi.sendMessage2("settings", "update", settingsQuery);
        }).then(function(data) {
            var pp1 = cOrderAction.offer1Dto.pp;
            var pp2 = cOrderAction.offer2Dto.pp;
            context.payment = parseFloat((parseFloat((pp1 / 0.9).toFixed(2)) + parseFloat((pp2 / 0.9).toFixed(2))).toFixed(2));
            return cOrderAction.createOrderWith1Service(cOrderAction.offer1Dto, "encodehoteloffer", "accommodation", 0, PAYER_ID);
        }).then(function(ct) {
            context.orderId = ct.orderId;
            context.service1Id = ct.service1Id;
            context.personId = ct.personId;
            return cOrderAction.payOrderCard(context.orderId);
        }).then(function(order) {
            expect(order.status).not.toBeNull();
            expect(order.status).toBe(20);
            return wsApi.sendMessage2("test", "encodehoteloffer", { offer:cOrderAction.offer2Dto });
        }).then(function (data) {
            expect(data.offer).not.toBeNull();
            var offer2 = data.offer;
            //create service
            var createService2Query = {
                "type": "accommodation",
                "orderid": context.orderId,
                "items": [{
                    "offer": offer2
                }]
            };
            return wsApi.sendMessage2("service", "create", createService2Query);
        }).then(function (data) {
            expect(data).not.toBeNull();
            expect(data.id).not.toBeNull();
            context.service2Id = data.id;
            return wsApi.sendMessage2("order", "retrieve", { id:context.orderId });
        }).then(function (data) {
            expect(data).not.toBeNull(); 
            expect(data.commerce.payment).toBe(context.payment);
            var linkQuery2 = {
                "service": context.service2Id,
                "tourist": context.personId,
                "item": 0
            };
            return wsApi.sendMessage2("service", "linktourist", linkQuery2);
        }).then(function(data) {
            return cOrderAction.payOrderCard(context.orderId);
        }).then(function(order) {
            expect(order.status).not.toBeNull();
            expect(order.status).toBe(20);
            return wsApi.sendMessage2("account", "login", queryLogin);
        }).then(function(data) {
            expect(data).not.toBeNull();
            var currentDeposit = data.deposits.filter(deposit => Object.is(deposit.id, "978"))[0];
            expect(currentDeposit.amount).toBe(context.startDeposit.amount);
            
            done();
        }).catch(function (response) {
            console.error(response);
            fail("Тест не работает!");
            done();
        });
    }, 55000);
});
