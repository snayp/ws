'use strict';

const CommonValidate = {
    notEmpty : function(field, fieldName) {
        expect(field).toBeDefined("Поле " + fieldName +" отсутсвует");
        expect(field).not.toBeNull("Поле " + fieldName + " не задано");
        expect(field.length).toBeGreaterThan(0, "Поле " + fieldName + " не имеет строкового значения");
    },
    notEmptyIfExist : function(field, fieldName) {
        if(field === undefined) {
            return;
        }
        expect(field !== null).toBeTruthy("Поле " + fieldName +" не должно быть Null");
        if(field) {
            this.notEmpty(field, fieldName);
        }
    },
    notEmptyObject : function(field, fieldName) {
        expect(field).toBeDefined("Поле " + fieldName +" отсутсвует");
        expect(field).not.toBeNull("Поле " + fieldName + " не задано");
    },
    notZero : function(field, fieldName) {
        expect(field).toBeDefined("Поле " + fieldName +" отсутсвует");
        expect(field).not.toBeNull("Поле " + fieldName + " не задано");
        expect(field).toBeGreaterThan(0, "Поле " + fieldName + " должно быть больше 0");
    },
    isBoolean : function(field, fieldName) {
        expect(field).toBeDefined("Поле " + fieldName +" отсутсвует");
        expect(field).not.toBeNull("Поле " + fieldName + " не задано");
        expect(typeof field).toBe("boolean", "Поле " + fieldName + " не boolean");
    },
    isNumber : function(field, fieldName) {
        expect(field).toBeDefined("Поле " + fieldName +" отсутсвует");
        expect(field).not.toBeNull("Поле " + fieldName + " не задано");
        expect(typeof field).toBe("number", "Поле " + fieldName + " не number");
    },
    notEmptyArray : function(field, fieldName) {
        expect(field).toBeDefined("Поле " + fieldName +" отсутсвует");
        expect(field).not.toBeNull("Поле " + fieldName +" не задано");
        expect(field.length).toBeDefined("Поле " + fieldName +" не массив");
        expect(field.length).toBeGreaterThan(0, "Поле " + fieldName + " не задано");
    },
    isOneOf : function(field, values, fieldName) {
        this.notEmpty(field, fieldName);

        expect(values.indexOf(field)).toBeGreaterThan(-1, "Поле " + fieldName +" содержит недопустимое значение");
    },
};