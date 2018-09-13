describe("icons", function () {
    var wsApi = new WsApi(Settings.wsApiLocation);
    
    beforeAll(function (done) {
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

    it("retrieve (type=provider)", function (done) {

        wsApi.sendMessage2("icons", "retrieve", {type:"provider"}).then(icons => {
            CommonValidate.notEmptyObject(icons, "data");

            for(let i in icons) {
                let icon = icons[i];
                CommonValidate.notEmpty(icon.name, "data[" + i + "].name");
                let file = icon.file || icon.file2;
                CommonValidate.notEmpty(file, "data[" + i + "].file");
            }

            done();
        }).catch(function (response) {
            console.error(response);
            fail("Получение иконок не работает!");
            done();
        });
    });
    it("retrieve (type=service)", function (done) {

        wsApi.sendMessage2("icons", "retrieve", {type:"service"}).then(icons => {
            CommonValidate.notEmptyObject(icons, "data");

            for(let i in icons) {
                let icon = icons[i];
                CommonValidate.notEmpty(icon.name, "name");
                CommonValidate.notEmpty(icon.file, "file");
            }

            done();
        }).catch(function (response) {
            console.error(response);
            fail("Получение иконок не работает!");
            done();
        });
    });

});
	