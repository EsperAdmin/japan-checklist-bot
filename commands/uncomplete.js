const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('uncomplete')
        .setDescription('Mark an item as incomplete in your active trip')
        .addIntegerOption(option => option.setName('item_id').setDescription('Item ID').setRequired(true)),
    async execute(interaction, { trips, activeTrips }) {
        const itemId = interaction.options.getInteger('item_id');
        const userId = interaction.user.id;
        const activeTripEntry = await activeTrips.findOne({ userId });

        if (!activeTripEntry) {
            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('Error')
                .setDescription('No active trip set! Use `/active` to set one.');
            return await interaction.editReply({ embeds: [embed] });
        }

        const activeTrip = await trips.findOne({ tripId: activeTripEntry.tripId, users: userId });
        if (!activeTrip) {
            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('Error')
                .setDescription('Active trip not found or you don\'t have access!');
            return await interaction.editReply({ embeds: [embed] });
        }

        const items = activeTrip.items;
        const item = items.find(i => i.id === itemId);
        if (!item) {
            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('Error')
                .setDescription(`Item #${itemId} not found!`);
            return await interaction.editReply({ embeds: [embed] });
        }

        item.complete = false;
        await trips.updateOne({ tripId: activeTrip.tripId }, { $set: { items } });

        const embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('Item Uncompleted')
            .setDescription(`Marked item #${itemId} (**${item.name}**) as incomplete in **${activeTrip.name}**!`);
        await interaction.editReply({ embeds: [embed] });
    },
};