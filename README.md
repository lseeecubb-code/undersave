# ⚔️ WICK — A Danmaku RPG Adventure

> **Fight monsters. Explore strange rooms. Make choices. Survive the bullet storm.**
>
> **WICK** is a pixel-art RPG built around fast **danmaku (bullet-hell) combat**, exploration, branching conversations, shops, secrets, and a growing world to uncover.

🎮 **No installation. No build step. Just open the game and play.**

## ▶️ Play WICK

### 🌟 Play Vanilla

Want to jump straight into the game without downloading anything?

**[▶️ PLAY WICK — VANILLA](https://lseeecubb-code.github.io/undersave/)**

This is the browser version of WICK. No setup required — just open it and start playing.

### 🛠️ Or Get the Project

Want to experiment with the game, edit rooms, or explore the developer tools?

**[📦 View the WICK GitHub Repository](https://github.com/lseeecubb-code/undersave)**

Download or clone the repository, then open `index.html` in a modern browser.

Keep the `js` folder beside `index.html`.

---

## 🎮 Controls

| Key               | Action                             |
| ----------------- | ---------------------------------- |
| **Arrow Keys**    | Move / navigate menus              |
| **Z**             | Confirm / interact                 |
| **X**             | Back / cancel                      |
| **Escape**        | Open pause menu                    |
| **D E V M O D E** | Unlock the secret developer editor |

---

# 💥 Enter the Bullet Storm

WICK combines RPG exploration with **danmaku-style battles**.

During combat you'll need to:

* ⚔️ Choose between **FIGHT, TALK, ACT, SPARE**, and other actions
* ❤️ Dodge waves of enemy projectiles
* 🎯 Time your attacks with the strike bar
* 🧠 Learn enemy patterns and weaknesses
* 🛡️ Survive increasingly dangerous phases
* 💬 Discover different dialogue and battle outcomes

Every enemy has its own abilities, dialogue, weaknesses, and attack patterns.

Some fights are random.

Others are waiting for you as part of the story.

---

# 🌎 Explore a Living World

WICK isn't just a collection of battles.

Explore connected regions filled with:

* 🧑 NPCs and branching conversations
* 📜 Story scenes and memories
* 💾 Checkpoints
* 🎁 Hidden chests
* 🚪 Connected rooms
* 👾 Random encounters
* ⚔️ Story battles
* 🛒 Shops and travelling merchants
* 🔍 Secrets waiting to be discovered

Visit **Pip**, use a checkpoint, search the chest, talk to **Mira**, and uncover the memories scattered throughout the world.

The **Wax Corridor** connects back to **Hollow Hall**, onward to the **Dark Room**, and north toward the **Lantern Garden**.

From there, the journey opens into an eleven-region route leading from **Quiet Road** all the way to **Last Autosave**.

---

# 💾 Your Choices Matter

Checkpoints aren't just save points.

When you reach one, you'll see the determination line and choose:

**SAVE**
Restore your HP and record your progress.

**RETURN**
Leave the checkpoint without saving.

Your progress can include:

* Current room
* Player position
* HP
* Currency
* Inventory
* Room progress
* Other game state

Everything is stored locally in your browser.

---

# 🎒 Items, Shops & BUNS

Find and buy items throughout your journey.

Shops offer equipment, skills, recipes, supplies, and other useful discoveries.

Purchased items enter your **8-slot inventory** and can be used directly from the pause menu.

**BUNS** are used as currency.

Choose carefully — what you buy can make a difference when the next battle begins.

---

# 🧑‍🤝‍🧑 Characters & Stories

The world is filled with characters, quests, companions, factions, towns, and memories.

Talk to NPCs to discover:

* 💬 Branching conversations
* 📖 Chapter memories
* 🗺️ Main quests
* ❔ Side quests
* 🤝 Companion stories
* 🏘️ Town and faction information
* 🏆 Achievements
* ⚔️ Story encounters

Some conversations even give you choices that can lead to different interactions.

---

# 👾 A Massive Monster Roster

WICK contains a large collection of enemies with their own combat data.

The transferred content currently includes:

* **69 monster records**
* **21 phase-two records**
* **100 item & equipment records**
* **22 skills**
* **140 recipes**
* **11 story chapters**
* **11 main quests**
* **24 side quests**
* Companion data
* Faction and town data
* Achievements
* **94 remastered WAV tracks**

Imported monsters retain their original levels, abilities, drops, weaknesses, dialogue, and boss-phase information.

Their HP is also preserved as `repoHP`, while playable HP is scaled for WICK's faster combat system.

---

# 🎵 A Growing Soundtrack

WICK includes a large collection of remastered audio.

Audio is stored alongside the game, including:

```text
audio/
└── remastered/
    ├── ambient/
    └── enemies/
```

Music and sound effects load through relative paths, so they can play directly from a static file.

---

# 🗺️ The Secret Developer Editor

Think you've found everything?

Try this:

## `D E V M O D E`

Then open **Game data**.

The hidden editor lets you inspect and modify the game's world.

You can edit:

* 🏠 Rooms
* 🟦 Floors
* 🚪 Doors
* 🧱 Collision areas
* 👾 Enemy triggers
* 💬 Dialogue areas
* 🪧 Signs
* 🧑 NPCs
* 💾 Checkpoints
* 🎁 Chests
* 👾 WICK mobs
* 🛒 Shops
* 🖼️ Room images
* 🔊 Room sounds

Click the map preview to place objects and areas.

In **Select mode**, you can drag objects around and resize supported areas using the blue corner handle.

Signs and NPCs are point objects, so they can be moved but not resized.

---

# 🧩 Build Your Own Rooms

Room data lives in:

```text
js/maps.js
```

The main room collection is `R`.

Each room can contain:

```text
f          Floor rectangle
o          Objects
d          Doors
c          Collision rectangles
triggers   Enemy/dialogue areas
```

Doors use the target room's **zero-based index** in `R`.

Enemies can be assigned as natural encounters or placed specifically for story events.

Dialogue areas can contain their own text.

---

# 👾 Natural Encounters

Every enemy has a `natural` setting.

Set it to `true` to allow the enemy to appear as a random walking encounter in rooms where it is included in the encounter pool.

Set it to `false` for story-triggered or placed-only enemies.

The hidden enemy editor exposes the same setting, so you can build your own encounter pools without editing the source code manually.

---

# ⚔️ Build & Test Battles

The hidden Game Data tools also include:

* Enemy browser
* Attack pattern browser
* Battle tester
* Imported monster roster
* Individual enemy move patterns
* Phase-two data
* Dialogue
* Weaknesses
* Drops
* Levels

Test battles temporarily change the game state and restore your previous room and HP afterwards.

Every imported basic attack and ability is converted into an individual WICK bullet pattern while retaining the original attack data.

---

# 🛠️ Project Structure

```text
WICK/
├── index.html
├── audio/
│   └── remastered/
├── js/
│   ├── maps.js
│   ├── enemies.js
│   ├── attack-patterns.js
│   ├── npcs.js
│   ├── shops.js
│   ├── sprites.js
│   ├── battle.js
│   ├── world.js
│   ├── main.js
│   └── devtools.js
└── README.md
```

---

# 💾 Export Your World

The editor saves changes in your browser.

For a portable backup, use:

**Game Data → Export project data**

This creates JSON containing your project data so you can preserve or transfer your customizations.

---

# 🔥 The Goal

WICK is designed to feel like a strange little RPG that rewards curiosity.

Talk to everyone.

Search everything.

Learn enemy patterns.

Try different choices.

Return to places you've already visited.

And if something looks suspicious...

**interact with it.**

---

# ⭐ Play WICK

### 🌟 [▶️ PLAY VANILLA](https://lseeecubb-code.github.io/undersave/)

### 🛠️ [📦 VIEW ON GITHUB](https://github.com/lseeecubb-code/undersave)

**The world is yours to explore.**
