const { SlashCommandBuilder } = require('discord.js');
const { createScreeningModal } = require('../components/modals');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('상영일정')
    .setDescription('영화/애니 상영 정보를 등록합니다.'),
  
  async execute(interaction) {
    const modal = createScreeningModal();
    await interaction.showModal(modal);
  }
}; 