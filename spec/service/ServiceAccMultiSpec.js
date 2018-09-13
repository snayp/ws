describe("accommodation multirooms service", function () {
    var wsApi = new WsApi(Settings.wsApiLocation);
    var hotel, room, offerSearch, orderId, serviceId;
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

    it("book rooms", function (done) {
        let context = {};
        cOrderAction.createOrderWith1Service(cOrderAction.HOTEL_OFFER_MULTIROOMS, "encodehoteloffer", "accommodation", 0, Settings.payerId).then(function(data) {
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
            fail("Тест не работает!");
            console.error(response);
            done();
        });

    }, 20000);

    it("search rooms", function (done) {
        const query = {
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
                    "adults": 2
                },
                {
                    "adults": 1
                }
            ],
            providers: ["test"]
        };

        wsApi.sendMessage2("service", "accommodation", query).then(function (data) {
            expect(data).not.toBeNull();
            expect(data.search).not.toBeNull();
            expect(data.search.length).toBeGreaterThan(0);
            expect(data.search.length).toBe(5);

            data.search.forEach((h,i) => {
                ServiceValidate.validateMultiAcc(h, "search[" + i + "]", query.families.length);
            });


            done();
        }).catch(function (response) {
            fail("Тест не работает!");
            console.error(response);
            done();
        });

    }, 20000);

    it("search and book rooms", function (done) {
        const searchQuery = {
            place: {
                "in": "CI861854PA"
            },
            num: 5,
            date: {
                "in": new Date().getTime() + 60 * 60 * 24 * 50 * 1000,
                "out": new Date().getTime() + 60 * 60 * 24 * 53 * 1000
            },
            families: [
                {
                    "adults": 2
                },
                {
                    "adults": 1
                }
            ],
            providers: ["test"]
        };
        let context = {};

        cOrderAction.searchWhileNotDone("accommodation", searchQuery).then(function (data) {
            expect(data.search.length).toBeGreaterThan(0);
            CommonValidate.notEmpty(data.search[0].commerce.offer, "data.search[0].commerce.offer");

            return cOrderAction.createOrderWithServiceAfterSearch({offer:data.search[0].commerce.offer, serviceType:"accommodation", linkItem:0, payerId:Settings.payerId});
        }).then(function(data) {
            context = data;
            const linkQuery = {
                service: context.serviceId,
                tourist: context.personId,
                item : 0
            };
            return wsApi.sendMessage2("service", "linktourist", linkQuery);
        }).then(function(data) {
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
            fail("Тест не работает!");
            console.error(response);
            done();
        });

    }, 20000);

    it("real search rooms", function (done) {
        const query = {
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
                    "adults": 2
                },
                {
                    "adults": 1
                }
            ]
        };
        let paginationQuery = function() {
            wsApi.sendMessage2("service", "accommodation", query).then(function (data) {
                expect(data).not.toBeNull();
                expect(data.search).not.toBeNull();

                var searchDone = data.done;
                if (!searchDone) {
                    setTimeout(function() {
                        paginationQuery();
                    }, 1500);
                    throw "WAIT";
                } else {
                    data.search.forEach((h,i) => {
                        ServiceValidate.validateMultiAcc(h, "search[" + i + "]", query.families.length);
                    });
                    done();
                }

            }).catch(function (response) {
                if(response === "WAIT") {
                    return;
                }
                fail("Не работает тест!");
                console.error(response);
                done();
            });

        };
        paginationQuery();



    }, 20000);


    it("search rooms with problems", function (done) {
        const searchQuery = {
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
                    "adults": 2
                },
                {
                    "adults": 1
                },
                {
                    "adults": 1
                }
            ],
            providers: ["test"]
        };
        cOrderAction.searchWhileNotDone("accommodation", searchQuery).then(function (data) {
            expect(data).not.toBeNull();
            expect(data.search).not.toBeNull();
            expect(data.search.length).toBe(1, "От тестового провайдера идёт всего один правильный вариант");
            expect(data.search[0].items.length).toBe(searchQuery.families.length, "Количество комнат должно соотвествовать тому, что искали");

            done();
        }).catch(function (response) {
            fail("Тест не работает!");
            console.error(response);
            done();
        });

    }, 20000);


});
