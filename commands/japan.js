const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
require('dotenv').config();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('japan')
        .setDescription('Get a random image of Japan'),
    async execute(interaction) {
        try {
            const response = await axios.get('https://api.unsplash.com/photos/random', {
                params: { query: 'japan', orientation: 'landscape' },
                headers: { Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}` }
            });

            const imageUrl = response.data.urls.regular;
            const photographer = response.data.user.name;

            const embed = new EmbedBuilder()
                .setColor('#FF4500') // Orange-red for a Japanese aesthetic
                .setTitle('Random Japan Image')
                .setImage(imageUrl)
                .setFooter({ text: `Photo by ${photographer} on Unsplash` })
                .setTimestamp();
            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('Error')
                .setDescription('Failed to fetch a Japan image. Try again later!')
                .setFooter({
                    text: 'Your Japan Travel Buddy!',
                    iconURL: interaction.client.user.displayAvatarURL()
                })
                .setTimestamp();
            await interaction.editReply({ embeds: [embed] });
        }
    },
};