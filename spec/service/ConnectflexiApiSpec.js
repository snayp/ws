describe("connectflexi", function () {
    const connectFlexiApi = new ConnectflexiApi(Settings.apiLocation, Settings.user.login, Settings.user.pass);

    it("send email", function(done) {
        connectFlexiApi.sendEmail({theme:"Subject", text: "Text"}).then(function(data) {
            done();
        }).fail(function (response) {
            console.error(response);
            fail("Ошибка отправки пиcьма!");
            done();
        });
    });

});