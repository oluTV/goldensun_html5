import * as numbers from './magic_numbers.js';
import { directions } from './utils.js';
import { initialize_main_chars, main_char_list, initialize_classes, party_data } from './initializers/main_chars.js';
import { initialize_abilities, abilities_list, initialize_field_abilities, field_abilities_list } from './initializers/abilities.js';
import { initialize_items, items_list } from './initializers/items.js';
import { initialize_djinni, djinni_list } from './initializers/djinni.js';
import { initialize_enemies, enemies_list } from './initializers/enemies.js';
import { initialize_maps, load_maps, maps } from './initializers/maps.js';
import { door_event_phases } from './events/door.js';
import { set_npc_event, trigger_npc_dialog } from './events/npc.js';
import { do_step } from './events/step.js';
import { do_collision_change } from './events/collision.js';
import * as climb from './events/climb.js';
import * as physics from './physics/collision_bodies.js';
import * as movement from './physics/movement.js';
import { initialize_menu } from './screens/menu.js';
import * as hero_control from './initializers/hero_control.js';
import { TileEvent } from './base/TileEvent.js';
import { set_debug_info, toggle_debug, toggle_keys, fill_key_debug_table, toggle_stats, fill_stats_debug_table } from './debug.js';
import { event_triggering } from './events/triggering.js';

//this variable contains important data used throughout the game
var data = {
    //movement
    x_speed: 0,
    y_speed: 0,
    extra_speed: 0,
    delta_time: 0,
    stop_by_colliding: false,
    force_direction: false,
    forcing_on_diagonal: false,
    arrow_inputs: null,

    //events and game states
    event_timers: {},
    on_event: false,
    climbing: false,
    teleporting: false,
    trying_to_push: false,
    waiting_to_step: false,
    step_event_data: {},
    waiting_to_change_collision: false,
    collision_event_data: {},
    trying_to_push_direction: "",
    push_timer: null,
    pushing: false,
    menu_open: false,
    casting_psynergy: false,
    door_event_data: null,
    climbing_event_data: null,
    jumping: false,
    in_battle: false,
    battle_stage: null,
    created: false,
    in_dialog: false,
    idle_climbing: false,

    //debug
    debug: false,
    grid: false,
    debug_keys: false,
    debug_stats: false,
    frame_counter: 0,

    //screen
    fullscreen: false,
    scale_factor: 1,

    //collision
    npcCollisionGroups: {},
    interactableObjectCollisionGroups: {},
    walking_on_pillars_tiles: new Set(),
    dynamic_jump_events_bodies: [],

    //npc
    npc_event: false,
    active_npc: null,
    waiting_for_enter_press: false,
    dialog_manager: null
};

//debugging porpouses
window.maps = maps;
window.main_char_list = main_char_list;
window.abilities_list = abilities_list;
window.items_list = items_list;
window.field_abilities_list = field_abilities_list;
window.djinni_list = djinni_list;
window.enemies_list = enemies_list;
window.party_data = party_data;
window.data = data;

var game = new Phaser.Game(
    numbers.GAME_WIDTH,
    numbers.GAME_HEIGHT,
    Phaser.WEBGL, //renderer
    "game",
    { preload: preload, create: create, update: update, render: render, loadRender: loadRender }, //states
    false, //transparent
    false //antialias
);
window.game = game;
data.game = game;

function load_buttons() {
    game.load.atlasJSONHash('buttons', 'assets/images/buttons/buttons.png', 'assets/images/buttons/buttons.json');
    game.load.image('shift_keyboard', 'assets/images/keyboard/shift.png');
    game.load.image('tab_keyboard', 'assets/images/keyboard/tab.png');
    game.load.image('spacebar_keyboard', 'assets/images/keyboard/spacebar.png');
}

function load_db_files() {
    game.load.json('init_db', 'init.json');
    game.load.json('classes_db', 'assets/dbs/classes_db.json');
    game.load.json('abilities_db', 'assets/dbs/abilities_db.json');
    game.load.json('items_db', 'assets/dbs/items_db.json');
    game.load.json('npc_db', 'assets/dbs/npc_db.json');
    game.load.json('interactable_objects_db', 'assets/dbs/interactable_objects_db.json');
    game.load.json('djinni_db', 'assets/dbs/djinni_db.json');
    game.load.json('enemies_db', 'assets/dbs/enemies_db.json');
    game.load.json('enemies_parties_db', 'assets/dbs/enemies_parties_db.json');
    game.load.json('maps_db', 'assets/dbs/maps_db.json');
    game.load.json('main_chars_db', 'assets/dbs/main_chars.json');
    game.load.json('summons_db', 'assets/dbs/summons_db.json');
}

function load_misc() {
    game.load.image('shadow', 'assets/images/misc/shadow.jpg');
    game.load.image('cursor', 'assets/images/misc/cursor.gif');
    game.load.image('green_arrow', 'assets/images/misc/green_arrow.gif');
    game.load.image('up_arrow', 'assets/images/misc/up_arrow.gif');
    game.load.image('down_arrow', 'assets/images/misc/down_arrow.gif');
    game.load.image('page_arrow', 'assets/images/misc/page_arrow.png');
    game.load.image('psynergy_aura', 'assets/images/misc/psynergy_aura.png');
    game.load.image('equipped', 'assets/images/misc/equipped.gif');
    game.load.image('venus_star', 'assets/images/misc/venus_star.gif');
    game.load.image('mercury_star', 'assets/images/misc/mercury_star.gif');
    game.load.image('mars_star', 'assets/images/misc/mars_star.gif');
    game.load.image('jupiter_star', 'assets/images/misc/jupiter_star.gif');
    game.load.image('stat_up', 'assets/images/misc/stat_up.gif');
    game.load.image('stat_down', 'assets/images/misc/stat_down.gif');
    game.load.image('arrow_change', 'assets/images/misc/arrow_change.png');
    game.load.atlasJSONHash('dust', 'assets/images/misc/dust.png', 'assets/images/misc/dust.json');
    game.load.atlasJSONHash('battle_cursor', 'assets/images/misc/battle_cursor.png', 'assets/images/misc/battle_cursor.json');
    game.load.atlasJSONHash('ranges', 'assets/images/misc/ranges.png', 'assets/images/misc/ranges.json');
    game.load.atlasJSONHash('psynergy_particle', 'assets/images/spritesheets/interactable_objects/psynergy_particle.png', 'assets/images/spritesheets/interactable_objects/psynergy_particle.json');
    game.load.atlasJSONHash('psynergy_ball', 'assets/images/spritesheets/interactable_objects/psynergy_ball.png', 'assets/images/spritesheets/interactable_objects/psynergy_ball.json');
}

function load_battle_assets() {
    game.load.atlasJSONHash('battle_backgrounds', 'assets/images/battle_backgrounds/battle_backgrounds.png', 'assets/images/battle_backgrounds/battle_backgrounds.json');
}

function preload() {
    load_db_files();
    load_misc();
    load_battle_assets();
    load_buttons();
    game.load.script('color_filters', 'plugins/color_filters.js');
    game.load.bitmapFont('gs-bmp-font', 'assets/font/golden-sun.png', 'assets/font/golden-sun.fnt');
    game.load.bitmapFont('gs-item-bmp-font', 'assets/font/gs-item-font.png', 'assets/font/gs-item-font.fnt');

    data.enter_input = game.input.keyboard.addKey(Phaser.Keyboard.ENTER).onDown;
    data.esc_input = game.input.keyboard.addKey(Phaser.Keyboard.ESC).onDown;
    data.shift_input = game.input.keyboard.addKey(Phaser.Keyboard.SHIFT).onDown;
    data.spacebar_input = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR).onDown;

    initialize_field_abilities(game, data);

    game.time.advancedTiming = true;
    game.stage.smoothed = false;
    game.camera.roundPx = true;
    game.renderer.renderSession.roundPixels = true;

    game.camera.fade(0x0, 1);
}

function render_loading() {
    game.debug.text('Loading...', 5, 15, "#00ff00");
}

function loadRender() {
    render_loading();
}

function enter_key_event() {
    if (data.casting_psynergy || data.climbing || data.pushing || data.teleporting || data.jumping || data.in_battle) return;
    trigger_npc_dialog(game, data);
}

async function create() {
    // initializing some vars
    data.init_db = game.cache.getJSON('init_db'); 
    data.npc_db = game.cache.getJSON('npc_db');
    data.interactable_objects_db = game.cache.getJSON('interactable_objects_db');
    data.classes_db = game.cache.getJSON('classes_db');
    data.abilities_db = game.cache.getJSON('abilities_db');
    data.items_db = game.cache.getJSON('items_db');
    data.djinni_db = game.cache.getJSON('djinni_db');
    data.enemies_db = game.cache.getJSON('enemies_db');
    data.enemies_parties_db = game.cache.getJSON('enemies_parties_db');
    data.maps_db = game.cache.getJSON('maps_db');
    data.main_chars_db = game.cache.getJSON('main_chars_db');
    data.summons_db = game.cache.getJSON('summons_db');
    data.hero_color_filters = game.add.filter('ColorFilters');
    data.map_color_filters = game.add.filter('ColorFilters');
    data.pasynergy_item_color_filters = game.add.filter('ColorFilters');

    data.hero_name = data.init_db.hero_key_name;
    data.current_direction = directions[data.init_db.initial_direction];
    data.map_name = data.init_db.map_key_name;
    data.scale_factor = data.init_db.initial_scale_factor;
    data.map_collider_layer = data.init_db.map_z_index;
    party_data.coins = data.init_db.coins;
    data.current_action = "idle";

    let load_maps_promise_resolve;
    let load_maps_promise = new Promise(resolve => {
        load_maps_promise_resolve = resolve;
    });
    initialize_maps(data.maps_db);
    load_maps(game, load_maps_promise_resolve);
    await load_maps_promise;

    initialize_classes(data.classes_db);

    let load_enemies_sprites_promise_resolve;
    let load_enemies_sprites_promise = new Promise(resolve => {
        load_enemies_sprites_promise_resolve = resolve;
    });
    initialize_enemies(game, data.enemies_db, load_enemies_sprites_promise_resolve);
    await load_enemies_sprites_promise;

    let load_djinni_sprites_promise_resolve;
    let load_djinni_sprites_promise = new Promise(resolve => {
        load_djinni_sprites_promise_resolve = resolve;
    });
    initialize_djinni(game, data.djinni_db, load_djinni_sprites_promise_resolve);
    await load_djinni_sprites_promise;
    
    let load_abilities_promise_resolve;
    let load_abilities_promise = new Promise(resolve => {
        load_abilities_promise_resolve = resolve;
    });
    initialize_abilities(game, data.abilities_db, load_abilities_promise_resolve);
    await load_abilities_promise;
    
    let load_items_promise_resolve;
    let load_items_promise = new Promise(resolve => {
        load_items_promise_resolve = resolve;
    });
    initialize_items(game, data.items_db, load_items_promise_resolve);
    await load_items_promise;

    let load_chars_promise_resolve;
    let load_chars_promise = new Promise(resolve => {
        load_chars_promise_resolve = resolve;
    });
    initialize_main_chars(game, data.main_chars_db, load_chars_promise_resolve);
    await load_chars_promise;

    //creating groups. Order here is important
    data.underlayer_group = game.add.group();
    data.npc_group = game.add.group();
    data.overlayer_group = game.add.group();

    //initialize screens
    data.menu_screen = initialize_menu(game, data);
    data.spacebar_input.add(() => {
        if (data.casting_psynergy || data.climbing || data.pushing || data.teleporting || data.jumping || data.in_battle) return;
        if (!data.menu_open) {
            data.menu_open = true;
            hero_control.stop_hero(data);
            hero_control.update_shadow(data);
            data.menu_screen.open_menu();
        } else if (data.menu_screen.is_active()) {
            data.menu_screen.close_menu();
        }
    }, this);

    //configuring map layers: creating sprites, listing events and setting the layers
    await maps[data.map_name].mount_map(game, data);
    hero_control.config_hero(data);
    physics.config_world_physics(game);
    physics.config_physics_for_hero(data);
    physics.config_physics_for_npcs(data);
    physics.config_physics_for_interactable_objects(data);
    data.dynamicEventsCollisionGroup = game.physics.p2.createCollisionGroup();
    physics.config_physics_for_map(data);
    physics.config_collisions(data);
    game.physics.p2.updateBoundsCollisionGroup();

    //activate debug mode
    game.input.keyboard.addKey(Phaser.Keyboard.D).onDown.add(toggle_debug.bind(this, data), this);
    
    //activate grid mode
    game.input.keyboard.addKey(Phaser.Keyboard.G).onDown.add(() => {
        data.grid = !data.grid;
    }, this);

    //activate keys debug mode
    game.input.keyboard.addKey(Phaser.Keyboard.K).onDown.add(() => {
        toggle_keys(data);
    }, this);

    //activate stats debug mode
    game.input.keyboard.addKey(Phaser.Keyboard.S).onDown.add(() => {
        toggle_stats(data);
    }, this);

    //enable fps show
    data.show_fps = false;
    game.input.keyboard.addKey(Phaser.Keyboard.F).onDown.add(function(){
        data.show_fps = !data.show_fps;
    }, this);

    //set initial zoom
    game.scale.setupScale(data.scale_factor * numbers.GAME_WIDTH, data.scale_factor * numbers.GAME_HEIGHT);
    window.dispatchEvent(new Event('resize'));

    //enable full screen
    game.scale.fullScreenScaleMode = Phaser.ScaleManager.SHOW_ALL;
    game.input.onTap.add(function(pointer, isDoubleClick) {  
        if (isDoubleClick) {
            game.scale.startFullScreen(true);
        }  
    });
    game.scale.onFullScreenChange.add(() => {
        data.fullscreen = !data.fullscreen;
        data.scale_factor = 1;
        game.scale.setupScale(numbers.GAME_WIDTH, numbers.GAME_HEIGHT);
        window.dispatchEvent(new Event('resize'));
    });

    //enable zoom
    game.input.keyboard.addKey(Phaser.Keyboard.ONE).onDown.add(function(){
        if (data.fullscreen) return;
        data.scale_factor = 1;
        game.scale.setupScale(numbers.GAME_WIDTH, numbers.GAME_HEIGHT);
        window.dispatchEvent(new Event('resize'));
    }, this);
    game.input.keyboard.addKey(Phaser.Keyboard.TWO).onDown.add(function(){
        if (data.fullscreen) return;
        data.scale_factor = 2;
        game.scale.setupScale(data.scale_factor * numbers.GAME_WIDTH, data.scale_factor * numbers.GAME_HEIGHT);
        window.dispatchEvent(new Event('resize'));
    }, this);
    game.input.keyboard.addKey(Phaser.Keyboard.THREE).onDown.add(function(){
        if (data.fullscreen) return;
        data.scale_factor = 3;
        game.scale.setupScale(data.scale_factor * numbers.GAME_WIDTH, data.scale_factor * numbers.GAME_HEIGHT);
        window.dispatchEvent(new Event('resize'));
    }, this);

    //enable psynergies shortcuts
    game.input.keyboard.addKey(Phaser.Keyboard.Q).onDown.add(function(){
        if (data.climbing || data.menu_open || data.pushing || data.teleporting || data.jumping || data.in_battle) return;
        field_abilities_list.move.cast(data.init_db.initial_shortcuts.move);
    }, this);
    game.input.keyboard.addKey(Phaser.Keyboard.W).onDown.add(function(){
        if (data.climbing || data.menu_open || data.pushing || data.teleporting || data.jumping || data.in_battle) return;
        field_abilities_list.frost.cast(data.init_db.initial_shortcuts.frost);
    }, this);
    game.input.keyboard.addKey(Phaser.Keyboard.E).onDown.add(function(){
        if (data.climbing || data.menu_open || data.pushing || data.teleporting || data.jumping || data.in_battle) return;
        field_abilities_list.growth.cast(data.init_db.initial_shortcuts.growth);
    }, this);

    //enable enter event
    data.enter_input.add(enter_key_event, this);

    //set keyboard cursors
    data.cursors = game.input.keyboard.createCursorKeys();

    data.created = true;
    game.camera.resetFX();
}

function update() {
    if (data.created) {
        if (!data.on_event && !data.npc_event && !data.pushing && !data.menu_open && !data.casting_psynergy && !data.in_battle) {
            data.hero_tile_pos_x = (data.hero.x/maps[data.map_name].sprite.tileWidth) | 0;
            data.hero_tile_pos_y = (data.hero.y/maps[data.map_name].sprite.tileHeight) | 0;

            if (data.waiting_to_step) { //step event
                do_step(data);
            }
            if (data.waiting_to_change_collision) { //change collision pattern layer event
                do_collision_change(data);
            }

            //check if the actual tile has an event
            const event_location_key = TileEvent.get_location_key(data.hero_tile_pos_x, data.hero_tile_pos_y);
            if (event_location_key in maps[data.map_name].events) {
                event_triggering(game, data, event_location_key);
            } else if (data.extra_speed !== 0) { //disabling speed event
                data.extra_speed = 0;
            }

            movement.update_arrow_inputs(data);
            movement.set_speed_factors(data);
            hero_control.set_current_action(data); //chooses which sprite the hero shall assume
            data.delta_time = game.time.elapsedMS/numbers.DELTA_TIME_FACTOR;
            movement.calculate_hero_speed(data);
            movement.collision_dealer(game, data);
            hero_control.change_hero_sprite(data);
            hero_control.update_shadow(data);

            data.map_collider.body.velocity.y = data.map_collider.body.velocity.x = 0; //fixes map body

            for (let i = 0; i < maps[data.map_name].npcs.length; ++i) { //updates npcs' movement
                let npc = maps[data.map_name].npcs[i];
                npc.update();
            }

            maps[data.map_name].sort_sprites(data);
        } else if (data.on_event) {
            if (data.climbing_event_data !== null) {
                climb.climb_event_animation_steps(data);
            }
            if (data.door_event_data !== null) {
                door_event_phases(data);
            }
            hero_control.stop_hero(data, false);
        } else if (data.npc_event) {
            set_npc_event(data);
            hero_control.stop_hero(data, false);
        } else if (data.pushing) {
            hero_control.change_hero_sprite(data);
        } else if (data.menu_open && data.menu_screen.horizontal_menu.menu_active) {
            hero_control.stop_hero(data, false);
            data.menu_screen.update_position();
        } else if (data.in_battle) {
            data.battle_instance.update();
        }
        ++data.frame_counter;
        if (data.frame_counter%numbers.TARGET_FPS === 0) {
            data.frame_counter = 0;
        }
    } else {
        render_loading();
    }
}

function render() {
    set_debug_info(game, data);
    if (data.frame_counter%8 === 0) {
        fill_key_debug_table(data);
    }
    if (data.frame_counter%(numbers.TARGET_FPS >> 1) === 0) {
        fill_stats_debug_table(data);
    }
}
