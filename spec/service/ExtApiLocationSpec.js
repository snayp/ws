
describe("extapi-locations", function () {
    const extApi = new ExtApi(Settings.apiLocation, Settings.user.login, Settings.user.pass);

    function validateLocation(c, i) {
        CommonValidate.notEmpty(c.id, "[" + i + "].id");
        CommonValidate.notEmpty(c.name, "[" + i + "].name");
        CommonValidate.notEmpty(c.countryName, "[" + i + "].name");
        CommonValidate.notEmpty(c.countryId, "[" + i + "].name");
    }

    it("countries", function(done) {
        extApi.locationCountries().then(function(data) {
            CommonValidate.notEmptyArray(data);
            data.forEach((c,i) => {
                CommonValidate.notEmpty(c.id, "[" + i + "].id");
                CommonValidate.notEmpty(c.name, "[" + i + "].name");
            });
            done();
        }).catch(function (response) {
            console.error(response);
            fail("Не работает тест!");
            done();
        });
    });

    it("regions", function(done) {
        //load Russian regions
        extApi.locationRegions("CO3KU").then(function(data) {
            CommonValidate.notEmptyArray(data);
            data.forEach((c,i) => {
                validateLocation(c, i);
            });
            done();
        }).catch(function (response) {
            console.error(response);
            fail("Не работает тест!");
            done();
        });
    });

    it("islands", function(done) {
        //load Russian regions
        extApi.locationIslands("CO3KU").then(function(data) {
            CommonValidate.notEmptyArray(data);
            data.forEach((c,i) => {
                validateLocation(c, i);
            });
            done();
        }).catch(function (response) {
            console.error(response);
            fail("Не работает тест!");
            done();
        });
    });

    it("areas", function(done) {
        //load Russian regions
        extApi.locationAreas("CO3KU").then(function(data) {
            CommonValidate.notEmptyArray(data);
            data.forEach((c,i) => {
                validateLocation(c, i);
            });
            done();
        }).catch(function (response) {
            console.error(response);
            fail("Не работает тест!");
            done();
        });
    });

    it("cities", function(done) {
        //load Russian regions
        extApi.locationCities("CO3KU").then(function(data) {
            CommonValidate.notEmptyArray(data);
            data.forEach((c,i) => {
                validateLocation(c, i);
            });
            done();
        }).catch(function (response) {
            console.error(response);
            fail("Не работает тест!");
            done();
        });
    });

    it("villages", function(done) {
        //load Russian regions
        extApi.locationVillages("CO3KU").then(function(data) {
            CommonValidate.notEmptyArray(data);
            data.forEach((c,i) => {
                validateLocation(c, i);
            });
            done();
        }).catch(function (response) {
            console.error(response);
            fail("Не работает тест!");
            done();
        });
    });

    it("locations", function(done) {
        //load Russian regions
        extApi.locationLocations("CO3KU").then(function(data) {
            CommonValidate.notEmptyArray(data);
            data.forEach((c,i) => {
                validateLocation(c, i);
            });
            done();
        }).catch(function (response) {
            console.error(response);
            fail("Не работает тест!");
            done();
        });
    });

    it("airports", function(done) {
        //load Russian regions
        extApi.locationAirports("CO3KU").then(function(data) {
            CommonValidate.notEmptyArray(data);
            data.forEach((c,i) => {
                validateLocation(c, i);
            });
            done();
        }).catch(function (response) {
            console.error(response);
            fail("Не работает тест!");
            done();
        });
    });

    it("trainstations", function(done) {
        //load Russian regions
        extApi.locationTrainstations("CO3KU").then(function(data) {
            CommonValidate.notEmptyArray(data);
            data.forEach((c,i) => {
                validateLocation(c, i);
            });
            done();
        }).catch(function (response) {
            console.error(response);
            fail("Не работает тест!");
            done();
        });
    });

    it("ports", function(done) {
        //load Russian regions
        extApi.locationPorts("CO35Q").then(function(data) {
            CommonValidate.notEmptyArray(data);
            data.forEach((c,i) => {
                validateLocation(c, i);
            });
            done();
        }).catch(function (response) {
            console.error(response);
            fail("Не работает тест!");
            done();
        });
    });

    it("hotels", function(done) {
        //load Russian hotels
        extApi.locationHotels("CO35Q").then(function(data) {
            CommonValidate.notEmptyArray(data);
            data.forEach((c,i) => {
                CommonValidate.notEmpty(c, i);
            });
            done();
        }).catch(function (response) {
            console.error(response);
            fail("Не работает тест!");
            done();
        });
    });

    it("excursions", function(done) {
        //load Turkey excursions
        extApi.locationExcursions("CO2N4").then(function(data) { //https://redmine.connectflexi.com/issues/8957
            CommonValidate.notEmptyArray(data, "data");
            data.forEach((c,i) => {
                CommonValidate.notEmpty(c, i);
            });
            done();
        }).catch(function (response) {
            console.error(response);
            fail("Не работает тест!");
            done();
        });
    });



});