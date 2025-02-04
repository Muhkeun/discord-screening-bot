const { ChannelType, EmbedBuilder, ActionRowBuilder, UserSelectMenuBuilder } = require('discord.js');
const { createAttendanceButtons, createUtilityButtons, createTheaterButtons } = require('../components/buttons');

class TheaterService {
  constructor() {
    this.theaters = new Map(); // guildId -> theaters count
    this.activeTheaters = new Map(); // channelId -> { guildId, number, title, createdAt, channelId }
  }

  async createTheater(guild, title) {
    try {
      // 카테고리 찾기 또는 생성
      let category = guild.channels.cache.find(
        channel => channel.type === ChannelType.GuildCategory && channel.name === '상영관'
      );
      
      if (!category) {
        category = await guild.channels.create({
          name: '상영관',
          type: ChannelType.GuildCategory
        });
      }

      // 현재 상영관 번호 가져오기
      const currentCount = this.theaters.get(guild.id) || 0;
      const newNumber = currentCount + 1;
      
      // 음성 채널 생성
      const channel = await guild.channels.create({
        name: `${newNumber}관 ${title}`,
        type: ChannelType.GuildVoice,
        parent: category,
        userLimit: 10 // 최대 인원 설정
      });

      // 상태 업데이트
      this.theaters.set(guild.id, newNumber);
      this.activeTheaters.set(channel.id, {
        guildId: guild.id,
        channelId: channel.id,  // channelId 추가
        number: newNumber,
        title,
        createdAt: Date.now()
      });

      return channel;
    } catch (error) {
      console.error('상영관 생성 중 오류:', error);
      throw error;
    }
  }

  async cleanupTheater(channel) {
    try {
      const theaterInfo = this.activeTheaters.get(channel.id);
      if (!theaterInfo) return false;

      // 채널 삭제
      await channel.delete();
      
      // 상태 업데이트
      this.activeTheaters.delete(channel.id);
      
      // 남은 상영관 번호 재정렬
      const guildTheaters = Array.from(this.activeTheaters.values())
        .filter(t => t.guildId === theaterInfo.guildId)
        .sort((a, b) => a.createdAt - b.createdAt);
      
      // 번호 재할당 및 채널 이름 업데이트
      for (const [index, theater] of guildTheaters.entries()) {
        theater.number = index + 1;
        const channel = await channel.guild.channels.fetch(theater.channelId);
        if (channel) {
          await channel.setName(`${theater.number}관 ${theater.title}`);
        }
      }
      
      this.theaters.set(theaterInfo.guildId, guildTheaters.length);

      return true;
    } catch (error) {
      console.error('상영관 정리 중 오류:', error);
      throw error;
    }
  }

  getActiveTheaters(guildId) {
    return Array.from(this.activeTheaters.values())
      .filter(theater => theater.guildId === guildId)
      .sort((a, b) => a.number - b.number);
  }

  getTheaterByTitle(guildId, title) {
    return Array.from(this.activeTheaters.values())
      .find(theater => theater.guildId === guildId && theater.title === title);
  }

  isTheaterExists(guildId, title) {
    return Array.from(this.activeTheaters.values())
      .some(theater => theater.guildId === guildId && theater.title === title);
  }

  async updateTheaterButtons(message, theater = null) {
    try {
      const embed = EmbedBuilder.from(message.embeds[0]);
      const attendanceButtons = createAttendanceButtons(message.id);
      const utilityButtons = createUtilityButtons(message.id);
      const theaterButtons = createTheaterButtons(message.id, !!theater);
      const hostSelectMenu = new UserSelectMenuBuilder()
        .setCustomId(`selectHost_${message.id}`)
        .setPlaceholder('상영 담당자 선택')
        .setMinValues(0)
        .setMaxValues(1);

      const attendanceRow = new ActionRowBuilder().addComponents(attendanceButtons);
      const utilityRow = new ActionRowBuilder().addComponents(utilityButtons);
      const theaterRow = new ActionRowBuilder().addComponents(theaterButtons);
      const hostRow = new ActionRowBuilder().addComponents(hostSelectMenu);

      await message.edit({
        embeds: [embed],
        components: [attendanceRow, utilityRow, theaterRow, hostRow]
      });
    } catch (error) {
      console.error('상영관 버튼 업데이트 중 오류:', error);
      throw error;
    }
  }

  hasPermission(interaction, messageAttendees) {
    const member = interaction.member;
    const isAdmin = member.permissions.has('Administrator');
    const isHost = messageAttendees.host === member.id;
    return isAdmin || isHost;
  }
}

module.exports = new TheaterService(); 