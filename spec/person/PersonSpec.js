describe("person", function () {
    var wsApi = new WsApi(Settings.wsApiLocation);
    var payment = new Payment(Settings.paymentApiLocation, Settings.apiLocation);
    var cOrderAction = new CommonOrderAction(wsApi, payment);

    var createfullperson = {
        name: {
            first: "Fullfirst",
            middle: "Fullmiddle",
            last: "Fulllast"
        },
        birthday: 636854400000,
        gender: "female",
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
                },
                {
                    prefix: {
                        id: "CO350220RU", // Russia
                        name: "Russia",
                        num: "7"
                    },
                    num: "234665456"
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
                issby: "Baumanskiy ROVD",
                visa: true,
                scans: Settings.person.scans,
                nation: {
                    id: "CO424242UN",
                    name: "United Kingdom"
                }
            },
            {
                type: 0,
                num: "234345340",
                expdate: 1818547200000,//18.08.2027
                issdate: 1187395200000,//18.08.2007
                issby: "Presnenskiy ROVD",
                visa: true,
                scans: Settings.person.scans,
                nation: {
                    id: "CO350220RU", // Russia
                    name: "Russia"
                }
            },
            {
                type: 2,
                num: "AB234345340",
                expdate: 1818547200000,//18.08.2027
                issdate: 1187395200000,//18.08.2007
                issby: "Presnenskiy ROVD",
                visa: false,
                scans: Settings.person.scans,
                nation: {
                    id: "CO424242UN",
                    name: "United Kingdom"
                }
            },
            {
                type: 3,
                num: "AB2340FG",
                expdate: 1818547200000,//18.08.2027
                issdate: 1187395200000,//18.08.2007
                issby: "Presnenskiy ROVD",
                visa: false,
                scans: Settings.person.scans,
                nation: {
                    id: "CO424242UN",
                    name: "United Kingdom"
                }
            }
        ]
    };

    var settings = {
        settings: {
            lang: "en",
            payment: 978
        }
    };
    
    beforeEach(function(done) {   
        if (!wsApi.isWsAlive()) {
            wsApi = new WsApi(Settings.wsApiLocation);
            cOrderAction = new CommonOrderAction(wsApi, payment);
            wsApi.open({
                open : function () {
                    var query = {
                        key: generateUUID(),
                        login: Settings.user.login,
                        pass: Settings.user.pass
                    };
                    wsApi.sendMessage("account", "login", query, function(data) {
                        expect(data).not.toBeNull();
                        expect(data.login).not.toBeNull();
                        expect(data.agent).toBeTruthy();
                        expect(data.deposit).not.toBeNull();
                        wsApi.sendMessage("settings", "update", settings, function(data) {
                            done();
                        });
                    });
                }
            });
        } else {
            done();
        }
    });

    afterAll(function(done) {
        wsApi.sendMessage("account", "logout");
        expect(true).toBeTruthy();
        wsApi.close();
        done();
    });

    it("retrieve (self)", function(done) {
        wsApi.sendMessage("person", "retrieve", null, function(data) {
            expect(data).not.toBeNull();
            expect(data.id).not.toBeNull();
            done();
        });
    });

    it("retrieve (new tourist)", function(done) {
        var createQuery = {
            name: {
                first: "Testovanii",
                last: "Tourist"
            },
            gender: "male",
            birthday: 636854400000
        };
        wsApi.sendMessage("person", "create", createQuery, function(data) {
            expect(data).not.toBeNull();
            expect(data.id).not.toBeNull();
            var personId = data.id;

            wsApi.sendMessage("person", "retrieve", {id: personId}, function(data) {
                expect(data).not.toBeNull();
                expect(data.id).not.toBeNull();

                expect(data.id).toBe(personId);
                expect(data.name.first).toBe(createQuery.name.first);
                expect(data.name.last).toBe(createQuery.name.last);
                expect(data.birthday).toBe(createQuery.birthday);
                done();
            });

            wsApi.sendMessage("person", "delete", { id:personId }, function(data) {
                done();
            });
        });
    });

    it("create and delete", function (done) {
        var query = {
            name: {
                first: "Test",
                last: "Test"
            },
            gender: "male",
            birthday: 636854400000
        };

        wsApi.sendMessage("person", "create", query, function(data) {
            expect(data).not.toBeNull();
            expect(data.id).not.toBeNull();
            var personId = data.id;

            wsApi.sendMessage("person", "delete", { id:personId }, function(data) {
                done();
            });
        });
    });

    it("create with valid documents", function (done) {
        var query = {
            name: {
                first: "Test",
                last: "Test"
            },
            gender: "male",
            birthday: 636854400000,
            docs: [
                {
                    type: "0",
                    num: "234345340",
                    issby: "ROVD",
                    expdate: 1856924800000,//08.03.2028
                    issdate: 1425772800000,//08.03.2015
                    nation: {
                        id: "CO350220RU", // Russia
                        name: "Russia"
                    }
                },
                {
                    type: "1",
                    num: "2343453405",
                    issby: "ROVD",
                    expdate: 2056924800000,//08.03.2035
                    issdate: 1425772800000,//08.03.2015
                    nation: {
                        id: "CO350220RU", // Russia
                        name: "Russia"
                    }
                }
            ]
        };

        wsApi.sendMessage("person", "create", query, function(data) {
            expect(data).not.toBeNull();
            expect(data.id).not.toBeNull();
            var personId = data.id;

            wsApi.sendMessage("person", "delete", { id:personId }, function(data) {
                done();
            });
        });
    });

    it("create with not valid document", function(done) {
        var query = {
            name: {
                first: "Test",
                last: "Test"
            },
            gender: "male",
            birthday: 636854400000,
            docs: [
                {
                    type: "1",
                    num: "2343453405",
                    expdate: new Date().getTime() - 24 * 3600 * 1000,
                    issdate: new Date().getTime() + 24 * 3600 * 1000
                }
            ]
        };

        wsApi.sendMessage2("person", "create", query).catch(function (response) {
            //check status
            var data = response.data;
            expect(response).not.toBeNull();
            expect(response.status).toBe(418);

            //check data
            expect(data).not.toBe(undefined);
            expect(data.docs).not.toBeNull();
            expect(data.docs.length).toBe(1);
            expect(data.error).not.toBeNull();
            expect(data.error.doc).not.toBeNull();
            var doc = data.error.docs[0];
            expect(doc.expdate).toBe(3);
            expect(doc.issdate).toBe(3);

            done();
        });
    });

    it("update name", function(done) {
        var query = {
            name: {
                first: "Test",
                last: "Test"
            }
        };
        wsApi.sendMessage("person", "create", query, function(data) {
            expect(data).not.toBeNull();
            expect(data.id).not.toBeNull();
            var personId = data.id;

            var updateQuery = {
                person: {
                    id: personId,
                    name: {
                        first: "Tester",
                        last: "Testov"
                    }
                }
            };
            wsApi.sendMessage("person", "update", updateQuery, function(data) {
                var retrieveQuery = {id: personId};

                wsApi.sendMessage("person", "retrieve", retrieveQuery, function(data) {
                    expect(data).not.toBeNull();
                    var person = data;
                    expect(person.id).not.toBeNull();
                    expect(person.id).toBe(personId);
                    expect(person.name.first).toBe(updateQuery.person.name.first);
                    expect(person.name.last).toBe(updateQuery.person.name.last);

                    wsApi.sendMessage("person", "delete", {id: personId}, function(data) {
                        done();
                    });
                });
            });
        });
    });

    it("update with not valid document", function(done) {
        var query = {
            name: {
                first: "Test",
                last: "Test"
            }
        };
        wsApi.sendMessage("person", "create", query, function(data) {
            expect(data).not.toBeNull();
            expect(data.id).not.toBeNull();
            var personId = data.id;

            var updateQuery = {
                person: {
                    id: personId,
                    docs: [
                        {
                            type: "1",
                            num: "2343453405",
                            expdate: new Date().getTime() - 24 * 3600 * 1000,
                            issdate: new Date().getTime() + 24 * 3600 * 1000
                        }
                    ]
                }
            };
            wsApi.sendMessage("person", "update", updateQuery, null, function(response) {
                //check status
                expect(response).not.toBeNull();
                expect(response.status).toBe(418);

                //check data
                var data = response.data;
                expect(data).not.toBe(undefined);
                expect(data.docs).not.toBeNull();
                expect(data.docs.length).toBe(1);
                expect(data.error).not.toBeNull();
                expect(data.error.doc).not.toBeNull();
                var doc = data.error.docs[0];
                expect(doc.expdate).toBe(3);
                expect(doc.issdate).toBe(3);

                wsApi.sendMessage("person", "delete", {id: personId}, function(data) {
                    done();
                });
            });
        });
    });

    it("create full", function(done) {
        wsApi.sendMessage("person", "create", createfullperson, function(data) {
            expect(data).not.toBeNull();
            expect(data.id).not.toBeNull();
            var personId = data.id;

            wsApi.sendMessage("person", "retrieve", { id:personId }, function(data) {
                expect(data).not.toBeNull();
                var person = data;

                expect(person.id).toBe(personId);
                expect(person.gender).toBe(createfullperson.gender);
                expect(person.name.first).toBe(createfullperson.name.first);
                expect(person.name.middle).toBe(createfullperson.name.middle);
                expect(person.name.last).toBe(createfullperson.name.last);
                expect(person.birthday).toBe(createfullperson.birthday);
                expect(person.contacts.mobiles[0].prefix.id).toBe(createfullperson.contacts.mobiles[0].prefix.id);
                expect(person.contacts.mobiles[0].prefix.name).toBe(createfullperson.contacts.mobiles[0].prefix.name);
                expect(person.contacts.mobiles[0].prefix.num).toBe(createfullperson.contacts.mobiles[0].prefix.num);
                expect(person.contacts.mobiles[0].num).toBe(createfullperson.contacts.mobiles[0].num);
                expect(person.contacts.mobiles[1].prefix.id).toBe(createfullperson.contacts.mobiles[1].prefix.id);
                expect(person.contacts.mobiles[1].prefix.name).toBe(createfullperson.contacts.mobiles[1].prefix.name);
                expect(person.contacts.mobiles[1].prefix.num).toBe(createfullperson.contacts.mobiles[1].prefix.num);
                expect(person.contacts.mobiles[1].num).toBe(createfullperson.contacts.mobiles[1].num);
                expect(person.contacts.phones[0].prefix.id).toBe(createfullperson.contacts.phones[0].prefix.id);
                expect(person.contacts.phones[0].prefix.name).toBe(createfullperson.contacts.phones[0].prefix.name);
                expect(person.contacts.phones[0].prefix.num).toBe(createfullperson.contacts.phones[0].prefix.num);
                expect(person.contacts.phones[0].num).toBe(createfullperson.contacts.phones[0].num);
                expect(person.contacts.email).toBe(createfullperson.contacts.email);
                expect(person.contacts.addrs[0].mcountry.id).toBe(createfullperson.contacts.addrs[0].mcountry.id);
                expect(person.contacts.addrs[0].mcountry.name).toBe(createfullperson.contacts.addrs[0].mcountry.name);
                expect(person.contacts.addrs[0].region).toBe(createfullperson.contacts.addrs[0].region);
                expect(person.contacts.addrs[0].city).toBe(createfullperson.contacts.addrs[0].city);
                expect(person.contacts.addrs[0].district).toBe(createfullperson.contacts.addrs[0].district);
                expect(person.contacts.addrs[0].street).toBe(createfullperson.contacts.addrs[0].street);
                expect(person.contacts.addrs[0].pcode).toBe(createfullperson.contacts.addrs[0].pcode);
                expect(person.docs[0].type).toBe(createfullperson.docs[0].type);
                expect(person.docs[0].num).toBe(createfullperson.docs[0].num);
                expect(person.docs[0].expdate).toBe(createfullperson.docs[0].expdate);
                expect(person.docs[0].issdate).toBe(createfullperson.docs[0].issdate);
                expect(person.docs[0].issby).toBe(createfullperson.docs[0].issby);
                expect(person.docs[0].scans[0]).toBe(createfullperson.docs[0].scans[0]);

                expect(person.docs[1].type).toBe(createfullperson.docs[1].type);
                expect(person.docs[1].num).toBe(createfullperson.docs[1].num);
                expect(person.docs[1].expdate).toBe(createfullperson.docs[1].expdate);
                expect(person.docs[1].issdate).toBe(createfullperson.docs[1].issdate);
                expect(person.docs[1].issby).toBe(createfullperson.docs[1].issby);
                expect(person.docs[1].scans[0]).toBe(createfullperson.docs[1].scans[0]);

                expect(person.docs[2].type).toBe(createfullperson.docs[2].type);
                expect(person.docs[2].num).toBe(createfullperson.docs[2].num);
                expect(person.docs[2].expdate).toBe(createfullperson.docs[2].expdate);
                expect(person.docs[2].issdate).toBe(createfullperson.docs[2].issdate);
                expect(person.docs[2].issby).toBe(createfullperson.docs[2].issby);
                expect(person.docs[2].scans[0]).toBe(createfullperson.docs[2].scans[0]);

                expect(person.docs[3].type).toBe(createfullperson.docs[3].type);
                expect(person.docs[3].num).toBe(createfullperson.docs[3].num);
                expect(person.docs[3].expdate).toBe(createfullperson.docs[3].expdate);
                expect(person.docs[3].issdate).toBe(createfullperson.docs[3].issdate);
                expect(person.docs[3].issby).toBe(createfullperson.docs[3].issby);
                expect(person.docs[3].scans[0]).toBe(createfullperson.docs[3].scans[0]);

                wsApi.sendMessage("person", "delete", {id: personId}, function (data) {
                    done();
                });

            });
        });
    });

    it("update full", function (done) {
        wsApi.sendMessage("person", "create", createfullperson, function (data) {
            var personId = data.id;
            var updatefullperson = {
                person: {
                    id: personId,
                    name: {
                        first: "Upfirst",
                        middle: "Upmiddle",
                        last: "Uplast"
                    },
                    birthday: 810691200000,
                    gender: "male",
                    contacts: {
                        mobiles: [
                            {
                                prefix: {
                                    id: "CO350220RU", // Russia
                                    name: "Russia",
                                    num: "7"
                                },
                                num: "911312345"
                            },
                            {
                                prefix: {
                                    id: "CO350220RU", // Russia
                                    name: "Russia",
                                    num: "7"
                                },
                                num: "112233445"
                            }
                        ],
                        phones: [// one home phone possible
                            {
                                prefix: {
                                    id: "CO350220RU", // Russia
                                    name: "Russia",
                                    num: "7"
                                },
                                num: "987654321"
                            }
                        ],
                        email: "fgtyu@connectflexi.com",
                        addrs: [
                            {
                                mcountry: {
                                    id: "CO424242UN",
                                    name: "United Kingdom"
                                },
                                region: "Mexico",
                                city: "Stambul",
                                district: "Columbia Picters",
                                street: "Stalina",
                                pcode: "112308"
                            }
                        ]
                    },
                    docs: [
                        {
                            type: 1,
                            num: "2343453405",
                            expdate: 2230848000000,//10.09.2040
                            issdate: 1425772800000,//08.03.2015
                            issby: "Baumanskiy OVD",
                            scans: Settings.person.scans,
                            nation: {
                                id: "CO350220RU", // Russia
                                name: "Russia"
                            }
                        }
                    ]
                }
            };
            wsApi.sendMessage("person", "update", updatefullperson, function(data) {
                expect(data).not.toBeNull();
                expect(data.id).toBe(personId);
                wsApi.sendMessage("person", "retrieve", { id:personId }, function(data) {
                    var updatedperson = data;
                    expect(updatedperson.id).toBe(personId);
                    expect(updatedperson.gender).toBe(updatefullperson.person.gender);
                    expect(updatedperson.name.first).toBe(updatefullperson.person.name.first);
                    expect(updatedperson.name.middle).toBe(updatefullperson.person.name.middle);
                    expect(updatedperson.name.last).toBe(updatefullperson.person.name.last);
                    expect(updatedperson.birthday).toBe(updatefullperson.person.birthday);
                    expect(updatedperson.contacts.mobiles[0].prefix.id).toBe(updatefullperson.person.contacts.mobiles[0].prefix.id);
                    expect(updatedperson.contacts.mobiles[0].prefix.name).toBe(updatefullperson.person.contacts.mobiles[0].prefix.name);
                    expect(updatedperson.contacts.mobiles[0].prefix.num).toBe(updatefullperson.person.contacts.mobiles[0].prefix.num);
                    expect(updatedperson.contacts.mobiles[0].num).toBe(updatefullperson.person.contacts.mobiles[0].num);
                    expect(updatedperson.contacts.mobiles[1].prefix.id).toBe(updatefullperson.person.contacts.mobiles[1].prefix.id);
                    expect(updatedperson.contacts.mobiles[1].prefix.name).toBe(updatefullperson.person.contacts.mobiles[1].prefix.name);
                    expect(updatedperson.contacts.mobiles[1].prefix.num).toBe(updatefullperson.person.contacts.mobiles[1].prefix.num);
                    expect(updatedperson.contacts.mobiles[1].num).toBe(updatefullperson.person.contacts.mobiles[1].num);
                    expect(updatedperson.contacts.phones[0].prefix.id).toBe(updatefullperson.person.contacts.phones[0].prefix.id);
                    expect(updatedperson.contacts.phones[0].prefix.name).toBe(updatefullperson.person.contacts.phones[0].prefix.name);
                    expect(updatedperson.contacts.phones[0].prefix.num).toBe(updatefullperson.person.contacts.phones[0].prefix.num);
                    expect(updatedperson.contacts.phones[0].num).toBe(updatefullperson.person.contacts.phones[0].num);
                    expect(updatedperson.contacts.email).toBe(updatefullperson.person.contacts.email);
                    expect(updatedperson.contacts.addrs[0].mcountry.id).toBe(updatefullperson.person.contacts.addrs[0].mcountry.id);
                    expect(updatedperson.contacts.addrs[0].mcountry.name).toBe(updatefullperson.person.contacts.addrs[0].mcountry.name);
                    expect(updatedperson.contacts.addrs[0].region).toBe(updatefullperson.person.contacts.addrs[0].region);
                    expect(updatedperson.contacts.addrs[0].city).toBe(updatefullperson.person.contacts.addrs[0].city);
                    expect(updatedperson.contacts.addrs[0].district).toBe(updatefullperson.person.contacts.addrs[0].district);
                    expect(updatedperson.contacts.addrs[0].street).toBe(updatefullperson.person.contacts.addrs[0].street);
                    expect(updatedperson.contacts.addrs[0].pcode).toBe(updatefullperson.person.contacts.addrs[0].pcode);
                    expect(updatedperson.docs[0].type).toBe(updatefullperson.person.docs[0].type);
                    expect(updatedperson.docs[0].num).toBe(updatefullperson.person.docs[0].num);
                    expect(updatedperson.docs[0].expdate).toBe(updatefullperson.person.docs[0].expdate);
                    expect(updatedperson.docs[0].issdate).toBe(updatefullperson.person.docs[0].issdate);
                    expect(updatedperson.docs[0].issby).toBe(updatefullperson.person.docs[0].issby);
                    expect(updatedperson.docs[0].scans[0]).toBe(updatefullperson.person.docs[0].scans[0]);
                    expect(updatedperson.docs[0].scans[1]).toBe(updatefullperson.person.docs[0].scans[1]);
                    expect(updatedperson.docs[0].nation.id).toBe(updatefullperson.person.docs[0].nation.id);
                    expect(updatedperson.docs[0].nation.name).toBe(updatefullperson.person.docs[0].nation.name);

                    wsApi.sendMessage("person", "delete", {id: personId}, function(data) {
                        done();
                    });
                });
            });
        });
    });

    it("update partial 2", function (done) {
        wsApi.sendMessage("person", "create", createfullperson, function(data) {
            var personId = data.id;
            var updatefullperson = {
                person: {
                    id: personId,
                    name: {
                        first: "Newfirst",
                        middle: "UpNewmiddle",
                        last: "UpNewLast"
                    },
                    birthday: 810691200000,
                    gender: "male",
                    contacts: {
                        phones: [
                            {
                                prefix: {
                                    id: "CO350220RU", // Russia
                                    name: "Russia",
                                    num: "7"
                                },
                                num: "987654325"
                            }
                        ],
                        email: "fgtyu@connectflexi.com"
                    },
                    docs: [
                        {
                            type: 1,
                            num: "2343453405",
                            issby: "Issuer",
                            expdate: 2230848000000,//10.09.2040
                            issdate: 1425772800000,//08.03.2015
                            nation: {
                                id: "CO350220RU", // Russia
                                name: "Russia"
                            }
                        }
                    ]
                }
            };

            wsApi.sendMessage("person", "update", updatefullperson, function(data) {
                expect(data).not.toBeNull();
                expect(data.id).toBe(personId);

                wsApi.sendMessage("person", "retrieve", {id:personId}, function(data) {
                    var updatedperson = data;
                    expect(updatedperson.id).toBe(personId);
                    expect(updatedperson.gender).toBe(updatefullperson.person.gender);
                    expect(updatedperson.name.first).toBe(updatefullperson.person.name.first);
                    expect(updatedperson.name.middle).toBe(updatefullperson.person.name.middle);
                    expect(updatedperson.name.last).toBe(updatefullperson.person.name.last);
                    expect(updatedperson.birthday).toBe(updatefullperson.person.birthday);
                    expect(updatedperson.contacts.phones[0].prefix.id).toBe(updatefullperson.person.contacts.phones[0].prefix.id);
                    expect(updatedperson.contacts.phones[0].prefix.name).toBe(updatefullperson.person.contacts.phones[0].prefix.name);
                    expect(updatedperson.contacts.phones[0].prefix.num).toBe(updatefullperson.person.contacts.phones[0].prefix.num);
                    expect(updatedperson.contacts.phones[0].num).toBe(updatefullperson.person.contacts.phones[0].num);
                    expect(updatedperson.contacts.email).toBe(updatefullperson.person.contacts.email);
                    expect(updatedperson.docs[0].type).toBe(updatefullperson.person.docs[0].type);
                    expect(updatedperson.docs[0].num).toBe(updatefullperson.person.docs[0].num);
                    expect(updatedperson.docs[0].expdate).toBe(updatefullperson.person.docs[0].expdate);
                    expect(updatedperson.docs[0].issdate).toBe(updatefullperson.person.docs[0].issdate);
                    expect(updatedperson.docs[0].nation.id).toBe(updatefullperson.person.docs[0].nation.id);
                    expect(updatedperson.docs[0].nation.name).toBe(updatefullperson.person.docs[0].nation.name);

                    wsApi.sendMessage("person", "delete", {id: personId}, function(data) {
                        done();
                    });
                });
            });
        });
    });

    it("update partial 1", function (done) {
        wsApi.sendMessage("person", "create", createfullperson, function (data) {
            var personId = data.id;

            var updatefullperson = {
                person: {
                    id: personId,
                    name: {
                        first: "Upfirst",
                        middle: "Upmiddle",
                        last: "Uplast"
                    },
                    birthday: 810691200000,
                    contacts: {
                        mobiles: [
                            {
                                prefix: {
                                    id: "CO350220RU", // Russia
                                    name: "Russia",
                                    num: "7"
                                },
                                num: "911312345"
                            },
                            {
                                prefix: {
                                    id: "CO350220RU", // Russia
                                    name: "Russia",
                                    num: "7"
                                },
                                num: "112233445"
                            }
                        ],
                        email: "fgtyu@connectflexi.com",
                        addrs: [
                            {
                                mcountry: {
                                    id: "CO424242UN",
                                    name: "United Kingdom"
                                },
                                region: "Mexico",
                                city: "Stambul",
                                district: "Columbia Picters",
                                street: "Stalina",
                                pcode: "112308"
                            }
                        ]
                    },
                    docs: [
                        {
                            type: 1,
                            num: "2343453405",
                            expdate: 2230848000000,//10.09.2040
                            issdate: 1425772800000,//08.03.2015
                            issby: "Baumanskiy OVD",
                            nation: {
                                id: "CO350220RU", // Russia
                                name: "Russia"
                            }
                        }
                    ]
                }
            };

            wsApi.sendMessage("person", "update", updatefullperson, function(data) {
                expect(data).not.toBeNull();
                expect(data.id).toBe(personId);
                wsApi.sendMessage("person", "retrieve", {id:personId}, function(data) {
                    var updatedperson = data;
                    expect(updatedperson.id).toBe(personId);
                    expect(updatedperson.gender).toBe(updatefullperson.person.gender);
                    expect(updatedperson.name.first).toBe(updatefullperson.person.name.first);
                    expect(updatedperson.name.middle).toBe(updatefullperson.person.name.middle);
                    expect(updatedperson.name.last).toBe(updatefullperson.person.name.last);
                    expect(updatedperson.birthday).toBe(updatefullperson.person.birthday);
                    expect(updatedperson.contacts.mobiles[0].prefix.id).toBe(updatefullperson.person.contacts.mobiles[0].prefix.id);
                    expect(updatedperson.contacts.mobiles[0].prefix.name).toBe(updatefullperson.person.contacts.mobiles[0].prefix.name);
                    expect(updatedperson.contacts.mobiles[0].prefix.num).toBe(updatefullperson.person.contacts.mobiles[0].prefix.num);
                    expect(updatedperson.contacts.mobiles[0].num).toBe(updatefullperson.person.contacts.mobiles[0].num);
                    expect(updatedperson.contacts.email).toBe(updatefullperson.person.contacts.email);
                    expect(updatedperson.contacts.addrs[0].mcountry.id).toBe(updatefullperson.person.contacts.addrs[0].mcountry.id);
                    expect(updatedperson.contacts.addrs[0].mcountry.name).toBe(updatefullperson.person.contacts.addrs[0].mcountry.name);
                    expect(updatedperson.contacts.addrs[0].region).toBe(updatefullperson.person.contacts.addrs[0].region);
                    expect(updatedperson.contacts.addrs[0].city).toBe(updatefullperson.person.contacts.addrs[0].city);
                    expect(updatedperson.contacts.addrs[0].district).toBe(updatefullperson.person.contacts.addrs[0].district);
                    expect(updatedperson.contacts.addrs[0].street).toBe(updatefullperson.person.contacts.addrs[0].street);
                    expect(updatedperson.contacts.addrs[0].pcode).toBe(updatefullperson.person.contacts.addrs[0].pcode);
                    expect(updatedperson.docs[0].type).toBe(updatefullperson.person.docs[0].type);
                    expect(updatedperson.docs[0].num).toBe(updatefullperson.person.docs[0].num);
                    expect(updatedperson.docs[0].expdate).toBe(updatefullperson.person.docs[0].expdate);
                    expect(updatedperson.docs[0].issdate).toBe(updatefullperson.person.docs[0].issdate);
                    expect(updatedperson.docs[0].issby).toBe(updatefullperson.person.docs[0].issby);
                    expect(updatedperson.docs[0].nation.id).toBe(updatefullperson.person.docs[0].nation.id);
                    expect(updatedperson.docs[0].nation.name).toBe(updatefullperson.person.docs[0].nation.name);

                    wsApi.sendMessage("person", "delete", {id: personId}, function(data) {
                        done();
                    });
                });
            });
        });
    });

    it("can't be shown by not owner", function(done) {
        wsApi.sendMessage2("person", "create", createfullperson).then(function(data) {
            var personId = data.id;
            var wsApi2 = new WsApi(Settings.wsApiLocation);
            wsApi2.open({
                open: function () {
                    var login = {
                        key: generateUUID(),
                        login: "Darya",
                        pass: "12345"
                    };
                    wsApi2.sendMessage("account", "login", login, function(data) {
                        expect(data).not.toBeNull();

                        wsApi2.sendMessage("person", "retrieve", {id: personId}, null, function(response) {
                            expect(response.status).toBe(403);
                            wsApi2.close();
                            done();
                        });
                    });
                }
            });
        });
    });

    it("delete and check that person dont received", function(done) {
        wsApi.sendMessage("person", "create", cOrderAction.createPersonQuery, function(data) {
            expect(data).not.toBeNull();
            expect(data.id).not.toBeNull();
            var personId = data.id;
            wsApi.sendMessage("person", "delete", { id:personId }, function() {
                var query = {
                    num: 1,
                    filter: {
                        type: "name",
                        data: cOrderAction.createPersonQuery.name.last + "NotValid"
                    }
                };
                wsApi.sendMessage("persons", "retrieve", query, function(data) {
                    expect(data).toEqual([]);
                    done();
                });
            });
        });
    }, 20000);

    it("update name after pay", function(done) {
        var context = {};
        cOrderAction.createOrderWith1Service(cOrderAction.offer1Dto, "encodehoteloffer", "accommodation", 0, Settings.payerId).then(function(ct) {
            context = ct;
            return cOrderAction.payServiceCard(context.orderId, context.serviceId);
        }).then(function(data) {
            context.updatefullperson = {
                person: {
                    id: context.personId,
                    name: {
                        first: "Upfirst",
                        middle: "Upmiddle",
                        last: "Uplast" + "SomeString"
                    },
                    birthday: 810691200000,
                    contacts: {
                        mobiles: [
                            {
                                prefix: {
                                    id: "CO350220RU", // Russia
                                    name: "Russia",
                                    num: "7"
                                },
                                num: "911312345"
                            },
                            {
                                prefix: {
                                    id: "CO350220RU", // Russia
                                    name: "Russia",
                                    num: "7"
                                },
                                num: "112233445"
                            }
                        ],
                        email: "fgtyu@connectflexi.com",
                        addrs: [
                            {
                                mcountry: {
                                    id: "CO424242UN",
                                    name: "United Kingdom"
                                },
                                region: "Mexico",
                                city: "Stambul",
                                district: "Columbia Picters",
                                street: "Stalina",
                                pcode: "112308"
                            }
                        ]
                    },
                    docs: [
                        {
                            type: 1,
                            num: "2343453405",
                            expdate: 2230848000000,//10.09.2040
                            issdate: 1425772800000,//08.03.2015
                            issby: "Baumanskiy OVD",
                            nation: {
                                id: "CO350220RU", // Russia
                                name: "Russia"
                            }
                        }
                    ]
                }
            };
            return wsApi.sendMessage2("person", "update", context.updatefullperson);
        }).then( function (data) {
            expect(data).not.toBeNull();
            expect(data.id).toBe(context.personId);
            return wsApi.sendMessage2("order", "retrieve", {id: context.orderId});
        }).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.person).not.toBeNull();
            // var personDTO = data.person;
            // expect(personDTO.id).toBe(context.personId);
            // expect(personDTO.name.first).toBe(cOrderAction.createPersonQuery.name.first);
            // expect(personDTO.name.last).toBe(cOrderAction.createPersonQuery.name.last);
            expect(data.services[0]).not.toBeNull();
            var service = data.services[0];
            expect(service.items[0]).not.toBeNull();
            expect(service.items[0].length).toBeGreaterThan(0);
            expect(service.items[0][0]).not.toBeNull();
            var room = service.items[0][0];
            expect(room.persons[0].id).toBe(context.personId);
            expect(room.persons[0].name.first).toBe(cOrderAction.createPersonQuery.name.first);
            expect(room.persons[0].name.last).toBe(cOrderAction.createPersonQuery.name.last);
            var filterQuery = {
                num: 1,
                filter: {
                    type: "name",
                    data: context.updatefullperson.person.name.last
                }
            };
            return wsApi.sendMessage2("persons", "retrieve", filterQuery);
        }).then(function(data) {
            expect(data.length).toBe(1);
            expect(data[0].id).toBe(context.personId);
            wsApi.sendMessage2("person", "delete", { id:context.personId });

            done();
        }).catch(function (response) {
            console.error(response);
            fail("Изменение имени туриста после оплаты не работает!");
            done();
        });

    }, 30000);

    it("update profile", function (done) {
        const query = {
            person: {
                name: {
                    first: "RestTest",
                    last: "RestTest"
                },
                gender: "male",
                birthday: 636854400000
            }
        };

        wsApi.sendMessage2("person", "update", query).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.id).not.toBeNull();

            done();

        }).catch(function (response) {
            console.error(response);
            fail("Изменение профиля не работает!");
            done();
        });
    });

    it("not valid b2c payer", function (done) {

        let context = {};
        const login = {
            login: Settings.notValidB2CPayer.login,
            pass: Settings.notValidB2CPayer.pass,
            key : generateUUID()
        };
        wsApi.sendMessage2("account", "login", login).then(function(data) {
            expect(data).not.toBeNull();
            expect(data.login).not.toBeNull();
            expect(data.agent).not.toBeTruthy();
            expect(data.deposit).not.toBeNull();

            return cOrderAction.createOrderWith1Service(cOrderAction.offer1Dto, "encodehoteloffer", "accommodation", 0, Settings.notValidB2CPayer.payerId);
        }).then(function(ct) {
            expect(ct).not.toBeNull();
            context.orderId = ct.orderId;
            context.serviceId = ct.serviceId;
            context.personId = ct.personId;
            context.roomOffer = ct.room1Offer;

            return wsApi.sendMessage2("service", "prepay", { service: context.serviceId, type:"card" });
        }).then(function(data) {
            fail("Payer невалидный. Должна сработать валидация!");
            done();
        }).catch(function(response){
            CommonValidate.notEmptyObject(response);
            CommonValidate.isNumber(response.status, "status");
            expect(response.status).toBe(418, "При ошибке валидации статус должен быть 418");


            CommonValidate.notEmptyObject(response.data, "data");
            CommonValidate.notEmptyObject(response.data.error, "data.error");
            CommonValidate.notEmptyObject(response.data.error.person, "data.error.person");
            CommonValidate.notEmptyObject(response.data.error.person.contacts, "data.error.person.contacts");

            const contacts = response.data.error.person.contacts;
            CommonValidate.notEmptyArray(contacts.addrs, "data.error.person.contacts.addrs");
            expect(contacts.addrs[0].mcountry.id).toBe(1, "data.error.person.contacts.addrs[0].mcountry.id must be 1");
            expect(contacts.addrs[0].city).toBe(1, "data.error.person.contacts.addrs[0].city must be 1");
            expect(contacts.addrs[0].district).toBe(1, "data.error.person.contacts.addrs[0].district must be 1");
            expect(contacts.addrs[0].street).toBe(1, "data.error.person.contacts.addrs[0].street must be 1");
            expect(contacts.addrs[0].pcode).toBe(1, "data.error.person.contacts.addrs[0].pcode must be 1");


            CommonValidate.notEmptyArray(contacts.phones, "data.error.person.contacts.phones");
            expect(contacts.phones[0].prefix.num).toBe(1, "data.error.person.contacts.phones[0].prefix.num must be 1");// old style
            expect(contacts.phones[0].prefix.id).toBe(1, "data.error.person.contacts.phones[0].prefix.id must be 1");

            // CommonValidate.notEmptyArray(contacts.mobiles, "data.error.person.contacts.mobiles");
            // expect(contacts.mobiles[0].prefix.num).toBe(1, "data.error.person.contacts.mobiles[0].prefix.num must be 1");// old style
            // expect(contacts.mobiles[0].prefix.id).toBe(1, "data.error.person.contacts.mobiles[0].prefix.id must be 1");

            done();
        }).catch(function(e){
            console.error(e);
            fail("Тест не работает!");
            done();
        });

    });
});
