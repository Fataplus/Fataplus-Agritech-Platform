"""markdown
# Zen MCP Server — IDE client integration (local guide)

This file contains quick copy-paste configuration snippets to use the zen-mcp-server
(https://github.com/BeehiveInnovations/zen-mcp-server) with popular IDE MCP clients
and CLI tools. It mirrors the "IDE Clients" section from the upstream getting-started.md
and is intended for local development and testing of MCP-enabled assistants.

## Overview

Zen supports running as a local MCP server which many IDE clients (Cursor, VS Code
Claude extensions, Claude Code CLI, Gemini CLI, Codex, etc.) can talk to. Two
recommended installation methods:

- uvx (recommended): zero manual setup — it pulls and runs zen automatically.
- Clone & run: standard repo clone + run script for full control.

Choose one and then use the snippets below to point your client to the zen server.

## uvx bootstrap (recommended)

The uvx method uses a small shell loop that tries common uvx locations and then
executes the uvx launcher. Replace API keys as needed in the `env` block.

Example command (used in many clients' `command` + `args`):

sh -c 'for p in $(which uvx 2>/dev/null) $HOME/.local/bin/uvx /opt/homebrew/bin/uvx /usr/local/bin/uvx uvx; do [ -x "$p" ] && exec "$p" --from git+https://github.com/BeehiveInnovations/zen-mcp-server.git zen-mcp-server; done; echo "uvx not found" >&2; exit 1'

Environment example (add these to the client's env block):

PATH=/usr/local/bin:/usr/bin:/bin:/opt/homebrew/bin:~/.local/bin
GEMINI_API_KEY=your_api_key_here
OPENAI_API_KEY=your_api_key_here
OPENROUTER_API_KEY=your_api_key_here

Pro tip: you can use `uvx --from ... zen-mcp-server` directly if `uvx` is on your PATH
for a simpler one-liner.

## Cursor (GUI) — quick setup

1. Open Cursor → Settings (Cmd+,) → Integrations → Model Context Protocol (MCP).
2. Click Add MCP Server and supply:
   - Command: `sh`
   - Args: `-c` and the uvx bootstrap command shown above
   - Environment: add the API keys required by your model providers
3. Save — Cursor will launch the MCP server on demand.

## Visual Studio Code (Claude Dev extension)

1. Install Claude Dev extension v0.6.0+.
2. Open Command Palette → Claude: Configure MCP Servers → Add server.
3. Use the same `command`/`args` and `env` values as the uvx example.
4. Save the JSON snippet the extension generates — VS Code will reload the server when needed.

## Visual Studio Code — user `mcp.json` (global MCP servers)

VS Code (and some MCP-capable extensions) can also read a user-level `mcp.json` that registers global MCP servers. On macOS the file lives at:

`~/Library/Application Support/Code/User/mcp.json`

The attachment you provided uses this format and currently contains a `figma` server. To register a local zen server (for example when running `./run-server.sh` or exposing an HTTP endpoint), add a `zen` entry alongside existing servers. Example `mcp.json` that merges your `figma` entry and adds `zen`:

{
  "servers": {
    "figma": {
      "type": "http",
      "url": "https://mcp.figma.com/mcp",
      "gallery": true,
      "version": "0.0.1"
    },
    "zen": {
      "type": "http",
      "url": "http://127.0.0.1:11434/mcp",
      "version": "0.0.1",
      "description": "Local zen-mcp server (clone & run or run-server.sh)"
    }
  },
  "inputs": []
}

Notes:
- If you run the zen server locally via `./run-server.sh` it exposes an HTTP MCP endpoint — point `url` to that `/mcp` path.
- If you prefer the uvx bootstrap method (recommended), use the Claude/extension flow above to configure a `command` + `args` entry — many extensions expose that UI (it lets the client start zen on demand).
- Never commit `mcp.json` containing private API keys. Use local-only config for development.

## Claude Code CLI / .mcp.json example

Create a `.mcp.json` in your project root with this content (adjust env keys):

{
  "mcpServers": {
    "zen": {
      "command": "sh",
      "args": [
        "-c",
        "for p in $(which uvx 2>/dev/null) $HOME/.local/bin/uvx /opt/homebrew/bin/uvx /usr/local/bin/uvx uvx; do [ -x \"$p\" ] && exec \"$p\" --from git+https://github.com/BeehiveInnovations/zen-mcp-server.git zen-mcp-server; done; echo 'uvx not found' >&2; exit 1"
      ],
      "env": {
        "PATH": "/usr/local/bin:/usr/bin:/bin:/opt/homebrew/bin:~/.local/bin",
        "GEMINI_API_KEY": "your_api_key_here",
        "OPENAI_API_KEY": "your_api_key_here"
      }
    }
  }
}

## Codex / Gemini / Qwen / OpenCode examples

Most CLI clients accept a similar block in their configuration files. See the
upstream `getting-started.md` for client-specific file locations and minor syntax
variations (e.g. `~/.codex/config.toml` uses TOML). Key points:

- Use the same `command`/`args` loop or `uvx --from ...` one-liner
- Add required provider API keys to the `env` block
- Increase MCP timeouts if you run long-running tools (recommended: 300000 ms)

## Clone & run (alternate)

If you prefer cloning the repo:

git clone https://github.com/BeehiveInnovations/zen-mcp-server.git
cd zen-mcp-server
./run-server.sh

Then point your client at the local server command from the examples above but
replace the uvx bootstrap with the project `./run-server.sh` command or
`python ./server.py` path.

## Timeouts and client settings

Some clients default to short timeouts. It's recommended to set:

- MCP startup timeout: 300 seconds
- MCP tool timeout: 300 seconds

For example, in Claude Code / Desktop settings add:

{
  "env": {
    "MCP_TIMEOUT": "300000",
    "MCP_TOOL_TIMEOUT": "300000"
  }
}

## Security / API keys

- Never commit API keys to git. Use local config files or environment variables.
- Only provide the provider keys you need (Gemini/OpenAI/OpenRouter/etc.).

## References

- Upstream guide: https://github.com/BeehiveInnovations/zen-mcp-server/blob/main/docs/getting-started.md#ide-clients

"""
