describe("eventticket", function () {
    var wsApi = new WsApi(Settings.wsApiLocation);
    
    beforeAll(function (done) {
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
                    done();
                });
            }
        });
    });

    afterAll(function () {
        wsApi.sendMessage("account", "logout");
        wsApi.close();
        expect(true).toBeTruthy();
    });

    it("retrieve categories", function (done) {

        wsApi.sendMessage2("eventticket", "category").then(data => {
            CommonValidate.notEmptyObject(data, "data");
            data.forEach((cat, i) => {
                CommonValidate.notEmpty(cat.id, "data[" + i + "].id");
                CommonValidate.notEmpty(cat.name, "data[" + i + "].name");
            });

            done();
        }).catch(function (response) {
            console.error(response);
            fail("Получение иконок не работает!");
            done();
        });
    });

    it("retrieve info", function (done) {

        wsApi.sendMessage2("eventticket", "retrieve", {id:"SPVD22131625"}).then(data => {
            CommonValidate.notEmptyObject(data, "data");

            CommonValidate.notEmpty(data.addr, "addr");
            CommonValidate.notEmpty(data.cat, "cat");
            CommonValidate.notEmpty(data.desc, "desc");
            CommonValidate.notZero(data.duration, "duration");
            CommonValidate.notEmptyObject(data.geo, "geo");
            CommonValidate.notEmptyArray(data.img, "img");
            CommonValidate.notEmptyObject(data.scheme, "scheme");
            CommonValidate.notEmptyObject(data.scheme.img, "scheme.img");
            CommonValidate.notEmptyObject(data.scheme.map, "scheme.map");


            done();
        }).catch(function (response) {
            console.error(response);
            fail("Получение события не работает!");
            done();
        });
    });


});
	