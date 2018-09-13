
describe("eventticket service", function () {
    var wsApi = new WsApi(Settings.wsApiLocation);
    var payment = new Payment(Settings.paymentApiLocation, Settings.apiLocation);
    var cOrderAction = new CommonOrderAction(wsApi, payment);
    let serviceToDelete, orderToDelete;

    var settings = {
        settings: {
            lang: "en",
            payment: "978"
        }
    };

    function createEventTicketService(resultItem, quantity) {
        let seatsOffers = resultItem.seats.length > 0 ? [{
            offer: resultItem.seats[0].id
        }] : undefined;


        return cOrderAction.createOrderWithServiceAfterSearch({offer: resultItem.commerce.offer, serviceType: "eventticket", payerId: Settings.splitPayerId, serviceItems: seatsOffers, quantity: quantity});//offer, serviceType, linkItem, payerId, tourist, serviceItems
    }

    beforeEach(function(done) {   
        if (!wsApi.isWsAlive()) {
            wsApi = new WsApi(Settings.wsApiLocation);
            cOrderAction = new CommonOrderAction(wsApi, payment);
            wsApi.open({
                open : function () {
                    var query = {
                        key: generateUUID(),
                        login: Settings.usersplit.login,
                        pass: Settings.usersplit.pass
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

    afterEach(function (done) {
        if(serviceToDelete) {
            wsApi.sendMessage2("service", "delete", {service: serviceToDelete}).then(function (data) {
                return wsApi.sendMessage2("order", "delete", {id: orderToDelete});
            }).then(function (data) {
                done();
            }).catch(function (response) {
                console.error(response);
                fail("Создание с последующим удалением не работают!");
                done();
            });
        } else {
            done();
        }
    });

    it("search in city", function (done) {
        const query = {
            place: {
                in: "CI206538NY", //New York
            },
            num : 5
            //providers: ["test"]
        };
        cOrderAction.searchWhileNotDone("eventticket", query).then(function (data) {

            ServiceValidate.validateEventTicket(data.search[0]);

            done();
        }).catch(function (response) {
            console.error(response);
            fail("Не работает тест на поиск!");
            done();
        });
    });

    it("search prices for event(ratesupload)", function (done) {
        const query = {
            place: {
                // in: "CI206538NY", //New York
                in: "CI005575LO", //London
            },
            num : 5
            //providers: ["test"]
        };
        cOrderAction.searchWhileNotDone("eventticket", query).then(function (data) {
            ServiceValidate.validateEventTicket(data.search[0]);

            const eventData = data.search[0];
            const firstPeriod = eventData.periods[0];
            const curDate = new Date();
            const startFrom = Math.max( curDate.getTime(), firstPeriod.from);
            let nearestWeekDay = firstPeriod.week.find(w => {
                return curDate.getDay() < w - 1;
            });

            let daysAdd = nearestWeekDay !== undefined ?
                nearestWeekDay - (curDate.getDay() + 1) :
                6 - curDate.getDay() + firstPeriod.week[0] + 1;


            const searchTickets = {
                place: {
                    in: eventData.info.id, //"The phantom of the opera" , https://ratesupload.dev.connectflexi.com/eventticket/contract/1
                },
                date : {
                    in : startFrom + daysAdd * 24 * 3600 * 1000,
                    // in: 1530489600000,
                    intime: firstPeriod.start[0]
                },
                // search : query
            };

            return wsApi.sendMessage2("eventticket", "tickets", searchTickets);
        }).then(function (data) {
            ServiceValidate.validateEventTicketTickets(data.search);

            done();
        }).catch(function (response) {
            console.error(response);
            fail("Не работает тест на поиск!");
            done();
        });
    });






    it("search, add and delete", function (done) {
        const searchTickets = {
            place: {
                in: "SPVD81738483", //"Cats" , https://ratesupload.dev.connectflexi.com/eventticket/contract/1
            },
            date : {
                in: new Date().getTime() + 30*3600*24*1000,
                intime: 36000000
            }
        };
        let ctx = {};

        wsApi.sendMessage2("eventticket", "tickets", searchTickets).then(function(data) {
            ServiceValidate.validateEventTicketTickets(data.search);
            CommonValidate.notEmpty(data.search[0].commerce.offer, "data.search[0].commerce.offer");

            //create order and service
            return createEventTicketService(data.search[0]);
        }).then(function (context) {
            ctx = context;
            serviceToDelete = ctx.serviceId;
            orderToDelete = ctx.orderId;
            done();
        }).catch(function (response) {
            console.error(response);
            fail("Создание с последующим удалением не работают!");
            done();
        });

    }, 10000);


    xit("book and cancel(ratesupload)", function (done) {

        const searchTickets = {
            place: {
                in: "SPVD22131625", //"The Phantom of The Opera", https://ratesupload.dev.connectflexi.com/eventticket/contract/1
            },
            date : {
                in: new Date().getTime() + 31*3600*24*1000,
                intime: 68400000
            }
        };
        let ctx = {};

        wsApi.sendMessage2("eventticket", "tickets", searchTickets).then(function(data) {
            ServiceValidate.validateEventTicketTickets(data.search);
            CommonValidate.notEmpty(data.search[0].commerce.offer, "data.search[0].commerce.offer");

            //create order and service
            return createEventTicketService(data.search[0]);
        }).then(function (context) {
            ctx = context;
            serviceToDelete = ctx.serviceId;
            orderToDelete = ctx.orderId;

            return cOrderAction.bookService(ctx.serviceId);
        }).then(function (data) {
            expect(data.status).toBe(5);
            expect(data.id).not.toBeNull();
            expect(data.id).toBe(context.orderId);

            return sleep(3000);
        }).then(function() {
            return wsApi.sendMessage2("order", "retrieve", { id:ctx.orderId })
        }).then(function (data) {
            expect(data).not.toBeNull();
            expect(data.status).toBe(10);
            return wsApi.sendMessage2("service", "cancel", { service:ctx.serviceId});
        }).then(function (data) {
            expect(data.status).toBe(80);

            done();
        }).catch(function (response) {
            console.error(response);
            fail("Бронирование не работает!");
            done();
        });

    }, 20000);

    it("pay", function(done) {
        const searchTickets = {
            place: {
                in: "SPVD81738483", //"Cats" , https://ratesupload.dev.connectflexi.com/eventticket/contract/1
            },
            date : {
                in: new Date().getTime() + 32*3600*24*1000,
                intime: 36000000
            }
        };
        let ctx = {};

        wsApi.sendMessage2("eventticket", "tickets", searchTickets).then(function(data) {
            ServiceValidate.validateEventTicketTickets(data.search);
            CommonValidate.notEmpty(data.search[0].commerce.offer, "data.search[0].commerce.offer");

            //create order and service
            return createEventTicketService(data.search[0]);
        }).then(function (context) {
            ctx = context;
            serviceToDelete = ctx.serviceId;
            orderToDelete = ctx.orderId;


            return cOrderAction.payServiceCard(ctx.orderId, ctx.serviceId);
        }).then(function (data) {
            expect(data).not.toBeNull();
            expect(data.status).toBe(20);
            expect(data.id).not.toBeNull();
            expect(data.id).toBe(ctx.orderId);


            done();
        }).catch(function (response) {
            console.error(response);
            fail("Тест не работает!");
            done();
        });

    }, 20000);

    it("pay for 5 quantity", function(done) {
        const searchTickets = {
            place: {
                in: "SPVD81738483", //"Cats"
            },
            date : {
                in: new Date().getTime() + 33*3600*24*1000,
                intime: 36000000
            }
        };
        let ctx = {};

        wsApi.sendMessage2("eventticket", "tickets", searchTickets).then(function(data) {
            ServiceValidate.validateEventTicketTickets(data.search);
            CommonValidate.notEmpty(data.search[0].commerce.offer, "data.search[0].commerce.offer");
            ctx.ticketCommerce = data.search[0].commerce;


            //create order and service
            data.search[0].seats = [];//чтобы без сидений пошло
            return createEventTicketService(data.search[0], 5);
        }).then(function (context) {
            Object.assign(ctx, context);
            serviceToDelete = ctx.serviceId;
            orderToDelete = ctx.orderId;


            return cOrderAction.payServiceCard(ctx.orderId, ctx.serviceId);
        }).then(function (data) {
            expect(data).not.toBeNull();
            expect(data.status).toBe(20);
            expect(data.id).not.toBeNull();
            expect(data.id).toBe(ctx.orderId);

            expect(ctx.ticketCommerce.tpayment * 5).toBe(data.services[0].commerce.tpayment, "Заказываем 5 билетов, поэтому цена должна отличаться в 5 раз");


            done();
        }).catch(function (response) {
            console.error(response);
            fail("Тест не работает!");
            done();
        });

    }, 20000);


    it("has invoice", function(done) {
        const searchTickets = {
            place: {
                in: "SPVD81738483", //"Cats" , https://ratesupload.dev.connectflexi.com/eventticket/contract/1
            },
            date : {
                in: new Date().getTime() + 35*3600*24*1000,
                intime: 36000000
            }
        };
        let ctx = {};

        wsApi.sendMessage2("eventticket", "tickets", searchTickets).then(function(data) {
            ServiceValidate.validateEventTicketTickets(data.search);
            CommonValidate.notEmpty(data.search[0].commerce.offer, "data.search[0].commerce.offer");

            //create order and service
            return createEventTicketService(data.search[0]);
        }).then(function (context) {
            ctx = context;
            serviceToDelete = ctx.serviceId;
            orderToDelete = ctx.orderId;

            var invoiceQuery = {
                id: ctx.serviceId,
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
        const searchTickets = {
            place: {
                in: "SPVD81738483", //"Cats" , https://ratesupload.dev.connectflexi.com/eventticket/contract/1
            },
            date : {
                in: new Date().getTime() + 36*3600*24*1000,
                intime: 36000000
            }
        };
        let ctx = {};

        wsApi.sendMessage2("eventticket", "tickets", searchTickets).then(function(data) {
            ServiceValidate.validateEventTicketTickets(data.search);
            CommonValidate.notEmpty(data.search[0].commerce.offer, "data.search[0].commerce.offer");

            //create order and service
            return createEventTicketService(data.search[0]);
        }).then(function (context) {
            ctx = context;
            serviceToDelete = ctx.serviceId;
            orderToDelete = ctx.orderId;

            return cOrderAction.payServiceCard(ctx.orderId, ctx.serviceId);
        }).then(function (order) {
            expect(order).not.toBeNull();
            expect(order.status).not.toBeNull();
            expect(order.status).toBe(20);
            var voucherQuery = {
                id: ctx.serviceId,
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