// deploy-commands.js
require('dotenv').config();
const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const commands = [
  new SlashCommandBuilder()
    .setName('상영일정')
    .setDescription('영화/애니 상영 정보를 등록합니다.')
    .toJSON(),
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

// 아래 값들을 본인의 값으로 수정하세요.
const clientId = '1335955619781279744'; // 봇의 애플리케이션 ID
const guildId = '1309705638162468935'; // 테스트용 서버(길드) ID

(async () => {
  try {
    console.log('슬래시 커맨드를 등록 중입니다...');
    await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      { body: commands }
    );
    console.log('슬래시 커맨드 등록 완료!');
  } catch (error) {
    console.error(error);
  }
})();