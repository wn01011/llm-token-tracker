"use strict";
/**
 * AI Token Tracker - Main Entry Point
 * Track token usage and costs for OpenAI and Claude APIs
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PRICING = exports.calculateCost = exports.AnthropicWrapper = exports.OpenAIWrapper = exports.TokenTracker = void 0;
// Main exports
var tracker_1 = require("./tracker");
Object.defineProperty(exports, "TokenTracker", { enumerable: true, get: function () { return tracker_1.TokenTracker; } });
var openai_1 = require("./providers/openai");
Object.defineProperty(exports, "OpenAIWrapper", { enumerable: true, get: function () { return openai_1.OpenAIWrapper; } });
var anthropic_1 = require("./providers/anthropic");
Object.defineProperty(exports, "AnthropicWrapper", { enumerable: true, get: function () { return anthropic_1.AnthropicWrapper; } });
var pricing_1 = require("./pricing");
Object.defineProperty(exports, "calculateCost", { enumerable: true, get: function () { return pricing_1.calculateCost; } });
Object.defineProperty(exports, "PRICING", { enumerable: true, get: function () { return pricing_1.PRICING; } });
// Default export
const tracker_2 = require("./tracker");
exports.default = tracker_2.TokenTracker;
//# sourceMappingURL=index.js.map