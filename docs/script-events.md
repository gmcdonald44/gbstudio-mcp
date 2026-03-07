# GB Studio 4.2.2 Script Events

Event commands verified from GB Studio 4.2.2 source code (`src/lib/events/`).

## Dialogue

### EVENT_TEXT
Show text dialogue box.
```json
{ "command": "EVENT_TEXT", "args": { "text": "Hello!\nSecond line." } }
```

## Scene

### EVENT_SWITCH_SCENE
Switch to another scene with position and fade.
```json
{
  "command": "EVENT_SWITCH_SCENE",
  "args": {
    "sceneId": "scene-uuid",
    "x": { "type": "number", "value": 5 },
    "y": { "type": "number", "value": 3 },
    "direction": "down",
    "fadeSpeed": "2"
  }
}
```

## Variables

### EVENT_SET_VALUE
Set a variable to a value. Use presets for boolean.
```json
// Set to number
{ "command": "EVENT_SET_VALUE", "args": { "variable": "0", "value": { "type": "number", "value": 42 } } }

// Set to true
{ "command": "EVENT_SET_VALUE", "args": { "variable": "0", "value": { "type": "true" } } }

// Set to false
{ "command": "EVENT_SET_VALUE", "args": { "variable": "0", "value": { "type": "false" } } }
```

## Control Flow

### EVENT_IF
Conditional branch with true/false children. Events with children **must** have `"__type": "event"`.
```json
{
  "command": "EVENT_IF",
  "args": {
    "condition": {
      "type": "eq",
      "valueA": { "type": "variable", "value": "0" },
      "valueB": { "type": "number", "value": 1 }
    }
  },
  "children": {
    "true": [{ "id": "uuid", "command": "EVENT_TEXT", "args": { "text": "Yes!" } }],
    "false": [{ "id": "uuid", "command": "EVENT_TEXT", "args": { "text": "No!" } }]
  },
  "__type": "event"
}
```

Comparison types: `eq`, `ne`, `lt`, `gt`, `gte`, `lte`

## Timer

### EVENT_WAIT
Wait for a duration.
```json
{ "command": "EVENT_WAIT", "args": { "time": { "type": "number", "value": 0.5 } } }
// Or in frames:
{ "command": "EVENT_WAIT", "args": { "frames": { "type": "number", "value": 30 }, "units": "frames" } }
```

## Actor

### EVENT_ACTOR_MOVE_TO
Move actor to a tile position.
```json
{
  "command": "EVENT_ACTOR_MOVE_TO",
  "args": {
    "actorId": "actor-uuid",
    "x": { "type": "number", "value": 5 },
    "y": { "type": "number", "value": 3 }
  }
}
```

### EVENT_ACTOR_SET_DIRECTION
```json
{
  "command": "EVENT_ACTOR_SET_DIRECTION",
  "args": { "actorId": "actor-uuid", "direction": { "type": "direction", "value": "up" } }
}
```

### EVENT_ACTOR_SET_POSITION
Set actor position instantly (no walking animation).
```json
{
  "command": "EVENT_ACTOR_SET_POSITION",
  "args": {
    "actorId": "actor-uuid",
    "x": { "type": "number", "value": 10 },
    "y": { "type": "number", "value": 5 }
  }
}
```

### EVENT_ACTOR_EMOTE
```json
{ "command": "EVENT_ACTOR_EMOTE", "args": { "actorId": "actor-uuid", "emoteId": "emote-uuid" } }
```

### EVENT_ACTOR_SHOW / EVENT_ACTOR_HIDE
```json
{ "command": "EVENT_ACTOR_SHOW", "args": { "actorId": "actor-uuid" } }
{ "command": "EVENT_ACTOR_HIDE", "args": { "actorId": "actor-uuid" } }
```

## Music

### EVENT_MUSIC_PLAY
```json
{ "command": "EVENT_MUSIC_PLAY", "args": { "musicId": "music-uuid", "loop": true } }
```

### EVENT_MUSIC_STOP
```json
{ "command": "EVENT_MUSIC_STOP", "args": {} }
```

## Camera

### EVENT_CAMERA_MOVE_TO
```json
{
  "command": "EVENT_CAMERA_MOVE_TO",
  "args": {
    "x": { "type": "number", "value": 0 },
    "y": { "type": "number", "value": 0 },
    "speed": 1
  }
}
```

## Screen

### EVENT_FADE_IN / EVENT_FADE_OUT
```json
{ "command": "EVENT_FADE_IN", "args": { "speed": "2" } }
{ "command": "EVENT_FADE_OUT", "args": { "speed": "2" } }
```

## Input

### EVENT_SET_INPUT_SCRIPT
Bind a button to a script. Has `__type: "event"` with `true` children.
```json
{
  "command": "EVENT_SET_INPUT_SCRIPT",
  "args": { "input": ["start"] },
  "children": {
    "true": [{ "id": "uuid", "command": "EVENT_TEXT", "args": { "text": "Menu!" } }]
  },
  "__type": "event"
}
```

## Meta

### EVENT_COMMENT
Developer-only comment (no game effect).
```json
{ "command": "EVENT_COMMENT", "args": { "text": "TODO: add boss logic" } }
```

### EVENT_CALL_CUSTOM_EVENT
```json
{ "command": "EVENT_CALL_CUSTOM_EVENT", "args": { "customEventId": "custom-event-uuid" } }
```
