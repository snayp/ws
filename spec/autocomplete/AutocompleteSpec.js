describe("autocomplete", function() {
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

    afterAll(function() {
        wsApi.sendMessage("account", "logout");
        wsApi.close();
    });

    it("city", function(done) {
        var query = {
            search: "Ber"
        };
        wsApi.sendMessage("autocomplete", "city", query, function(data) {
            expect(data).not.toBeNull();
            expect(data.length).toBeGreaterThan(0);
            ServiceValidate.validateCityAutoСomplete(data[0]);

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

    it("city with country", function(done) {
        var query = {
            search: "Ber",
            country: "CO455677IT"
        };
        wsApi.sendMessage("autocomplete", "city", query, function(data) {
            expect(data).not.toBeNull();
            expect(data.length).toBeGreaterThan(0);
            var city = data[0];
            ServiceValidate.validateCityAutoСomplete(city);
            expect(city.country).toBe("Italy");

            done();
        });
    });

    it("city with country and island", function(done) {
        var query = {
            search: "Ibiza",
            island: "IS402014IB",
            country: "CO270751SP"
        };
        wsApi.sendMessage("autocomplete", "city", query, function(data) {
            expect(data).not.toBeNull();
            expect(data.length).toBeGreaterThan(0);
            var city = data[0];
            ServiceValidate.validateCityAutoСomplete(city);
            expect(city.island).not.toBeNull();
            expect(city.island).toBe("Ibiza");
            expect(city.country).toBe("Spain");

            done();
        });
    });

    it("country", function(done) {
        var query = {
            search: "Ger"
        };
        wsApi.sendMessage("autocomplete", "country", query, function(data) {
            expect(data).not.toBeNull();
            expect(data.length).toBeGreaterThan(0);
            ServiceValidate.validateCountryAutoСomplete(data[0]);

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
            search: "Ibis"
        };
        wsApi.sendMessage("autocomplete", "hotel", query, function(data) {
            expect(data).not.toBeNull();
            expect(data.length).toBeGreaterThan(0);
            var c = data[0];
            expect(c.id).toBeDefined();
            expect(c.id).not.toBeNull();
            expect(c.name).toBeDefined();
            expect(c.name).not.toBeNull();
            expect(c.country).toBeDefined();
            expect(c.country).not.toBeNull();
            expect(c.city).toBeDefined();
            expect(c.city).not.toBeNull();

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

    it("hotel with country", function(done) {
        var query = {
            search: "Ibis",
            country: "CO270751SP"
        };

        wsApi.sendMessage("autocomplete", "hotel", query, function(data) {
            expect(data).not.toBeNull();
            expect(data.length).toBeGreaterThan(0);
            var hotel = data[0];
            expect(hotel.id).not.toBeNull();
            expect(hotel.name).not.toBeNull();
            expect(hotel.city).not.toBeNull();
            expect(hotel.country).not.toBeNull();
            expect(hotel.country).toBe("Spain");
            
            done();
        });
    });

    it("island", function(done) {
        var query = {
            search: "Ile"
        };
        wsApi.sendMessage("autocomplete", "island", query, function(data) {
            expect(data).not.toBeNull();
            expect(data.length).toBeGreaterThan(0);
            expect(data[0].id).not.toBeNull();
            expect(data[0].name).not.toBeNull();
            expect(data[0].country).not.toBeNull();

            done();
        });
    });

    it("island with country", function(done) {
        var query = {
            search: "Ile",
            country: "CO082496FR"
        };
        wsApi.sendMessage("autocomplete", "island", query, function(data) {
            expect(data).not.toBeNull();
            expect(data.length).toBeGreaterThan(0);
            var island = data[0];
            expect(island.id).not.toBeNull();
            expect(island.name).not.toBeNull();
            expect(island.country).not.toBeNull();
            expect(island.country).toBe("France");

            done();
        });
    });

    it("accommodation", function(done) {
        var query = {
            search: "I"
        };
        wsApi.sendMessage("autocomplete", "accommodation", query, function(data) {
            expect(data).not.toBeNull();
            expect(data.country).not.toBeNull();
            expect(data.town).not.toBeNull();

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
            expect(data[0].country).not.toBeNull();
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
            expect(data[0].country).not.toBeNull();
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
});
