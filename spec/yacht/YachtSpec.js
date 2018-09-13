describe("yacht", function () {
    const wsApi = new WsApi(Settings.wsApiLocation);



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

    it("retrieve", function(done) {
        wsApi.sendMessage("yacht", "retrieve", {id:"YA307108RZ"}, function(yacht) {
            expect(yacht).not.toBeNull();

            CommonValidate.notEmpty(yacht.name);
            CommonValidate.notEmpty(yacht.cat);
            CommonValidate.notEmptyArray(yacht.img);
            expect(yacht.spec).toBeDefined();

            done();
        });
    });




});
