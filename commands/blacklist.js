const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('blacklist')
        .setDescription('Manage the bot blacklist (owner only)')
        .addStringOption(option => option.setName('action').setDescription('Action: add or remove').setRequired(true))
        .addUserOption(option => option.setName('user').setDescription('User to add/remove').setRequired(true)),
    async execute(interaction, { blacklist }) {
        const ownerId = process.env.BOT_OWNER_ID;
        if (interaction.user.id !== ownerId) {
            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('Error')
                .setDescription('This command is restricted to the bot owner!');
            return await interaction.editReply({ embeds: [embed] });
        }

        const action = interaction.options.getString('action').toLowerCase();
        const user = interaction.options.getUser('user');

        if (action === 'add') {
            if (await blacklist.findOne({ userId: user.id })) {
                const embed = new EmbedBuilder()
                    .setColor('#FFA500')
                    .setTitle('Warning')
                    .setDescription(`<@${user.id}> is already blacklisted!`);
                return await interaction.editReply({ embeds: [embed] });
            }
            await blacklist.insertOne({ userId: user.id });
            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('User Blacklisted')
                .setDescription(`<@${user.id}> (ID: ${user.id}) has been added to the blacklist!`);
            await interaction.editReply({ embeds: [embed] });
        } else if (action === 'remove') {
            if (!await blacklist.findOne({ userId: user.id })) {
                const embed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('Error')
                    .setDescription(`<@${user.id}> is not blacklisted!`);
                return await interaction.editReply({ embeds: [embed] });
            }
            await blacklist.deleteOne({ userId: user.id });
            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('User Removed from Blacklist')
                .setDescription(`<@${user.id}> (ID: ${user.id}) has been removed from the blacklist!`);
            await interaction.editReply({ embeds: [embed] });
        } else {
            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('Error')
                .setDescription('Invalid action! Use: add or remove.');
            await interaction.editReply({ embeds: [embed] });
        }
    },
};