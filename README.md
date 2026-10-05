# WICK — a danmaku RPG fight

Open `index.html` in a modern browser; keep the `js` folder beside it. No build step is needed. The game works as a static file, and its secret editor opens with the key sequence `D E V M O D E`.

## Room maps

Room data lives in `js/maps.js` as `R`. The editor changes these same room records: `f:[x,y,width,height]` is the floor rectangle, `o` contains positioned objects, `d` contains door rectangles, `c` contains collision rectangles, and `triggers` contains enemy or dialogue rectangles. Click the map preview to place objects or areas. In Select mode drag objects, doors, and areas; use the blue corner handle to resize floors, doors, collision boxes, and trigger areas. Signs and NPCs are point objects and can be moved but not resized. The editor saves data in browser storage; use Export project data for a portable JSON backup.

Door `to` is the target room's zero-based index in `R`; `px,py` is the arrival position. An enemy area uses the room's selected `enemyId`; a dialogue area uses the placement text. `c` rectangles block player movement. You can attach an image and sound file to a room from the editor.

Rooms now use clear rectangular walkable spaces, open center paths, and doors placed at consistent edges. The campaign regions no longer contain hidden collision blocks. The Wax Corridor links back to Hollow Hall, onward to the Dark Room, and north to the Lantern Garden; the Garden's west exit opens the eleven-region route from [THE LAST SAVE](https://github.com/lseeecubb-code/b), from the Quiet Road to the Last Autosave. Visit Pip, use a checkpoint, and search the chest. Mira shares chapter memories, each region has repeatable walking encounters and a story fight, and the Archive has a roadside shop.

Checkpoints show the determination line and ask whether to SAVE or RETURN. SAVE restores HP and records the checkpoint; RETURN closes the prompt. Conversation text is wrapped before display and its font shrinks when needed to keep each page within four lines.

NPCs may define `options:[{label,lines}]` for branching conversations. An option may instead use `shopId` to open a shop. Shops are defined in `js/shops.js`; room objects use `{k:'shop',shopId:'lantern-stand',x,y}`. Arrow keys move through choices and stock, Z confirms, and X backs out. Purchases spend BUNS and apply their effect immediately.

Press Escape while exploring to open the pause menu. Items purchased from shops go into the 8-slot inventory and can be used from ITEM. The menu also opens the shop list, shows status, and saves the current position, HP, currency, inventory, and room progress in browser storage. The FIGHT timing bar shows the moving strike marker, center target, and timing guides.

## Content files

- `js/maps.js`: room layouts, floor geometry, room objects and door connections.
- `js/enemies.js`: WICK and imported monster definitions, phases, dialogue, levels, and weaknesses.
- `js/attack-patterns.js`: WICK patterns, imported move patterns, and combat scenes.
- `js/npcs.js`: NPCs plus imported chapters, dialogue, quests, and companion records.
- `js/shops.js`: WICK shops plus imported items, gear, skills, recipes, and price data.
- `js/maps.js`: room layouts, campaign maps, doors, objects, and imported story scenes.
- `js/sprites.js`: pixel sprite definitions.
- `audio/remastered/ambient/` and `audio/remastered/enemies/`: WICK and imported region / enemy themes.
- `js/battle.js`: battle state, player actions, projectile collision, and rendering.
- `js/world.js`: exploration movement, collisions, interactions, and map rendering.
- `js/main.js`: animation loop and startup.
- `js/devtools.js`: hidden room editor, local saving, and import/export.

Map object kinds include `sign`, `npc`, `save`, `chest`, and `wickmob`. Dialogue is stored as `t:["line one", "line two"]`.

Every enemy has a `natural` boolean. Set it to `true` to allow random walking encounters in rooms that list that enemy in `encounters`; set it to `false` for story-triggered or placed-only enemies. The hidden enemy panel exposes the same Natural encounters setting. Imported monsters keep their source levels, abilities, drop tables, weaknesses, battle dialogue, and boss-phase records. Their attacks are converted into individual WICK bullet patterns; campaign rooms add natural monsters by level band, and source story scenes are readable from signs in their matching rooms.

Type `D E V M O D E` and open **Game data** to browse the complete content catalogs. The enemy and attack testers include the imported roster and per-move patterns. Test battles restore the player's room and HP afterwards. The imported shop, item, recipe, quest, companion, scene, and chapter data are available for inspection; WICK's normal combat and menu controls remain in use.

The transferred snapshot includes 69 monster records, 21 phase-two records, 100 item and equipment records, 22 skills, 140 recipes, 11 story chapters and their dialogue scenes, 11 main-quest records, 24 side quests, companion data, faction and town data, achievements, and 94 remastered WAV tracks. Source monster HP is retained as `repoHP`; playable HP is scaled for WICK's smaller combat system. Each source basic attack and ability has a generated WICK bullet pattern, with the original attack data kept alongside it.

When an older browser save is opened, the hidden editor adds the campaign maps, source NPCs, story-scene signs, encounter pools, enemy records, and attack patterns once while keeping existing custom maps and settings. Export the project data after opening the updated game if you want the new content in an existing JSON backup. Audio files stay beside the game and play from relative paths, including when opened as a static file URL.
