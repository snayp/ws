describe("common service", function () {
    var wsApi = new WsApi(Settings.wsApiLocation);
    var payment = new Payment(Settings.paymentApiLocation, Settings.apiLocation);
    var cOrderAction = new CommonOrderAction(wsApi, payment);

    var createFullPersonQuery = {
        name: {
            first: "First",
            middle: "Middle",
            last: "Last"
        },
        birthday: 636854400000,
        gender: "male",
        contacts: {
            mobiles: [
                {
                    prefix: {
                        id: "CO350220RU", // Russia
                        name: "Russia",
                        num: "7"
                    },
                    num: "9113456789"
                },
                {
                    prefix: {
                        id: "CO350220RU", // Russia
                        name: "Russia",
                        num: "7"
                    },
                    num: "1123456763"
                }
            ],
            phones: [
                {
                    prefix: {
                        id: "CO350220RU", // Russia
                        name: "Russia",
                        num: "7"
                    },
                    num: "123456789"
                },
                {
                    prefix: {
                        id: "CO350220RU", // Russia
                        name: "Russia",
                        num: "7"
                    },
                    num: "234665456"
                }
            ],
            email: "fgtyu@connectflexi.com",
            addrs: [
                {
                    mcountry: {
                        id: "CO424242UN",
                        name: "United Kingdom"
                    },
                    region: "El Morro",
                    city: "Islamabad",
                    district: "Columbia",
                    street: "Lenina",
                    pcode: "478308"
                }
            ]
        },
        docs: [
            {
                type: 1,
                num: "2343453457",
                expdate: 2056924800000,//18.08.2035
                issdate: 1268006400000,//18.08.2010
                issby: "Baumanskiy ROVD",
                visa: true,
                scans: Settings.person.scans,
                nation: {
                    id: "CO350220RU",
                    name: "Russia"
                }
            },
            {
                type: 0,
                num: "234345345",
                expdate: 2056924800000,//18.08.2035
                issdate: 1268006400000,//18.08.2010
                issby: "Presnenskiy ROVD",
                visa: true,
                scans: Settings.person.scans,
                nation: {
                    id: "CO350220RU",
                    name: "Russia"
                }
            }
        ]
    };
    
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

    afterAll(function() {
        wsApi.sendMessage("account", "logout", null, function(done) {
            expect(true).toBeTruthy();
            done();
        });
    });

    it("pay acc, transfer, flight (card)", function(done) {
        var context = {};
        cOrderAction.createOrderWithPayer().then(function(data) {
            expect(data).not.toBeNull();
            expect(data.orderId).not.toBeNull();
            expect(data.payerId).not.toBeNull();
            context = data;
            return wsApi.sendMessage2("person", "create", createFullPersonQuery);
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.id).not.toBeNull();
            context.personId = data.id;
            return cOrderAction.addAccommodationToOrder(context.orderId, context.payerId);
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.serviceId).not.toBeNull();
            context.accId = data.serviceId;
            var linkAccQuery = {
                "service": context.accId,
                "tourist": context.personId,
                "item" : 0
            };
            return wsApi.sendMessage2("service", "linktourist", linkAccQuery);
        }).then(function(data) {
            return cOrderAction.addTransferToOrder(context.orderId, context.payerId);
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.serviceId).not.toBeNull();
            context.transferId = data.serviceId;
            var linkTransferQuery = {
                "service": context.transferId,
                "tourist": context.personId
            };
            return wsApi.sendMessage2("service", "linktourist", linkTransferQuery);
        }).then(function(data) {
            return cOrderAction.addFlightToOrder(context.orderId, context.payerId);
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.serviceId).not.toBeNull();
            context.flightId = data.serviceId;
            var linkFlightQuery = {
                "service": context.flightId,
                "tourist": context.personId
            };
            return wsApi.sendMessage2("service", "linktourist", linkFlightQuery);
        }).then(function(data) {
            return wsApi.sendMessage2("person", "retrieve", { id:context.personId });
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.id).not.toBeNull();
            expect(data.docs).not.toBeNull();
            expect(data.docs.length).toBeGreaterThan(0);
            expect(data.docs[0]).not.toBeNull();
            expect(data.docs[0].id).not.toBeNull();
            context.docId = data.docs[0].id;
            var updateQuery = {
                service: context.flightId,
                docs: [{
                    person: context.personId,
                    doc: context.docId
                }]
            };
            return wsApi.sendMessage2("service", "update", updateQuery);
        }).then(function(data) {
            return cOrderAction.payOrderCard(context.orderId);
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.status).toBe(20);
            expect(data.services).not.toBeNull();
            expect(data.services.length).toBe(3);
            expect(data.services[0].status).toBe(20);
            expect(data.services[1].status).toBe(20);
            expect(data.services[2].status).toBe(20);

            done(); 
        });
    }, 40000);

    it("book acc, transfer, flight (deposit)", function(done) {
        var context = {};
        cOrderAction.createOrderWithPayer().then(function(data) {
            expect(data).not.toBeNull();
            expect(data.orderId).not.toBeNull();
            expect(data.payerId).not.toBeNull();
            context = data;
            return wsApi.sendMessage2("person", "create", createFullPersonQuery);
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.id).not.toBeNull();
            context.personId = data.id;
            return cOrderAction.addAccommodationToOrder(context.orderId, context.payerId);
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.serviceId).not.toBeNull();
            context.accId = data.serviceId;
            var linkAccQuery = {
                "service": context.accId,
                "tourist": context.personId,
                "item" : 0
            };
            return wsApi.sendMessage2("service", "linktourist", linkAccQuery);
        }).then(function(data) {
            return cOrderAction.addTransferToOrder(context.orderId, context.payerId);
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.serviceId).not.toBeNull();
            context.transferId = data.serviceId;
            var linkTransferQuery = {
                "service": context.transferId,
                "tourist": context.personId
            };
            return wsApi.sendMessage2("service", "linktourist", linkTransferQuery);
        }).then(function(data) {
            return cOrderAction.addFlightToOrder(context.orderId, context.payerId);
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.serviceId).not.toBeNull();
            context.flightId = data.serviceId;
            var linkFlightQuery = {
                "service": context.flightId,
                "tourist": context.personId
            };
            return wsApi.sendMessage2("service", "linktourist", linkFlightQuery);
        }).then(function(data) {
            return wsApi.sendMessage2("person", "retrieve", { id:context.personId });
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.id).not.toBeNull();
            expect(data.docs).not.toBeNull();
            expect(data.docs.length).toBeGreaterThan(0);
            expect(data.docs[0]).not.toBeNull();
            expect(data.docs[0].id).not.toBeNull();
            context.docId = data.docs[0].id;
            var updateQuery = {
                service: context.flightId,
                docs: [{
                    person: context.personId,
                    doc: context.docId
                }]
            };
            return wsApi.sendMessage2("service", "update", updateQuery);
        }).then(function(data) {
            return cOrderAction.payOrderDeposit(context.orderId);
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.status).toBe(20);
            expect(data.services).not.toBeNull();
            expect(data.services.length).toBe(3);
            expect(data.services[0].status).toBe(20);
            expect(data.services[1].status).toBe(20);
            expect(data.services[2].status).toBe(20);
            
            done(); 
        });
    }, 35000);

    it("cancel after pay acc, transfer, flight (card)", function(done) {
        var context = {};
        cOrderAction.createOrderWithPayer().then(function(data) {
            expect(data).not.toBeNull();
            expect(data.orderId).not.toBeNull();
            expect(data.payerId).not.toBeNull();
            context = data;
            return wsApi.sendMessage2("person", "create", createFullPersonQuery);
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.id).not.toBeNull();
            context.personId = data.id;
            return cOrderAction.addAccommodationToOrder(context.orderId, context.payerId);
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.serviceId).not.toBeNull();
            context.accId = data.serviceId;
            var linkAccQuery = {
                "service": context.accId,
                "tourist": context.personId,
                "item" : 0
            };
            return wsApi.sendMessage2("service", "linktourist", linkAccQuery);
        }).then(function(data) {
            return cOrderAction.addTransferToOrder(context.orderId, context.payerId);
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.serviceId).not.toBeNull();
            context.transferId = data.serviceId;
            var linkTransferQuery = {
                "service": context.transferId,
                "tourist": context.personId
            };
            return wsApi.sendMessage2("service", "linktourist", linkTransferQuery);
        }).then(function(data) {
            return cOrderAction.addFlightToOrder(context.orderId, context.payerId);
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.serviceId).not.toBeNull();
            context.flightId = data.serviceId;
            var linkFlightQuery = {
                "service": context.flightId,
                "tourist": context.personId
            };
            return wsApi.sendMessage2("service", "linktourist", linkFlightQuery);
        }).then(function(data) {
            return wsApi.sendMessage2("person", "retrieve", { id:context.personId });
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.id).not.toBeNull();
            expect(data.docs).not.toBeNull();
            expect(data.docs.length).toBeGreaterThan(0);
            expect(data.docs[0]).not.toBeNull();
            expect(data.docs[0].id).not.toBeNull();
            context.docId = data.docs[0].id;
            var updateQuery = {
                service: context.flightId,
                docs: [{
                    person: context.personId,
                    doc: context.docId
                }]
            };
            return wsApi.sendMessage2("service", "update", updateQuery);
        }).then(function(data) {
            return cOrderAction.payOrderCard(context.orderId);
        }).then(function() {
            return cOrderAction.cancelService(context.accId);
        }).then(function(data) {
            return cOrderAction.cancelService(context.transferId);
        }).then(function(data) {
            return cOrderAction.cancelService(context.flightId);
        }).then(function(data) {
            return wsApi.sendMessage2("order", "retrieve", { id:context.orderId });
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.status).toBe(80);
            expect(data.services).not.toBeNull();
            expect(data.services.length).toBe(3);
            expect(data.services[0].status).toBe(80);
            expect(data.services[1].status).toBe(80);
            expect(data.services[2].status).toBe(80);
            
            done();
        }).catch(function (response) {
            console.error(response);
            fail("Тест не работает!");
            done();
        });
    }, 35000);

    it("rejected after book acc, transfer, flight (card)", function(done) {
        var context = {};
        cOrderAction.createOrderWithPayer().then(function(data) {
            expect(data).not.toBeNull();
            expect(data.orderId).not.toBeNull();
            expect(data.payerId).not.toBeNull();
            context = data;
            return wsApi.sendMessage2("person", "create", createFullPersonQuery);
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.id).not.toBeNull();
            context.personId = data.id;
            return cOrderAction.addAccommodationToOrder(context.orderId, context.payerId, cOrderAction.offer3Dto);
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.serviceId).not.toBeNull();
            context.accId = data.serviceId;
            var linkAccQuery = {
                "service": context.accId,
                "tourist": context.personId,
                "item" : 0
            };
            return wsApi.sendMessage2("service", "linktourist", linkAccQuery);
        }).then(function(data) {
            return cOrderAction.addTransferToOrder(context.orderId, context.payerId, cOrderAction.offerTransfer3DTO);
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.serviceId).not.toBeNull();
            context.transferId = data.serviceId;
            var linkTransferQuery = {
                "service": context.transferId,
                "tourist": context.personId
            };
            return wsApi.sendMessage2("service", "linktourist", linkTransferQuery);
        }).then(function(data) {
            return cOrderAction.addFlightToOrder(context.orderId, context.payerId, cOrderAction.offerFlight3DTO);
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.serviceId).not.toBeNull();
            context.flightId = data.serviceId;
            var linkFlightQuery = {
                "service": context.flightId,
                "tourist": context.personId
            };
            return wsApi.sendMessage2("service", "linktourist", linkFlightQuery);
        }).then(function(data) {
            return cOrderAction.payOrderCard(context.orderId);
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.status).toBe(70);
            expect(data.services).not.toBeNull();
            expect(data.services.length).toBe(3);
            expect(data.services[0].status).toBe(70);
            expect(data.services[1].status).toBe(70);
            expect(data.services[2].status).toBe(70);
            
            done();
        }).catch(function (response) {
            console.error(response);
            fail("Тест не работает!");
            done();
        });
    }, 30000);

    it("rejected after book acc, transfer, flight (deposit)", function(done) {
        var context = {};
        var query = {
            key: generateUUID(),
            login: Settings.user.login,
            pass: Settings.user.pass
        };
        wsApi.sendMessage2("account", "login", query).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.login).not.toBeNull();
            expect(data.agent).toBeTruthy();
            expect(data.deposit).not.toBeNull();
            context.deposits = data.deposits;
            return cOrderAction.createOrderWithPayer();
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.orderId).not.toBeNull();
            expect(data.payerId).not.toBeNull();
            context.orderId = data.orderId;
            context.payerId = data.payerId;
            return wsApi.sendMessage2("person", "create", createFullPersonQuery);
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.id).not.toBeNull();
            context.personId = data.id;
            return cOrderAction.addAccommodationToOrder(context.orderId, context.payerId, cOrderAction.offer3Dto);
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.serviceId).not.toBeNull();
            context.accId = data.serviceId;
            var linkAccQuery = {
                "service": context.accId,
                "tourist": context.personId,
                "item" : 0
            };
            return wsApi.sendMessage2("service", "linktourist", linkAccQuery);
        }).then(function(data) {
            return cOrderAction.addTransferToOrder(context.orderId, context.payerId, cOrderAction.offerTransfer3DTO);
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.serviceId).not.toBeNull();
            context.transferId = data.serviceId;
            var linkTransferQuery = {
                "service": context.transferId,
                "tourist": context.personId
            };
            return wsApi.sendMessage2("service", "linktourist", linkTransferQuery);
        }).then(function(data) {
            return cOrderAction.addFlightToOrder(context.orderId, context.payerId, cOrderAction.offerFlight3DTO);
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.serviceId).not.toBeNull();
            context.flightId = data.serviceId;
            var linkFlightQuery = {
                "service": context.flightId,
                "tourist": context.personId
            };
            return wsApi.sendMessage2("service", "linktourist", linkFlightQuery);
        }).then(function(data) {
            return cOrderAction.payOrderDeposit(context.orderId);
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.status).toBe(70);
            expect(data.services).not.toBeNull();
            expect(data.services.length).toBe(3);
            expect(data.services[0].status).toBe(70);
            expect(data.services[1].status).toBe(70);
            expect(data.services[2].status).toBe(70);
            context.toBePaid = data.services[0].commerce.payment + data.services[1].commerce.payment + data.services[2].commerce.payment;

            return wsApi.sendMessage2("deposit", "retrieve");
        }).then(function(data) {
            expect(data).not.toBeNull();
            var currentEurDeposit = data.deposits.filter(deposit => Object.is(deposit.id, "978"))[0];
            var contextEurDeposit = context.deposits.filter(deposit => Object.is(deposit.id, "978"))[0];
            expect(currentEurDeposit).not.toBeNull();
            expect(currentEurDeposit.amount).toBe(parseFloat((contextEurDeposit.amount-context.toBePaid).toFixed(2)));

            var currentUsdDeposit = data.deposits.filter(deposit => Object.is(deposit.id, "840"))[0];
            var contextUsdDeposit = context.deposits.filter(deposit => Object.is(deposit.id, "840"))[0];
            expect(currentUsdDeposit).not.toBeNull();
            expect(currentUsdDeposit.amount).toBe(contextUsdDeposit.amount);

            done();
        }).catch(function (response) {
            console.error(response);
            fail("Тест не работает!");
            done();
        });
    }, 30000);

    it("rejected after book acc (card)", function(done) {
        var context = {};
        
        cOrderAction.createOrderWithPayer().then(function(data) {
            expect(data).not.toBeNull();
            expect(data.orderId).not.toBeNull();
            expect(data.payerId).not.toBeNull();
            context.orderId = data.orderId;
            context.payerId = data.payerId;
            return wsApi.sendMessage2("person", "create", createFullPersonQuery);
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.id).not.toBeNull();
            context.personId = data.id;
            return cOrderAction.addAccommodationToOrder(context.orderId, context.payerId, cOrderAction.offer3Dto);
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.serviceId).not.toBeNull();
            context.serviceId = data.serviceId;
            var linkAccQuery = {
                "service": context.serviceId,
                "tourist": context.personId,
                "item" : 0
            };
            return wsApi.sendMessage2("service", "linktourist", linkAccQuery);
        }).then(function(data) {
            return cOrderAction.payServiceCard(context.orderId, context.serviceId);
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.status).toBe(70);
            expect(data.services).not.toBeNull();
            expect(data.services.length).toBe(1);
            expect(data.services[0].status).toBe(70);
            
            done();
        }).catch(function (response) {
            console.error(response);
            fail("Тест не работает!");
            done();
        });
    }, 30000);

    it("rejected after book acc (deposit)", function(done) {
        var context = {};
        var query = {
            key: generateUUID(),
            login: Settings.user.login,
            pass: Settings.user.pass
        };
        wsApi.sendMessage2("account", "login", query).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.login).not.toBeNull();
            expect(data.agent).toBeTruthy();
            expect(data.deposit).not.toBeNull();
            context.deposits = data.deposits;
            return cOrderAction.createOrderWithPayer();
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.orderId).not.toBeNull();
            expect(data.payerId).not.toBeNull();
            context.orderId = data.orderId;
            context.payerId = data.payerId;
            return wsApi.sendMessage2("person", "create", createFullPersonQuery);
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.id).not.toBeNull();
            context.personId = data.id;
            return cOrderAction.addAccommodationToOrder(context.orderId, context.payerId, cOrderAction.offer3Dto);
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.serviceId).not.toBeNull();
            context.serviceId = data.serviceId;
            var linkAccQuery = {
                "service": context.serviceId,
                "tourist": context.personId,
                "item" : 0
            };
            return wsApi.sendMessage2("service", "linktourist", linkAccQuery);
        }).then(function(data) {
            return cOrderAction.payServiceDeposit(context.orderId, context.serviceId);
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.status).toBe(70);
            expect(data.services).not.toBeNull();
            expect(data.services.length).toBe(1);
            expect(data.services[0].status).toBe(70);
            context.toBePaid = data.services[0].commerce.payment;

            return wsApi.sendMessage2("deposit", "retrieve");
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.deposit).not.toBeNull();

            var currentEurDeposit = data.deposits.filter(deposit => Object.is(deposit.id, "978"))[0];
            var contextEurDeposit = context.deposits.filter(deposit => Object.is(deposit.id, "978"))[0];
            expect(currentEurDeposit).not.toBeNull();
            expect(currentEurDeposit.amount).toBe(parseFloat((contextEurDeposit.amount-context.toBePaid).toFixed(2)));

            var currentUsdDeposit = data.deposits.filter(deposit => Object.is(deposit.id, "840"))[0];
            var contextUsdDeposit = context.deposits.filter(deposit => Object.is(deposit.id, "840"))[0];
            expect(currentUsdDeposit).not.toBeNull();
            expect(currentUsdDeposit.amount).toBe(contextUsdDeposit.amount);

            done();
        }).catch(function (response) {
            console.error(response);
            fail("Тест не работает!");
            done();
        });
    }, 30000);

    it("sort by date of creation", function(done) {
        var context = {};
        wsApi.sendMessage2("order", "create", null).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.id).not.toBeNull();
            context.orderId = data.id;
            return cOrderAction.addAccommodationToOrder(context.orderId);
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.serviceId).not.toBeNull();
            context.accId1 = data.serviceId;
            return cOrderAction.addTransferToOrder(context.orderId);
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.serviceId).not.toBeNull();
            context.transferId1 = data.serviceId;
            return cOrderAction.addFlightToOrder(context.orderId);
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.serviceId).not.toBeNull();
            context.flightId1 = data.serviceId;
            return cOrderAction.addTransferToOrder(context.orderId);
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.serviceId).not.toBeNull();
            context.transferId2 = data.serviceId;
            return cOrderAction.addFlightToOrder(context.orderId);
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.serviceId).not.toBeNull();
            context.flightId2 = data.serviceId;
            return cOrderAction.addAccommodationToOrder(context.orderId);
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.serviceId).not.toBeNull();
            context.accId2 = data.serviceId;
            return wsApi.sendMessage2("order", "retrieve", { id:context.orderId });
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.services).not.toBeNull();
            expect(data.services.length).toBe(6);
            expect(data.services[0].id).toBe(context.accId1);
            expect(data.services[1].id).toBe(context.transferId1);
            expect(data.services[2].id).toBe(context.flightId1);
            expect(data.services[3].id).toBe(context.transferId2);
            expect(data.services[4].id).toBe(context.flightId2);
            expect(data.services[5].id).toBe(context.accId2);

            done();
        }).catch(function (response) {
            console.error(response);
            fail("Тест не работает!");
            done();
        });
    }, 25000);

    it("separate book acc, transfer, flight (all is ok)", function(done) {
        var context = {};
        cOrderAction.createOrderWithPayer().then(function(data) {
            expect(data).not.toBeNull();
            expect(data.orderId).not.toBeNull();
            expect(data.payerId).not.toBeNull();
            context = data;
            return wsApi.sendMessage2("person", "create", createFullPersonQuery);
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.id).not.toBeNull();
            context.personId = data.id;
            return cOrderAction.addAccommodationToOrder(context.orderId, context.payerId);
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.serviceId).not.toBeNull();
            context.accId = data.serviceId;
            var linkAccQuery = {
                "service": context.accId,
                "tourist": context.personId,
                "item" : 0
            };
            return wsApi.sendMessage2("service", "linktourist", linkAccQuery);
        }).then(function(data) {
            return cOrderAction.addTransferToOrder(context.orderId, context.payerId);
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.serviceId).not.toBeNull();
            context.transferId = data.serviceId;
            var linkTransferQuery = {
                "service": context.transferId,
                "tourist": context.personId
            };
            return wsApi.sendMessage2("service", "linktourist", linkTransferQuery);
        }).then(function(data) {
            return cOrderAction.addFlightToOrder(context.orderId, context.payerId);
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.serviceId).not.toBeNull();
            context.flightId = data.serviceId;
            var linkFlightQuery = {
                "service": context.flightId,
                "tourist": context.personId
            };
            return wsApi.sendMessage2("service", "linktourist", linkFlightQuery);
        }).then(function(data) {
            return wsApi.sendMessage2("person", "retrieve", { id:context.personId });
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.id).not.toBeNull();
            expect(data.docs).not.toBeNull();
            expect(data.docs.length).toBeGreaterThan(0);
            expect(data.docs[0]).not.toBeNull();
            expect(data.docs[0].id).not.toBeNull();
            context.docId = data.docs[0].id;
            var updateQuery = {
                service: context.flightId,
                docs: [{
                    person: context.personId,
                    doc: context.docId
                }]
            };
            return wsApi.sendMessage2("service", "update", updateQuery);
        }).then(function(data) {
            cOrderAction.bookService(context.accId);
            cOrderAction.bookService(context.transferId);
            cOrderAction.bookService(context.flightId);
        }).then(function(data) {
            return sleep(8000).then(() => {
                return wsApi.sendMessage2("order", "retrieve", { id:context.orderId });
            });
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.status).toBe(10);
            expect(data.services).not.toBeNull();
            expect(data.services.length).toBe(3);
            expect(data.services[0].status).toBe(10);
            expect(data.services[1].status).toBe(10);
            expect(data.services[2].status).toBe(10);

            done();
        }).catch(function (response) {
            console.error(response);
            fail("Тест не работает!");
            done();
        });
    }, 15000);

    it("separate pay card acc, transfer, flight (all is ok)", function(done) {
        var context = {};
        cOrderAction.createOrderWithPayer().then(function(data) {
            expect(data).not.toBeNull();
            expect(data.orderId).not.toBeNull();
            expect(data.payerId).not.toBeNull();
            context = data;
            return wsApi.sendMessage2("person", "create", createFullPersonQuery);
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.id).not.toBeNull();
            context.personId = data.id;
            return cOrderAction.addAccommodationToOrder(context.orderId, context.payerId);
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.serviceId).not.toBeNull();
            context.accId = data.serviceId;
            var linkAccQuery = {
                "service": context.accId,
                "tourist": context.personId,
                "item" : 0
            };
            return wsApi.sendMessage2("service", "linktourist", linkAccQuery);
        }).then(function(data) {
            return cOrderAction.addTransferToOrder(context.orderId, context.payerId);
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.serviceId).not.toBeNull();
            context.transferId = data.serviceId;
            var linkTransferQuery = {
                "service": context.transferId,
                "tourist": context.personId
            };
            return wsApi.sendMessage2("service", "linktourist", linkTransferQuery);
        }).then(function(data) {
            return cOrderAction.addFlightToOrder(context.orderId, context.payerId);
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.serviceId).not.toBeNull();
            context.flightId = data.serviceId;
            var linkFlightQuery = {
                "service": context.flightId,
                "tourist": context.personId
            };
            return wsApi.sendMessage2("service", "linktourist", linkFlightQuery);
        }).then(function(data) {
            return wsApi.sendMessage2("person", "retrieve", { id:context.personId });
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.id).not.toBeNull();
            expect(data.docs).not.toBeNull();
            expect(data.docs.length).toBeGreaterThan(0);
            expect(data.docs[0]).not.toBeNull();
            expect(data.docs[0].id).not.toBeNull();
            context.docId = data.docs[0].id;
            var updateQuery = {
                service: context.flightId,
                docs: [{
                    person: context.personId,
                    doc: context.docId
                }]
            };
            return wsApi.sendMessage2("service", "update", updateQuery);
        }).then(function(data) {
            return cOrderAction.payServiceCard(context.orderId, context.accId);
        }).then(function(data) {
            return cOrderAction.payServiceCard(context.orderId, context.transferId);
        }).then(function(data) {
            return cOrderAction.payServiceCard(context.orderId, context.flightId);
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.status).toBe(20);
            expect(data.services).not.toBeNull();
            expect(data.services.length).toBe(3);
            expect(data.services[0].status).toBe(20);
            expect(data.services[1].status).toBe(20);
            expect(data.services[2].status).toBe(20);

            done();
        }).catch(function (response) {
            console.error(response);
            fail("Тест не работает!");
            done();
        });
    }, 40000);

    it("separate pay deposit acc, transfer, flight (all is ok)", function(done) {
        var context = {};
        cOrderAction.createOrderWithPayer().then(function(data) {
            expect(data).not.toBeNull();
            expect(data.orderId).not.toBeNull();
            expect(data.payerId).not.toBeNull();
            context = data;
            return wsApi.sendMessage2("person", "create", createFullPersonQuery);
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.id).not.toBeNull();
            context.personId = data.id;
            return cOrderAction.addAccommodationToOrder(context.orderId, context.payerId);
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.serviceId).not.toBeNull();
            context.accId = data.serviceId;
            var linkAccQuery = {
                "service": context.accId,
                "tourist": context.personId,
                "item" : 0
            };
            return wsApi.sendMessage2("service", "linktourist", linkAccQuery);
        }).then(function(data) {
            return cOrderAction.addTransferToOrder(context.orderId, context.payerId);
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.serviceId).not.toBeNull();
            context.transferId = data.serviceId;
            var linkTransferQuery = {
                "service": context.transferId,
                "tourist": context.personId
            };
            return wsApi.sendMessage2("service", "linktourist", linkTransferQuery);
        }).then(function(data) {
            return cOrderAction.addFlightToOrder(context.orderId, context.payerId);
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.serviceId).not.toBeNull();
            context.flightId = data.serviceId;
            var linkFlightQuery = {
                "service": context.flightId,
                "tourist": context.personId
            };
            return wsApi.sendMessage2("service", "linktourist", linkFlightQuery);
        }).then(function(data) {
            return wsApi.sendMessage2("person", "retrieve", { id:context.personId });
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.id).not.toBeNull();
            expect(data.docs).not.toBeNull();
            expect(data.docs.length).toBeGreaterThan(0);
            expect(data.docs[0]).not.toBeNull();
            expect(data.docs[0].id).not.toBeNull();
            context.docId = data.docs[0].id;
            var updateQuery = {
                service: context.flightId,
                docs: [{
                    person: context.personId,
                    doc: context.docId
                }]
            };
            return wsApi.sendMessage2("service", "update", updateQuery);
        }).then(function(data) {
            cOrderAction.payServiceDeposit(context.orderId, context.accId);
            cOrderAction.payServiceDeposit(context.orderId, context.transferId);
            cOrderAction.payServiceDeposit(context.orderId, context.flightId);
        }).then(function(data) {
            return sleep(10000).then(() => {
                return wsApi.sendMessage2("order", "retrieve", { id:context.orderId });
            });
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.status).toBe(20);
            expect(data.services).not.toBeNull();
            expect(data.services.length).toBe(3);
            expect(data.services[0].status).toBe(20);
            expect(data.services[1].status).toBe(20);
            expect(data.services[2].status).toBe(20);

            done();
        }).catch(function (response) {
            console.error(response);
            fail("Тест не работает!");
            done();
        });
    }, 35000);

    it("separate book acc, transfer, flight (2 - ok, 1 - rejected)", function(done) {
        var context = {};
        cOrderAction.createOrderWithPayer().then(function(data) {
            expect(data).not.toBeNull();
            expect(data.orderId).not.toBeNull();
            expect(data.payerId).not.toBeNull();
            context = data;
            return wsApi.sendMessage2("person", "create", createFullPersonQuery);
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.id).not.toBeNull();
            context.personId = data.id;
            return cOrderAction.addAccommodationToOrder(context.orderId, context.payerId);
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.serviceId).not.toBeNull();
            context.accId = data.serviceId;
            var linkAccQuery = {
                "service": context.accId,
                "tourist": context.personId,
                "item" : 0
            };
            return wsApi.sendMessage2("service", "linktourist", linkAccQuery);
        }).then(function(data) {
            return cOrderAction.addTransferToOrder(context.orderId, context.payerId, cOrderAction.offerTransfer3DTO);
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.serviceId).not.toBeNull();
            context.transferId = data.serviceId;
            var linkTransferQuery = {
                "service": context.transferId,
                "tourist": context.personId
            };
            return wsApi.sendMessage2("service", "linktourist", linkTransferQuery);
        }).then(function(data) {
            return cOrderAction.addFlightToOrder(context.orderId, context.payerId);
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.serviceId).not.toBeNull();
            context.flightId = data.serviceId;
            var linkFlightQuery = {
                "service": context.flightId,
                "tourist": context.personId
            };
            return wsApi.sendMessage2("service", "linktourist", linkFlightQuery);
        }).then(function(data) {
            return wsApi.sendMessage2("person", "retrieve", { id:context.personId });
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.id).not.toBeNull();
            expect(data.docs).not.toBeNull();
            expect(data.docs.length).toBeGreaterThan(0);
            expect(data.docs[0]).not.toBeNull();
            expect(data.docs[0].id).not.toBeNull();
            context.docId = data.docs[0].id;
            var updateQuery = {
                service: context.flightId,
                docs: [{
                    person: context.personId,
                    doc: context.docId
                }]
            };
            return wsApi.sendMessage2("service", "update", updateQuery);
        }).then(function(data) {
            cOrderAction.bookService(context.accId);
            cOrderAction.bookService(context.transferId);
            cOrderAction.bookService(context.flightId);
        }).then(function(data) {
            return sleep(8000).then(() => {
                return wsApi.sendMessage2("order", "retrieve", { id:context.orderId });
            });
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.status).toBe(10, "Booked приоритетнее чем Rejected");
            expect(data.services).not.toBeNull();
            expect(data.services.length).toBe(3);
            expect(data.services[0].status).toBe(10);
            expect(data.services[1].status).toBe(70);
            expect(data.services[2].status).toBe(10);

            done();
        }).catch(function (response) {
            console.error(response);
            fail("Тест не работает!");
            done();
        });
    }, 20000);

    it("separate pay card acc, transfer, flight (2 - ok, 1 - rejected)", function(done) {
        var context = {};
        cOrderAction.createOrderWithPayer().then(function(data) {
            expect(data).not.toBeNull();
            expect(data.orderId).not.toBeNull();
            expect(data.payerId).not.toBeNull();
            context = data;
            return wsApi.sendMessage2("person", "create", createFullPersonQuery);
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.id).not.toBeNull();
            context.personId = data.id;
            return cOrderAction.addAccommodationToOrder(context.orderId, context.payerId);
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.serviceId).not.toBeNull();
            context.accId = data.serviceId;
            var linkAccQuery = {
                "service": context.accId,
                "tourist": context.personId,
                "item" : 0
            };
            return wsApi.sendMessage2("service", "linktourist", linkAccQuery);
        }).then(function(data) {
            return cOrderAction.addTransferToOrder(context.orderId, context.payerId);
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.serviceId).not.toBeNull();
            context.transferId = data.serviceId;
            var linkTransferQuery = {
                "service": context.transferId,
                "tourist": context.personId
            };
            return wsApi.sendMessage2("service", "linktourist", linkTransferQuery);
        }).then(function(data) {
            return cOrderAction.addFlightToOrder(context.orderId, context.payerId, cOrderAction.offerFlight3DTO);
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.serviceId).not.toBeNull();
            context.flightId = data.serviceId;
            var linkFlightQuery = {
                "service": context.flightId,
                "tourist": context.personId
            };
            return wsApi.sendMessage2("service", "linktourist", linkFlightQuery);
        }).then(function(data) {
            return cOrderAction.payServiceCard(context.orderId, context.accId);
        }).then(function(data) {
            return cOrderAction.payServiceCard(context.orderId, context.transferId);
        }).then(function(data) {
            return cOrderAction.payServiceCard(context.orderId, context.flightId);
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.status).toBe(20, "OK приоритетнее чем Rejected");
            expect(data.services).not.toBeNull();
            expect(data.services.length).toBe(3);
            expect(data.services[0].status).toBe(20);
            expect(data.services[1].status).toBe(20);
            expect(data.services[2].status).toBe(70);

            done();
        }).catch(function (response) {
            console.error(response);
            fail("Тест не работает!");
            done();
        });
    }, 40000);

    it("separate pay deposit acc, transfer, flight (2 - ok, 1 - rejected)", function(done) {
        var context = {};
        cOrderAction.createOrderWithPayer().then(function(data) {
            expect(data).not.toBeNull();
            expect(data.orderId).not.toBeNull();
            expect(data.payerId).not.toBeNull();
            context = data;
            return wsApi.sendMessage2("person", "create", createFullPersonQuery);
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.id).not.toBeNull();
            context.personId = data.id;
            return cOrderAction.addAccommodationToOrder(context.orderId, context.payerId);
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.serviceId).not.toBeNull();
            context.accId = data.serviceId;
            var linkAccQuery = {
                "service": context.accId,
                "tourist": context.personId,
                "item" : 0
            };
            return wsApi.sendMessage2("service", "linktourist", linkAccQuery);
        }).then(function(data) {
            return cOrderAction.addTransferToOrder(context.orderId, context.payerId);
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.serviceId).not.toBeNull();
            context.transferId = data.serviceId;
            var linkTransferQuery = {
                "service": context.transferId,
                "tourist": context.personId
            };
            return wsApi.sendMessage2("service", "linktourist", linkTransferQuery);
        }).then(function(data) {
            return cOrderAction.addFlightToOrder(context.orderId, context.payerId, cOrderAction.offerFlight3DTO);
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.serviceId).not.toBeNull();
            context.flightId = data.serviceId;
            var linkFlightQuery = {
                "service": context.flightId,
                "tourist": context.personId
            };
            return wsApi.sendMessage2("service", "linktourist", linkFlightQuery);
        }).then(function(data) {
            cOrderAction.payServiceDeposit(context.orderId, context.accId);
            cOrderAction.payServiceDeposit(context.orderId, context.transferId);
            cOrderAction.payServiceDeposit(context.orderId, context.flightId);
        }).then(function(data) {
            return sleep(10000).then(() => {
                return wsApi.sendMessage2("order", "retrieve", { id:context.orderId });
            });
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.status).toBe(20, "OK приоритетнее чем Rejected");
            expect(data.services).not.toBeNull();
            expect(data.services.length).toBe(3);
            expect(data.services[0].status).toBe(20);
            expect(data.services[1].status).toBe(20);
            expect(data.services[2].status).toBe(70);

            done();
        }).catch(function (response) {
            console.error(response);
            fail("Тест не работает!");
            done();
        });
    }, 20000);
    
    it("book order with acc and payer", function(done) {
        var context = {};
        cOrderAction.createOrderWith1Service(cOrderAction.offer1Dto, "encodehoteloffer", "accommodation", 0, Settings.payerId).then(function(data) {
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
        }).catch(function (response) {
            console.error(response);
            fail("Тест не работает!");
            done();
        });
    }, 20000);

    it("delete order with booked(payed) service", function(done) {
        var context = {};
        cOrderAction.createOrderWithPayer().then(function(data) {
            expect(data).not.toBeNull();
            expect(data.orderId).not.toBeNull();
            expect(data.payerId).not.toBeNull();
            context = data;
            return wsApi.sendMessage2("person", "create", createFullPersonQuery);
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.id).not.toBeNull();
            context.personId = data.id;
            return cOrderAction.addAccommodationToOrder(context.orderId, context.payerId);
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.serviceId).not.toBeNull();
            context.accId = data.serviceId;
            var linkAccQuery = {
                "service": context.accId,
                "tourist": context.personId,
                "item" : 0
            };
            return wsApi.sendMessage2("service", "linktourist", linkAccQuery);
        }).then(function(data) {
            return cOrderAction.addTransferToOrder(context.orderId, context.payerId);
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.serviceId).not.toBeNull();
            context.transferId = data.serviceId;
            var linkTransferQuery = {
                "service": context.transferId,
                "tourist": context.personId
            };
            return wsApi.sendMessage2("service", "linktourist", linkTransferQuery);
        }).then(function(data) {
            return sleep(5000).then(() => {
                return cOrderAction.payServiceCard(context.orderId, context.accId);
            });
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.status).toBe(20, "Если есть оплаченный закза, то order в статусе Ok(20)");
            expect(data.services).not.toBeNull();
            expect(data.services.length).toBe(2);
            expect(data.services[0].status).toBe(20);
            expect(data.services[1].status).toBeUndefined();
            return wsApi.sendMessage2("order", "delete", { id:context.orderId });
        }).then(function() {
            return wsApi.sendMessage2("order", "retrieve", { id:context.orderId });
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.status).toBe(80);
            expect(data.services).not.toBeNull();
            expect(data.services.length).toBe(1);
            expect(data.services[0].status).toBe(80);

            done();
        }).catch(function (response) {
            console.error(response);
            fail("Тест не работает!");
            done();
        });
    }, 30000);

    it("timelimit settings", function(done) {
        var context = {};
        cOrderAction.createOrderWithPayer().then(function(data) {
            expect(data).not.toBeNull();
            expect(data.orderId).not.toBeNull();
            expect(data.payerId).not.toBeNull();
            context = data;
            return wsApi.sendMessage2("person", "create", createFullPersonQuery);
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.id).not.toBeNull();
            context.personId = data.id;
            context.accOffer = cOrderAction.offer2Dto;
            return cOrderAction.addAccommodationToOrder(context.orderId, context.payerId, context.accOffer );
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.serviceId).not.toBeNull();
            context.accId = data.serviceId;
            context.transferOffer = cOrderAction.offerTransfer2DTO;
            return cOrderAction.addTransferToOrder(context.orderId, context.payerId, context.transferOffer);
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.serviceId).not.toBeNull();
            context.transferId = data.serviceId;
            context.flightOffer = cOrderAction.offerFlight2DTO;
            return cOrderAction.addFlightToOrder(context.orderId, context.payerId, context.flightOffer);
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.serviceId).not.toBeNull();
            context.flightId = data.serviceId;
            return wsApi.sendMessage2("order", "retrieve", { id:context.orderId });
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.status).toBeUndefined();
            expect(data.services).not.toBeNull();
            expect(data.services.length).toBe(3);
            // timelimit for resttest -7 days
            var tlOffset = (24*9 - 3 + 6) * (60 * 60 * 1000); // 3 hours offset and 6 hours SferaJet timezone offset
            var accommodation = data.services[0];
            expect(accommodation.commerce).not.toBeNull();
            expect(accommodation.commerce.tl).not.toBeNull();
            expect(accommodation.items).not.toBeNull();
            expect(accommodation.items.length).toBe(1);
            var accTl = new Date(new Date(new Date(new Date(context.accOffer.tl).setHours(0)).setMinutes(0)).setSeconds(0)).setMilliseconds(0);
            expect(accommodation.commerce.tl).toBe(accTl - tlOffset);
            var transfer = data.services[1];
            expect(transfer.commerce).not.toBeNull();
            expect(transfer.commerce.tl).not.toBeNull();
            var transferTl = new Date(new Date(new Date(new Date(context.transferOffer.tl).setHours(0)).setMinutes(0)).setSeconds(0)).setMilliseconds(0);
            expect(transfer.commerce.tl).toBe(transferTl - tlOffset);
            var flight = data.services[2];
            expect(flight.commerce).not.toBeNull();
            expect(flight.commerce.tl).not.toBeNull();
            var flightTl = new Date(new Date(new Date(new Date(context.flightOffer.tl).setHours(0)).setMinutes(0)).setSeconds(0)).setMilliseconds(0);
            expect(flight.commerce.tl).toBe(flightTl - tlOffset);
            return wsApi.sendMessage2("order", "delete", { id:context.orderId });
        }).then(function() {
            done();
        }).catch(function (response) {
            console.error(response);
            fail("Тест не работает!");
            done();
        });
    }, 15000);

    xit("timelimit settings by days", function(done) {
        var context = {};
        var login = {
            key: generateUUID(),
            login: "test555",
            pass: "12345"
        };
        wsApi.sendMessage2("account", "login", login).then(function(data) {
            return cOrderAction.createOrderWithPayer();
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.orderId).not.toBeNull();
            expect(data.payerId).not.toBeNull();
            context = data;
            return wsApi.sendMessage2("person", "create", createFullPersonQuery);
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.id).not.toBeNull();
            context.personId = data.id;
            context.accOffer = cOrderAction.offer2Dto;
            return cOrderAction.addAccommodationToOrder(context.orderId, context.payerId, context.accOffer );
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.serviceId).not.toBeNull();
            context.flightId = data.serviceId;
            return wsApi.sendMessage2("order", "retrieve", { id:context.orderId });
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.status).toBeUndefined();
            expect(data.services).not.toBeNull();
            expect(data.services.length).toBe(1);
            // timelimit for resttest -7 days
            var tlOffset = (24*9 - 3 + 6) * (60 * 60 * 1000); // 3 hours offset and 6 hours SferaJet timezone offset
            var accommodation = data.services[0];
            expect(accommodation.commerce).not.toBeNull();
            expect(accommodation.commerce.tl).not.toBeNull();
            expect(accommodation.items).not.toBeNull();
            expect(accommodation.items.length).toBe(1);
            var accTl = new Date(new Date(new Date(new Date(context.accOffer.tl).setHours(0)).setMinutes(0)).setSeconds(0)).setMilliseconds(0);
            expect(accommodation.commerce.tl).toBe(accTl - tlOffset);
            return wsApi.sendMessage2("order", "delete", { id:context.orderId });
        }).then(function() {
            done();
        }).catch(function (response) {
            console.error(response);
            fail("Тест не работает!");
            done();
        });
    }, 15000);
});