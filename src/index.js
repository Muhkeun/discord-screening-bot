const { Client, GatewayIntentBits } = require('discord.js');
const config = require('./config/config');
const CommandHandler = require('./handlers/commandHandler');
const { handleButton } = require('./handlers/buttonHandler');
const { handleModal } = require('./handlers/modalHandler');
const { handleMenu } = require('./handlers/menuHandler');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// 커맨드 핸들러 초기화
const commandHandler = new CommandHandler(client);

client.once('ready', async () => {
  try {
    // 커맨드 로드
    await commandHandler.loadCommands();
    // 글로벌 커맨드 등록
    await commandHandler.registerCommands();
    console.log('Bot is ready!');
  } catch (error) {
    console.error('Error during initialization:', error);
  }
});

// 새로운 서버에 초대됐을 때
client.on('guildCreate', async (guild) => {
  try {
    await commandHandler.registerCommands(guild.id);
    console.log(`Joined new guild: ${guild.name} (${guild.id})`);
  } catch (error) {
    console.error(`Error registering commands for guild ${guild.id}:`, error);
  }
});

client.on('interactionCreate', async interaction => {
  try {
    if (interaction.isChatInputCommand()) {
      const command = commandHandler.getCommand(interaction.commandName);
      if (!command) return;
      await command.execute(interaction);
    } else if (interaction.isButton()) {
      await handleButton(interaction);
    } else if (interaction.isModalSubmit()) {
      await handleModal(interaction);
    } else if (interaction.isStringSelectMenu() || interaction.isUserSelectMenu()) {
      await handleMenu(interaction);
    }
  } catch (error) {
    console.error('Error handling interaction:', error);
    try {
      const reply = {
        content: '오류가 발생했습니다. 다시 시도해주세요.',
        ephemeral: true
      };
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply(reply);
      } else {
        await interaction.reply(reply);
      }
    } catch (e) {
      console.error('Error sending error message:', e);
    }
  }
});

client.login(config.DISCORD_TOKEN); 