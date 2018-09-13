describe("app", function () {
    var wsApi = new WsApi(Settings.wsApiLocation);
    
    beforeEach(function(done) {   
        if (!wsApi.isWsAlive()) {
            wsApi = new WsApi(Settings.wsApiLocation);
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
        } else {
            done();
        }
    });

    afterAll(function () {
        wsApi.sendMessage("account", "logout");
        wsApi.close();
        expect(true).toBeTruthy();
    });

    it("init", function (done) {

        wsApi.sendMessage2("app", "init").then(function (data) {
            expect(data).not.toBeNull();
            CommonValidate.notEmptyArray(data.cards, "cards");
            data.cards.forEach((card) => {
                CommonValidate.notEmpty(card.type, "card.type");
            });

            CommonValidate.notEmptyArray(data.socials, "socials");
            data.socials.forEach((social) => {
                CommonValidate.notEmpty(social.type, "social.type");
                CommonValidate.notEmpty(social.url, "social.url");
            });

            CommonValidate.notEmptyArray(data.langs, "langs");
            CommonValidate.notZero(data.currency, "currency");
            done();
        }).catch(function (response) {
            console.error(response);
            fail("Получение настроек не работает!");
            done();
        });
    });


});
