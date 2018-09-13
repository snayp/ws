describe("orders", function () {
    var wsApi = new WsApi(Settings.wsApiLocation);
    var cOrderAction = new CommonOrderAction(wsApi, payment);
    var payment = new Payment(Settings.paymentApiLocation, Settings.apiLocation);

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

    it("retrieve by last id", function (done) {
        wsApi.sendMessage("order", "create", null, function (data) {
            var orderId = data.id;
            
            var query = {
                lastid: orderId
            };
            wsApi.sendMessage("orders", "retrieve", query, function (data) {
                expect(data).not.toBeNull();
                expect(data.length).toBeGreaterThan(0);
                expect(data.id).not.toBeNull();
                expect(data.date).not.toBeNull();

                wsApi.sendMessage("order", "delete", {id: orderId}, function (data) {
                    done();
                });
            });
        });
    });

    it("retrieve 30 orders", function (done) {
        var query = {
            num : 30
        };
        wsApi.sendMessage("orders", "retrieve", query, function (data) {
            expect(data).not.toBeNull();
            expect(data.length).toBeGreaterThan(0);

            var firstOrder = data[0];
            expect(firstOrder.id).not.toBeNull();
            expect(firstOrder.date).not.toBeNull();

            done();
        });

    });

    it("retrieve 1 order by last id", function (done) {
        wsApi.sendMessage("order", "create", null, function (data) {
            var orderId = data.id;
            
            var query = {
                lastid: orderId,
                num: 1
            };
            wsApi.sendMessage("orders", "retrieve", query, function (data) {
                expect(data).not.toBeNull();
                expect(data.length).toBe(1);

                var firstOrder = data[0];
                expect(firstOrder.id).not.toBeNull();
                expect(firstOrder.date).not.toBeNull();
                
                wsApi.sendMessage("order", "delete", {id: orderId}, function (data) {
                    done();
                });
            });
        });
    });

    it("retrieve with filter by name", function (done) {
        const personQuery = {
            "name": {
                "first": "Test",
                "last": "ResttestREST"
            },
            "gender": "male"
        };
        wsApi.sendMessage("person", "create", personQuery, function (data) {
            expect(data).not.toBeNull();
            expect(data.id).not.toBeNull();
            var personId = data.id;

            wsApi.sendMessage("order", "create", {name: personId}, function (data) {
                var orderId = data.id;
                
                var ordersQuery = {
                    filter: {
                        search: {
                            query: personQuery.name.last
                        }
                    }
                };
                wsApi.sendMessage("orders", "retrieve", ordersQuery, function (data) {
                    expect(data).not.toBeNull();
                    expect(data.length).toBeGreaterThan(0);
                    var firstOrder = data[0];
                    expect(firstOrder.id).not.toBeNull();
                    expect(firstOrder.date).not.toBeNull();
                    expect(firstOrder.person).not.toBeNull();
                    expect(firstOrder.person.id).not.toBeNull();
                    expect(firstOrder.person.name).not.toBeNull();
                    expect(firstOrder.person.name.last).toBe(ordersQuery.filter.search.query);
                    
                    wsApi.sendMessage("person", "delete", {id: personId}, function (data) {
                        wsApi.sendMessage("order", "delete", {id: orderId}, function (data) {
                            done();
                        });
                    });
                });
            });
        });
    });

    it("retrieve orders with filter by status (OK)", function (done) {
        var ordersQuery = {
            filter: {
                status: {
                    id: 20
                }
            }
        };
        wsApi.sendMessage("orders", "retrieve", ordersQuery, function (data) {
            expect(data).not.toBeNull();
            expect(data.length).toBeGreaterThan(0);
            var firstOrder = data[0];
            expect(firstOrder.id).not.toBeNull();
            expect(firstOrder.date).not.toBeNull();
            expect(firstOrder.status).not.toBeNull();
            expect(firstOrder.status).toBe(20);
            if (data.length > 2) {
                var secondOrder = data[1];
                expect(secondOrder.id).not.toBeNull();
                expect(secondOrder.date).not.toBeNull();
                expect(secondOrder.status).not.toBeNull();
                expect(secondOrder.status).toBe(20);
                var thirdOrder = data[2];
                expect(thirdOrder.id).not.toBeNull();
                expect(thirdOrder.date).not.toBeNull();
                expect(thirdOrder.status).not.toBeNull();
                expect(thirdOrder.status).toBe(20);
            }
            done();
        });
    });

    it("retrieve orders with filter by status (BOOKED)", function (done) {
        var ordersQuery = {
            filter: {
                status: {
                    id: 10
                }
            }
        };
        wsApi.sendMessage("orders", "retrieve", ordersQuery, function (data) {
            expect(data).not.toBeNull();
            expect(data.length).toBeGreaterThan(0);
            var firstOrder = data[0];
            expect(firstOrder.id).not.toBeNull();
            expect(firstOrder.date).not.toBeNull();
            expect(firstOrder.status).not.toBeNull();
            expect(firstOrder.status).toBe(10);
            if (data.length > 2) {
                var secondOrder = data[1];
                expect(secondOrder.id).not.toBeNull();
                expect(secondOrder.date).not.toBeNull();
                expect(secondOrder.status).not.toBeNull();
                expect(secondOrder.status).toBe(10);
                var thirdOrder = data[2];
                expect(thirdOrder.id).not.toBeNull();
                expect(thirdOrder.date).not.toBeNull();
                expect(thirdOrder.status).not.toBeNull();
                expect(thirdOrder.status).toBe(10);
            }
            done();
        });
    });

    it("retrieve orders with filter by status (NOT BOOKED)", function (done) {
        var ordersQuery = {
            filter: {
                status: {
                    id: 70
                }
            }
        };
        wsApi.sendMessage("orders", "retrieve", ordersQuery, function (data) {
            expect(data).not.toBeNull();
            expect(data.length).toBeGreaterThan(0);
            var firstOrder = data[0];
            expect(firstOrder.id).not.toBeNull();
            expect(firstOrder.date).not.toBeNull();
            expect(firstOrder.status).not.toBeNull();
            expect(firstOrder.status).toBe(70);
            if (data.length > 2) {
                var secondOrder = data[1];
                expect(secondOrder.id).not.toBeNull();
                expect(secondOrder.date).not.toBeNull();
                expect(secondOrder.status).not.toBeNull();
                expect(secondOrder.status).toBe(70);
                var thirdOrder = data[2];
                expect(thirdOrder.id).not.toBeNull();
                expect(thirdOrder.date).not.toBeNull();
                expect(thirdOrder.status).not.toBeNull();
                expect(thirdOrder.status).toBe(70);
            }
            done();
        });
    });

    it("retrieve orders with filter by status (EXPIRED)", function (done) {
        var ordersQuery = {
            filter: {
                status: {
                    id: 73
                }
            }
        };
        wsApi.sendMessage("orders", "retrieve", ordersQuery, function (data) {
            expect(data).not.toBeNull();
            expect(data.length).toBeGreaterThan(0);
            var firstOrder = data[0];
            expect(firstOrder.id).not.toBeNull();
            expect(firstOrder.date).not.toBeNull();
            expect(firstOrder.status).not.toBeNull();
            expect(firstOrder.status).toBe(73);
            if (data.length > 2) {
                var secondOrder = data[1];
                expect(secondOrder.id).not.toBeNull();
                expect(secondOrder.date).not.toBeNull();
                expect(secondOrder.status).not.toBeNull();
                expect(secondOrder.status).toBe(73);
                var thirdOrder = data[2];
                expect(thirdOrder.id).not.toBeNull();
                expect(thirdOrder.date).not.toBeNull();
                expect(thirdOrder.status).not.toBeNull();
                expect(thirdOrder.status).toBe(73);
            }
            done();
        });
    });
 
    it("retrieve orders with filter by status (CANCELLED)", function (done) {
        var ordersQuery = {
            filter: {
                status: {
                    id: 80
                }
            }
        };
        wsApi.sendMessage("orders", "retrieve", ordersQuery, function (data) {
            expect(data).not.toBeNull();
            expect(data.length).toBeGreaterThan(0);
            var firstOrder = data[0];
            expect(firstOrder.id).not.toBeNull();
            expect(firstOrder.date).not.toBeNull();
            expect(firstOrder.status).not.toBeNull();
            expect(firstOrder.status).toBe(80);
            if (data.length > 2) {
                var secondOrder = data[1];
                expect(secondOrder.id).not.toBeNull();
                expect(secondOrder.date).not.toBeNull();
                expect(secondOrder.status).not.toBeNull();
                expect(secondOrder.status).toBe(80);
                var thirdOrder = data[2];
                expect(thirdOrder.id).not.toBeNull();
                expect(thirdOrder.date).not.toBeNull();
                expect(thirdOrder.status).not.toBeNull();
                expect(thirdOrder.status).toBe(80);
            }
            done();
        });
    });

    it("retrieve without tourists and payer", function(done) {                
        wsApi.sendMessage("test", "encodehoteloffer", { offer:cOrderAction.offer1Dto }, function(data) {
            expect(data.offer).not.toBeNull();
            var offer = data.offer;

            wsApi.sendMessage("order", "create", null, function (data) {
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

                    var ordersQuery = {
                        filter: {
                            search: {
                                query: orderId
                            }
                        }
                    };
                    wsApi.sendMessage("orders", "retrieve", ordersQuery, function (data) {
                        expect(data).not.toBeNull();
                        expect(data.length).toBeGreaterThan(0);
                        expect(data.length).toBe(1);
                        var firstOrder = data[0];
                        expect(firstOrder.id).not.toBeNull();
                        expect(firstOrder.date).not.toBeNull();
                        
                        wsApi.sendMessage("service", "delete", {service: serviceId}, function (data) {
                            wsApi.sendMessage("order", "delete", {id: orderId}, function (data) {
                                done();
                            });
                        });
                    });
                });
            });
        });
    }, 12000);

    it("search", function (done) {
        var personQuery = {
            "name": {
                "first": "Testing",
                "last": "Resttest"
            },
            "gender": "male",
            "birthday": 636854400000
        };
        wsApi.sendMessage("person", "create", personQuery, function (data) {
            expect(data).not.toBeNull();
            expect(data.id).not.toBeNull();
            var personId = data.id;
            var personName = personQuery.name.first;

            wsApi.sendMessage("order", "create", null, function (data) {
                var orderId = data.id;

                wsApi.sendMessage("order", "update", {id: orderId, name: personId}, function (data) {
                    
                    var ordersQuery = {
                        data: personName
                    };
                    wsApi.sendMessage("orders", "search", ordersQuery, function (data) {
                        expect(data).not.toBeNull();
                        expect(data.id).not.toBeNull();
                        expect(data.type).not.toBeNull();
                        expect(data.entity).not.toBeNull();

                        wsApi.sendMessage("order", "delete", {id: orderId}, function (data) {
                            wsApi.sendMessage("person", "delete", {id: personId}, function (data) {
                                done();
                            });
                        });
                    });
                });
            });
        });
    });

    it("compare order in search with single order", function(done) {
        var ct = {};
        wsApi.sendMessage2("test", "encodehoteloffer", { offer:cOrderAction.offer1Dto }).then(function(data) {
            expect(data.offer).not.toBeNull();
            ct.offer = data.offer;
            return wsApi.sendMessage2("order", "create");
        }).then(function (data) {
            expect(data).not.toBeNull();
            expect(data.id).not.toBeNull();
            ct.orderId = data.id;

            var createServiceQuery = {
                "type": "accommodation",
                "orderid": ct.orderId,
                "items": [{
                    "offer": ct.offer
                }]
            };
            return wsApi.sendMessage2("service", "create", createServiceQuery);
        }).then(function (data) {
            expect(data).not.toBeNull();
            expect(data.id).not.toBeNull();
            ct.serviceId = data.id;

            return wsApi.sendMessage2("order", "retrieve", {id: ct.orderId});
        }).then(function (data) {
            ct.order = data;
            return wsApi.sendMessage2("orders", "retrieve", {num: 5, filter:{search:{query:ct.orderId}}});
        }).then(function (data) {
            expect(data).not.toBeNull();
            expect(data.length).toBeGreaterThan(0);
            var sOrder = data[0];

            expect(ct.order.commerce.currency).toBe(sOrder.commerce.currency);
            expect(ct.order.commerce.payment).toBe(sOrder.commerce.payment, "Суммы должны быть одинаковыми в списке и при получении одного");
            expect(ct.order.commerce.tl).toBe(sOrder.commerce.tl);

            return wsApi.sendMessage2("order", "delete", {id:ct.orderId});
        }).then(function (data) {
            done();
        });
    }, 12000);
});