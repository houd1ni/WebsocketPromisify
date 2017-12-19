"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ava_1 = require("ava");
const specs = require("./specs");
const index_1 = require("./mock/index");
const _ = require("ramda");
(async () => {
    await index_1.default();
    console.log('Mock Server launched.');
    _.forEachObjIndexed((spec, name) => {
        ava_1.default(name, spec);
    })(specs);
})();
