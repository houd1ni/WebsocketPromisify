"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("./mock/index");
(async () => {
    await index_1.default();
    return console.log('Mock Server launched.');
})();
exports.default = null;
