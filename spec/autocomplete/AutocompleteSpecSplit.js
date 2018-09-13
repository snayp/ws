describe("autocompleteSplit", function() {
    var wsApi = new WsApi(Settings.wsApiLocation);


    function validateEvent(e, i) {
        CommonValidate.notEmpty(e.id, "data[" + i + "].id");
        CommonValidate.notEmpty(e.name, "data[" + i + "].name");
        CommonValidate.notEmpty(e.country, "data[" + i + "].country");
        CommonValidate.notEmpty(e.countryid, "data[" + i + "].countryid");
        CommonValidate.notEmpty(e.city, "data[" + i + "].city");
        CommonValidate.notEmpty(e.cityid, "data[" + i + "].cityid");
    }
    function validateCity(c, i) {
        CommonValidate.notEmpty(c.id, "data[" + i + "].id");
        CommonValidate.notEmpty(c.name, "data[" + i + "].name");
        CommonValidate.notEmpty(c.country, "data[" + i + "].country");
        CommonValidate.notEmpty(c.countryid, "data[" + i + "].countryid");

    }
    
    beforeEach(function(done) {   
        if (!wsApi.isWsAlive()) {
            wsApi = new WsApi(Settings.wsApiLocation);
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
        } else {
            done();
        }
    });

    afterAll(function() {
        wsApi.sendMessage("account", "logout");
        wsApi.close();
    });

    it("city not allowed", function(done) {
        var query = {
            search: "Ber"
        };
        wsApi.sendMessage("autocomplete", "city", query, function(data) {
            expect(data).not.toBeNull();
            expect(data.length).toBe(0);
            done();
        });
    });

    it("city empty", function(done) {
        var query = {
            search: ""
        };
        wsApi.sendMessage("autocomplete", "city", query, function(data) {
            expect(data).not.toBeNull();
            expect(data.length).toBeGreaterThan(0);
            ServiceValidate.validateCityAutoСomplete(data[0]);

            done();
        });
    });

    it("city", function(done) {
        var query = {
            search: "Mosc"
        };
        wsApi.sendMessage("autocomplete", "city", query, function(data) {
            expect(data).not.toBeNull();
            expect(data.length).toBe(1);
            var city = data[0];
            ServiceValidate.validateCityAutoСomplete(city);
            expect(city.id).toBe("CI266088ZZ");
            expect(city.name).toBe("Moscow");
            expect(city.country).toBe("Russia");

            done();
        });
    });


    it("country not allowed", function(done) {
        var query = {
            search: "Ger"
        };
        wsApi.sendMessage("autocomplete", "country", query, function(data) {
            expect(data).not.toBeNull();
            expect(data.length).toBe(0);
            done();
        });
    });

    it("country empty", function(done) {
        var query = {
            search: ""
        };
        wsApi.sendMessage("autocomplete", "country", query, function(data) {
            expect(data).not.toBeNull();
            expect(data.length).toBeGreaterThan(0);
            ServiceValidate.validateCountryAutoСomplete(data[0]);
            
            done();
        });
    });

    it("hotel", function (done){
        var query = {
            search: "Godunov"
        };
        wsApi.sendMessage("autocomplete", "hotel", query, function(data) {
            expect(data).not.toBeNull();
            expect(data.length).toBe(1);
            var hotel = data[0];
            expect(hotel.id).toBeDefined();
            expect(hotel.id).not.toBeNull();
            expect(hotel.name).toBeDefined();
            expect(hotel.name).toBe("Godunov Hotel");
            expect(hotel.country).toBeDefined();
            expect(hotel.country).toBe("Russia");
            expect(hotel.city).toBeDefined();
            expect(hotel.city).toBe("Moscow");

            done();
        });
    });

    it("hotel empty", function(done) {
        var query = {
            search: ""
        };
        wsApi.sendMessage("autocomplete", "hotel", query, function(data) {
            expect(data).not.toBeNull();
            expect(data.length).toBe(0);

            done();
        });
    });

    it("hotel not allowed", function(done) {
        var query = {
            search: "Ibis",
            country: "CO270751SP"
        };

        wsApi.sendMessage("autocomplete", "hotel", query, function(data) {
            expect(data).not.toBeNull();
            expect(data.length).toBe(0);
            done();
        });
    });

    it("accommodation(search InterContinental Moscow )", function(done) {
        var query = {
            search: "InterContinental Moscow "
        };
        wsApi.sendMessage("autocomplete", "accommodation", query, function(data) {
            expect(data).not.toBeNull();
            expect(data.length).toBeGreaterThan(0);

            for (i = 0; i < data.length; i++ ) {
	            var hotel = data[i];
	            expect(hotel.city).toBe("Moscow");
            }
            done();
        });
    }, 10000);

    it("transfer", function(done) {
        var query = {
            search: "VKO"
        };
        wsApi.sendMessage2("autocomplete", "transfer", query).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.length).toBeGreaterThan(0);
            expect(data[0].id).not.toBeNull();
            expect(data[0].name).not.toBeNull();
            expect(data[0].city).toBe("Moscow");
            expect(data[0].type).toBe("airport");

            done();
        });
    });

    it("transfer autocomplete", function(done) {
        var query = {
            search: "SVO",
            type: "transfer"
        };
        wsApi.sendMessage2("autocomplete", "accommodation", query).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.length).toBeGreaterThan(0);
            expect(data[0].id).not.toBeNull();
            expect(data[0].type).not.toBeNull();
            expect(data[0].name).not.toBeNull();
            expect(data[0].city).toBe("Moscow");
            expect(data[0].type).toBe("airport");

            done();
        });
    });

    it("airticket iata code", function(done) {
        var query = {
            search: "VKO",
            type: "airticket"
        };
        wsApi.sendMessage2("autocomplete", "accommodation", query).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.length).toBeGreaterThan(0);
            expect(data[0].id).not.toBeNull();
            expect(data[0].type).not.toBeNull();
            expect(data[0].name).not.toBeNull();
            expect(data[0].country).not.toBeNull();
            expect(data[0].type).toBe("airport");

            done();
        });
    });

    it("airticket", function(done) {
        var query = {
            search: "Orly",
            type: "airticket"
        };
        wsApi.sendMessage2("autocomplete", "accommodation", query).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.length).toBeGreaterThan(0);
            expect(data[0].id).not.toBeNull();
            expect(data[0].type).not.toBeNull();
            expect(data[0].name).not.toBeNull();
            expect(data[0].country).not.toBeNull();
            expect(data[0].type).toBe("airport");

            done();
        });
    });

    it("eventticket", function(done) {
        const query = {
            search: "Cat"
        };
        wsApi.sendMessage2("autocomplete", "eventticket", query).then(function(data) {

            CommonValidate.notEmptyArray(data, "data");
            data.forEach((e, i) => {
                validateEvent(e, i);
            });


            done();
        });
    });
    it("eventticket by country", function(done) {
        const query = {
            search: "Cat",
            country : "CO437868US"
        };
        wsApi.sendMessage2("autocomplete", "eventticket", query).then(function(data) {

            CommonValidate.notEmptyArray(data, "data");
            data.forEach((e, i) => {
                validateEvent(e, i);
            });
            done();
        });
    });
    it("city for eventticket", function(done) {
        const query = {"search":"Pa","type":"eventticket","ptype":"in"};
        wsApi.sendMessage2("autocomplete", "city", query).then(function(data) {

            CommonValidate.notEmptyArray(data, "data");
            data.forEach((c, i) => {
                validateCity(c, i);
            });
            done();
        });
    });
});
