const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('remove')
        .setDescription('Remove an item from your active trip')
        .addIntegerOption(option => option.setName('item_id').setDescription('Item ID').setRequired(true)),
    async execute(interaction, { trips, activeTrips }) {
        const itemId = interaction.options.getInteger('item_id');
        const userId = interaction.user.id;
        const activeTripEntry = await activeTrips.findOne({ userId });

        if (!activeTripEntry) {
            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('Error')
                .setDescription('No active trip set! Use `/active` to set one.')
                .setFooter({
                    text: 'Your Japan Travel Buddy!',
                    iconURL: interaction.client.user.displayAvatarURL()
                })
                .setTimestamp();
            return await interaction.editReply({ embeds: [embed] });
        }

        const activeTrip = await trips.findOne({ tripId: activeTripEntry.tripId, users: userId });
        if (!activeTrip) {
            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('Error')
                .setDescription('Active trip not found or you don\'t have access!')
                .setFooter({
                    text: 'Your Japan Travel Buddy!',
                    iconURL: interaction.client.user.displayAvatarURL()
                })
                .setTimestamp();
            return await interaction.editReply({ embeds: [embed] });
        }

        let items = activeTrip.items.filter(i => i.id !== itemId);
        if (items.length === activeTrip.items.length) {
            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('Error')
                .setDescription(`Item #${itemId} not found!`)
                .setFooter({
                    text: 'Your Japan Travel Buddy!',
                    iconURL: interaction.client.user.displayAvatarURL()
                })
                .setTimestamp();
            return await interaction.editReply({ embeds: [embed] });
        }

        items = items.map((item, index) => ({ ...item, id: index + 1 })); // Renumber
        await trips.updateOne({ tripId: activeTrip.tripId }, { $set: { items } });

        const embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('Item Removed')
            .setDescription(`Removed item #${itemId} from **${activeTrip.name}**!`)
            .setFooter({
                text: 'Your Japan Travel Buddy!',
                iconURL: interaction.client.user.displayAvatarURL()
            })
            .setTimestamp();
        await interaction.editReply({ embeds: [embed] });
    },
};