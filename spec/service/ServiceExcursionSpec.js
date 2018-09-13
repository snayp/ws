describe("excursion service", function () {
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

    it("search ratesupload", function (done) {
        const query = {
            num: 4,
            place: {
                in: "CI283374IS", //Turkey Istanbul
            },
            date: {
                in: new Date().getTime() + 60 * 60 * 24 * 40 * 1000,
                out : new Date().getTime() + 60 * 60 * 24 * 45 * 1000,
            },
            families: [
                {
                    adults: 4                    // кол-во взрослых
                }
            ],
            tour : true,
            providers: ["ratesupload"]
        };

        wsApi.sendMessage2("service", "excursion", query).then(function (data) {
            var d = data;
            var ds = d.search;
            var dl = ds.length;

            expect(d).not.toBeNull();
            expect(ds).not.toBeNull();
            expect(dl).toBeGreaterThan(0, "Контракт 293 не найден");
            ServiceValidate.validateExcursion(ds[0]);

            done();
        }).catch(function (response) {
            console.error(response);
            fail("Не работает тест на поиск в RatesUpload!");
            done();
        });
    });



    it("create (manual) and delete", function (done) {
        const offerDto = {
            eid : "EX19535537434IS",
            title : "2 Day Istanbul  Ephesus Plane Tour",
            days : 2,
            // duration : ,
            "pr":"test",
            "pp": 100,
            "pc": "EUR",
            "adt": 1,
            "in": new Date().getTime() + 60 * 60 * 24 * 85 * 1000,
            "bk": "testbookcode"
        };
        const ctx = {};

        wsApi.sendMessage2("test", "encodeexcusrionoffer", {offer: offerDto}).then(function (data) {
            expect(data.offer).not.toBeNull();
            ctx.offer = data.offer;

            //create order and service
            return wsApi.sendMessage2("order", "create", null);
        }).then(function (data) {
            ctx.orderId = data.id;

            //create service
            var createServiceQuery = {
                type: "excursion",
                orderid: ctx.orderId,
                offer: ctx.offer
            };

            return wsApi.sendMessage2("service", "create", createServiceQuery);
        }).then(function (data) {
            expect(data).not.toBeNull();
            expect(data.id).not.toBeNull();
            ctx.serviceId = data.id;

            return wsApi.sendMessage2("service", "delete", {service: data.id});
        }).then(function (data) {
            return wsApi.sendMessage2("order", "delete", {id: ctx.orderId});
        }).then(function (data) {
            done();
        }).catch(function (response) {
            console.error(response);
            fail("Создание с последующим удалением не работают!");
            done();
        });

    }, 10000);


    it("book", function (done) {
        let context = {};
        cOrderAction.createOrderWith1Service(cOrderAction.excursionOfferDto, "encodeexcusrionoffer", "excursion", undefined, Settings.payerId).then(function (ct) {
            context = ct;
            return cOrderAction.bookService(context.serviceId);
        }).then(function (data) {
            expect(data.status).toBe(5);
            expect(data.id).not.toBeNull();
            expect(data.id).toBe(context.orderId);
            expect(data.commerce.currency).toBe(978);

            return sleep(3000);
        }).then(function() {
            return wsApi.sendMessage2("order", "retrieve", { id:context.orderId })
        }).then(function (data) {
            expect(data).not.toBeNull();
            expect(data.status).toBe(10);

            done();
        });
    }, 20000);

    it("pay", function(done) {
        let context = {};
        cOrderAction.createOrderWith1Service(cOrderAction.excursionOfferDto, "encodeexcusrionoffer", "excursion", undefined, Settings.payerId).then(function(ct) {
            context = ct;
            return cOrderAction.payServiceCard(context.orderId, context.serviceId);
        }).then(function (data) {
            expect(data).not.toBeNull();
            expect(data.status).toBe(20);
            expect(data.id).not.toBeNull();
            expect(data.id).toBe(context.orderId);
            expect(data.commerce.currency).toBe(978);


            done();
        }).catch(function (response) {
            console.error(response);
            fail("Тест не работает!");
            done();
        });

    }, 20000);

    it("cancel", function(done) {
        let context = {};
        cOrderAction.createOrderWith1Service(cOrderAction.excursionOfferDto, "encodeexcusrionoffer", "excursion", undefined, Settings.payerId).then(function(ct) {
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

            return wsApi.sendMessage2("service", "cancel", { service:context.serviceId});
        }).then(function (data) {
            expect(data.status).toBe(80);
            done();
        }).catch(function (response) {
            console.error(response);
            fail("Тест не работает!");
            done();
        });
    }, 25000);

    it("has invoice", function(done) {
        let context = {};
        cOrderAction.createOrderWith1Service(cOrderAction.excursionOfferDto, "encodeexcusrionoffer", "excursion", undefined, Settings.payerId).then(function(ct) {
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
        }).catch(function (response) {
            console.error(response);
            fail("Получения инвойса не работает!");
            done();
        });
    });

    it("has voucher", function(done) {
        let context = {};
        cOrderAction.createOrderWith1Service(cOrderAction.excursionOfferDto, "encodeexcusrionoffer", "excursion", undefined, Settings.payerId).then(function(ct) {
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