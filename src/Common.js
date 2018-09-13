function generateUUID () { // Public Domain/MIT
    var d = new Date().getTime();
    if (typeof performance !== 'undefined' && typeof performance.now === 'function'){
        d += performance.now(); //use high-precision timer if available
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}
function roundUp(num, precision) {
    return Math.ceil(num * precision) / precision
}

function halfUp(num, precision) {
    precision = precision === undefined ? 100 : precision
    return Math.round(num * precision) / precision;
}


function delay(delay) {
    return new Promise(function(resolve, reject) {
        setTimeout(resolve, delay);
    });
}

function checkDoc(url) {
    return $.ajax({
        type: "GET",
        url: url
    });
}

function sleep(time) {
    return new Promise((resolve) => { 
        setTimeout(resolve, time); 
        return resolve;
    });
}

function randomString(len) {
    let text = "";
    let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

    for (let i = 0; i < len; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}