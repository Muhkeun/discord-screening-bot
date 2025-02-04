const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const screeningService = require('../services/screeningService');
const tmdbService = require('../services/tmdbService');
const { createScreeningEmbed } = require('../components/embeds');
const { generateRandomId, getRatingStars, sendTemporaryMessage } = require('../utils/helpers');
const { MessageFlags } = require('discord.js');

async function handleModal(interaction) {
  if (interaction.customId === 'screeningModal') {
    await handleScreeningModal(interaction);
  } else if (interaction.customId.startsWith('reviewModal_')) {
    await handleReviewModal(interaction);
  }
}

async function handleScreeningModal(interaction) {
  try {
    await interaction.deferReply();

    const title = interaction.fields.getTextInputValue('titleInput');
    const episode = interaction.fields.getTextInputValue('episodeInput');
    const screeningTime = interaction.fields.getTextInputValue('screeningTimeInput');

    // TMDB 검색
    const results = await tmdbService.searchTMDB(title);
    
    if (results.length === 0) {
      await interaction.editReply({
        content: '검색 결과가 없습니다. 제목을 다시 확인해주세요.',
        ephemeral: true
      });
      return;
    }

    // 검색 결과를 선택 메뉴로 표시
    const uniqueId = generateRandomId();
    
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId(`tmdbSelect_${uniqueId}`)
      .setPlaceholder('작품을 선택해주세요')
      .addOptions(
        results.slice(0, 25).map(item => ({
          label: (item.title || item.name).slice(0, 100),
          description: `${item.media_type === 'movie' ? '영화' : 'TV'} (${
            item.release_date || item.first_air_date || '날짜 없음'
          })`.slice(0, 100),
          value: JSON.stringify({
            id: item.id,
            media_type: item.media_type,
            title: item.title || item.name
          })
        }))
      );

    const row = new ActionRowBuilder().addComponents(selectMenu);

    // 검색 데이터 임시 저장
    screeningService.addPendingScreening(uniqueId, {
      screeningTime,
      episode: episode || null
    });

    await interaction.editReply({
      content: '아래 목록에서 해당하는 작품을 선택해주세요:',
      components: [row]
    });
  } catch (error) {
    console.error('상영 정보 모달 처리 중 오류:', error);
    await interaction.editReply({
      content: '상영 정보 처리 중 오류가 발생했습니다.',
      ephemeral: true
    });
  }
}

async function handleReviewModal(interaction) {
  try {
    const messageId = interaction.customId.split('_')[1];
    const rating = parseInt(interaction.fields.getTextInputValue('rating'));
    const comment = interaction.fields.getTextInputValue('comment');

    if (isNaN(rating) || rating < 1 || rating > 10) {
      await interaction.reply({
        content: '별점은 1부터 10 사이의 숫자여야 합니다.',
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    const reviews = screeningService.addReview(messageId, interaction.user.id, rating, comment);

    // 평균 평점 및 참여자 수 계산
    let totalRating = 0;
    reviews.forEach(review => {
      totalRating += review.rating;
    });
    const averageRating = totalRating / reviews.size;

    const message = await interaction.message.fetch();
    const embed = EmbedBuilder.from(message.embeds[0]);
    let description = embed.data.description || "";

    // 새로운 평점 섹션 포맷
    const ratingStars = getRatingStars(averageRating);
    const newRatingSection = 
      `### ⭐ 참여자 평가\n` +
      `**평균 별점:** ${averageRating.toFixed(1)}/10 (${reviews.size}명)\n` +
      `${ratingStars}`;

    // 기존 평가 섹션 업데이트 또는 추가
    if (description.includes("### ⭐ 참여자 평가")) {
      description = description.replace(/### ⭐ 참여자 평가\n[^#]+/g, `${newRatingSection}\n\n`);
    } else {
      const infoSection = "### ℹ️ 작품 정보";
      if (description.includes(infoSection)) {
        description = description.replace(infoSection, `${newRatingSection}\n\n${infoSection}`);
      } else {
        description += `\n\n${newRatingSection}`;
      }
    }

    embed.setDescription(description);

    await interaction.update({
      embeds: [embed],
      components: message.components
    });

  } catch (error) {
    console.error('한줄평 처리 중 오류:', error);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: '한줄평 등록 중 오류가 발생했습니다.',
        flags: MessageFlags.Ephemeral
      });
    }
  }
}

module.exports = {
  handleModal
}; 