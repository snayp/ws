describe("persongroups", function () {
    const wsApi = new WsApi(Settings.wsApiLocation);
    const payment = new Payment(Settings.paymentApiLocation, Settings.apiLocation);
    const cOrderAction = new CommonOrderAction(wsApi, payment);


    beforeAll(function(done) {
        wsApi.open({
            open : function () {
                const query = {
                    key: generateUUID(),
                    login: Settings.user.login,
                    pass: Settings.user.pass
                };
                wsApi.sendMessage2("account", "login", query).then(function(data) {
                    expect(data).not.toBeNull();
                    expect(data.login).not.toBeNull();
                    expect(data.agent).toBeTruthy();
                    expect(data.deposit).not.toBeNull();
                    done();
                });
            }
        });
    });

    afterAll(function(done) {
        wsApi.sendMessage2("account", "logout");
        expect(true).toBeTruthy();
        wsApi.close();
        done();
    });

    it("autocomplete(empty)", function(done) {
        wsApi.sendMessage2("persongroups", "achips").then(function(data) {
            expect(data).not.toBeNull();
            expect(data.length).toBeGreaterThan(0);
            ServiceValidate.validatePersonGroup(data[0]);
            done();
        }).catch(function (response) {
            console.error(response);
            fail("Autocomplete группы не работает!");
            done();
        });
    });


    it("autocomplete(with search)", function(done) {
        const query = {
            search: "Autot",
            num : 1
        };
        wsApi.sendMessage2("persongroups", "achips", query).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.length).toBe(1);
            ServiceValidate.validatePersonGroup(data[0]);
            expect(data[0].name.indexOf(query.search)).toBeGreaterThan(-1, "В названии группы нет искомого значения");

            done();
        }).catch(function (response) {
            console.error(response);
            fail("Autocomplete с поиском по имени группы не работает!");
            done();
        });
    });

    it("find tourists in group(achips)", function(done) {
        const query = {
            search: "Autote",
            num : 1
        };
        wsApi.sendMessage2("persongroups", "achips", query).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.length).toBe(1);
            ServiceValidate.validatePersonGroup(data[0]);
            expect(data[0].name.indexOf(query.search)).toBeGreaterThan(-1, "В названии группы нет искомого значения");

            return wsApi.sendMessage2("persons", "achips", {group: data[0].id});
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.length).toBeGreaterThan(0);

            done();
        }).catch(function (response) {
            console.error(response);
            fail("Поиск туристов в группе не работает!");
            done();
        });

    });


    it("find all tourists in group(retrieve)", function(done) {
        const query = {
            search: "Autote",
            num : 1
        };
        wsApi.sendMessage2("persongroups", "achips", query).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.length).toBe(1);
            ServiceValidate.validatePersonGroup(data[0]);
            expect(data[0].name.indexOf(query.search)).toBeGreaterThan(-1, "В названии группы нет искомого значения");

            return wsApi.sendMessage2("persons", "retrieve", {search: { group: data[0].id }});
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.length).toBeGreaterThan(0);

            done();
        }).catch(function (response) {
            console.error(response);
            fail("Поиск всех туристов в группе не работает!");
            done();
        });

    });


    it("check group save in order", function (done) {
        var context = {};
        cOrderAction.createOrderWith1Service(cOrderAction.offer1Dto, "encodehoteloffer", "accommodation", 0).then(function(ct) {
            context.orderId = ct.orderId;
            context.serviceId = ct.service1Id;
            context.personId = ct.personId;
            context.roomOffer = ct.room1Offer;
            return wsApi.sendMessage2("persongroups", "achips");
        }).then(function(data) {
            context.groupid = data[0].id;
            context.groupname = data[0].name;
            return wsApi.sendMessage2("order", "update", {id: context.orderId, groupid : context.groupid});
        }).then(function(data) {
            return wsApi.sendMessage2("order", "retrieve", {id: context.orderId});
        }).then(function(data) {
            let group = data.group;
            CommonValidate.notEmptyObject(group, "group");
            expect(group.id).toBe(context.groupid, "В заказе должна сохранится выбранная группа");
            expect(group.name).toBe(context.groupname, "Имя выбранной группы должно совпадать с тем, что выбрали");

            done();
        }).catch(function (response) {
            console.error(response);
            fail("Тест не работает!");
            done();
        });
    }, 40000);

});
