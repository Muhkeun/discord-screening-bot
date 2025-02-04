const fs = require('fs');
const path = require('path');

class CommandHandler {
  constructor(client) {
    this.client = client;
    this.commands = new Map();
  }

  async loadCommands() {
    const commandsPath = path.join(__dirname, '..', 'commands');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
      const filePath = path.join(commandsPath, file);
      const command = require(filePath);
      
      if ('data' in command && 'execute' in command) {
        this.commands.set(command.data.name, command);
      }
    }
  }

  async registerCommands(guildId = null) {
    try {
      const commands = Array.from(this.commands.values()).map(command => command.data.toJSON());
      
      if (guildId) {
        // 특정 서버에만 커맨드 등록
        await this.client.application.commands.set(commands, guildId);
        console.log(`Successfully registered commands for guild ${guildId}`);
      } else {
        // 모든 서버에 글로벌 커맨드 등록
        await this.client.application.commands.set(commands);
        console.log('Successfully registered global commands');
      }
    } catch (error) {
      console.error('Error registering commands:', error);
    }
  }

  getCommand(name) {
    return this.commands.get(name);
  }
}

module.exports = CommandHandler; 