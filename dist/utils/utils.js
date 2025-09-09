"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function dupKeyMessage(err) {
    if (err?.code === 11000 && err?.keyValue) {
        const keys = Object.keys(err.keyValue);
        return `Duplicate value for: ${keys.join(", ")}`;
    }
    return null;
}
exports.default = dupKeyMessage;
