# Changelog

All notable changes to this project will be documented in this file.

## [2.4.0] - 2025-10-07

### Added
- 🎉 **Gemini API Support** - Full integration with Google's Gemini models
  - Added `GeminiWrapper` class for automatic token tracking
  - Support for Gemini 1.0, 1.5, and 2.0 series models
  - Proper usage metadata extraction from Gemini API responses
  
- 💎 **Gemini 2.0 Models** - Support for latest experimental models
  - `gemini-2.0-flash-exp` (Free during preview)
  - `gemini-2.0-flash-thinking-exp-1219` (Free during preview)
  
- 📊 **Gemini Pricing** - Comprehensive pricing data for all Gemini models
  - Gemini 1.5 Pro: $0.00125/$0.005 per 1K tokens (input/output)
  - Gemini 1.5 Flash: $0.000075/$0.0003 per 1K tokens
  - Gemini 1.5 Flash-8B: $0.0000375/$0.00015 per 1K tokens
  - Gemini 1.0 Pro and Vision models
  
- 🔧 **Enhanced Provider Detection** - Automatic Gemini client wrapping
  - Detects 'gemini' or 'google' in client name
  - Seamless integration with existing tracker API
  
- 💰 **Cost Comparison Updates** - Compare Gemini with OpenAI and Claude
  - Added Gemini Flash and Pro to comparison tools
  - Updated MCP server with Gemini support

### Changed
- Updated `TokenUsage` interface to include 'gemini' as a valid provider
- Enhanced `calculateCost` function with Gemini pricing logic
- Updated MCP server tools to accept 'gemini' provider
- Improved documentation with Gemini examples and pricing tables
- Version bump to 2.4.0

### Documentation
- Added comprehensive Gemini API example (`examples/gemini-example.js`)
- Updated README.md with Gemini support details
- Added Gemini pricing table with all model variants
- Updated package.json keywords to include 'gemini' and 'google-ai'
- Added peer dependency for `@google/generative-ai`

## [2.3.4] - Previous release

### Features
- USD to KRW exchange rate support
- File-based persistence
- MCP server with intuitive session tracking
- Support for OpenAI and Claude APIs

---

For more details, see the full commit history on GitHub.
