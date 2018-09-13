'use strict';


const ServiceValidate = {
    validateCommerce: function (commerce, fieldName) {
        expect(commerce).toBeDefined("Поле " + fieldName + " не найдено");
        CommonValidate.isNumber(commerce.don, "commerce.don");
        CommonValidate.isNumber(commerce.original, "commerce.original");
        if(commerce.fee) {
            CommonValidate.isNumber(commerce.fee, "commerce.fee");
        }
        CommonValidate.isNumber(commerce.discount, "commerce.discount");
        if(commerce.taxes) {
            CommonValidate.isNumber(commerce.taxes, "commerce.taxes");
        }
        CommonValidate.notEmpty(commerce.offer, "commerce.offer");
        CommonValidate.isNumber(commerce.toriginal, "commerce.toriginal");
        CommonValidate.isNumber(commerce.tpayment, "commerce.tpayment");
        CommonValidate.isNumber(commerce.currency, "commerce.currency");
        CommonValidate.isNumber(commerce.payment, "commerce.payment");
        CommonValidate.isNumber(commerce.commission, "commerce.commission");
    },

    validateGeoPoint : function(point, fieldName) {
        expect(point).toBeDefined("Поле " + fieldName + " не найдено");
        expect(point.length).toBe(2, "Поле " + fieldName + " должно состоять из двух элементов");
    },

    validateAccInfo : function(acc, fieldName){
        expect(acc).toBeDefined("Поле " + fieldName + " не найдено");

        this.validateGeoPoint(acc.point, fieldName + ".point");

        CommonValidate.notEmpty(acc.addr, fieldName + ".addr");
        CommonValidate.isNumber(acc.imgnum, fieldName + ".imgnum");
        CommonValidate.isBoolean(acc.isdesc, fieldName + ".isdesc");
        CommonValidate.notEmpty(acc.id, fieldName + ".id");
        CommonValidate.notEmpty(acc.name, fieldName + ".name");
        CommonValidate.isNumber(acc.cat, fieldName + ".cat");

    },

    validateAccItems : function(accItems, fieldName){
        CommonValidate.notEmptyArray(accItems, fieldName);
        CommonValidate.notEmptyArray(accItems[0], fieldName + "[0]");


        let room = accItems[0][0];
        CommonValidate.notEmpty(room.meal, fieldName + ".room.meal");
        CommonValidate.notEmpty(room.type, fieldName + ".room.type");
        this.validateCommerce(room.commerce, fieldName + ".commerce");
    },
    validateMultiAcc : function(searchItem, fieldName, roomsSize){
        CommonValidate.notEmptyObject(searchItem, fieldName);

        this.validateAccInfo(searchItem.info, fieldName + ".info");

        CommonValidate.notEmptyArray(searchItem.items, fieldName + "items");
        expect(searchItem.items.length).toBe(roomsSize, "Кол-во комнат в ответе должно соответствовать запрашиваемому");
        searchItem.items.forEach((r,i) => {
            let room = r[0];
            CommonValidate.notEmpty(room.meal, fieldName + "items[" + i + "][0].meal");
            CommonValidate.notEmpty(room.type, fieldName + "items[" + i + "][0].type");
        });


        this.validateCommerce(searchItem.commerce, fieldName + ".commerce");
    },

    validateAccAll : function(acc, fieldName){
        this.validateAccInfo(acc, fieldName);
        CommonValidate.notEmptyObject(acc.site, fieldName + ".site");
        CommonValidate.notEmpty(acc.site.label, fieldName + ".site.label");
        CommonValidate.notEmpty(acc.site.url, fieldName + ".site.url");

        CommonValidate.notEmptyArray(acc.iconids, fieldName + ".iconids");
        acc.iconids.forEach((iconid, i) => {
            CommonValidate.notEmpty(iconid, fieldName + ".iconids[" + i + "]");
        });

    },

    validateAirTicketSegmentPoint : function(point, fieldName) {
        expect(point).toBeDefined("Поле " + fieldName + " отсутствует");
        CommonValidate.notEmpty(point.city, fieldName + ".city");
        CommonValidate.notEmpty(point.name, fieldName + ".name");
        CommonValidate.notEmpty(point.code, fieldName + ".code");
    },
    validateAirTicketDate : function(date, fieldName){
        expect(date).toBeDefined("Поле " + fieldName + " отсутствует");
        CommonValidate.notZero(date.in, fieldName + ".in");
        CommonValidate.notZero(date.in, fieldName + ".out");
        CommonValidate.notZero(date.intime, fieldName + ".intime");
        CommonValidate.notZero(date.outtime, fieldName + ".outtime");
    },
    validateAirTicket : function(airticket) {
        let info = airticket.info;
        expect(info).toBeDefined("Блок info отсутствует");
        expect(info.id).toBeDefined();
        expect(info.inid).toBeDefined();
        //expect(info.retid).toBeDefined();

        expect(airticket.items).toBeDefined();
        expect(airticket.items.length).toBeGreaterThan(0);
        expect(airticket.items[0].length).toBe(1);

        let segment = airticket.items[0][0];
        let place = segment.place;
        expect(place).toBeDefined();

        this.validateAirTicketSegmentPoint(place.inpoint, "place.inpoint");
        this.validateAirTicketSegmentPoint(place.outpoint, "place.outpoint");
        this.validateAirTicketDate(segment.date, "segment.date");

        CommonValidate.notEmpty(segment.luggage, "segment.luggage");
        CommonValidate.notEmpty(segment.supplier, "segment.supplier");
        CommonValidate.notEmpty(segment.flight, "segment.flight");
        CommonValidate.notEmpty(segment.aircraft, "segment.aircraft");
        CommonValidate.isBoolean(segment.bus, "segment.bus");
        CommonValidate.isNumber(segment.cat, "segment.cat");
        // CommonValidate.notEmpty(segment.seatcat, "segment.seatcat");


        this.validateCommerce(airticket.commerce);
    },

    validatePersonGroup : function(persongroup) {
        expect(persongroup).toBeDefined("Информация о группе отсутствует");
        CommonValidate.notEmpty(persongroup.id, "id");
        CommonValidate.notEmpty(persongroup.name, "name");
    },
    validateCityAutoСomplete : function(city) {
        expect(city).toBeDefined("Информация о городе отсутствует");
        CommonValidate.notEmpty(city.id, "id");
        CommonValidate.notEmpty(city.name, "name");
        CommonValidate.notEmpty(city.country, "country");
        CommonValidate.notEmpty(city.countryid, "countryid");
    },
    validateCountryAutoСomplete : function(city) {
        expect(city).toBeDefined("Информация о стране отсутствует");
        CommonValidate.notEmpty(city.id, "id");
        CommonValidate.notEmpty(city.name, "name");
    },

    validateExcursion : function(excursion) {
        expect(excursion).toBeDefined("Информация об экскурсии отсутствует");
        this.validateCommerce(excursion.commerce, "commerce");
        this.validateExcursionInfo(excursion.info, "info");
    },
    validateExcursionInfo : function(info, fieldName) {
        expect(info).toBeDefined("Поле " + fieldName + " отсутствует");
        CommonValidate.notEmpty(info.id, "id");
        CommonValidate.notEmpty(info.img, "img");
        CommonValidate.isNumber(info.imgnum, "imgnum");
        CommonValidate.notEmpty(info.title, "title");
        CommonValidate.isNumber(info.days, "days");
        CommonValidate.notEmptyArray(info.week, "week");

    },
    validateExcursionFullInfo : function(info, fieldName) {
        expect(info).toBeDefined("Поле " + fieldName + " отсутствует");
        CommonValidate.notEmpty(info.id, fieldName + ".id");
        CommonValidate.notEmptyArray(info.img, fieldName + ".img");
        CommonValidate.notEmpty(info.name, fieldName + ".name");
        CommonValidate.notEmpty(info.desc, fieldName + ".desc");
        CommonValidate.notEmpty(info.duration, fieldName + ".duration");

        if(info.tour) {
            CommonValidate.notEmptyArray(info.descs, "descs");
            info.descs.forEach((d, i) => {
                let f = fieldName + ".descs[" + i + "]";
                CommonValidate.notEmpty(d.desc, f + ".desc");
                CommonValidate.notEmpty(d.name, f + ".name");//https://redmine.connectflexi.com/issues/8961
            });
        }

    },
    validateExtApiResponse(data) {
        CommonValidate.notEmptyObject(data, "");
        expect(data.error).toBeNull("В поле error не должно быть ошибок");
        expect(data.status).toBe(0, "Статус ответа должен быть 0");
        CommonValidate.notEmptyObject(data.success, "success");

    },
    validateExtApiSearchResponse(data) {
        this.validateExtApiResponse(data);
        CommonValidate.isBoolean(data.success.done, "success.done");
    },
    validateEventTicketInfo : function(info, fieldName) {
        expect(info).toBeDefined("Поле " + fieldName + " отсутствует");
        CommonValidate.notEmpty(info.id, fieldName+ ".id");
        CommonValidate.notEmpty(info.title, fieldName + ".title");
        CommonValidate.notEmpty(info.addr, fieldName + ".addr");
        CommonValidate.notEmpty(info.img, fieldName + ".img");
        CommonValidate.notZero(info.duration, fieldName + ".duration");
        CommonValidate.notZero(info.imgnum, fieldName+ ".imgnum");
    },
    validateEventTicketPeriods : function(periods, fieldName) {
        CommonValidate.notEmptyArray(periods, fieldName);
        periods.forEach((p, i) => {
            CommonValidate.notZero(p.from, fieldName + "["+ i+ "].from");
            CommonValidate.notZero(p.till, fieldName + "["+ i+ "].till");
            CommonValidate.notEmptyArray(p.start, fieldName + "["+ i+ "].start");
            CommonValidate.notEmptyArray(p.week,  fieldName + "["+ i+ "].week");
        });

    },

    validateEventTicket : function(et) {
        expect(et).toBeDefined("Информация о событии отсутствует");
        this.validateCommerce(et.commerce, "commerce");
        this.validateEventTicketInfo(et.info, "info");
        this.validateEventTicketPeriods(et.periods, "periods");
    },

    validateEventTicketTickets : function(ets) {
        expect(ets).toBeDefined("Информация о билетах отсутствует");
        CommonValidate.notEmptyArray(ets, "data");//"Билетов не найдено"
        ets.forEach((et, i) => {
            let fieldName = "[" + i + "]";
            //info
            CommonValidate.notEmpty(et.id, fieldName+ ".id");
            CommonValidate.notEmpty(et.name, fieldName+ ".name");
            CommonValidate.notEmpty(et.color, fieldName+ ".color");
            CommonValidate.notEmpty(et.desc, fieldName+ ".desc");
            if(et.age) {
                CommonValidate.notZero(et.age.adult || et.age.child, fieldName+ "age.adult || age.child");
            }
            CommonValidate.notEmpty(et.schemeimg, fieldName+ ".schemeimg ");
            CommonValidate.notZero(et.available, fieldName+ ".available ");

            this.validateCommerce(et.commerce, "commerce");

            if(et.seats) {
                et.seats.forEach((seat, j) => {
                    let sFieldName = fieldName + ".seats[" + j + "]";
                    CommonValidate.notEmpty(seat.id, sFieldName+ ".id");
                    CommonValidate.notEmpty(seat.name, sFieldName+ ".name");
                    CommonValidate.notEmpty(seat.section, sFieldName+ ".section");
                    CommonValidate.notEmpty(seat.row, sFieldName+ ".row");
                    CommonValidate.isOneOf(seat.shape, ["circle", "rect"], sFieldName+ ".shape");
                    CommonValidate.notEmptyArray(seat.coords, sFieldName+ ".coords");
                });
            }
        });

    },


};