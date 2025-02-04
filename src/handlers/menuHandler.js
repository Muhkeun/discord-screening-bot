const { ActionRowBuilder, UserSelectMenuBuilder, EmbedBuilder } = require('discord.js');
const screeningService = require('../services/screeningService');
const tmdbService = require('../services/tmdbService');
const { createScreeningEmbed } = require('../components/embeds');
const { createAttendanceButtons, createUtilityButtons, createTheaterButtons } = require('../components/buttons');
const { sendTemporaryMessage, editTemporaryMessage } = require('../utils/helpers');

async function handleTMDBSelect(interaction) {
  try {
    await interaction.deferUpdate();

    const uniqueId = interaction.customId.split('tmdbSelect_')[1];
    const screeningData = screeningService.getPendingScreening(uniqueId);
    
    if (!screeningData) {
      return interaction.editReply({ 
        content: '시간 초과되었습니다. 다시 시도해주세요.', 
        components: [] 
      });
    }

    screeningService.removePendingScreening(uniqueId);

    const selected = JSON.parse(interaction.values[0]);
    const details = await (selected.media_type === 'movie' ? 
      tmdbService.fetchTMDBMovieDetails(selected.id) : 
      tmdbService.fetchTMDBTVDetails(selected.id));

    const embed = createScreeningEmbed(details, screeningData);

    if (details.poster_path) {
      const posterURL = `https://image.tmdb.org/t/p/w780${details.poster_path}`;
      embed.setImage(posterURL);
    }

    const attendanceButtons = createAttendanceButtons(interaction.message.id);
    const utilityButtons = createUtilityButtons(interaction.message.id);
    const theaterButtons = createTheaterButtons(interaction.message.id);
    
    const hostSelectMenu = new UserSelectMenuBuilder()
      .setCustomId(`selectHost_${interaction.message.id}`)
      .setPlaceholder('상영 담당자 선택')
      .setMinValues(0)
      .setMaxValues(1);

    const attendanceRow = new ActionRowBuilder().addComponents(attendanceButtons);
    const utilityRow = new ActionRowBuilder().addComponents(utilityButtons);
    const theaterRow = new ActionRowBuilder().addComponents(theaterButtons);
    const hostRow = new ActionRowBuilder().addComponents(hostSelectMenu);

    const description = embed.data.description.replace(
      /\*\*상영 담당:\*\* .*\n/,
      `**상영 담당:** <@${interaction.user.id}>\n`
    );
    embed.setDescription(description);

    const message = await interaction.channel.send({
      embeds: [embed],
      components: [attendanceRow, utilityRow, theaterRow, hostRow]
    });

    const messageAttendees = screeningService.getAttendees(message.id);
    messageAttendees.host = interaction.user.id;
    screeningService.setHost(message.id, interaction.user.id);

    await interaction.editReply({ 
      content: '영화(애니) 정보가 공지되었습니다.', 
      components: [] 
    });

  } catch (error) {
    console.error('TMDB 선택 처리 중 오류:', error);
    await interaction.editReply({ 
      content: '메시지 전송 중 오류가 발생했습니다.', 
      components: [] 
    });
  }
}

async function handleHostSelect(interaction) {
  try {
    const messageId = interaction.message.id;
    const selectedUsers = interaction.values;
    const messageAttendees = screeningService.getAttendees(messageId);

    if (selectedUsers.length === 0) {
      messageAttendees.host = null;
    } else {
      messageAttendees.host = selectedUsers[0];
    }

    screeningService.setHost(messageId, messageAttendees.host);

    const embed = EmbedBuilder.from(interaction.message.embeds[0]);
    const description = embed.data.description.replace(
      /\*\*상영 담당:\*\* .*\n/,
      `**상영 담당:** ${messageAttendees.host ? `<@${messageAttendees.host}>` : '미정'}\n`
    );

    embed.setDescription(description);

    const attendanceButtons = createAttendanceButtons(messageId);
    const utilityButtons = createUtilityButtons(messageId);
    const hostSelectMenu = new UserSelectMenuBuilder()
      .setCustomId(`selectHost_${messageId}`)
      .setPlaceholder('상영 담당자 선택')
      .setMinValues(0)
      .setMaxValues(1);

    const attendanceRow = new ActionRowBuilder().addComponents(attendanceButtons);
    const utilityRow = new ActionRowBuilder().addComponents(utilityButtons);
    const hostRow = new ActionRowBuilder().addComponents(hostSelectMenu);

    await interaction.update({
      embeds: [embed],
      components: [attendanceRow, utilityRow, hostRow]
    });
  } catch (error) {
    console.error('상영 담당자 선택 처리 중 오류:', error);
    await interaction.reply({
      content: '상영 담당자 설정 중 오류가 발생했습니다.',
      ephemeral: true
    });
  }
}

async function handleMenu(interaction) {
  try {
    if (interaction.customId.startsWith('tmdbSelect_')) {
      await handleTMDBSelect(interaction);
    } else if (interaction.customId.startsWith('selectHost_')) {
      await handleHostSelect(interaction);
    }
  } catch (error) {
    console.error('메뉴 처리 중 오류:', error);
    const reply = {
      content: '메뉴 처리 중 오류가 발생했습니다.',
      ephemeral: true
    };
    
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply(reply);
    } else {
      await interaction.reply(reply);
    }
  }
}

module.exports = {
  handleMenu,
  handleTMDBSelect,
  handleHostSelect
}; 