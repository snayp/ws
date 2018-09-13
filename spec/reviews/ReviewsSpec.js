
describe("reviews", function () {
    const wsApi = new WsApi(Settings.wsApiLocation);
    const payment = new Payment(Settings.paymentApiLocation, Settings.apiLocation);
    const cOrderAction = new CommonOrderAction(wsApi, payment);



    function validateReview(r, i) {
        let fName = "data[" + i + "]";
        CommonValidate.notZero(r.id, fName + ".id");

        let person = r.person;
        CommonValidate.notEmptyObject(person, fName + ".person");
        let pfName = fName + ".person";
        let uName = person.name;
        CommonValidate.notEmptyObject(uName, pfName + ".name");
        CommonValidate.notEmpty(uName.first, pfName + ".name.first");
        CommonValidate.notEmpty(uName.last, pfName + ".name.last");

        let country = person.country;
        CommonValidate.notEmptyObject(country, pfName + ".country");
        CommonValidate.notEmpty(country.id, pfName + ".country.id");
        CommonValidate.notEmpty(country.name, pfName + ".country.name");

        CommonValidate.notZero(r.date, fName + ".date");
        CommonValidate.notZero(r.rating, fName + ".rating");

        CommonValidate.notEmpty(r.comment || r.comment2, fName + ".comment(2)");
    }
    function validateUserReview(r, i) {
        let fName = "data[" + i + "]";
        CommonValidate.notZero(r.id, fName + ".id");
        CommonValidate.notEmpty(r.servicetype, fName + ".servicetype");
        CommonValidate.notEmpty(r.flexiid , fName + ".flexiid");

        let info = r.info;
        CommonValidate.notEmptyObject(info, fName + ".info");
        CommonValidate.notEmpty(info.title, fName + ".info.title");
        if(info.subtitle){CommonValidate.notEmpty(info.subtitle, fName + ".info.subtitle");}
        CommonValidate.notEmpty(info.desc, fName + ".info.desc");


        CommonValidate.notZero(r.date, fName + ".date");
        CommonValidate.notZero(r.rating, fName + ".rating");

        CommonValidate.notEmpty(r.comment || r.comment2, fName + ".comment(2)");
    }

    beforeEach(function(done) {
        wsApi.open({
            open : function () {
                done();
            }
        });
    });

    afterEach(function(done) {
        wsApi.sendMessage2("account", "logout");
        expect(true).toBeTruthy();
        wsApi.close();
        done();
    });

    it("search, add, create, search(agent)", function(done) {

        const searchQuery = {
            place: {
                in: "HO095301SA"//Saratov, Lira Hotel
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
            providers: ["test"]
        };
        const loginQuery = {
            key: generateUUID(),
            login: Settings.user.login,
            pass: Settings.user.pass
        };
        const context = {};

        wsApi.sendMessage2("account", "login", loginQuery).then(function(data) {
            return cOrderAction.searchWhileNotDone("accommodation", searchQuery);
        }).then(function (data) {
            expect(data).not.toBeNull();
            CommonValidate.notEmptyArray(data.search, "search");
            const search = data.search[0];

            CommonValidate.notEmptyArray(search.items, "search.items");
            CommonValidate.notEmpty(search.items[0][0].commerce.offer, "search.items[0][0].commerce.offer");
            context.offer = search.items[0][0].commerce.offer;

            return cOrderAction.createOrderWithServiceAfterSearch({offer : context.offer, serviceType : "accommodation", linkItem: 0});
        }).then(function(ctx) {
            Object.assign(context, ctx);

            const reviewRndMsg = randomString(20);

            context.createReviewQuery = {
                serviceid : ctx.serviceId,  // id сервиса
                rating: getRandomInt(1, 5),         // рейтинг (1 | 2 | 3 | 4 | 5)
                comment: "положительный отзыв: " + reviewRndMsg, //положительный отзыв
                comment2: "отрицательны отзыв: " + reviewRndMsg //отрицательный отзыв
            };

            return wsApi.sendMessage2("reviews", "create", context.createReviewQuery);
        }).then(function(data) {
            return cOrderAction.searchWhileNotDone("accommodation", searchQuery);
        }).then(function(data) {
            const revrating = data.search[0].revrating;
            CommonValidate.notEmptyObject(revrating, "data.search[0].info.revrating");//Есть ли рейтинг у отеля
            CommonValidate.notZero(revrating.rating, "revrating.rating");
            CommonValidate.notZero(revrating.count, "revrating.count");

            return wsApi.sendMessage2("reviews", "retrieve", {servicetype: "accommodation", flexiid: searchQuery.place.in});
        }).then(function(data) {
            CommonValidate.notEmptyArray(data, "data");
            data.forEach(validateReview);

            expect(data[0].comment).toBe(context.createReviewQuery.comment, "Ожидается комментарий, который только что добавили");
            expect(data[0].comment2).toBe(context.createReviewQuery.comment2, "Ожидается комментарий 2, который только что добавили");

            done();
        }).catch(function (response) {
            console.error(response);
            fail("Тест не работает!");
            done();
        });
    });

    it("search, add, create, search(b2c)", function(done) {

        const searchQuery = {
            place: {
                in: "HO095301SA"//Saratov, Lira Hotel
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
            providers: ["test"]
        };
        const loginQuery = {
            key: generateUUID(),
            login: Settings.userB2C.login,
            pass: Settings.userB2C.pass
        };
        const context = {};

        wsApi.sendMessage2("account", "login", loginQuery).then(function(data) {
            return cOrderAction.searchWhileNotDone("accommodation", searchQuery);
        }).then(function (data) {
            expect(data).not.toBeNull();
            CommonValidate.notEmptyArray(data.search, "search");
            const search = data.search[0];

            CommonValidate.notEmptyArray(search.items, "search.items");
            CommonValidate.notEmpty(search.items[0][0].commerce.offer, "search.items[0][0].commerce.offer");
            context.offer = search.items[0][0].commerce.offer;

            return cOrderAction.createOrderWithServiceAfterSearch({offer : context.offer, serviceType : "accommodation", linkItem: 0});
        }).then(function(ctx) {
            Object.assign(context, ctx);

            const reviewRndMsg = randomString(20);

            context.createReviewQuery = {
                serviceid : ctx.serviceId,  // id сервиса
                rating: getRandomInt(1, 5),         // рейтинг (1 | 2 | 3 | 4 | 5)
                comment: "положительный отзыв: " + reviewRndMsg, //положительный отзыв
                comment2: "отрицательны отзыв: " + reviewRndMsg //отрицательный отзыв
            };

            return wsApi.sendMessage2("reviews", "create", context.createReviewQuery);
        }).then(function(data) {
            return cOrderAction.searchWhileNotDone("accommodation", searchQuery);
        }).then(function(data) {
            const revrating = data.search[0].revrating;
            CommonValidate.notEmptyObject(revrating, "data.search[0].info.revrating");//Есть ли рейтинг у отеля
            CommonValidate.notZero(revrating.rating, "revrating.rating");
            CommonValidate.notZero(revrating.count, "revrating.count");

            return wsApi.sendMessage2("reviews", "retrieve", {servicetype: "accommodation", flexiid: searchQuery.place.in});
        }).then(function(data) {
            CommonValidate.notEmptyArray(data, "data");
            data.forEach(validateReview);

            expect(data[0].comment).toBe(context.createReviewQuery.comment, "Ожидается комментарий, который только что добавили");
            expect(data[0].comment2).toBe(context.createReviewQuery.comment2, "Ожидается комментарий 2, который только что добавили");


            done();
        }).catch(function (response) {
            console.error(response);
            fail("Тест не работает!");
            done();
        });
    });

    it("search(b2c)", function(done) {
        const loginQuery = {
            key: generateUUID(),
            login: Settings.userB2C.login,
            pass: Settings.userB2C.pass
        };
        const context = {};

        wsApi.sendMessage2("account", "login", loginQuery).then(function(data) {
            return wsApi.sendMessage2("reviews", "search");
        }).then(function(data) {
            CommonValidate.notEmptyArray(data, "data");
            data.forEach(validateUserReview);

            done();
        }).catch(function (response) {
            console.error(response);
            fail("Получение списка отзывов не работает!");
            done();
        });
    });

    it("search(b2b)", function(done) {
        const loginQuery = {
            key: generateUUID(),
            login: Settings.user.login,
            pass: Settings.user.pass
        };
        const context = {};

        wsApi.sendMessage2("account", "login", loginQuery).then(function(data) {
            return wsApi.sendMessage2("reviews", "search");
        }).then(function(data) {
            CommonValidate.notEmptyArray(data, "data");
            data.forEach(validateUserReview);

            done();
        }).catch(function (response) {
            console.error(response);
            fail("Получение списка отзывов не работает!");
            done();
        });
    });


    it("search and delete", function(done) {
        const loginQuery = {
            key: generateUUID(),
            login: Settings.user.login,
            pass: Settings.user.pass
        };
        const context = {};

        wsApi.sendMessage2("account", "login", loginQuery).then(function(data) {
            return wsApi.sendMessage2("reviews", "search");
        }).then(function(data) {
            CommonValidate.notEmptyArray(data, "data");
            data.forEach(validateUserReview);
            context.idToDelete = data[0].id;

            return wsApi.sendMessage2("reviews", "delete", {id: context.idToDelete});
        }).then(function(data) {
            return wsApi.sendMessage2("reviews", "search");
        }).then(function(data) {
            CommonValidate.notEmptyArray(data, "data");
            let idReturned = false;
            data.forEach((r, i) => {
                if(r.id == context.idToDelete) {
                    idReturned = true;
                }
            });
            expect(idReturned).toBe(false, "Ожидается, что в поиске не будет удаленного отзыва");
            done();
        }).catch(function (response) {
            console.error(response);
            fail("Тест не работает!");
            done();
        });
    });



});
