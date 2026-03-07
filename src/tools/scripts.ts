/**
 * @module tools/scripts
 * @description Script event tools for GB Studio 4.2.2.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * GB Studio 4.2.2 Event Commands (verified directly from GB Studio source)
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * - EVENT_TEXT — Show dialogue text
 *   args: { text: string }   ← must be a PLAIN STRING, not a typed object
 *
 * - EVENT_IF — Conditional branch (was EVENT_IF_SCRIPT_VALUE in older docs — WRONG)
 *   args: { condition: ScriptValue }
 *   children: { true: [...events], false: [...events] }
 *   ScriptValue comparison: { type: "eq"|"ne"|"lt"|"lte"|"gt"|"gte",
 *                              valueA: { type: "variable", value: "N" },
 *                              valueB: { type: "number", value: N }
 *                                    | { type: "variable", value: "N" } }
 *   NOTE: DO NOT use EVENT_IF_SCRIPT_VALUE — that was the GB Studio 3 name.
 *         GB Studio 4 uses EVENT_IF with a `condition` ScriptValue.
 *
 * - EVENT_SET_VALUE — Set a variable to a value
 *   args: { variable: string,   ← variable id/index ("0","1",…) or symbol/name
 *           value: ScriptValue  ← e.g. { type:"number", value: 5 } }
 *
 * - EVENT_VARIABLE_MATH — Arithmetic on a variable
 *   args: { vectorX: string,          ← destination variable index
 *           operation: "set"|"add"|"sub"|"mul"|"div"|"mod",
 *           other: "val"|"var"|"rnd", ← source type
 *           value: string,            ← literal number as string (when other="val")
 *           vectorY: string }         ← source variable index (when other="var")
 *
 * - EVENT_ACTOR_SET_POSITION — Teleport actor to tile position
 *   args: { actorId: string,            ← actor UUID or "player" / "$self$"
 *           x: ScriptValue,             ← { type:"number",value:N } or { type:"variable",value:"N" }
 *           y: ScriptValue }
 *
 * - EVENT_ACTOR_MOVE_TO — Walk actor to tile position
 *   args: { actorId: string, x: ScriptValue, y: ScriptValue,
 *           moveType?: "horizontal"|"vertical"|"diagonal",
 *           useCollisions?: boolean }
 *
 * - EVENT_ACTOR_SHOW / EVENT_ACTOR_HIDE
 *   args: { actorId: string }
 *
 * - EVENT_SET_INPUT_SCRIPT — Bind a button to a script (runs while scene is active)
 *   args: { input: string[],   ← button names: "up"|"down"|"left"|"right"|"a"|"b"|"start"|"select"
 *           override: boolean  ← true = override default button action  (NOT "persist"!)  }
 *   children: { true: [...events] }   ← events run on button press
 *
 * - EVENT_SWITCH_SCENE — Transition to another scene
 *   args: { sceneId: string,        ← scene UUID
 *           x: ScriptValue,         ← player start X
 *           y: ScriptValue,         ← player start Y
 *           direction: string,      ← "up"|"down"|"left"|"right"|""
 *           fadeSpeed: string }     ← "1"-"5" or "0"
 *
 * - EVENT_WAIT — Wait for N frames or seconds
 *   args: { time: ScriptValue, units?: "frames"|"time" }
 *
 * - EVENT_MUSIC_PLAY — Play music track
 *   args: { musicId: string, loop: boolean }
 *
 * - EVENT_MUSIC_STOP
 *   args: {}
 *
 * - EVENT_CAMERA_MOVE_TO
 *   args: { x: ScriptValue, y: ScriptValue, speed: number }
 *
 * - EVENT_CALL_CUSTOM_EVENT
 *   args: { customEventId: string }
 *
 * - EVENT_FADE_IN / EVENT_FADE_OUT
 *   args: { speed: string }
 *
 * - EVENT_ACTOR_EMOTE
 *   args: { actorId: string, emoteId: string }
 *
 * - EVENT_ACTOR_SET_DIRECTION
 *   args: { actorId: string, direction: { type: "direction", value: string } }
 *
 * - EVENT_COMMENT — Developer comment (no-op at runtime)
 *   args: { text: string }
 *
 * - EVENT_GBVM_SCRIPT — Raw GBVM assembly (advanced)
 *   args: { script: string, references?: any[] }
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ScriptValue types (used in conditions, positions, set-value, wait…):
 *   { type: "number",   value: N }         literal integer
 *   { type: "variable", value: "N" }       reference to variable by id/index
 *   { type: "true" }  /  { type: "false" } boolean literals
 *   { type: "eq"|"ne"|"lt"|"lte"|"gt"|"gte", valueA: SV, valueB: SV }  comparison
 *   { type: "add"|"sub"|"mul"|"div"|"mod",    valueA: SV, valueB: SV }  math
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { resolveScriptTarget, uuid, requireProject } from "../project.js";
import type { ScriptEvent } from "../project.js";

/** Map old operator strings to GB Studio 4 ScriptValue comparison types */
const OPERATOR_MAP: Record<string, string> = {
  "==":  "eq",  "eq":  "eq",
  "!=":  "ne",  "ne":  "ne",
  "<":   "lt",  "lt":  "lt",
  "<=":  "lte", "lte": "lte",
  ">":   "gt",  "gt":  "gt",
  ">=":  "gte", "gte": "gte",
};

/** Ensure script events with children have __type: "event" */
function normalizeEvent(event: ScriptEvent): ScriptEvent {
  if (event.children) {
    event.__type = "event";
    for (const key of Object.keys(event.children)) {
      event.children[key] = event.children[key].map(normalizeEvent);
    }
  }
  return event;
}

/** Resolve variable arg to its string index in project.variables */
function resolveVariable(raw: unknown): string {
  const str = typeof raw === "object" && raw !== null && "value" in raw
    ? String((raw as { value: string }).value || "")
    : String(raw ?? "");
  try {
    const p = requireProject();
    const idx = p.variables.findIndex(
      (v: { id: string; symbol: string; name: string }, i: number) =>
        v.id === str || v.symbol === str || v.name === str ||
        v.name.toLowerCase() === str.toLowerCase() || String(i) === str
    );
    return idx >= 0 ? String(idx) : str;
  } catch {
    return str;
  }
}

const wrapNum = (v: unknown) => typeof v === "number" ? { type: "number", value: v } : v;
const wrapDir = (v: unknown) => typeof v === "string" ? { type: "direction", value: v } : v;

export const scriptTools = {
  add_script_event: {
    description: [
      "Append a script event to a scene, actor, or trigger script.",
      "Uses GB Studio 4.2.2 event format.",
      "",
      "KEY RULES:",
      "• Conditionals: use EVENT_IF with args.condition (ScriptValue). NOT EVENT_IF_SCRIPT_VALUE.",
      "• Input binding: EVENT_SET_INPUT_SCRIPT — input buttons are 'up','down','left','right','a','b','start','select'. Use args.override:true (NOT persist).",
      "• Math: EVENT_VARIABLE_MATH with vectorX/operation/other/value|vectorY.",
      "• updateScript on actors runs every frame — use it for game loops.",
    ].join("\n"),
    inputSchema: {
      type: "object" as const,
      properties: {
        target:     { type: "string", enum: ["scene", "actor", "trigger"], description: "Target type" },
        targetId:   { type: "string", description: "UUID of the target" },
        scriptType: { type: "string", description: "Script slot: script, startScript, updateScript, hit1Script, hit2Script, hit3Script, playerHit1Script, etc." },
        command:    { type: "string", description: "Event command (e.g. EVENT_IF, EVENT_SET_VALUE, EVENT_TEXT, EVENT_VARIABLE_MATH, EVENT_ACTOR_SET_POSITION)" },
        args:       { type: "object", description: "Event arguments — command-specific. For EVENT_IF pass args.condition as a ScriptValue." },
        children:   { type: "object", description: "Child branches: { true: [...], false: [...] } for EVENT_IF; { true: [...] } for EVENT_SET_INPUT_SCRIPT" },
        sceneId:    { type: "string", description: "Scene UUID (required when target is 'actor' or 'trigger')" },
      },
      required: ["target", "targetId", "scriptType", "command"],
    },

    handler: async (args: {
      target: string; targetId: string; scriptType: string; command: string;
      args?: Record<string, any>; children?: Record<string, ScriptEvent[]>;
      sceneId?: string;
    }) => {
      const { owner, scriptKey } = resolveScriptTarget(args.target, args.targetId, args.scriptType, args.sceneId);
      const rawArgs = { ...(args.args || {}) };

      // ── EVENT_SWITCH_SCENE ──────────────────────────────────────────────────
      if (args.command === "EVENT_SWITCH_SCENE") {
        rawArgs.x         = wrapNum(rawArgs.x);
        rawArgs.y         = wrapNum(rawArgs.y);
        rawArgs.fadeSpeed = rawArgs.fadeSpeed ?? "2";
        rawArgs.direction = wrapDir(rawArgs.direction ?? "");
        if (typeof rawArgs.sceneId === "string") {
          rawArgs.sceneId = { type: "scene", value: rawArgs.sceneId };
        }
      }

      // ── EVENT_IF / EVENT_IF_SCRIPT_VALUE compat ────────────────────────────
      // GB Studio 4 uses EVENT_IF with a `condition` ScriptValue.
      // Accept both names; always emit EVENT_IF with correct format.
      if (args.command === "EVENT_IF_SCRIPT_VALUE") {
        args = { ...args, command: "EVENT_IF" };
      }
      if (args.command === "EVENT_IF") {
        // If caller passed old-style { variable, operator, value } → convert to condition ScriptValue
        if (rawArgs.variable !== undefined && rawArgs.condition === undefined) {
          const varIdx  = resolveVariable(rawArgs.variable);
          const opType  = OPERATOR_MAP[rawArgs.operator ?? "=="] ?? "eq";
          const valRaw  = rawArgs.value;
          const valueB  = (typeof valRaw === "number")
            ? { type: "number", value: valRaw }
            : (valRaw && typeof valRaw === "object" && "type" in valRaw)
              ? valRaw
              : { type: "number", value: Number(valRaw ?? 0) };
          rawArgs.condition = {
            type: opType,
            valueA: { type: "variable", value: varIdx },
            valueB,
          };
          delete rawArgs.variable;
          delete rawArgs.operator;
          delete rawArgs.value;
        }
        // If condition.type is an old operator symbol, normalise it
        if (rawArgs.condition?.type && OPERATOR_MAP[rawArgs.condition.type]) {
          rawArgs.condition = { ...rawArgs.condition, type: OPERATOR_MAP[rawArgs.condition.type] };
        }
      }

      // ── EVENT_SET_VALUE ─────────────────────────────────────────────────────
      if (args.command === "EVENT_SET_VALUE") {
        if (rawArgs.variable !== undefined) {
          rawArgs.variable = resolveVariable(rawArgs.variable);
        }
        rawArgs.value = wrapNum(rawArgs.value);
      }

      // ── EVENT_TEXT ──────────────────────────────────────────────────────────
      if (args.command === "EVENT_TEXT") {
        if (rawArgs.text && typeof rawArgs.text === "object" && "value" in rawArgs.text) {
          rawArgs.text = (rawArgs.text as { value: string }).value;
        }
      }

      // ── EVENT_WAIT ──────────────────────────────────────────────────────────
      if (args.command === "EVENT_WAIT") {
        rawArgs.time = wrapNum(rawArgs.time);
      }

      // ── EVENT_ACTOR_SET_POSITION / EVENT_ACTOR_MOVE_TO ──────────────────────
      if (args.command === "EVENT_ACTOR_SET_POSITION" || args.command === "EVENT_ACTOR_MOVE_TO") {
        rawArgs.x = wrapNum(rawArgs.x);
        rawArgs.y = wrapNum(rawArgs.y);
      }

      // ── EVENT_SET_INPUT_SCRIPT ───────────────────────────────────────────────
      // input: array of lowercase button names: "up","down","left","right","a","b","start","select"
      // override: true (not "persist")
      if (args.command === "EVENT_SET_INPUT_SCRIPT") {
        // Normalise INPUT_UP → up, INPUT_DOWN → down etc. for backwards compat
        if (Array.isArray(rawArgs.input)) {
          rawArgs.input = rawArgs.input.map((btn: string) =>
            btn.replace(/^INPUT_/i, "").toLowerCase()
          );
        }
        // Rename persist → override if caller used old name
        if (rawArgs.persist !== undefined && rawArgs.override === undefined) {
          rawArgs.override = rawArgs.persist;
          delete rawArgs.persist;
        }
        if (rawArgs.override === undefined) rawArgs.override = true;
      }

      // ── Extract branch children from args if caller embedded them ────────────
      const branchKeys = ["true", "false", "trueEvents", "falseEvents"];
      const childrenFromArgs: Record<string, ScriptEvent[]> = {};
      branchKeys.forEach(k => {
        if (Array.isArray(rawArgs[k])) {
          childrenFromArgs[k.replace("Events", "")] = rawArgs[k] as ScriptEvent[];
          delete rawArgs[k];
        }
      });

      // ── Build the event ──────────────────────────────────────────────────────
      const event: ScriptEvent = {
        id: uuid(),
        command: args.command,
        args: rawArgs,
      };

      const allChildren = { ...childrenFromArgs, ...(args.children || {}) };
      if (Object.keys(allChildren).length > 0) {
        event.children = {};
        for (const [key, events] of Object.entries(allChildren)) {
          event.children[key] = (events as ScriptEvent[]).map(e => {
            const normalized = { ...e, id: e.id || uuid() };
            return normalizeEvent(normalized);
          });
        }
        event.__type = "event";
      }

      (owner as any)[scriptKey].push(event);
      return { content: [{ type: "text" as const, text: `Script event added: ${args.command} → ${event.id}` }] };
    },
  },

  clear_script: {
    description: "Clear all events from a script",
    inputSchema: {
      type: "object" as const,
      properties: {
        target:     { type: "string", enum: ["scene", "actor", "trigger"] },
        targetId:   { type: "string" },
        scriptType: { type: "string" },
        sceneId:    { type: "string" },
      },
      required: ["target", "targetId", "scriptType"],
    },
    handler: async (args: { target: string; targetId: string; scriptType: string; sceneId?: string }) => {
      const { owner, scriptKey } = resolveScriptTarget(args.target, args.targetId, args.scriptType, args.sceneId);
      const count = (owner as any)[scriptKey].length;
      (owner as any)[scriptKey] = [];
      return { content: [{ type: "text" as const, text: `Cleared ${count} events from ${args.scriptType}` }] };
    },
  },

  get_script: {
    description: "Get all script events from a target",
    inputSchema: {
      type: "object" as const,
      properties: {
        target:     { type: "string", enum: ["scene", "actor", "trigger"] },
        targetId:   { type: "string" },
        scriptType: { type: "string" },
        sceneId:    { type: "string" },
      },
      required: ["target", "targetId", "scriptType"],
    },
    handler: async (args: { target: string; targetId: string; scriptType: string; sceneId?: string }) => {
      const { owner, scriptKey } = resolveScriptTarget(args.target, args.targetId, args.scriptType, args.sceneId);
      return { content: [{ type: "text" as const, text: JSON.stringify((owner as any)[scriptKey], null, 2) }] };
    },
  },
};
