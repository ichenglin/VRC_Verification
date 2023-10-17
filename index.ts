import { ActivityType, Client, ClientUser, GatewayIntentBits, REST, Routes } from "discord.js";
import * as dotenv from "dotenv";
import * as FileSystem from "fs";
import mysql from "mysql";
import { createClient } from "redis";
import Logger from "./objects/logger";
import VerifyButton from "./commands/button_verify";
import AwardsCommand from "./commands/command_awards";
import NickCommand from "./commands/command_nick";
import VerifyCommand from "./commands/command_verify";
import VerifyModal from "./commands/modal_verify";
import InteractionCreateEvent from "./events/event_interaction_create";
import ReadyEvent from "./events/event_ready";
import Registry from "./objects/registry";
import SkillsCommand from "./commands/command_skills";
import HelpButton from "./commands/button_help";
import RosterCommand from "./commands/command_roster";

dotenv.config();

export const verification_database = mysql.createConnection({
    host:     process.env.MYSQL_HOST,
    user:     process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    ssl: {
        ca: FileSystem.readFileSync(process.env.MYSQL_SSL as string),
        rejectUnauthorized: false
    }
});
export const verification_cache = createClient({password: process.env.REDIS_PASSWORD});

// registry
export const verification_registry = new Registry();
verification_registry.register(new VerifyCommand);
verification_registry.register(new NickCommand);
verification_registry.register(new AwardsCommand);
verification_registry.register(new SkillsCommand);
verification_registry.register(new RosterCommand);
verification_registry.register(new VerifyButton);
verification_registry.register(new HelpButton);
verification_registry.register(new VerifyModal);
verification_registry.register(new ReadyEvent);
verification_registry.register(new InteractionCreateEvent);

// rest
const discord_rest = new REST({version: "10"}).setToken(process.env.APPLICATION_TOKEN as string);

// client
const discord_client = new Client({intents: [GatewayIntentBits.Guilds]});
for (const event_signature of verification_registry.event_signatures()) discord_client.on(event_signature.event_configuration().name, async (...args) => await event_signature.event_trigger(...args));

verification_cache.on("error", error => Logger.send_log("Cache login error."));

(async () => {
    verification_database.connect(() => Logger.send_log("Database Connected."));
    await verification_cache.connect();

    await discord_rest.put(Routes.applicationCommands(process.env.APPLICATION_ID as string), {body: verification_registry.command_signatures()});
    await discord_client.login(process.env.APPLICATION_TOKEN as string);
    (discord_client.user as ClientUser).setPresence({
        status: "online",
        activities: [{
            name: "Vex Robotics",
            type: ActivityType.Playing,
        }]
    });
})();