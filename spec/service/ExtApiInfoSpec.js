
describe("extapi-info", function () {
    const extApi = new ExtApi(Settings.apiLocation, Settings.user.login, Settings.user.pass);

    function validateLocation(c, i) {
        CommonValidate.notEmpty(c.id, "[" + i + "].id");
        CommonValidate.notEmpty(c.name, "[" + i + "].name");
        CommonValidate.notEmpty(c.countryName, "[" + i + "].name");
        CommonValidate.notEmpty(c.countryId, "[" + i + "].name");
    }

    it("hotel", function(done) {
        extApi.infoHotel('HO11IMA').then(function(data) {
            ServiceValidate.validateAccAll(data.success, "success");

            done();
        }).catch(function (response) {
            console.error(response);
            fail("Не работает тест!");
            done();
        });
    });


    it("excursion", function(done) {
        extApi.infoExcursion('EX19535537434IS').then(function(data) {
            ServiceValidate.validateExcursionFullInfo(data.success, "success");

            done();
        }).catch(function (response) {
            console.error(response);
            fail("Не работает тест!");
            done();
        });
    });



});