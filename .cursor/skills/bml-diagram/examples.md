# UuBml Diagram Examples

> **Note:** The BML canvas is standard **2048×2048 pixels** with **64×64 pixel icons**.
> All examples below use positions that fit within this constraint.
>
> **Important:** The JSON snippets below are **structural references** only. For actual diagram generation in this repo, **do not create JSON manually** — use `lib/bml-generator.js` and write the resulting UU5 string to a temp file (per `SKILL.md`).

## Example 1: Simple Client-Server Architecture

```json
{
  "id": "simpleClientServer",
  "author": "15-0000-1",
  "size": { "width": 2048, "height": 2048 },
  "editMode": {
    "frameVisible": true,
    "gridVisible": true,
    "socketsVisible": false,
    "plugsVisible": false,
    "anchorsVisible": false,
    "consoleVisible": false
  },
  "presentationMode": {
    "frameVisible": false,
    "gridVisible": false,
    "socketsVisible": false,
    "plugsVisible": false,
    "anchorsVisible": false
  },
  "elementMap": {
    "client": {
      "id": "client",
      "elementType": "Icon",
      "sourceUuBmlStencil": "uuplus4umall",
      "uuBmlIconCode": "product",
      "position": { "x": 64, "y": 128 },
      "text": "Client",
      "textWidth": 128,
      "textHidden": false,
      "importance": "high",
      "plural": false,
      "searchKey": "",
      "state": {},
      "label": {},
      "textBackgroundVisible": false,
      "topPointList": ["t1"],
      "rightPointList": ["r1", "r2"],
      "leftPointList": ["l1"],
      "bottomPointList": ["b1"],
      "pluggedSocketsMap": {
        "r1": [{ "elementId": "conn1", "plugId": "p1" }]
      }
    },
    "server": {
      "id": "server",
      "elementType": "Icon",
      "sourceUuBmlStencil": "uubmlitstuff",
      "uuBmlIconCode": "applicationServer",
      "position": { "x": 320, "y": 128 },
      "text": "Server",
      "textWidth": 128,
      "textHidden": false,
      "importance": "highest",
      "plural": false,
      "searchKey": "",
      "state": {},
      "label": {},
      "textBackgroundVisible": false,
      "topPointList": ["t1"],
      "rightPointList": ["r1"],
      "leftPointList": ["l1", "l2"],
      "bottomPointList": ["b1"],
      "pluggedSocketsMap": {
        "l1": [{ "elementId": "conn1", "plugId": "p2" }]
      }
    },
    "conn1": {
      "id": "conn1",
      "elementType": "Connector",
      "searchKey": "",
      "plugMap": {
        "p1": {
          "id": "p1",
          "position": { "x": 128, "y": 168 },
          "elementId": "client",
          "socketId": "r1"
        },
        "p2": {
          "id": "p2",
          "position": { "x": 320, "y": 168 },
          "elementId": "server",
          "socketId": "l1"
        }
      },
      "socketMap": {},
      "middlePointList": [],
      "importance": "normal",
      "lineStyle": "solid",
      "relationType": "general",
      "startPoint": { "pointType": "Plug", "id": "p1", "pointer": null },
      "endPoint": { "pointType": "Plug", "id": "p2", "pointer": "general" },
      "label": "HTTP",
      "labelPosition": 2
    }
  },
  "elementZOrderList": ["client", "server", "conn1"]
}
```

## Example 2: MCP Architecture with Blocks

```json
{
  "id": "mcpArchitecture",
  "author": "15-0000-1",
  "size": { "width": 2048, "height": 2048 },
  "editMode": {
    "frameVisible": true,
    "gridVisible": true,
    "socketsVisible": false,
    "plugsVisible": false,
    "anchorsVisible": false,
    "consoleVisible": false
  },
  "presentationMode": {
    "frameVisible": false,
    "gridVisible": false,
    "socketsVisible": false,
    "plugsVisible": false,
    "anchorsVisible": false
  },
  "elementMap": {
    "serverBlock": {
      "id": "serverBlock",
      "elementType": "Block",
      "searchKey": "",
      "size": { "width": 384, "height": 512 },
      "position": { "x": 320, "y": 0 },
      "importance": "normal",
      "text": "Remote Server",
      "textLocation": "top",
      "topSocketList": [],
      "bottomSocketList": [],
      "leftSocketList": [],
      "rightSocketList": [],
      "anchorPositionMap": {},
      "pluggedSocketsMap": {}
    },
    "cursor": {
      "id": "cursor",
      "elementType": "Icon",
      "sourceUuBmlStencil": "uuplus4umall",
      "uuBmlIconCode": "product",
      "position": { "x": 64, "y": 256 },
      "text": "Cursor IDE",
      "textWidth": 128,
      "importance": "objective",
      "plural": false,
      "searchKey": "",
      "state": {},
      "label": {},
      "textBackgroundVisible": false,
      "topPointList": [],
      "rightPointList": ["r1"],
      "leftPointList": [],
      "bottomPointList": [],
      "pluggedSocketsMap": {}
    },
    "mcpServer": {
      "id": "mcpServer",
      "elementType": "Icon",
      "sourceUuBmlStencil": "uubmlitstuff",
      "uuBmlIconCode": "applicationServer",
      "position": { "x": 448, "y": 256 },
      "text": "MCP Server",
      "textWidth": 128,
      "importance": "high",
      "plural": false,
      "searchKey": "",
      "state": {},
      "label": {},
      "textBackgroundVisible": false,
      "topPointList": [],
      "rightPointList": ["r1"],
      "leftPointList": ["l1"],
      "bottomPointList": [],
      "pluggedSocketsMap": {}
    },
    "command1": {
      "id": "command1",
      "elementType": "Icon",
      "sourceUuBmlStencil": "uuappcommon",
      "uuBmlIconCode": "command",
      "position": { "x": 576, "y": 128 },
      "text": "doc/read",
      "textWidth": 128,
      "importance": "highest",
      "plural": false,
      "searchKey": "",
      "state": {},
      "label": {},
      "textBackgroundVisible": false,
      "topPointList": [],
      "rightPointList": [],
      "leftPointList": ["l1"],
      "bottomPointList": [],
      "pluggedSocketsMap": {}
    },
    "command2": {
      "id": "command2",
      "elementType": "Icon",
      "sourceUuBmlStencil": "uuappcommon",
      "uuBmlIconCode": "command",
      "position": { "x": 576, "y": 384 },
      "text": "doc/find",
      "textWidth": 128,
      "importance": "highest",
      "plural": false,
      "searchKey": "",
      "state": {},
      "label": {},
      "textBackgroundVisible": false,
      "topPointList": [],
      "rightPointList": [],
      "leftPointList": ["l1"],
      "bottomPointList": [],
      "pluggedSocketsMap": {}
    }
  },
  "elementZOrderList": ["serverBlock", "cursor", "mcpServer", "command1", "command2"]
}
```

## Example 3: Activity Flow with Annotations

```json
{
  "id": "activityFlow",
  "author": "15-0000-1",
  "size": { "width": 2048, "height": 2048 },
  "editMode": {
    "frameVisible": true,
    "gridVisible": true,
    "socketsVisible": false,
    "plugsVisible": false,
    "anchorsVisible": false,
    "consoleVisible": false
  },
  "presentationMode": {
    "frameVisible": false,
    "gridVisible": false,
    "socketsVisible": false,
    "plugsVisible": false,
    "anchorsVisible": false
  },
  "elementMap": {
    "activity1": {
      "id": "activity1",
      "elementType": "Icon",
      "sourceUuBmlStencil": "uuappcommon",
      "uuBmlIconCode": "activity",
      "position": { "x": 192, "y": 256 },
      "text": "process_data",
      "textWidth": 128,
      "importance": "normal",
      "plural": false,
      "searchKey": "",
      "state": {},
      "label": {},
      "textBackgroundVisible": false,
      "topPointList": ["t1"],
      "rightPointList": ["r1"],
      "leftPointList": [],
      "bottomPointList": ["b1"],
      "pluggedSocketsMap": {}
    },
    "annotation1": {
      "id": "annotation1",
      "elementType": "Annotation",
      "searchKey": "",
      "size": { "width": 256, "height": 96 },
      "position": { "x": 64, "y": 64 },
      "text": "Entry point for data processing",
      "pointerStart": {
        "positionOnAnnotation": ["bottom"],
        "pointList": [{ "x": 192, "y": 160 }, { "x": 224, "y": 256 }],
        "orderInPolygon": 1
      },
      "pointerEnd": { "pointType": "Plug", "id": "ap1" },
      "plugMap": {
        "ap1": {
          "id": "ap1",
          "position": { "x": 224, "y": 256 },
          "elementId": "activity1",
          "socketId": "t1"
        }
      },
      "anchorPositionMap": {}
    }
  },
  "elementZOrderList": ["activity1", "annotation1"]
}
```

## Common Patterns

### Fan-out Pattern (One source, multiple targets)

Use MultiConnector with one startPoint and multiple endPoints.

### Layered Architecture

1. Put Block elements first in z-order
2. Place Icons inside the block area
3. Add Connectors last

### Bidirectional Communication

Use two separate Connectors or set `bidirectional: true` on MultiConnector.

### Grouped Services

Use Block to visually group related services, then add Icons inside the block bounds.
