describe("persons", function() {
    const wsApi = new WsApi(Settings.wsApiLocation);
    let touristId;
    const tourist = {
        name: {
            first: "Test",
            last: "Test" + randomString(15)
        }
    };

    beforeAll(function(done) {
        wsApi.open({
            open : function () {
                var query = {
                    key: generateUUID(),
                    login: Settings.user.login,
                    pass: Settings.user.pass
                };
                wsApi.sendMessage("account", "login", query, function(data) {
                    expect(data).not.toBeNull();
                    expect(data.login).not.toBeNull();
                    expect(data.agent).toBeTruthy();
                    expect(data.deposit).not.toBeNull();

                    wsApi.sendMessage("person", "create", tourist, function(data) {
                        expect(data).not.toBeNull();
                        expect(data.id).not.toBeNull();
                        touristId = data.id;
                        done();
                    });
                });
            }
        });
    });

    afterAll(function(done) {
        wsApi.sendMessage2("person", "delete", {id: touristId}).then(function () {
            wsApi.sendMessage("account", "logout");
            expect(true).toBeTruthy();
            wsApi.close();
            done();
        });
    });

    it("list", function(done) {
        wsApi.sendMessage2("persons", "retrieve").then(function(data) {
            expect(data).not.toBeNull();
            expect(data.length).toBeGreaterThan(0);
            done();
        }).catch(function (response) {
            console.error(response);
            fail("Получение списока туристов не работает!");
            done();
        });
    });

    it("list must be without self -- old", function(done) {
        var context = {};
        wsApi.sendMessage2("person", "retrieve").then(function(data) {
            expect(data).not.toBeNull();
            expect(data.name).not.toBeNull();
            expect(data.name.first).not.toBeNull();
            context.firstName = data.name.first;
            expect(data.name.last).not.toBeNull();
            context.lastName = data.name.last;
            context.id = data.id;
            var filterQuery = {
                num: 1000,
                filter: {
                    type: "name",
                    data: context.firstName + " " + context.lastName
                }
            };
            return  wsApi.sendMessage2("persons", "retrieve", filterQuery);
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.filter(p => p.id === context.id).length).toBe(0, "Профиля среди туристов не должно быть");

            done();
        }).catch(function (response) {
            console.error(response);
            fail("Получение списока туристов не работает!");
            done();
        });
    });

    it("list must be without self", function(done) {
        var context = {};
        wsApi.sendMessage2("person", "retrieve").then(function(data) {
            expect(data).not.toBeNull();
            expect(data.name).not.toBeNull();
            expect(data.name.first).not.toBeNull();
            context.firstName = data.name.first;
            expect(data.name.last).not.toBeNull();
            context.lastName = data.name.last;
            context.id = data.id;
            var filterQuery = {
                num: 1000,
                search: {
                    query: context.firstName + " " + context.lastName
                }
            };
            return  wsApi.sendMessage2("persons", "retrieve", filterQuery);
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.filter(p => p.id === context.id).length).toBe(0, "Профиля среди туристов не должно быть");
            done();
        }).catch(function (response) {
            console.error(response);
            fail("Получение списока туристов не работает!");
            done();
        });
    });

    it("filter(name=...) -- old", function(done) {
        var query = {
            num: 3,
            filter: {
                type: "name",
                data: tourist.name.last
            }
        };
        wsApi.sendMessage("persons", "retrieve", query, function(data) {
            expect(data.length).toBe(1);
            done();
        });
    });

    it("filter(name=...)", function(done) {
        var query = {
            num: 3,
            search: {
                query: tourist.name.last
            }
        };
        wsApi.sendMessage("persons", "retrieve", query, function(data) {
            expect(data.length).toBe(1);
            done();
        });
    });

    it("filter(name=...123) -- old", function(done) {
        var query = {
            num: 3,
            filter: {
                type: "name",
                data: tourist.name.last+123
            }
        };
        wsApi.sendMessage("persons", "retrieve", query, function(data) {
            expect(data.length).toBe(0);
            done();
        });
    });

    it("filter(name=...123)", function(done) {
        var query = {
            num: 3,
            search : {
                query: tourist.name.last+123
            }
        };
        wsApi.sendMessage("persons", "retrieve", query, function(data) {
            expect(data.length).toBe(0);
            done();
        });
    });

    it("filter(num=1)", function(done) {
        var query = {
            num: 1
        };
        wsApi.sendMessage("persons", "retrieve", query, function(data) {
            expect(data).not.toBeNull();
            expect(data.length).toBe(1);
            done();
        });
    });

    it("list", function(done) {
        wsApi.sendMessage("persons", "achips", null, function(data) {
            expect(data).not.toBeNull();
            expect(data.length).toBeGreaterThan(1);

            var person = data[0];
            expect(person.id).not.toBeNull();
            expect(person.name).not.toBeNull();

            done();
        });
    });

    it("filter(num=1)", function(done) {
        var query = {
            num: 1
        };
        wsApi.sendMessage("persons", "achips", query, function(data) {
            expect(data).not.toBeNull();
            expect(data.length).toBe(1);

            var person = data[0];
            expect(person.id).not.toBeNull();
            expect(person.name).not.toBeNull();

            done();
        });
    });


    it("filter(search=\"Family\")", function(done) {
        var query = {
            num: 1,
            search: tourist.name.last
        };
        wsApi.sendMessage("persons", "achips", query, function(data) {
            expect(data).not.toBeNull();
            expect(data.length).toBe(1);

            var person = data[0];
            expect(person.id).not.toBeNull();
            expect(person.id).toBe(touristId);
            expect(person.name).not.toBeNull();

            // var fio = person.name.first + " " + person.name.last + " " + person.name.middle;
            expect(person.name.last).toBe(tourist.name.last, "Турист по Фамилии не нашелся");

            done();
        });
    });

    it("filter(search=\"Family + Name\")", function(done) {
        var query = {
            num: 1,
            search: tourist.name.last + " " + tourist.name.first
        };

        wsApi.sendMessage("persons", "achips", query, function(data) {
            expect(data).not.toBeNull();
            expect(data.length).toBe(1, "Турист по Фамилии и Имени не нашелся");

            var person = data[0];
            expect(person.id).not.toBeNull();
            expect(person.id).toBe(touristId, "Нашелся другой турист ");
            expect(person.name).not.toBeNull();
            expect(person.name.last).toBe(tourist.name.last);

            done();
        });
    });

    it("filter(search=\"Name + Family\")", function(done) {
        var query = {
            num: 1,
            search: tourist.name.first + " " + tourist.name.last
        };

        wsApi.sendMessage("persons", "achips", query, function(data) {
            expect(data).not.toBeNull();
            expect(data.length).toBe(1, "Турист по Имени и Фамилии");

            var person = data[0];
            expect(person.id).not.toBeNull();
            expect(person.id).toBe(touristId, "Нашелся другой турист ");
            expect(person.name).not.toBeNull();
            expect(person.name.last).toBe(tourist.name.last);

            done();
        });
    });

    it("exclude(num=50, exclude=[TR3856856076])", function(done) {
        var query = {
            num: 50,
            search : tourist.name.last,
            exclude : [touristId]
        };

        wsApi.sendMessage("persons", "achips", query, function(data) {
            expect(data).not.toBeNull();

            var persons = data.filter(function(p) {
                return touristId == p.id;
            });
            expect(persons.length).toBe(0);

            done();
        });
    });

    it("retrieve only payers", function(done) {
        var context = {};

        var payerQuery = {
            num: 10,
            payer: true
        };
        var notPayerQuery = {
            num: 10,
            payer: false
        };
        wsApi.sendMessage2("persons", "achips", notPayerQuery).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.length).toBeGreaterThan(0);
            context.tourists = data.length;
            return wsApi.sendMessage2("persons", "achips", payerQuery);
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.length).toBeGreaterThan(0);
            context.payers = data.length;
            expect(context.payers).not.toBe(context.tourists);
            expect(context.payers).toBeLessThan(context.tourists);

            done();
        });
    });
});
