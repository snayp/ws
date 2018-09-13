describe("banners", function() {
    var wsApi = new WsApi(Settings.wsApiLocation);

    function validateGridBanner(grid, fieldName) {
        CommonValidate.notEmpty(grid.id, fieldName + ".id");
        CommonValidate.notEmpty(grid.path, fieldName + ".path");
        CommonValidate.notEmpty(grid.location, fieldName + ".location");

        CommonValidate.notEmptyObject(grid.search, fieldName + ".search");
        CommonValidate.notEmpty(grid.search.type, fieldName + ".search.type");
        CommonValidate.notEmptyObject(grid.search.params, fieldName + ".search.params");

        let searchParams = grid.search.params;
        let searchParamsField = fieldName + ".search.params";

        CommonValidate.notEmptyObject(searchParams.date, searchParamsField + ".date");
        CommonValidate.notZero(searchParams.date.in, searchParamsField + ".date.in");
        CommonValidate.notZero(searchParams.date.out, searchParamsField + ".date.out");

        CommonValidate.notEmpty(searchParams.extra.id, searchParamsField + ".extra.id");

        CommonValidate.notEmptyArray(searchParams.families, searchParamsField + ".families");
        searchParams.families.forEach((f, i) => {
            CommonValidate.notZero(f.adults, searchParamsField + ".families[" + i + "].adults");
        });

        if(searchParams.place) {
            CommonValidate.notEmpty(searchParams.place.in, searchParamsField + ".place.in");
        }


    }

    beforeEach(function(done) {
        if (!wsApi.isWsAlive()) {
            wsApi = new WsApi(Settings.wsApiLocation);
            wsApi.open({
                open : function () {
                    let query = {
                        key: generateUUID(),
                        login: "packagetest",
                        pass: "packagetest"
                    };
                    wsApi.sendMessage("account", "login", query, function(data) {
                        expect(data).not.toBeNull();
                        expect(data.login).not.toBeNull();
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
        expect(true).toBeTruthy();
    });

    it("retrieve", function(done) {

        wsApi.sendMessage2("banners", "retrieve").then(function(data) {
            expect(data).not.toBeNull();
            expect(data.banners).not.toBeNull();
            expect(data.banners.length).toBeGreaterThan(3, "Баннеров для packagetest должно быть не меньше 4");

            var accSearchBanner = data.banners[0];
            expect(accSearchBanner.id).toBe("37");
            expect(accSearchBanner.path).not.toBeNull();
            expect(accSearchBanner.search).not.toBeNull();
            expect(accSearchBanner.search.type).not.toBeNull();
            expect(accSearchBanner.search.type).toBe("accommodation");
            expect(accSearchBanner.search.params).not.toBeNull();
            expect(accSearchBanner.search.params.place).not.toBeNull();
            expect(accSearchBanner.search.params.place.in).toBe("CI266088ZZ");
            expect(accSearchBanner.search.params.date).not.toBeNull();
            expect(accSearchBanner.search.params.families).not.toBeNull();
            expect(accSearchBanner.search.params.families[0].adults).toBe(1);
            expect(accSearchBanner.view).not.toBeNull();
            expect(accSearchBanner.view.in).not.toBeNull();


            var companyRegBanner = data.banners[1];
            expect(companyRegBanner.id).toBe("38");
            expect(companyRegBanner.path).not.toBeNull();
            expect(companyRegBanner.action).not.toBeNull();
            expect(companyRegBanner.action).toBe("companyRegistration");


            var noActionBanner = data.banners[2];
            expect(noActionBanner.id).not.toBeNull();
            expect(noActionBanner.id).toBe("39");
            expect(noActionBanner.path).not.toBeNull();
            expect(noActionBanner.url).not.toBeNull();

            var noActionBanner = data.banners[3];
            expect(noActionBanner.id).not.toBeNull();
            expect(noActionBanner.id).toBe("40");
            expect(noActionBanner.path).not.toBeNull();



            expect(data).not.toBeNull();
            expect(data.grid).not.toBeNull();
            expect(data.grid.length).toBeGreaterThan(0);
            expect(data.grid.length).toBe(2);

            data.grid.forEach((g,i) => {
                validateGridBanner(g, "data.grid[" + i + "]");
            });

            done();
        });
    });



});
