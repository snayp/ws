describe("accommodation service(b2c)", function () {
    var wsApi = new WsApi(Settings.wsApiLocation);
    var hotel, room, offerSearch, orderId, serviceId;
    var payment = new Payment(Settings.paymentApiLocation, Settings.apiLocation, Settings.userB2C.login, Settings.userB2C.pass);
    var cOrderAction = new CommonOrderAction(wsApi, payment);

    var settings = {
        "settings": {
            "lang": "en",
            "payment": "978"
        }
    };
    //между "Provider for autotest" и "Herma LTD" ничего нет в общем случае
    // между "Herma LTD" и "Herma B2C" 25% маркап и 10% дискаунт
    // "Herma B2C" Final: 60% маркап и 10% дискаунт
    function calculateExpectedPaymentForTest (pp) {

        let markupInFirstPayment = halfUp(halfUp(pp / 0.75, 10000) - pp);
        let discountInFirstPayment = halfUp((pp + markupInFirstPayment) * 0.1);
        let totalFinalInFirstPayment = halfUp(pp + markupInFirstPayment - discountInFirstPayment);

        let nettoForSecondPayment = halfUp(totalFinalInFirstPayment + discountInFirstPayment);
        // умножаем и делим на 10000 из-за 0.1 + 0.2 = 0.30000000000000004 в javascript
        let markupInSecondPayment = halfUp( ( ( halfUp(nettoForSecondPayment / 0.4, 10000) * 10000 - nettoForSecondPayment * 10000) / 10000) );
        let discountInSecondPayment = halfUp((nettoForSecondPayment + markupInSecondPayment) * 0.1);
        let totalFinalInSecondPayment = halfUp(nettoForSecondPayment + markupInSecondPayment - discountInSecondPayment);

        let result = totalFinalInSecondPayment;
        console.log("markupInFirstPayment:" + markupInFirstPayment + ", discountInFirstPayment:" + discountInFirstPayment + ", totalFinalInFirstPayment:" + totalFinalInFirstPayment +
            ", nettoForSecondPayment:" + nettoForSecondPayment + "markupInSecondPayment" + markupInSecondPayment + "discountInSecondPayment" + discountInSecondPayment + ", result:" + result);
        return result;
    }
    function calculateExpectedTPaymentForTest (pp) {
        let markupInFirstPayment = halfUp(halfUp(pp / 0.75, 10000) - pp);
        let discountInFirstPayment = halfUp((pp + markupInFirstPayment) * 0.1);
        let totalFinalInFirstPayment = halfUp(pp + markupInFirstPayment - discountInFirstPayment);

        return totalFinalInFirstPayment;
    }


    beforeEach(function(done) {   
        if (!wsApi.isWsAlive()) {
            wsApi = new WsApi(Settings.wsApiLocation);
            cOrderAction = new CommonOrderAction(wsApi, payment);
            wsApi.open({
                open : function () {
                    let query = {
                        key: generateUUID(),
                        login: Settings.userB2C.login,
                        pass: Settings.userB2C.pass
                    };
                    wsApi.sendMessage("account", "login", query, function (data) {
                        expect(data).not.toBeNull();
                        expect(data.login).not.toBeNull();
                        expect(data.agent).toBeFalsy();
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

    it("search with category filter", function (done) {
        var query = {
            place: {
                "in": "CI861854PA"
            },
            num: 5,
            date: {
                "in": new Date().getTime() + 60 * 60 * 24 * 40 * 1000,
                "out": new Date().getTime() + 60 * 60 * 24 * 42 * 1000
            },
            families: [
                {
                    "adults": 1
                }
            ],
            filters: {
                "cat": [false, true, false]
            },
            providers: ["test"]
        };
        wsApi.sendMessage("service", "accommodation", query, function (data) {
            expect(data).not.toBeNull();
            expect(data.search).not.toBeNull();
            expect(data.search.length).toBeGreaterThan(0);
            expect(data.search.length).toBe(1);
            var search = data.search[0];
            expect(search.info).not.toBeNull();  
            expect(search.info.cat).toBe(1);
            
            done();
        });
    });

    it("search with min price filter", function (done) {
        var query = {
            place: {
                "in": "CI861854PA"
            },
            num: 5,
            date: {
                "in": new Date().getTime() + 60 * 60 * 24 * 40 * 1000,
                "out": new Date().getTime() + 60 * 60 * 24 * 41 * 1000
            },
            families: [
                {
                    "adults": 1
                }
            ],
            filters: {
                price: [650, null]
            },
            providers: ["test"]
        };
        
        wsApi.sendMessage("service", "accommodation", query, function (data) {
            expect(data).not.toBeNull();
            expect(data.search).not.toBeNull();
            expect(data.search.length).toBeGreaterThan(0);
            expect(data.search.length).toBe(4);
            
            done();
        });
    });

    it("search with max price filter", function (done) {
        var query = {
            place: {
                "in": "CI861854PA"
            },
            num: 5,
            date: {
                "in": new Date().getTime() + 60 * 60 * 24 * 40 * 1000,
                "out": new Date().getTime() + 60 * 60 * 24 * 41 * 1000
            },
            families: [
                {
                    "adults": 1
                }
            ],
            filters: {
                "price": [0, 750]
            },
            providers: ["test"]
        };
        
        wsApi.sendMessage("service", "accommodation", query, function (data) {
            expect(data).not.toBeNull();
            expect(data.search).not.toBeNull();
            expect(data.search.length).toBeGreaterThan(0);
            const maxPrice = query.filters.price[1];
            data.search.forEach((h,i) => {
                expect(h.items[0][0].commerce.tpayment).toBeLessThan(maxPrice, "Максимальная цена в ответе " + maxPrice + " EUR");
            });

            
            done();
        });
    }, 15000);

    it("search with refund filter", function (done) {
        var query = {
            place: {
                "in": "CI861854PA"
            },
            num: 5,
            date: {
                "in": new Date().getTime() + 60 * 60 * 24 * 40 * 1000,
                "out": new Date().getTime() + 60 * 60 * 24 * 42 * 1000
            },
            families: [
                {
                    "adults": 1
                }
            ],
            filters: {
                "ref": [true, false]
            },
            providers: ["test"]
        };
        
        wsApi.sendMessage("service", "accommodation", query, function (data) {
            expect(data).not.toBeNull();
            expect(data.search).not.toBeNull();
            expect(data.search.length).toBeGreaterThan(0);
            expect(data.search.length).toBe(4);
            
            done();
        });
    });

    it("search with non refund filter", function (done) {
        var query = {
            place: {
                "in": "CI861854PA"
            },
            num: 5,
            date: {
                "in": new Date().getTime() + 60 * 60 * 24 * 40 * 1000,
                "out": new Date().getTime() + 60 * 60 * 24 * 42 * 1000
            },
            families: [
                {
                    "adults": 1
                }
            ],
            filters: {
                "ref": [false, true]
            },
            providers: ["test"]
        };
        
        wsApi.sendMessage("service", "accommodation", query, function (data) {
            expect(data).not.toBeNull();
            expect(data.search).not.toBeNull();
            expect(data.search.length).toBeGreaterThan(0);
            expect(data.search.length).toBe(1);
            
            done();
        });
    });

    it("search long time (test provider)", function (done) {
        var query = {
            place: {
                "in": "HO236794MO"
            },
            num: 5,
            lastid: 0,
            date: {
                "in": new Date().getTime() + 60 * 60 * 24 * 40 * 1000,
                "out": new Date().getTime() + 60 * 60 * 24 * 42 * 1000
            },
            families: [
                {
                    "adults": 2
                }
            ],
            providers: ["test"]
        };
        wsApi.sendMessage("service", "accommodation", query, function(data) {
            //ответ пришел через 5 секунд, пустой и done false
            expect(data).not.toBeNull();
            expect(data.search).not.toBeUndefined();
            expect(data.search).not.toBeNull();
            expect(data.done).not.toBeNull();
            expect(data.done).toBe(false);
          
            var validateResponse = function(data){
                expect(data.search).not.toBeUndefined();
                expect(data.search).not.toBeNull();
                expect(data.search.length).toBeGreaterThan(0);
                expect(data.done).not.toBeNull();
        
                //check search
                var search = data.search[0];
                expect(search.payment).not.toBeNull();
        
                var hotel = search.info;
                expect(hotel).not.toBeNull();
                expect(hotel.id).not.toBeNull();
                expect(hotel.name).not.toBeNull();
                expect(hotel.cat).not.toBeNull();
                //items[0]
                expect(search.items[0]).not.toBeNull();
                expect(search.items[0].length).toBe(1);
        
                var room = search.items[0][0];
                expect(room.offer).not.toBeNull();
                expect(room.type).not.toBeNull();
                expect(room.meal).not.toBeNull();
                expect(room.payment).not.toBeNull();
                expect(room.original).not.toBeNull();
                expect(room.currency).not.toBeNull();
                expect(room.tl).not.toBeNull();
                done();
            };

            var paginationQuery = function (query) {
                wsApi.sendMessage("service", "accommodation", query, function(data) {
                    expect(data.search).not.toBeUndefined();
                    expect(data.done).not.toBeNull();
        
                    if (!data.done) {
                        setTimeout(function() {
                            paginationQuery(query);
                        }, 1000);
                    } else {
                        validateResponse(data);
                    }
                });
            };

            //запрашиваем ещё
            paginationQuery(query);
        });
    }, 15000);

    it("create (manual) and delete", function (done) {
        wsApi.sendMessage("test", "encodehoteloffer", {offer: cOrderAction.offer1Dto}, function (data) {
            expect(data.offer).not.toBeNull();
            var offer = data.offer;

            //create order and service
            wsApi.sendMessage("order", "create", null, function (data) {
                var orderId = data.id;

                //create service
                var createServiceQuery = {
                    "type": "accommodation",
                    "orderid" : orderId,
                    items : [{
                        "offer" : offer
                    }]
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

    it("create (with real search) and delete", function (done) {
        var query = {
            place: {
                "in": "CI266088ZZ"
            },
            num: 5,
            date: {
                "in": new Date().getTime() + 60 * 60 * 24 * 40 * 1000,
                "out": new Date().getTime() + 60 * 60 * 24 * 42 * 1000
            },
            families: [
                {
                    "adults": 1
                }
            ]
        };
        
        wsApi.sendMessage("service", "accommodation", query, function (data) {
            expect(data).not.toBeNull();
            expect(data.search).not.toBeNull();
            expect(data.search.length).toBeGreaterThan(0);
            var hotel = data.search[0];
            expect(hotel.items[0]).not.toBeNull();
            expect(hotel.items[0].length).toBeGreaterThan(0);
            expect(hotel.items[0][0]).not.toBeNull();
            var room = hotel.items[0][0];
            var searchOffer = room.commerce.offer;

            wsApi.sendMessage("order", "create", null, function (data) {
                var orderId = data.id;
                var query = {
                    type: "accommodation",
                    orderid: orderId,
                    items: [
                        {
                            "offer": searchOffer
                        }
                    ]
                };

                wsApi.sendMessage("service", "create", query, function (data) {
                    expect(data).not.toBeNull();
                    expect(data.id).not.toBeNull();
                    serviceId = data.id;
                    wsApi.sendMessage("service", "delete", {service: serviceId}, function (data) {
                        wsApi.sendMessage("order", "delete", {id: orderId}, function (data) {
                            done();
                        });
                    });
                });
            });
        });
    }, 20000);

    it("search for 1 adult(ABREU)", function (done) {
        var query = {
            place: {
                "in": "CI861854PA"
            },
            num: 2,
            date: {
                "in": new Date().getTime() + 60 * 60 * 24 * 40 * 1000,
                "out": new Date().getTime() + 60 * 60 * 24 * 42 * 1000
            },
            families: [
                {
                    "adults": 2
                }
            ],
            providers: ["abreu"]
        };

        var validateResponse = function(data){
            expect(data.search).not.toBeUndefined();
            expect(data.search).not.toBeNull();
            expect(data.search.length).toBeGreaterThan(0);
            expect(data.done).not.toBeNull();
    
            //check search
            var search = data.search[0];
            expect(search.payment).not.toBeNull();
    
            var hotel = search.info;
            expect(hotel).not.toBeNull();
            expect(hotel.id).not.toBeNull();
            expect(hotel.name).not.toBeNull();
            expect(hotel.cat).not.toBeNull();
            //items[0]
            expect(search.items[0]).not.toBeNull();
            expect(search.items[0].length).toBe(1);
    
            var room = search.items[0][0];
            expect(room.offer).not.toBeNull();
            expect(room.type).not.toBeNull();
            expect(room.meal).not.toBeNull();
            expect(room.payment).not.toBeNull();
            expect(room.original).not.toBeNull();
            expect(room.currency).not.toBeNull();
            expect(room.tl).not.toBeNull();
            done();
        };
        
        var paginationQuery = function (query) {
            wsApi.sendMessage("service", "accommodation", query, function(data) {
                expect(data.search).not.toBeUndefined();
                expect(data.done).not.toBeNull();
    
                if (!data.done) {
                    setTimeout(function() {
                        paginationQuery(query);
                    }, 1000);
                } else {
                    validateResponse(data);
                }
            });
        };

        paginationQuery(query);
    }, 30000);

    it("link/unlink manual service", function (done) {
        wsApi.sendMessage("test", "encodehoteloffer", {offer: cOrderAction.offer1Dto}, function (data) {
            expect(data.offer).not.toBeNull();
            var offer = data.offer;

            var createPersonQuery = {
                name: {
                    first: "Jasmine",
                    last: "Test"
                }
            };
            wsApi.sendMessage("person", "create", createPersonQuery, function (data) {
                expect(data).not.toBeNull();
                expect(data.id).not.toBeNull();
                var personId = data.id;

                //create order and service
                wsApi.sendMessage("order", "create", {name: personId}, function (data) {
                    var orderId = data.id;

                    //create service
                    var createServiceQuery = {
                        "type": "accommodation",
                        "orderid" : orderId,
                        items : [{
                            "offer" : offer
                        }]
                    };
                    wsApi.sendMessage("service", "create", createServiceQuery, function (data) {
                        expect(data).not.toBeNull();
                        expect(data.id).not.toBeNull();
                        var serviceId = data.id;

                        wsApi.sendMessage("order", "retrieve", {id: orderId}, function (data) {
                            expect(data).not.toBeNull();
                            expect(data.id).not.toBeNull();
                            expect(data.id).toBe(orderId);
                            expect(data.date).not.toBeNull();
                            expect(data.services).not.toBeNull();
                            expect(data.services.length).toBeGreaterThan(0);
                            var service = data.services[0];
                            expect(service.items[0]).not.toBeNull();
                            expect(service.items[0].length).toBeGreaterThan(0);
                            var room = service.items[0][0];
                            expect(room.offer).not.toBeNull();
                            var roomOffer = room.offer;

                            var linkQuery = {
                                service: serviceId,
                                room: roomOffer,
                                tourist: personId
                            }
                            wsApi.sendMessage("service", "linktourist", linkQuery, function (data) {
                                wsApi.sendMessage("service", "unlinktourist", linkQuery, function (data) {
                                    wsApi.sendMessage("person", "delete", {id: personId}, function (data) {
                                        wsApi.sendMessage("service", "delete", {service: serviceId}, function (data) {
                                            wsApi.sendMessage("order", "delete", {id: orderId}, function (data) {
                                                done();
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    }, 12000);

    it("service doc", function (done) {
        wsApi.sendMessage("test", "encodehoteloffer", {offer: cOrderAction.offer1Dto}, function (data) {
            expect(data.offer).not.toBeNull();
            var offer = data.offer;

            var createPersonQuery = {
                name: {
                    first: "Jasmine",
                    last: "Test"
                }
            };
            wsApi.sendMessage("person", "create", createPersonQuery, function (data) {
                expect(data).not.toBeNull();
                expect(data.id).not.toBeNull();
                var personId = data.id;

                //create order and service
                wsApi.sendMessage("order", "create", {name: personId}, function (data) {
                    var orderId = data.id;

                    //create service
                    var createServiceQuery = {
                        "type": "accommodation",
                        "orderid" : orderId,
                        items : [{
                            "offer" : offer
                        }]
                    };
                    wsApi.sendMessage("service", "create", createServiceQuery, function (data) {
                        expect(data).not.toBeNull();
                        expect(data.id).not.toBeNull();
                        serviceId = data.id;

                        wsApi.sendMessage("order", "retrieve", {id: orderId}, function (data) {
                            expect(data).not.toBeNull();
                            expect(data.id).not.toBeNull();
                            expect(data.id).toBe(orderId);
                            expect(data.services).not.toBeNull();
                            expect(data.services.length).toBeGreaterThan(0);
                            var service = data.services[0];
                            expect(service.items[0]).not.toBeNull();
                            expect(service.items[0].length).toBeGreaterThan(0);
                            var room = service.items[0][0];
                            expect(room.offer).not.toBeNull();
                            var roomOffer = room.offer;

                            var linkQuery = {
                                service: serviceId,
                                room: roomOffer,
                                tourist: personId
                            }
                            wsApi.sendMessage("service", "linktourist", linkQuery, function (data) {

                                var docQuery = {
                                    id: serviceId,
                                    type: "invoice"
                                }   
                                wsApi.sendMessage("service", "doc", docQuery, function (data) {
                                    expect(data).not.toBeNull();
                                    expect(data.url).not.toBeNull();

                                    wsApi.sendMessage("service", "unlinktourist", linkQuery, function (data) {
                                        wsApi.sendMessage("person", "delete", {id: personId}, function (data) {
                                            wsApi.sendMessage("service", "delete", {service: serviceId}, function (data) {
                                                done();
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    }, 15000);

    it("book success one room for 2 adt", function (done) {
        var context = {};
        wsApi.sendMessage2("test", "encodehoteloffer", { offer:cOrderAction.offer11Dto }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.offer).not.toBeNull();
            context.offer = data.offer;
            //create tourist 1
            context.createPerson1Query = cOrderAction.createPersonQuery;
            return wsApi.sendMessage2("person", "create", context.createPerson1Query);
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.id).not.toBeNull();
            context.person1Id = data.id;
            //create tourist 2
            context.createPerson2Query = {
                "name": {
                    "first": "Tester",
                    "last": "Testov"
                },
                "gender": "female",
                "birthday": new Date().getTime() - 60 * 60 * 24 * 365 * 26 * 1000
            };
            return wsApi.sendMessage2("person", "create", context.createPerson2Query);
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.id).not.toBeNull();
            context.person2Id = data.id;
            //create order with payer and service
            return wsApi.sendMessage2("order", "create", { name:context.person1Id });
        }).then(function(data) {
            context.orderId = data.id;
            //create service
            var createServiceQuery = {
                type: "accommodation",
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
            return wsApi.sendMessage2("order", "retrieve", {id: context.orderId});
        }).then(function(data) {
            const paymentPrice = calculateExpectedPaymentForTest(cOrderAction.offer11Dto.pp);
            const tPaymentPrice = calculateExpectedTPaymentForTest(cOrderAction.offer11Dto.pp);

            expect(data).not.toBeNull();
            expect(data.id).not.toBeNull();
            expect(data.id).toBe(context.orderId);
            expect(data.date).not.toBeNull();
            var person = data.person;
            expect(person).not.toBeNull();
            expect(person.id).not.toBeNull();
            expect(person.name.first).not.toBeNull();
            expect(person.name.first).toBe(context.createPerson1Query.name.first);
            expect(person.name.last).not.toBeNull();
            expect(person.name.last).toBe(context.createPerson1Query.name.last);
            expect(data.total).not.toBeNull();
            expect(data.currency).not.toBeNull();
            expect(data.services).not.toBeNull();
            expect(data.services.length).toBeGreaterThan(0);
            expect(data.services.length).toBe(1);
            var service = data.services[0];
            expect(service.type).not.toBeNull();
            expect(service.type).toBe("accommodation");
            expect(service.id).not.toBeNull();
            expect(service.commerce).not.toBeNull();
            expect(service.commerce.payment).not.toBeNull();
            expect(service.commerce.payment).toBe(paymentPrice, "Неверно посчитан markup&discount"); //сумма из offerDtoс (145.00) увеличена на маркап = 10% (настроенный в бэкофис для компании, агент которой совершает операции) и округлена по правилам округления 161.11111111 = 161.11
            expect(service.commerce.tpayment).toBe(tPaymentPrice, "Неверно посчитан markup&discount"); //сумма из offerDtoс (145.00) увеличена на маркап = 10% (настроенный в бэкофис для компании, агент которой совершает операции) и округлена по правилам округления 161.11111111 = 161.11
            expect(service.commerce.original).not.toBeNull();
            expect(service.commerce.original).toBe(paymentPrice, "Неверно посчитан markup&discount"); //сумма из offerDtoс (145.00) увеличена на маркап = 10% (настроенный в бэкофис для компании, агент которой совершает операции) и округлена по правилам округления 161.11111111 = 161.11
            expect(service.commerce.currency).not.toBeNull();
            expect(service.commerce.currency).toBe(978);
            expect(service.commerce.offer).not.toBeNull();
            expect(service.items[0]).not.toBeNull();
            expect(service.items[0][0]).not.toBeNull();
            expect(service.items[0].length).toBeGreaterThan(0);
            var item = service.items[0][0];
            expect(item.meal).toBe("ONLY BED");
            expect(item.type).toBe("ROOM ONLY");
            expect(item.adults).toBe(2);
            var linkQuery1 = {
                "service": context.serviceId,
                "tourist": context.person1Id,
                "item": 0
            };
            return wsApi.sendMessage2("service", "linktourist", linkQuery1);
        }).then(function(data) {
            var linkQuery2 = {
                "service": context.serviceId,
                "tourist": context.person2Id,
                "item": 0
            };
            return wsApi.sendMessage2("service", "linktourist", linkQuery2);
        }).then(function(data) {
            return wsApi.sendMessage2("service", "book", { service:context.serviceId });
        }).then(function(data) {
            expect(data).not.toBeNull();
            return sleep(6000).then(() => {
                return wsApi.sendMessage2("order", "retrieve", { id:context.orderId });
            });
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.id).not.toBeNull();
            expect(data.id).toBe(context.orderId);
            expect(data.status).not.toBeNull();
            expect(data.status).toBe(10);
            expect(data.services).not.toBeNull();
            expect(data.services.length).toBeGreaterThan(0);
            expect(data.services.length).toBe(1);
            var service = data.services[0];
            expect(service.status).not.toBeNull();
            expect(service.status).toBe(10);

            done();
        });
    }, 20000);

    it("book success one room with childs", function (done) {
        var context = {};
        //create offer
        const offerDto = {
            "pr":"test",
            "hid":"TE111222333",
            "mhid":"HO096339MO",
            "pp":145,
            "pc":"EUR",
            "tl": 1589932800000,
            "bk": "testbookcode",
            "mrt":[
                {
                    "mt":"ONLY BED",
                    "rt":"ROOM ONLY",
                    "adt": 1,
                    "ch": [16]
                }
            ],
            "in": new Date().getTime() + 60 * 60 * 24 * 85 * 1000,
            "out": new Date().getTime() + 60 * 60 * 24 * 88 * 1000
        };
        wsApi.sendMessage2("test", "encodehoteloffer", { offer:offerDto }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.offer).not.toBeNull();
            context.offer = data.offer;
            //create tourist
            context.createPersonQuery = cOrderAction.createPersonQuery;
            return wsApi.sendMessage2("person", "create", context.createPersonQuery);
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.id).not.toBeNull();
            context.personId = data.id;
            //create tourist
            var createChildQuery = {
                "name": {
                    "first": "TestJr",
                    "last": "Test"
                },
                "gender": "male",
                "birthday": new Date().getTime() - 60 * 60 * 24 * 365 * 16 * 1000
            };
            return wsApi.sendMessage2("person", "create", createChildQuery);
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.id).not.toBeNull();
            context.childId = data.id;
            //create order and service
            return wsApi.sendMessage2("order", "create", { name:context.personId });
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.id).not.toBeNull();
            context.orderId = data.id;
            //create service
            var createServiceQuery = {
                type: "accommodation",
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
            return wsApi.sendMessage2("order", "retrieve", { id:context.orderId });
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.id).not.toBeNull();
            expect(data.id).toBe(context.orderId);
            expect(data.date).not.toBeNull();
            var person = data.person;
            expect(person).not.toBeNull();
            expect(person.id).not.toBeNull();
            expect(person.name.first).not.toBeNull();
            expect(person.name.first).toBe(context.createPersonQuery.name.first);
            expect(person.name.last).not.toBeNull();
            expect(person.name.last).toBe(context.createPersonQuery.name.last);
            expect(data.total).not.toBeNull();
            expect(data.currency).not.toBeNull();
            expect(data.services).not.toBeNull();
            expect(data.services.length).toBeGreaterThan(0);
            expect(data.services.length).toBe(1);
            var service = data.services[0];
            expect(service.type).not.toBeNull();
            expect(service.type).toBe("accommodation");
            expect(service.id).not.toBeNull();
            expect(service.offer).not.toBeNull();
            expect(service.commerce).not.toBeNull();
            expect(service.commerce.payment).not.toBeNull();

            const paymentPrice = calculateExpectedPaymentForTest(offerDto.pp);
            const tPaymentPrice = calculateExpectedTPaymentForTest(offerDto.pp);


            expect(service.commerce.payment).toBe(paymentPrice);
            expect(service.commerce.tpayment).toBeDefined();
            expect(service.commerce.tpayment).toBe(tPaymentPrice);
            expect(service.commerce.original).not.toBeNull();
            expect(service.commerce.original).toBe(paymentPrice);
            expect(service.commerce.currency).not.toBeNull();
            expect(service.commerce.currency).toBe(978);
            expect(service.items[0]).not.toBeNull();
            expect(service.items[0].length).toBeGreaterThan(0);
            expect(service.items[0][0]).not.toBeNull();
            var item = service.items[0][0];
            expect(item.meal).toBe("ONLY BED");
            expect(item.type).toBe("ROOM ONLY");
            expect(item.adults).toBe(1);
            expect(item.childs).not.toBeNull();
            expect(item.childs.length).toBeGreaterThan(0);
            expect(item.childs.length).toBe(1);
            expect(item.childs[0]).toBe(16);
            context.linkQuery1 = {
                "service": context.serviceId,
                "tourist": context.personId,
                "item": 0
            };
            return wsApi.sendMessage2("service", "linktourist", context.linkQuery1);
        }).then(function() {
            context.linkQuery2 = {
                "service": context.serviceId,
                "tourist": context.childId,
                "item": 0
            };
            return wsApi.sendMessage2("service", "linktourist", context.linkQuery2);
        }).then(function() {
            return wsApi.sendMessage2("service", "book", { service:context.serviceId });
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.status).not.toBeNull();
            expect(data.status).toBe(5);
            return sleep(6000).then(() => {
                return wsApi.sendMessage2("order", "retrieve", { id:context.orderId });
            });
        }).then(function(data) {                       
            expect(data).not.toBeNull();
            expect(data.id).not.toBeNull();
            expect(data.id).toBe(context.orderId);
            expect(data.status).not.toBeNull();
            expect(data.status).toBe(10);
            expect(data.services).not.toBeNull();
            expect(data.services.length).toBeGreaterThan(0);
            expect(data.services.length).toBe(1);
            var service = data.services[0];
            expect(service.status).not.toBeNull();
            expect(service.status).toBe(10);
            wsApi.sendMessage2("service", "unlinktourist", context.linkQuery1);
            wsApi.sendMessage2("service", "unlinktourist", context.linkQuery2);
            wsApi.sendMessage2("person", "delete", { id:context.personId });
            wsApi.sendMessage2("person", "delete", { id:context.childId });
            wsApi.sendMessage2("service", "delete", { service:context.serviceId });
                               
            done();
        });
    }, 30000);

    it("book one room (prebook failed: adults)", function(done) {
        var context = {};
        wsApi.sendMessage2("test", "encodehoteloffer", { offer:cOrderAction.offer11Dto }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.offer).not.toBeNull();
            context.offer = data.offer;
            //create tourist
            context.createPersonQuery = cOrderAction.createPersonQuery;
            return wsApi.sendMessage2("person", "create", context.createPersonQuery);
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.id).not.toBeNull();
            context.personId = data.id;
            //create order and service
            return wsApi.sendMessage2("order", "create", { name:context.personId });
        }).then(function(data) {
            context.orderId = data.id;
            //create service
            var createServiceQuery = {
                type: "accommodation",
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
            return wsApi.sendMessage2("order", "retrieve", { id:context.orderId });
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.id).not.toBeNull();
            expect(data.id).toBe(context.orderId);
            expect(data.date).not.toBeNull();
            var person = data.person;
            expect(person).not.toBeNull();
            expect(person.id).not.toBeNull();
            expect(person.name.first).not.toBeNull();
            expect(person.name.first).toBe(context.createPersonQuery.name.first);
            expect(person.name.last).not.toBeNull();
            expect(person.name.last).toBe(context.createPersonQuery.name.last);
            expect(data.total).not.toBeNull();
            expect(data.currency).not.toBeNull();
            expect(data.services).not.toBeNull();
            expect(data.services.length).toBeGreaterThan(0);
            expect(data.services.length).toBe(1);
            var service = data.services[0];
            expect(service.type).not.toBeNull();
            expect(service.type).toBe("accommodation");
            expect(service.id).not.toBeNull();
            expect(service.offer).not.toBeNull();
            expect(service.commerce).not.toBeNull();
            expect(service.commerce.payment).not.toBeNull();
            expect(service.commerce.payment).not.toBeNull();
            expect(service.commerce.original).not.toBeNull();

            const paymentPrice = calculateExpectedPaymentForTest(cOrderAction.offer11Dto.pp);
            const tPaymentPrice = calculateExpectedTPaymentForTest(cOrderAction.offer11Dto.pp);

            expect(service.commerce.original).toBe(paymentPrice);
            expect(service.commerce.currency).not.toBeNull();
            expect(service.commerce.currency).toBe(978);
            expect(service.items[0]).not.toBeNull();
            expect(service.items[0].length).toBeGreaterThan(0);
            expect(service.items[0][0]).not.toBeNull();
            var room = service.items[0][0];
            expect(room.meal).toBe("ONLY BED");
            expect(room.type).toBe("ROOM ONLY");
            expect(room.adults).toBe(2);
            var linkQuery = {
                service: context.serviceId,
                tourist: context.personId,
                item: 0
            };
            return wsApi.sendMessage2("service", "linktourist", linkQuery);
        }).then(function(data) {
            return wsApi.sendMessage2("service", "book", { service:context.serviceId });
        }).catch(function(response) {
            expect(response).not.toBeNull();
            expect(response.status).toBe(418);
            var data = response.data;
            expect(data).not.toBeNull();
            expect(data.error).not.toBeNull();
            expect(data.error.services).not.toBeNull();
            expect(data.error.services.length).toBeGreaterThan(0);
            var errService = data.error.services[0];
            expect(errService.items[0]).not.toBeNull();
            expect(errService.items[0].length).toBeGreaterThan(0, "Неверный формат ошибки");
            expect(errService.items[0][0].count).toBe(109, "Проверка на соответствие кол-ва взрослых");
            //remove all
            wsApi.sendMessage2("service", "unlinktourist", context.linkQuery);
            wsApi.sendMessage2("person", "delete", { id:context.personId });
            wsApi.sendMessage2("service", "delete", { service:context.serviceId });
                        
            done();
        });
    }, 20000);

    it("book rejected one room", function(done) {
        let context = {};
        //create offer
        const offerDto = {
            "pr":"test",
            "hid":"HO322898CI",
            "mhid":"HO322898CI",
            "pp":245,
            "pc":"EUR",
            "tl": 1589932800000,
            "bk": "tttt112222",
            "mrt":[
                {
                    "mt":"ONLY BED",
                    "rt":"DBL LUX",
                    "adt":1,
                    "ch":null
                }
            ],
            "in": new Date().getTime() + 60 * 60 * 24 * 85 * 1000,
            "out": new Date().getTime() + 60 * 60 * 24 * 88 * 1000
        };
        wsApi.sendMessage2("test", "encodehoteloffer", { offer:offerDto }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.offer).not.toBeNull();
            context.offer = data.offer;
            //create tourist
            context.createPersonQuery = cOrderAction.createPersonQuery;
            return wsApi.sendMessage2("person", "create", context.createPersonQuery);
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.id).not.toBeNull();
            context.personId = data.id;
            //create order and service
            return wsApi.sendMessage2("order", "create", { name:context.personId });
        }).then(function(data) {
            context.orderId = data.id;
            //create service
            var createServiceQuery = {
                type: "accommodation",
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
            return wsApi.sendMessage2("order", "retrieve", { id:context.orderId });
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.id).not.toBeNull();
            expect(data.id).toBe(context.orderId);
            expect(data.date).not.toBeNull();
            var person = data.person;
            expect(person).not.toBeNull();
            expect(person.id).not.toBeNull();
            expect(person.name.first).not.toBeNull();
            expect(person.name.first).toBe(context.createPersonQuery.name.first);
            expect(person.name.last).not.toBeNull();
            expect(person.name.last).toBe(context.createPersonQuery.name.last);
            expect(data.total).not.toBeNull();
            expect(data.currency).not.toBeNull();
            expect(data.services).not.toBeNull();
            expect(data.services.length).toBeGreaterThan(0);
            expect(data.services.length).toBe(1);
            var service = data.services[0];
            expect(service.type).not.toBeNull();
            expect(service.type).toBe("accommodation");
            expect(service.id).not.toBeNull();
            expect(service.offer).not.toBeNull();
            expect(service.commerce).not.toBeNull();
            expect(service.commerce.payment).not.toBeNull();
            expect(service.commerce.original).not.toBeNull();

            const paymentPrice = calculateExpectedPaymentForTest(offerDto.pp);
            const tPaymentPrice = calculateExpectedTPaymentForTest(offerDto.pp);

            expect(service.commerce.original).toBe(paymentPrice);
            expect(service.commerce.currency).not.toBeNull();
            expect(service.commerce.currency).toBe(978);
            expect(service.items[0]).not.toBeNull();
            expect(service.items[0].length).toBeGreaterThan(0);
            expect(service.items[0][0]).not.toBeNull();
            var room = service.items[0][0];
            expect(room.meal).toBe("ONLY BED");
            expect(room.type).toBe("DBL LUX");
            expect(room.adults).toBe(1);
            context.linkQuery = {
                "service": context.serviceId,
                "tourist": context.personId,
                "item" : 0
            };
            return wsApi.sendMessage2("service", "linktourist", context.linkQuery);
        }).then(function() {
            return wsApi.sendMessage2("service", "book", { service:context.serviceId });
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.status).not.toBeNull();
            expect(data.status).toBe(5);
            return sleep(5000).then(() => {
                return wsApi.sendMessage2("order", "retrieve", { id:context.orderId });
            });
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.id).not.toBeNull();
            expect(data.id).toBe(context.orderId);
            expect(data.status).not.toBeNull();
            expect(data.status).toBe(70);
            expect(data.services).not.toBeNull();
            expect(data.services.length).toBeGreaterThan(0);
            expect(data.services.length).toBe(1);
            var service = data.services[0];
            expect(service.status).not.toBeNull();
            expect(service.status).toBe(70);
            //remove all
            wsApi.sendMessage2("service", "unlinktourist", context.linkQuery);
            wsApi.sendMessage2("person", "delete", { id:context.personId });
            wsApi.sendMessage2("service", "delete", { service:context.serviceId });
                                                        
            done();
        });
    }, 20000);

    it("book and pay one room", function(done) {
        var context = {};
        const paymentPrice = calculateExpectedPaymentForTest(cOrderAction.offer1Dto.pp);
        const tPaymentPrice = calculateExpectedTPaymentForTest(cOrderAction.offer1Dto.pp);

        wsApi.sendMessage("test", "encodehoteloffer", { offer:cOrderAction.offer1Dto }, function(data) {
            expect(data).not.toBeNull();
            expect(data.offer).not.toBeNull();
            var offer = data.offer;
            //create tourist
            var createPersonQuery = cOrderAction.createPersonQuery;
            wsApi.sendMessage("person", "create", createPersonQuery, function (data) {
                expect(data).not.toBeNull();
                expect(data.id).not.toBeNull();
                var personId = data.id;
                //create order and service
                wsApi.sendMessage("order", "create", {name: personId}, function(data) {
                    var orderId = data.id;
                    //create service
                    var createServiceQuery = {
                        type: "accommodation",
                        orderid: orderId,
                        items: [{
                            offer: offer
                        }]
                    };
                    wsApi.sendMessage("service", "create", createServiceQuery, function(data) {
                        expect(data).not.toBeNull();
                        expect(data.id).not.toBeNull();
                        var serviceId = data.id;
                        wsApi.sendMessage("order", "retrieve", { id:orderId }, function(data) {
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
                            expect(data.total).not.toBeNull();
                            expect(data.currency).not.toBeNull();
                            expect(data.services).not.toBeNull();
                            expect(data.services.length).toBeGreaterThan(0);
                            expect(data.services.length).toBe(1);
                            var service = data.services[0];
                            expect(service.type).not.toBeNull();
                            expect(service.type).toBe("accommodation");
                            expect(service.id).not.toBeNull();
                            expect(service.offer).not.toBeNull();
                            expect(service.commerce).not.toBeNull();
                            expect(service.commerce.payment).not.toBeNull();
                            expect(service.commerce.original).not.toBeNull();
                            expect(service.commerce.original).toBe(paymentPrice);
                            expect(service.commerce.currency).not.toBeNull();
                            expect(service.commerce.currency).toBe(978);
                            expect(service.items[0]).not.toBeNull();
                            expect(service.items[0].length).toBeGreaterThan(0);
                            expect(service.items[0][0]).not.toBeNull();
                            var room = service.items[0][0];
                            expect(room.meal).toBe("ONLY BED");
                            expect(room.type).toBe("ROOM ONLY");
                            expect(room.adults).toBe(1);

                            context.expectedPayment = service.commerce.tpayment;


                            var linkQuery = {
                                "service": serviceId,
                                "tourist": personId,
                                "item": 0
                            };
                            wsApi.sendMessage("service", "linktourist", linkQuery, function(data) {
                                wsApi.sendMessage("service", "prepay", { service:serviceId, type:"card", isTest:true }, function (data) {
                                    expect(data).not.toBeNull();
                                    expect(data.url).not.toBeNull();

                                    expect(data.currency).toBeDefined();
                                    expect(data.currency).toBe(978);

                                    expect(data.payment).toBeDefined();
                                    expect(data.payment).toBe(context.expectedPayment, "Оплата должна идти со скидкой");//161.11

                                    wsApi.sendMessage("service", "unlinktourist", linkQuery, function(data) {
                                        wsApi.sendMessage("person", "delete", { id:personId }, function(data) {
                                            wsApi.sendMessage("service", "delete", { service:serviceId }, function(data) {
                                                done();
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    }, 20000);

    it("book and pay one room (markup 11%)", function(done) {
        var context = {};
        var offerDto = {
            "pr":"test",
            "hid":"TE111222335",
            "mhid":"HO402987FR",
            "pp":100,
            "pc":"EUR",
            "tl": 1589932800000,
            "bk": "testbookcode",
            "mrt":[
                {
                    "mt":"ONLY BED",
                    "rt":"ROOM ONLY",
                    "adt":1,
                    "ch":null
                }
            ],
            "in": new Date().getTime() + 60 * 60 * 24 * 85 * 1000,
            "out": new Date().getTime() + 60 * 60 * 24 * 88 * 1000
        };
        const paymentPrice = calculateExpectedPaymentForTest(offerDto.pp);
        const tPaymentPrice = calculateExpectedTPaymentForTest(offerDto.pp);

        wsApi.sendMessage2("test", "encodehoteloffer", { offer:offerDto }).then(function(data) {
            expect(data.offer).not.toBeNull();
            context.offer = data.offer;
            //create tourist
            var createPersonQuery = cOrderAction.createPersonQuery;
            return wsApi.sendMessage2("person", "create", createPersonQuery);
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.id).not.toBeNull();
            context.personId = data.id;
            return wsApi.sendMessage2("order", "create", { name:context.personId });
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.id).not.toBeNull();
            context.orderId = data.id;
            //create service
            var createServiceQuery = {
                type: "accommodation",
                orderid: context.orderId,
                items : [{
                    offer: context.offer
                }]
            };
            return wsApi.sendMessage2("service", "create", createServiceQuery);
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.id).not.toBeNull();
            context.serviceId = data.id;
            return wsApi.sendMessage2("order", "retrieve", { id:context.orderId });
        }).then(function(data) {

            var priceWithMarkup = halfUp(halfUp(halfUp(halfUp(offerDto.pp / 0.89) / 0.75)/0.4) * 0.9, 100);

            expect(data).not.toBeNull();
            expect(data.id).toBe(context.orderId);
            expect(data.date).not.toBeNull();
            expect(data.commerce.payment).toBe(priceWithMarkup, "Не учитывается маркап между тестовым провайдером(CMPN487820TR) и Herma LTD и между селлером Herma B2C и Herma LTD");
            var person = data.person;
            expect(person).not.toBeNull();
            expect(data.services.length).toBeGreaterThan(0);
            expect(data.services.length).toBe(1);
            var service = data.services[0];
            expect(service.type).toBe("accommodation");
            expect(service.id).not.toBeNull();
            expect(service.offer).not.toBeNull();
            expect(service.commerce).not.toBeNull();
            expect(service.commerce.payment).not.toBeNull();

            expect(service.commerce.payment).toBe(priceWithMarkup);
            expect(service.commerce.original).not.toBeNull();
            expect(service.commerce.original).toBe(priceWithMarkup);
            expect(service.commerce.currency).not.toBeNull();
            expect(service.commerce.currency).toBe(978);
            expect(service.items[0]).not.toBeNull();
            expect(service.items[0].length).toBeGreaterThan(0);
            expect(service.items[0][0]).not.toBeNull();

            context.expectedPayment = service.commerce.tpayment;
            context.linkQuery = {
                "service": context.serviceId,
                "tourist": context.personId,
                "item": 0
            };
            return wsApi.sendMessage2("service", "linktourist", context.linkQuery);
        }).then(function(data) {
            return wsApi.sendMessage2("service", "prepay", { service:context.serviceId, type:"card" });
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.url).not.toBeNull();

            expect(data.currency).toBeDefined();
            expect(data.currency).toBe(978);

            expect(data.payment).toBeDefined();
            expect(data.payment).toBe(context.expectedPayment, "Оплата должна идти со скидкой");

            wsApi.sendMessage2("service", "unlinktourist", context.linkQuery);
            wsApi.sendMessage2("person", "delete", { id:context.personId });
            wsApi.sendMessage2("service", "delete", { service:context.serviceId });
                                                
            done();
        });
    }, 20000);




    it("book and pay one room (markup 12% and discount 5% + final markup 10% and discount 7%)", function(done) {
        var context = {};
        var offerDto = {
            "pr":"test",
            "hid":"TE111222335",
            "mhid":"HO537454TI",//Berliner Hof
            "pp":150,
            "pc":"EUR",
            "tl": 1589932800000,
            "bk": "testbookcode",
            "mrt":[
                {
                    "mt":"BB",
                    "rt":"DBL ROOM",
                    "adt":1,
                    "ch":null
                }
            ],
            "in": new Date().getTime() + 60 * 60 * 24 * 85 * 1000,
            "out": new Date().getTime() + 60 * 60 * 24 * 88 * 1000
        };
        wsApi.sendMessage2("test", "encodehoteloffer", { offer:offerDto }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.offer).not.toBeNull();
            context.offer = data.offer;
            var createPersonQuery = cOrderAction.createPersonQuery;
            return wsApi.sendMessage2("person", "create", createPersonQuery);
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.id).not.toBeNull();
            context.personId = data.id;
            return wsApi.sendMessage2("order", "create", { name:context.personId });
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.id).not.toBeNull();
            context.orderId = data.id;
            var createServiceQuery = {
                type: "accommodation",
                orderid: context.orderId,
                items : [{
                    offer: context.offer
                }]
            };
            return wsApi.sendMessage2("service", "create", createServiceQuery);
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.id).not.toBeNull();
            context.serviceId = data.id;
            // 12% markup и 5% discount on Total Amount между PROVIDER FOR AUTOTEST(DON'T CHANGE!!!) и Herma b2b, (#108)
            // 10 % markup и 7 % discount on Total Amount на Herma B2C (#188)

            context.expectedPayment = halfUp(halfUp(halfUp(halfUp(offerDto.pp / 0.88) * 0.95) / 0.9) /0.4) * 0.9;
            context.expectedTPayment = halfUp(halfUp(halfUp(halfUp(offerDto.pp / 0.88) * 0.95) / 0.9)*0.93);

            return wsApi.sendMessage2("order", "retrieve", { id:context.orderId });
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.id).not.toBeNull();
            expect(data.id).toBe(context.orderId);
            expect(data.date).not.toBeNull();
            expect(data.commerce.payment).not.toBeNull();
            expect(data.commerce.payment).toBe(context.expectedPayment);
            var person = data.person;
            expect(person).not.toBeNull();
            expect(data.services).not.toBeNull();
            expect(data.services.length).toBeGreaterThan(0);
            expect(data.services.length).toBe(1);
            var service = data.services[0];
            expect(service.type).not.toBeNull();
            expect(service.type).toBe("accommodation");
            expect(service.id).not.toBeNull();
            expect(service.commerce).not.toBeNull();
            expect(service.commerce.offer).not.toBeNull();
            expect(service.commerce.payment).not.toBeNull();
            expect(service.commerce.payment).toBe(context.expectedPayment);
            expect(service.commerce.tpayment).not.toBeNull();
            expect(service.commerce.tpayment).toBe(context.expectedTPayment);
            expect(service.commerce.original).not.toBeNull();
            expect(service.commerce.original).toBe(context.expectedPayment);
            expect(service.commerce.toriginal).not.toBeNull();
            expect(service.commerce.currency).not.toBeNull();
            expect(service.commerce.currency).toBe(978);
            expect(service.items[0]).not.toBeNull();
            expect(service.items[0].length).toBeGreaterThan(0);
            expect(service.items[0][0]).not.toBeNull();
            context.linkQuery = {
                "service": context.serviceId,
                "tourist": context.personId,
                "item" : 0
            };
            return wsApi.sendMessage2("service", "linktourist", context.linkQuery);
        }).then(function(data) {
            return wsApi.sendMessage2("service", "prepay", { service:context.serviceId, type:"card" });
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.url).not.toBeNull();

            expect(data.currency).toBeDefined();
            expect(data.currency).toBe(978);

            expect(data.payment).toBeDefined();
            expect(data.payment).toBe(context.expectedTPayment);

            wsApi.sendMessage2("service", "unlinktourist", context.linkQuery);
            wsApi.sendMessage2("person", "delete", { id:context.personId });
            wsApi.sendMessage2("service", "delete", { service:context.serviceId });
            
            done();
        });
    }, 20000);

    it("book and pay one room non ref", function(done) {
        var context = {};
        //create offer
        var offerDto = {
            "pr":"test",
            "hid":"TE111222334",
            "mhid":"HO096339MO",
            "pp":125,
            "pc":"EUR",
            "bk": "testbookcode",
            "mrt":[
                {
                    "mt":"ONLY BED",
                    "rt":"ROOM ONLY",
                    "adt":1,
                    "ch":null
                }
            ],
            "in": new Date().getTime() + 60 * 60 * 24 * 85 * 1000,
            "out": new Date().getTime() + 60 * 60 * 24 * 88 * 1000
        };
        wsApi.sendMessage("test", "encodehoteloffer", { offer:offerDto }, function(data) {
            expect(data).not.toBeNull();
            expect(data.offer).not.toBeNull();
            var offer = data.offer;
            //create order and service
            wsApi.sendMessage("order", "create", null, function(data) {
                expect(data).not.toBeNull();
                expect(data.id).not.toBeNull();
                orderId = data.id;
                //create service
                var createServiceQuery = {
                    type: "accommodation",
                    orderid: orderId,
                    items: [
                        {
                            offer: offer
                        }
                    ]
                };
                wsApi.sendMessage("service", "create", createServiceQuery, function(data) {
                    expect(data).not.toBeNull();
                    expect(data.id).not.toBeNull();
                    var serviceId = data.id;
                    var createPersonQuery = cOrderAction.createPersonQuery;
                    //create tourist
                    wsApi.sendMessage("person", "create", createPersonQuery, function(data) {
                        expect(data).not.toBeNull();
                        expect(data.id).not.toBeNull();
                        var personId = data.id;
                        wsApi.sendMessage("order", "retrieve", { id:orderId }, function(data) {
                            expect(data).not.toBeNull();
                            expect(data.id).not.toBeNull();
                            expect(data.id).toBe(orderId);
                            expect(data.date).not.toBeNull();
                            expect(data.currency).not.toBeNull();
                            expect(data.services).not.toBeNull();
                            expect(data.services.length).toBeGreaterThan(0);
                            expect(data.services.length).toBe(1);
                            var service = data.services[0];
                            expect(service.type).not.toBeNull();
                            expect(service.type).toBe("accommodation");
                            expect(service.id).not.toBeNull();
                            expect(service.commerce).not.toBeNull();
                            expect(service.commerce.offer).not.toBeNull();
                            expect(service.commerce.payment).not.toBeNull();
                            expect(service.commerce.payment).not.toBeNull();


                            expect(service.commerce.original).toBe(calculateExpectedPaymentForTest(offerDto.pp));
                            expect(service.commerce.payment).not.toBeNull();
                            expect(service.commerce.currency).toBe(978);
                            expect(service.items[0]).not.toBeNull();
                            expect(service.items[0].length).toBeGreaterThan(0);
                            expect(service.items[0][0]).not.toBeNull();
                            var room = service.items[0][0];
                            expect(room.meal).toBe("ONLY BED");
                            expect(room.type).toBe("ROOM ONLY");
                            expect(room.adults).toBe(1);

                            context.expectedTPayment = service.commerce.tpayment;
                            var linkQuery = {
                                "service": serviceId,
                                "tourist": personId,
                                "item" : 0
                            };
                            wsApi.sendMessage("service", "linktourist", linkQuery, function(data) {
                                //set payer
                                wsApi.sendMessage("order", "update", { id:orderId, name:personId }, function(data) {
                                    wsApi.sendMessage("service", "prepay", {service: serviceId, type: "card"}, function(data) {
                                        expect(data).not.toBeNull();
                                        expect(data.url).not.toBeNull();

                                        expect(data.currency).toBeDefined();
                                        expect(data.currency).toBe(978);

                                        expect(data.payment).toBeDefined();
                                        expect(data.payment).toBe(context.expectedTPayment);

                                        wsApi.sendMessage("service", "unlinktourist", linkQuery, function(data) {
                                            wsApi.sendMessage("person", "delete", { id:personId }, function(data) {
                                                wsApi.sendMessage("service", "delete", { service:serviceId }, function(data) {
                                                    done();
                                                });
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    }, 30000);

    it("book and pay two room", function (done) {
        var context = {};
        //create offer
        var queryRoomsOffer = {
            "pr":"test",
            "hid":"TE111222333",
            "mhid":"HO096339MO",
            "pp":145+245,
            "pc":"EUR",
            "tl":1589932800000,
            "bk":"testbookcode",
            "mrt":[
                {
                    "mt":"ONLY BED",
                    "rt":"ROOM ONLY",
                    "adt":1
                },
                {
                    "mt":"ONLY BED",
                    "rt":"DBL LUX",
                    "adt":2
                }
            ],
            "in": new Date().getTime() + 60 * 60 * 24 * 85 * 1000,
            "out": new Date().getTime() + 60 * 60 * 24 * 88 * 1000
        };
        wsApi.sendMessage("test", "encodehoteloffer", {offer: queryRoomsOffer}, function (data) {
            expect(data).not.toBeNull();
            expect(data.offer).not.toBeNull();
            var roomsOffer = data.offer;
            //create order and service
            wsApi.sendMessage("order", "create", null, function (data) {
                expect(data).not.toBeNull();
                expect(data.id).not.toBeNull();
                orderId = data.id;
                //create service
                var createServiceQuery = {
                    type: "accommodation",
                    orderid: orderId,
                    offer: roomsOffer
                };
                wsApi.sendMessage("service", "create", createServiceQuery, function (data) {
                    expect(data).not.toBeNull();
                    expect(data.id).not.toBeNull();
                    serviceId = data.id;
                    //create tourist 1
                    var createPerson1Query = cOrderAction.createPersonQuery;
                    wsApi.sendMessage("person", "create", createPerson1Query, function (data) {
                        expect(data).not.toBeNull();
                        expect(data.id).not.toBeNull();
                        var personId1 = data.id;
                        var createPerson2Query = {
                            "name": {
                                "first": "Testera",
                                "last": "Testerova"
                            },
                            "gender": "female",
                            "birthday": new Date().getTime() - 60 * 60 * 24 * 365 * 25 * 1000
                        };
                        wsApi.sendMessage("person", "create", createPerson2Query, function (data) {
                            expect(data).not.toBeNull();
                            expect(data.id).not.toBeNull();
                            var personId2 = data.id;
                            var createPerson3Query = {
                                "name": {
                                    "first": "Tester",
                                    "last": "Testov"
                                },
                                "gender": "male",
                                "birthday": new Date().getTime() - 60 * 60 * 24 * 365 * 25 * 1000
                            };
                            wsApi.sendMessage("person", "create", createPerson3Query, function (data) {
                                expect(data).not.toBeNull();
                                expect(data.id).not.toBeNull();
                                var personId3 = data.id;
                                var priceWithMarkup = calculateExpectedPaymentForTest(queryRoomsOffer.pp);
                                wsApi.sendMessage("order", "retrieve", {id: orderId}, function (data) {
                                    expect(data).not.toBeNull();
                                    expect(data.id).not.toBeNull();
                                    expect(data.id).toBe(orderId);
                                    expect(data.date).not.toBeNull();
                                    expect(data.currency).not.toBeNull();
                                    expect(data.services).not.toBeNull();
                                    expect(data.services.length).toBeGreaterThan(0);
                                    expect(data.services.length).toBe(1);
                                    var service = data.services[0];
                                    expect(service.id).not.toBeNull();
                                    expect(service.type).not.toBeNull();
                                    expect(service.type).toBe("accommodation");
                                    expect(service.commerce.currency).toBe(978);
                                    expect(service.commerce.payment).not.toBeNull();
                                    expect(service.commerce.original).toBe(priceWithMarkup);
                                    expect(service.items[0]).not.toBeNull();
                                    expect(service.items.length).toBe(2);
                                    expect(service.items[0][0]).not.toBeNull();
                                    expect(service.items[1][0]).not.toBeNull();
                                    var room1 = service.items[0][0];
                                    expect(room1.meal).toBe("ONLY BED");
                                    expect(room1.type).toBe("ROOM ONLY");
                                    expect(room1.adults).toBe(1);
                                    var room2 = service.items[1][0];
                                    expect(room2.meal).toBe("ONLY BED");
                                    expect(room2.type).toBe("DBL LUX");
                                    expect(room2.adults).toBe(2);
                                    context.expectedTPayment = service.commerce.tpayment;

                                    var linkQuery1 = {
                                        "service": serviceId,
                                        "tourist": personId1,
                                        "item": 0
                                    };
                                    wsApi.sendMessage("service", "linktourist", linkQuery1, function (data) {
                                        var linkQuery2 = {
                                            "service": serviceId,
                                            "tourist": personId2,
                                            "item": 1
                                        };
                                        wsApi.sendMessage("service", "linktourist", linkQuery2, function (data) {
                                            var linkQuery3 = {
                                                "service": serviceId,
                                                "tourist": personId3,
                                                "item": 1
                                            };
                                            wsApi.sendMessage("service", "linktourist", linkQuery3, function (data) {
                                                //set payer
                                                wsApi.sendMessage("order", "update", {id: orderId, name: personId1}, function (data) {
                                                    wsApi.sendMessage("service", "prepay", {service: serviceId, type: "card"}, function (data) {
                                                        expect(data).not.toBeNull();
                                                        expect(data.url).not.toBeNull();

                                                        expect(data.currency).toBeDefined();
                                                        expect(data.currency).toBe(978);

                                                        expect(data.payment).toBeDefined();
                                                        expect(data.payment).toBe(context.expectedTPayment, "Оплата должна идти со скидкой");

                                                        wsApi.sendMessage("service", "unlinktourist", linkQuery3, function (data) {
                                                            wsApi.sendMessage("service", "unlinktourist", linkQuery2, function (data) {
                                                                wsApi.sendMessage("service", "unlinktourist", linkQuery1, function (data) {
                                                                    wsApi.sendMessage("person", "delete", {id: personId3}, function (data) {
                                                                        wsApi.sendMessage("person", "delete", {id: personId2}, function (data) {
                                                                            wsApi.sendMessage("person", "delete", {id: personId1}, function (data) {
                                                                                wsApi.sendMessage("service", "delete", {service: serviceId}, function (data) {
                                                                                    done();
                                                                                });
                                                                            });
                                                                        });
                                                                    });
                                                                });
                                                            });
                                                        });
                                                    });
                                                });
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    }, 25000);

    it("success pay card one room", function (done) {
        var context = {};
        wsApi.sendMessage2("test", "encodehoteloffer", { offer:cOrderAction.offer1Dto }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.offer).not.toBeNull();
            context.offer = data.offer;
            //create tourist
            context.createPersonQuery = cOrderAction.createPersonQuery;
            return wsApi.sendMessage2("person", "create", context.createPersonQuery);
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.id).not.toBeNull();
            context.personId = data.id;
            //create order and service
            return wsApi.sendMessage2("order", "create", { name:context.personId });
        }).then(function(data) {
            context.orderId = data.id;
            //create service
            var createServiceQuery = {
                type: "accommodation",
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
            return wsApi.sendMessage2("order", "retrieve", { id:context.orderId });
        }).then(function(data) {
            expect(data).not.toBeNull();
            var service = data.services[0];
            expect(service.items[0]).not.toBeNull();
            expect(service.items[0].length).toBeGreaterThan(0);
            expect(service.items[0][0]).not.toBeNull();
            context.expectedPayment = service.commerce.payment;
            context.expectedTPayment = service.commerce.tpayment;

            context.linkQuery = {
                "service": context.serviceId,
                "tourist": context.personId,
                "item": 0
            };
            return wsApi.sendMessage2("service", "linktourist", context.linkQuery);
        }).then(function(data) {
            return wsApi.sendMessage2("service", "prepay", { service:context.serviceId, type:"card", isTest:true });
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.url).not.toBeNull();

            expect(data.currency).toBeDefined();
            expect(data.currency).toBe(978);

            expect(data.payment).toBeDefined();
            expect(data.payment).toBe(context.expectedTPayment, "Оплата должна идти со скидкой");


            context.trId = data.transaction;
            //pay by card
            return payment.getPaymentServiceInfo(context.serviceId, );
        }).then(function(data) {
            data.transaction = context.trId;
            return payment.doPay(JSON.stringify(data), true);
        }).then(function(data) {
            return wsApi.sendMessage2("order", "retrieve", {id: context.orderId});
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.status).not.toBeNull();
            expect(data.status).toBe(20);
            wsApi.sendMessage2("service", "unlinktourist", context.linkQuery);
            wsApi.sendMessage2("person", "delete", { id:context.personId });
            wsApi.sendMessage2("service", "delete", { service:context.serviceId });
                                                    
            done();
        });
    }, 20000);

    it("error pay card one room", function(done) {
        var context = {};
        wsApi.sendMessage2("test", "encodehoteloffer", { offer:cOrderAction.offer1Dto }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.offer).not.toBeNull();
            context.offer = data.offer;
            //create tourist
            context.createPersonQuery = cOrderAction.createPersonQuery;
            return wsApi.sendMessage2("person", "create", context.createPersonQuery);
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.id).not.toBeNull();
            context.personId = data.id;
            //create order and service
            return wsApi.sendMessage2("order", "create", { name:context.personId });
        }).then(function(data) {
            context.orderId = data.id;
            //create service
            context.createServiceQuery = {
                type: "accommodation",
                orderid: context.orderId,
                items: [{
                    offer: context.offer
                }]
            };
            return wsApi.sendMessage2("service", "create", context.createServiceQuery);
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.id).not.toBeNull();
            context.serviceId = data.id;
            return wsApi.sendMessage2("order", "retrieve", { id:context.orderId });
        }).then(function(data) {
            expect(data).not.toBeNull();
            var service = data.services[0];
            expect(service.items[0]).not.toBeNull();
            expect(service.items[0].length).toBeGreaterThan(0);
            var room = service.items[0][0];
            expect(room.offer).not.toBeNull();
            context.expectedTPayment = service.commerce.tpayment;

            context.linkQuery = {
                "service": context.serviceId,
                "tourist": context.personId,
                "room" : room.offer
            };
            return wsApi.sendMessage2("service", "linktourist", context.linkQuery);
        }).then(function(data) {
            return wsApi.sendMessage2("service", "prepay", { service:context.serviceId, type:"card", isTest:true });
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.url).not.toBeNull();

            expect(data.currency).toBeDefined();
            expect(data.currency).toBe(978);

            expect(data.payment).toBeDefined();
            expect(data.payment).toBe(context.expectedTPayment, "Оплата должна идти со скидкой");

            context.trId = data.transaction;
            // pay by card
            return payment.getPaymentServiceInfo(context.serviceId);
        }).then(function(data) {
            data.transaction = context.trId;
            return payment.doPay(JSON.stringify(data), false);
        }).then(function(data) {
            return wsApi.sendMessage2("order", "retrieve", { id:context.orderId});
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.status).not.toBeNull();
            expect(data.status).toBe(undefined);
            wsApi.sendMessage2("service", "unlinktourist", context.linkQuery);
            wsApi.sendMessage2("person", "delete", { id:context.personId});
            wsApi.sendMessage2("service", "delete", { service:context.serviceId});
                                                                
            done();
        });
    }, 20000);

    it("book and error pay card one room", function(done) {
        var context = {};
        wsApi.sendMessage2("test", "encodehoteloffer", { offer:cOrderAction.offer1Dto }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.offer).not.toBeNull();
            context.offer = data.offer;
            //create tourist
            context.createPersonQuery = cOrderAction.createPersonQuery;
            return wsApi.sendMessage2("person", "create", context.createPersonQuery);
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.id).not.toBeNull();
            context.personId = data.id;
            //create order and service
            return wsApi.sendMessage2("order", "create", { name:context.personId });
        }).then(function(data) {
            context.orderId = data.id;
            //create service
            context.createServiceQuery = {
                type: "accommodation",
                orderid: context.orderId,
                items: [{
                    offer: context.offer
                }]
            };
            return wsApi.sendMessage2("service", "create", context.createServiceQuery);
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.id).not.toBeNull();
            context.serviceId = data.id;
            return wsApi.sendMessage2("order", "retrieve", { id:context.orderId });
        }).then(function(data) {
            expect(data).not.toBeNull();
            var service = data.services[0];
            expect(service.items[0]).not.toBeNull();
            expect(service.items[0].length).toBeGreaterThan(0);
            expect(service.items[0][0]).not.toBeNull();
            context.expectedTPayment = service.commerce.tpayment;

            context.linkQuery = {
                service: context.serviceId,
                tourist: context.personId,
                item : 0
            };
            return wsApi.sendMessage2("service", "linktourist", context.linkQuery);
        }).then(function(data) {
            return wsApi.sendMessage2("service", "book", { service:context.serviceId});
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.status).toBe(5);
            return sleep(3000).then(() => {
                return wsApi.sendMessage2("service", "prepay", { service:context.serviceId, type:"card", isTest:true });
            });
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.url).not.toBeNull();

            expect(data.currency).toBeDefined();
            expect(data.currency).toBe(978);

            expect(data.payment).toBeDefined();
            expect(data.payment).toBe(context.expectedTPayment, "Оплата должна идти со скидкой");

            context.trId = data.transaction;
            //pay by card
            return payment.getPaymentServiceInfo(context.serviceId);
        }).then(function(data) {
            data.transaction = context.trId;
            return payment.doPay(JSON.stringify(data), false);
        }).then(function(data) {
            return wsApi.sendMessage2("order", "retrieve", { id:context.orderId });
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.status).not.toBeNull();
            expect(data.status).toBe(10);
            wsApi.sendMessage2("service", "unlinktourist", context.linkQuery);
            wsApi.sendMessage2("person", "delete", { id:context.personId });
            wsApi.sendMessage2("service", "delete", { service:context.serviceId});
                    
            done();
        });
    }, 20000);

    it("has comment", function(done) {
        var context = {};
        cOrderAction.createOrderWith1Service(cOrderAction.offer1Dto, "encodehoteloffer", "accommodation", 0)
        .then( function (ct) {
            context = ct;
            context.comment = {
                "service": context.serviceId,
                "comment": "pricolniy comment"
            };
            return wsApi.sendMessage2("service", "update", context.comment);
        }).then(function() {
            return wsApi.sendMessage2("order", "retrieve", { id:context.orderId });
        }).then(function(data) {
            expect(data.services[0].comment).toBe(context.comment.comment);
            return wsApi.sendMessage2("person", "delete", { id:context.personId });
        }).then(function(data) {
            wsApi.sendMessage2("service", "delete", { service:context.serviceId });
            done();
        }).catch(function (response) {
            console.error(response);
            fail("Добавление комментария к заказу не работает!");
            done();
        });
    });

    it("has invoice", function (done) {
        var context = {};
        cOrderAction.createOrderWith1Service(cOrderAction.offer1Dto, "encodehoteloffer", "accommodation", 0).then(function (ct) {
            context = ct;
            var invoiceQuery = {
                id: context.serviceId,
                type: "invoice"
            };
            return wsApi.sendMessage2("service", "doc", invoiceQuery);
        }).then(function (data) {
            checkDoc(Settings.apiLocation + data.url);
            done();
        }).catch(function (response) {
            console.error(response);
            fail("Получения инвойса не работает!");
            done();
        });
    });

    it("has voucher", function (done) {
        var context = {};
        cOrderAction.createOrderWith1Service(cOrderAction.offer1Dto, "encodehoteloffer", "accommodation", 0, Settings.userB2C.payerId).then(function (ct) {
            context = ct;
            return cOrderAction.bookService(context.serviceId);
        }).then(function () {
            return cOrderAction.payServiceCard(context.orderId, context.serviceId);
        }).then(function (order) {
            expect(order.status).not.toBeNull();
            expect(order.status).toBe(20);
            var voucherQuery = {
                "id": context.serviceId,
                "type": "voucher"
            };
            return wsApi.sendMessage2("service", "doc", voucherQuery);
        }).then(function (data) {
            return checkDoc(Settings.apiLocation + data.url);
        }).then(function () {
            done();
        }).catch(function (response) {
            console.error(response);
            fail("Получения ваучера не работает!");
            done();
        });
    }, 25000);

    // Rate uploads search hotel Sani Asterias and add to order
    xit("search ratesupload", function(done) {
        var context = {};
        var query = {
            place: {
                "in": "HO265563KA"//Sani Asterias
            },
            num: 5,
            date: {
                "in": new Date().getTime() + 60 * 60 * 24 * 40 * 1000,
                "out": new Date().getTime() + 60 * 60 * 24 * 42 * 1000
            },
            families: [
                {
                    "adults": 1
                }
            ],
            providers: ["ratesupload"]
        };
        wsApi.sendMessage2("service", "accommodation", query).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.search).not.toBeNull();
            expect(data.search.length).toBeGreaterThan(0);
            expect(data.search.length).toBe(1);
            context.search = data.search[0];
            expect(context.search.info.addr).toBe("Sani Resort, Kassandra, Halkidiki, Greece");
            context.itemsSearch = context.search.items[0][0];
            expect(context.itemsSearch.meal).toBe("HB");
            expect(context.itemsSearch.type).toBe("Suite Beach Front");
            context.commerceSearch = context.search.items[0][0].commerce;
            // expect(contex.commerce.payment).toBe(63*3);
            return wsApi.sendMessage2("person", "create", cOrderAction.createPersonQuery)
        }).then(function (data) {
            expect(data).not.toBeNull();
            expect(data.id).not.toBeNull();
            context.personId = data.id;
            return wsApi.sendMessage2("order", "create", { name:context.personId })
        }).then(function(data) {
            context.orderId = data.id;
            context.createServiceAccQuery = {
                type: "accommodation",
                orderid: context.orderId,
                items: [{
                    offer: context.commerceSearch.offer
                }]
            };
            return wsApi.sendMessage2("service", "create", context.createServiceAccQuery);
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.id).not.toBeNull();
            context.service1Id = data.id;
            return wsApi.sendMessage2("order", "retrieve", { id:context.orderId })
        }).then(function(data) {
            expect(data).not.toBeNull();
            context.service = data.services[0];
            context.itemsService = context.service.items[0][0];
            expect(context.itemsSearch.type).toBe(context.itemsService.type);
            expect(context.itemsSearch.meal).toBe(context.itemsService.meal);
            // markup 5%
            var commerce = context.service.commerce;
            expect(context.commerceSearch.payment).toBe(parseFloat((commerce.payment).toFixed(2)));
            expect(context.commerceSearch.original).toBe(parseFloat((commerce.original).toFixed(2)));

            done();
        }).catch(function (response) {
            console.error(response);
            fail("Не работает тест на поиск в RatesUpload!");
            done();
        });
    }, 15000);
});
