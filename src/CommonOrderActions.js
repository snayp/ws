function CommonOrderAction(wsApi, payment) {
    this.wsApi = wsApi;
    this.payment = payment;

    //create hotel offer 1 (ok)
    this.offer1Dto = {
        pr: "test",
        hid: "TE111222333",
        mhid: "HO096339MO",
        pp: 145,
        pc: "EUR",
        tl: 1589932800000,
        bk: "zzccc23123213213",
        mrt: [
            {
                mt: "ONLY BED",
                rt: "ROOM ONLY",
                adt: 1,
                ch: null
            }
        ],
        in: new Date().getTime() + 60 * 60 * 24 * 85 * 1000,
        out: new Date().getTime() + 60 * 60 * 24 * 88 * 1000
    };

    //create hotel offer 1.1 (ok)
    this.offer11Dto = {
        pr: "test",
        hid: "TE111222333",
        mhid: "HO096339MO",
        pp: 145,
        pc: "EUR",
        tl: 1589932800000,
        bk: "testbookcode",
        mrt: [
            {
                mt: "ONLY BED",
                rt: "ROOM ONLY",
                adt: 2,
                ch: null
            }
        ],
        in: new Date().getTime() + 60 * 60 * 24 * 85 * 1000,
        out: new Date().getTime() + 60 * 60 * 24 * 88 * 1000
    };

    //create hotel offer 2 (ok)
    this.offer2Dto = {
        pr: "test",
        hid: "TE111222333",
        mhid: "HO096339MO",
        pp: 245,
        pc: "EUR",
        tl: new Date().getTime() + 60 * 60 * 24 * 80 * 1000,
        bk: "testbookcode",
        mrt: [
            {
                mt: "ONLY BED",
                rt: "DBL LUX",
                adt: 1,
                ch: null
            }
        ],
        in: new Date().getTime() + 60 * 60 * 24 * 85 * 1000,
        out: new Date().getTime() + 60 * 60 * 24 * 88 * 1000
    };

    //create hotel offer 1 (ok)
    this.HOTEL_OFFER_MULTIROOMS = {
        pr: "test",
        hid: "TE111222333",
        mhid: "HO096339MO",
        pp: 300,
        pc: "EUR",
        tl: new Date().getTime() + 60 * 60 * 24 * 83 * 1000,
        bk: "zzccc23123213213",
        mrt: [
            {
                mt: "ONLY BED",
                rt: "SINGLE",
                adt: 1,
                ch: null
            },
            {
                mt: "ONLY BED",
                rt: "DOUBLE ROOM",
                adt: 1,
                ch: null
            }
        ],
        in: new Date().getTime() + 60 * 60 * 24 * 85 * 1000,
        out: new Date().getTime() + 60 * 60 * 24 * 88 * 1000
    };
    
    //create tourist
    this.createPersonQuery = {
        name: {
            first: "IvanFirst",
            last: "Low" + "SomeCreateString"
        },
        gender: "male",
        birthday: new Date().getTime() - 60 * 60 * 24 * 365 * 30 * 1000,
        contacts: {
            mobiles: [
                {
                    prefix: {
                        id: "CO350220RU", // Russia
                        name: "Russia",
                        num: "7"
                    },
                    num: "9113456789"
                },
                {
                    prefix: {
                        id: "CO350220RU", // Russia
                        name: "Russia",
                        num: "7"
                    },
                    num: "1123456763"
                }
            ],
            phones: [
                {
                    prefix: {
                        id: "CO350220RU", // Russia
                        name: "Russia",
                        num: "7"
                    },
                    num: "123456789"
                }
            ],
            email: "fgtyu@connectflexi.com",
            addrs: [
                {
                    mcountry: {
                        id: "CO424242UN",
                        name: "United Kingdom"
                    },
                    region: "El Morro",
                    city: "Islamabad",
                    district: "Columbia",
                    street: "Lenina",
                    pcode: "478308"
                }
            ]
        },
        docs: [
            {
                type: 1,
                num: "2343453405",
                expdate: 2132697600000,//01.08.2037
                issdate: 1501545600000,//01.08.2017
                issby: "Baumanskiy OVD",
                scans: Settings.person.scans,
                nation: {
                    id: "CO424242UN",
                    name: "United Kingdom"
                }
            }
        ]
    };

//create tourist
    this.createPersonQueryWitoutContacts = {
        name: {
            first: "IvanFirst",
            last: "Low" + "SomeCreateString"
        },
        gender: "male",
        birthday: new Date().getTime() - 60 * 60 * 24 * 365 * 30 * 1000,
        docs: [
            {
                type: 1,
                num: "2343453405",
                expdate: 2132697600000,//01.08.2037
                issdate: 1501545600000,//01.08.2017
                issby: "Baumanskiy OVD",
                scans: Settings.person.scans,
                nation: {
                    id: "CO424242UN",
                    name: "United Kingdom"
                }
            }
        ]
    };

    //create hotel offer (rejected)
    this.offer3Dto = {
        "pr": "test",
        "hid": "HO322898CI",
        "mhid": "HO322898CI",
        "pp": 245,
        "pc": "EUR",
        "tl": 1589932800000,
        "bk": "tttt112222",
        "mrt": [
            {
                "mt": "ONLY BED",
                "rt": "DBL LUX",
                "adt": 1,
                "ch": null
            }
        ],
        "in": new Date().getTime() + 60 * 60 * 24 * 85 * 1000,
        "out": new Date().getTime() + 60 * 60 * 24 * 88 * 1000
    };

    //create transfer offer (ok)
    this.offerTransfer1DTO = {
        "pr": "test",
        "mtid": "277682EX",
        "pp": 100,
        "tid": "AUTOTEST",
        "pc": "EUR",
        "dep": "AI655303DM",
        "arr": "HO072793MO",
        "adt": 1,
        "bk": "ttrrr2343333333",
        "in": new Date().getTime() + 60 * 60 * 24 * 80 * 1000,
        "tin": 3600000,
        "pu": new Date().getTime() + 60 * 60 * 24 * 80 * 1000,
        "tpu": 1800000,
        "lug": 1,
        "ispp": true,
        "num": 1,
        "disc": "Diman - Invoice and Voucher Master!!!"
    };

    //create transfer ref offer (ok)
    this.offerTransfer2DTO = {
        "pr": "test",
        "mtid": "852448PR",
        "pp": 100,
        "tid": "AUTOTEST",
        "pc": "EUR",
        "dep": "AI655303DM",
        "arr": "HO072793MO",
        "adt": 1,
        "tl": new Date().getTime() + 60 * 60 * 24 * 80 * 1000,
        "bk": "ttrrr2343333333",
        "in": new Date().getTime() + 60 * 60 * 24 * 80 * 1000,
        "tin": 3600000,
        "pu": new Date().getTime() + 60 * 60 * 24 * 80 * 1000,
        "tpu": 1800000,
        "lug": 1,
        "ispp": true,
        "num": 1,
        "disc": "Diman - Invoice and Voucher Master!!!"
    };

    //create transfer ref offer (rejected)
    this.offerTransfer3DTO = {
        "pr": "test",
        "mtid": "862733LI",
        "pp": 100,
        "tid": "AUTOTEST",
        "pc": "EUR",
        "dep": "AI655303DM",
        "arr": "HO072793MO",
        "adt": 1,
        "tl": new Date().getTime() + 60 * 60 * 24 * 80 * 1000,
        "bk": "invalid_code",
        "in": new Date().getTime() + 60 * 60 * 24 * 80 * 1000,
        "tin": 3600000,
        "pu": new Date().getTime() + 60 * 60 * 24 * 80 * 1000,
        "tpu": 1800000,
        "lug": 1,
        "ispp": true,
        "num": 1,
        "disc": "Diman - Invoice and Voucher Master!!!"
    };

    //create flight offer (ok)
    this.offerFlight1DTO = {
        "pr": "test",
        "pp": 100,
        "aid": "AUTOTEST",
        "pc": "EUR",
        "dep": "AI655303DM",
        "arr": "AI683025AB",
        "adt": 1,
        "bk": "aaattt222333444",
        "in": new Date().getTime() + 60 * 60 * 24 * 80 * 1000,
        "seg": [
            [
                {
                    "lug": 1,
                    "dt": {
                        "in": 1540857600000,
                        "inTime": 3600000
                    },
                    "pl": {
                        "inpoint": {
                            "city":"Barcelona",
                            "name":"Barcelona Airport",
                            "code":"BCN"
                        },
                        "outpoint": {
                            "city":"Paris",
                            "name":"Orly Airport",
                            "code":"ORY"
                        }
                    },
                    "sup": "Supplier",
                    "fl": "FL1234",
                    "acr": "Boeing",
                    "dur": 120,
                    "cat": "E"
                }
            ],
            []
        ]
    };

    //create ref flight offer (ok)
    this.offerFlight2DTO = {
        "pr": "test",
        "pp": 100,
        "aid": "AUTOTEST",
        "pc": "EUR",
        "dep": "AI655303DM",
        "arr": "AI683025AB",
        "adt": 1,
        "bk": "aaattt222333444",
        "tl": new Date().getTime() + 60 * 60 * 24 * 80 * 1000,
        "in": new Date().getTime() + 60 * 60 * 24 * 80 * 1000,
        "seg": [
            [
                {
                    "lug": 1,
                    "dt": {
                        "in": 1540857600000,
                        "inTime": 3600000
                    },
                    "pl": {
                        "inpoint": {
                            "city":"Barcelona",
                            "name":"Barcelona Airport",
                            "code":"BCN"
                        },
                        "outpoint": {
                            "city":"Paris",
                            "name":"Orly Airport",
                            "code":"ORY"
                        }
                    },
                    "sup": "Supplier",
                    "fl": "FL1234",
                    "acr": "Boeing",
                    "dur": 120,
                    "cat": "E"
                }
            ],
            []
        ]
    };

    //create flight offer (rejected)
    this.offerFlight3DTO = {
        "pr": "test",
        "pp": 110,
        "aid": "AUTOTEST",
        "pc": "EUR",
        "dep": "AI655303DM",
        "arr": "AI683025AB",
        "adt": 1,
        "bk": "invalid_bookcode",
        "in": new Date().getTime() + 60 * 60 * 24 * 80 * 1000,
        "seg": [
            [
                {
                    "lug": 1,
                    "dt": {
                        "in": 1540857600000,
                        "inTime": 3600000
                    },
                    "pl": {
                        "inpoint": {
                            "city":"Barcelona",
                            "name":"Barcelona Airport",
                            "code":"BCN"
                        },
                        "outpoint": {
                            "city":"Paris",
                            "name":"Orly Airport",
                            "code":"ORY"
                        }
                    },
                    "sup": "Supplier",
                    "fl": "FL1234",
                    "acr": "Boeing",
                    "dur": 120,
                    "cat": "E"
                }
            ],
            []
        ]
    };

    this.excursionOfferDto = {
        eid : "EX19535537434IS",
        title : "2 Day Istanbul  Ephesus Plane Tour",
        days : 2,
        // duration : ,
        pr:"test",
        pp: 100,
        pc: "EUR",
        adt: 1,
        in: new Date().getTime() + 60 * 60 * 24 * 85 * 1000,
        bk: "testbookcode",
        tl: new Date().getTime() + 60 * 60 * 24 * 80 * 1000
    };
}

// order with two hotels
CommonOrderAction.prototype.createOrderWithServices = function(offer1Dto, offer2Dto){
    var $coa = this;
    var context = {};
    return new Promise(function (resolve, reject) {
        $coa.wsApi.sendMessage2("test", "encodehoteloffer", { offer:offer1Dto }).then(function(data) {
            expect(data.offer).not.toBeNull();
            context.offer1 = data.offer;
            return $coa.wsApi.sendMessage2("test", "encodehoteloffer", { offer:offer2Dto });
        }).then(function(data) {
            expect(data.offer).not.toBeNull();
            context.offer2 = data.offer;
            return $coa.wsApi.sendMessage2("person", "create", $coa.createPersonQuery);
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.id).not.toBeNull();
            context.personId = data.id;
            return $coa.wsApi.sendMessage2("order", "create", { name:context.personId });
        }).then(function(data) {
            context.orderId = data.id;
            var createService1Query = {
                type: "accommodation",
                orderid: context.orderId,
                items: [{
                    offer: context.offer1
                }]
            };
            return $coa.wsApi.sendMessage2("service", "create", createService1Query);
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.id).not.toBeNull();
            context.service1Id = data.id;
            var createService2Query = {
                type: "accommodation",
                orderid: context.orderId,
                items: [{
                    offer: context.offer2
                }]
            };
            return $coa.wsApi.sendMessage2("service", "create", createService2Query);
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.id).not.toBeNull();
            context.service2Id = data.id;
            return $coa.wsApi.sendMessage2("order", "retrieve", {id: context.orderId});
        }).then(function(data) {
            expect(data).not.toBeNull();
            var linkQuery1 = {
                "service": context.service1Id,
                "tourist": context.personId,
                "item": 0
            };
            return $coa.wsApi.sendMessage2("service", "linktourist", linkQuery1);
        }).then(function(data) {
            expect(data).not.toBeNull();
            var linkQuery2 = {
                "service": context.service2Id,
                "tourist": context.personId,
                "item": 0
            };
            return $coa.wsApi.sendMessage2("service", "linktourist", linkQuery2);
        }).then(function(data) {
            resolve(context);
        }).catch(function (e) {
            reject(e);
        });
    });
};
CommonOrderAction.prototype.createOrderWithServiceAfterSearch = function (params) { //offer, serviceType, linkItem, payerId, tourist, serviceItems, quantity
    const $coa = this;
    const context = {};
    context.offer = params.offer;

    return new Promise(function (resolve, reject) {
        $coa.wsApi.sendMessage2("person", "create", params.tourist === undefined ? $coa.createPersonQuery : params.tourist).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.id).not.toBeNull();
            context.personId = data.id;
            return $coa.wsApi.sendMessage2("order", "create", { name:  params.payerId})
        }).then(function(data) {
            context.orderId = data.id;
            context.createServiceQuery = {
                "type": params.serviceType,
                "orderid": context.orderId
            };
            if(params.linkItem !== undefined) {
                context.createServiceQuery.items = [{
                    offer: context.offer
                }];
            } else if(params.serviceItems) {
                context.createServiceQuery.items = params.serviceItems;
                context.createServiceQuery.offer = context.offer;
            } else {
                context.createServiceQuery.offer = context.offer;
            }
            if(params.quantity) {
                context.createServiceQuery.quantity = params.quantity;
            }

            return $coa.wsApi.sendMessage2("service", "create", context.createServiceQuery);
        }).then(function (data) {
            expect(data).not.toBeNull();
            expect(data.id).not.toBeNull();
            context.serviceId = data.id;
            return $coa.wsApi.sendMessage2("order", "retrieve", { id:context.orderId })
        }).then(function(data) {
            expect(data).not.toBeNull();
            const linkQuery = {
                service: context.serviceId,
                tourist: context.personId,
                item : params.linkItem
            };
            return $coa.wsApi.sendMessage2("service", "linktourist", linkQuery);
        }).then(function(data) {
            resolve(context);
        }).catch(function (e) {
            reject(e);
        });
    });
};

CommonOrderAction.prototype.createOrderWith1Service = function (offerDTO, encodeaction, serviceType, linkItem, payerId, tourist) {
    const $coa = this;

    return $coa.wsApi.sendMessage2("test", encodeaction, { offer:offerDTO }).then(function(data) {
        expect(data.offer).not.toBeNull();
        return $coa.createOrderWithServiceAfterSearch({offer: data.offer, serviceType: serviceType, linkItem: linkItem, payerId: payerId, tourist: tourist});
    });
};

// transfer
CommonOrderAction.prototype.createOrderWith1Transfer = function (offerTransferDTO, payerId, tourist) {
    const $coa = this;
    let context = {};
    return this.createOrderWith1Service(offerTransferDTO, "encodetransferoffer", "transfer", undefined, payerId || Settings.payerId, tourist || undefined).then(function(ct) {
        context = ct;
        const updateQuery = {
            service: ct.serviceId,
            trip: {
                index: 0,
                num: "FL1234"
            }
        };
        return $coa.wsApi.sendMessage2("service", "update", updateQuery);
    }).then(function(data) {
        return context;
    });
};

// airticket
CommonOrderAction.prototype.createOrderWith1Airticket = function(offerFlightDTO) {
    var $coa = this;
    var context = {};
    return new Promise(function(resolve, reject) {
        $coa.wsApi.sendMessage2("test", "encodeaviaoffer", { offer:offerFlightDTO }).then(function(data) {
            expect(data.offer).not.toBeNull();
            context.offer = data.offer;
            return $coa.wsApi.sendMessage2("person", "create", $coa.createPersonQuery)
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.id).not.toBeNull();
            context.personId = data.id;
            return $coa.wsApi.sendMessage2("person", "retrieve", { id:context.personId });
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.id).not.toBeNull();
            expect(data.docs).not.toBeNull();
            expect(data.docs.length).toBeGreaterThan(0);
            expect(data.docs[0].id).not.toBeNull();
            context.docId = data.docs[0].id;
            return $coa.wsApi.sendMessage2("order", "create", { name:context.personId })
        }).then(function(data) {
            context.orderId = data.id;
            context.createServiceFlightQuery = {
                type: "airticket",
                orderid: context.orderId,
                offer: context.offer
            };
            return $coa.wsApi.sendMessage2("service", "create", context.createServiceFlightQuery);
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.id).not.toBeNull();
            context.serviceId = data.id;
            return $coa.wsApi.sendMessage2("order", "retrieve", { id:context.orderId })
        }).then(function(data) {
            expect(data).not.toBeNull();
            var linkQuery = {
                "service": context.serviceId,
                "tourist": context.personId
            };
            return $coa.wsApi.sendMessage2("service", "linktourist", linkQuery);
        }).then(function(data) {
            var updateQuery = {
                service: context.serviceId,
                docs: [{
                    person: context.personId,
                    doc: context.docId
                }]
            };
            return $coa.wsApi.sendMessage2("service", "update", updateQuery);
        }).then(function(data) {
            resolve(context);
        }).catch(function (e) {
            reject(e);
        });
    });
};



CommonOrderAction.prototype.addAccommodationToOrder = function (orderId, payerId, accOffer) {
    var $coa = this;
    var context = {};
    return new Promise(function (resolve, reject) {
        accOffer = accOffer == undefined ? $coa.offer1Dto : accOffer;
        $coa.wsApi.sendMessage2("test", "encodehoteloffer", { offer:accOffer }).then(function(data) {
            expect(data.offer).not.toBeNull();
            context.offer = data.offer;
            if (orderId == null) {
                return $coa.wsApi.sendMessage2("order", "create", { name:payerId });
            } else {
                return $coa.wsApi.sendMessage2("order", "update", { id:orderId, name:payerId });
            }
        }).then(function(data) {
            context.orderId = data == undefined ? orderId : data.id;
            context.createServiceQuery = {
                type: "accommodation",
                orderid: context.orderId,
                items: [{
                    offer: context.offer
                }]
            };
            return $coa.wsApi.sendMessage2("service", "create", context.createServiceQuery);
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.id).not.toBeNull();
            context.serviceId = data.id;
            return $coa.wsApi.sendMessage2("order", "retrieve", {id: context.orderId})
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.person).not.toBeNull();
            context.person = data.person;
            resolve(context);
        }).catch(function (e) {
            reject(e);
        });
    });
};

CommonOrderAction.prototype.addTransferToOrder = function (orderId, payerId, transferOffer) {
    var $coa = this;
    var context = {};
    return new Promise(function (resolve, reject) {
        transferOffer = transferOffer == undefined ? $coa.offerTransfer2DTO : transferOffer;
        $coa.wsApi.sendMessage2("test", "encodetransferoffer", { offer:transferOffer }).then(function(data) {
            expect(data.offer).not.toBeNull();
            context.offer = data.offer;
            if (orderId == null) {
                return $coa.wsApi.sendMessage2("order", "create", { name:payerId });
            } else {
                return $coa.wsApi.sendMessage2("order", "update", { id:orderId, name:payerId });
            }
        }).then(function(data) {
            context.orderId = data == undefined ? orderId : data.id;
            context.createServiceQuery = {
                "type": "transfer",
                "orderid": context.orderId,
                "offer": context.offer
            };
            return $coa.wsApi.sendMessage2("service", "create", context.createServiceQuery);
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.id).not.toBeNull();
            context.serviceId = data.id;
            var updateQuery = {
                service: context.serviceId,
                trip: {
                    index: 0,
                    num: "FL1234"
                }
            };
            return $coa.wsApi.sendMessage2("service", "update", updateQuery)
        }).then(function() {
            return $coa.wsApi.sendMessage2("order", "retrieve", { id:context.orderId })
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.person).not.toBeNull();
            context.person = data.person;
            resolve(context);
        }).catch(function (e) {
            reject(e);
        });
    });
};

CommonOrderAction.prototype.addFlightToOrder = function(orderId, payerId, flightOffer) {
    var $coa = this;
    var context = {};
    return new Promise(function (resolve, reject) {
        flightOffer = flightOffer == undefined ? $coa.offerFlight2DTO : flightOffer;
        $coa.wsApi.sendMessage2("test", "encodeaviaoffer", { offer:flightOffer }).then(function(data) {
            expect(data.offer).not.toBeNull();
            context.offer = data.offer;
            if (orderId == null) {
                return $coa.wsApi.sendMessage2("order", "create", { name:payerId });
            } else {
                return $coa.wsApi.sendMessage2("order", "update", { id:orderId, name:payerId });
            }
        }).then(function(data) {
            context.orderId = data == undefined ? orderId : data.id;
            context.createServiceQuery = {
                "type": "airticket",
                "orderid": orderId,
                "offer": context.offer
            };
            return $coa.wsApi.sendMessage2("service", "create", context.createServiceQuery);
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.id).not.toBeNull();
            context.serviceId = data.id;
            return $coa.wsApi.sendMessage2("order", "retrieve", { id:orderId })
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.person).not.toBeNull();
            context.person = data.person;
            resolve(context);
        }).catch(function (e) {
            reject(e);
        });
    });
};

CommonOrderAction.prototype.payOrderCard = function (orderId) {
    var $coa = this;
    var context = {};
    return new Promise(function(resolve, reject) {
        $coa.wsApi.sendMessage2("order", "pay", { order:orderId, type:"card", isTest:true }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.url).not.toBeNull();
            expect(data.currency).toBeDefined();
            expect(data.payment).toBeDefined();
            expect(data.transaction).not.toBeNull();
            context.transaction = data.transaction;
            return $coa.payment.getPaymentOrderInfo(orderId);
        }).then(function (data) {
            data.transaction = context.transaction;
            return $coa.payment.doPay(JSON.stringify(data), true);
        }).then(function (data) {
            return delay(5000);
        }).then(function (data) {
            return $coa.wsApi.sendMessage2("order", "retrieve", { id:orderId });
        }).then(function (data) {
            expect(data).not.toBeNull();
            expect(data.status).not.toBeNull();
            resolve(data);
        }).catch(function (e) {
            reject(e);
        });
    });
};

CommonOrderAction.prototype.payOrderDeposit = function(orderId) {
    var $coa = this;
    return new Promise(function(resolve, reject) {
        $coa.wsApi.sendMessage2("order", "pay", { order:orderId, type:"deposit", isTest:true }).then(function(data) {
            return delay(5000);
        }).then(function (data) {
            return $coa.wsApi.sendMessage2("order", "retrieve", { id:orderId });
        }).then(function (data) {
            expect(data).not.toBeNull();
            expect(data.status).not.toBeNull();
            resolve(data);
        }).catch(function (e) {
            reject(e);
        });
    });
};

CommonOrderAction.prototype.payServiceCard = function(orderId, serviceId) {
    var $coa = this;
    var context = {};
    return new Promise(function(resolve, reject) {
        $coa.wsApi.sendMessage2("service", "prepay", { service:serviceId, type:"card", isTest:true })
        .then(function (data) {
            expect(data).not.toBeNull();
            expect(data.url).not.toBeNull();
            expect(data.currency).toBeDefined();
            expect(data.payment).toBeDefined();
            expect(data.transaction).not.toBeNull();
            context.transaction = data.transaction;
            return $coa.payment.getPaymentServiceInfo(serviceId);
        }).then(function (data) {
            data.transaction = context.transaction;
            return $coa.payment.doPay(JSON.stringify(data), true);
        }).then(function (data) {
            return delay(5000);
        }).then(function (data) {
            return $coa.wsApi.sendMessage2("order", "retrieve", { id:orderId });
        }).then(function (data) {
            expect(data).not.toBeNull();
            expect(data.status).not.toBeNull();
            resolve(data);
        }).catch(function (response) {
            reject(response);
        });
    });
};

CommonOrderAction.prototype.payServiceDeposit = function (orderId, serviceId) {
    var $coa = this;
    return new Promise(function (resolve, reject) {
        $coa.wsApi.sendMessage2("service", "prepay", { service:serviceId, type:"deposit", isTest:true })
        .then(function (data) {
            return $coa.wsApi.sendMessage2("order", "retrieve", {id: orderId});
        }).then(function (data) {
            expect(data).not.toBeNull();
            expect(data.status).not.toBeNull();
            resolve(data);
        }).catch(function (e) {
            reject(e);
        });
    });
};

CommonOrderAction.prototype.bookService = function(serviceId) {
    var $coa = this;
    return new Promise(function (resolve, reject) {
        $coa.wsApi.sendMessage2("service", "book", { service:serviceId }).then(function(data) {
            expect(data).not.toBeNull();
            resolve(data);
        }).catch(function (data) {
            reject(data);
        });
    });
};

CommonOrderAction.prototype.cancelService = function(serviceId) {
    var $coa = this;
    return new Promise(function (resolve, reject) {
        $coa.wsApi.sendMessage2("service", "cancel", { service:serviceId }).then(function(data) {
            expect(data).not.toBeNull();
            resolve(data);
        }).catch(function (e) {
            reject(e);
        });
    });
};

CommonOrderAction.prototype.createOrderWithPayer = function () {
    var $coa = this;
    var context = {};
    return new Promise(function (resolve, reject) {
        $coa.wsApi.sendMessage2("person", "create", $coa.createPersonQuery).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.id).not.toBeNull();
            context.payerId = data.id;
            return $coa.wsApi.sendMessage2("order", "create", { name:context.payerId });
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.id).not.toBeNull();
            expect(data.person).not.toBeNull();
            context.orderId = data.id;
            resolve(context);
        }).catch(function (e) {
            reject(e);
        });
    });
};

CommonOrderAction.prototype.searchWhileNotDone = function (serviceType, searchQuery) {
    const $coa = this;
    return new Promise(function (resolve, reject) {

        let paginationQuery = function() {
            $coa.wsApi.sendMessage2("service", serviceType, searchQuery).then(function (data) {
                expect(data).not.toBeNull();
                expect(data.search).not.toBeNull();

                var searchDone = data.done;
                if (!searchDone) {
                    setTimeout(function () {
                        paginationQuery();
                    }, 1500);
                    throw "WAIT";
                } else {
                    resolve(data);
                }

            }).catch(function (response) {
                if (response === "WAIT") {
                    return;
                }
                reject(response);
            });
        };
        paginationQuery();
    });
};
