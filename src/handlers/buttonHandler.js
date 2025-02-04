const { EmbedBuilder, ActionRowBuilder, UserSelectMenuBuilder } = require('discord.js');
const { createReviewModal } = require('../components/modals');
const { createReviewsEmbed } = require('../components/embeds');
const { createAttendanceButtons, createUtilityButtons, createTheaterButtons } = require('../components/buttons');
const screeningService = require('../services/screeningService');
const { sendTemporaryMessage, editTemporaryMessage, getRatingStars } = require('../utils/helpers');
const theaterService = require('../services/theaterService');
const { EMOJIS } = require('../utils/constants');
const { MessageFlags } = require('discord.js');

async function handleButton(interaction) {
  try {
    const [action, messageId] = interaction.customId.split('_');

    switch (action) {
      case 'attend':
      case 'maybe':
      case 'notAttend':
        await handleAttendanceButton(interaction, action);
        break;
      case 'showAttendees':
        await handleShowAttendees(interaction, messageId);
        break;
      case 'review':
        await handleReviewButton(interaction, messageId, interaction.user.id);
        break;
      case 'showReviews':
        await handleShowReviews(interaction, messageId);
        break;
      case 'createTheater':
        await handleCreateTheater(interaction, messageId);
        break;
      case 'endTheater':
        await handleEndTheater(interaction, messageId);
        break;
    }
  } catch (error) {
    console.error('버튼 핸들링 중 오류:', error);
    await sendTemporaryMessage(
      interaction,
      '버튼 처리 중 오류가 발생했습니다.',
      5000
    );
  }
}

async function handleAttendanceButton(interaction, status) {
  try {
    const messageId = interaction.message.id;
    const userId = interaction.user.id;

    // 상태에 따른 매핑
    const statusMap = {
      'attend': 'attend',
      'maybe': 'maybe',
      'notAttend': 'notAttend'
    };

    // screeningService를 통해 참석자 정보 업데이트
    const messageAttendees = screeningService.getAttendees(messageId);
    if (!messageAttendees) {
      screeningService.initializeAttendees(messageId);
    }
    
    const updatedAttendees = screeningService.addAttendee(messageId, userId, statusMap[status]);

    // 임베드 업데이트
    const message = await interaction.message.fetch();
    const embed = EmbedBuilder.from(message.embeds[0]);
    let description = embed.data.description;
    
    // 참석 현황 라인 업데이트
    const attendCount = updatedAttendees.attend.size;
    const maybeCount = updatedAttendees.maybe.size;
    const notAttendCount = updatedAttendees.notAttend.size;
    
    description = description.replace(
      /참석: \d+명 \| 미정: \d+명 \| 불참: \d+명/,
      `참석: ${attendCount}명 | 미정: ${maybeCount}명 | 불참: ${notAttendCount}명`
    );
    
    embed.setDescription(description);

    // 기존 컴포넌트들을 모두 유지하면서 업데이트
    const allComponents = [];
    message.components.forEach(row => {
      const newRow = {
        type: row.type,
        components: row.components.map(component => ({
          type: component.type,
          customId: component.customId,
          label: component.label,
          style: component.style,
          emoji: component.emoji
        }))
      };
      allComponents.push(newRow);
    });

    // 임베드와 모든 컴포넌트 업데이트
    await interaction.update({
      embeds: [embed],
      components: allComponents
    });

  } catch (error) {
    console.error('참석 상태 업데이트 중 오류:', error);
    await interaction.reply({
      content: '참석 상태 업데이트 중 오류가 발생했습니다.',
      flags: MessageFlags.Ephemeral
    });
  }
}

async function handleShowAttendees(interaction, messageId) {
  try {
    const messageAttendees = screeningService.getAttendees(messageId);
    
    if (!messageAttendees) {
      await interaction.reply({
        content: '참석자 정보를 찾을 수 없습니다.',
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle('📊 참석 현황')
      .setColor(0x2B2D31)
      .setDescription(
        `### 🎯 상영 담당자\n` +
        `${messageAttendees.host ? `<@${messageAttendees.host}>` : '미정'}\n\n` +
        `### 👥 참여자 목록`
      )
      .addFields([
        {
          name: `${EMOJIS.ATTEND} 참석 (${messageAttendees.attend.size}명)`,
          value: messageAttendees.attend.size > 0 
            ? Array.from(messageAttendees.attend).map(id => `<@${id}>`).join('\n')
            : '없음',
          inline: true
        },
        {
          name: `${EMOJIS.MAYBE} 미정 (${messageAttendees.maybe.size}명)`,
          value: messageAttendees.maybe.size > 0
            ? Array.from(messageAttendees.maybe).map(id => `<@${id}>`).join('\n')
            : '없음',
          inline: true
        },
        {
          name: `${EMOJIS.NOT_ATTEND} 불참 (${messageAttendees.notAttend.size}명)`,
          value: messageAttendees.notAttend.size > 0
            ? Array.from(messageAttendees.notAttend).map(id => `<@${id}>`).join('\n')
            : '없음',
          inline: true
        }
      ])
      .setFooter({ 
        text: '30초 후 자동으로 닫힙니다' 
      })
      .setTimestamp();

    await interaction.reply({
      embeds: [embed],
      flags: MessageFlags.Ephemeral
    });

  } catch (error) {
    console.error('참석자 목록 표시 중 오류:', error);
    await interaction.reply({
      content: '참석자 목록을 불러오는 중 오류가 발생했습니다.',
      flags: MessageFlags.Ephemeral
    });
  }
}

async function handleReviewButton(interaction, messageId, userId) {
  const reviews = screeningService.getReviews(messageId);
  const existingReview = reviews.get(userId);
  const modal = createReviewModal(messageId, existingReview);
  await interaction.showModal(modal);
}

async function handleShowReviews(interaction, messageId) {
  try {
    const reviews = screeningService.getReviews(messageId);

    if (!reviews || reviews.size === 0) {
      await interaction.reply({
        content: '아직 작성된 한줄평이 없습니다.',
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    const totalRating = Array.from(reviews.values()).reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.size;
    const ratingStars = getRatingStars(averageRating);

    const embed = new EmbedBuilder()
      .setTitle('✨ 한줄평')
      .setDescription(
        `### 📊 전체 평점\n` +
        `${ratingStars}\n` +
        `평균 ${averageRating.toFixed(1)}/10 · 총 ${reviews.size}개의 평가\n\n` +
        `### 💭 개별 평가`
      )
      .setColor(0x2B2D31)
      .addFields(
        Array.from(reviews.entries()).map(([userId, review]) => ({
          name: '\u200B',
          value: `> ${getRatingStars(review.rating)}  **${review.rating}/10**\n` +
                 `> ${review.comment}\n` +
                 `<@${userId}>\n`,
          inline: false
        }))
      );

    await interaction.reply({
      embeds: [embed],
      flags: MessageFlags.Ephemeral
    });
  } catch (error) {
    console.error('한줄평 목록 표시 중 오류:', error);
    await interaction.reply({
      content: '한줄평 목록을 불러오는 중 오류가 발생했습니다.',
      flags: MessageFlags.Ephemeral
    });
  }
}

async function updateAttendanceEmbed(message, messageAttendees) {
  const embed = EmbedBuilder.from(message.embeds[0]);
  let description = embed.data.description || "";
  
  // 참석, 미정, 불참 인원 계산
  const attendCount = messageAttendees.attend.size;
  const maybeCount = messageAttendees.maybe.size;
  const notAttendCount = messageAttendees.notAttend.size;
  
  // description을 줄 단위로 쪼갭니다.
  let lines = description.split('\n');
  
  // "참석:"으로 시작하는 줄을 찾아 업데이트합니다.
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith("참석:")) {
      // UI에 맞게 한 줄에 모두 표시합니다.
      lines[i] = `참석: ${attendCount}명 | 미정: ${maybeCount}명 | 불참: ${notAttendCount}명`;
      break;
    }
  }
  
  description = lines.join('\n');
  embed.setDescription(description);
  
  // 버튼 등 다른 컴포넌트는 기존 코드대로 업데이트합니다.
  const attendanceButtons = createAttendanceButtons(message.id);
  const utilityButtons = createUtilityButtons(message.id);
  const title = embed.data.title.replace('🎬 ', '');
  const theaterButtons = createTheaterButtons(message.id, theaterService.isTheaterExists(message.guild.id, title));
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
}

async function handleCreateTheater(interaction, messageId) {
  try {
    await interaction.deferReply({ ephemeral: true });
    
    const embed = interaction.message.embeds[0];
    const title = embed.title.replace('🎬 ', '');
    
    // 권한 확인
    const messageAttendees = screeningService.getAttendees(messageId);
    if (!theaterService.hasPermission(interaction, messageAttendees)) {
      await editTemporaryMessage(
        interaction,
        '상영관 생성은 상영 담당자와 서버 관리자만 가능합니다.',
        5000
      );
      return;
    }

    // 이미 상영관이 있는지 확인
    if (theaterService.isTheaterExists(interaction.guild.id, title)) {
      await editTemporaryMessage(
        interaction,
        '이미 해당 영화의 상영관이 존재합니다.',
        5000
      );
      return;
    }
    
    const channel = await theaterService.createTheater(interaction.guild, title);
    
    // 버튼 상태 업데이트
    await theaterService.updateTheaterButtons(interaction.message, channel);
    
    await editTemporaryMessage(
      interaction,
      `🎬 상영관이 생성되었습니다: ${channel.name}`,
      5000
    );
  } catch (error) {
    console.error('상영관 생성 중 오류:', error);
    await editTemporaryMessage(
      interaction,
      '상영관 생성 중 오류가 발생했습니다.',
      5000
    );
  }
}

async function handleEndTheater(interaction, messageId) {
  try {
    await interaction.deferReply({ ephemeral: true });
    
    const embed = interaction.message.embeds[0];
    const title = embed.title.replace('🎬 ', '');
    
    // 권한 확인
    const messageAttendees = screeningService.getAttendees(messageId);
    if (!theaterService.hasPermission(interaction, messageAttendees)) {
      await editTemporaryMessage(
        interaction,
        '상영 종료는 상영 담당자와 서버 관리자만 가능합니다.',
        5000
      );
      return;
    }
    
    const theater = theaterService.getTheaterByTitle(interaction.guild.id, title);
    
    if (!theater) {
      await editTemporaryMessage(
        interaction,
        '해당 영화의 상영관을 찾을 수 없습니다.',
        5000
      );
      return;
    }
    
    const channel = await interaction.guild.channels.fetch(theater.channelId);
    if (!channel) {
      await editTemporaryMessage(
        interaction,
        '상영관 채널을 찾을 수 없습니다.',
        5000
      );
      return;
    }
    
    await theaterService.cleanupTheater(channel);
    
    // 버튼 상태 업데이트
    await theaterService.updateTheaterButtons(interaction.message);
    
    await editTemporaryMessage(
      interaction,
      `🔚 상영관이 정리되었습니다: ${channel.name}`,
      5000
    );
  } catch (error) {
    console.error('상영관 정리 중 오류:', error);
    await editTemporaryMessage(
      interaction,
      '상영관 정리 중 오류가 발생했습니다.',
      5000
    );
  }
}

module.exports = {
  handleButton,
  updateAttendanceEmbed
}; 