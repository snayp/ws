# WebSocket Tests

##  Предустановка

npm install -g karma
npm install -g karma-cli
npm install -g jasmine-core


npm install --save-dev jasmine-core
npm install --save-dev karma-jasmine
npm install --save-dev karma-chrome-launcher


## Запуск

### Через консоль
karma start karma.conf.js


### Через Chrome
Надо добавить в параметры запуска хрома "--allow-file-access-from-files", чтобы не было CORS ошибки.

Т.е. будет в ярлыке будет так: "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" --allow-file-access-from-files