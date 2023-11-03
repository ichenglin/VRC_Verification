import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import VerificationCommand from "../templates/template_command";
import VerificationGuild from "../interactions/guild";
import CountryFlag from "../utilities/flag";

export default class RosterCommand extends VerificationCommand {

    public command_configuration(): SlashCommandBuilder {
        return new SlashCommandBuilder()
        .setName("roster")
        .setDescription("Generates an embed with all the teams in the guild.")
        .setDMPermission(false);
    }

    public async command_trigger(command_interaction: ChatInputCommandInteraction): Promise<void> {
        await command_interaction.deferReply();
        // get users
        const guild_teams = await VerificationGuild.teams_get(command_interaction.guild?.id as string);
        if (guild_teams.length <= 0) {
            // no registered user in guild
            const invalid_embed = new EmbedBuilder()
                .setTitle("⛔ Insufficient Members ⛔")
                .setDescription(`The command requires at least **one verified user** in **${command_interaction.guild?.name}** to display the guild roster! If you believe this is in error, please contact an administrator.`)
                .setColor("#ef4444");
            await command_interaction.editReply({embeds: [invalid_embed]});
            return;
        }
        // generate embed
        const roster_embed = new EmbedBuilder()
            .setTitle(`📙 ${command_interaction.guild?.name}'s Roster 📙`)
            .setDescription(`**${command_interaction.guild?.name}** had a total of **${guild_teams.length} registered teams**, below are the teams and their members.\n\u200B`)
            .addFields(
                ...guild_teams.sort((team_a, team_b) => team_a.team_number.localeCompare(team_b.team_number)).map((loop_team) => ({
                    name:  `${loop_team.team_number}`,
                    value: [
                        `\`${loop_team.team_data.team_name}\``,
                        `<:vrc_dot_blue:1135437387619639316> Country: ${CountryFlag.get_flag(loop_team.team_data.team_country)}`,
                        `<:vrc_dot_blue:1135437387619639316> Grade: \`${loop_team.team_data.team_grade}\``,
                        ...loop_team.team_users.map(loop_user => `<@${loop_user.user_id}>`)
                    ].join("\n"),
                    inline: true
                })))
            .setTimestamp()
            .setFooter({text: `requested by ${command_interaction.user.tag}`, iconURL: command_interaction.client.user.displayAvatarURL()})
            .setColor("#84cc16");
        await command_interaction.editReply({embeds: [roster_embed]});
    }

}