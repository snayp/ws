describe("hotel", function () {
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

    it("retrieve-old", function (done) {//old
        var query = {
            id: "HO001846MO",
            type: "accommodation"
         };

        wsApi.sendMessage("info", "retrieve", query, function (hotel) {
            expect(hotel).not.toBeNull();
            CommonValidate.notEmpty(hotel.addr, "addr");
            CommonValidate.isNumber(hotel.cat, "cat");
            CommonValidate.notEmpty(hotel.desc, "desc");
            CommonValidate.notEmptyObject(hotel.geo, "geo");
            CommonValidate.notEmptyArray(hotel.iconids, "iconids");
            CommonValidate.notEmptyArray(hotel.img, "img");
            CommonValidate.notEmpty(hotel.name, "name");
            ServiceValidate.validateGeoPoint(hotel.point, "point");
            done();
        });
    });

    it("retrieve", function (done) {

        wsApi.sendMessage("hotel", "retrieve", {id:"HO001846MO"}, function (hotel) {
            expect(hotel).not.toBeNull();
            ServiceValidate.validateAccAll(hotel, '');
            //deprecated
            CommonValidate.notEmptyArray(hotel.iconids, "icons");
            hotel.iconids.forEach((iconid, i) => {
                CommonValidate.notEmpty(iconid, "icons[" + i +"].path");
            });


            CommonValidate.notEmptyArray(hotel.img, "img");

            done();
        });
    });


    it("category", function (done) {

        wsApi.sendMessage2("hotel", "category").then(function (data) {
            CommonValidate.notEmptyObject(data, "data");
            data.forEach((cat, i) => {
                CommonValidate.notEmpty(cat.id, "data[" + i + "].id");
                CommonValidate.notEmpty(cat.name, "data[" + i + "].name");
            });

            done();
        });
    });
});
	